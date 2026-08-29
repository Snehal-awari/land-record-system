import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Verification from './pages/Verification';
import MapView from './pages/MapView';
import AuditTrail from './pages/AuditTrail';
import { getHealth } from './api';

export default function App() {
  const [user, setUser] = useState({
    username: 'officer_pune',
    full_name: 'Shri V. R. Deshmukh',
    role: 'Talathi / Revenue Officer (Khed Saza)'
  });

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedDocId, setSelectedDocId] = useState(1);
  const [targetGatNumber, setTargetGatNumber] = useState('142');
  const [demoMode, setDemoMode] = useState(true);

  useEffect(() => {
    getHealth()
      .then((data) => {
        if (data && typeof data.demo_mode === 'boolean') {
          setDemoMode(data.demo_mode || !data.gemini_api_configured);
        }
      })
      .catch((err) => console.log('Backend health check error:', err));
  }, []);

  // If user is not logged in, display Login page
  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
      {/* Official Government Portal Header & Nav */}
      <Header 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        user={user} 
        onLogout={() => setUser(null)}
        demoMode={demoMode}
      />

      {/* Main Page Content */}
      <main style={{ flex: 1 }}>
        {currentTab === 'dashboard' && (
          <Dashboard 
            setCurrentTab={setCurrentTab}
            setSelectedDocId={setSelectedDocId}
            setTargetGatNumber={setTargetGatNumber}
          />
        )}

        {currentTab === 'upload' && (
          <Upload 
            setCurrentTab={setCurrentTab}
            setSelectedDocId={setSelectedDocId}
          />
        )}

        {currentTab === 'verification' && (
          <Verification 
            selectedDocId={selectedDocId}
            setSelectedDocId={setSelectedDocId}
            setCurrentTab={setCurrentTab}
            setTargetGatNumber={setTargetGatNumber}
          />
        )}

        {currentTab === 'map' && (
          <MapView 
            targetGatNumber={targetGatNumber}
            setTargetGatNumber={setTargetGatNumber}
            setCurrentTab={setCurrentTab}
            setSelectedDocId={setSelectedDocId}
          />
        )}

        {currentTab === 'audit' && (
          <AuditTrail />
        )}
      </main>

      {/* Government Footer */}
      <footer style={{ backgroundColor: '#ffffff', borderTop: '1px solid var(--border-light)', padding: '14px 24px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
        <div>
          महाराष्ट्र शासन • महसूल व भूमी अभिलेख विभाग | Government of Maharashtra • Revenue & Land Records
        </div>
        <div style={{ fontSize: '11px', marginTop: '2px', color: 'var(--text-muted)' }}>
          Smart India Hackathon 2026 Prototype • Problem Statement 26018: Intelligent Land Record Digitization & Validation System
        </div>
      </footer>
    </div>
  );
}
