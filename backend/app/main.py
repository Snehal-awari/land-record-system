import os
import json
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models.entities import User, GisParcel, Document, LandRecord, ExtractedField, ValidationResult, AuditLog
from app.routers import (
    documents,
    extraction,
    land_records,
    validation,
    gis,
    dashboard,
    audit
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Land Record Digitization and Validation System for SIH 2026 PS 26018"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits dev frontend access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file directory for previews
app.mount("/static/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
app.mount("/static/samples", StaticFiles(directory=str(settings.SAMPLE_DIR)), name="samples")

# Register Routers under /api
app.include_router(documents.router, prefix=settings.API_PREFIX)
app.include_router(extraction.router, prefix=settings.API_PREFIX)
app.include_router(land_records.router, prefix=settings.API_PREFIX)
app.include_router(validation.router, prefix=settings.API_PREFIX)
app.include_router(gis.router, prefix=settings.API_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_PREFIX)
app.include_router(audit.router, prefix=settings.API_PREFIX)

@app.get("/api/health")
def health_check():
    api_key_configured = bool(os.environ.get("GEMINI_API_KEY", settings.GEMINI_API_KEY).strip())
    return {
        "status": "healthy",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "demo_mode": settings.DEMO_MODE,
        "gemini_api_configured": api_key_configured,
        "database": "SQLite (Modular / SQLAlchemy)"
    }

@app.on_event("startup")
def startup_seed_data():
    """Seeds initial user, cadastral parcels, and initial demo record if database is fresh."""
    db = SessionLocal()
    try:
        # 1. Seed Default User
        if not db.query(User).first():
            demo_user = User(
                username="officer_pune",
                full_name="Shri V. R. Deshmukh",
                role="Talathi / Revenue Officer"
            )
            db.add(demo_user)
            db.commit()

        # 2. Seed GIS Parcels from GeoJSON
        if not db.query(GisParcel).first():
            geojson_file = settings.SAMPLE_DIR / "cadastral_parcels.geojson"
            if geojson_file.exists():
                with open(geojson_file, "r", encoding="utf-8") as f:
                    geo_data = json.load(f)
                    for feat in geo_data.get("features", []):
                        props = feat.get("properties", {})
                        parcel = GisParcel(
                            gat_number=str(props.get("gat_number")),
                            survey_number=props.get("survey_number"),
                            village=props.get("village", "Khed"),
                            tehsil=props.get("tehsil", "Khed"),
                            district=props.get("district", "Pune"),
                            area_ha=float(props.get("area_ha", 1.0)),
                            owner_name=props.get("owner_name", "Unknown"),
                            geojson_geometry=feat.get("geometry", {})
                        )
                        db.add(parcel)
                db.commit()

        # 3. Seed Initial Demo Document & Extraction for instant evaluation
        if not db.query(Document).first():
            sample_src = settings.SAMPLE_DIR / "sample_7_12.png"
            if sample_src.exists():
                init_doc_name = "Maharashtra_7_12_Khed_Gat142.png"
                init_doc_path = settings.UPLOAD_DIR / init_doc_name
                import shutil
                shutil.copyfile(sample_src, init_doc_path)

                doc = Document(
                    filename=init_doc_name,
                    original_name="Maharashtra_7_12_Khed_Gat142.png",
                    file_path=str(init_doc_path),
                    mime_type="image/png",
                    file_size=init_doc_path.stat().st_size,
                    status="Needs Verification"
                )
                db.add(doc)
                db.commit()
                db.refresh(doc)

                # Trigger extraction pipeline
                from app.routers.extraction import process_document_ai
                process_document_ai(document_id=doc.id, force_demo=True, db=db)

    except Exception as e:
        print(f"Error during startup seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
