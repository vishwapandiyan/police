'use client';
import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Header from './Header';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user && !pathname.startsWith('/login')) {
      router.push('/login');
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--gov-bg)', flexDirection: 'column', gap: 12,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/prism-logo-icon.png" alt="PRISM-PY" width={56} height={56}
          style={{ borderRadius: '50%', border: '2px solid var(--gov-gold)' }} />
        <div style={{ fontSize: '0.82rem', color: 'var(--gov-text-sec)' }}>Loading PRISM-PY...</div>
        <div style={{
          width: 16, height: 16,
          border: '2px solid var(--gov-border)',
          borderTopColor: 'var(--gov-navy)',
          borderRadius: '50%',
          animation: 'gov-spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes gov-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <TopNav />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <main
            id="main-content"
            tabIndex={-1}
            style={{ flex: 1, overflowY: 'auto', background: 'var(--gov-bg)' }}
          >
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
