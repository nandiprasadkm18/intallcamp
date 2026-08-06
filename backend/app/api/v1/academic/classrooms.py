from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
import datetime
import os
import json
import shutil
from groq import Groq

from app.models.ai import ResourceChunk, AIJobStatus
from app.services.ai_pipeline import get_embedding_model
from app.services.observability import log_ai_request

from app.api.ws.classroom import manager

from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.academic import Course, Department
from app.models.activity import Classroom, LectureSession, Attendance, Doubt, TranscriptRecord

router = APIRouter()

class ClassroomCreate(BaseModel):
    name: str
    code: str

class ClassroomResponse(BaseModel):
    id: int
    course_id: int
    teacher_id: int
    status: str
    active_students_count: int = 0
    is_live: bool = False
    name: Optional[str] = None
    code: Optional[str] = None

    class Config:
        from_attributes = True

@router.post("", response_model=ClassroomResponse)
def create_classroom(
    room_in: ClassroomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["Teacher", "College Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to create classes")
        
    from app.models.academic import Department, Program, Semester, Section, Course
    
    # 1. Department
    mock_dept = db.query(Department).first()
    if not mock_dept:
        mock_dept = Department(college_id=current_user.college_id or 1, name="General Dept", code="GEN")
        db.add(mock_dept)
        db.commit()
        db.refresh(mock_dept)
        
    # 2. Program
    mock_program = db.query(Program).first()
    if not mock_program:
        mock_program = Program(department_id=mock_dept.id, name="General Program", degree_level="Bachelors")
        db.add(mock_program)
        db.commit()
        db.refresh(mock_program)
        
    # 3. Semester
    mock_semester = db.query(Semester).first()
    if not mock_semester:
        mock_semester = Semester(program_id=mock_program.id, term_name="Semester 1")
        db.add(mock_semester)
        db.commit()
        db.refresh(mock_semester)
        
    # 4. Section
    mock_section = db.query(Section).first()
    if not mock_section:
        mock_section = Section(semester_id=mock_semester.id, name="A")
        db.add(mock_section)
        db.commit()
        db.refresh(mock_section)
        
    # 5. Create a specific Course for this classroom
    mock_course = Course(
        section_id=mock_section.id,
        name=room_in.name,
        code=room_in.code,
        credits=3
    )
    db.add(mock_course)
    db.commit()
    db.refresh(mock_course)
        
    new_room = Classroom(
        college_id=current_user.college_id or 1,
        course_id=mock_course.id,
        teacher_id=current_user.id,
        status="scheduled"
    )
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    
    return {
        "id": new_room.id,
        "course_id": new_room.course_id,
        "teacher_id": new_room.teacher_id,
        "status": new_room.status,
        "active_students_count": 0,
        "is_live": False,
        "name": room_in.name,
        "code": room_in.code
    }

class LiveUpdateStatus(BaseModel):
    is_live: bool
    store_record: bool = False
    year: Optional[int] = None
    semester: Optional[int] = None
    section: Optional[str] = None

def process_end_of_class(db: Session, classroom_code: str, year: Optional[int] = None, semester: Optional[int] = None, section: Optional[str] = None):
    # Retrieve all transcripts for this classroom in the past X hours to form context
    # Since we use mock classrooms, we will just grab the latest transcripts
    transcripts = db.query(TranscriptRecord).order_by(TranscriptRecord.id.desc()).limit(100).all()
    transcripts.reverse()
    transcript_text = "\n".join([f"{t.speaker_name}: {t.text}" for t in transcripts])
    
    if not transcript_text.strip():
        return # Nothing to summarize
        
    try:
        from groq import Groq
        import time
        from app.core.config import settings
        client = Groq(api_key=settings.GROQ_API_KEY)
        system_prompt = (
            "You are an academic AI. Based on the following live transcript, "
            "generate an Executive Summary, Key Concepts, and 3 Quiz questions. "
            "Return the result in Markdown format."
        )
        
        start_time = time.time()
        completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": transcript_text}
            ],
            temperature=0.5,
            max_completion_tokens=2048,
        )
        latency_ms = (time.time() - start_time) * 1000
        
        summary = completion.choices[0].message.content
        
        log_ai_request(
            db=db,
            college_id=1, # Mock for background task
            user_id=1,
            model="llama3-8b-8192",
            endpoint="summary",
            latency_ms=latency_ms,
            prompt_tokens=completion.usage.prompt_tokens,
            completion_tokens=completion.usage.completion_tokens,
            total_tokens=completion.usage.total_tokens
        )
        
        from app.models.activity import LectureSummary, Classroom
        from app.services.ai_pipeline import process_summary_background
        from app.services.storage import upload_file_to_r2
        import io
        
        classroom = db.query(Classroom).join(Course).filter(Course.code == classroom_code).first()
        if classroom:
            timestamp_str = str(int(time.time()))
            transcript_key = f"transcripts/{classroom_code}_{timestamp_str}.txt"
            summary_key = f"summaries/{classroom_code}_{timestamp_str}.md"
            
            try:
                upload_file_to_r2(io.BytesIO(transcript_text.encode('utf-8')), transcript_key)
                upload_file_to_r2(io.BytesIO(summary.encode('utf-8')), summary_key)
            except Exception as e:
                print(f"Failed to upload to R2: {e}")
                
            new_summary = LectureSummary(
                classroom_id=classroom.id,
                summary_text="[Stored in Cloudflare R2]",
                created_at=datetime.datetime.now().isoformat(),
                transcript_s3_key=transcript_key,
                summary_s3_key=summary_key,
                year=year,
                semester=semester,
                section=section
            )
            db.add(new_summary)
            db.commit()
            db.refresh(new_summary)
            
            # Wipe the temporary Postgres transcript buffer now that it's in R2
            db.query(TranscriptRecord).filter(TranscriptRecord.classroom_id == classroom.id).delete()
            db.commit()
            
            process_summary_background(db, new_summary.id)
            
        print(f"End of Class Summary for {classroom_code} safely archived to R2.")
    except Exception as e:
        print("End of Class AI processing failed:", e)

@router.put("/{code}/live")
def update_live_status(
    code: str,
    status_update: LiveUpdateStatus,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.academic import Course
    classroom = db.query(Classroom).join(Course).filter(Course.code == code).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
        
    if current_user.role and current_user.role.name not in ["Teacher", "College Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    new_status = "live" if status_update.is_live else "scheduled"
    classroom.status = new_status
    db.commit()
    
    # If the class just ended, queue the background processing
    if not status_update.is_live and status_update.store_record:
        background_tasks.add_task(process_end_of_class, db, code, status_update.year, status_update.semester, status_update.section)
        
    return {"status": "success", "is_live": status_update.is_live}

@router.get("", response_model=List[ClassroomResponse])
def get_classrooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # For now, return all classrooms for the user's college
    if current_user.role.name in ["Teacher", "College Admin"]:
        classrooms = db.query(Classroom).filter(Classroom.college_id == current_user.college_id).all()
    elif current_user.role.name == "Student":
        all_col_classrooms = db.query(Classroom).filter(Classroom.college_id == current_user.college_id).all()
        classrooms = []
        for c in all_col_classrooms:
            course_code = c.course.code if c.course else None
            is_match = False
            if not course_code or course_code == "All Sections":
                is_match = True
            elif course_code == current_user.section:
                is_match = True
            elif current_user.section and str(current_user.semester) in course_code and current_user.section in course_code:
                is_match = True
                
            if is_match:
                classrooms.append(c)
    else:
        classrooms = db.query(Classroom).all()
        
    results = []
    for c in classrooms:
        # Calculate joined students from Attendance of the most recent lecture
        latest_lecture = db.query(LectureSession).filter(LectureSession.classroom_id == c.id).order_by(LectureSession.id.desc()).first()
        student_count = 0
        if latest_lecture:
            student_count = db.query(Attendance).filter(Attendance.lecture_id == latest_lecture.id).count()
            
        results.append({
            "id": c.id,
            "course_id": c.course_id,
            "teacher_id": c.teacher_id,
            "status": c.status,
            "active_students_count": student_count,
            "is_live": c.status == "live",
            "name": c.course.name if c.course else f"Class {c.id}",
            "code": c.course.code if c.course else f"C{c.id}"
        })
    return results

@router.delete("/{code}")
def delete_classroom(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.academic import Course
    if current_user.role.name not in ["Teacher", "College Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete classes")
        
    classroom = db.query(Classroom).join(Course).filter(Course.code == code).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
        
    # Manually delete related records to avoid FK constraint errors
    from app.models.activity import LectureSummary
    db.query(LectureSummary).filter(LectureSummary.classroom_id == classroom.id).delete()
    
    try:
        from database import Timetable, Resource
        db.query(Timetable).filter(Timetable.classroom_id == classroom.id).update({Timetable.classroom_id: None})
        db.query(Resource).filter(Resource.classroom_id == classroom.id).delete()
    except ImportError:
        pass

    db.query(Doubt).filter(Doubt.classroom_id == classroom.id).delete()
    db.query(TranscriptRecord).filter(TranscriptRecord.classroom_id == classroom.id).delete()
    
    sessions = db.query(LectureSession).filter(LectureSession.classroom_id == classroom.id).all()
    for session in sessions:
        db.query(Attendance).filter(Attendance.lecture_id == session.id).delete()
        db.delete(session)
        
    db.delete(classroom)
    db.commit()
    
    return {"status": "success"}

@router.get("/{code}/attendance")
def get_attendance(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Mocking fetching classroom by code since code is usually on Course
    # We will just fetch all attendance for the user's college for simplicity in this demo
    attendances = db.query(Attendance).join(User).filter(User.college_id == current_user.college_id).all()
    results = []
    for a in attendances:
        results.append({
            "id": a.id,
            "student_name": a.student.full_name,
            "status": a.status,
            "engagement_score": a.engagement_score
        })
    return results

@router.get("/my_records")
def get_my_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.activity import LectureSummary, Classroom
    
    query = db.query(LectureSummary).join(Classroom)
    
    if current_user.role and current_user.role.name == "Student":
        if current_user.year is not None:
            query = query.filter(LectureSummary.year == current_user.year)
        if current_user.semester is not None:
            query = query.filter(LectureSummary.semester == current_user.semester)
        if current_user.section is not None:
            query = query.filter(LectureSummary.section == current_user.section)
            
    if current_user.role and current_user.role.name in ["Teacher", "College Admin"]:
        query = query.filter(Classroom.college_id == current_user.college_id)
        
    records = query.order_by(LectureSummary.id.desc()).all()
    
    results = []
    for r in records:
        classroom_name = r.classroom.course.name if r.classroom and r.classroom.course else f"Live Session {r.id}"
        results.append({
            "id": r.id,
            "title": f"{classroom_name} - Session {r.id}",
            "date": r.created_at,
            "duration": "1h 0m",
            "transcript_key": r.transcript_s3_key,
            "summary_key": r.summary_s3_key,
            "summary_text_fallback": r.summary_text
        })
    return results

@router.get("/{code}/records")
def get_records(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch LectureSummaries for the classroom (these contain the R2 keys)
    from app.models.activity import LectureSummary, Classroom
    classroom = db.query(Classroom).join(Course).filter(Course.code == code).first()
    if not classroom:
        return []
        
    records = db.query(LectureSummary).filter(LectureSummary.classroom_id == classroom.id).order_by(LectureSummary.id.desc()).all()
    results = []
    for r in records:
        results.append({
            "id": r.id,
            "title": f"Live Session {r.id}",
            "date": r.created_at,
            "duration": "1h 0m", # Mocked duration
            "transcript_key": r.transcript_s3_key,
            "summary_key": r.summary_s3_key,
            "summary_text_fallback": r.summary_text # Keep in case R2 fetch fails
        })
    return results

@router.get("/records/download")
def download_record(
    key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi.responses import StreamingResponse
    from app.services.storage import get_r2_file_stream
    
    try:
        file_stream = get_r2_file_stream(key)
    except Exception as e:
        raise HTTPException(status_code=404, detail="File not found on cloud storage")
        
    filename = key.split("/")[-1]
    return StreamingResponse(
        file_stream, 
        media_type="application/octet-stream", 
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )

@router.post("/{code}/transcribe")
async def transcribe_audio(
    code: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role and current_user.role.name != "Teacher":
        raise HTTPException(status_code=403, detail="Only teachers can stream transcripts")

    temp_filename = f"temp_audio_{int(time.time())}.webm"
    with open(temp_filename, "wb") as f:
        f.write(await file.read())

    try:
        start_time = time.time()
        from app.core.config import settings
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        with open(temp_filename, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                file=(temp_filename, audio_file.read()),
                model="whisper-large-v3-turbo",
                temperature=0,
                response_format="verbose_json",
            )
            text = transcription.text
            
        latency = int((time.time() - start_time) * 1000)

        if text and text.strip():
            # Broadcast the transcript segment via websocket manager
            payload = {
                "type": "transcript_segment",
                "text": text,
                "timestamp": datetime.datetime.now().isoformat(),
                "latency_ms": latency,
                "confidence": 0.98 # Groq verbose_json doesn't give a single confidence easily without parsing segments, mock it for now
            }
            await manager.broadcast(json.dumps(payload), code)
            
            # Save to DB
            classroom = db.query(Classroom).join(Course).filter(Course.code == code).first()
            if classroom:
                new_record = TranscriptRecord(
                    classroom_id=classroom.id,
                    speaker_name=current_user.full_name,
                    text=text,
                    timestamp=datetime.datetime.now().isoformat()
                )
                db.add(new_record)
                db.commit()
                db.refresh(new_record)
                
                from app.services.ai_pipeline import process_transcript_background
                process_transcript_background(db, new_record.id)

        return {"status": "success", "text": text}

    except Exception as e:
        print(f"Groq Transcription Error: {e}")
        raise HTTPException(status_code=500, detail="Transcription failed")
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

@router.get("/{code}/doubts")
def get_classroom_doubts(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.academic import Course
    classroom = db.query(Classroom).join(Course).filter(Course.code == code).first()
    if not classroom:
        return []
        
    doubts = db.query(Doubt).filter(Doubt.classroom_id == classroom.id).order_by(Doubt.id.desc()).limit(50).all()
    results = []
    for d in doubts:
        student_name = d.student.full_name if d.student else "Unknown"
        results.append({
            "id": d.id,
            "question": d.question,
            "student_name": student_name if not d.is_anonymous else "Anonymous",
            "real_name": student_name,
            "is_anonymous": bool(d.is_anonymous),
            "timestamp": d.timestamp,
            "ai_answer": d.ai_answer
        })
    return results

class DoubtAnswerRequest(BaseModel):
    model: str = "llama-3.3-70b-versatile"
    fallback_question: str = ""

@router.post("/{code}/doubts/{doubt_id}/answer")
async def answer_doubt(
    code: str,
    doubt_id: str,
    req: DoubtAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role and current_user.role.name != "Teacher":
        raise HTTPException(status_code=403, detail="Only teachers can trigger AI answers")

    # Try to find the doubt, but gracefully fallback if the ID is invalid (e.g. float timestamp)
    doubt = None
    try:
        real_doubt_id = int(float(doubt_id))
        doubt = db.query(Doubt).filter(Doubt.id == real_doubt_id).first()
    except (ValueError, TypeError):
        pass

    question_text = doubt.question if doubt else req.fallback_question
    if not question_text:
        raise HTTPException(status_code=404, detail="Doubt not found and no fallback question provided.")

    try:
        # Note: Actual vector search requires pgvector extension which is blocked in this environment
        # We simulate finding context
        context_text = ""
        embedding_model = get_embedding_model()
        if embedding_model:
            from app.models.ai import ResourceChunk, TranscriptChunk, SummaryChunk
            query_embedding = embedding_model.encode(doubt.question).tolist()
            
            res_results = db.query(ResourceChunk).order_by(
                ResourceChunk.embedding.cosine_distance(query_embedding)
            ).limit(2).all()
            
            tr_results = db.query(TranscriptChunk).order_by(
                TranscriptChunk.embedding.cosine_distance(query_embedding)
            ).limit(2).all()
            
            sum_results = db.query(SummaryChunk).order_by(
                SummaryChunk.embedding.cosine_distance(query_embedding)
            ).limit(2).all()
            
            all_chunks = [r.chunk_text for r in res_results] + \
                         [r.chunk_text for r in tr_results] + \
                         [r.chunk_text for r in sum_results]
            
            if all_chunks:
                context_text = "\n\n".join(all_chunks)

        system_prompt = (
            "You are a helpful academic AI assistant in a classroom. "
            "Provide a concise, clear, and encouraging answer to the student's question. "
        )
        if context_text:
            system_prompt += (
                "Use ONLY the following context to answer the question. "
                "If the context does not contain the answer, state that you do not know.\n\n"
                f"Context:\n{context_text}"
            )
            
        from app.core.config import settings
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        start_time = time.time()
        
        actual_model = req.model
        if actual_model == "openai/gpt-oss-120b" or "llama3-8b-8192" in actual_model:
            actual_model = "llama-3.3-70b-versatile"
            
        completion = client.chat.completions.create(
            model=actual_model,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": question_text
                }
            ],
            temperature=1,
            max_completion_tokens=2048,
            top_p=1,
            stream=False # Disable streaming temporarily to easily get usage tokens
        )

        latency_ms = (time.time() - start_time) * 1000
        full_answer = completion.choices[0].message.content
        
        log_ai_request(
            db=db,
            college_id=current_user.college_id,
            user_id=current_user.id,
            model=req.model,
            endpoint="doubt_answer",
            latency_ms=latency_ms,
            prompt_tokens=completion.usage.prompt_tokens,
            completion_tokens=completion.usage.completion_tokens,
            total_tokens=completion.usage.total_tokens
        )
            
        if doubt:
            doubt.ai_answer = full_answer
            db.commit()

        # Broadcast the answer
        payload = {
            "type": "doubt_answered",
            "doubt_id": doubt_id,
            "ai_answer": full_answer
        }
        await manager.broadcast(json.dumps(payload), code)

        return {"status": "success", "answer": full_answer}

    except Exception as e:
        print(f"Groq AI Answer Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate AI answer")

class ChatRequest(BaseModel):
    message: str
    model: str = "llama3-8b-8192"

@router.post("/{code}/chat")
async def chat_classroom(
    code: str,
    req: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    from fastapi.responses import StreamingResponse
    from groq import Groq
    from app.core.config import settings
    import json
    
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    # We use the specific model the user requested
    try:
        completion = client.chat.completions.create(
            model=req.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful AI Classroom Assistant. You provide concise, clear answers to students and teachers during a live lecture. Always respond with a short summary followed by a brief, practical example. Do not write long essays."
                },
                {
                    "role": "user",
                    "content": req.message
                }
            ],
            temperature=1,
            max_completion_tokens=2048,
            top_p=1,
            stream=True,
            stop=None
        )

        def stream_generator():
            for chunk in completion:
                content = chunk.choices[0].delta.content or ""
                if content:
                    yield f"data: {json.dumps({'content': content})}\n\n"
            yield "data: [DONE]\n\n"
            
        return StreamingResponse(stream_generator(), media_type="text/event-stream")
    except Exception as e:
        print(f"Groq Chat Error: {e}")
        raise HTTPException(status_code=500, detail="Chat generation failed")
