import React, { useEffect, useState } from 'react';
import { 
  getExtractedRecord, 
  updateRecordField, 
  verifyLandRecord, 
  listDocuments 
} from '../api';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  MapPin, 
  Edit3, 
  Check, 
  X, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  ShieldCheck, 
  History, 
  UserCheck,
  ChevronDown
} from 'lucide-react';

const API_BASE = "http://localhost:8000";

export default function Verification({ 
  selectedDocId, 
  setSelectedDocId, 
  setCurrentTab, 
  setTargetGatNumber 
}) {
  const [data, setData] = useState(null);
  const [allDocs, setAllDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Split-screen image viewer zoom & transform
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // Field editing state
  const [editingFieldKey, setEditingFieldKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [updating, setUpdating] = useState(false);

  // Verification modal / state
  const [verifying, setVerifying] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);

  const fetchRecord = async (docId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getExtractedRecord(docId);
      setData(res);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load extraction record');
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentsList = async () => {
    try {
      const docs = await listDocuments();
      setAllDocs(docs);
      if (!selectedDocId && docs.length > 0) {
        setSelectedDocId(docs[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDocumentsList();
  }, []);

  useEffect(() => {
    if (selectedDocId) {
      fetchRecord(selectedDocId);
    }
  }, [selectedDocId]);

  const handleStartEdit = (key, currentVal) => {
    setEditingFieldKey(key);
    setEditValue(currentVal || '');
  };

  const handleCancelEdit = () => {
    setEditingFieldKey(null);
    setEditValue('');
  };

  const handleSaveEdit = async (fieldKey) => {
    if (!data?.record?.id) return;
    try {
      setUpdating(true);
      const res = await updateRecordField(
        data.record.id,
        fieldKey,
        editValue,
        "Revenue Inspector (Operator)"
      );

      // Update local state with the updated field and new validation results
      setData((prev) => {
        const newFields = { ...prev.fields };
        newFields[fieldKey] = {
          ...newFields[fieldKey],
          current_value: res.field.current_value,
          status: res.field.status
        };
        return {
          ...prev,
          fields: newFields,
          validations: res.validations
        };
      });

      setEditingFieldKey(null);
      setSuccessBanner(`Field '${fieldKey}' updated and logged to Active Learning Dataset!`);
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err) {
      alert('Failed to update field: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleVerifyAndSave = async () => {
    if (!data?.record?.id) return;
    try {
      setVerifying(true);
      const res = await verifyLandRecord(
        data.record.id,
        "Shri V. R. Deshmukh (Talathi)",
        "Officially inspected, reconciled, and verified for digital cadastral record."
      );
      
      setData((prev) => ({
        ...prev,
        record: {
          ...prev.record,
          is_verified: true,
          verified_by: res.verified_by,
          verified_at: res.verified_at
        },
        document: {
          ...prev.document,
          status: "Verified"
        }
      }));

      setSuccessBanner("Land Record officially verified and sealed by Revenue Officer!");
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err) {
      alert("Verification failed: " + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleLocateOnMap = () => {
    const gat = data?.fields?.gat_number?.current_value || data?.record?.gat_number;
    if (gat) {
      setTargetGatNumber(gat);
      setCurrentTab('map');
    }
  };

  // Group fields into 4 structured sections
  const fieldGroups = [
    {
      groupTitle: "१. भूखंड व प्रशासकीय ओळख (Parcel Identification)",
      keys: ["gat_number", "survey_number", "khasra_number", "khata_number", "village", "tehsil", "district", "state"]
    },
    {
      groupTitle: "२. खातेदार व भूधारणा हक्क (Ownership & Tenure)",
      keys: ["owner_name", "co_owners", "ownership_type"]
    },
    {
      groupTitle: "३. जमिनीचे क्षेत्र व वर्गीकरण (Area & Classification)",
      keys: ["total_area", "cultivated_area", "pot_kharab_area", "jirayat_area", "land_classification"]
    },
    {
      groupTitle: "४. फेरफार, नोंदणी व शेरा (Mutation & Registration)",
      keys: ["mutation_number", "mutation_date", "registration_number", "registration_date", "remarks"]
    }
  ];

  if (loading && !data) {
    return (
      <div className="main-container" style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--gov-navy)' }}>
          Loading extraction workbench...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="main-container">
        <div className="alert-box alert-danger">
          <AlertCircle size={20} />
          <div>
            <strong>Error:</strong> {error || "No document loaded. Please upload a document or pick a sample."}
          </div>
        </div>
        <button onClick={() => setCurrentTab('upload')} className="btn btn-primary">
          Go to Upload Page
        </button>
      </div>
    );
  }

  const { document, record, fields, validations } = data;
  const isVerified = record?.is_verified;

  // Check validation statuses
  const warningList = validations?.filter(v => v.status === 'WARNING') || [];
  const errorList = validations?.filter(v => v.status === 'ERROR') || [];

  return (
    <div className="main-container" style={{ maxWidth: '1600px', paddingBottom: '40px' }}>
      
      {/* Top Action Bar */}
      <div className="page-header" style={{ marginBottom: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title" style={{ fontSize: '18px' }}>
              <span>अधिकार अभिलेख पडताळणी कार्यपीठ / Split-Screen Verification Workbench</span>
            </h1>
            {isVerified ? (
              <span className="badge badge-verified">
                <CheckCircle size={12} /> Officially Verified
              </span>
            ) : warningList.length > 0 || errorList.length > 0 ? (
              <span className="badge badge-error">
                <AlertTriangle size={12} /> Needs Verification
              </span>
            ) : (
              <span className="badge badge-pending">
                AI Extracted
              </span>
            )}
          </div>
          <p className="page-subtitle">
            Document: <strong>{document.original_name}</strong> • Record #{record.id} • Gat {record.gat_number || '-'}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          
          {/* Document Switcher Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Switch Document:</span>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(Number(e.target.value))}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                border: '1px solid var(--border-medium)',
                borderRadius: '4px',
                backgroundColor: '#ffffff'
              }}
            >
              {allDocs.map((d) => (
                <option key={d.id} value={d.id}>
                  Doc #{d.id}: {d.original_name} ({d.status})
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleLocateOnMap}
            className="btn btn-teal"
            title="Locate Cadastral Polygon on Map"
          >
            <MapPin size={16} />
            <span>Locate on Map</span>
          </button>

          <button
            onClick={() => setCurrentTab('audit')}
            className="btn btn-secondary"
            title="View full audit log"
          >
            <History size={16} />
            <span>Audit Trail</span>
          </button>

          <button
            onClick={handleVerifyAndSave}
            disabled={verifying || isVerified}
            className={`btn ${isVerified ? 'btn-secondary' : 'btn-success'}`}
          >
            <ShieldCheck size={16} />
            <span>{isVerified ? 'Record Approved & Sealed' : 'Verify & Save Record'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="alert-box alert-success" style={{ marginBottom: '14px' }}>
          <CheckCircle size={18} />
          <div>{successBanner}</div>
        </div>
      )}

      {/* Validation Discrepancy Alert Box */}
      {warningList.map((w, idx) => (
        <div key={idx} className="alert-box alert-warning" style={{ marginBottom: '14px' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', marginBottom: '2px' }}>
              {w.rule_name === 'AREA_COMPONENT_SUM_CHECK' ? 'Discrepancy Alert: Area Calculation Mismatch' : w.rule_name}
            </strong>
            <span>{w.message}</span>
          </div>
        </div>
      ))}

      {errorList.map((e, idx) => (
        <div key={idx} className="alert-box alert-danger" style={{ marginBottom: '14px' }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', marginBottom: '2px' }}>Critical Validation Error</strong>
            <span>{e.message}</span>
          </div>
        </div>
      ))}

      {/* SPLIT SCREEN WORKBENCH */}
      <div className="split-workbench">
        
        {/* LEFT PANEL: Original Document Preview */}
        <div className="workbench-panel">
          
          <div className="workbench-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} color="var(--gov-navy)" />
              <strong style={{ fontSize: '13px', color: 'var(--gov-navy-dark)' }}>
                मूळ स्कॅन दस्तऐवज / Original Scanned Document
              </strong>
            </div>

            {/* Viewer Zoom Controls */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.2))}
                className="btn btn-secondary btn-sm"
                title="Zoom Out"
                style={{ padding: '4px 6px' }}
              >
                <ZoomOut size={14} />
              </button>
              <span style={{ fontSize: '11px', fontWeight: 600, minWidth: '42px', textAlign: 'center' }}>
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(2.2, prev + 0.2))}
                className="btn btn-secondary btn-sm"
                title="Zoom In"
                style={{ padding: '4px 6px' }}
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => setZoomLevel(1.0)}
                className="btn btn-secondary btn-sm"
                title="Reset Zoom"
                style={{ padding: '4px 6px' }}
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          <div 
            className="workbench-panel-content"
            style={{ 
              backgroundColor: '#334155', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'flex-start',
              overflow: 'auto',
              padding: '16px'
            }}
          >
            {document.mime_type === 'application/pdf' ? (
              <iframe
                src={`${API_BASE}${document.preview_url}`}
                title="PDF Preview"
                style={{ width: '100%', height: '100%', border: 'none', minHeight: '600px' }}
              />
            ) : (
              <div 
                style={{ 
                  transform: `scale(${zoomLevel})`, 
                  transformOrigin: 'top center',
                  transition: 'transform 0.1s ease',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                <img
                  src={`${API_BASE}${document.preview_url}`}
                  alt="Scanned 7/12 land record"
                  style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: AI Extracted Land Record */}
        <div className="workbench-panel">
          
          <div className="workbench-panel-header">
            <div>
              <strong style={{ fontSize: '13px', color: 'var(--gov-navy-dark)' }}>
                AI Extracted Land Record (अधिकार अभिलेख पत्रक)
              </strong>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Multimodal Gemini Extraction • Maharashtra Form 7/12
              </div>
            </div>

            {/* Overall Confidence Score */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Overall Confidence:</span>
              <span className={`badge ${record.overall_confidence >= 90 ? 'conf-high' : record.overall_confidence >= 80 ? 'conf-med' : 'conf-low'}`}>
                {record.overall_confidence}%
              </span>
            </div>
          </div>

          <div className="workbench-panel-content" style={{ padding: '16px' }}>
            
            {/* Confidence Legend Bar */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid var(--border-light)', marginBottom: '16px', fontSize: '11px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Confidence Scale:</span>
              <span className="badge conf-high">≥ 90% High</span>
              <span className="badge conf-med">80-89% Medium</span>
              <span className="badge conf-low">&lt; 80% Needs Verification</span>
            </div>

            {/* Grouped Fields Form */}
            {fieldGroups.map((group, gIdx) => (
              <div key={gIdx} style={{ marginBottom: '20px' }}>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: 700, 
                  color: 'var(--gov-navy)', 
                  backgroundColor: '#edf2f7', 
                  padding: '6px 10px', 
                  borderRadius: '4px',
                  marginBottom: '10px',
                  borderLeft: '3px solid var(--gov-navy)'
                }}>
                  {group.groupTitle}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {group.keys.map((key) => {
                    const field = fields[key];
                    if (!field) return null;

                    const isEditing = editingFieldKey === key;
                    const isLowConf = field.confidence < 80;
                    const isCorrected = field.status === 'Corrected by Operator';

                    return (
                      <div 
                        key={key}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          padding: '8px 12px',
                          border: `1px solid ${isLowConf ? 'var(--conf-low-border)' : isCorrected ? '#bfdbfe' : 'var(--border-light)'}`,
                          backgroundColor: isLowConf ? 'var(--conf-low-bg)' : isCorrected ? '#eff6ff' : '#ffffff',
                          borderRadius: '4px',
                          gap: '12px'
                        }}
                      >
                        {/* Field Label */}
                        <div style={{ flex: '0 0 35%' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {field.label_en}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--gov-teal)', fontWeight: 500 }}>
                            {field.label_mr}
                          </div>
                          {field.source_text && (
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontStyle: 'italic' }}>
                              Source: "{field.source_text}"
                            </div>
                          )}
                        </div>

                        {/* Field Value / Editor */}
                        <div style={{ flex: 1 }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                style={{
                                  flex: 1,
                                  padding: '4px 8px',
                                  fontSize: '12px',
                                  border: '1px solid var(--gov-teal)',
                                  borderRadius: '4px',
                                  outline: 'none'
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEdit(key)}
                                disabled={updating}
                                className="btn btn-primary btn-sm"
                                title="Save Correction"
                                style={{ padding: '4px 8px' }}
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="btn btn-secondary btn-sm"
                                title="Cancel"
                                style={{ padding: '4px 8px' }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                                {field.current_value || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not found / null</span>}
                              </div>
                              {field.original_value !== field.current_value && (
                                <div style={{ fontSize: '10px', color: '#1e40af', marginTop: '2px' }}>
                                  Original AI: {field.original_value}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Confidence & Status Badges */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flex: '0 0 auto' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span 
                              className={`badge ${field.confidence >= 90 ? 'conf-high' : field.confidence >= 80 ? 'conf-med' : 'conf-low'}`}
                              title={`Confidence: ${field.confidence}%`}
                            >
                              {field.confidence}%
                            </span>

                            {!isEditing && (
                              <button
                                onClick={() => handleStartEdit(key, field.current_value)}
                                className="btn btn-secondary btn-sm"
                                title="Operator Edit"
                                style={{ padding: '3px 6px', fontSize: '11px' }}
                              >
                                <Edit3 size={11} />
                                <span>Edit</span>
                              </button>
                            )}
                          </div>

                          {/* Status Tag */}
                          {isCorrected ? (
                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#1e40af' }}>
                              ✎ Corrected by Operator
                            </span>
                          ) : isLowConf ? (
                            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--gov-red)' }}>
                              ⚠ Human Verification Required
                            </span>
                          ) : isVerified ? (
                            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--gov-green)' }}>
                              ✓ Verified
                            </span>
                          ) : null}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

          </div>
        </div>

      </div>

    </div>
  );
}
