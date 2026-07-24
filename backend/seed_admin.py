import os
from sqlalchemy.orm import Session
from database import SessionLocal, User, init_db
from auth import get_password_hash

def seed_admin():
    # Ensure tables exist
    init_db()
    
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin_email = "admin@gmail.com"
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        
        if existing_admin:
            print(f"Admin account '{admin_email}' already exists. Updating password to ensure access.")
            existing_admin.password_hash = get_password_hash("admin")
            db.commit()
        else:
            print(f"Creating master admin account: {admin_email}")
            admin_user = User(
                name="System Administrator",
                email=admin_email,
                password_hash=get_password_hash("admin"),
                role="admin",
                bio="Master System Administrator",
                avatar="https://api.dicebear.com/7.x/initials/svg?seed=SystemAdmin"
            )
            db.add(admin_user)
            db.commit()
            print("Master admin account created successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
