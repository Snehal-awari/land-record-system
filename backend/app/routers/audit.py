from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import AuditLog, ActiveLearningEntry

router = APIRouter(prefix="/audit", tags=["audit"])

@router.get("")
def get_audit_trail(
    document_id: Optional[int] = Query(None),
    limit: int = Query(50),
    db: Session = Depends(get_db)
):
    """Fetches chronological audit trail entries."""
    query = db.query(AuditLog)
    if document_id is not None:
        query = query.filter(AuditLog.document_id == document_id)
    
    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "document_id": log.document_id,
            "action": log.action,
            "actor": log.actor,
            "details": log.details,
            "timestamp": log.timestamp.isoformat()
        }
        for log in logs
    ]

@router.get("/active-learning")
def get_active_learning_dataset(
    limit: int = Query(50),
    db: Session = Depends(get_db)
):
    """
    Returns the Human-in-the-Loop corrections dataset.
    This stores ground truth operator corrections for future model fine-tuning.
    """
    entries = db.query(ActiveLearningEntry).order_by(ActiveLearningEntry.created_at.desc()).limit(limit).all()
    return [
        {
            "id": e.id,
            "land_record_id": e.land_record_id,
            "field_key": e.field_key,
            "original_ai_value": e.original_ai_value,
            "corrected_value": e.corrected_value,
            "original_confidence": e.confidence,
            "document_type": e.document_type,
            "created_at": e.created_at.isoformat()
        }
        for e in entries
    ]
