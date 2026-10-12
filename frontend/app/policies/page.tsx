'use client';
import { useState } from 'react';
import { Search, BookOpen, ExternalLink } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import PageHeader from '@/components/ui/PageHeader';
import GovCard from '@/components/ui/GovCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { search as searchApi } from '@/lib/api';
import type { PolicyResult } from '@/lib/types';

export default function PoliciesPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PolicyResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setSearched(true);
    try { const r = await searchApi.policies(query); setResults(r.policies); }
    catch { setResults([]); }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="gov-page">
        <SyntheticBanner />
        <PageHeader
          title="Policy & SOP Intelligence"
          subtitle="Search Government Orders, Standing Orders, SOPs and administrative instructions"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Policy & SOP' }]}
        />

        {/* Official sources notice */}
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--gov-info-bg)', border: '1px solid #bcd4f0', borderLeft: '3px solid var(--gov-blue)', borderRadius: '0 var(--r-md) var(--r-md) 0' }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gov-review)', marginBottom: 6 }}>Official Sources</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Puducherry Police — Government Orders', href: 'https://police.py.gov.in/GovOrders.htm' },
              { label: 'Puducherry Police Official Website', href: 'https://police.py.gov.in/' },
            ].map(l => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--gov-blue)', fontWeight: 500 }}>
                <ExternalLink size={12} /> {l.label}
              </a>
            ))}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--gov-text-sec)', marginTop: 6 }}>
            PRISM-PY searches its demo corpus. For official current policies, refer to the above sources. Do not cite AI-retrieved results as official authority.
          </p>
        </div>

        <GovCard title="Search Policy Corpus" style={{ marginBottom: 16 }}>
          <form onSubmit={doSearch} style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gov-muted)' }} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. CCTV procurement guidelines, digital evidence SOP, tender process, training policy..." className="gov-input" style={{ paddingLeft: 32 }} />
            </div>
            <button type="submit" className="btn btn-primary"><Search size={14} /> Search</button>
          </form>
        </GovCard>

        {loading && <LoadingSpinner text="Searching policy corpus..." />}

        {searched && !loading && (
          <GovCard title={`Results — ${results?.length || 0} records found`} noPadding>
            {(!results || results.length === 0) ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--gov-muted)', fontSize: '0.82rem' }}>No policies found for this query.</div>
            ) : (
              results.map((p, i) => (
                <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--gov-border)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <BookOpen size={16} color="var(--gov-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--gov-navy)', marginBottom: 3 }}>{p.title}</div>
                    {p.issuer && <div style={{ fontSize: '0.72rem', color: 'var(--gov-text-sec)', marginBottom: 5 }}>{p.issuer}</div>}
                    {p.excerpt && <p style={{ fontSize: '0.8rem', color: 'var(--gov-text-sec)', lineHeight: 1.55 }}>{p.excerpt.slice(0, 350)}</p>}
                    {p.validity_warning && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--gov-warning)', marginTop: 5, padding: '3px 8px', background: 'var(--gov-warning-bg)', borderRadius: 'var(--r-sm)', display: 'inline-block' }}>
                        {p.validity_warning}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                    {p.official && <span className="badge badge-approved" style={{ fontSize: '0.62rem' }}>Official</span>}
                    {p.synthetic && <span className="badge badge-synthetic" style={{ fontSize: '0.62rem' }}>Synthetic</span>}
                    {p.record_type && <span className="badge badge-normal" style={{ fontSize: '0.62rem' }}>{p.record_type}</span>}
                  </div>
                </div>
              ))
            )}
            <div style={{ padding: '8px 14px', fontSize: '0.68rem', color: 'var(--gov-muted)' }}>
              SYNTHETIC DEMO DATA — Not verified official documents.
            </div>
          </GovCard>
        )}
      </div>
    </AppLayout>
  );
}
