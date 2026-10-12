'use client';
import { useState } from 'react';
import { Search, BookOpen, ExternalLink } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { search as searchApi } from '@/lib/api';
import type { PolicyResult } from '@/lib/types';

export default function PoliciesPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PolicyResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError(''); setSearched(true);
    try {
      const r = await searchApi.policies(query);
      setResults(r.policies);
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
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1a2744', margin: 0 }}>Policy & SOP Intelligence</h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>Search Government Orders, Standing Orders, SOPs and policy references</p>
        </div>

        {/* Official sources */}
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 4 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#1e40af', margin: '0 0 6px' }}>Official Sources</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Puducherry Police GOs', href: 'https://police.py.gov.in/GovOrders.htm' },
              { label: 'Puducherry Police', href: 'https://police.py.gov.in/' },
            ].map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#1d4ed8', textDecoration: 'none' }}>
                <ExternalLink size={11} /> {l.label}
              </a>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#3730a3', margin: '6px 0 0' }}>
            PRISM-PY searches its demo corpus. For official current policies, refer to the above sources. Do not cite AI-retrieved results as official authority.
          </p>
        </div>

        <form onSubmit={doSearch} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. CCTV procurement guidelines, digital evidence SOP, tender process..."
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 3, fontSize: 13, outline: 'none' }}
          />
          <button type="submit" disabled={!query.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#1a2744', color: 'white', border: 'none', borderRadius: 3, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Search size={14} /> Search
          </button>
        </form>

        {loading && <LoadingSpinner text="Searching policy corpus..." />}
        {error && <ErrorMessage message={error} />}

        {searched && !loading && results && (
          <>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>{results.length} results found</p>
            {results.map((p, i) => (
              <div key={i} style={{ marginBottom: 12, padding: 14, background: 'white', border: '1px solid #e5e7eb', borderRadius: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <BookOpen size={14} color="#6b7280" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1a2744' }}>{p.title}</span>
                    </div>
                    {p.issuer && <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{p.issuer}</div>}
                    {p.excerpt && <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.5 }}>{p.excerpt.slice(0, 400)}</p>}
                    {p.validity_warning && (
                      <p style={{ fontSize: 11, color: '#92400e', margin: '6px 0 0', padding: '4px 8px', background: '#fef3c7', borderRadius: 2 }}>
                        {p.validity_warning}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', marginLeft: 12, flexShrink: 0 }}>
                    {p.official && <span style={{ fontSize: 10, background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: 2, fontWeight: 600 }}>OFFICIAL</span>}
                    {p.synthetic && <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 2 }}>SYNTHETIC</span>}
                    {p.record_type && <span style={{ fontSize: 10, background: '#f1f5f9', color: '#6b7280', padding: '2px 6px', borderRadius: 2 }}>{p.record_type}</span>}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {!searched && (
          <div style={{ padding: '30px 20px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 4, textAlign: 'center' }}>
            <BookOpen size={32} color="#d1d5db" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 13, color: '#6b7280' }}>Search for relevant Government Orders, SOPs, and standing orders.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
