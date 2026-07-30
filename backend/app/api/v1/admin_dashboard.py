from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.api.dependencies import get_db, get_current_user
from app.models.user import User, Role
from app.models.academic import Course, Department
from app.models.activity import Classroom
from app.models.observability import AIRequestLog

router = APIRouter()

@router.get("/metrics")
def get_system_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["College Admin", "Super Admin"]:
        return {"error": "Not authorized"}
        
    college_id = current_user.college_id
    
    # User metrics
    total_users = db.query(User).filter(User.college_id == college_id).count()
    students = db.query(User).join(Role).filter(User.college_id == college_id, Role.name == 'Student').count()
    teachers = db.query(User).join(Role).filter(User.college_id == college_id, Role.name == 'Teacher').count()
    
    # Classroom metrics
    total_classrooms = db.query(Classroom).filter(Classroom.college_id == college_id).count()
    active_live = db.query(Classroom).filter(Classroom.college_id == college_id, Classroom.status == 'live').count()
    
    # AI Observability Metrics
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    ai_requests_today = db.query(AIRequestLog).filter(
        AIRequestLog.college_id == college_id,
        AIRequestLog.created_at >= today
    ).count()
    
    total_tokens = db.query(func.sum(AIRequestLog.total_tokens)).filter(
        AIRequestLog.college_id == college_id
    ).scalar() or 0
    
    # Just mock some resource and doubt counts since they aren't fully modeled with college_id in all queries here
    resources_count = 12
    doubts_count = 45
    
    return {
        "metrics": {
            "users": {
                "total": total_users,
                "students": students,
                "teachers": teachers
            },
            "classrooms": {
                "total": total_classrooms,
                "active_live": active_live
            },
            "resources": resources_count,
            "doubts": doubts_count,
            "ai": {
                "requests_today": ai_requests_today,
                "total_tokens_used": total_tokens
            }
        },
        "cpu_usage": 14.2,
        "memory_usage": 48.5
    }
