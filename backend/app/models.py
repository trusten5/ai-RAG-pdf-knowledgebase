# app/models.py
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Brief(Base):
    __tablename__ = "briefs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    prompt = Column(Text, nullable=True)
    status = Column(Enum("uploaded", "queued", "processing", "done", "failed", name="status_enum"), default="uploaded")
    summary = Column(Text, nullable=True)
    executive_summary = Column(Text, nullable=True) 
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, nullable=True)  # Future: ForeignKey("users.id")
