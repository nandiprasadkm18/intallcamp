from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class CollegeDomain(Base):
    __tablename__ = "college_domains"
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=False)
    domain = Column(String, unique=True, index=True, nullable=False) # e.g. 'vvce.ac.in'
    is_primary = Column(Boolean, default=True)
    
    college = relationship("College", back_populates="domains")

class College(Base):
    __tablename__ = "colleges"

    name = Column(String, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    
    # Advanced Institutional Metadata
    institution_type = Column(String, nullable=True) # e.g. "Engineering College"
    established_year = Column(Integer, nullable=True)
    affiliation = Column(String, nullable=True) # e.g. VTU
    accreditation = Column(String, nullable=True) # e.g. NAAC,NBA
    
    # Official branding & contact
    website = Column(String, nullable=True)
    logo = Column(String, nullable=True)
    official_email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    
    # Full Address
    country = Column(String, nullable=True)
    state = Column(String, nullable=True)
    city = Column(String, nullable=True)
    pin_code = Column(String, nullable=True)
    full_address = Column(String, nullable=True)
    
    # Status
    status = Column(String, default="Active")
    
    # SaaS Subscription & Config
    subscription = Column(String, default="free") # free, pro, enterprise
    storage_limit = Column(Integer, default=10) # in GB
    storage_used = Column(Integer, default=0) # in MB
    
    # User quotas
    max_students = Column(Integer, default=500)
    max_teachers = Column(Integer, default=50)
    max_admins = Column(Integer, default=5)
    
    is_active = Column(Boolean, default=True)

    # Relationships
    domains = relationship("CollegeDomain", back_populates="college", cascade="all, delete-orphan")
    users = relationship("User", back_populates="college")
