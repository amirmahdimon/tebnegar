import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import List
from .message import MessageInDB

class ConversationBase(BaseModel):
    title: str

class ConversationInDB(ConversationBase):
    id: uuid.UUID
    session_id: uuid.UUID
    created_at: datetime
    messages: List[MessageInDB] = []

    class Config:
        orm_mode = True

class ConversationHistory(BaseModel):
    id: uuid.UUID
    title: str
    created_at: datetime

    class Config:
        orm_mode = True