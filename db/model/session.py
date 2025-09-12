import uuid
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.types import UUID
from sqlalchemy.sql import func
from db.base import Base

class Session(Base):
    __tablename__ = "sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    ip_address = Column(String(45), nullable=True) 
    user_agent = Column(Text, nullable=True)
    # Marketing Attribution
    landing_page_url = Column(Text, nullable=True)
    referrer_url = Column(Text, nullable=True)
    utm_source = Column(String(255), index=True, nullable=True)
    utm_medium = Column(String(255), index=True, nullable=True)
    utm_campaign = Column(String(255), index=True, nullable=True)
    utm_term = Column(String(255), nullable=True)
    utm_content = Column(String(255), nullable=True)
    
    client_metadata = Column(JSON, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    user = relationship("User", back_populates="sessions")