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

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(http_bearer),db: Session = Depends(get_db)) -> User:
    """
    Validates JWT from Authorization: Bearer <token>
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SETTINGS.SECRET_KEY, algorithms=[SETTINGS.ALGORITHM])
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    sub = payload.get("sub")
    if (not sub) or (not isinstance(sub,dict)) or not sub.get("id"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JWT Token")

    user_id = sub["id"]
    user = user_repository.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return user
