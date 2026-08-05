from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.core.security import verify_password, create_access_token
from app.core.config import settings
from app.models.user import User, Role
from app.schemas.token import Token

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    role = db.query(Role).filter(Role.id == user.role_id).first()
    
    access_token = create_access_token(
        subject=user.id,
        expires_delta=access_token_expires,
        additional_claims={
            "role": role.name if role else "User",
            "college_id": user.college_id
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": role.name if role else "User",
            "college_id": user.college_id,
            "year": user.year,
            "semester": user.semester,
            "section": user.section,
            "department": user.department,
            "phone": user.phone
        }
    }

@router.get("/me")
def get_me(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Get current logged in user details.
    """
    # Fetch the role string for frontend compatibility
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": role.name if role else "User",
        "college_id": current_user.college_id,
        "year": current_user.year,
        "semester": current_user.semester,
        "section": current_user.section,
        "department": current_user.department,
        "phone": current_user.phone
    }
