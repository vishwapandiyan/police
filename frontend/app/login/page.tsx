'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  Database,
  ShoppingCart,
  BarChart2,
  Landmark,
  User,
  Lock,
} from 'lucide-react';
import { auth } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const DEMO_ACCOUNTS = [
  { username: 'sp_puducherry',          password: 'demo123',  role: 'Approving Authority',   color: '#0369a1', bg: '#e0f2fe' },
  { username: 'dsp_north',              password: 'demo123',  role: 'Reviewer',              color: '#0369a1', bg: '#e0f2fe' },
  { username: 'si_central',             password: 'demo123',  role: 'Initiator',             color: '#15803d', bg: '#dcfce7' },
  { username: 'procurement_officer',    password: 'demo123',  role: 'Procurement Officer',   color: '#b45309', bg: '#fef3c7' },
  { username: 'implementation_officer', password: 'demo123',  role: 'Implementation Officer',color: '#7e22ce', bg: '#f3e8ff' },
  { username: 'auditor',                password: 'demo123',  role: 'Auditor',               color: '#475569', bg: '#f1f5f9' },
  { username: 'admin',                  password: 'admin123', role: 'System Administrator',  color: '#b91c1c', bg: '#fee2e2' },
];

function makeCaptcha() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join(' ');
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('sp_puducherry');
  const [password, setPassword] = useState('demo123');
  const [showPw, setShowPw] = useState(false);
  const [captchaText, setCaptchaText] = useState('7 8 K P 3');
  const [captchaInput, setCaptchaInput] = useState('');
  const [showAccounts, setShowAccounts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCaptchaText(makeCaptcha());
  }, []);

  const refreshCaptcha = () => {
    setCaptchaText(makeCaptcha());
    setCaptchaInput('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaInput.trim()) {
      setError('Please enter the CAPTCHA code.');
      return;
    }
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
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setCaptchaInput(captchaText.replace(/\s+/g, ''));
    setError('');
  };

  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
          font-family: 'Noto Sans', 'Segoe UI', system-ui, sans-serif;
          background: #EEF2F7;
        }

        .login-viewport {
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #EEF2F7;
        }

        /* Full photographic hero canvas matching pypolicebuild.png */
        .login-canvas {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          position: relative;
          min-height: 0;
          overflow: hidden;
          background: url('/pypolicebuild.png') no-repeat center bottom;
          background-size: cover;
          padding: 16px 40px 16px 48px;
          box-sizing: border-box;
        }

        /* Subtle gradient overlay to make top-left text perfectly readable against sky */
        .login-canvas-overlay {
          position: absolute;
          inset: 0;
          /* Strong white wash on left for text readability, fades to transparent on right */
          background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0.94) 0%,
            rgba(255, 255, 255, 0.88) 25%,
            rgba(255, 255, 255, 0.55) 45%,
            rgba(255, 255, 255, 0.15) 60%,
            rgba(255, 255, 255, 0) 75%
          );
          pointer-events: none;
          z-index: 1;
        }

        /* Serif title matching image */
        .hero-title {
          font-family: 'Georgia', 'Playfair Display', 'Merriweather', serif;
          font-weight: 800;
          font-size: clamp(34px, 3.2vw, 50px);
          line-height: 1.14;
          color: #0A2540;
          letter-spacing: -0.01em;
          margin: 0 0 16px;
        }

        /* 4-icon features row */
        .hero-features {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-top: 24px;
          max-width: 540px;
        }

        .feature-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
        }

        /* Floating right login card matching design */
        .login-card {
          background: rgba(255, 255, 255, 0.98);
          border-radius: 12px;
          border: 1px solid rgba(203, 213, 225, 0.9);
          box-shadow: 0 16px 40px rgba(10, 37, 64, 0.12), 0 2px 8px rgba(10, 37, 64, 0.05);
          width: 440px;
          max-width: 100%;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          z-index: 10;
          flex-shrink: 0;
        }

        .gov-input-field {
          width: 100%;
          height: 38px;
          padding: 0 12px 0 34px;
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          font-size: 0.82rem;
          color: #0F172A;
          outline: none;
          background: #FFFFFF;
          box-sizing: border-box;
          transition: all 0.15s ease;
        }
        .gov-input-field:focus {
          border-color: #0A2540;
          box-shadow: 0 0 0 2px rgba(10, 37, 64, 0.1);
        }

        @media (max-width: 1024px) {
          html, body { overflow: auto; }
          .login-viewport { height: auto; min-height: 100vh; }
          .login-canvas { flex-direction: column; overflow: visible; padding: 24px 16px; }
          .login-card { margin: 24px auto; width: 100%; max-width: 440px; }
        }
      `}</style>

      <div className="login-viewport">
        {/* =========================================================================
            TOP HEADER (MATCHING media_1791835517482.jpg)
           ========================================================================= */}
        <header style={{
          background: '#FFFFFF',
          borderBottom: '2px solid #C9A227',
          padding: '0 28px',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          flexShrink: 0,
          zIndex: 20,
        }}>
          <Image
            src="/prism-logo-icon.png"
            alt="Puducherry Police"
            width={48}
            height={48}
            style={{ display: 'block', flexShrink: 0 }}
            priority
          />

          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0A2540', letterSpacing: '0.02em' }}>
              PUDUCHERRY POLICE
            </div>
            <div style={{ fontSize: '0.66rem', color: '#475569', fontFamily: 'var(--font-tamil)' }}>
              புதுச்சேரி காவல் துறை
            </div>
            <div style={{ fontSize: '0.56rem', color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              SAFETY &nbsp;|&nbsp; SERVICE &nbsp;|&nbsp; COMMITMENT
            </div>
          </div>

          <div style={{ width: 1, height: 38, background: '#E2E8F0', flexShrink: 0, margin: '0 4px' }} />

          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
              <span style={{ color: '#0A2540' }}>PRISM</span>
              <span style={{ color: '#C9A227' }}>-PY</span>
            </div>
            <div style={{ fontSize: '0.64rem', color: '#475569', fontWeight: 600 }}>
              Police Proposal Retrieval, Intelligence &amp; Strategy Matrix
            </div>
            <div style={{ fontSize: '0.58rem', color: '#94A3B8' }}>
              Intelligent Proposal Management &amp; Precedent Retrieval System
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Yellow Synthetic Demo Alert Banner */}
          <div style={{
            background: '#FEF3C7',
            border: '1px solid #F59E0B',
            borderRadius: 6,
            padding: '5px 14px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#D97706',
              color: 'white',
              fontSize: '0.68rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              i
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#92400E', letterSpacing: '0.05em' }}>
                SYNTHETIC DEMO
              </div>
              <div style={{ fontSize: '0.58rem', color: '#B45309' }}>
                Not an official government application.
              </div>
            </div>
          </div>
        </header>

        {/* =========================================================================
            MAIN CANVAS (FULL-BLEED BACKGROUND PHOTO WITH FLOATING LOGIN CARD)
           ========================================================================= */}
        <div className="login-canvas">
          {/* Translucent wash overlay for contrast */}
          <div className="login-canvas-overlay" />

          {/* ── LEFT HERO TEXT CONTENT ── */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: 500,
            flex: 1,
          }}>
            <div>
              {/* Eyebrow with gold dash */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 24, height: 2.5, background: '#C9A227', flexShrink: 0 }} />
                <span style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#475569' }}>
                  DATA-DRIVEN DECISIONS FOR A SAFER PUDUCHERRY
                </span>
              </div>

              {/* Main Serif Heading (Matching target mockup) */}
              <h1 className="hero-title">
                Intelligent Proposal<br />Management
              </h1>

              {/* Description paragraph */}
              <p style={{
                fontSize: '0.86rem',
                color: '#1E293B',
                lineHeight: 1.65,
                margin: 0,
                maxWidth: 500,
                fontWeight: 500,
              }}>
                PRISM-PY provides evidence-backed decision support for departmental proposals using historical precedents, policy intelligence, procurement information and institutional knowledge.
              </p>

              {/* 4 Feature Icons Row */}
              <div className="hero-features">
                <div className="feature-item">
                  <FileText size={22} color="#0A2540" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0A2540', lineHeight: 1.25 }}>
                    Proposal<br />Intelligence
                  </span>
                </div>

                <div className="feature-item">
                  <Database size={22} color="#0A2540" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0A2540', lineHeight: 1.25 }}>
                    Precedent<br />Retrieval
                  </span>
                </div>

                <div className="feature-item">
                  <ShoppingCart size={22} color="#0A2540" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0A2540', lineHeight: 1.25 }}>
                    Procurement<br />Intelligence
                  </span>
                </div>

                <div className="feature-item">
                  <BarChart2 size={22} color="#0A2540" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0A2540', lineHeight: 1.25 }}>
                    Decision<br />Support
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT FLOATING LOGIN CARD CONTAINER ── */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            paddingTop: 8,
            overflow: 'hidden',
          }}>
            <div className="login-card">
              {/* Card Header */}
              <div style={{ padding: '16px 22px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: '#E0F2FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <User size={18} color="#0284C7" />
                </div>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                    Officer Sign In
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#64748B' }}>
                    Welcome back! Please login to continue.
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleLogin} style={{ padding: '0 22px 10px' }}>
                {/* User ID */}
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>
                    User ID <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}>
                      <User size={14} />
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      autoComplete="username"
                      placeholder="Enter your department username"
                      className="gov-input-field"
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>
                    Password <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}>
                      <Lock size={14} />
                    </span>
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="gov-input-field"
                      style={{ paddingRight: 34 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#94A3B8',
                        padding: 0,
                        lineHeight: 0,
                      }}
                    >
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* CAPTCHA Row */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>
                    Enter CAPTCHA <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 6, alignItems: 'center' }}>
                    {/* Visual Captcha Box */}
                    <div style={{
                      height: 38,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      borderRadius: 6,
                      userSelect: 'none',
                      fontFamily: 'Georgia, serif',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      letterSpacing: '0.22em',
                      color: '#0A2540',
                      backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
                      backgroundSize: '6px 6px',
                    }}>
                      {captchaText}
                    </div>

                    <input
                      type="text"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="Enter CAPTCHA"
                      required
                      className="gov-input-field"
                      style={{ paddingLeft: 10 }}
                    />

                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      style={{
                        height: 38,
                        padding: '0 10px',
                        background: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: 6,
                        cursor: 'pointer',
                        color: '#0284C7',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <RefreshCw size={11} /> Refresh
                    </button>
                  </div>

                  <div style={{ textAlign: 'right', marginTop: 4 }}>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', fontSize: '0.72rem', color: '#0284C7', cursor: 'pointer', padding: 0 }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10, padding: '6px 10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, fontSize: '0.75rem', color: '#DC2626' }}>
                    <AlertCircle size={13} /> {error}
                  </div>
                )}

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    height: 40,
                    background: loading ? '#64748B' : '#0F2942',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'background 0.15s ease',
                  }}
                >
                  <LogIn size={15} /> {loading ? 'Signing In...' : 'Sign In'}
                </button>

                {/* OR Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0' }}>
                  <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
                  <span style={{ fontSize: '0.66rem', color: '#94A3B8', fontWeight: 700 }}>OR</span>
                  <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
                </div>

                {/* Login with OTP Button */}
                <button
                  type="button"
                  onClick={() => setError('OTP authentication is disabled in this synthetic demo environment.')}
                  style={{
                    width: '100%',
                    height: 36,
                    background: '#FFFFFF',
                    color: '#334155',
                    border: '1px solid #CBD5E1',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Landmark size={14} color="#0F2942" /> Login with OTP (Registered Mobile)
                </button>
              </form>

              {/* Demonstration Accounts Accordion */}
              <div style={{ borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                <button
                  type="button"
                  onClick={() => setShowAccounts(!showAccounts)}
                  style={{
                    width: '100%',
                    padding: '8px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={13} color="#0A2540" />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0A2540' }}>
                      Demonstration Accounts
                    </span>
                  </div>
                  {showAccounts ? <ChevronUp size={13} color="#64748B" /> : <ChevronDown size={13} color="#64748B" />}
                </button>

                {showAccounts && (
                  <div style={{ padding: '0 16px 10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                      <tbody>
                        {DEMO_ACCOUNTS.map((acc) => (
                          <tr
                            key={acc.username}
                            onClick={() => quickFill(acc.username, acc.password)}
                            style={{
                              cursor: 'pointer',
                              background: username === acc.username ? '#E0F2FE' : 'transparent',
                              borderRadius: 4,
                            }}
                            onMouseOver={(e) => {
                              if (username !== acc.username) (e.currentTarget as HTMLElement).style.background = '#F1F5F9';
                            }}
                            onMouseOut={(e) => {
                              if (username !== acc.username) (e.currentTarget as HTMLElement).style.background = 'transparent';
                            }}
                          >
                            <td style={{ padding: '3px 6px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: '#0F172A' }}>
                              {acc.username}
                            </td>
                            <td style={{ padding: '3px 4px' }}>
                              <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: acc.bg, color: acc.color, whiteSpace: 'nowrap' }}>
                                {acc.role}
                              </span>
                            </td>
                            <td style={{ padding: '3px 4px', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  quickFill(acc.username, acc.password);
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
                              >
                                <Copy size={11} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            BOTTOM FOOTER (MATCHING pypolicebuild.png)
           ========================================================================= */}
        <footer style={{
          background: '#0A2540',
          borderTop: '2px solid #C9A227',
          padding: '8px 28px',
          height: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
          flexShrink: 0,
          boxSizing: 'border-box',
          zIndex: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/prism-logo-icon.png" alt="" width={22} height={22} style={{ borderRadius: '50%', opacity: 0.85 }} />
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
                PUDUCHERRY POLICE
              </div>
              <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.1 }}>
                Government of Puducherry
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {['Website Policies', 'Privacy Policy', 'Terms of Use', 'Accessibility Statement', 'Help'].map((link) => (
              <a
                key={link}
                href="#"
                style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}
                onMouseOver={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
              >
                {link}
              </a>
            ))}
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.64rem', color: 'rgba(255,255,255,0.6)' }}>
            <div>
              <span style={{ color: '#FCD34D', fontWeight: 700 }}>PRISM-PY</span> &nbsp;|&nbsp; © 2026
            </div>
            <div>For authorised departmental use only.</div>
          </div>
        </footer>
      </div>
    </>
  );
}
