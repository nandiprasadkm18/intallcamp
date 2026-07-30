from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.core.rbac import require_permissions
from app.models.academic import Department
from app.models.user import User
from app.schemas.academic import Department as DepartmentSchema, DepartmentCreate
from app.services.audit_service import AuditService

router = APIRouter()

@router.post("/", response_model=DepartmentSchema)
def create_department(
    department_in: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["manage_departments"]))
):
    """
    Create new department for the tenant's college.
    Only College Admins or Super Admins can access this.
    """
    # Tenant Isolation: force the college_id to the user's college
    if current_user.college_id is None:
        raise HTTPException(status_code=400, detail="Super Admins must specify college context.")
        
    # Check if department with code exists in THIS college
    exists = db.query(Department).filter(
        Department.code == department_in.code, 
        Department.college_id == current_user.college_id
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="Department code already exists in this college.")
        
    db_obj = Department(
        name=department_in.name,
        code=department_in.code,
        college_id=current_user.college_id
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    # Audit Logging
    AuditService.log_action(
        db=db,
        user=current_user,
        action=f"CREATED_DEPARTMENT_{department_in.code}",
        module="TENANT_MANAGEMENT"
    )
    
    return db_obj

@router.get("/", response_model=List[DepartmentSchema])
def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all departments in the user's college.
    """
    if current_user.college_id is None:
        raise HTTPException(status_code=400, detail="Super Admins must specify college context.")
        
    return db.query(Department).filter(Department.college_id == current_user.college_id).all()
