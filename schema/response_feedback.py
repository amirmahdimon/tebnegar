from pydantic import BaseModel, Field
from typing import Optional
from db.model.response_feedback import FeedbackType

class ResponseFeedbackCreate(BaseModel):
    feedback_type: FeedbackType
    comment: Optional[str] = Field(None, max_length=2000)

class ResponseFeedbackResponse(BaseModel):
    message: str = "Feedback received. Thank you!"