import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import DATABASE_URL, Base, User, Classroom, Timetable
from auth import get_password_hash

def populate_vvce_timetable():
    print(f"Connecting to database to populate VVCE CSE VI Section C timetable: {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Create a Teacher User if not already present
        teacher = db.query(User).filter(User.email == "tanuja@vvce.ac.in").first()
        if not teacher:
            print("Registering Faculty Member: Dr. Tanuja Kayarga...")
            teacher = User(
                name="Dr. Tanuja Kayarga",
                email="tanuja@vvce.ac.in",
                password_hash=get_password_hash("secureteacherpass"),
                role="teacher",
                bio="Professor, Department of Computer Science and Engineering, Vidyavardhaka College of Engineering",
                avatar="https://api.dicebear.com/7.x/initials/svg?seed=Tanuja"
            )
            db.add(teacher)
            db.commit()
            db.refresh(teacher)
        else:
            print(f"Faculty Member found: {teacher.name}")
            
        # 2. Define courses from the timetable sheet
        courses = [
            {"code": "BCSML601", "name": "Machine Learning (M410)"},
            {"code": "BCSSS602", "name": "System Software and Compiler Design (M410)"},
            {"code": "BCSBT603", "name": "Blockchain Technology (M410)"},
            {"code": "BIKSK609", "name": "Indian Knowledge System (M410)"},
            {"code": "BRIPK608", "name": "RM and IP Rights (M410)"},
            {"code": "BCELK656X", "name": "Career Elective- II (M410)"},
            {"code": "BITTP607", "name": "TPEC-IV (M306)"},
            {"code": "BCSML601L", "name": "Machine Learning Lab (M301)"},
            {"code": "BCSSS602L", "name": "Compiler Design Lab (M302)"},
            {"code": "OE", "name": "Open Elective (M410)"},
            {"code": "PE", "name": "Professional Elective (M410)"},
            {"code": "NSS_YOGA", "name": "NSS / Yoga Practice"}
        ]
        
        rooms_map = {}
        for c in courses:
            room = db.query(Classroom).join(Course).filter(Course.code == c["code"]).first()
            if not room:
                print(f"Creating subject room: {c['code']} - {c['name']}")
                room = Classroom(
                    name=c["name"],
                    code=c["code"],
                    teacher_id=teacher.id,
                    is_live=False
                )
                db.add(room)
                db.commit()
                db.refresh(room)
            else:
                print(f"Subject room found: {room.code}")
            rooms_map[c["code"]] = room.id
            
        # 3. Define timetable schedule entries according to VVCE time table
        schedules = [
            # Monday
            {"code": "BITTP607", "day": "Monday", "start": "09:00", "end": "11:00", "subject": "TPEC-IV (M306)"},
            {"code": "OE", "day": "Monday", "start": "11:30", "end": "12:30", "subject": "Open Elective"},
            {"code": "BCSML601", "day": "Monday", "start": "12:30", "end": "13:30", "subject": "Machine Learning"},
            {"code": "BIKSK609", "day": "Monday", "start": "14:30", "end": "15:30", "subject": "Indian Knowledge System"},
            
            # Tuesday
            {"code": "BCSSS602", "day": "Tuesday", "start": "09:00", "end": "10:00", "subject": "System Software and Compiler Design"},
            {"code": "OE", "day": "Tuesday", "start": "10:00", "end": "11:00", "subject": "Open Elective"},
            {"code": "BCSML601", "day": "Tuesday", "start": "11:30", "end": "12:30", "subject": "Machine Learning"},
            {"code": "PE", "day": "Tuesday", "start": "12:30", "end": "13:30", "subject": "Professional Elective"},
            {"code": "BRIPK608", "day": "Tuesday", "start": "14:30", "end": "15:30", "subject": "RM and IP Rights"},
            {"code": "BCSBT603", "day": "Tuesday", "start": "15:30", "end": "16:30", "subject": "Blockchain Technology"},
            {"code": "NSS_YOGA", "day": "Tuesday", "start": "16:30", "end": "18:30", "subject": "NSS / Yoga Practice"},
            
            # Wednesday
            {"code": "BCSML601L", "day": "Wednesday", "start": "09:00", "end": "11:00", "subject": "Machine Learning Lab (M301)"},
            {"code": "BCSBT603", "day": "Wednesday", "start": "11:30", "end": "12:30", "subject": "Blockchain Technology"},
            {"code": "OE", "day": "Wednesday", "start": "12:30", "end": "13:30", "subject": "Open Elective"},
            
            # Thursday
            {"code": "BCSML601", "day": "Thursday", "start": "09:00", "end": "10:00", "subject": "Machine Learning"},
            {"code": "PE", "day": "Thursday", "start": "10:00", "end": "11:00", "subject": "Professional Elective"},
            {"code": "BCSBT603", "day": "Thursday", "start": "11:30", "end": "12:30", "subject": "Blockchain Technology"},
            {"code": "BCSSS602", "day": "Thursday", "start": "12:30", "end": "13:30", "subject": "System Software and Compiler Design"},
            {"code": "BCELK656X", "day": "Thursday", "start": "14:30", "end": "16:30", "subject": "Career Elective- II"},
            
            # Friday
            {"code": "BCSSS602L", "day": "Friday", "start": "09:00", "end": "11:00", "subject": "Compiler Design Lab (M302)"},
            {"code": "BCSSS602", "day": "Friday", "start": "11:30", "end": "12:30", "subject": "System Software and Compiler Design"},
            {"code": "PE", "day": "Friday", "start": "12:30", "end": "13:30", "subject": "Professional Elective"},
            {"code": "BCELK656X", "day": "Friday", "start": "14:30", "end": "16:30", "subject": "Career Elective- II"},
        ]
        
        # Clear existing schedules to avoid duplications
        print("Clearing previous timetable rows...")
        db.query(Timetable).delete()
        db.commit()
        
        print("Adding VVCE CSE Sem VI section C timetable blocks...")
        for s in schedules:
            t = Timetable(
                classroom_id=rooms_map[s["code"]],
                day_of_week=s["day"],
                start_time=s["start"],
                end_time=s["end"],
                subject_name=s["subject"]
            )
            db.add(t)
        db.commit()
        print(f"Successfully scheduled {len(schedules)} lecture time slots!")
        
    except Exception as e:
        print(f"Error occurred during population: {e}")
        db.rollback()
    finally:
        db.close()
        
    print("--- VVCE Timetable Setup Complete ---")

if __name__ == "__main__":
    populate_vvce_timetable()
