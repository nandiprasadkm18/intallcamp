from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone

from app.api.dependencies import get_db, get_current_user
from app.models.user import User, Role
from app.models.academic import Course, Department, ClassroomResource
from app.models.activity import Classroom, Doubt, LectureSession, Attendance
from app.models.observability import AIRequestLog
from app.models.ai import AIJobStatus
import psutil

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
    today = datetime.now(timezone.utc)
    today_str = today.strftime('%Y-%m-%d')
    ai_requests_today = db.query(AIRequestLog).filter(
        AIRequestLog.college_id == college_id,
        AIRequestLog.created_at >= today.replace(hour=0, minute=0, second=0, microsecond=0)
    ).count()
    
    total_tokens = db.query(func.sum(AIRequestLog.total_tokens)).filter(
        AIRequestLog.college_id == college_id
    ).scalar() or 0
    
    avg_latency = db.query(func.avg(AIRequestLog.latency_ms)).filter(
        AIRequestLog.college_id == college_id
    ).scalar() or 0
    
    resources_count = db.query(ClassroomResource).count()
    doubts_count = db.query(Doubt).join(Classroom).filter(Classroom.college_id == college_id).count()
    
    lectures_today = db.query(LectureSession).join(Classroom).filter(
        Classroom.college_id == college_id,
        LectureSession.start_time.like(f'%{today_str}%')
    ).count()
    
    attendance_today = db.query(Attendance).join(LectureSession).join(Classroom).filter(
        Classroom.college_id == college_id,
        LectureSession.start_time.like(f'%{today_str}%')
    ).all()
    
    present_count = sum(1 for a in attendance_today if a.status == 'present')
    total_attendance = len(attendance_today)
    att_percent = (present_count / total_attendance * 100) if total_attendance > 0 else 0
    
    system_alerts = db.query(AIJobStatus).filter(AIJobStatus.status == 'Failed').count()
    
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
            "lectures_today": lectures_today,
            "attendance_today_percent": round(att_percent, 1),
            "system_alerts": system_alerts,
            "ai": {
                "requests_today": ai_requests_today,
                "total_tokens_used": total_tokens,
                "avg_latency": round(avg_latency, 2)
            }
        },
        "cpu_usage": psutil.cpu_percent(interval=None),
        "memory_usage": psutil.virtual_memory().percent
    }
