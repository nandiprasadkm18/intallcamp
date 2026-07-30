from typing import List
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.user import User, Role, Permission
from app.api.dependencies import get_current_user, get_db

def require_permissions(required_permissions: List[str]):
    """
    Dependency that checks if the current user has all the required permissions.
    """
    def permission_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        # Fetch the user's role and its associated permissions
        role = db.query(Role).filter(Role.id == current_user.role_id).first()
        if not role:
            raise HTTPException(status_code=403, detail="Role not found")
            
        user_permissions = [p.name for p in role.permissions]
        
        # Super Admin bypasses all permission checks
        if "super_admin" in [r.name.lower() for r in db.query(Role).filter(Role.id == current_user.role_id)]:
            return current_user
            
        # Check if the user has all the required permissions
        for perm in required_permissions:
            if perm not in user_permissions:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Insufficient permissions. Required: {perm}"
                )
                
        return current_user
        
    return permission_checker
