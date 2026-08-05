from typing import Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = True
    full_name: Optional[str] = None
    college_id: Optional[int] = None
    role_id: Optional[int] = None
    year: Optional[int] = None
    semester: Optional[int] = None
    department: Optional[str] = None

class UserCreate(UserBase):
    email: EmailStr
    password: str
    full_name: str
    role_id: int

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: Optional[int] = None

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass
