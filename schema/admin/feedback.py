import uuid
from datetime import datetime

from schema.feedback import FeedbackCreate # Re-use existing schemas where possible

class FeedbackAdminView(FeedbackCreate):
    """Detailed feedback view for admins, including related message content."""
    id: uuid.UUID
    message_id: uuid.UUID
    message_content: str
    created_at: datetime

    class Config:
        from_attributes = True