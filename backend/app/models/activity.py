from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.db.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=True) # Super Admin actions might not have a college
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False) # e.g., 'CREATED_USER', 'DELETED_COURSE'
    module = Column(String, nullable=False) # e.g., 'TENANT_MANAGEMENT', 'ACADEMICS'
    ip_address = Column(String, nullable=True)
    
    user = relationship("User")
    college = relationship("College")

class StorageFile(Base):
    __tablename__ = "storage_files"
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False) # mime type
    file_size = Column(Integer, nullable=False) # in bytes
    storage_path = Column(String, nullable=False) # e.g., 's3://.../college-1/notes/file.pdf'

class AIRequest(Base):
    __tablename__ = "ai_requests"
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    model_used = Column(String, nullable=False)
    tokens_used = Column(Integer, default=0)
    latency_ms = Column(Integer, default=0)
    endpoint = Column(String, nullable=False) # e.g., '/api/v1/ai/transcribe'

class Classroom(Base):
    __tablename__ = "classrooms"
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    schedule_cron = Column(String, nullable=True)
    meeting_link = Column(String, nullable=True)
    status = Column(String, default="scheduled") # scheduled, live, completed
    
    course = relationship("Course")
    teacher = relationship("User")

class LectureSession(Base):
    __tablename__ = "lecture_sessions"
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=True)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=True)
    ai_transcript_url = Column(String, nullable=True)
    
    classroom = relationship("Classroom")

class Attendance(Base):
    __tablename__ = "attendance"
    lecture_id = Column(Integer, ForeignKey("lecture_sessions.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="absent") # present, absent, late
    engagement_score = Column(Float, default=0.0)
    
    lecture = relationship("LectureSession")
    student = relationship("User")

class Doubt(Base):
    __tablename__ = "doubts"
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question = Column(String, nullable=False)
    is_anonymous = Column(Integer, default=0)
    timestamp = Column(String, nullable=False)
    ai_answer = Column(String, nullable=True)
    
    classroom = relationship("Classroom")
    student = relationship("User")

class TranscriptRecord(Base):
    __tablename__ = "transcript_records"
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=True)
    text = Column(String, nullable=False)
    speaker_name = Column(String, nullable=True) # Usually the teacher
    timestamp = Column(String, nullable=False)
    
    classroom = relationship("Classroom")

class LectureSummary(Base):
    __tablename__ = "lecture_summaries"
    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"), nullable=True)
    summary_text = Column(String, nullable=False)
    created_at = Column(String, nullable=False)
    transcript_s3_key = Column(String, nullable=True)
    summary_s3_key = Column(String, nullable=True)
    
    year = Column(Integer, nullable=True)
    semester = Column(Integer, nullable=True)
    section = Column(String, nullable=True)
    
    classroom = relationship("Classroom")
