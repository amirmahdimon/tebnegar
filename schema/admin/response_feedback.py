import uuid
from datetime import datetime

from schema.response_feedback import ResponseFeedbackCreate

class ResponseFeedbackAdminView(ResponseFeedbackCreate):
    """Detailed feedback view for admins, including related message content."""
    id: uuid.UUID
    message_id: uuid.UUID
    message_content: str
    created_at: datetime

    class Config:
        from_attributes = True