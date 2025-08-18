import uuid
from sqlalchemy import Column, Text, Boolean, Integer, String, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.base import Base

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=False, unique=True)
    
    potential_conditions = Column(JSON, nullable=True)
    criticality_flag = Column(Boolean, default=False)
    processing_time_ms = Column(Integer, nullable=True)
    ai_provider = Column(String(100), nullable=True)
    token_usage = Column(JSON, nullable=True)
    
    message = relationship("Message", back_populates="ai_analysis")