from app.db.session import SessionLocal
from app.models.academic import Department, Program, Semester, Section, Course, Timetable
from app.models.activity import Classroom

def seed():
    db = SessionLocal()
    
    # 1. Ensure basic hierarchy exists
    dept = db.query(Department).first()
    if not dept:
        dept = Department(college_id=1, name="General Dept", code="GEN")
        db.add(dept)
        db.commit()
    
    prog = db.query(Program).first()
    if not prog:
        prog = Program(department_id=dept.id, name="General Program", degree_level="Bachelors")
        db.add(prog)
        db.commit()
        
    sem = db.query(Semester).first()
    if not sem:
        sem = Semester(program_id=prog.id, term_name="Semester 1")
        db.add(sem)
        db.commit()
        
    sec = db.query(Section).first()
    if not sec:
        sec = Section(semester_id=sem.id, name="A")
        db.add(sec)
        db.commit()
        
    rooms = {"A": "M408", "B": "M409", "C": "M410", "D": "M411"}
    room_ids = {}
    
    for section_char, room_name in rooms.items():
        course = db.query(Course).filter(Course.code == room_name).first()
        if not course:
            course = Course(section_id=sec.id, name=room_name, code=room_name, credits=3)
            db.add(course)
            db.commit()
            
        classroom = db.query(Classroom).filter(Classroom.course_id == course.id).first()
        if not classroom:
            classroom = Classroom(college_id=1, course_id=course.id, teacher_id=1, status="scheduled")
            db.add(classroom)
            db.commit()
            
        room_ids[section_char] = classroom.id
        
    # Data to insert
    timetable_data = [
        # SECTION A (M408)
        ("A", "Monday", "08:00 AM", "09:00 AM", "UI/UX Design", "M408"),
        ("A", "Monday", "09:00 AM", "10:00 AM", "SAN", "M408"),
        ("A", "Monday", "10:30 AM", "11:30 AM", "NoSQL Database", "M408"),
        ("A", "Monday", "11:30 AM", "12:30 PM", "PE-III", "M408"),
        ("A", "Tuesday", "08:00 AM", "09:00 AM", "NoSQL Database", "M408"),
        ("A", "Tuesday", "09:00 AM", "10:00 AM", "PE-III", "M408"),
        ("A", "Tuesday", "10:30 AM", "11:30 AM", "SAN", "M408"),
        ("A", "Tuesday", "11:30 AM", "12:30 PM", "UI/UX Design", "M408"),
        ("A", "Wednesday", "08:00 AM", "09:00 AM", "SAN", "M408"),
        ("A", "Wednesday", "09:00 AM", "10:00 AM", "NoSQL Database", "M408"),
        ("A", "Wednesday", "10:30 AM", "11:30 AM", "PE-III", "M408"),
        ("A", "Wednesday", "11:30 AM", "12:30 PM", "UI/UX Design", "M408"),
        ("A", "Wednesday", "01:30 PM", "04:30 PM", "NoSQL Database Lab", "M301"),
        ("A", "Thursday", "08:00 AM", "12:30 PM", "Major Project (Phase-I)", None),
        ("A", "Thursday", "01:30 PM", "04:30 PM", "Major Project (Phase-I)", None),
        ("A", "Friday", "08:00 AM", "12:30 PM", "Major Project (Phase-I)", None),
        ("A", "Friday", "01:30 PM", "04:30 PM", "Major Project (Phase-I)", None),
        
        # SECTION B (M409)
        ("B", "Monday", "08:00 AM", "09:00 AM", "UI/UX Design", "M409"),
        ("B", "Monday", "09:00 AM", "10:00 AM", "NoSQL Database", "M409"),
        ("B", "Monday", "10:30 AM", "11:30 AM", "SAN", "M409"),
        ("B", "Monday", "11:30 AM", "12:30 PM", "PE-III", "M409"),
        ("B", "Tuesday", "08:00 AM", "09:00 AM", "SAN", "M409"),
        ("B", "Tuesday", "09:00 AM", "10:00 AM", "PE-III", "M409"),
        ("B", "Tuesday", "10:30 AM", "11:30 AM", "UI/UX Design", "M409"),
        ("B", "Tuesday", "11:30 AM", "12:30 PM", "NoSQL Database", "M409"),
        ("B", "Wednesday", "08:00 AM", "09:00 AM", "NoSQL Database", "M409"),
        ("B", "Wednesday", "09:00 AM", "10:00 AM", "UI/UX Design", "M409"),
        ("B", "Wednesday", "10:30 AM", "11:30 AM", "PE-III", "M409"),
        ("B", "Wednesday", "11:30 AM", "12:30 PM", "SAN", "M409"),
        ("B", "Wednesday", "01:30 PM", "04:30 PM", "NoSQL Database Lab", "M302"),
        ("B", "Thursday", "08:00 AM", "12:30 PM", "Major Project (Phase-I)", None),
        ("B", "Friday", "08:00 AM", "12:30 PM", "Major Project (Phase-I)", None),
        
        # SECTION C (M410)
        ("C", "Monday", "08:00 AM", "09:00 AM", "UI/UX Design", "M410"),
        ("C", "Monday", "09:00 AM", "10:00 AM", "SAN", "M410"),
        ("C", "Monday", "10:30 AM", "11:30 AM", "NoSQL Database", "M410"),
        ("C", "Monday", "11:30 AM", "12:30 PM", "PE-III", "M410"),
        ("C", "Tuesday", "08:00 AM", "09:00 AM", "UI/UX Design", "M410"),
        ("C", "Tuesday", "09:00 AM", "10:00 AM", "PE-III", "M410"),
        ("C", "Tuesday", "10:30 AM", "11:30 AM", "SAN", "M410"),
        ("C", "Tuesday", "11:30 AM", "12:30 PM", "NoSQL Database", "M410"),
        ("C", "Tuesday", "01:30 PM", "04:30 PM", "NoSQL Database Lab", "M301"),
        ("C", "Wednesday", "08:00 AM", "09:00 AM", "SAN", "M410"),
        ("C", "Wednesday", "09:00 AM", "10:00 AM", "UI/UX Design", "M410"),
        ("C", "Wednesday", "10:30 AM", "11:30 AM", "PE-III", "M410"),
        ("C", "Wednesday", "11:30 AM", "12:30 PM", "NoSQL Database", "M410"),
        ("C", "Thursday", "08:00 AM", "12:30 PM", "Major Project (Phase-I)", None),
        ("C", "Thursday", "01:30 PM", "04:30 PM", "Major Project (Phase-I)", None),
        ("C", "Friday", "08:00 AM", "12:30 PM", "Major Project (Phase-I)", None),
        ("C", "Friday", "01:30 PM", "04:30 PM", "Major Project (Phase-I)", None),
        
        # SECTION D (M411)
        ("D", "Monday", "08:00 AM", "09:00 AM", "UI/UX Design", "M411"),
        ("D", "Monday", "09:00 AM", "10:00 AM", "SAN", "M411"),
        ("D", "Monday", "10:30 AM", "11:30 AM", "NoSQL Database", "M411"),
        ("D", "Monday", "11:30 AM", "12:30 PM", "PE-III", "M411"),
        ("D", "Tuesday", "08:00 AM", "09:00 AM", "NoSQL Database", "M411"),
        ("D", "Tuesday", "09:00 AM", "10:00 AM", "PE-III", "M411"),
        ("D", "Tuesday", "10:30 AM", "11:30 AM", "UI/UX Design", "M411"),
        ("D", "Tuesday", "11:30 AM", "12:30 PM", "SAN", "M411"),
        ("D", "Tuesday", "01:30 PM", "04:30 PM", "NoSQL Database Lab", "M302"),
        ("D", "Wednesday", "08:00 AM", "09:00 AM", "SAN", "M411"),
        ("D", "Wednesday", "09:00 AM", "10:00 AM", "NoSQL Database", "M411"),
        ("D", "Wednesday", "10:30 AM", "11:30 AM", "PE-III", "M411"),
        ("D", "Wednesday", "11:30 AM", "12:30 PM", "UI/UX Design", "M411"),
        ("D", "Thursday", "08:00 AM", "12:30 PM", "Major Project (Phase-I)", None),
        ("D", "Thursday", "01:30 PM", "04:30 PM", "Major Project (Phase-I)", None),
        ("D", "Friday", "08:00 AM", "12:30 PM", "Major Project (Phase-I)", None),
        ("D", "Friday", "01:30 PM", "04:30 PM", "Major Project (Phase-I)", None),
    ]
    
    # Insert data
    db.query(Timetable).delete() # Clear existing
    for sec, day, start, end, sub, rcode in timetable_data:
        t = Timetable(
            classroom_id=room_ids[sec],
            day_of_week=day,
            start_time=start,
            end_time=end,
            subject_name=sub,
            room_code=rcode,
            year=4,
            semester=7,
            department="CSE",
            section=sec
        )
        db.add(t)
    
    db.commit()
    print("Seeded 4th Year, 7th Sem, CSE timetables successfully!")

if __name__ == "__main__":
    seed()
