import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'PRISM-PY — Puducherry Police Proposal Intelligence',
  description: 'Police Proposal Retrieval, Intelligence & Strategy Matrix — Puducherry Police Departmental Application',
  icons: {
    icon: '/prism-logo-icon.png',
    shortcut: '/prism-logo-icon.png',
    apple: '/prism-logo-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link" style={{
          position: 'absolute', left: '-9999px', top: 4, zIndex: 9999,
          background: 'var(--gov-navy)', color: 'white', padding: '8px 12px',
          borderRadius: '0 0 4px 4px', fontSize: '0.82rem', fontWeight: 600,
        }}>
          Skip to main content
        </a>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
