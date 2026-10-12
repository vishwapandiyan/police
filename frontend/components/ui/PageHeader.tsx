import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Crumb { label: string; href?: string; }

interface Props {
  title: string;
  subtitle?: string;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, breadcrumbs, actions }: Props) {
  return (
    <div style={{ marginBottom: 20 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="breadcrumb" aria-label="Breadcrumb">
          {breadcrumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight size={11} className="breadcrumb-sep" />}
              {c.href ? (
                <Link href={c.href} style={{ color: 'var(--gov-blue)', fontSize: '0.75rem' }}>{c.label}</Link>
              ) : (
                <span className="breadcrumb-current">{c.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="gov-page-header">
        <div>
          <h1 className="gov-page-title">{title}</h1>
          {subtitle && <p className="gov-page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>{actions}</div>}
      </div>
    </div>
  );
}
