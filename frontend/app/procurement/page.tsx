'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import PageHeader from '@/components/ui/PageHeader';
import GovCard from '@/components/ui/GovCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { search as searchApi } from '@/lib/api';

export default function ProcurementPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try { const r = await searchApi.procurement({ what_is_needed: query }) as Record<string, unknown>; setResults(r); }
    catch { /* silent */ }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="gov-page">
        <SyntheticBanner />
        <PageHeader
          title="Procurement Intelligence"
          subtitle="Historical tender records and procurement intelligence from the synthetic demo corpus"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Procurement' }]}
          actions={<Link href="/procurement/gem" className="btn btn-primary btn-sm">Open GeM Intelligence Workspace</Link>}
        />
        <GovCard title="Search Procurement Records" style={{ marginBottom: 16 }}>
          <form onSubmit={doSearch} style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gov-muted)' }} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. CCTV cameras, digital radios, patrol vehicles..." className="gov-input" style={{ paddingLeft: 32 }} />
            </div>
            <button type="submit" disabled={!query.trim()} className="btn btn-primary"><Search size={14} /> Search</button>
          </form>
        </GovCard>
        {loading && <LoadingSpinner />}
        {results && (
          <GovCard title={`Historical Tenders — ${(results.equipment_class as string || '').toUpperCase()} Category`} noPadding>
            <table className="gov-table">
              <thead><tr><th>Title</th><th>Type</th><th>Quantity</th><th style={{ textAlign: 'right' }}>Amount (INR)</th><th>Year</th><th>Status</th></tr></thead>
              <tbody>
                {(results.historical_tenders as Record<string, unknown>[]).length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--gov-muted)', fontSize: '0.8rem' }}>No records found.</td></tr>
                )}
                {(results.historical_tenders as Record<string, unknown>[]).map(t => (
                  <tr key={t.tender_id as string}>
                    <td style={{ fontSize: '0.8rem' }}>{t.title as string}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)' }}>{t.procurement_type as string}</td>
                    <td style={{ fontSize: '0.78rem' }}>{t.quantity as string || '—'}</td>
                    <td style={{ fontSize: '0.82rem', textAlign: 'right', fontWeight: 500 }}>{t.indicative_amount_inr ? (t.indicative_amount_inr as number).toLocaleString('en-IN') : '—'}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--gov-muted)' }}>{t.year as number || '—'}</td>
                    <td style={{ fontSize: '0.75rem' }}>{t.decision_status as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '8px 14px', background: 'var(--gov-warning-bg)', fontSize: '0.72rem', color: '#7a5500' }}>
              {(results.notice as string) || 'SYNTHETIC DEMO DATA only. Not official procurement records.'}
            </div>
          </GovCard>
        )}
      </div>
    </AppLayout>
  );
}
