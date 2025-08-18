import uuid
from sqlalchemy import Column, String, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from db.base import Base

class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(String, index=True, nullable=False)
    rating = Column(Integer, nullable=False) # e.g., 1-5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())