import os
import json
import datetime
from typing import Dict, List, Any
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database import init_db, get_db, User, Classroom, Transcript, Doubt, Resource, Attendance, Department, Timetable, Announcement
from auth import create_access_token, get_password_hash, verify_password, get_current_user
from ai_service import AIService

# Initialize DB tables on startup
init_db()

app = FastAPI(title="INTELLCAMP Smart Classroom API", version="1.0.0")

# Enable CORS for frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
class ConnectionManager:
    def __init__(self):
        # Room Code -> Dict mapping WebSocket -> User metadata dict {"user_name": str, "user_id": str}
        self.active_connections: Dict[str, Dict[WebSocket, Dict[str, Any]]] = {}
        # Room Code -> Current Code in Collaborative Editor
        self.room_code_state: Dict[str, Dict[str, Any]] = {}
        # Active transcription tasks / counters for classrooms
        self.transcription_steps: Dict[str, int] = {}

    async def connect(self, websocket: WebSocket, room: str, user_name: str, user_id: str):
        await websocket.accept()
        if room not in self.active_connections:
            self.active_connections[room] = {}
        
        self.active_connections[room][websocket] = {
            "user_name": user_name,
            "user_id": user_id
        }
        
        # Initialize default code state for room if not exists
        if room not in self.room_code_state:
            self.room_code_state[room] = {
                "code": "// Write academic code here...\nfunction calculateAttention(q, k, v) {\n  return softmax(multiply(q, transpose(k))).multiply(v);\n}",
                "language": "javascript"
            }
            
        # Send initial code state to the newly connected user
        await websocket.send_json({
            "type": "code_sync",
            "code": self.room_code_state[room]["code"],
            "language": self.room_code_state[room]["language"]
        })
        
        # Broadcast updated active students list to all users in the room
        await self.broadcast_connections_update(room)

    def disconnect(self, websocket: WebSocket, room: str):
        if room in self.active_connections:
            if websocket in self.active_connections[room]:
                del self.active_connections[room][websocket]
            if not self.active_connections[room]:
                del self.active_connections[room]

    async def broadcast_connections_update(self, room: str):
        if room in self.active_connections:
            users_list = [
                {"user_name": info["user_name"], "user_id": info["user_id"]}
                for info in self.active_connections[room].values()
            ]
            await self.broadcast_to_room(room, {
                "type": "connections_update",
                "active_students": users_list,
                "count": len(users_list)
            })

    async def broadcast_to_room(self, room: str, message: dict):
        if room in self.active_connections:
            for connection in list(self.active_connections[room].keys()):
                try:
                    await connection.send_json(message)
                except Exception:
                    # Stale connection
                    pass



manager = ConnectionManager()

# ==========================================
# Authentication Endpoints
# ==========================================
@app.post("/api/auth/signup")
def signup(data: dict, db: Session = Depends(get_db)):
    email = data.get("email")
    name = data.get("name")
    password = data.get("password")
    role = data.get("role", "student")

    if not email or not name or not password:
        raise HTTPException(status_code=400, detail="Missing required credentials")

    if role == "admin":
        raise HTTPException(status_code=403, detail="Admin registration is restricted. Please contact system administrator.")

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")

    user = User(
        name=name,
        email=email,
        password_hash=get_password_hash(password),
        role=role,
        bio=f"Modern Academic User - Role: {role.capitalize()}",
        avatar=f"https://api.dicebear.com/7.x/initials/svg?seed={name}"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "bio": user.bio,
            "avatar": user.avatar
        }
    }

@app.post("/api/auth/login")
def login(data: dict, db: Session = Depends(get_db)):
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "bio": user.bio,
            "avatar": user.avatar
        }
    }

@app.get("/api/auth/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "bio": user.bio,
        "avatar": user.avatar
    }

# ==========================================
# Classroom Endpoints
# ==========================================
@app.post("/api/classrooms")
def create_classroom(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "teacher" and user.role != "admin":
        raise HTTPException(status_code=403, detail="Only teachers or admins can create classrooms")

    name = data.get("name")
    code = data.get("code")

    if not name or not code:
        raise HTTPException(status_code=400, detail="Classroom name and code are required")

    existing = db.query(Classroom).filter(Classroom.code == code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Classroom code already exists")

    classroom = Classroom(
        name=name,
        code=code.upper(),
        teacher_id=user.id,
        is_live=False
    )
    db.add(classroom)
    db.commit()
    db.refresh(classroom)

    return classroom

@app.delete("/api/classrooms/{code}")
def delete_classroom(code: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    classroom = db.query(Classroom).filter(Classroom.code == code.upper()).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    if user.role != "admin" and classroom.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Only the assigned teacher or an administrator can delete this classroom")

    db.delete(classroom)
    db.commit()
    return {"status": "success", "message": f"Classroom {code.upper()} deleted successfully"}

@app.get("/api/classrooms")
def get_classrooms(db: Session = Depends(get_db)):
    rooms = db.query(Classroom).all()
    res = []
    for r in rooms:
        active_count = len(manager.active_connections.get(r.code, {}))
        res.append({
            "id": r.id,
            "name": r.name,
            "code": r.code,
            "teacher_id": r.teacher_id,
            "is_live": r.is_live,
            "created_at": r.created_at,
            "active_students_count": active_count
        })
    return res

@app.get("/api/classrooms/{code}")
def get_classroom_by_code(code: str, db: Session = Depends(get_db)):
    classroom = db.query(Classroom).filter(Classroom.code == code.upper()).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
        
    active_count = len(manager.active_connections.get(classroom.code, {}))
    # Build nice response with teacher details
    return {
        "id": classroom.id,
        "name": classroom.name,
        "code": classroom.code,
        "is_live": classroom.is_live,
        "teacher_name": classroom.teacher.name if classroom.teacher else "Unknown Instructor",
        "created_at": classroom.created_at,
        "active_students_count": active_count
    }


@app.put("/api/classrooms/{code}/live")
def toggle_classroom_live(code: str, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "teacher" and user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")

    classroom = db.query(Classroom).filter(Classroom.code == code.upper()).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    is_live = data.get("is_live", False)
    classroom.is_live = is_live
    db.commit()

    # Clear logs or state if closing session
    if not is_live:
        if code.upper() in manager.transcription_steps:
            del manager.transcription_steps[code.upper()]

    return {"status": "success", "is_live": is_live}

# ==========================================
# Transcript Endpoints
# ==========================================
@app.get("/api/classrooms/{code}/transcripts")
def get_transcripts(code: str, db: Session = Depends(get_db)):
    classroom = db.query(Classroom).filter(Classroom.code == code.upper()).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    transcripts = db.query(Transcript).filter(Transcript.classroom_id == classroom.id).order_by(Transcript.id.asc()).all()
    return transcripts

@app.post("/api/classrooms/{code}/transcripts")
def add_transcript(code: str, data: dict, db: Session = Depends(get_db)):
    classroom = db.query(Classroom).filter(Classroom.code == code.upper()).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    text = data.get("text")
    timestamp = data.get("timestamp", datetime.datetime.utcnow().strftime("%H:%M:%S"))

    transcript = Transcript(
        classroom_id=classroom.id,
        text=text,
        timestamp=timestamp
    )
    db.add(transcript)
    db.commit()
    db.refresh(transcript)
    return transcript

@app.delete("/api/classrooms/{code}/transcripts")
def clear_transcripts(code: str, db: Session = Depends(get_db)):
    classroom = db.query(Classroom).filter(Classroom.code == code.upper()).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    db.query(Transcript).filter(Transcript.classroom_id == classroom.id).delete()
    db.commit()
    return {"status": "success", "message": "Transcript records cleared"}

# ==========================================
# Doubts & Ghost Queries Endpoints
# ==========================================
@app.get("/api/classrooms/{code}/doubts")
def get_doubts(code: str, db: Session = Depends(get_db)):
    classroom = db.query(Classroom).filter(Classroom.code == code.upper()).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    doubts = db.query(Doubt).filter(Doubt.classroom_id == classroom.id).order_by(Doubt.id.desc()).all()
    
    result = []
    for d in doubts:
        result.append({
            "id": d.id,
            "question": d.question,
            "ai_answer": d.ai_answer,
            "is_anonymous": d.is_anonymous,
            "is_resolved": d.is_resolved,
            "student_name": "Anonymous Student" if d.is_anonymous or not d.student else d.student.name,
            "created_at": d.created_at
        })
    return result

# ==========================================
# Attendance & Analytics Endpoints
# ==========================================
@app.get("/api/classrooms/{code}/attendance")
def get_attendance(code: str, db: Session = Depends(get_db)):
    classroom = db.query(Classroom).filter(Classroom.code == code.upper()).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    records = db.query(Attendance).filter(Attendance.classroom_id == classroom.id).all()
    
    result = []
    for r in records:
        result.append({
            "id": r.id,
            "student_name": r.student.name if r.student else "Unknown Student",
            "date": r.date,
            "status": r.status,
            "engagement_score": r.engagement_score
        })
    return result

@app.post("/api/classrooms/{code}/attendance/simulate")
def generate_mock_attendance(code: str, db: Session = Depends(get_db)):
    """Simulates realistic attendance records for standard analytical metrics."""
    classroom = db.query(Classroom).filter(Classroom.code == code.upper()).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    students = db.query(User).filter(User.role == "student").all()
    if not students:
        raise HTTPException(status_code=400, detail="No registered student users to simulate attendance")
        
    date_str = datetime.date.today().strftime("%Y-%m-%d")
    
    # Delete today's records if any to avoid duplication
    db.query(Attendance).filter(
        Attendance.classroom_id == classroom.id,
        Attendance.date == date_str
    ).delete()
    
    # Add new simulated records
    for s in students:
        status_val = "present" if datetime.datetime.now().microsecond % 100 > 15 else "absent"
        engagement = float(datetime.datetime.now().microsecond % 40 + 60) if status_val == "present" else 0.0
        
        rec = Attendance(
            classroom_id=classroom.id,
            student_id=s.id,
            date=date_str,
            status=status_val,
            engagement_score=engagement
        )
        db.add(rec)
        
    db.commit()
    return {"status": "success", "message": f"Simulated attendance records for {len(students)} students."}

# ==========================================
# Resources Management Endpoints
# ==========================================
@app.get("/api/classrooms/{code}/resources")
def get_resources(code: str, db: Session = Depends(get_db)):
    classroom = db.query(Classroom).filter(Classroom.code == code.upper()).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return db.query(Resource).filter(Resource.classroom_id == classroom.id).order_by(Resource.id.desc()).all()

@app.post("/api/classrooms/{code}/resources")
def upload_resource(code: str, data: dict, db: Session = Depends(get_db)):
    classroom = db.query(Classroom).filter(Classroom.code == code.upper()).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    title = data.get("title")
    file_type = data.get("file_type", "PDF")
    file_size = data.get("file_size", "2.4 MB")

    if not title:
        raise HTTPException(status_code=400, detail="Resource title is required")

    res = Resource(
        classroom_id=classroom.id,
        title=title,
        file_type=file_type,
        file_size=file_size,
        downloads=0
    )
    db.add(res)
    db.commit()
    db.refresh(res)
    return res

@app.post("/api/resources/{id}/download")
def download_resource(id: int, db: Session = Depends(get_db)):
    resource = db.query(Resource).filter(Resource.id == id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    resource.downloads += 1
    db.commit()
    return {"status": "success", "downloads": resource.downloads}

# ==========================================
# Admin Control Panel Endpoints
# ==========================================
@app.get("/api/admin/users")
def get_admin_users(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    return db.query(User).all()

@app.post("/api/admin/users")
def create_admin_user(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    email = data.get("email")
    name = data.get("name")
    password = data.get("password")
    role = data.get("role", "student")

    if not email or not name or not password:
        raise HTTPException(status_code=400, detail="Missing required credentials")

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")

    new_user = User(
        name=name,
        email=email,
        password_hash=get_password_hash(password),
        role=role,
        bio=f"System Managed Account - Role: {role.capitalize()}",
        avatar=f"https://api.dicebear.com/7.x/initials/svg?seed={name}"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.delete("/api/admin/users/{id}")
def delete_admin_user(id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    target = db.query(User).filter(User.id == id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot delete currently logged-in administrator")
    db.delete(target)
    db.commit()
    return {"status": "success", "message": "User deleted successfully"}

@app.put("/api/admin/classrooms/{id}/assign")
def assign_classroom_teacher(id: int, data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    classroom = db.query(Classroom).filter(Classroom.id == id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    teacher_id = data.get("teacher_id")
    teacher = db.query(User).filter(User.id == teacher_id, User.role == "teacher").first()
    if not teacher and teacher_id is not None:
        raise HTTPException(status_code=400, detail="Specified user does not exist or is not a registered teacher")
    
    classroom.teacher_id = teacher_id
    db.commit()
    return {"status": "success", "classroom": classroom}

@app.get("/api/admin/departments")
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@app.post("/api/admin/departments")
def create_department(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    name = data.get("name")
    code = data.get("code")
    if not name or not code:
        raise HTTPException(status_code=400, detail="Department name and code are required")
    
    existing = db.query(Department).filter(Department.code == code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department code already exists")

    dept = Department(name=name, code=code.upper())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

@app.get("/api/admin/timetables")
def get_timetables(db: Session = Depends(get_db)):
    schedules = db.query(Timetable).all()
    res = []
    for s in schedules:
        res.append({
            "id": s.id,
            "classroom_id": s.classroom_id,
            "classroom_name": s.classroom.name if s.classroom else "Unknown Subject",
            "classroom_code": s.classroom.code if s.classroom else "N/A",
            "day_of_week": s.day_of_week,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "subject_name": s.subject_name
        })
    return res

@app.post("/api/admin/timetables")
def create_timetable(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    classroom_id = data.get("classroom_id")
    day_of_week = data.get("day_of_week")
    start_time = data.get("start_time")
    end_time = data.get("end_time")
    subject_name = data.get("subject_name")

    if not classroom_id or not day_of_week or not start_time or not end_time or not subject_name:
        raise HTTPException(status_code=400, detail="All schedule fields are required")

    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Selected classroom does not exist")

    schedule = Timetable(
        classroom_id=classroom_id,
        day_of_week=day_of_week,
        start_time=start_time,
        end_time=end_time,
        subject_name=subject_name
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule

@app.get("/api/admin/system/metrics")
def get_system_metrics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    
    total_users = db.query(User).count()
    students_count = db.query(User).filter(User.role == "student").count()
    teachers_count = db.query(User).filter(User.role == "teacher").count()
    admins_count = db.query(User).filter(User.role == "admin").count()
    
    classrooms_count = db.query(Classroom).count()
    active_classrooms = db.query(Classroom).filter(Classroom.is_live == True).count()
    departments_count = db.query(Department).count()
    doubts_count = db.query(Doubt).count()
    transcripts_count = db.query(Transcript).count()
    resources_count = db.query(Resource).count()
    announcements_count = db.query(Announcement).count()
    
    active_socket_connections = sum(len(room.keys()) for room in manager.active_connections.values())

    return {
        "status": "healthy",
        "cpu_usage": 12.5,
        "memory_usage": 45.2,
        "database_health": "excellent",
        "metrics": {
            "users": {
                "total": total_users,
                "students": students_count,
                "teachers": teachers_count,
                "admins": admins_count
            },
            "classrooms": {
                "total": classrooms_count,
                "active_live": active_classrooms
            },
            "departments": departments_count,
            "doubts": doubts_count,
            "transcripts": transcripts_count,
            "resources": resources_count,
            "announcements": announcements_count,
            "active_sockets": active_socket_connections
        }
    }

@app.get("/api/student/dashboard/metrics")
def get_student_dashboard_metrics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "student":
        raise HTTPException(status_code=400, detail="Only students can fetch student metrics")
        
    doubts_count = db.query(Doubt).filter(Doubt.student_id == user.id).count()
    
    attendance_records = db.query(Attendance).filter(Attendance.student_id == user.id).all()
    total_records = len(attendance_records)
    present_records = sum(1 for r in attendance_records if r.status == "present")
    
    attendance_percent = (present_records / total_records * 100.0) if total_records > 0 else 0.0
    
    classrooms = db.query(Classroom).all()
    registered_subjects = []
    for c in classrooms:
        has_attended = db.query(Attendance).filter(Attendance.classroom_id == c.id, Attendance.student_id == user.id).first()
        if has_attended:
            engagement = has_attended.engagement_score
            grade = "A+" if engagement >= 90 else "A" if engagement >= 80 else "B" if engagement >= 70 else "C" if engagement > 0 else "N/A"
            status_desc = "Attended"
        else:
            grade = "N/A"
            status_desc = "Enrolled"
            
        registered_subjects.append({
            "classroom_id": c.id,
            "classroom_name": c.name,
            "classroom_code": c.code,
            "grade": grade,
            "status": status_desc
        })
        
    return {
        "attendance_percent": round(attendance_percent, 1),
        "lectures_attended": present_records,
        "ghost_doubts_asked": doubts_count,
        "registered_subjects": registered_subjects
    }

@app.get("/api/teacher/dashboard/metrics")
def get_teacher_dashboard_metrics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "teacher" and user.role != "admin":
        raise HTTPException(status_code=400, detail="Only teachers or admins can fetch teacher metrics")
        
    classrooms = db.query(Classroom).filter(Classroom.teacher_id == user.id).all()
    classroom_ids = [c.id for c in classrooms]
    
    avg_engagement = 0.0
    if classroom_ids:
        records = db.query(Attendance).filter(Attendance.classroom_id.in_(classroom_ids), Attendance.status == "present").all()
        if records:
            avg_engagement = sum(r.engagement_score for r in records) / len(records)
            
    return {
        "focus_index": round(avg_engagement, 1) if avg_engagement > 0 else 0.0
    }

@app.get("/api/student/dashboard/chart")
def get_student_dashboard_chart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "student":
        raise HTTPException(status_code=400, detail="Only students can fetch student charts")
        
    records = db.query(Attendance).filter(Attendance.student_id == user.id).order_by(Attendance.date.asc()).all()
    
    grouped = {}
    for r in records:
        if r.date not in grouped:
            grouped[r.date] = []
        grouped[r.date].append(r)
        
    chart_data = []
    for date, recs in grouped.items():
        present_count = sum(1 for r in recs if r.status == "present")
        avg_focus = sum(r.engagement_score for r in recs if r.status == "present") / present_count if present_count > 0 else 0.0
        att_pct = (present_count / len(recs)) * 100.0 if recs else 0.0
        
        chart_data.append({
            "name": date,
            "focus": round(avg_focus, 1),
            "attendance": round(att_pct, 1)
        })
        
    return chart_data

@app.get("/api/teacher/dashboard/chart")
def get_teacher_dashboard_chart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "teacher" and user.role != "admin":
        raise HTTPException(status_code=400, detail="Only teachers or admins can fetch teacher charts")
        
    classrooms = db.query(Classroom).filter(Classroom.teacher_id == user.id).all()
    classroom_ids = [c.id for c in classrooms]
    
    if not classroom_ids:
        return []
        
    records = db.query(Attendance).filter(Attendance.classroom_id.in_(classroom_ids)).order_by(Attendance.date.asc()).all()
    
    grouped = {}
    for r in records:
        if r.date not in grouped:
            grouped[r.date] = []
        grouped[r.date].append(r)
        
    chart_data = []
    for date, recs in grouped.items():
        present_count = sum(1 for r in recs if r.status == "present")
        avg_focus = sum(r.engagement_score for r in recs if r.status == "present") / present_count if present_count > 0 else 0.0
        att_pct = (present_count / len(recs)) * 100.0 if recs else 0.0
        
        chart_data.append({
            "name": date,
            "focus": round(avg_focus, 1),
            "attendance": round(att_pct, 1)
        })
        
    return chart_data

@app.get("/api/announcements")
def get_global_announcements(db: Session = Depends(get_db)):
    return db.query(Announcement).order_by(Announcement.id.desc()).all()

@app.post("/api/announcements")
def create_global_announcement(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    title = data.get("title")
    message = data.get("message")
    if not title or not message:
        raise HTTPException(status_code=400, detail="Title and message are required")
    
    ann = Announcement(
        title=title,
        message=message,
        sender=user.name
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann

# ==========================================

# Real-Time WebSocket Endpoint
# ==========================================
@app.websocket("/ws/classroom/{room}")
async def websocket_classroom_endpoint(websocket: WebSocket, room: str, user_name: str = "Anonymous Student", user_id: str = None):
    room_code = room.upper()
    await manager.connect(websocket, room_code, user_name, user_id)
    
    try:
        while True:
            # Wait for client packets
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data)
            msg_type = data.get("type")
            
            if msg_type == "code_change":
                # Teacher or student edits collaborative code
                manager.room_code_state[room_code]["code"] = data.get("code")
                manager.room_code_state[room_code]["language"] = data.get("language")
                
                # Broadcast back to other room members
                await manager.broadcast_to_room(room_code, {
                    "type": "code_sync",
                    "code": data.get("code"),
                    "language": data.get("language"),
                    "sender": data.get("sender")
                })
                
            elif msg_type == "ask_doubt":
                # Student poses an anonymous or public question
                question = data.get("question")
                is_anon = data.get("is_anonymous", False)
                student_id = data.get("student_id")
                student_name = data.get("student_name", "Anonymous Student")
                
                # 1. Ask AI for response simulation
                ai_res = AIService.ask_ai(question)
                
                # 2. Insert into database
                db = SessionLocal()
                try:
                    classroom = db.query(Classroom).filter(Classroom.code == room_code).first()
                    if classroom:
                        db_doubt = Doubt(
                            classroom_id=classroom.id,
                            student_id=student_id if not is_anon else None,
                            question=question,
                            ai_answer=ai_res["answer"],
                            is_anonymous=is_anon,
                            is_resolved=False
                        )
                        db.add(db_doubt)
                        db.commit()
                        db.refresh(db_doubt)
                        
                        doubt_id = db_doubt.id
                    else:
                        doubt_id = 999
                finally:
                    db.close()
                
                # 3. Broadcast the doubt and AI answers to the classroom room
                await manager.broadcast_to_room(room_code, {
                    "type": "doubt_added",
                    "doubt": {
                        "id": doubt_id,
                        "question": question,
                        "ai_answer": ai_res["answer"],
                        "is_anonymous": is_anon,
                        "is_resolved": False,
                        "student_name": "Anonymous" if is_anon else student_name,
                        "created_at": datetime.datetime.utcnow().isoformat()
                    },
                    "observability": {
                        "latency_ms": ai_res["latency_ms"],
                        "prompt_tokens": ai_res["prompt_tokens"],
                        "completion_tokens": ai_res["completion_tokens"],
                        "model": ai_res["model"],
                        "timestamp": ai_res["timestamp"]
                    }
                })
                
            elif msg_type == "request_transcript_step":
                # Whisper stream simulation step requested by the teacher
                subject = data.get("subject", "CS101")
                
                if room_code not in manager.transcription_steps:
                    manager.transcription_steps[room_code] = 0
                else:
                    manager.transcription_steps[room_code] += 1
                    
                step = manager.transcription_steps[room_code]
                
                # Call AI Whisper service simulation
                whisper_seg = AIService.generate_transcription_line(subject, step)
                
                # Auto-save transcript to database
                db = SessionLocal()
                try:
                    classroom = db.query(Classroom).filter(Classroom.code == room_code).first()
                    if classroom:
                        db_trans = Transcript(
                            classroom_id=classroom.id,
                            text=whisper_seg["text"],
                            timestamp=whisper_seg["timestamp"]
                        )
                        db.add(db_trans)
                        db.commit()
                finally:
                    db.close()
                
                # Broadcast the newly transcribed segment to students
                await manager.broadcast_to_room(room_code, {
                    "type": "transcript_segment",
                    "text": whisper_seg["text"],
                    "timestamp": whisper_seg["timestamp"],
                    "latency_ms": whisper_seg["latency_ms"],
                    "confidence": whisper_seg["confidence"]
                })
                
            elif msg_type == "request_sentiment_update":
                # Real-time sentiment metrics requested for the teacher's dashboard
                sentiment_info = AIService.get_classroom_sentiment()
                await manager.broadcast_to_room(room_code, {
                    "type": "sentiment_sync",
                    "data": sentiment_info
                })
                
            elif msg_type == "classroom_alert":
                # Teachers can broadcast administrative announcements
                await manager.broadcast_to_room(room_code, {
                    "type": "alert",
                    "title": data.get("title", "Announcement"),
                    "message": data.get("message", ""),
                    "sender": data.get("sender", "Instructor")
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_code)
        await manager.broadcast_connections_update(room_code)
    except Exception as e:
        manager.disconnect(websocket, room_code)
        await manager.broadcast_connections_update(room_code)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
