from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.api.dependencies import get_db, get_current_user
from app.core.rbac import require_permissions
from app.core.security import get_password_hash
from app.models.user import User, Role
from app.models.tenant import CollegeDomain

router = APIRouter()

class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role_name: str = "Student" # Default to Student, can be 'Teacher' or 'College Admin'
    year: Optional[int] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    department: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role_id: int
    college_id: Optional[int] = None
    phone: Optional[str] = None
    year: Optional[int] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    department: Optional[str] = None
    is_active: bool
    class Config:
        from_attributes = True

class RoleResponse(BaseModel):
    name: str
    class Config:
        from_attributes = True

class UserWithRoleResponse(UserResponse):
    role: RoleResponse

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    section: Optional[str] = None

@router.post("/register", response_model=UserResponse)
def register_user(user_in: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user (Student, Teacher, College Admin).
    Strict domain validation applies. 
    The domain of the email must match an active CollegeDomain.
    """
    if db.query(User).filter(User.email == user_in.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    college_id = None

    # Skip domain validation for the master platform owner domain
    if not user_in.email.endswith("@intellcamp.com"):
        domain_part = user_in.email.split('@')[1].lower()
        college_domain = db.query(CollegeDomain).filter(CollegeDomain.domain == domain_part).first()
        
        if not college_domain:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail=f"Unauthorized email domain '{domain_part}'. Your institution is not registered."
            )
        college_id = college_domain.college_id

    # Fetch role
    role = db.query(Role).filter(Role.name == user_in.role_name).first()
    if not role:
        raise HTTPException(status_code=400, detail=f"Invalid role '{user_in.role_name}'")

    # Prevent regular registration of Super Admin
    if role.name == "Super Admin" and not user_in.email.endswith("@intellcamp.com"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot register as Super Admin.")

    new_user = User(
        full_name=user_in.full_name,
        email=user_in.email.lower(),
        password_hash=get_password_hash(user_in.password),
        role_id=role.id,
        college_id=college_id,
        is_active=True,
        year=user_in.year if role.name == 'Student' else None,
        semester=user_in.semester if role.name == 'Student' else None,
        section=user_in.section if role.name == 'Student' else None,
        department=user_in.department
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.get("/college/{college_id}", response_model=List[UserWithRoleResponse])
def get_users_by_college(
    college_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_permissions(["manage_users"]))
):
    """
    Get all users for a specific college. 
    Only Super Admins with manage_users permission can access this.
    """
    users = db.query(User).filter(User.college_id == college_id).all()
    return users

@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update the current user's profile (name, phone, password).
    Email cannot be changed through this endpoint.
    """
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name
    if profile_in.phone is not None:
        current_user.phone = profile_in.phone
    if profile_in.section is not None:
        current_user.section = profile_in.section
    if profile_in.password:
        current_user.password_hash = get_password_hash(profile_in.password)
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/{user_id}", response_model=dict)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["manage_users"]))
):
    """
    Delete a user by ID.
    Only users with 'manage_users' permission can access this.
    """
    user_to_delete = db.query(User).filter(User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
        
    role = db.query(Role).filter(Role.id == user_to_delete.role_id).first()
    if role and role.name == "Super Admin":
        raise HTTPException(status_code=403, detail="Cannot delete a Super Admin.")
    
    if user_to_delete.id == current_user.id:
        raise HTTPException(status_code=403, detail="Cannot delete your own account.")

    # A College Admin should only be able to delete users in their own college
    if current_user.college_id and user_to_delete.college_id != current_user.college_id:
        raise HTTPException(status_code=403, detail="Cannot delete a user from another college.")

    # Manually delete related records to avoid FK constraints
    from app.models.activity import AuditLog, StorageFile, AIRequest, Classroom, Attendance, Doubt, LectureSession, TranscriptRecord, LectureSummary
    from app.models.academic import Timetable, Resource
    
    # If teacher, delete their classrooms and all classroom-related data
    classrooms = db.query(Classroom).filter(Classroom.teacher_id == user_to_delete.id).all()
    for classroom in classrooms:
        db.query(LectureSummary).filter(LectureSummary.classroom_id == classroom.id).delete()
        db.query(Resource).filter(Resource.classroom_id == classroom.id).delete()
        db.query(Doubt).filter(Doubt.classroom_id == classroom.id).delete()
        db.query(TranscriptRecord).filter(TranscriptRecord.classroom_id == classroom.id).delete()
        db.query(Timetable).filter(Timetable.classroom_id == classroom.id).update({Timetable.classroom_id: None})
        
        sessions = db.query(LectureSession).filter(LectureSession.classroom_id == classroom.id).all()
        for session in sessions:
            db.query(Attendance).filter(Attendance.lecture_id == session.id).delete()
            db.delete(session)
        db.delete(classroom)

    # Delete other user-specific records
    db.query(AuditLog).filter(AuditLog.user_id == user_to_delete.id).delete()
    db.query(StorageFile).filter(StorageFile.uploaded_by == user_to_delete.id).delete()
    db.query(AIRequest).filter(AIRequest.user_id == user_to_delete.id).delete()
    db.query(Attendance).filter(Attendance.student_id == user_to_delete.id).delete()
    db.query(Doubt).filter(Doubt.student_id == user_to_delete.id).delete()

    db.delete(user_to_delete)
    db.commit()
    
    return {"detail": "User deleted successfully", "id": user_id}
