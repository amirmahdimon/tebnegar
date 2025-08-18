import uuid
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.types import UUID
from sqlalchemy.sql import func
from db.base import Base

class SymptomLog(Base):
    __tablename__ = "symptom_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(String, index=True, nullable=False) # To track a user session
    symptoms_text = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())