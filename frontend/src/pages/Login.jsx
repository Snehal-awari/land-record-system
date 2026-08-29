import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, CheckCircle } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('officer_pune');
  const [password, setPassword] = useState('revenue@2026');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLoginSuccess({
        username: username,
        full_name: 'Shri V. R. Deshmukh',
        role: 'Talathi / Revenue Officer (Khed Saza)'
      });
      setLoading(false);
    }, 400);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      {/* Top Ribbon */}
      <div className="gov-top-ribbon"></div>

      {/* Login Center Box */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          
          <div className="gov-card" style={{ borderTop: '4px solid var(--gov-navy)' }}>
            
            {/* Header / Department Info */}
            <div style={{ textAlign: 'center', padding: '28px 24px 16px 24px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                margin: '0 auto 12px auto', 
                backgroundColor: '#f8fafc', 
                border: '2px solid var(--gov-navy)', 
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gov-navy)'
              }}>
                <span style={{ fontSize: '20px' }}>🏛️</span>
                <span style={{ fontSize: '8px', fontWeight: 700 }}>GOV.IN</span>
              </div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--gov-navy-dark)', marginBottom: '4px' }}>
                Intelligent Land Record Digitization & Validation System
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--gov-teal)', fontWeight: 500 }}>
                महसूल व भूमी अभिलेख विभाग (Land Records Department)
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Smart India Hackathon 2026 • Problem Statement 26018
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  User ID / महसूल अधिकारी वापरकर्ता नाव
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 36px',
                      fontSize: '13px',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '4px',
                      outline: 'none'
                    }}
                    placeholder="Enter official username"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Password / पासवर्ड
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px 36px 36px',
                      fontSize: '13px',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '4px',
                      outline: 'none'
                    }}
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              {/* Demo credentials hint */}
              <div style={{ 
                backgroundColor: '#eff6ff', 
                border: '1px solid #bfdbfe', 
                padding: '8px 12px', 
                borderRadius: '4px', 
                fontSize: '11px', 
                color: '#1e40af',
                marginBottom: '20px'
              }}>
                <strong>SIH Evaluation Quick Login:</strong> Pre-filled with demo Revenue Inspector credentials. Click below to sign in instantly.
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? 'Authenticating...' : (
                  <>
                    <span>प्रवेश करा / Authenticate & Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div style={{ padding: '12px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border-light)', textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
              Protected Government Portal Demo • Mahabhulekh Digitization AI
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
