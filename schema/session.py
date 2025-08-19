import uuid
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, Dict, Any

class SessionCreate(BaseModel):
    landing_page_url: Optional[HttpUrl] = None
    referrer_url: Optional[HttpUrl] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_term: Optional[str] = None
    utm_content: Optional[str] = None
    client_metadata: Optional[Dict[str, Any]] = None

class SessionInDB(BaseModel):
    id: uuid.UUID
    
    class Config:
        from_attributes = True

class NewSessionResponse(BaseModel):
    session_id: uuid.UUID
    conversation_id: uuid.UUID