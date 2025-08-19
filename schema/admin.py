# schema/admin.py

import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

from .feedback import FeedbackCreate # Re-use existing schemas where possible

class StatsResponse(BaseModel):
    """High-level KPIs for the admin dashboard."""
    total_sessions: int
    total_conversations: int
    total_messages: int
    avg_rating: Optional[float]
    positive_feedback_count: int
    negative_feedback_count: int

class FeedbackAdminView(FeedbackCreate):
    """Detailed feedback view for admins, including related message content."""
    id: uuid.UUID
    message_id: uuid.UUID
    message_content: str
    created_at: datetime

    class Config:
        from_attributes = True

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