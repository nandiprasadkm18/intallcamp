from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.api.dependencies import get_db, get_current_user
from app.core.rbac import require_permissions
from app.models.tenant import College, CollegeDomain
from app.models.user import User, Role
from app.models.observability import AIRequestLog
from app.core.security import get_password_hash
from app.services.audit_service import AuditService
from pydantic import BaseModel, EmailStr
from sqlalchemy import func

router = APIRouter()

class CollegeDomainResponse(BaseModel):
    id: int
    domain: str
    is_primary: bool
    
    class Config:
        from_attributes = True

class CollegeCreate(BaseModel):
    name: str
    code: str
    institution_type: str
    established_year: Optional[int] = None
    affiliation: Optional[str] = None
    accreditation: Optional[List[str]] = None
    official_email: str
    phone: str
    website: Optional[str] = None
    country: str
    state: str
    city: str
    pin_code: Optional[str] = None
    full_address: Optional[str] = None
    
    primary_domain: str
    additional_domains: List[str] = []
    
    admin_email: EmailStr
    admin_password: str

class CollegeResponse(BaseModel):
    id: int
    name: str
    code: str
    institution_type: Optional[str] = None
    established_year: Optional[int] = None
    affiliation: Optional[str] = None
    accreditation: Optional[str] = None
    official_email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    pin_code: Optional[str] = None
    full_address: Optional[str] = None
    status: str
    subscription: str
    storage_limit: int
    storage_used: int
    max_students: int
    max_teachers: int
    max_admins: int
    is_active: bool
    domains: List[CollegeDomainResponse] = []
    
    class Config:
        from_attributes = True

@router.post("/", response_model=CollegeResponse)
def create_college(
    college_in: CollegeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["manage_colleges"])) # Super Admin only
):
    """
    Onboard a new college to the platform.
    Only Super Admins have the 'manage_colleges' permission.
    """
    exists = db.query(College).filter(College.code == college_in.code).first()
    if exists:
        raise HTTPException(status_code=400, detail="College code already exists.")
        
    accreditation_str = ",".join(college_in.accreditation) if college_in.accreditation else None
        
    new_college = College(
        name=college_in.name,
        code=college_in.code,
        institution_type=college_in.institution_type,
        established_year=college_in.established_year,
        affiliation=college_in.affiliation,
        accreditation=accreditation_str,
        official_email=college_in.official_email,
        phone=college_in.phone,
        website=college_in.website,
        country=college_in.country,
        state=college_in.state,
        city=college_in.city,
        pin_code=college_in.pin_code,
        full_address=college_in.full_address
        # Quotas and other settings will use DB defaults ("Pending Configuration", limits, etc.)
    )
    db.add(new_college)
    db.commit()
    db.refresh(new_college)
    
    # Register the primary domain for this college
    new_domain = CollegeDomain(
        college_id=new_college.id,
        domain=college_in.primary_domain.lower(),
        is_primary=True
    )
    db.add(new_domain)
    
    # Register any additional domains
    for domain_str in college_in.additional_domains:
        d = domain_str.lower().strip()
        if d and d != college_in.primary_domain.lower():
            db.add(CollegeDomain(
                college_id=new_college.id,
                domain=d,
                is_primary=False
            ))
            
    db.commit()
    db.refresh(new_college)
    
    # Create the College Admin user
    role = db.query(Role).filter(Role.name == "College Admin").first()
    if role:
        admin_user = User(
            full_name=f"{college_in.code} Admin",
            email=college_in.admin_email.lower(),
            password_hash=get_password_hash(college_in.admin_password),
            role_id=role.id,
            college_id=new_college.id,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
    
    db.refresh(new_college)
    
    AuditService.log_action(db, current_user, f"CREATED_COLLEGE_{new_college.code}", "PLATFORM")
    return new_college

@router.get("/", response_model=List[CollegeResponse])
def list_colleges(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["manage_colleges"]))
):
    return db.query(College).all()

@router.get("/kpis")
def get_platform_kpis(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(["manage_colleges"]))
):
    """
    Get aggregated KPIs for the Super Admin dashboard.
    """
    colleges = db.query(College).all()
    total_colleges = len(colleges)
    
    storage_used_mb = sum((c.storage_used or 0) for c in colleges)
    storage_limit_gb = sum((c.storage_limit or 0) for c in colleges)
    
    revenue = 0
    for c in colleges:
        sub = (c.subscription or "").lower()
        if sub == "enterprise":
            revenue += 500
        elif sub == "pro":
            revenue += 100
            
    storage_used_tb = round(storage_used_mb / 1048576, 4)
    storage_limit_tb = round(storage_limit_gb / 1024, 2)
    
    # Get user counts by role
    roles = db.query(Role).all()
    role_map = {r.name: r.id for r in roles}
    
    student_id = role_map.get("Student")
    teacher_id = role_map.get("Teacher")
    admin_id = role_map.get("College Admin")
    
    total_students = db.query(User).filter(User.role_id == student_id).count() if student_id else 0
    total_teachers = db.query(User).filter(User.role_id == teacher_id).count() if teacher_id else 0
    total_admins = db.query(User).filter(User.role_id == admin_id).count() if admin_id else 0
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    ai_requests_today = db.query(AIRequestLog).filter(AIRequestLog.created_at >= today).count()
    
    return {
        "totalColleges": total_colleges,
        "totalStudents": total_students,
        "totalTeachers": total_teachers,
        "totalCollegeAdmins": total_admins,
        "storageUsedTB": storage_used_tb,
        "storageTotalTB": storage_limit_tb,
        "aiRequestsToday": ai_requests_today,
        "monthlyRevenue": revenue,
        "platformUptime": 100.00
    }
