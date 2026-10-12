'use client';
import { useState } from 'react';
import { Search, Archive } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import { search as searchApi } from '@/lib/api';

export default function InstitutionalMemoryPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await searchApi.institutionalMemory(query) as Record<string, unknown>;
      setResults(r.results as Record<string, unknown>[]);
    } catch { /* silent */ }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div style={{ padding: '16px 20px', maxWidth: 900 }}>
        <SyntheticBanner />
        <div style={{ margin: '14px 0' }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1a2744', margin: 0 }}>Institutional Memory</h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>Search lessons learned and institutional knowledge from past proposals</p>
        </div>
        <form onSubmit={doSearch} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search lessons, outcomes, observations..." style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 3, fontSize: 13, outline: 'none' }} />
          <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#1a2744', color: 'white', border: 'none', borderRadius: 3, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Search size={14} /> Search
          </button>
        </form>
        {loading && <LoadingSpinner />}
        {results && (
          <>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>{results.length} lessons/records found</p>
            {results.length === 0 && (
              <div style={{ padding: 24, background: 'white', border: '1px solid #e5e7eb', borderRadius: 4, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>No matching records.</div>
            )}
            {results.map((r, i) => (
              <div key={i} style={{ marginBottom: 12, padding: 14, background: 'white', border: '1px solid #e5e7eb', borderRadius: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Archive size={14} color="#6b7280" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1a2744' }}>{r.title as string}</span>
                  {r.category && <span style={{ fontSize: 10, background: '#f1f5f9', color: '#6b7280', padding: '1px 6px', borderRadius: 2, textTransform: 'capitalize' }}>{r.category as string}</span>}
                  {r.synthetic && <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: 2 }}>SYNTHETIC</span>}
                </div>
                <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.5 }}>{r.lesson as string}</p>
                {r.proposal_id && <p style={{ fontSize: 10, color: '#9ca3af', margin: '4px 0 0', fontFamily: 'monospace' }}>{r.proposal_id as string}</p>}
              </div>
            ))}
          </>
        )}
        {!results && (
          <div style={{ padding: '30px 20px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 4, textAlign: 'center' }}>
            <Archive size={32} color="#d1d5db" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 13, color: '#6b7280' }}>Search institutional lessons and outcomes from completed proposals.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
