import os
import fitz  # PyMuPDF
from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

from app.models.ai import AIJobStatus, ResourceChunk
from app.models.academic import ClassroomResource

embedding_model_instance = None

def get_embedding_model():
    global embedding_model_instance
    if embedding_model_instance is None:
        try:
            embedding_model_instance = SentenceTransformer('BAAI/bge-small-en-v1.5')
        except Exception as e:
            print(f"Failed to load SentenceTransformer: {e}")
    return embedding_model_instance

def split_into_chunks(text, chunk_size=1000, overlap=200):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def process_document_background(db: Session, resource_id: int, job_id: int):
    job = db.query(AIJobStatus).filter(AIJobStatus.id == job_id).first()
    if not job:
        return

    try:
        job.status = "Processing"
        job.progress_message = "Fetching resource"
        db.commit()

        resource = db.query(ClassroomResource).filter(ClassroomResource.id == resource_id).first()
        if not resource:
            raise Exception(f"Resource {resource_id} not found")

        ext = resource.file_type.lower()
        if ext != 'pdf':
            raise Exception("Currently only PDF processing is supported for embeddings.")

        job.progress_message = "Extracting text from PDF via R2"
        db.commit()

        from app.services.storage import download_file_from_r2
        import uuid
        
        temp_file_path = f"temp_{uuid.uuid4()}.pdf"
        object_name = f"resource_{resource_id}.{ext}"
        
        download_file_from_r2(object_name, temp_file_path)
        doc = fitz.open(temp_file_path)
        all_text = ""
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text("text").replace("\n", " ").strip()
            # If we wanted page-level granularity we'd embed per page, but let's just chunk all text.
            # To keep things simple and adhere to metadata, we can just store page_num=0 for chunks that cross pages,
            # or just embed per page. Let's embed per page if it's large, or just split text.
            # Actually, let's embed per page and then split if a page is too long.
            
            if not text:
                continue
                
            chunks = split_into_chunks(text, chunk_size=300, overlap=50) # smaller chunk size for bge-small
            
            model = get_embedding_model()
            if not model:
                raise Exception("Embedding model could not be loaded")
            
            for chunk_idx, chunk_text in enumerate(chunks):
                if not chunk_text:
                    continue
                    
                # Generate embedding
                embedding = model.encode(chunk_text).tolist()
                
                new_chunk = ResourceChunk(
                    resource_id=resource_id,
                    page_number=page_num + 1,
                    chunk_index=chunk_idx,
                    chunk_text=chunk_text,
                    embedding=embedding
                )
                db.add(new_chunk)
                
        db.commit()
        
        job.status = "Completed"
        job.progress_message = "Embeddings generated and indexed successfully."
        db.commit()
    except Exception as e:
        db.rollback()
        job.status = "Failed"
        job.progress_message = str(e)
        db.commit()
    finally:
        try:
            if 'doc' in locals():
                doc.close()
        except Exception:
            pass
        try:
            if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
                os.remove(temp_file_path)
        except Exception:
            pass

def process_transcript_background(db: Session, transcript_id: int):
    from app.models.activity import TranscriptRecord
    from app.models.ai import TranscriptChunk
    
    transcript = db.query(TranscriptRecord).filter(TranscriptRecord.id == transcript_id).first()
    if not transcript or not transcript.text.strip():
        return
        
    model = get_embedding_model()
    if not model:
        return
        
    chunks = split_into_chunks(transcript.text, chunk_size=300, overlap=50)
    for chunk_idx, chunk_text in enumerate(chunks):
        if not chunk_text:
            continue
        embedding = model.encode(chunk_text).tolist()
        new_chunk = TranscriptChunk(
            transcript_id=transcript.id,
            classroom_id=transcript.classroom_id,
            chunk_index=chunk_idx,
            chunk_text=chunk_text,
            embedding=embedding
        )
        db.add(new_chunk)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error saving transcript chunks: {e}")

def process_summary_background(db: Session, summary_id: int):
    from app.models.activity import LectureSummary
    from app.models.ai import SummaryChunk
    
    summary = db.query(LectureSummary).filter(LectureSummary.id == summary_id).first()
    if not summary or not summary.summary_text.strip():
        return
        
    model = get_embedding_model()
    if not model:
        return
        
    chunks = split_into_chunks(summary.summary_text, chunk_size=300, overlap=50)
    for chunk_idx, chunk_text in enumerate(chunks):
        if not chunk_text:
            continue
        embedding = model.encode(chunk_text).tolist()
        new_chunk = SummaryChunk(
            summary_id=summary.id,
            classroom_id=summary.classroom_id,
            chunk_index=chunk_idx,
            chunk_text=chunk_text,
            embedding=embedding
        )
        db.add(new_chunk)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error saving summary chunks: {e}")
