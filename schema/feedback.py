from pydantic import BaseModel, Field
from typing import Optional

class FeedbackCreate(BaseModel):
    rating: int = Field(..., description="1 for good, -1 for bad")
    would_pay: Optional[bool] = None
    comment: Optional[str] = Field(None, max_length=2000)

class FeedbackResponse(BaseModel):
    message: str = "Feedback received. Thank you!"