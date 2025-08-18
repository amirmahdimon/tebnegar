from pydantic import BaseModel, Field

class SurveyRequest(BaseModel):
    session_id: str
    rating: int = Field(..., ge=1, le=5) # Rating must be between 1 and 5
    comment: str | None = None

class SurveyResponse(BaseModel):
    message: str