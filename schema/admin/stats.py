
from pydantic import BaseModel
from typing import  Optional

class StatsResponse(BaseModel):
    """High-level KPIs for the admin dashboard."""
    total_sessions: int
    total_conversations: int
    total_messages: int
    avg_rating: Optional[float]
    positive_feedback_count: int
    negative_feedback_count: int