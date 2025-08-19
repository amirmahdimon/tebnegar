import uuid
from pydantic import BaseModel
from datetime import datetime

class ConversationAdminView(BaseModel):
    """Detailed conversation view for admins to review transcripts."""
    id: uuid.UUID
    session_id: uuid.UUID
    title: str
    created_at: datetime
    message_count: int
    # You could add the full message list here if needed

    class Config:
        from_attributes = True