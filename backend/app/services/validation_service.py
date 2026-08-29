from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.entities import LandRecord, ValidationResult

class ValidationService:
    @staticmethod
    def validate_record(db: Session, record: LandRecord, fields_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Validates business and mathematical rules on extracted land record fields.
        Returns a list of validation results.
        """
        results = []

        def get_val(key: str, default=None):
            val = fields_dict.get(key)
            if isinstance(val, dict):
                return val.get("value")
            return val or getattr(record, key, default)

        def to_float(val):
            if val is None:
                return None
            try:
                # Clean up numbers like "1.00 हेक्टर" or "1.00 Ha"
                cleaned = str(val).split()[0].replace(",", ".").strip()
                return float(cleaned)
            except Exception:
                return None

        # 1. Area Mathematical Consistency Check:
        # Rule: pot_kharab_area + jirayat_area == total_area
        total_area = to_float(get_val("total_area"))
        pot_kharab = to_float(get_val("pot_kharab_area"))
        jirayat = to_float(get_val("jirayat_area"))
        cultivated = to_float(get_val("cultivated_area"))

        if total_area is not None and pot_kharab is not None and jirayat is not None:
            sum_parts = round(pot_kharab + jirayat, 4)
            tot = round(total_area, 4)
            diff = round(abs(tot - sum_parts), 4)

            if diff > 0.01:
                results.append({
                    "rule_name": "AREA_COMPONENT_SUM_CHECK",
                    "status": "WARNING",
                    "message": (
                        f"Discrepancy Alert: The sum of Pot Kharab ({pot_kharab:.2f} Ha) and Jirayat area "
                        f"({jirayat:.2f} Ha) is {sum_parts:.2f} Ha, which does not match the total recorded area "
                        f"({tot:.2f} Ha). Difference: {diff:.2f} Ha. Human verification required."
                    ),
                    "details": {
                        "total_area": tot,
                        "pot_kharab_area": pot_kharab,
                        "jirayat_area": jirayat,
                        "calculated_sum": sum_parts,
                        "discrepancy": diff
                    }
                })
            else:
                results.append({
                    "rule_name": "AREA_COMPONENT_SUM_CHECK",
                    "status": "VALID",
                    "message": f"Component areas (Pot Kharab + Jirayat = {sum_parts:.2f} Ha) match the total recorded area ({tot:.2f} Ha).",
                    "details": {"total_area": tot, "sum": sum_parts}
                })

        # 2. Cultivated Area vs Total Area
        if total_area is not None and cultivated is not None:
            if cultivated > total_area:
                results.append({
                    "rule_name": "CULTIVATED_EXCEEDS_TOTAL",
                    "status": "ERROR",
                    "message": f"Area Error: Cultivated area ({cultivated:.2f} Ha) cannot exceed the total recorded area ({total_area:.2f} Ha).",
                    "details": {"cultivated": cultivated, "total": total_area}
                })
            else:
                results.append({
                    "rule_name": "CULTIVATED_EXCEEDS_TOTAL",
                    "status": "VALID",
                    "message": "Cultivated area is within total area limits.",
                    "details": {"cultivated": cultivated, "total": total_area}
                })

        # 3. Mandatory Fields Completeness Check
        mandatory_fields = [
            ("owner_name", "Owner Name / खातेदाराचे नाव"),
            ("gat_number", "Gat / Survey Number / गट क्रमांक"),
            ("village", "Village / गाव"),
            ("district", "District / जिल्हा"),
            ("total_area", "Total Area / एकूण क्षेत्र")
        ]
        missing = []
        for key, label in mandatory_fields:
            val = get_val(key)
            if not val or str(val).strip() == "" or str(val).lower() == "null" or str(val).lower() == "none":
                missing.append(label)

        if missing:
            results.append({
                "rule_name": "MANDATORY_FIELDS_CHECK",
                "status": "WARNING",
                "message": f"Mandatory Fields Incomplete: The following critical fields are missing: {', '.join(missing)}.",
                "details": {"missing_fields": missing}
            })
        else:
            results.append({
                "rule_name": "MANDATORY_FIELDS_CHECK",
                "status": "VALID",
                "message": "All essential administrative and ownership fields are present.",
                "details": {}
            })

        # 4. Non-Negative Values Check
        for key, val_float, name in [
            ("total_area", total_area, "Total Area"),
            ("cultivated_area", cultivated, "Cultivated Area"),
            ("pot_kharab_area", pot_kharab, "Pot Kharab Area"),
            ("jirayat_area", jirayat, "Jirayat Area")
        ]:
            if val_float is not None and val_float < 0:
                results.append({
                    "rule_name": f"NEGATIVE_VALUE_{key.upper()}",
                    "status": "ERROR",
                    "message": f"Invalid Area: {name} cannot be negative ({val_float}).",
                    "details": {"field": key, "value": val_float}
                })

        # 5. Duplicate Gat/Survey Check in Database for the same village
        gat_no = str(get_val("gat_number") or "").strip()
        village = str(get_val("village") or "").strip()
        if gat_no and village:
            # Query existing records
            existing = db.query(LandRecord).filter(
                LandRecord.gat_number == gat_no,
                LandRecord.village == village,
                LandRecord.id != record.id
            ).first()
            if existing:
                results.append({
                    "rule_name": "DUPLICATE_PARCEL_CHECK",
                    "status": "WARNING",
                    "message": f"Potential Duplicate Notice: Gat No. {gat_no} in village '{village}' already exists in record #{existing.id}.",
                    "details": {"duplicate_record_id": existing.id, "gat_number": gat_no, "village": village}
                })
            else:
                results.append({
                    "rule_name": "DUPLICATE_PARCEL_CHECK",
                    "status": "VALID",
                    "message": f"Gat No. {gat_no} is unique within village '{village}'.",
                    "details": {}
                })

        return results

    @staticmethod
    def persist_validation_results(db: Session, record_id: int, results: List[Dict[str, Any]]):
        """Clears old validation results and stores updated results."""
        db.query(ValidationResult).filter(ValidationResult.land_record_id == record_id).delete()
        has_errors = False
        for r in results:
            if r["status"] == "ERROR":
                has_errors = True
            db_res = ValidationResult(
                land_record_id=record_id,
                rule_name=r["rule_name"],
                status=r["status"],
                message=r["message"],
                details=r.get("details")
            )
            db.add(db_res)
        
        record = db.query(LandRecord).filter(LandRecord.id == record_id).first()
        if record:
            record.has_validation_errors = has_errors
        db.commit()
