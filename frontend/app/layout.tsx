import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'PRISM-PY — Puducherry Police Proposal Intelligence',
  description: 'Police Proposal Retrieval, Intelligence & Strategy Matrix — Puducherry Police',
  icons: {
    icon: '/prism-logo-icon.png',
    shortcut: '/prism-logo-icon.png',
    apple: '/prism-logo-icon.png',
  },
  openGraph: {
    title: 'PRISM-PY — Puducherry Police',
    description: 'Intelligent Proposal Management & Precedent Retrieval System',
    images: [{ url: '/prism-logo-banner.png', width: 1024, height: 400 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
