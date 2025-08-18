import uuid
from sqlalchemy import Column, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.types import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.base import Base

class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=False, unique=True)
    
    rating = Column(Integer, nullable=False)
    would_pay = Column(Boolean, nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    message = relationship("Message", back_populates="feedback")