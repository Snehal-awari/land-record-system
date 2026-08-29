import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.entities import Document, AuditLog

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png"
}

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Uploads a PDF or image land record document."""
    mime = file.content_type
    if mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file format '{mime}'. Supported formats: PDF, JPG, JPEG, PNG."
        )

    file_ext = ALLOWED_MIME_TYPES[mime]
    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    save_path = settings.UPLOAD_DIR / unique_filename

    # Read and save file content
    content = await file.read()
    file_size = len(content)

    if file_size > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds maximum allowed size of 20 MB.")

    with open(save_path, "wb") as f:
        f.write(content)

    # Create Document record
    doc = Document(
        filename=unique_filename,
        original_name=file.filename,
        file_path=str(save_path),
        mime_type=mime,
        file_size=file_size,
        status="Uploaded"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Log action
    audit = AuditLog(
        document_id=doc.id,
        action="DOCUMENT_UPLOADED",
        actor="Revenue Operator",
        details=f"Uploaded '{file.filename}' ({file_size / 1024:.1f} KB, MIME: {mime})"
    )
    db.add(audit)
    db.commit()

    return {
        "id": doc.id,
        "filename": doc.filename,
        "original_name": doc.original_name,
        "file_size": doc.file_size,
        "mime_type": doc.mime_type,
        "status": doc.status,
        "uploaded_at": doc.uploaded_at.isoformat()
    }

@router.post("/load-sample")
async def load_sample_document(db: Session = Depends(get_db)):
    """Loads the pre-packaged high-fidelity Maharashtra 7/12 sample image for instant demo."""
    sample_file = settings.SAMPLE_DIR / "sample_7_12.png"
    if not sample_file.exists():
        raise HTTPException(status_code=404, detail="Sample 7/12 document not found on server.")

    unique_filename = f"sample_{uuid.uuid4().hex[:8]}_712_maharashtra.png"
    dest_path = settings.UPLOAD_DIR / unique_filename
    shutil.copyfile(sample_file, dest_path)

    file_size = dest_path.stat().st_size
    doc = Document(
        filename=unique_filename,
        original_name="Maharashtra_7_12_Khed_Pune_Sample.png",
        file_path=str(dest_path),
        mime_type="image/png",
        file_size=file_size,
        status="Uploaded"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    audit = AuditLog(
        document_id=doc.id,
        action="SAMPLE_DOCUMENT_LOADED",
        actor="System Demo",
        details="Loaded pre-configured authentic Maharashtra 7/12 extract for Gat 142, Khed"
    )
    db.add(audit)
    db.commit()

    return {
        "id": doc.id,
        "filename": doc.filename,
        "original_name": doc.original_name,
        "file_size": doc.file_size,
        "mime_type": doc.mime_type,
        "status": doc.status,
        "uploaded_at": doc.uploaded_at.isoformat()
    }

@router.get("")
def list_documents(db: Session = Depends(get_db)):
    """Lists all uploaded documents."""
    docs = db.query(Document).order_by(Document.uploaded_at.desc()).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "original_name": d.original_name,
            "file_size": d.file_size,
            "mime_type": d.mime_type,
            "status": d.status,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
            "has_record": d.land_record is not None,
            "record_id": d.land_record.id if d.land_record else None
        }
        for d in docs
    ]

@router.get("/{document_id}")
def get_document(document_id: int, db: Session = Depends(get_db)):
    """Returns details for a specific document."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    return {
        "id": doc.id,
        "filename": doc.filename,
        "original_name": doc.original_name,
        "file_size": doc.file_size,
        "mime_type": doc.mime_type,
        "status": doc.status,
        "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
        "has_record": doc.land_record is not None,
        "record_id": doc.land_record.id if doc.land_record else None
    }

@router.get("/{document_id}/file")
def view_document_file(document_id: int, db: Session = Depends(get_db)):
    """Streams the raw PDF or image document for split-screen preview."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    file_path = Path(doc.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Physical file missing on server.")

    return FileResponse(file_path, media_type=doc.mime_type, filename=doc.original_name)
