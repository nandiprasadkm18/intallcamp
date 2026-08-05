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
    classroom_id: int
    day_of_week: str
    start_time: str
    end_time: str
    subject_name: str
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
