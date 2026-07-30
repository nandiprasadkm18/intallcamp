from sqlalchemy.orm import Session
from fastapi import Request
from app.models.activity import AuditLog
from app.models.user import User

class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        user: User,
        action: str,
        module: str,
        request: Request = None
    ):
        """
        Log an administrative or system action performed by a user.
        """
        client_ip = None
        if request and request.client:
            client_ip = request.client.host
            
        audit_entry = AuditLog(
            college_id=user.college_id,
            user_id=user.id,
            action=action,
            module=module,
            ip_address=client_ip
        )
        db.add(audit_entry)
        db.commit()
