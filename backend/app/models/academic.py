from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Department(Base):
    __tablename__ = "departments"
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=False)
    name = Column(String, nullable=False)
    code = Column(String, index=True, nullable=False)
    
    programs = relationship("Program", back_populates="department")

class Program(Base):
    __tablename__ = "programs"
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    name = Column(String, nullable=False)
    degree_level = Column(String, nullable=True) # e.g., 'Bachelors', 'Masters'
    
    department = relationship("Department", back_populates="programs")
    semesters = relationship("Semester", back_populates="program")

class Semester(Base):
    __tablename__ = "semesters"
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=False)
    term_name = Column(String, nullable=False) # e.g., 'Fall 2026', 'Semester 1'
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    
    program = relationship("Program", back_populates="semesters")
    sections = relationship("Section", back_populates="semester")

class Section(Base):
    __tablename__ = "sections"
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    name = Column(String, nullable=False) # e.g., 'A', 'B'
    capacity = Column(Integer, default=60)
    
    semester = relationship("Semester", back_populates="sections")
    courses = relationship("Course", back_populates="section")

class Course(Base):
    __tablename__ = "courses"
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    name = Column(String, nullable=False)
    code = Column(String, index=True, nullable=False)
    credits = Column(Integer, default=3)
    
    section = relationship("Section", back_populates="courses")

class ClassroomResource(Base):
    __tablename__ = "classroom_resources"
    id = Column(Integer, primary_key=True, index=True)
    classroom_code = Column(String, index=True, nullable=False)
    title = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(String, nullable=False)
    
    target_year = Column(Integer, nullable=True)
    target_department = Column(String, nullable=True)
    target_semester = Column(Integer, nullable=True)
    target_class = Column(String, nullable=True)
    target_section = Column(String, nullable=True) # e.g., 'A', 'B', or null for 'All Sections'

class Timetable(Base):
    __tablename__ = "timetables"
    id = Column(Integer, primary_key=True, index=True)
    classroom_id = Column(Integer, ForeignKey("classrooms.id"))
    day_of_week = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    subject_name = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    semester = Column(Integer, nullable=False)
    department = Column(String, nullable=False)
    section = Column(String, nullable=False)
    
    classroom = relationship("Classroom")
