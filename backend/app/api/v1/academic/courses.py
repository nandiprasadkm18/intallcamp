from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.core.rbac import require_permissions
from app.models.academic import Course, Section, Semester, Program, Department
from app.models.user import User
from app.schemas.academic import Course as CourseSchema, CourseCreate

router = APIRouter()

@router.post("/", response_model=CourseSchema)
def create_course(
    course_in: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["manage_courses"]))
):
    """
    Create a new course.
    Verifies that the section belongs to the user's college.
    """
    # Complex join to verify tenant ownership of the section
    section = db.query(Section).join(Semester).join(Program).join(Department).filter(
        Section.id == course_in.section_id,
        Department.college_id == current_user.college_id
    ).first()
    
    if not section:
        raise HTTPException(status_code=403, detail="Section not found or does not belong to your college.")
        
    db_obj = Course(
        name=course_in.name,
        code=course_in.code,
        credits=course_in.credits,
        section_id=course_in.section_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/", response_model=List[CourseSchema])
def list_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all courses in the user's college.
    """
    courses = db.query(Course).join(Section).join(Semester).join(Program).join(Department).filter(
        Department.college_id == current_user.college_id
    ).all()
    return courses
