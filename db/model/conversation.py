import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.types import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.base import Base

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False, index=True)
    
    title = Column(String(255), default="New Chat")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")