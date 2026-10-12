'use client';
import { useState } from 'react';
import { Search, Archive } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import PageHeader from '@/components/ui/PageHeader';
import GovCard from '@/components/ui/GovCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { search as searchApi } from '@/lib/api';

export default function InstitutionalMemoryPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { const r = await searchApi.institutionalMemory(query) as Record<string, unknown>; setResults(r.results as Record<string, unknown>[]); }
    catch { /* silent */ }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="gov-page">
        <SyntheticBanner />
        <PageHeader
          title="Knowledge Base — Institutional Memory"
          subtitle="Search lessons learned and institutional knowledge from completed proposals"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Knowledge Base' }]}
        />
        <GovCard title="Search Institutional Lessons" style={{ marginBottom: 16 }}>
          <form onSubmit={doSearch} style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gov-muted)' }} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search lessons, outcomes, observations, best practices..." className="gov-input" style={{ paddingLeft: 32 }} />
            </div>
            <button type="submit" className="btn btn-primary"><Search size={14} /> Search</button>
          </form>
        </GovCard>
        {loading && <LoadingSpinner />}
        {results && (
          <GovCard title={`${results.length} lessons found`} noPadding>
            {results.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--gov-muted)', fontSize: '0.82rem' }}>No matching lessons found.</div>
            ) : (
              results.map((r, i) => (
                <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--gov-border)', display: 'flex', gap: 12 }}>
                  <Archive size={16} color="var(--gov-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gov-navy)', marginBottom: 3 }}>{r.title as string}</div>
                    {r.proposal_id && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--gov-muted)', marginBottom: 4 }}>{r.proposal_id as string}</div>}
                    <p style={{ fontSize: '0.8rem', color: 'var(--gov-text-sec)', lineHeight: 1.5 }}>{r.lesson as string}</p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                      {r.category && <span className="badge badge-normal" style={{ fontSize: '0.62rem', textTransform: 'capitalize' }}>{r.category as string}</span>}
                      {r.synthetic && <span className="badge badge-synthetic" style={{ fontSize: '0.62rem' }}>Synthetic</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </GovCard>
        )}
      </div>
    </AppLayout>
  );
}
