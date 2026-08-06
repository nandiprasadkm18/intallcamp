import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.db.session import SessionLocal
from app.models.academic import Timetable

db = SessionLocal()
try:
    timetables = db.query(Timetable).all()
    for t in timetables:
        if t.section and "Sem" in t.section:
            # It's corrupted like "7th Sem A", we want "A"
            parts = t.section.split(" ")
            if len(parts) > 0:
                correct_section = parts[-1]
                t.section = correct_section
                print(f"Fixed timetable {t.id} section to {correct_section}")
    
    db.commit()
    print("Done fixing database.")
except Exception as e:
    print(e)
finally:
    db.close()
