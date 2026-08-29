import React, { useEffect, useState } from 'react';
import { getAuditTrail, getActiveLearningDataset } from '../api';
import { 
  History, 
  Database, 
  CheckCircle, 
  Edit3, 
  ShieldCheck, 
  UploadCloud, 
  RefreshCw, 
  Download,
  BrainCircuit,
  Filter
} from 'lucide-react';

export default function AuditTrail() {
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' or 'active-learning'
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeLearningData, setActiveLearningData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [logs, alData] = await Promise.all([
        getAuditTrail(),
        getActiveLearningDataset()
      ]);
      setAuditLogs(logs);
      setActiveLearningData(alData);
    } catch (err) {
      console.error("Error fetching audit data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getActionBadge = (action) => {
    if (action.includes('UPLOAD')) {
      return <span className="badge badge-info"><UploadCloud size={11} /> Upload</span>;
    }
    if (action.includes('AI') || action.includes('EXTRACTION')) {
      return <span className="badge badge-pending"><BrainCircuit size={11} /> AI Extraction</span>;
    }
    if (action.includes('CORRECTION') || action.includes('OPERATOR')) {
      return <span className="badge" style={{ backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' }}><Edit3 size={11} /> Correction</span>;
    }
    if (action.includes('VERIFIED') || action.includes('APPROVED')) {
      return <span className="badge badge-verified"><CheckCircle size={11} /> Verification</span>;
    }
    return <span className="badge badge-info">{action}</span>;
  };

  const handleExportJSON = () => {
    const dataToExport = activeTab === 'audit' ? auditLogs : activeLearningData;
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="main-container" style={{ maxWidth: '1400px' }}>
      
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <History size={22} color="var(--gov-navy)" />
            <span>अभिलेख लेखापरीक्षण व सक्रिय शिक्षण / Audit Trail & Active Learning</span>
          </h1>
          <p className="page-subtitle">
            Complete transparency log of system events, operator corrections, and ground truth active learning dataset.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchData} className="btn btn-secondary btn-sm" title="Refresh">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button onClick={handleExportJSON} className="btn btn-teal btn-sm" title="Export Dataset">
            <Download size={14} />
            <span>Export {activeTab === 'audit' ? 'Audit Log' : 'Dataset'} (JSON)</span>
          </button>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
        <button
          onClick={() => setActiveTab('audit')}
          className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '13px' }}
        >
          <History size={15} />
          <span>System Audit Trail ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('active-learning')}
          className={`btn ${activeTab === 'active-learning' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '13px' }}
        >
          <BrainCircuit size={15} />
          <span>Active Learning Dataset ({activeLearningData.length})</span>
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'audit' ? (
        /* AUDIT TRAIL TABLE */
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <History size={16} />
              <span>Chronological Event History (घटनाक्रम नोंदवही)</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Immutable Government Audit Log
            </div>
          </div>

          <div className="gov-table-wrapper">
            <table className="gov-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Log ID</th>
                  <th style={{ width: '180px' }}>Timestamp</th>
                  <th style={{ width: '160px' }}>Action Type</th>
                  <th style={{ width: '180px' }}>Actor / Role</th>
                  <th>Action Details & Notes</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No audit entries recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{log.id}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {new Date(log.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'medium' })}
                      </td>
                      <td>{getActionBadge(log.action)}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--gov-navy-dark)', fontSize: '13px' }}>
                          {log.actor}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px' }}>{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ACTIVE LEARNING DATASET TABLE */
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <BrainCircuit size={16} />
              <span>Human-in-the-Loop Active Learning Corrections (सक्रिय शिक्षण डेटासेट)</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Curated ground-truth corrections stored for future model retraining
            </div>
          </div>

          <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', borderBottom: '1px solid #bbf7d0', fontSize: '12px', color: '#166534' }}>
            <strong>Continuous Learning Architecture:</strong> Whenever a human operator corrects a low-confidence or discrepant field, the pairing of <code>(Original AI Value, Ground Truth Corrected Value, Confidence)</code> is automatically persisted here. In future iterations, this dataset feeds into fine-tuning LoRA adapters or prompt few-shots.
          </div>

          <div className="gov-table-wrapper">
            <table className="gov-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Entry ID</th>
                  <th style={{ width: '140px' }}>Field Key</th>
                  <th style={{ width: '220px' }}>Original AI Value</th>
                  <th style={{ width: '220px' }}>Operator Corrected Value</th>
                  <th style={{ width: '120px' }}>AI Confidence</th>
                  <th style={{ width: '180px' }}>Document Type</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {activeLearningData.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No operator corrections recorded yet. Edit a field on the Verification screen to log an active learning entry.
                    </td>
                  </tr>
                ) : (
                  activeLearningData.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{item.id}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--gov-navy)' }}>{item.field_key}</span>
                      </td>
                      <td>
                        <span style={{ textDecoration: 'line-through', color: 'var(--gov-red)' }}>
                          {item.original_ai_value || 'null'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--gov-green)' }}>
                          {item.corrected_value}
                        </strong>
                      </td>
                      <td>
                        <span className="badge conf-low">{item.original_confidence}%</span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {item.document_type}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(item.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
