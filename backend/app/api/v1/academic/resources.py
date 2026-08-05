from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
import os
import shutil

from app.api.dependencies import get_db, get_current_user
from app.models.user import User, Role
from app.models.academic import ClassroomResource
from app.models.ai import AIJobStatus
from app.services.ai_pipeline import process_document_background

router = APIRouter()

class ResourceCreate(BaseModel):
    title: str
    file_type: str
    file_size: str
    target_year: Optional[int] = None
    target_department: Optional[str] = None
    target_semester: Optional[int] = None
    target_class: Optional[str] = None
    target_section: Optional[str] = None # null means all sections

class ResourceResponse(BaseModel):
    id: int
    classroom_code: str
    title: str
    file_type: str
    file_size: str
    target_year: Optional[int]
    target_department: Optional[str]
    target_semester: Optional[int]
    target_class: Optional[str]
    target_section: Optional[str]

    class Config:
        from_attributes = True

@router.get("/{code}/resources", response_model=List[ResourceResponse])
def get_classroom_resources(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get resources for a specific classroom code.
    If the current user is a student and has a section, only return resources targeting 'All Sections' or their specific section.
    If the current user is a teacher/admin, return all resources for the classroom.
    """
    query = db.query(ClassroomResource).filter(ClassroomResource.classroom_code == code)
    
    # Optional role check to filter by section for students
    if current_user.role and current_user.role.name == "Student":
        if current_user.section:
            # Verify constraints against user profile
            if current_user.year:
                query = query.filter((ClassroomResource.target_year == None) | (ClassroomResource.target_year == current_user.year))
            if current_user.department:
                query = query.filter((ClassroomResource.target_department == None) | (ClassroomResource.target_department == current_user.department))
            if current_user.semester:
                query = query.filter((ClassroomResource.target_semester == None) | (ClassroomResource.target_semester == current_user.semester))
                
            query = query.filter(
                (ClassroomResource.target_section == None) | 
                (ClassroomResource.target_section == "All Sections") |
                (ClassroomResource.target_section == current_user.section)
            )
        else:
            # If student has no section somehow, they only see All Sections resources
            query = query.filter(
                (ClassroomResource.target_section == None) | 
                (ClassroomResource.target_section == "All Sections")
            )
            
    # Order by newest first
    resources = query.order_by(ClassroomResource.id.desc()).all()
    return resources

@router.post("/{code}/resources", response_model=ResourceResponse)
def create_classroom_resource(
    code: str,
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    target_year: Optional[int] = Form(None),
    target_department: Optional[str] = Form(None),
    target_semester: Optional[int] = Form(None),
    target_class: Optional[str] = Form(None),
    target_section: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a new resource to a classroom.
    """
    if current_user.role and current_user.role.name not in ["Teacher", "College Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to upload resources")

    # Determine file size
    file.file.seek(0, os.SEEK_END)
    size_bytes = file.file.tell()
    file.file.seek(0)
    size_mb = f"{size_bytes / (1024 * 1024):.1f} MB"
    
    # Extract extension
    ext = os.path.splitext(file.filename)[1].lower().replace('.', '') or 'pdf'

    new_resource = ClassroomResource(
        classroom_code=code,
        title=title,
        file_type=ext.upper(),
        file_size=size_mb,
        target_year=target_year,
        target_department=target_department,
        target_semester=target_semester,
        target_class=target_class,
        target_section=target_section
    )
    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)
    
    # Upload file to R2
    from app.services.storage import upload_file_to_r2
    object_name = f"resource_{new_resource.id}.{ext}"
    file.file.seek(0)
    upload_file_to_r2(file.file, object_name)
        
    # Create background job if PDF
    if ext == 'pdf':
        job = AIJobStatus(
            entity_type="resource",
            entity_id=new_resource.id,
            job_type="extract_embed"
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # Schedule the background task
        # Note: We can't pass the SQLAlchemy session to a background task safely if we close it here.
        # But FastAPI Depends(get_db) yields the session and closes it after the background task completes!
        # So we can pass `db` to the background task.
        background_tasks.add_task(process_document_background, db, new_resource.id, job.id)
    
    return new_resource

@router.get("/{id}/download")
def download_resource(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resource = db.query(ClassroomResource).filter(ClassroomResource.id == id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    from fastapi.responses import StreamingResponse
    from app.services.storage import get_r2_file_stream
    
    ext = resource.file_type.lower()
    object_name = f"resource_{id}.{ext}"
    
    try:
        file_stream = get_r2_file_stream(object_name)
    except Exception as e:
        raise HTTPException(status_code=404, detail="File not found on server")
        
    return StreamingResponse(
        file_stream, 
        media_type="application/octet-stream", 
        headers={"Content-Disposition": f"attachment; filename={resource.title}.{ext}"}
    )

@router.delete("/resources/{id}")
def delete_resource(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role and current_user.role.name not in ["Teacher", "College Admin", "Super Admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete resources")

    resource = db.query(ClassroomResource).filter(ClassroomResource.id == id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    from app.services.storage import delete_file_from_r2
    ext = resource.file_type.lower()
    object_name = f"resource_{id}.{ext}"
    
    # Delete from storage (R2 and fallback)
    delete_file_from_r2(object_name)

    # Delete dependent AI jobs and chunks
    db.execute(text("DELETE FROM resource_chunks WHERE resource_id = :id"), {"id": id})
    db.execute(text("DELETE FROM ai_job_statuses WHERE entity_type='resource' AND entity_id = :id"), {"id": id})

    # Delete from DB
    db.delete(resource)
    db.commit()

    return {"status": "success", "message": "Resource deleted successfully"}
