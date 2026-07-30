from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from datetime import datetime
from app.db.base import Base

class AIRequestLog(Base):
    __tablename__ = "ai_request_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    model = Column(String, nullable=False)
    endpoint = Column(String, nullable=False) # e.g., 'transcription', 'chat', 'summary'
    
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    
    latency_ms = Column(Float, default=0.0)
    status_code = Column(Integer, default=200)
    
    created_at = Column(DateTime, default=datetime.utcnow)
