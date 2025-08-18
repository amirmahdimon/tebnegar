import uuid
import enum
from sqlalchemy import Column, Text, DateTime, ForeignKey, Enum
from sqlalchemy.types import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.base import Base

class SenderType(str, enum.Enum):
    USER = "USER"
    AI = "AI"

class Message(Base):
    __tablename__ = "messages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False, index=True)
    
    sender_type = Column(Enum(SenderType), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    conversation = relationship("Conversation", back_populates="messages")
    ai_analysis = relationship("AIAnalysis", back_populates="message", uselist=False, cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="message", uselist=False, cascade="all, delete-orphan")