from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Table, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base

role_permission_association = Table(
    'role_permissions', Base.metadata,
    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),
    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True)
)

class Permission(Base):
    __tablename__ = "permissions"
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)

class Role(Base):
    __tablename__ = "roles"
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=True) # Null for Super Admin roles
    name = Column(String, nullable=False) # e.g., 'Super Admin', 'College Admin', 'Teacher', 'Student'
    
    permissions = relationship("Permission", secondary=role_permission_association)
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"
    
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=True) # Null for Super Admin
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    profile_image = Column(String, nullable=True)
    
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    section = Column(String, nullable=True) # e.g., '7th Sem A'

    # Relationships
    college = relationship("College", back_populates="users")
    role = relationship("Role", back_populates="users")
