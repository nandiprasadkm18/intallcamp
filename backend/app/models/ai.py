from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Index
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from datetime import datetime

from app.db.base import Base

class AIJobStatus(Base):
    __tablename__ = "ai_job_statuses"
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False) # e.g., 'resource', 'lecture'
    entity_id = Column(Integer, nullable=False)
    job_type = Column(String, nullable=False) # e.g., 'extract_embed'
    status = Column(String, default="Pending") # Pending, Processing, Completed, Failed
    progress_message = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ResourceChunk(Base):
    __tablename__ = "resource_chunks"
    id = Column(Integer, primary_key=True, index=True)
    
    # Metadata
    resource_id = Column(Integer, ForeignKey("classroom_resources.id"), nullable=False)
    lecture_id = Column(Integer, ForeignKey("lecture_sessions.id"), nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    
    page_number = Column(Integer, nullable=True)
    chunk_index = Column(Integer, nullable=False)
    
    # Content
    chunk_text = Column(Text, nullable=False)
    
    # Embedding: BAAI/bge-small-en-v1.5 has 384 dimensions
    embedding = Column(Vector(384))
    
    # Relationships
    resource = relationship("ClassroomResource")

    __table_args__ = (
        Index('ix_resource_chunks_embedding_hnsw', 'embedding', postgresql_using='hnsw', postgresql_with={'m': 16, 'ef_construction': 64}, postgresql_ops={'embedding': 'vector_cosine_ops'}),
    )

class TranscriptChunk(Base):
    __tablename__ = "transcript_chunks"
    id = Column(Integer, primary_key=True, index=True)
    
    transcript_id = Column(Integer, ForeignKey("transcript_records.id"), nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    
    chunk_index = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(Vector(384))
    
    transcript = relationship("TranscriptRecord")
    classroom = relationship("Classroom")

    __table_args__ = (
        Index('ix_transcript_chunks_embedding_hnsw', 'embedding', postgresql_using='hnsw', postgresql_with={'m': 16, 'ef_construction': 64}, postgresql_ops={'embedding': 'vector_cosine_ops'}),
    )

class SummaryChunk(Base):
    __tablename__ = "summary_chunks"
    id = Column(Integer, primary_key=True, index=True)
    
    summary_id = Column(Integer, ForeignKey("lecture_summaries.id"), nullable=False)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=False)
    
    chunk_index = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(Vector(384))
    
    summary = relationship("LectureSummary")
    classroom = relationship("Classroom")

    __table_args__ = (
        Index('ix_summary_chunks_embedding_hnsw', 'embedding', postgresql_using='hnsw', postgresql_with={'m': 16, 'ef_construction': 64}, postgresql_ops={'embedding': 'vector_cosine_ops'}),
    )
