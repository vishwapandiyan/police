'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { auth } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const DEMO_ACCOUNTS = [
  { username: 'sp_puducherry', password: 'demo123', role: 'Approving Authority', desc: 'Can approve/reject proposals' },
  { username: 'si_central', password: 'demo123', role: 'Initiator', desc: 'Can create and submit proposals' },
  { username: 'dsp_north', password: 'demo123', role: 'Reviewer', desc: 'Can review and return proposals' },
  { username: 'procurement_officer', password: 'demo123', role: 'Procurement Officer', desc: 'GeM & procurement intelligence' },
  { username: 'admin', password: 'admin123', role: 'Admin', desc: 'Full access' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await auth.login(username, password);
      // Fetch permissions
      const meRes = await fetch('http://localhost:5001/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${res.token}` },
      });
      const me = await meRes.json();
      login(res.token, { ...res.user, permissions: me.permissions || [] });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      {/* Header identity */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: '4px 4px 0 0',
          overflow: 'hidden',
          borderTop: '1px solid #d1d5db',
          borderLeft: '1px solid #d1d5db',
          borderRight: '1px solid #d1d5db',
          borderBottom: '3px solid #d4af37',
        }}
      >
        {/* Top navy strip: crest + text */}
        <div
          style={{
            background: '#1a2744',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <Image
            src="/prism-logo-icon.png"
            alt="Puducherry Police PRISM-PY"
            width={50}
            height={50}
            style={{ borderRadius: '50%', border: '2px solid #d4af37', display: 'block', flexShrink: 0 }}
            priority
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-0.5px', fontFamily: 'Georgia, serif' }}>PRISM</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#d4af37', letterSpacing: '-0.5px', fontFamily: 'Georgia, serif' }}>-PY</span>
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: 2 }}>
              Police Proposal Retrieval, Intelligence &amp; Strategy Matrix
            </div>
            <div style={{ fontSize: 8, color: '#d4af37', letterSpacing: '1px', textTransform: 'uppercase', marginTop: 1 }}>
              Puducherry Police — Intelligent Proposal Management System
            </div>
          </div>
        </div>

        {/* White strip: banner image on white background where it's designed to sit */}
        <div
          style={{
            background: 'white',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <Image
            src="/prism-logo-banner.png"
            alt="PRISM-PY — Puducherry Police"
            height={52}
            width={0}
            sizes="440px"
            style={{ width: 'auto', height: 52, objectFit: 'contain' }}
            priority
          />
        </div>
      </div>

      {/* Login form */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'white',
          border: '1px solid #d1d5db',
          borderTop: 'none',
          borderRadius: '0 0 4px 4px',
          padding: '24px',
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1a2744', marginBottom: 20 }}>
          Officer Sign In
        </h2>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 3,
                fontSize: 13,
                outline: 'none',
              }}
              placeholder="Enter your username"
            />
          </div>
          <div style={{ marginBottom: 18, position: 'relative' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
              Password
            </label>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '8px 36px 8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 3,
                fontSize: 13,
                outline: 'none',
              }}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              style={{
                position: 'absolute',
                right: 10,
                top: 28,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
              }}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {error && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 3 }}>
              <AlertCircle size={14} color="#dc2626" />
              <span style={{ fontSize: 12, color: '#b91c1c' }}>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '9px',
              background: loading ? '#9ca3af' : '#1a2744',
              color: 'white',
              border: 'none',
              borderRadius: 3,
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Demo accounts */}
        <div style={{ marginTop: 24, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
          <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 10, fontWeight: 600 }}>
            DEMO ACCOUNTS (Synthetic Data Only)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.username}
                type="button"
                onClick={() => quickLogin(acc.username, acc.password)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 10px',
                  background: '#f8f9fa',
                  border: '1px solid #e5e7eb',
                  borderRadius: 3,
                  cursor: 'pointer',
                  textAlign: 'left',
                  gap: 8,
                }}
              >
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1a2744' }}>{acc.username}</span>
                  <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 8 }}>{acc.desc}</span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    background: '#e8edf8',
                    color: '#1a2744',
                    padding: '1px 6px',
                    borderRadius: 2,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {acc.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <p style={{ marginTop: 16, fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
        PRISM-PY — Decision Support System. Not an official government system.<br />
        All data is synthetic and for demonstration purposes only.
      </p>
    </div>
  );
}
