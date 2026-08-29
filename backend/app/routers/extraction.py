import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.entities import Document, LandRecord, ExtractedField, AuditLog, ValidationResult
from app.services.gemini_service import GeminiService
from app.services.validation_service import ValidationService

router = APIRouter(prefix="/extraction", tags=["extraction"])

@router.post("/process/{document_id}")
def process_document_ai(
    document_id: int,
    force_demo: bool = Query(False),
    db: Session = Depends(get_db)
):
    """
    Sends document to Gemini for multimodal extraction or loads demo extraction.
    Creates structured LandRecord, ExtractedField entries, runs validation checks,
    and updates document status.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    doc.status = "Processing"
    db.commit()

    # Call extraction service
    file_path = Path(doc.file_path)
    extraction = GeminiService.extract_document(
        file_path=file_path,
        mime_type=doc.mime_type,
        force_demo=force_demo or settings.DEMO_MODE
    )

    fields_dict = extraction.get("fields", {})

    def get_fval(k):
        f = fields_dict.get(k, {})
        return f.get("value") if isinstance(f, dict) else f

    def to_float(val):
        if val is None:
            return None
        try:
            return float(str(val).split()[0].replace(",", ".").strip())
        except Exception:
            return None

    # Check if a LandRecord already exists for this document
    record = db.query(LandRecord).filter(LandRecord.document_id == document_id).first()
    if not record:
        record = LandRecord(document_id=document_id)
        db.add(record)
        db.flush()

    # Populate LandRecord fields
    record.owner_name = get_fval("owner_name")
    record.co_owners = get_fval("co_owners")
    record.gat_number = str(get_fval("gat_number") or "").strip()
    record.survey_number = str(get_fval("survey_number") or "").strip()
    record.khasra_number = str(get_fval("khasra_number") or "").strip()
    record.khata_number = str(get_fval("khata_number") or "").strip()
    record.village = get_fval("village")
    record.tehsil = get_fval("tehsil")
    record.district = get_fval("district")
    record.state = get_fval("state") or "Maharashtra"
    record.total_area = to_float(get_fval("total_area"))
    record.cultivated_area = to_float(get_fval("cultivated_area"))
    record.pot_kharab_area = to_float(get_fval("pot_kharab_area"))
    record.jirayat_area = to_float(get_fval("jirayat_area"))
    record.land_classification = get_fval("land_classification")
    record.ownership_type = get_fval("ownership_type")
    record.mutation_number = str(get_fval("mutation_number") or "").strip()
    record.mutation_date = str(get_fval("mutation_date") or "").strip()
    record.registration_number = str(get_fval("registration_number") or "").strip()
    record.registration_date = str(get_fval("registration_date") or "").strip()
    record.remarks = get_fval("remarks")
    record.overall_confidence = float(extraction.get("overall_confidence", 85.0))
    record.is_verified = False

    # Store individual extracted fields
    db.query(ExtractedField).filter(ExtractedField.land_record_id == record.id).delete()
    
    needs_verification = False
    for k, fdata in fields_dict.items():
        if isinstance(fdata, dict):
            conf = float(fdata.get("confidence", 85.0))
            if conf < 80.0:
                needs_verification = True
            
            field_entry = ExtractedField(
                land_record_id=record.id,
                field_key=k,
                label_en=fdata.get("label_en", k.replace("_", " ").title()),
                label_mr=fdata.get("label_mr", k),
                original_value=str(fdata.get("value")) if fdata.get("value") is not None else None,
                current_value=str(fdata.get("value")) if fdata.get("value") is not None else None,
                confidence=conf,
                source_text=fdata.get("source_text"),
                bounding_box=fdata.get("bounding_box"),
                status="AI Extracted"
            )
            db.add(field_entry)

    db.commit()

    # Perform Validation Rules
    validation_results = ValidationService.validate_record(db, record, fields_dict)
    ValidationService.persist_validation_results(db, record.id, validation_results)

    # Determine final document status
    has_errors = any(r["status"] == "ERROR" for r in validation_results)
    has_warnings = any(r["status"] == "WARNING" for r in validation_results)

    if has_errors:
        doc.status = "Validation Error"
    elif has_warnings or needs_verification:
        doc.status = "Needs Verification"
    else:
        doc.status = "Extracted"

    doc.processed_at = datetime.datetime.utcnow()
    db.commit()

    # Create Audit Trail Entries
    audit_extract = AuditLog(
        document_id=doc.id,
        action="AI_EXTRACTION_COMPLETED",
        actor="Gemini Multimodal 2.5 Flash" if not extraction.get("is_demo_mode") else "System Demo Extraction",
        details=f"Extracted 21 structured land-record fields. Overall Confidence: {record.overall_confidence}%"
    )
    db.add(audit_extract)

    audit_val = AuditLog(
        document_id=doc.id,
        action="VALIDATION_RULES_EVALUATED",
        actor="Automated Business Rules Engine",
        details=f"Executed rules. Status: {doc.status}. Total checks: {len(validation_results)}"
    )
    db.add(audit_val)
    db.commit()

    return {
        "success": True,
        "document_id": doc.id,
        "document_status": doc.status,
        "record_id": record.id,
        "overall_confidence": record.overall_confidence,
        "is_demo_mode": extraction.get("is_demo_mode", False),
        "validation_summary": {
            "has_errors": has_errors,
            "has_warnings": has_warnings,
            "results_count": len(validation_results)
        }
    }

@router.get("/{document_id}")
def get_extracted_record(document_id: int, db: Session = Depends(get_db)):
    """Retrieves the full extracted record with fields and validation results."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    record = db.query(LandRecord).filter(LandRecord.document_id == document_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="No extracted land record found for this document yet.")

    fields = db.query(ExtractedField).filter(ExtractedField.land_record_id == record.id).all()
    validations = db.query(ValidationResult).filter(ValidationResult.land_record_id == record.id).all()

    fields_map = {}
    for f in fields:
        fields_map[f.field_key] = {
            "id": f.id,
            "key": f.field_key,
            "label_en": f.label_en,
            "label_mr": f.label_mr,
            "original_value": f.original_value,
            "current_value": f.current_value,
            "confidence": f.confidence,
            "source_text": f.source_text,
            "bounding_box": f.bounding_box,
            "status": f.status
        }

    return {
        "document": {
            "id": doc.id,
            "filename": doc.filename,
            "original_name": doc.original_name,
            "status": doc.status,
            "mime_type": doc.mime_type,
            "file_size": doc.file_size,
            "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
            "processed_at": doc.processed_at.isoformat() if doc.processed_at else None,
            "preview_url": f"/api/documents/{doc.id}/file"
        },
        "record": {
            "id": record.id,
            "overall_confidence": record.overall_confidence,
            "is_verified": record.is_verified,
            "verified_by": record.verified_by,
            "verified_at": record.verified_at.isoformat() if record.verified_at else None,
            "has_validation_errors": record.has_validation_errors,
            "gat_number": record.gat_number,
            "village": record.village,
            "district": record.district,
            "total_area": record.total_area
        },
        "fields": fields_map,
        "validations": [
            {
                "id": v.id,
                "rule_name": v.rule_name,
                "status": v.status,
                "message": v.message,
                "details": v.details
            }
            for v in validations
        ]
    }
