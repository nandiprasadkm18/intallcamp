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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
        # Use independent room_code if available, fallback to relation, else Unknown
        classroom_code = s.room_code or (s.classroom.course.code if s.classroom and s.classroom.course else "Unknown")
        classroom_name = s.classroom.course.name if s.classroom and s.classroom.course else "Scheduled Class"
        
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
    if user.role.name != "College Admin" and user.role.name != "Super Admin":
        raise HTTPException(status_code=403, detail="Only admins can schedule timetables")
        
    # Verify classroom exists if provided
    classroom = None
    if data.classroom_id is not None:
        classroom = db.query(Classroom).filter(Classroom.id == data.classroom_id).first()
        if not classroom:
            raise HTTPException(status_code=404, detail="Selected classroom does not exist")
        
    new_timetable = Timetable(
        classroom_id=data.classroom_id,
        day_of_week=data.day_of_week,
        start_time=data.start_time,
        end_time=data.end_time,
        subject_name=data.subject_name,
        room_code=classroom.course.code if classroom and classroom.course else None,
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
        classroom_code=new_timetable.room_code or (classroom.course.code if classroom and classroom.course else "Unknown"),
        classroom_name=classroom.course.name if classroom and classroom.course else "Unknown"
    )

from app.schemas.academic import TimetableUpdate

@router.put("/{timetable_id}", response_model=TimetableResponse)
def update_timetable(
    timetable_id: int,
    data: TimetableUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if user.role.name != "College Admin" and user.role.name != "Super Admin":
        raise HTTPException(status_code=403, detail="Only admins can edit timetables")
        
    timetable = db.query(Timetable).filter(Timetable.id == timetable_id).first()
    if not timetable:
        raise HTTPException(status_code=404, detail="Timetable slot not found")
        
    if data.classroom_id is not None:
        classroom = db.query(Classroom).filter(Classroom.id == data.classroom_id).first()
        if not classroom:
            raise HTTPException(status_code=404, detail="Selected classroom does not exist")
        timetable.classroom_id = data.classroom_id

    if data.day_of_week is not None: timetable.day_of_week = data.day_of_week
    if data.start_time is not None: timetable.start_time = data.start_time
    if data.end_time is not None: timetable.end_time = data.end_time
    if data.subject_name is not None: timetable.subject_name = data.subject_name
    if data.year is not None: timetable.year = data.year
    if data.semester is not None: timetable.semester = data.semester
    if data.department is not None: timetable.department = data.department
    if data.section is not None: timetable.section = data.section

    db.commit()
    db.refresh(timetable)
    
    sem_map = {1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th", 6: "6th", 7: "7th", 8: "8th"}
    sem_str = sem_map.get(timetable.semester, f"{timetable.semester}th")
    res_section_string = f"{sem_str} Sem {timetable.section}"
    
    return TimetableResponse(
        id=timetable.id,
        classroom_id=timetable.classroom_id,
        day_of_week=timetable.day_of_week,
        start_time=timetable.start_time,
        end_time=timetable.end_time,
        subject_name=timetable.subject_name,
        year=timetable.year,
        semester=timetable.semester,
        department=timetable.department,
        section=res_section_string,
        classroom_code=timetable.room_code or (timetable.classroom.course.code if timetable.classroom and timetable.classroom.course else "Unknown"),
        classroom_name=timetable.classroom.course.name if timetable.classroom and timetable.classroom.course else "Scheduled Class"
    )

@router.delete("/{timetable_id}")
def delete_timetable(
    timetable_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if user.role.name != "College Admin" and user.role.name != "Super Admin":
        raise HTTPException(status_code=403, detail="Only admins can delete timetables")
        
    timetable = db.query(Timetable).filter(Timetable.id == timetable_id).first()
    if not timetable:
        raise HTTPException(status_code=404, detail="Timetable slot not found")
        
    db.delete(timetable)
    db.commit()
    return {"message": "Timetable slot deleted successfully"}

