'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { search as searchApi } from '@/lib/api';
import type { Precedent } from '@/lib/types';

export default function PrecedentsPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Precedent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError(''); setSearched(true);
    try {
      const r = await searchApi.precedents(query, 10);
      setResults(r.precedents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div style={{ padding: '16px 20px', maxWidth: 900 }}>
        <SyntheticBanner />
        <div style={{ margin: '14px 0' }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1a2744', margin: 0 }}>Precedent Search</h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>Search historical proposals for relevant precedents</p>
        </div>
        <form onSubmit={doSearch} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. CCTV surveillance expansion, radio handset replacement, cybercrime training..."
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 3, fontSize: 13, outline: 'none' }}
          />
          <button type="submit" disabled={!query.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#1a2744', color: 'white', border: 'none', borderRadius: 3, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Search size={14} /> Search
          </button>
        </form>

        {loading && <LoadingSpinner text="Searching precedents..." />}
        {error && <ErrorMessage message={error} />}

        {searched && !loading && (
          <>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>
              {results?.length || 0} precedents found from the synthetic demo corpus
            </p>
            {results?.map((p) => (
              <div key={p.id} style={{ marginBottom: 14, padding: 14, background: 'white', border: '1px solid #e5e7eb', borderRadius: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1a2744' }}>Rank {p.rank}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7280', background: '#f1f5f9', padding: '1px 6px', borderRadius: 2 }}>{p.proposal_id}</span>
                      <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: 2 }}>{p.jurisdiction_label}</span>
                      {p.document_type && <span style={{ fontSize: 10, color: '#6b7280', background: '#f1f5f9', padding: '1px 5px', borderRadius: 2 }}>{p.document_type}</span>}
                    </div>
                    <p style={{ fontSize: 12, color: '#374151', margin: '0 0 8px', lineHeight: 1.5 }}>{p.excerpt}</p>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {Object.entries(p.why_match).map(([k, v]) => (
                        <span key={k} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 2, background: v === 'Strong match' ? '#f0fdf4' : '#f8f9fa', color: v === 'Strong match' ? '#15803d' : '#6b7280', border: `1px solid ${v === 'Strong match' ? '#bbf7d0' : '#e5e7eb'}` }}>
                          <strong>{k}:</strong> {v}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#1d4ed8' }}>{Math.round(p.match_score * 100)}%</div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>relevance</div>
                  </div>
                </div>
                <div style={{ marginTop: 8, fontSize: 10, color: '#f59e0b', background: '#fffbeb', padding: '2px 8px', borderRadius: 2, display: 'inline-block' }}>SYNTHETIC DEMO DATA</div>
              </div>
            ))}
            {results?.length === 0 && (
              <div style={{ padding: 24, background: 'white', border: '1px solid #e5e7eb', borderRadius: 4, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
                No precedents found for this query in the demo corpus.
              </div>
            )}
          </>
        )}

        {!searched && (
          <div style={{ padding: '30px 20px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 4, textAlign: 'center' }}>
            <Search size={32} color="#d1d5db" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 13, color: '#6b7280' }}>Enter a query above to search the synthetic demo corpus for relevant historical proposals.</p>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>Example queries: CCTV surveillance, digital radio, training programme, patrol vehicle</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
