from db.session import get_db
from fastapi import  HTTPException, Security
from fastapi.security import APIKeyHeader
from starlette import status
from config.settings import SETTINGS

# Define the API Key security scheme
api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)

async def get_admin_api_key(api_key: str = Security(api_key_header)):
    """
    Dependency to validate the admin API key.
    In a real app, use a secure comparison method and load keys from a vault.
    """
    if api_key == SETTINGS.ADMIN_API_KEY:
        return api_key
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )