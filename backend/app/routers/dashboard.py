from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import Document, LandRecord, ValidationResult

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Computes top KPI statistics for the dashboard."""
    total_docs = db.query(Document).count()
    verified_docs = db.query(Document).filter(Document.status == "Verified").count()
    pending_docs = db.query(Document).filter(Document.status.in_(["Uploaded", "Processing", "Needs Verification"])).count()
    validation_issues = db.query(Document).filter(Document.status == "Validation Error").count()
    
    # Also check records with warnings
    warning_records = db.query(ValidationResult).filter(ValidationResult.status.in_(["WARNING", "ERROR"])).distinct(ValidationResult.land_record_id).count()

    return {
        "documents_processed": total_docs,
        "successfully_extracted": verified_docs,
        "pending_verification": pending_docs,
        "validation_issues": max(validation_issues, warning_records)
    }

@router.get("/recent")
def get_recent_documents(db: Session = Depends(get_db)):
    """Returns recent documents with record status and key metadata."""
    docs = db.query(Document).order_by(Document.uploaded_at.desc()).limit(10).all()
    
    output = []
    for d in docs:
        rec = d.land_record
        output.append({
            "id": d.id,
            "filename": d.original_name,
            "mime_type": d.mime_type,
            "file_size": d.file_size,
            "status": d.status,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
            "record_id": rec.id if rec else None,
            "gat_number": rec.gat_number if rec else "-",
            "village": rec.village if rec else "-",
            "owner_name": rec.owner_name if rec else "-",
            "confidence": rec.overall_confidence if rec else None,
            "is_verified": rec.is_verified if rec else False
        })
    return output
