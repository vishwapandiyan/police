'use client';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useState } from 'react';
import Image from 'next/image';

export default function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      style={{
        background: '#1a2744',
        borderBottom: '3px solid #d4af37',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 14,
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {/* Crest icon — circular badge */}
      <div style={{ flexShrink: 0 }}>
        <Image
          src="/prism-logo-icon.png"
          alt="Puducherry Police PRISM-PY"
          width={46}
          height={46}
          style={{ borderRadius: '50%', border: '2px solid #d4af37', display: 'block' }}
          priority
        />
      </div>

      {/* Vertical divider */}
      <div style={{ width: 1, height: 36, background: 'rgba(212,175,55,0.4)', flexShrink: 0 }} />

      {/* Identity text — styled to match the banner's typography on dark background */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontSize: 20,
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-0.5px',
            lineHeight: 1,
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}>
            PRISM
          </span>
          <span style={{
            fontSize: 20,
            fontWeight: 900,
            color: '#d4af37',
            letterSpacing: '-0.5px',
            lineHeight: 1,
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}>
            -PY
          </span>
        </div>
        <div style={{
          fontSize: 9,
          color: 'rgba(255,255,255,0.75)',
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          marginTop: 2,
          lineHeight: 1,
        }}>
          Police Proposal Retrieval, Intelligence &amp; Strategy Matrix
        </div>
        <div style={{
          fontSize: 8,
          color: 'rgba(212,175,55,0.8)',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginTop: 1,
        }}>
          Puducherry Police
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Synthetic notice badge */}
      <div
        style={{
          background: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: 3,
          padding: '2px 10px',
          fontSize: 10,
          color: '#92400e',
          fontWeight: 700,
          letterSpacing: '0.4px',
          whiteSpace: 'nowrap',
        }}
      >
        SYNTHETIC DEMO
      </div>

      {/* User menu */}
      {user && (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 4,
              padding: '5px 10px',
              color: 'white',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            <User size={13} />
            <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.display_name}
            </span>
            <span
              style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 2,
                padding: '1px 5px',
                fontSize: 9,
                letterSpacing: '0.3px',
                whiteSpace: 'nowrap',
              }}
            >
              {user.role.replace(/_/g, ' ')}
            </span>
            <ChevronDown size={11} />
          </button>

          {menuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setMenuOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 4,
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  minWidth: 220,
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid #f1f3f5',
                    background: '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Image
                    src="/prism-logo-icon.png"
                    alt="crest"
                    width={28}
                    height={28}
                    style={{ borderRadius: '50%', border: '1px solid #d1d5db' }}
                  />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1a2744' }}>{user.display_name}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>{user.email || user.username}</div>
                    {user.department && (
                      <div style={{ fontSize: 10, color: '#6b7280' }}>{user.department}</div>
                    )}
                  </div>
                </div>

                <button
                  onClick={logout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#dc2626',
                    fontSize: 12,
                    textAlign: 'left',
                  }}
                >
                  <LogOut size={13} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
