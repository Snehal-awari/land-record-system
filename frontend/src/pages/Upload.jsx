import React, { useState, useRef } from 'react';
import { uploadDocument, processDocumentAI, loadSampleDocument } from '../api';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  Image as ImageIcon,
  RefreshCw,
  X
} from 'lucide-react';

export default function Upload({ setCurrentTab, setSelectedDocId }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [sampleLoading, setSampleLoading] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file) return;
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Invalid file format. Please upload PDF, JPG, JPEG, or PNG.');
      return;
    }
    setErrorMessage(null);
    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndProcess = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setErrorMessage(null);

      // 1. Upload to backend
      const uploadedDoc = await uploadDocument(selectedFile);
      setUploading(false);

      // 2. Trigger Gemini AI Extraction
      setProcessing(true);
      await processDocumentAI(uploadedDoc.id, false);
      setProcessing(false);

      // 3. Navigate to Verification Workbench
      setSelectedDocId(uploadedDoc.id);
      setCurrentTab('verification');

    } catch (err) {
      setUploading(false);
      setProcessing(false);
      setErrorMessage(err.message || 'An error occurred during upload or AI processing.');
    }
  };

  const handleQuickSample = async () => {
    try {
      setSampleLoading(true);
      setErrorMessage(null);
      const doc = await loadSampleDocument();
      // Trigger AI extraction
      await processDocumentAI(doc.id, true);
      setSelectedDocId(doc.id);
      setCurrentTab('verification');
    } catch (err) {
      setErrorMessage('Sample loading failed: ' + err.message);
    } finally {
      setSampleLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="main-container" style={{ maxWidth: '1000px' }}>
      
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <UploadCloud size={22} color="var(--gov-navy)" />
            <span>सात-बारा दस्तऐवज अपलोड / Upload Land Record Document</span>
          </h1>
          <p className="page-subtitle">
            Upload scanned 7/12 land record PDF or image for Gemini Multimodal AI extraction and cadastral validation.
          </p>
        </div>
      </div>

      {/* Instant 1-Click Evaluation Banner */}
      <div className="gov-card" style={{ marginBottom: '20px', borderLeft: '4px solid var(--gov-teal)', backgroundColor: '#f0fdfa' }}>
        <div className="gov-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge" style={{ backgroundColor: '#ccfbf1', color: '#0f766e', border: '1px solid #99f6e4' }}>
                Instant Evaluator Test
              </span>
              <strong style={{ fontSize: '14px', color: 'var(--gov-navy-dark)' }}>
                Don't have a 7/12 document right now?
              </strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Load our pre-packaged authentic scanned Maharashtra 7/12 record (Khed, Gat 142) with Devanagari text, government stamps, and area discrepancy.
            </p>
          </div>
          <button
            onClick={handleQuickSample}
            disabled={sampleLoading || uploading || processing}
            className="btn btn-teal btn-lg"
          >
            <Sparkles size={16} />
            <span>{sampleLoading ? 'Loading & Extracting...' : '1-Click Sample Evaluation'}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="alert-box alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Main Upload Box */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <FileText size={16} />
            <span>Select or Drag Document (दस्तऐवज निवडा)</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Accepted: PDF, JPG, JPEG, PNG (Max 20MB)
          </span>
        </div>

        <div className="gov-card-body">
          
          {/* Dropzone */}
          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              style={{
                border: `2px dashed ${dragActive ? 'var(--gov-teal)' : 'var(--border-medium)'}`,
                backgroundColor: dragActive ? 'var(--gov-teal-light)' : '#f8fafc',
                borderRadius: '8px',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                style={{ display: 'none' }}
              />
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: 'var(--gov-navy)' }}>
                <UploadCloud size={28} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gov-navy-dark)', marginBottom: '6px' }}>
                Drag and drop your 7/12 document here
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                or click to browse from your computer
              </p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}>
                Browse Files
              </button>
            </div>
          ) : (
            /* Selected File Details & Preview */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f1f5f9', borderRadius: '6px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '8px', backgroundColor: '#ffffff', borderRadius: '4px', color: 'var(--gov-navy)' }}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--gov-navy-dark)', fontSize: '14px' }}>{selectedFile.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Document'}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={clearSelection}
                  className="btn btn-secondary btn-sm"
                  title="Remove file"
                  style={{ color: 'var(--gov-red)' }}
                >
                  <X size={14} />
                  <span>Remove</span>
                </button>
              </div>

              {/* Image Preview if available */}
              {previewUrl && (
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'left' }}>
                    Document Preview:
                  </div>
                  <div style={{ maxHeight: '340px', overflow: 'hidden', border: '1px solid var(--border-light)', borderRadius: '6px', backgroundColor: '#000000' }}>
                    <img 
                      src={previewUrl} 
                      alt="Selected 7/12 preview" 
                      style={{ maxHeight: '340px', width: 'auto', margin: '0 auto', display: 'block', objectFit: 'contain' }} 
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  onClick={clearSelection} 
                  className="btn btn-secondary"
                  disabled={uploading || processing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadAndProcess}
                  disabled={uploading || processing}
                  className="btn btn-primary btn-lg"
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      <span>Uploading Document...</span>
                    </>
                  ) : processing ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      <span>AI Multimodal Extraction in Progress...</span>
                    </>
                  ) : (
                    <>
                      <span>Process Document with Gemini AI</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}
