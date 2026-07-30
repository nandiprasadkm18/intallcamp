import time
from sqlalchemy.orm import Session
from app.models.observability import AIRequestLog

def log_ai_request(
    db: Session,
    college_id: int,
    user_id: int,
    model: str,
    endpoint: str,
    latency_ms: float,
    prompt_tokens: int = 0,
    completion_tokens: int = 0,
    total_tokens: int = 0,
    status_code: int = 200
):
    try:
        log_entry = AIRequestLog(
            college_id=college_id,
            user_id=user_id,
            model=model,
            endpoint=endpoint,
            latency_ms=latency_ms,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            status_code=status_code
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        print(f"Failed to log AI request: {e}")
        db.rollback()
