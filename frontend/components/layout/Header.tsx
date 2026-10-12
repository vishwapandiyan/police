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

      {/* ── ACCESSIBILITY CONTROLS ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        {(['sm', 'md', 'lg'] as const).map((s, i) => (
          <button
            key={s}
            onClick={() => setFontSize(s)}
            title={['Decrease text size', 'Default text size', 'Increase text size'][i]}
            aria-label={['Decrease text size', 'Default text size', 'Increase text size'][i]}
            style={{
              padding: '3px 7px',
              background: 'none',
              border: '1px solid var(--gov-border)',
              borderRadius: 'var(--r-sm)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: [10, 12, 14][i],
              fontWeight: 600,
              color: 'var(--gov-text-sec)',
              lineHeight: 1,
            }}
          >
            {['A−', 'A', 'A+'][i]}
          </button>
        ))}
      </div>

      {/* ── SYNTHETIC BADGE ── */}
      <div style={{
        background: '#fff8e1',
        border: '1px solid #f0d060',
        borderRadius: 'var(--r-sm)',
        padding: '2px 9px',
        fontSize: '0.65rem',
        fontWeight: 700,
        color: '#7a5500',
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        SYNTHETIC DEMO
      </div>

      {/* ── USER MENU ── */}
      {user && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#F0F3F8',
              border: '1px solid var(--gov-border)',
              borderRadius: 'var(--r-md)',
              padding: '5px 10px 5px 5px',
              cursor: 'pointer',
              color: 'var(--gov-text)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 30, height: 30,
              borderRadius: '50%',
              background: 'var(--gov-navy)',
              color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gov-text)', lineHeight: 1.2 }}>
                {user.display_name.split(' ').slice(0, 2).join(' ')}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--gov-muted)', lineHeight: 1 }}>
                {user.role?.replace(/_/g, ' ')}
              </div>
            </div>
            <ChevronDown size={12} color="var(--gov-muted)" />
          </button>

          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 149 }} onClick={() => setMenuOpen(false)} />
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 4,
                background: 'white',
                border: '1px solid var(--gov-border)',
                borderRadius: 'var(--r-lg)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                minWidth: 220, zIndex: 150, overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--gov-border)', background: '#F8FAFD' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gov-navy)' }}>{user.display_name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gov-text-sec)', marginTop: 1 }}>{user.email || user.username}</div>
                  {user.department && <div style={{ fontSize: '0.7rem', color: 'var(--gov-muted)', marginTop: 1 }}>{user.department}</div>}
                </div>
                <Link href="/administration" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: '0.8rem', color: 'var(--gov-text)', textDecoration: 'none' }}>
                  <Settings size={13} /> Settings
                </Link>
                <button
                  onClick={logout}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gov-danger)', fontSize: '0.8rem', fontFamily: 'var(--font-body)', borderTop: '1px solid var(--gov-border)' }}
                >
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
