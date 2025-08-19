import uuid
import enum
from sqlalchemy import Column, Text, DateTime, ForeignKey, Enum
from sqlalchemy.types import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.base import Base

class FeedbackType(str, enum.Enum):
    LIKE = "like"
    DISLIKE = "dislike"

class ResponseFeedback(Base):
    __tablename__ = "response_feedback" # Renamed table
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=False, unique=True)
    
    feedback_type = Column(Enum(FeedbackType), nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    message = relationship("Message", back_populates="feedback")