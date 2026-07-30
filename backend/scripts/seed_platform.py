import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.tenant import College
from app.models.user import User, Role, Permission
from app.core.security import get_password_hash

def seed():
    db: Session = SessionLocal()
    try:
        # Create foundational Permissions
        permissions_data = [
            "manage_colleges", "manage_subscriptions", "manage_users", 
            "manage_roles_perms", "manage_departments", "manage_courses", 
            "manage_storage", "start_lecture", "mark_attendance", 
            "upload_notes", "submit_assignment"
        ]
        
        for p_name in permissions_data:
            if not db.query(Permission).filter(Permission.name == p_name).first():
                db.add(Permission(name=p_name, description=f"Allows {p_name}"))
        db.commit()

        # Create Roles
        super_admin_role = db.query(Role).filter(Role.name == "Super Admin").first()
        if not super_admin_role:
            super_admin_role = Role(name="Super Admin")
            # Super Admin gets all permissions
            super_admin_role.permissions = db.query(Permission).all()
            db.add(super_admin_role)
            
        college_admin_role = db.query(Role).filter(Role.name == "College Admin").first()
        if not college_admin_role:
            college_admin_role = Role(name="College Admin")
            college_admin_role.permissions = db.query(Permission).filter(
                Permission.name.in_(["manage_users", "manage_departments", "manage_courses", "manage_storage"])
            ).all()
            db.add(college_admin_role)

        db.commit()
        
        # Seed Super Admin User
        admin_email = "admin@intellcamp.com"
        if not db.query(User).filter(User.email == admin_email).first():
            super_admin = User(
                full_name="Platform Owner",
                email=admin_email,
                password_hash=get_password_hash("admin"),
                role_id=super_admin_role.id
            )
            db.add(super_admin)
            db.commit()
            print("Successfully seeded Super Admin user.")
            
        print("Platform seed complete.")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
