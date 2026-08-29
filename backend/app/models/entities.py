import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), default="Revenue Inspector")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    status = Column(String(50), default="Uploaded")  # Uploaded, Processing, Extracted, Needs Verification, Verified, Validation Error
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    land_record = relationship("LandRecord", back_populates="document", uselist=False, cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="document", cascade="all, delete-orphan")

class LandRecord(Base):
    __tablename__ = "land_records"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, unique=True)
    
    # 21 Structured Fields
    owner_name = Column(String(255), nullable=True)
    co_owners = Column(Text, nullable=True)
    gat_number = Column(String(50), nullable=True, index=True)
    survey_number = Column(String(50), nullable=True)
    khasra_number = Column(String(50), nullable=True)
    khata_number = Column(String(50), nullable=True)
    village = Column(String(100), nullable=True, index=True)
    tehsil = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    state = Column(String(100), default="Maharashtra")
    
    # Area Fields (Standardized to Hectares or Ares)
    total_area = Column(Float, nullable=True)
    cultivated_area = Column(Float, nullable=True)
    pot_kharab_area = Column(Float, nullable=True)
    jirayat_area = Column(Float, nullable=True)
    
    # Legal / Administrative
    land_classification = Column(String(100), nullable=True)
    ownership_type = Column(String(100), nullable=True)
    mutation_number = Column(String(50), nullable=True)
    mutation_date = Column(String(50), nullable=True)
    registration_number = Column(String(50), nullable=True)
    registration_date = Column(String(50), nullable=True)
    remarks = Column(Text, nullable=True)

    # Verification status
    overall_confidence = Column(Float, default=0.0)
    is_verified = Column(Boolean, default=False)
    verified_by = Column(String(100), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    has_validation_errors = Column(Boolean, default=False)

    document = relationship("Document", back_populates="land_record")
    extracted_fields = relationship("ExtractedField", back_populates="land_record", cascade="all, delete-orphan")
    validation_results = relationship("ValidationResult", back_populates="land_record", cascade="all, delete-orphan")
    active_learning_entries = relationship("ActiveLearningEntry", back_populates="land_record", cascade="all, delete-orphan")

class ExtractedField(Base):
    __tablename__ = "extracted_fields"

    id = Column(Integer, primary_key=True, index=True)
    land_record_id = Column(Integer, ForeignKey("land_records.id"), nullable=False)
    field_key = Column(String(50), nullable=False)
    label_en = Column(String(100), nullable=False)
    label_mr = Column(String(100), nullable=False)
    original_value = Column(Text, nullable=True)
    current_value = Column(Text, nullable=True)
    confidence = Column(Float, default=0.0)  # 0 to 100
    source_text = Column(Text, nullable=True)
    bounding_box = Column(JSON, nullable=True)
    status = Column(String(50), default="AI Extracted")  # AI Extracted, Corrected by Operator, Verified

    land_record = relationship("LandRecord", back_populates="extracted_fields")

class ValidationResult(Base):
    __tablename__ = "validation_results"

    id = Column(Integer, primary_key=True, index=True)
    land_record_id = Column(Integer, ForeignKey("land_records.id"), nullable=False)
    rule_name = Column(String(100), nullable=False)
    status = Column(String(20), nullable=False)  # VALID, WARNING, ERROR
    message = Column(Text, nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    land_record = relationship("LandRecord", back_populates="validation_results")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    action = Column(String(100), nullable=False)
    actor = Column(String(100), default="Revenue Inspector")
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    document = relationship("Document", back_populates="audit_logs")

class ActiveLearningEntry(Base):
    __tablename__ = "active_learning_dataset"

    id = Column(Integer, primary_key=True, index=True)
    land_record_id = Column(Integer, ForeignKey("land_records.id"), nullable=False)
    field_key = Column(String(50), nullable=False)
    original_ai_value = Column(Text, nullable=True)
    corrected_value = Column(Text, nullable=True)
    confidence = Column(Float, default=0.0)
    document_type = Column(String(50), default="Maharashtra 7/12 Extract")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    land_record = relationship("LandRecord", back_populates="active_learning_entries")

class GisParcel(Base):
    __tablename__ = "gis_parcels"

    id = Column(Integer, primary_key=True, index=True)
    gat_number = Column(String(50), index=True, nullable=False)
    survey_number = Column(String(50), nullable=True)
    village = Column(String(100), nullable=False)
    tehsil = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    area_ha = Column(Float, nullable=False)
    owner_name = Column(String(255), nullable=False)
    geojson_geometry = Column(JSON, nullable=False)
