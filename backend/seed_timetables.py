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
        # SECTION A
        ("A", "Monday", "08:00 AM", "09:00 AM", "UI/UX Design"),
        ("A", "Monday", "09:00 AM", "10:00 AM", "PE-IV"),
        ("A", "Monday", "10:30 AM", "11:30 AM", "NoSQL Database"),
        ("A", "Monday", "11:30 AM", "12:30 PM", "PE-III"),
        ("A", "Tuesday", "08:00 AM", "09:00 AM", "NoSQL Database"),
        ("A", "Tuesday", "09:00 AM", "10:00 AM", "PE-III"),
        ("A", "Tuesday", "10:30 AM", "11:30 AM", "PE-IV"),
        ("A", "Tuesday", "11:30 AM", "12:30 PM", "UI/UX Design"),
        ("A", "Wednesday", "08:00 AM", "09:00 AM", "PE-IV"),
        ("A", "Wednesday", "09:00 AM", "10:00 AM", "NoSQL Database"),
        ("A", "Wednesday", "10:30 AM", "11:30 AM", "PE-III"),
        ("A", "Wednesday", "11:30 AM", "12:30 PM", "UI/UX Design"),
        ("A", "Wednesday", "01:30 PM", "04:30 PM", "Major Project (Phase-I)"),
        ("A", "Thursday", "08:00 AM", "12:30 PM", "Major Project (Phase-I)"),
        ("A", "Thursday", "01:30 PM", "04:30 PM", "Major Project (Phase-I)"),
        ("A", "Friday", "08:00 AM", "12:30 PM", "Major Project (Phase-I)"),
        ("A", "Friday", "01:30 PM", "04:30 PM", "Major Project (Phase-I)"),
        
        # SECTION B
        ("B", "Monday", "08:00 AM", "09:00 AM", "UI/UX Design"),
        ("B", "Monday", "09:00 AM", "10:00 AM", "NoSQL Database"),
        ("B", "Monday", "10:30 AM", "11:30 AM", "PE-IV"),
        ("B", "Monday", "11:30 AM", "12:30 PM", "PE-III"),
        ("B", "Tuesday", "08:00 AM", "09:00 AM", "PE-IV"),
        ("B", "Tuesday", "09:00 AM", "10:00 AM", "PE-III"),
        ("B", "Tuesday", "10:30 AM", "11:30 AM", "UI/UX Design"),
        ("B", "Tuesday", "11:30 AM", "12:30 PM", "NoSQL Database"),
        ("B", "Wednesday", "08:00 AM", "09:00 AM", "NoSQL Database"),
        ("B", "Wednesday", "09:00 AM", "10:00 AM", "UI/UX Design"),
        ("B", "Wednesday", "10:30 AM", "11:30 AM", "PE-III"),
        ("B", "Wednesday", "11:30 AM", "12:30 PM", "PE-IV"),
        ("B", "Wednesday", "01:30 PM", "04:30 PM", "Major Project (Phase-I)"),
        ("B", "Thursday", "08:00 AM", "12:30 PM", "Major Project (Phase-I)"),
        ("B", "Thursday", "01:30 PM", "04:30 PM", "Major Project (Phase-I)"),
        ("B", "Friday", "08:00 AM", "12:30 PM", "Major Project (Phase-I)"),
        ("B", "Friday", "01:30 PM", "04:30 PM", "Major Project (Phase-I)"),
        
        # SECTION C
        ("C", "Monday", "08:00 AM", "09:00 AM", "UI/UX Design"),
        ("C", "Monday", "09:00 AM", "10:00 AM", "PE-IV"),
        ("C", "Monday", "10:30 AM", "11:30 AM", "NoSQL Database"),
        ("C", "Monday", "11:30 AM", "12:30 PM", "PE-III"),
        ("C", "Tuesday", "08:00 AM", "09:00 AM", "UI/UX Design"),
        ("C", "Tuesday", "09:00 AM", "10:00 AM", "PE-III"),
        ("C", "Tuesday", "10:30 AM", "11:30 AM", "PE-IV"),
        ("C", "Tuesday", "11:30 AM", "12:30 PM", "NoSQL Database"),
        ("C", "Tuesday", "01:30 PM", "04:30 PM", "Major Project (Phase-I)"),
        ("C", "Wednesday", "08:00 AM", "09:00 AM", "PE-IV"),
        ("C", "Wednesday", "09:00 AM", "10:00 AM", "UI/UX Design"),
        ("C", "Wednesday", "10:30 AM", "11:30 AM", "PE-III"),
        ("C", "Wednesday", "11:30 AM", "12:30 PM", "NoSQL Database"),
        ("C", "Thursday", "08:00 AM", "12:30 PM", "Major Project (Phase-I)"),
        ("C", "Thursday", "01:30 PM", "04:30 PM", "Major Project (Phase-I)"),
        ("C", "Friday", "08:00 AM", "12:30 PM", "Major Project (Phase-I)"),
        ("C", "Friday", "01:30 PM", "04:30 PM", "Major Project (Phase-I)"),
        
        # SECTION D
        ("D", "Monday", "08:00 AM", "09:00 AM", "UI/UX Design"),
        ("D", "Monday", "09:00 AM", "10:00 AM", "PE-IV"),
        ("D", "Monday", "10:30 AM", "11:30 AM", "NoSQL Database"),
        ("D", "Monday", "11:30 AM", "12:30 PM", "PE-III"),
        ("D", "Tuesday", "08:00 AM", "09:00 AM", "NoSQL Database"),
        ("D", "Tuesday", "09:00 AM", "10:00 AM", "PE-III"),
        ("D", "Tuesday", "10:30 AM", "11:30 AM", "UI/UX Design"),
        ("D", "Tuesday", "11:30 AM", "12:30 PM", "PE-IV"),
        ("D", "Tuesday", "01:30 PM", "04:30 PM", "Major Project (Phase-I)"),
        ("D", "Wednesday", "08:00 AM", "09:00 AM", "PE-IV"),
        ("D", "Wednesday", "09:00 AM", "10:00 AM", "NoSQL Database"),
        ("D", "Wednesday", "10:30 AM", "11:30 AM", "PE-III"),
        ("D", "Wednesday", "11:30 AM", "12:30 PM", "UI/UX Design"),
        ("D", "Thursday", "08:00 AM", "12:30 PM", "Major Project (Phase-I)"),
        ("D", "Thursday", "01:30 PM", "04:30 PM", "Major Project (Phase-I)"),
        ("D", "Friday", "08:00 AM", "12:30 PM", "Major Project (Phase-I)"),
        ("D", "Friday", "01:30 PM", "04:30 PM", "Major Project (Phase-I)"),
    ]
    
    # Insert data
    db.query(Timetable).delete() # Clear existing
    for sec, day, start, end, sub in timetable_data:
        t = Timetable(
            classroom_id=room_ids[sec],
            day_of_week=day,
            start_time=start,
            end_time=end,
            subject_name=sub,
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
