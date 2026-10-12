import React from 'react';
import Link from 'next/link';

interface Props {
  title?: string;
  action?: { label: string; href: string; };
  children: React.ReactNode;
  noPadding?: boolean;
  style?: React.CSSProperties;
}

export default function GovCard({ title, action, children, noPadding, style }: Props) {
  return (
    <div className="gov-card" style={style}>
      {title && (
        <div className="section-header">
          <span className="section-title">{title}</span>
          {action && (
            <Link href={action.href} style={{ fontSize: '0.75rem', color: 'var(--gov-blue)', fontWeight: 600 }}>
              {action.label} →
            </Link>
          )}
        </div>
      )}
      <div style={noPadding ? undefined : { padding: 16 }}>
        {children}
      </div>
    </div>
  );
}
