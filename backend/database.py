import os
import datetime
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:nandi@localhost/majorproject")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="student")  # student, teacher, admin
    bio = Column(Text, nullable=True)
    avatar = Column(String, nullable=True)
    year = Column(Integer, nullable=True) # e.g., 1, 2, 3, 4
    semester = Column(Integer, nullable=True) # e.g., 1-8
    department = Column(String, nullable=True) # e.g., 'CSE', 'ECE', 'ME', 'CE'

    classrooms = relationship("Classroom", back_populates="teacher")
    doubts = relationship("Doubt", back_populates="student")
    attendance = relationship("Attendance", back_populates="student")

class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    is_live = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    teacher = relationship("User", back_populates="classrooms")
    transcripts = relationship("Transcript", back_populates="classroom", cascade="all, delete-orphan")
    doubts = relationship("Doubt", back_populates="classroom", cascade="all, delete-orphan")
    resources = relationship("Resource", back_populates="classroom", cascade="all, delete-orphan")
    attendance = relationship("Attendance", back_populates="classroom", cascade="all, delete-orphan")
    timetables = relationship("Timetable", back_populates="classroom", cascade="all, delete-orphan")

class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    text = Column(Text, nullable=False)
    timestamp = Column(String, nullable=False)  # HH:MM:SS format
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    classroom = relationship("Classroom", back_populates="transcripts")

class Doubt(Base):
    __tablename__ = "doubts"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null if anonymous
    question = Column(Text, nullable=False)
    ai_answer = Column(Text, nullable=True)
    is_anonymous = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    classroom = relationship("Classroom", back_populates="doubts")
    student = relationship("User", back_populates="doubts")

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    title = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # PDF, PPTX, DOCX, ZIP
    file_size = Column(String, nullable=False)  # e.g. "4.2 MB"
    downloads = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    classroom = relationship("Classroom", back_populates="resources")

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    date = Column(String, nullable=False)  # YYYY-MM-DD
    status = Column(String, default="absent")  # present, absent
    engagement_score = Column(Float, default=0.0)  # 0 to 100
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    classroom = relationship("Classroom", back_populates="attendance")
    student = relationship("User", back_populates="attendance")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)

class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    day_of_week = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    subject_name = Column(String, nullable=False)
    room_code = Column(String, nullable=True)
    
    # Target Class filters
    year = Column(Integer, nullable=False)
    semester = Column(Integer, nullable=False)
    department = Column(String, nullable=False)
    section = Column(String, nullable=False)

    classroom = relationship("Classroom", back_populates="timetables")

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    sender = Column(String, default="System Administrator")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

def init_db():

    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
