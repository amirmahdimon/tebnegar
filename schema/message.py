import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from db.model.message import SenderType

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)

class MessageInDB(BaseModel):
    id: uuid.UUID
    sender_type: SenderType
    content: str
    created_at: datetime

    class Config:
        orm_mode = True

class AIResponseMessage(MessageInDB):
    # The frontend needs the message_id to submit feedback
    pass