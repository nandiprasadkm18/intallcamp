from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import datetime
import os
import base64
import time
from groq import Groq
from app.db.session import SessionLocal
from app.models.activity import Doubt, TranscriptRecord, Classroom
from app.models.user import User
from app.services.observability import log_ai_request

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps classroom_code -> list of dicts: {"ws": WebSocket, "name": str}
        self.active_connections: Dict[str, List[Dict]] = {}

    async def connect(self, websocket: WebSocket, room_code: str, user_name: str):
        await websocket.accept()
        if room_code not in self.active_connections:
            self.active_connections[room_code] = []
        self.active_connections[room_code].append({"ws": websocket, "name": user_name})
        await self.broadcast_connections_update(room_code)

    def disconnect(self, websocket: WebSocket, room_code: str):
        if room_code in self.active_connections:
            self.active_connections[room_code] = [c for c in self.active_connections[room_code] if c["ws"] != websocket]
            if not self.active_connections[room_code]:
                del self.active_connections[room_code]
            else:
                import asyncio
                asyncio.create_task(self.broadcast_connections_update(room_code))

    async def broadcast_connections_update(self, room_code: str):
        if room_code in self.active_connections:
            count = len(self.active_connections[room_code])
            active_students = [{"name": c["name"]} for c in self.active_connections[room_code]]
            message = {
                "type": "connections_update",
                "count": count,
                "active_students": active_students
            }
            await self.broadcast(json.dumps(message), room_code)

    async def broadcast(self, message: str, room_code: str):
        if room_code in self.active_connections:
            for connection in self.active_connections[room_code]:
                try:
                    await connection["ws"].send_text(message)
                except Exception:
                    pass

manager = ConnectionManager()

@router.websocket("/{room_code}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, user_name: str = "Anonymous", user_id: str = "0"):
    await manager.connect(websocket, room_code, user_name)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle ask_doubt
            if message.get("type") == "ask_doubt":
                # Save to DB
                db = SessionLocal()
                try:
                    from app.models.academic import Course
                    classroom = db.query(Classroom).join(Course).filter(Course.code == room_code).first()
                    user = db.query(User).filter(User.id == int(user_id)).first() if user_id.isdigit() else None
                    
                    if classroom:
                        new_doubt = Doubt(
                            classroom_id=classroom.id,
                            student_id=user.id if user else 1,
                            question=message.get("question"),
                            is_anonymous=1 if message.get("is_anonymous") else 0,
                            timestamp=datetime.datetime.now().isoformat()
                        )
                        db.add(new_doubt)
                        db.commit()
                        db.refresh(new_doubt)
                except Exception as e:
                    import traceback
                    print("Error saving doubt:", e)
                    with open("error_log.txt", "a") as f:
                        f.write(traceback.format_exc() + "\n")
                finally:
                    db.close()
                
                # Broadcast doubt
                broadcast_msg = {
                    "type": "doubt_added",
                    "doubt": {
                        "id": new_doubt.id if 'new_doubt' in locals() else datetime.datetime.now().timestamp(),
                        "question": message.get("question"),
                        "student_name": user_name if not message.get("is_anonymous") else "Anonymous",
                        "real_name": user_name,
                        "timestamp": datetime.datetime.now().isoformat()
                    }
                }
                await manager.broadcast(json.dumps(broadcast_msg), room_code)
                
            # Handle request_transcript_step
            elif message.get("type") == "request_transcript_step":
                transcript_text = "This is a live transcript segment generated from speech."
                
                # Save to DB
                db = SessionLocal()
                try:
                    classroom = db.query(Classroom).filter(Classroom.code == room_code).first()
                    if classroom:
                        record = TranscriptRecord(
                            classroom_id=classroom.id,
                            text=transcript_text,
                            speaker_name=user_name,
                            timestamp=datetime.datetime.now().isoformat()
                        )
                        db.add(record)
                        db.commit()
                except Exception as e:
                    print("Error saving transcript:", e)
                finally:
                    db.close()
                
                # Broadcast transcript
                broadcast_msg = {
                    "type": "transcript_segment",
                    "text": transcript_text,
                    "timestamp": datetime.datetime.now().isoformat(),
                    "latency_ms": 120,
                    "confidence": 0.95
                }
                await manager.broadcast(json.dumps(broadcast_msg), room_code)
                
            # Handle real audio stream
            elif message.get("type") == "audio_chunk":
                audio_data = message.get("audio") # base64 string
                if not audio_data:
                    continue
                
                # Strip metadata if present (e.g. data:audio/webm;base64,...)
                if "," in audio_data:
                    audio_data = audio_data.split(",")[1]
                    
                # Decode and write to temp file
                temp_filename = f"temp_audio_{time.time()}.webm"
                try:
                    with open(temp_filename, "wb") as f:
                        f.write(base64.b64decode(audio_data))
                        
                    # Send to Groq Whisper
                    from app.core.config import settings
                    client = Groq(api_key=settings.GROQ_API_KEY)
                    start_time = time.time()
                    with open(temp_filename, "rb") as audio_file:
                        transcription = client.audio.translations.create(
                            file=(temp_filename, audio_file.read()),
                            model="whisper-large-v3",
                            temperature=0,
                            response_format="json"
                        )
                    latency_ms = (time.time() - start_time) * 1000
                    
                    # Log AI Request
                    db_log = SessionLocal()
                    try:
                        user = db_log.query(User).filter(User.id == int(user_id)).first() if user_id.isdigit() else None
                        log_ai_request(
                            db=db_log,
                            college_id=user.college_id if user else 1,
                            user_id=user.id if user else 1,
                            model="whisper-large-v3-turbo",
                            endpoint="transcription",
                            latency_ms=latency_ms,
                            prompt_tokens=0,
                            completion_tokens=0,
                            total_tokens=0
                        )
                    finally:
                        db_log.close()
                    
                    transcript_text = transcription.text.strip()
                    
                    # Filter out common Whisper hallucinations for silence/background noise
                    hallucinations = ["Thank you.", "Thank you", "Thanks for watching.", "Ammen", "Ammen."]
                    if transcript_text in hallucinations:
                        transcript_text = ""
                    
                    if transcript_text:
                        # Save to DB
                        db = SessionLocal()
                        try:
                            from app.models.academic import Course
                            classroom = db.query(Classroom).join(Course).filter(Course.code == room_code).first()
                            if classroom:
                                record = TranscriptRecord(
                                    classroom_id=classroom.id,
                                    text=transcript_text,
                                    speaker_name=user_name,
                                    timestamp=datetime.datetime.now().isoformat()
                                )
                                db.add(record)
                                db.commit()
                        except Exception as e:
                            print("Error saving transcript:", e)
                        finally:
                            db.close()
                        
                        # Broadcast transcript
                        broadcast_msg = {
                            "type": "transcript_segment",
                            "text": transcript_text,
                            "timestamp": datetime.datetime.now().isoformat(),
                            "latency_ms": 500, # Simulated or calculated
                            "confidence": 0.98
                        }
                        await manager.broadcast(json.dumps(broadcast_msg), room_code)
                        
                except Exception as e:
                    print(f"Error processing audio chunk: {e}")
                finally:
                    if os.path.exists(temp_filename):
                        os.remove(temp_filename)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_code)
