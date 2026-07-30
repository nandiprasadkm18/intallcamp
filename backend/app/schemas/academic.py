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
