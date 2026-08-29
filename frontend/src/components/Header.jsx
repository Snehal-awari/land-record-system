import React from 'react';
import { FileText, Map, ShieldCheck, History, UploadCloud, LayoutDashboard, UserCheck, AlertCircle, LogOut } from 'lucide-react';

export default function Header({ currentTab, setCurrentTab, user, onLogout, demoMode = true }) {
  return (
    <header>
      {/* Indian National Tricolor Ribbon */}
      <div className="gov-top-ribbon"></div>

      {/* Top Accessibility & Ministry Bar */}
      <div className="gov-sub-bar">
        <div className="gov-sub-bar-left">
          <span>भारत सरकार | Government of India</span>
          <span>•</span>
          <span>महाराष्ट्र शासन | Government of Maharashtra</span>
          <span>•</span>
          <span>महसूल व भूमी अभिलेख विभाग (Revenue & Land Records)</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span>SIH 2026 Prototype • PS 26018</span>
          <span style={{ color: 'var(--border-dark)' }}>|</span>
          <span style={{ fontWeight: 600, color: 'var(--gov-navy)' }}>मराठी / English</span>
        </div>
      </div>

      {/* Main Government Portal Header */}
      <div className="gov-header">
        <div className="gov-branding">
          <div className="gov-emblem">
            <span style={{ fontSize: '14px', lineHeight: 1 }}>🏛️</span>
            <span>सत्यमेव</span>
            <span>जयते</span>
          </div>
          <div className="gov-title-group">
            <h1>Intelligent Land Record Digitization & Validation System</h1>
            <h2>राष्ट्रीय ई-भूलेख व डिजिटल अधिकार अभिलेख (Form 7/12) AI पडताळणी प्रणाली</h2>
          </div>
        </div>

        <div className="gov-header-actions">
          {/* Subtle Demo Mode Indicator */}
          {demoMode && (
            <div className="badge badge-demo" title="System running in prototype Demo Mode with pre-configured sample 7/12 data">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ea580c', display: 'inline-block' }}></span>
              Demo Mode Active (Sample 7/12 Ready)
            </div>
          )}

          {/* User Profile Badge */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px', borderLeft: '1px solid var(--border-light)' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gov-navy-dark)' }}>{user.full_name || 'Shri V. R. Deshmukh'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.role || 'Talathi / Revenue Officer'}</div>
              </div>
              <button 
                onClick={onLogout}
                className="btn btn-secondary btn-sm"
                title="Logout"
                style={{ padding: '6px', borderRadius: '4px' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="gov-nav">
        <button
          className={`gov-nav-link ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentTab('dashboard')}
        >
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </button>

        <button
          className={`gov-nav-link ${currentTab === 'upload' ? 'active' : ''}`}
          onClick={() => setCurrentTab('upload')}
        >
          <UploadCloud size={16} />
          <span>Upload Land Record</span>
        </button>

        <button
          className={`gov-nav-link ${currentTab === 'verification' ? 'active' : ''}`}
          onClick={() => setCurrentTab('verification')}
        >
          <FileText size={16} />
          <span>Extraction & Verification Workbench</span>
        </button>

        <button
          className={`gov-nav-link ${currentTab === 'map' ? 'active' : ''}`}
          onClick={() => setCurrentTab('map')}
        >
          <Map size={16} />
          <span>Cadastral GIS Map</span>
        </button>

        <button
          className={`gov-nav-link ${currentTab === 'audit' ? 'active' : ''}`}
          onClick={() => setCurrentTab('audit')}
        >
          <History size={16} />
          <span>Audit Trail & Active Learning</span>
        </button>
      </nav>
    </header>
  );
}
