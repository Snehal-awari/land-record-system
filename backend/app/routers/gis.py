from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entities import LandRecord
from app.services.gis_service import gis_provider

router = APIRouter(prefix="/gis", tags=["gis"])

@router.get("/parcels")
def get_cadastral_geojson():
    """
    Returns full GeoJSON FeatureCollection containing all cadastral parcel polygons.
    Sample data represents village Khed, Taluka Khed, Pune (Gat 141 - 145).
    """
    return gis_provider.get_cadastral_layer()

@router.get("/locate")
def locate_plot(
    gat_number: str = Query(..., description="Gat or Survey Number to locate"),
    village: Optional[str] = Query(None, description="Village name"),
    db: Session = Depends(get_db)
):
    """
    Finds a cadastral parcel polygon by Gat / Survey number.
    Cross-references with local LandRecords database to provide live extraction link if available.
    """
    feature = gis_provider.find_plot(gat_number, village)
    if not feature:
        raise HTTPException(
            status_code=404,
            detail=f"Cadastral parcel for Gat/Survey '{gat_number}' not found in current GIS coverage."
        )

    # Search for an associated extracted LandRecord in database
    cleaned_gat = str(gat_number).replace("Gat", "").replace("गट", "").strip()
    rec = db.query(LandRecord).filter(
        (LandRecord.gat_number == cleaned_gat) | (LandRecord.survey_number.contains(cleaned_gat))
    ).first()

    return {
        "found": True,
        "feature": feature,
        "centroid": gis_provider._calculate_centroid(feature.get("geometry", {})),
        "associated_record_id": rec.id if rec else None,
        "associated_document_id": rec.document_id if rec else None,
        "is_verified": rec.is_verified if rec else False
    }

@router.get("/plots-summary")
def get_all_plots_summary():
    """Returns list of summary cards for all available cadastral parcels."""
    return gis_provider.get_all_plots_summary()
