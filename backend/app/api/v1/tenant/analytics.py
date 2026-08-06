from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.observability import AIRequestLog
from app.models.activity import Doubt, Classroom
from typing import List, Dict
from datetime import datetime, timedelta, timezone

router = APIRouter()

@router.get("/ai")
def get_ai_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["College Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to view analytics")

    # Filter by college for College Admin, or all for Super Admin
    query = db.query(AIRequestLog)
    if current_user.role.name == "College Admin":
        query = query.filter(AIRequestLog.college_id == current_user.college_id)

    # 1. Overall stats
    avg_latency_row = query.with_entities(func.avg(AIRequestLog.latency_ms)).scalar()
    avg_latency = int(avg_latency_row) if avg_latency_row else 0
    total_tokens_row = query.with_entities(func.sum(AIRequestLog.total_tokens)).scalar()
    total_tokens = int(total_tokens_row) if total_tokens_row else 0
    
    doubt_query = db.query(Doubt).join(Classroom)
    if current_user.role.name == "College Admin":
        doubt_query = doubt_query.filter(Classroom.college_id == current_user.college_id)
    total_queries = doubt_query.count()

    # 2. Historical timeseries data (grouped by day of week for the last 5 days)
    # We will compute the real metric, but if no data, fallback to 0
    today = datetime.now(timezone.utc)
    performance_data = []
    
    days_map = {0: 'Mon', 1: 'Tue', 2: 'Wed', 3: 'Thu', 4: 'Fri', 5: 'Sat', 6: 'Sun'}
    for i in range(4, -1, -1):
        target_date = today - timedelta(days=i)
        day_str = days_map[target_date.weekday()]
        
        # Query for this specific day
        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        day_query = query.filter(AIRequestLog.created_at >= start_of_day, AIRequestLog.created_at < end_of_day)
        
        day_avg = day_query.with_entities(func.avg(AIRequestLog.latency_ms)).scalar()
        day_avg = int(day_avg) if day_avg else 0
        
        # queries in this context could mean ai_requests for the chart
        day_req_count = day_query.count()
        
        performance_data.append({"name": day_str, "latency": day_avg, "queries": day_req_count})

    # Models usage
    # Group by model in AIRequestLog
    models_data = []
    model_stats = query.with_entities(AIRequestLog.model, func.count(AIRequestLog.id)).group_by(AIRequestLog.model).all()
    
    colors = ["#6366f1", "#10b981", "#f59e0b", "#e83e8c", "#6f42c1"]
    
    if model_stats:
        for idx, (m_name, count) in enumerate(model_stats):
            if count > 0:
                models_data.append({"name": m_name, "value": count, "color": colors[idx % len(colors)]})

    return {
        "overview": {
            "total_queries": total_queries,
            "avg_latency": avg_latency,
            "total_tokens": total_tokens
        },
        "performance_chart": performance_data,
        "models_chart": models_data
    }
