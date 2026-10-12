'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { search as searchApi } from '@/lib/api';
import Link from 'next/link';

export default function ProcurementPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const r = await searchApi.procurement({ what_is_needed: query }) as Record<string, unknown>;
      setResults(r);
    } catch { /* silent */ }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div style={{ padding: '16px 20px', maxWidth: 960 }}>
        <SyntheticBanner />
        <div style={{ margin: '14px 0' }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1a2744', margin: 0 }}>Procurement Intelligence</h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>Search historical tenders and procurement records</p>
        </div>
        <div style={{ marginBottom: 14, display: 'flex', gap: 10 }}>
          <Link href="/procurement/gem" style={{ padding: '7px 14px', background: '#1a2744', color: 'white', textDecoration: 'none', borderRadius: 3, fontSize: 12, fontWeight: 600 }}>
            Open GeM Intelligence Workspace
          </Link>
        </div>
        <form onSubmit={doSearch} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. CCTV cameras, digital radios, patrol vehicles..." style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 3, fontSize: 13, outline: 'none' }} />
          <button type="submit" disabled={!query.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#1a2744', color: 'white', border: 'none', borderRadius: 3, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Search size={14} /> Search
          </button>
        </form>
        {loading && <LoadingSpinner />}
        {results && (
          <div>
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 4, marginBottom: 14 }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', background: '#f8f9fa' }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: '#1a2744', margin: 0, textTransform: 'uppercase' }}>
                  Historical Tenders — {(results.equipment_class as string || '').toUpperCase()} Category
                </h3>
              </div>
              {(results.historical_tenders as Record<string, unknown>[]).length === 0 ? (
                <p style={{ padding: 16, color: '#9ca3af', fontSize: 12 }}>No records found.</p>
              ) : (
                <table className="gov-table">
                  <thead><tr><th>Title</th><th>Type</th><th>Quantity</th><th>Amount (INR)</th><th>Year</th><th>Status</th></tr></thead>
                  <tbody>
                    {(results.historical_tenders as Record<string, unknown>[]).map((t) => (
                      <tr key={t.tender_id as string}>
                        <td style={{ fontSize: 11 }}>{t.title as string}</td>
                        <td style={{ fontSize: 11, color: '#6b7280' }}>{t.procurement_type as string}</td>
                        <td style={{ fontSize: 11 }}>{t.quantity as string || '—'}</td>
                        <td style={{ fontSize: 11, textAlign: 'right' }}>{t.indicative_amount_inr ? (t.indicative_amount_inr as number).toLocaleString('en-IN') : '—'}</td>
                        <td style={{ fontSize: 11, color: '#9ca3af' }}>{t.year as number || '—'}</td>
                        <td style={{ fontSize: 11 }}>{t.decision_status as string}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {(results.indicative_price_summary as Record<string, unknown>) && (
              <div style={{ padding: 14, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 3, fontSize: 12, color: '#78350f' }}>
                <strong>Note:</strong> {(results.indicative_price_summary as Record<string, unknown>).limitation as string}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
