from database import SessionLocal, Classroom

def delete_all_classrooms():
    db = SessionLocal()
    try:
        classrooms = db.query(Classroom).all()
        count = len(classrooms)
        for c in classrooms:
            db.delete(c)
        db.commit()
        print(f"SUCCESS: Successfully deleted {count} classrooms along with all cascading transcripts, doubts, resources, attendance, and timetables.")
    except Exception as e:
        print("ERROR:", e)
    finally:
        db.close()

if __name__ == "__main__":
    delete_all_classrooms()
