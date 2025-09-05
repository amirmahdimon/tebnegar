from fastapi import Depends, HTTPException, Security
from fastapi.security import APIKeyHeader, HTTPBearer, HTTPAuthorizationCredentials
from starlette import status
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from pydantic import ValidationError

from db.session import get_db
from config.settings import SETTINGS
from db.model.user import User
from repository.user import user as user_repository
from pydantic import BaseModel, ValidationError

api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)

async def get_admin_api_key(api_key: str = Security(api_key_header)):
    """
    Validates the admin API key.
    """
    if api_key == SETTINGS.ADMIN_API_KEY:
        return api_key
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Could not validate admin API key",
    )

http_bearer = HTTPBearer(auto_error=False)

# Pydantic schema for validating the token's payload
class TokenPayload(BaseModel):
    id: int
    email: str

# Reusable security scheme
http_bearer = HTTPBearer()

def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Security(http_bearer),
    db: Session = Depends(get_db)
) -> User | None:
    """
    If a valid JWT is provided, return the user. Otherwise, return None.
    This allows endpoints to work for both anonymous and authenticated users.
    """
    if not credentials:
        # No 'Authorization' header was found. This is an anonymous user.
        return None
    
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token, SETTINGS.SECRET_KEY, algorithms=[SETTINGS.ALGORITHM]
        )
        token_data = TokenPayload(id=payload.get("sub").get("id"),email=payload.get("sub").get("email"))  # type: ignore
    except (JWTError, ValidationError):
        # A token was provided, but it's invalid. This is an error.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = user_repository.get(db, id=token_data.id)
    if not user:
        # The token is valid, but the user doesn't exist. This is also an error.
        raise HTTPException(status_code=401, detail="User not found for token")
    
    return user