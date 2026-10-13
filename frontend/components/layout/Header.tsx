'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Search, Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  // Accessibility font size control
  const setFontSize = (size: 'sm' | 'md' | 'lg') => {
    document.documentElement.setAttribute('data-font-size', size);
  };

  const initials = user?.display_name
    ? user.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid var(--gov-border)',
      height: 72,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 16,
      zIndex: 100,
      flexShrink: 0,
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    }}>

      {/* ── LEFT: Police Identity ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <Image
          src="/prism-logo-icon.png"
          alt="Puducherry Police emblem"
          width={52}
          height={52}
          style={{ display: 'block' }}
          priority
        />
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--gov-navy)', letterSpacing: '0.01em' }}>
            PUDUCHERRY POLICE
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--gov-text-sec)', fontFamily: 'var(--font-tamil)' }}>
            புதுச்சேரி காவல் துறை
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--gov-muted)', letterSpacing: '0.06em', marginTop: 1 }}>
            SAFETY &nbsp;|&nbsp; SERVICE &nbsp;|&nbsp; COMMITMENT
          </div>
        </div>
      </div>

      {/* ── DIVIDER ── */}
      <div style={{ width: 1, height: 44, background: 'var(--gov-border)', flexShrink: 0 }} />

      {/* ── PRISM-PY Identity ── */}
      <div style={{ flexShrink: 0, lineHeight: 1.2 }}>
        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--gov-navy)', letterSpacing: '-0.01em' }}>
          PRISM-PY
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--gov-text-sec)', fontWeight: 500 }}>
          Police Proposal Retrieval, Intelligence &amp; Strategy Matrix
        </div>
        <div style={{ fontSize: '0.6rem', color: 'var(--gov-muted)' }}>
          Intelligent Proposal Management &amp; Precedent Retrieval System
        </div>
      </div>

      {/* ── SEARCH (center) ── */}
      <div style={{ flex: 1, maxWidth: 420, marginLeft: 'auto' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gov-muted)' }}
          />
          <input
            type="search"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder="Search proposals, policies, equipment, documents..."
            className="gov-input"
            style={{ paddingLeft: 32, fontSize: '0.78rem', height: 34 }}
            aria-label="Global search"
          />
        </div>
      </div>

      {/* ── ACCESSIBILITY CONTROLS (Ergonomic Segmented Capsule) ── */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: '#f1f5f9',
        borderRadius: 9999,
        padding: '2px 4px',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        flexShrink: 0,
      }}>
        {(['sm', 'md', 'lg'] as const).map((s, i) => (
          <button
            key={s}
            onClick={() => setFontSize(s)}
            title={['Decrease text size', 'Default text size', 'Increase text size'][i]}
            aria-label={['Decrease text size', 'Default text size', 'Increase text size'][i]}
            style={{
              padding: '3px 8px',
              background: 'transparent',
              border: 'none',
              borderRadius: 9999,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: [10, 12, 13][i],
              fontWeight: 650,
              color: 'var(--gov-text-sec)',
              lineHeight: 1,
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#ffffff';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            {['A−', 'A', 'A+'][i]}
          </button>
        ))}
      </div>

      {/* ── SYNTHETIC BADGE (Humanized Ambient Glow Pill with Live Beacon) ── */}
      <div
        title="Simulated testing corpus — not an official government register"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1px solid rgba(245, 158, 11, 0.38)',
          borderRadius: 9999,
          padding: '4px 11px',
          boxShadow: '0 2px 6px -1px rgba(217, 119, 6, 0.14)',
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        {/* Pulsing Beacon Dot */}
        <span
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 8,
            height: 8,
          }}
        >
          <span
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: '#d97706',
              animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: '#b45309',
            }}
          />
        </span>
        <span
          style={{
            fontSize: '0.67rem',
            fontWeight: 750,
            color: '#92400e',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
          }}
        >
          SYNTHETIC DEMO
        </span>
      </div>

      {/* ── USER MENU (Sculpted Ergonomic Capsule Container) ── */}
      {user && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
              border: menuOpen ? '1px solid #3b82f6' : '1px solid rgba(203, 213, 225, 0.9)',
              borderRadius: 9999,
              padding: '4px 12px 4px 5px',
              cursor: 'pointer',
              color: 'var(--gov-text)',
              fontFamily: 'var(--font-body)',
              boxShadow: menuOpen
                ? '0 0 0 3px rgba(59, 130, 246, 0.12), 0 2px 6px -1px rgba(15, 23, 42, 0.08)'
                : '0 2px 6px -1px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.03)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={e => {
              if (!menuOpen) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(59, 130, 246, 0.4)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 10px -2px rgba(15, 23, 42, 0.1)';
              }
            }}
            onMouseLeave={e => {
              if (!menuOpen) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(203, 213, 225, 0.9)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'none';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 6px -1px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.03)';
              }
            }}
          >
            {/* Avatar with Live Indicator */}
            <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0f2b4c 0%, #1e40af 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  boxShadow: '0 0 0 2px #ffffff, 0 2px 5px rgba(0,0,0,0.14)',
                  letterSpacing: '0.02em',
                }}
              >
                {initials}
              </div>
              {/* Online Presence Beacon */}
              <span
                style={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: '#10b981',
                  border: '2px solid #ffffff',
                }}
              />
            </div>

            {/* User Identity Details */}
            <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  letterSpacing: '-0.01em',
                }}
              >
                {user.display_name.split(' ').slice(0, 2).join(' ')}
              </div>
              <div style={{ marginTop: 2 }}>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.61rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#1e40af',
                    background: 'rgba(30, 58, 138, 0.08)',
                    padding: '1px 6px',
                    borderRadius: 9999,
                    lineHeight: 1.2,
                  }}
                >
                  {user.role?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Animated Chevron */}
            <ChevronDown
              size={13}
              style={{
                color: 'var(--gov-text-sec)',
                marginLeft: 2,
                transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>

          {/* User Dropdown Menu */}
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 149 }} onClick={() => setMenuOpen(false)} />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 8,
                  background: 'white',
                  border: '1px solid rgba(226, 232, 240, 0.95)',
                  borderRadius: 16,
                  boxShadow: '0 12px 32px -4px rgba(15, 23, 42, 0.16), 0 4px 10px -2px rgba(15, 23, 42, 0.06)',
                  minWidth: 230,
                  zIndex: 150,
                  overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease-out',
                }}
              >
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 750, color: 'var(--gov-navy)' }}>{user.display_name}</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--gov-text-sec)', marginTop: 2 }}>{user.email || user.username}</div>
                  {user.department && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--gov-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#94a3b8' }} />
                      {user.department}
                    </div>
                  )}
                </div>
                <div style={{ padding: '6px' }}>
                  <Link
                    href="/administration"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      padding: '8px 12px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: 'var(--gov-text)',
                      textDecoration: 'none',
                      borderRadius: 10,
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Settings size={14} color="#64748b" /> Settings &amp; Administration
                  </Link>
                  <button
                    onClick={logout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      width: '100%',
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#dc2626',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      fontFamily: 'var(--font-body)',
                      borderRadius: 10,
                      marginTop: 2,
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <LogOut size={14} color="#dc2626" /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
