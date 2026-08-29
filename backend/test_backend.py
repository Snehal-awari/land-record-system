import sys
from pathlib import Path
import json

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent))
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    with TestClient(app) as client:
        print("Testing Backend APIs...")

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health = res.json()
    print("[PASS] Health Check Passed:", health)

    # 2. Dashboard stats
    res = client.get("/api/dashboard/stats")
    assert res.status_code == 200, f"Stats failed: {res.text}"
    print("[PASS] Dashboard Stats:", res.json())

    # 3. Document list
    res = client.get("/api/documents")
    assert res.status_code == 200
    docs = res.json()
    print(f"[PASS] Documents in database: {len(docs)}")
    assert len(docs) > 0, "No initial seeded document found!"
    doc_id = docs[0]["id"]

    # 4. Get Extraction
    res = client.get(f"/api/extraction/{doc_id}")
    assert res.status_code == 200, f"Extraction get failed: {res.text}"
    ext_data = res.json()
    record_id = ext_data["record"]["id"]
    fields = ext_data["fields"]
    print(f"[PASS] Extraction retrieved. Record ID: {record_id}, Fields count: {len(fields)}")
    print(f"  Owner: {fields.get('owner_name', {}).get('current_value')}")
    print(f"  Gat: {fields.get('gat_number', {}).get('current_value')}")
    print(f"  Total Area: {fields.get('total_area', {}).get('current_value')}")

    # 5. Check validation results
    validations = ext_data["validations"]
    print(f"[PASS] Validation Results count: {len(validations)}")
    for v in validations:
        print(f"  [{v['status']}] {v['rule_name']}: {v['message']}")

    # 6. Test operator correction (Human-in-the-Loop)
    update_payload = {
        "field_key": "total_area",
        "corrected_value": "0.95",
        "operator_name": "Revenue Inspector Pawar"
    }
    res = client.put(f"/api/land-records/{record_id}/field", json=update_payload)
    assert res.status_code == 200, f"Field update failed: {res.text}"
    print("[PASS] Operator field correction applied successfully!")

    # Verify active learning entry
    res = client.get("/api/audit/active-learning")
    assert res.status_code == 200
    al_entries = res.json()
    print(f"[PASS] Active Learning entries logged: {len(al_entries)}")
    assert len(al_entries) > 0

    # 7. Test Cadastral GIS Locate
    res = client.get("/api/gis/locate?gat_number=142")
    assert res.status_code == 200, f"GIS locate failed: {res.text}"
    gis_res = res.json()
    print(f"[PASS] GIS plot located for Gat 142. Centroid: {gis_res['centroid']}")
    assert gis_res["found"] is True

    # 8. Test Official Verify & Save
    verify_payload = {
        "operator_name": "Revenue Inspector Pawar",
        "remarks": "Form 7/12 area discrepancy resolved to 0.95 Ha and verified."
    }
    res = client.post(f"/api/land-records/{record_id}/verify", json=verify_payload)
    assert res.status_code == 200, f"Verify failed: {res.text}"
    print("[PASS] Official Record Verification Completed!")

    # 9. Check Audit Trail
    res = client.get(f"/api/audit?document_id={doc_id}")
    assert res.status_code == 200
    audits = res.json()
    print(f"[PASS] Audit Trail count: {len(audits)}")

    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY! [OK]")

if __name__ == "__main__":
    run_tests()
