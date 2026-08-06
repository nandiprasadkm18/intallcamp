from typing import Optional, List
from pydantic import BaseModel

# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    code: str

class DepartmentCreate(DepartmentBase):
    pass

class Department(DepartmentBase):
    id: int
    college_id: int

    class Config:
        from_attributes = True

# Course Schemas
class CourseBase(BaseModel):
    name: str
    code: str
    credits: int

class CourseCreate(CourseBase):
    section_id: int

class Course(CourseBase):
    id: int
    section_id: int

    class Config:
        from_attributes = True


# Timetable Schemas
class TimetableCreate(BaseModel):
    classroom_id: Optional[int] = None
    day_of_week: str
    start_time: str
    end_time: str
    subject_name: str
    room_code: Optional[str] = None
    year: int
    semester: int
    department: str
    section: str

class TimetableResponse(TimetableCreate):
    id: int
    classroom_code: Optional[str] = None
    classroom_name: Optional[str] = None

    class Config:
        from_attributes = True

class TimetableUpdate(BaseModel):
    classroom_id: Optional[int] = None
    day_of_week: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    subject_name: Optional[str] = None
    room_code: Optional[str] = None
    year: Optional[int] = None
    semester: Optional[int] = None
    department: Optional[str] = None
    section: Optional[str] = None
