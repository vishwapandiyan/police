'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import PageHeader from '@/components/ui/PageHeader';
import GovCard from '@/components/ui/GovCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { search as searchApi } from '@/lib/api';
import type { Precedent } from '@/lib/types';

export default function PrecedentsPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Precedent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setSearched(true);
    try { const r = await searchApi.precedents(query, 10); setResults(r.precedents); }
    catch { setResults([]); }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="gov-page">
        <SyntheticBanner />
        <PageHeader
          title="Precedent Search"
          subtitle="Search historical proposals from the synthetic demo corpus for relevant precedents"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Precedents' }]}
        />

        <GovCard title="Search Historical Proposals" style={{ marginBottom: 16 }}>
          <form onSubmit={doSearch} style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gov-muted)' }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. CCTV surveillance expansion, radio handset replacement, cybercrime training..."
                className="gov-input"
                style={{ paddingLeft: 32 }}
                aria-label="Search query"
              />
            </div>
            <button type="submit" disabled={!query.trim()} className="btn btn-primary">
              <Search size={14} /> Search
            </button>
          </form>
          <p style={{ fontSize: '0.72rem', color: 'var(--gov-muted)', marginTop: 8 }}>
            Example queries: CCTV surveillance, digital radio, patrol vehicle, training programme, cybercrime lab
          </p>
        </GovCard>

        {loading && <LoadingSpinner text="Retrieving relevant precedents..." />}

        {searched && !loading && (
          <GovCard title={`Results — ${results?.length || 0} precedents found`} noPadding>
            {(!results || results.length === 0) ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--gov-muted)' }}>
                <div style={{ fontSize: '0.9rem', marginBottom: 6 }}>No precedents found for this query.</div>
                <div style={{ fontSize: '0.78rem' }}>Try using different keywords or broader terms.</div>
              </div>
            ) : (
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Proposal ID</th>
                    <th>Relevance</th>
                    <th>Jurisdiction</th>
                    <th>Why This Matches</th>
                    <th>Excerpt</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontSize: '0.72rem', color: 'var(--gov-muted)' }}>{p.rank}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--gov-blue)', fontWeight: 600 }}>{p.proposal_id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--gov-navy)' }}>{Math.round(p.match_score * 100)}%</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ background: 'var(--gov-info-bg)', color: 'var(--gov-info)', padding: '2px 7px', borderRadius: 'var(--r-sm)', fontSize: '0.68rem', fontWeight: 600 }}>
                          {p.jurisdiction_label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 240 }}>
                          {Object.entries(p.why_match).map(([k, v]) => (
                            <span key={k} style={{ fontSize: '0.65rem', padding: '1px 6px', background: v === 'Strong match' ? 'var(--gov-success-bg)' : '#F0F3F8', color: v === 'Strong match' ? 'var(--gov-success)' : 'var(--gov-text-sec)', border: `1px solid ${v === 'Strong match' ? '#b7dfc7' : 'var(--gov-border)'}`, borderRadius: 'var(--r-sm)' }}>
                              <strong>{k}:</strong> {v}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)', maxWidth: 220 }}>
                        {p.excerpt?.slice(0, 130)}{p.excerpt?.length > 130 ? '…' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--gov-border)', fontSize: '0.68rem', color: 'var(--gov-muted)' }}>
              SYNTHETIC DEMO DATA — Results from the demo corpus only. Not real government records.
            </div>
          </GovCard>
        )}
      </div>
    </AppLayout>
  );
}
