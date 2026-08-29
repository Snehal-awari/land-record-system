import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

FIELD_DEFINITIONS = [
    ("owner_name", "Primary Owner Name", "मुख्य खातेदाराचे नाव"),
    ("co_owners", "Co-Owners / Joint Holders", "इतर सह-हिस्सेदार"),
    ("gat_number", "Gat / Block Number", "गट क्रमांक"),
    ("survey_number", "Survey Number", "सर्व्हे क्रमांक"),
    ("khasra_number", "Khasra Number", "खसरा क्रमांक"),
    ("khata_number", "Khata Number", "खाते क्रमांक"),
    ("village", "Village", "गाव"),
    ("tehsil", "Tehsil / Taluka", "तालुका"),
    ("district", "District", "जिल्हा"),
    ("state", "State", "राज्य"),
    ("total_area", "Total Recorded Area (Ha)", "एकूण क्षेत्र (हेक्टर)"),
    ("cultivated_area", "Cultivated Area (Ha)", "लागवडीयोग्य क्षेत्र (हेक्टर)"),
    ("pot_kharab_area", "Pot Kharab Area (Ha)", "पोटखराब क्षेत्र (हेक्टर)"),
    ("jirayat_area", "Jirayat Area (Ha)", "जिरायत क्षेत्र (हेक्टर)"),
    ("land_classification", "Land Classification", "जमिनीचे वर्गीकरण"),
    ("ownership_type", "Ownership Type / Tenure", "भूधारणा पद्धती"),
    ("mutation_number", "Mutation Entry Number", "फेरफार क्रमांक"),
    ("mutation_date", "Mutation Date", "फेरफार दिनांक"),
    ("registration_number", "Registration Number", "नोंदणी क्रमांक"),
    ("registration_date", "Registration Date", "नोंदणी दिनांक"),
    ("remarks", "Remarks & Encumbrances", "शेरा व इतर अधिकार")
]

SYSTEM_PROMPT = """You are an expert land-record document extraction assistant specializing in Indian cadastral records (especially Maharashtra Form 7/12 - Saat-Baara extracts).
Analyze the uploaded document visually and textually.
Read Marathi/Devanagari, English, and other supported Indian-language text carefully.
Extract ONLY information actually present in the document.
DO NOT guess or hallucinate missing information.
If a value is not present in the document, return null for that field and explain in source_text that it was not found.
For each extracted field, provide an honest confidence score from 0 to 100 based on text legibility, stamp interference, and clarity.
Identify ambiguous or unreadable fields with a confidence score below 80 so human operators can verify them."""

EXTRACTION_PROMPT = """Analyze this uploaded land record document (e.g. 7/12 extract).
Extract the following 21 structured fields into a valid JSON object:
1. owner_name (string or null)
2. co_owners (string or null)
3. gat_number (string or null)
4. survey_number (string or null)
5. khasra_number (string or null)
6. khata_number (string or null)
7. village (string or null)
8. tehsil (string or null)
9. district (string or null)
10. state (string or null)
11. total_area (numeric string in hectares/ares, or null)
12. cultivated_area (numeric string in hectares, or null)
13. pot_kharab_area (numeric string in hectares, or null)
14. jirayat_area (numeric string in hectares, or null)
15. land_classification (e.g. Jirayat, Bagayat, Class 1, or null)
16. ownership_type (e.g. Bhogvatadar Class 1 / Class 2, or null)
17. mutation_number (string or null)
18. mutation_date (string or null)
19. registration_number (string or null)
20. registration_date (string or null)
21. remarks (encumbrances, bank loans, notes, or null)

Format your output strictly as a JSON object with this exact structure:
{
  "document_type": "Maharashtra Form 7/12 Land Record",
  "overall_confidence": 92.5,
  "fields": {
    "field_key": {
      "value": "extracted text or number",
      "confidence": 95.0,
      "source_text": "verbatim text snippet found in document",
      "bounding_box": null
    }
  }
}
Return only JSON without markdown fences if possible, or inside a clean ```json block."""

class GeminiService:
    @staticmethod
    def extract_document(file_path: Path, mime_type: str, force_demo: bool = False) -> Dict[str, Any]:
        """
        Extracts structured land record fields from PDF or image using Gemini API.
        Falls back smoothly to high-fidelity demo data if API key is not provided or demo is requested.
        """
        api_key = os.environ.get("GEMINI_API_KEY", settings.GEMINI_API_KEY).strip()
        
        # If no API key is provided or force_demo is True, use demo fallback
        if not api_key or force_demo:
            logger.info("Using high-fidelity Demo Mode for document extraction.")
            return GeminiService._load_demo_extraction()

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)

            # Read file bytes
            with open(file_path, "rb") as f:
                file_bytes = f.read()

            # Upload / prepare part
            part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)

            # Model candidates to try in order
            candidate_models = [
                settings.GEMINI_MODEL,
                "gemini-3.6-flash",
                "gemini-3.7-flash",
                "gemini-3.5-flash",
                "gemini-flash-latest"
            ]
            # Deduplicate while preserving order
            seen = set()
            models_to_try = [m for m in candidate_models if not (m in seen or seen.add(m))]

            response = None
            last_err = None
            for model_name in models_to_try:
                try:
                    logger.info(f"Attempting live extraction with model: {model_name}")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=[
                            SYSTEM_PROMPT,
                            part,
                            EXTRACTION_PROMPT
                        ],
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.1
                        )
                    )
                    if response and response.text:
                        break
                except Exception as me:
                    last_err = me
                    logger.warning(f"Model {model_name} failed: {me}. Trying next candidate...")

            if not response or not response.text:
                raise last_err or Exception("All Gemini model candidates failed to respond.")

            response_text = response.text.strip()
            # Clean markdown fences if any
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

            parsed = json.loads(response_text)
            return GeminiService._normalize_extraction(parsed)

        except Exception as e:
            logger.warning(f"Live Gemini extraction failed ({str(e)}). Falling back to Demo Mode data.")
            fallback = GeminiService._load_demo_extraction()
            fallback["warning"] = f"Live Gemini API call failed: {str(e)}. Displaying simulated high-fidelity extraction."
            return fallback

    @staticmethod
    def _normalize_extraction(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Ensures all 21 fields are populated with proper labels, keys, and confidence values."""
        raw_fields = raw_data.get("fields", {})
        normalized_fields = {}
        total_conf = 0.0
        field_count = 0

        for key, en_label, mr_label in FIELD_DEFINITIONS:
            f_data = raw_fields.get(key, {})
            if isinstance(f_data, dict):
                val = f_data.get("value")
                conf = float(f_data.get("confidence", 85.0))
                src = f_data.get("source_text", "")
                bbox = f_data.get("bounding_box")
            else:
                val = str(f_data) if f_data is not None else None
                conf = 85.0 if val else 0.0
                src = ""
                bbox = None

            total_conf += conf
            field_count += 1

            normalized_fields[key] = {
                "key": key,
                "label_en": en_label,
                "label_mr": mr_label,
                "value": val,
                "confidence": round(conf, 1),
                "source_text": src,
                "bounding_box": bbox,
                "status": "AI Extracted"
            }

        overall_conf = round(total_conf / field_count, 1) if field_count > 0 else 85.0
        return {
            "document_type": raw_data.get("document_type", "Maharashtra Form 7/12 Land Record"),
            "overall_confidence": overall_conf,
            "fields": normalized_fields,
            "is_demo_mode": False
        }

    @staticmethod
    def _load_demo_extraction() -> Dict[str, Any]:
        """Loads predefined accurate demo extraction for the sample 7/12 document."""
        demo_file = settings.SAMPLE_DIR / "demo_extracted_record.json"
        if demo_file.exists():
            with open(demo_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                data["is_demo_mode"] = True
                return data
        
        # Fallback if file not found
        return {
            "document_type": "Maharashtra Form 7/12 Land Record",
            "overall_confidence": 88.5,
            "is_demo_mode": True,
            "fields": {}
        }
