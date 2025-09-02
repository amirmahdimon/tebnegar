from __future__ import annotations
from datetime import datetime, timedelta, timezone
from typing import Optional
import secrets

from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session

from google_auth_oauthlib.flow import Flow
from google.oauth2 import id_token as google_id_token
from google.auth.transport.requests import Request as GoogleRequest
import google.auth.exceptions as google_exceptions

import jwt

from dependency.dependencies import get_db
from config.settings import SETTINGS
from repository import user as user_repo
from schema.user import UserCreate

router = APIRouter(tags=["auth"])

# ---- OAuth / OIDC constants ----
GOOGLE_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]

VALID_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}

# ---- In-memory session store for demo (replace with DB/Redis in prod) ----
SESSION_STORE: dict[str, str] = {}  # maps state -> session_id/user_id

# ---- Helpers ----
def _build_flow(redirect_uri: Optional[str] = None) -> Flow:
    return Flow.from_client_config(
        client_config={
            "web": {
                "client_id": SETTINGS.GOOGLE_CLIENT_ID,
                "client_secret": SETTINGS.GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=GOOGLE_SCOPES,
        redirect_uri=redirect_uri or SETTINGS.GOOGLE_REDIRECT_URI,
    )


def _create_jwt_token(*, subject: str, expires_in_minutes: int | None = None) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=expires_in_minutes or SETTINGS.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "nbf": int(now.timestamp()),
        "exp": int(exp.timestamp()),
    }
    return jwt.encode(payload, SETTINGS.SECRET_KEY, algorithm=SETTINGS.ALGORITHM)


def _verify_google_id_token(id_token_str: str) -> dict:
    try:
        info = google_id_token.verify_oauth2_token(
            id_token_str,
            GoogleRequest(),
            SETTINGS.GOOGLE_CLIENT_ID,
        )
    except (ValueError, google_exceptions.GoogleAuthError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google ID token: {e}")

    iss = info.get("iss")
    if iss not in VALID_ISSUERS:
        raise HTTPException(status_code=400, detail="Invalid token issuer")

    aud = info.get("aud")
    if aud != SETTINGS.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=400, detail="Invalid token audience")

    email = info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")

    if not info.get("email_verified", False):
        raise HTTPException(status_code=400, detail="Email is not verified by Google")

    return info


# ---- Routes ----
@router.get("/url")
def get_google_auth_url(session_id: str = Query(..., embed=True)):
    """
    Generate Google OAuth authorization URL with state for CSRF protection.
    session_id: identifier for the user's session (could be cookie/session)
    """
    flow = _build_flow()

    state = secrets.token_urlsafe(16)
    # Store state linked to session_id      
    SESSION_STORE[state] = session_id

    authorization_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=state,
    )
    return {"url": authorization_url, "state": state}


@router.post("/callback")
def google_callback(
    code: str = Body(..., embed=True),
    state: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):          
    """
    Exchange code for tokens, verify state + ID token, upsert user, return JWT.
    """
    # Validate state
    session_id = SESSION_STORE.pop(state, None)
    if not session_id:
        raise HTTPException(status_code=400, detail="Invalid or expired state parameter")

    flow = _build_flow()
    try:
        flow.fetch_token(code=code)
        creds = flow.credentials

        if not creds.id_token: # type: ignore
            raise HTTPException(status_code=400, detail="No ID token returned by Google")

        id_info = _verify_google_id_token(creds.id_token) # type: ignore

        google_id = id_info.get("sub")
        email = id_info["email"]
        full_name = id_info.get("name")
        picture_url = id_info.get("picture")

        # Upsert user
        user = user_repo.user.get_by_email(db, email=email)
        if not user:
            user = user_repo.user.create(
                db,
                obj_in=UserCreate(
                    google_id=google_id, # type: ignore
                    email=email,
                    full_name=full_name,
                    picture_url=picture_url,
                ),
            )

        access_token = _create_jwt_token(subject=str(user.email))

        resp = {
            "jwt_token": access_token,
            "token_type": "bearer",
        }

        return resp

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Authentication failed")

