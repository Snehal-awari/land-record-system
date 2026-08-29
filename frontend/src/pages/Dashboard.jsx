import React, { useEffect, useState } from 'react';
import { getDashboardStats, getRecentDocuments, loadSampleDocument } from '../api';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  UploadCloud, 
  Eye, 
  MapPin, 
  Sparkles, 
  RefreshCw, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export default function Dashboard({ setCurrentTab, setSelectedDocId, setTargetGatNumber }) {
  const [stats, setStats] = useState({
    documents_processed: 0,
    successfully_extracted: 0,
    pending_verification: 0,
    validation_issues: 0
  });
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sampleLoading, setSampleLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sData, rData] = await Promise.all([
        getDashboardStats(),
        getRecentDocuments()
      ]);
      setStats(sData);
      setRecentDocs(rData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickSampleLoad = async () => {
    try {
      setSampleLoading(true);
      const doc = await loadSampleDocument();
      await fetchDashboardData();
      // Navigate to verification for this new document
      setSelectedDocId(doc.id);
      setCurrentTab('verification');
    } catch (err) {
      alert('Failed to load sample: ' + err.message);
    } finally {
      setSampleLoading(false);
    }
  };

  const handleOpenDoc = (docId) => {
    setSelectedDocId(docId);
    setCurrentTab('verification');
  };

  const handleLocateMap = (gatNo) => {
    if (gatNo && gatNo !== '-') {
      setTargetGatNumber(gatNo);
      setCurrentTab('map');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Verified':
        return <span className="badge badge-verified"><CheckCircle size={12} /> Verified</span>;
      case 'Needs Verification':
        return <span className="badge badge-pending"><Clock size={12} /> Needs Verification</span>;
      case 'Validation Error':
        return <span className="badge badge-error"><AlertTriangle size={12} /> Validation Error</span>;
      case 'Processing':
        return <span className="badge badge-info"><RefreshCw size={12} className="spin" /> Processing</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  return (
    <div className="main-container">
      {/* Header bar */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span>महसूल डॅशबोर्ड / Revenue Officer Dashboard</span>
          </h1>
          <p className="page-subtitle">
            Overview of AI digitized 7/12 land records, verification status, and cadastral validation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={fetchDashboardData} 
            className="btn btn-secondary btn-sm"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={handleQuickSampleLoad}
            className="btn btn-teal"
            disabled={sampleLoading}
          >
            <Sparkles size={16} />
            <span>{sampleLoading ? 'Loading Sample...' : 'Try 1-Click Sample 7/12'}</span>
          </button>
          <button 
            onClick={() => setCurrentTab('upload')} 
            className="btn btn-primary"
          >
            <UploadCloud size={16} />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Card 1: Documents Processed */}
        <div className="gov-card" style={{ borderLeft: '4px solid var(--gov-navy)' }}>
          <div className="gov-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Documents Processed
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--gov-navy-dark)', marginTop: '4px' }}>
                {stats.documents_processed}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Scanned 7/12 extracts
              </div>
            </div>
            <div style={{ backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '8px', color: 'var(--gov-navy)' }}>
              <FileText size={26} />
            </div>
          </div>
        </div>

        {/* Card 2: Successfully Extracted & Verified */}
        <div className="gov-card" style={{ borderLeft: '4px solid var(--gov-green)' }}>
          <div className="gov-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Successfully Verified
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--gov-green)', marginTop: '4px' }}>
                {stats.successfully_extracted}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Officer approved records
              </div>
            </div>
            <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px', color: 'var(--gov-green)' }}>
              <CheckCircle size={26} />
            </div>
          </div>
        </div>

        {/* Card 3: Pending Verification */}
        <div className="gov-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="gov-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Pending Verification
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#b45309', marginTop: '4px' }}>
                {stats.pending_verification}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Awaiting officer review
              </div>
            </div>
            <div style={{ backgroundColor: '#fffbeb', padding: '12px', borderRadius: '8px', color: '#b45309' }}>
              <Clock size={26} />
            </div>
          </div>
        </div>

        {/* Card 4: Validation Issues */}
        <div className="gov-card" style={{ borderLeft: '4px solid var(--gov-red)' }}>
          <div className="gov-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Validation Discrepancies
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--gov-red)', marginTop: '4px' }}>
                {stats.validation_issues}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Area / boundary alerts
              </div>
            </div>
            <div style={{ backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', color: 'var(--gov-red)' }}>
              <ShieldAlert size={26} />
            </div>
          </div>
        </div>

      </div>

      {/* Recent Land Records Table Card */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <FileText size={16} color="var(--gov-navy)" />
            <span>Recent Land Record Documents (अलिकडील अधिकार अभिलेख दस्तऐवज)</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing latest {recentDocs.length} entries
          </div>
        </div>

        <div className="gov-table-wrapper">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Gat / Survey No.</th>
                <th>Primary Owner (खातेदार)</th>
                <th>Village / Tehsil</th>
                <th>AI Confidence</th>
                <th>Status</th>
                <th>Uploaded At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentDocs.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No land records processed yet. Click <strong>"Try 1-Click Sample 7/12"</strong> or <strong>"Upload Document"</strong> to start.
                  </td>
                </tr>
              ) : (
                recentDocs.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--gov-navy-dark)' }}>{doc.filename}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{(doc.file_size / 1024).toFixed(1)} KB • {doc.mime_type}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--gov-navy)' }}>
                        {doc.gat_number !== '-' ? `Gat ${doc.gat_number}` : 'Pending AI'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{doc.owner_name}</div>
                    </td>
                    <td>
                      <div>{doc.village}</div>
                    </td>
                    <td>
                      {doc.confidence ? (
                        <span className={`badge ${doc.confidence >= 90 ? 'conf-high' : doc.confidence >= 80 ? 'conf-med' : 'conf-low'}`}>
                          {doc.confidence}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                    <td>{getStatusBadge(doc.status)}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenDoc(doc.id)}
                          className="btn btn-secondary btn-sm"
                          title="Open Split-Screen Verification Workbench"
                        >
                          <Eye size={13} />
                          <span>Verify</span>
                        </button>
                        {doc.gat_number && doc.gat_number !== '-' && (
                          <button
                            onClick={() => handleLocateMap(doc.gat_number)}
                            className="btn btn-teal btn-sm"
                            title="Locate Cadastral Parcel on Map"
                          >
                            <MapPin size={13} />
                            <span>Locate</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
