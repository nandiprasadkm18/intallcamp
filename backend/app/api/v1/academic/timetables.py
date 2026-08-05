from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.dependencies import get_db
from app.models.academic import Timetable
from app.api.dependencies import get_current_user
from app.models.activity import Classroom
from app.models.user import User
from app.schemas.academic import TimetableCreate, TimetableResponse

router = APIRouter()

@router.get("", response_model=List[TimetableResponse])
def get_timetables(
    section: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    semester: Optional[int] = Query(None),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Timetable)
    
    if year is not None:
        query = query.filter(Timetable.year == year)
    if semester is not None:
        query = query.filter(Timetable.semester == semester)
    if department is not None:
        query = query.filter(Timetable.department == department)
    if section is not None:
        query = query.filter(Timetable.section == section)
        
    schedules = query.all()
    
    res = []
    for s in schedules:
        # Join classroom code via Course relationship (from Classroom)
        classroom_code = s.classroom.course.code if s.classroom and s.classroom.course else "Unknown"
        classroom_name = s.classroom.course.name if s.classroom and s.classroom.course else "Unknown"
        
        sem_map = {1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th", 6: "6th", 7: "7th", 8: "8th"}
        sem_str = sem_map.get(s.semester, f"{s.semester}th")
        
        # To maintain compatibility with UI Target Class rendering format
        res_section_string = f"{sem_str} Sem {s.section}"

        res.append(TimetableResponse(
            id=s.id,
            classroom_id=s.classroom_id,
            day_of_week=s.day_of_week,
            start_time=s.start_time,
            end_time=s.end_time,
            subject_name=s.subject_name,
            year=s.year,
            semester=s.semester,
            department=s.department,
            section=res_section_string, # Send this so the UI renders it cleanly
            classroom_code=classroom_code,
            classroom_name=classroom_name
        ))
    return res

@router.post("", response_model=TimetableResponse)
def create_timetable(
    data: TimetableCreate, 
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    # Authorization checks could be expanded here
    if user.role != "College Admin" and user.role != "Super Admin":
        raise HTTPException(status_code=403, detail="Only admins can schedule timetables")
        
    # Verify classroom exists
    classroom = db.query(Classroom).filter(Classroom.id == data.classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Selected classroom does not exist")
        
    new_timetable = Timetable(
        classroom_id=data.classroom_id,
        day_of_week=data.day_of_week,
        start_time=data.start_time,
        end_time=data.end_time,
        subject_name=data.subject_name,
        year=data.year,
        semester=data.semester,
        department=data.department,
        section=data.section
    )
    
    db.add(new_timetable)
    db.commit()
    db.refresh(new_timetable)
    
    sem_map = {1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th", 6: "6th", 7: "7th", 8: "8th"}
    sem_str = sem_map.get(new_timetable.semester, f"{new_timetable.semester}th")
    res_section_string = f"{sem_str} Sem {new_timetable.section}"
    
    return TimetableResponse(
        id=new_timetable.id,
        classroom_id=new_timetable.classroom_id,
        day_of_week=new_timetable.day_of_week,
        start_time=new_timetable.start_time,
        end_time=new_timetable.end_time,
        subject_name=new_timetable.subject_name,
        year=new_timetable.year,
        semester=new_timetable.semester,
        department=new_timetable.department,
        section=res_section_string,
        classroom_code=classroom.course.code if classroom.course else "Unknown",
        classroom_name=classroom.course.name if classroom.course else "Unknown"
    )
