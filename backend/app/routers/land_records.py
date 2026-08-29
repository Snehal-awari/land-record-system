import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import LandRecord, ExtractedField, Document, AuditLog, ActiveLearningEntry
from app.services.validation_service import ValidationService

router = APIRouter(prefix="/land-records", tags=["land-records"])

class FieldUpdateRequest(BaseModel):
    field_key: str
    corrected_value: str
    operator_name: str = "Revenue Inspector"

class VerifyRecordRequest(BaseModel):
    operator_name: str = "Revenue Inspector"
    remarks: str = "Verified in accordance with official revenue guidelines"

@router.get("/{record_id}")
def get_record(record_id: int, db: Session = Depends(get_db)):
    """Retrieves land record summary."""
    rec = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Land record not found.")

    return {
        "id": rec.id,
        "document_id": rec.document_id,
        "owner_name": rec.owner_name,
        "gat_number": rec.gat_number,
        "survey_number": rec.survey_number,
        "village": rec.village,
        "district": rec.district,
        "total_area": rec.total_area,
        "overall_confidence": rec.overall_confidence,
        "is_verified": rec.is_verified,
        "verified_by": rec.verified_by,
        "verified_at": rec.verified_at.isoformat() if rec.verified_at else None,
        "has_validation_errors": rec.has_validation_errors
    }

@router.put("/{record_id}/field")
def update_field_operator(
    record_id: int,
    req: FieldUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Human-in-the-loop: Updates an extracted field with human operator correction.
    Stores correction in active learning dataset and audit trail, then revalidates.
    """
    rec = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Land record not found.")

    field = db.query(ExtractedField).filter(
        ExtractedField.land_record_id == record_id,
        ExtractedField.field_key == req.field_key
    ).first()

    if not field:
        raise HTTPException(status_code=404, detail=f"Field '{req.field_key}' not found on record.")

    old_val = field.current_value
    field.current_value = req.corrected_value
    field.status = "Corrected by Operator"

    # Update top-level LandRecord attribute if column exists
    if hasattr(rec, req.field_key):
        try:
            if "area" in req.field_key:
                cleaned_num = float(str(req.corrected_value).split()[0].replace(",", ".").strip())
                setattr(rec, req.field_key, cleaned_num)
            else:
                setattr(rec, req.field_key, req.corrected_value)
        except Exception:
            setattr(rec, req.field_key, req.corrected_value)

    # Store in Active Learning Dataset table for future model retraining
    active_learning = ActiveLearningEntry(
        land_record_id=rec.id,
        field_key=req.field_key,
        original_ai_value=field.original_value,
        corrected_value=req.corrected_value,
        confidence=field.confidence,
        document_type="Maharashtra 7/12 Extract"
    )
    db.add(active_learning)

    # Add to Audit Trail
    audit = AuditLog(
        document_id=rec.document_id,
        action="OPERATOR_FIELD_CORRECTION",
        actor=req.operator_name,
        details=f"Field '{field.label_en}' modified from '{old_val}' to '{req.corrected_value}'"
    )
    db.add(audit)
    db.commit()

    # Re-run Validation Checks
    all_fields = db.query(ExtractedField).filter(ExtractedField.land_record_id == record_id).all()
    fields_dict = {f.field_key: {"value": f.current_value} for f in all_fields}
    validation_results = ValidationService.validate_record(db, rec, fields_dict)
    ValidationService.persist_validation_results(db, rec.id, validation_results)

    # Refresh document status if errors resolved
    has_errors = any(r["status"] == "ERROR" for r in validation_results)
    doc = db.query(Document).filter(Document.id == rec.document_id).first()
    if doc and not rec.is_verified:
        doc.status = "Validation Error" if has_errors else "Needs Verification"
        db.commit()

    return {
        "success": True,
        "field": {
            "key": field.field_key,
            "label_en": field.label_en,
            "original_value": field.original_value,
            "current_value": field.current_value,
            "confidence": field.confidence,
            "status": field.status
        },
        "validations": validation_results
    }

@router.post("/{record_id}/verify")
def verify_land_record(
    record_id: int,
    req: VerifyRecordRequest,
    db: Session = Depends(get_db)
):
    """
    Marks the entire land record as officially verified by the revenue officer.
    Updates statuses, marks remaining fields as verified, and records in audit log.
    """
    rec = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Land record not found.")

    rec.is_verified = True
    rec.verified_by = req.operator_name
    rec.verified_at = datetime.datetime.utcnow()

    # Update document status
    doc = db.query(Document).filter(Document.id == rec.document_id).first()
    if doc:
        doc.status = "Verified"

    # Mark all fields as verified if not marked corrected
    fields = db.query(ExtractedField).filter(ExtractedField.land_record_id == record_id).all()
    for f in fields:
        if f.status != "Corrected by Operator":
            f.status = "Verified"

    # Audit log
    audit = AuditLog(
        document_id=rec.document_id,
        action="RECORD_OFFICIALLY_VERIFIED",
        actor=req.operator_name,
        details=f"Record #{rec.id} for Gat {rec.gat_number} verified and approved. Remarks: {req.remarks}"
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "record_id": rec.id,
        "is_verified": True,
        "verified_by": rec.verified_by,
        "verified_at": rec.verified_at.isoformat(),
        "document_status": doc.status if doc else "Verified"
    }
