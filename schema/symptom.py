from pydantic import BaseModel
import uuid

class SymptomCheckRequest(BaseModel):
    session_id: str
    symptoms: str

class SymptomCheckResponse(BaseModel):
    session_id: str
    assessment: str
    log_id: uuid.UUID