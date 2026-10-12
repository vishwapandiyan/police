'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, AlertCircle, Lock } from 'lucide-react';
import { auth } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const DEMO_ACCOUNTS = [
  { username: 'sp_puducherry',        password: 'demo123', role: 'Approving Authority', badge: 'badge-approved' },
  { username: 'dsp_north',            password: 'demo123', role: 'Reviewer',             badge: 'badge-review'   },
  { username: 'si_central',           password: 'demo123', role: 'Initiator',            badge: 'badge-impl'     },
  { username: 'procurement_officer',  password: 'demo123', role: 'Procurement Officer',  badge: 'badge-pending'  },
  { username: 'implementation_officer',password:'demo123', role: 'Implementation Officer',badge:'badge-normal'   },
  { username: 'auditor',              password: 'demo123', role: 'Auditor',              badge: 'badge-draft'    },
  { username: 'admin',                password: 'admin123',role: 'System Admin',         badge: 'badge-high'     },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('sp_puducherry');
  const [password, setPassword] = useState('demo123');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await auth.login(username, password);
      const meRes = await fetch('http://localhost:5001/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${res.token}` },
      });
      const me = await meRes.json();
      login(res.token, { ...res.user, permissions: me.permissions || [] });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F7FA',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top institutional header bar */}
      <div style={{
        background: 'var(--gov-navy)',
        borderBottom: '3px solid var(--gov-gold)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        <Image src="/prism-logo-icon.png" alt="Puducherry Police" width={44} height={44}
          style={{ borderRadius: '50%', border: '2px solid var(--gov-gold)' }} priority />
        <div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.01em' }}>PUDUCHERRY POLICE</div>
          <div style={{ color: 'var(--gov-gold-light)', fontSize: '0.65rem', fontWeight: 500 }}>
            PRISM-PY — Police Proposal Retrieval, Intelligence &amp; Strategy Matrix
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ background: '#fff8e1', border: '1px solid #e6c84a', borderRadius: 3, padding: '2px 9px', fontSize: '0.65rem', fontWeight: 700, color: '#7a5500' }}>
            SYNTHETIC DEMO
          </span>
        </div>
      </div>

      {/* Main login area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        gap: 32,
        flexWrap: 'wrap',
      }}>

        {/* Left: banner image visible on white */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, maxWidth: 380 }}>
          <Image
            src="/prism-logo-banner.png"
            alt="PRISM-PY — Puducherry Police"
            width={380}
            height={0}
            sizes="380px"
            style={{ width: '100%', height: 'auto', maxWidth: 380 }}
            priority
          />
          <div style={{
            background: 'white', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-md)',
            padding: '14px 16px', fontSize: '0.78rem', color: 'var(--gov-text-sec)', lineHeight: 1.6,
          }}>
            <strong style={{ color: 'var(--gov-navy)' }}>PRISM-PY</strong> provides intelligent decision support for
            departmental proposal management using historical precedents, policy intelligence and procurement data.<br /><br />
            <em style={{ color: 'var(--gov-muted)', fontSize: '0.72rem' }}>
              Demonstration system — Synthetic data only. Not an official government application.
            </em>
          </div>
        </div>

        {/* Right: login card */}
        <div style={{
          background: 'white',
          border: '1px solid var(--gov-border)',
          borderRadius: 'var(--r-lg)',
          width: '100%',
          maxWidth: 420,
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          {/* Card header */}
          <div style={{
            background: 'var(--gov-navy)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderBottom: '2px solid var(--gov-gold)',
          }}>
            <Lock size={16} color="var(--gov-gold-light)" />
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>Officer Sign In</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.7rem' }}>Authorised personnel only</div>
            </div>
          </div>

          <form onSubmit={handleLogin} style={{ padding: '20px' }}>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label" htmlFor="login-username">
                Username <span className="req">*</span>
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="gov-input"
                placeholder="Enter your username"
              />
            </div>

            <div style={{ marginBottom: 18, position: 'relative' }}>
              <label className="form-label" htmlFor="login-password">
                Password <span className="req">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="gov-input"
                  style={{ paddingRight: 36 }}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gov-muted)' }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, padding: '8px 12px', background: 'var(--gov-danger-bg)', border: '1px solid #f5c6c2', borderRadius: 'var(--r-md)', fontSize: '0.8rem', color: 'var(--gov-danger)' }}>
                <AlertCircle size={13} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '9px' }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div style={{ borderTop: '1px solid var(--gov-border)', padding: '14px 20px 18px' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gov-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Demo Accounts
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => { setUsername(acc.username); setPassword(acc.password); }}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '5px 10px',
                    background: username === acc.username ? '#EEF1F6' : 'transparent',
                    border: '1px solid var(--gov-border)',
                    borderRadius: 'var(--r-sm)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gov-navy)', fontFamily: 'var(--font-mono)' }}>{acc.username}</span>
                  </div>
                  <span className={`badge ${acc.badge}`} style={{ fontSize: '0.62rem' }}>{acc.role}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom footer */}
      <div style={{
        background: 'var(--gov-navy-dark)',
        borderTop: '2px solid var(--gov-gold)',
        padding: '10px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        fontSize: '0.7rem',
        color: 'rgba(255,255,255,0.6)',
      }}>
        <span>Government of Puducherry — Puducherry Police</span>
        <span style={{ color: '#fcd34d', fontWeight: 600 }}>SYNTHETIC DEMO — Not an Official Government System</span>
      </div>
    </div>
  );
}
