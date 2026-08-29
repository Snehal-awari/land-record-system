

const API_BASE = "https://land-record-system-0itr.onrender.com/api";

export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function getDashboardStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  return res.json();
}

export async function getRecentDocuments() {
  const res = await fetch(`${API_BASE}/dashboard/recent`);
  return res.json();
}

export async function listDocuments() {
  const res = await fetch(`${API_BASE}/documents`);
  return res.json();
}

export async function getDocument(docId) {
  const res = await fetch(`${API_BASE}/documents/${docId}`);
  return res.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to upload document");
  }
  return res.json();
}

export async function loadSampleDocument() {
  const res = await fetch(`${API_BASE}/documents/load-sample`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Failed to load sample document");
  }
  return res.json();
}

export async function processDocumentAI(docId, forceDemo = false) {
  const res = await fetch(`${API_BASE}/extraction/process/${docId}?force_demo=${forceDemo}`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "AI extraction failed");
  }
  return res.json();
}

export async function getExtractedRecord(docId) {
  const res = await fetch(`${API_BASE}/extraction/${docId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch extracted record");
  }
  return res.json();
}

export async function updateRecordField(recordId, fieldKey, correctedValue, operatorName = "Revenue Inspector") {
  const res = await fetch(`${API_BASE}/land-records/${recordId}/field`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      field_key: fieldKey,
      corrected_value: correctedValue,
      operator_name: operatorName,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update field");
  }
  return res.json();
}

export async function verifyLandRecord(recordId, operatorName = "Revenue Inspector", remarks = "Verified by operator") {
  const res = await fetch(`${API_BASE}/land-records/${recordId}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      operator_name: operatorName,
      remarks: remarks,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to verify record");
  }
  return res.json();
}

export async function getCadastralParcels() {
  const res = await fetch(`${API_BASE}/gis/parcels`);
  if (!res.ok) {
    throw new Error("Failed to load cadastral parcels");
  }
  return res.json();
}

export async function locatePlot(gatNumber, village = null) {
  let url = `${API_BASE}/gis/locate?gat_number=${encodeURIComponent(gatNumber)}`;
  if (village) {
    url += `&village=${encodeURIComponent(village)}`;
  }
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Cadastral plot not found");
  }
  return res.json();
}

export async function getAuditTrail(docId = null) {
  let url = `${API_BASE}/audit`;
  if (docId) {
    url += `?document_id=${docId}`;
  }
  const res = await fetch(url);
  return res.json();
}

export async function getActiveLearningDataset() {
  const res = await fetch(`${API_BASE}/audit/active-learning`);
  return res.json();
}
