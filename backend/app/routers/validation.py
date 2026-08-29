from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import LandRecord, ExtractedField, ValidationResult
from app.services.validation_service import ValidationService

router = APIRouter(prefix="/validation", tags=["validation"])

@router.get("/{record_id}")
def get_validation_results(record_id: int, db: Session = Depends(get_db)):
    """Fetches all validation results for a land record."""
    rec = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Land record not found.")

    results = db.query(ValidationResult).filter(ValidationResult.land_record_id == record_id).all()
    return [
        {
            "id": r.id,
            "rule_name": r.rule_name,
            "status": r.status,
            "message": r.message,
            "details": r.details,
            "created_at": r.created_at.isoformat()
        }
        for r in results
    ]

@router.post("/{record_id}/revalidate")
def revalidate_record(record_id: int, db: Session = Depends(get_db)):
    """Forces re-evaluation of validation rules against current field values."""
    rec = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Land record not found.")

    fields = db.query(ExtractedField).filter(ExtractedField.land_record_id == record_id).all()
    fields_dict = {f.field_key: {"value": f.current_value} for f in fields}

    new_results = ValidationService.validate_record(db, rec, fields_dict)
    ValidationService.persist_validation_results(db, rec.id, new_results)

    return {
        "success": True,
        "record_id": rec.id,
        "results": new_results
    }
