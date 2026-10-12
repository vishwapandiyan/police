'use client';
import { useState } from 'react';
import { Search, ExternalLink, Package, FileText } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import PageHeader from '@/components/ui/PageHeader';
import GovCard from '@/components/ui/GovCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { gem as gemApi } from '@/lib/api';

export default function GeMPage() {
  const [form, setForm] = useState({ category: '', product: '', keywords: '', quantity: '', delivery_location: 'Puducherry' });
  const [results, setResults] = useState<Record<string, unknown>[] | null>(null);
  const [modes, setModes] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [package_, setPkg] = useState<Record<string, unknown> | null>(null);
  const [pkgLoading, setPkgLoading] = useState(false);

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await gemApi.search({ ...form }) as Record<string, unknown>;
      setResults(r.results as Record<string, unknown>[]);
      setModes(r.procurement_modes as Record<string, unknown>[]);
    } catch { /* silent */ }
    setLoading(false);
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(v => ({ ...v, [k]: e.target.value }));

  return (
    <AppLayout>
      <div className="gov-page">
        <SyntheticBanner />
        <PageHeader
          title="GeM Intelligence Workspace"
          subtitle="Government e-Marketplace procurement research and package preparation"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Procurement', href: '/procurement' }, { label: 'GeM Intelligence' }]}
          actions={
            <a href="https://gem.gov.in/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              <ExternalLink size={13} /> Open Official GeM Portal
            </a>
          }
        />

        {/* Important notice */}
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--gov-info-bg)', border: '1px solid #bcd4f0', borderLeft: '4px solid var(--gov-blue)', borderRadius: '0 var(--r-md) var(--r-md) 0' }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gov-review)', marginBottom: 2 }}>Procurement Intelligence Only</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--gov-text-sec)' }}>
            PRISM-PY does not place orders, select vendors, or bypass any GeM security controls. Final procurement decisions remain with the authorised officer on the official GeM portal.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <GovCard title="Search Parameters">
            <form onSubmit={doSearch}>
              {[
                { label: 'Category', key: 'category', ph: 'e.g. Surveillance Equipment, Communication Systems' },
                { label: 'Product / Service', key: 'product', ph: 'e.g. IP CCTV Camera, Digital Radio Handset' },
                { label: 'Keywords', key: 'keywords', ph: 'e.g. 4MP ONVIF PoE H.265' },
                { label: 'Quantity', key: 'quantity', ph: 'e.g. 10 units' },
                { label: 'Delivery Location', key: 'delivery_location', ph: 'e.g. Puducherry' },
              ].map(item => (
                <div key={item.key} style={{ marginBottom: 12 }}>
                  <label className="form-label">{item.label}</label>
                  <input value={form[item.key as keyof typeof form]} onChange={f(item.key as keyof typeof form)} placeholder={item.ph} className="gov-input" />
                </div>
              ))}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <Search size={14} /> Search GeM Intelligence
              </button>
            </form>
          </GovCard>

          <GovCard title="Procurement Mode Guidance">
            {modes ? (
              modes.map((m, i) => (
                <div key={i} style={{ marginBottom: 10, padding: '8px 10px', background: '#F8FAFD', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gov-navy)' }}>{m.mode as string}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)', marginTop: 2 }}>{m.context as string}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--gov-muted)', marginTop: 1 }}>Source: {m.source as string}</div>
                </div>
              ))
            ) : (
              <div>
                {['Direct Purchase', 'Direct Purchase with L1', 'e-Bid / Reverse Auction'].map(mode => (
                  <div key={mode} style={{ padding: '8px 10px', marginBottom: 6, background: '#F8FAFD', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', fontSize: '0.82rem', fontWeight: 500, color: 'var(--gov-text)' }}>{mode}</div>
                ))}
                <p style={{ fontSize: '0.72rem', color: 'var(--gov-muted)', marginTop: 6 }}>Refer to current GeM guidelines for applicable thresholds. Officer must determine the procurement mode.</p>
              </div>
            )}
            <a href="https://gem.gov.in/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
              <ExternalLink size={12} /> Open Official GeM Portal
            </a>
          </GovCard>
        </div>

        {loading && <LoadingSpinner text="Searching procurement intelligence..." />}

        {results && (
          <GovCard title={`Intelligence Results (${results.length})`} noPadding style={{ marginBottom: 16 }}>
            <div style={{ padding: '6px 14px', borderBottom: '1px solid var(--gov-border)', background: 'var(--gov-warning-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--gov-warning)', fontWeight: 600 }}>SYNTHETIC DEMO DATA — Not live GeM data. Use official portal for actual procurement.</span>
            </div>
            {results.length === 0 ? (
              <p style={{ padding: 16, color: 'var(--gov-muted)', fontSize: '0.82rem' }}>No results found. Try broader search terms.</p>
            ) : (
              <table className="gov-table">
                <thead><tr><th>Product / Service</th><th>Specification</th><th style={{ textAlign: 'right' }}>Observed Price (INR)</th><th>Procurement Mode</th><th>Observed</th><th>Source Type</th></tr></thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '0.8rem', fontWeight: 500 }}>{r.product as string}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)' }}>{(r.specification_summary as string)?.slice(0, 80) || '—'}</td>
                      <td style={{ fontSize: '0.82rem', textAlign: 'right', fontWeight: 600 }}>{r.observed_price_inr ? (r.observed_price_inr as number).toLocaleString('en-IN') : '—'}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)' }}>{r.procurement_mode as string || '—'}</td>
                      <td style={{ fontSize: '0.72rem', color: 'var(--gov-muted)' }}>{r.observed_at as string || '—'}</td>
                      <td><span className="badge badge-synthetic" style={{ fontSize: '0.62rem' }}>Synthetic</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </GovCard>
        )}

        {results && (
          <GovCard title="Procurement Package">
            <button onClick={async () => { setPkgLoading(true); try { const r = await gemApi.package({ ...form, title: form.product || form.keywords }) as Record<string, unknown>; setPkg(r.package as Record<string, unknown>); } catch { } setPkgLoading(false); }} disabled={pkgLoading} className="btn btn-secondary btn-sm" style={{ marginBottom: 14 }}>
              <Package size={13} /> {pkgLoading ? 'Generating...' : 'Generate Procurement Package'}
            </button>
            {package_ && (
              <div>
                <div style={{ background: '#F8FAFD', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-md)', padding: 14, marginBottom: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <tbody>
                      {Object.entries(package_).filter(([k]) => !['gem_search_parameters', 'officer_instructions', 'data_classification', 'vendor_selection'].includes(k)).map(([k, v]) => (
                        <tr key={k} style={{ borderBottom: '1px solid var(--gov-border)' }}>
                          <td style={{ padding: '5px 8px', fontWeight: 600, color: 'var(--gov-text-sec)', width: 200 }}>{k.replace(/_/g, ' ')}</td>
                          <td style={{ padding: '5px 8px' }}>{v != null ? String(v) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(package_.officer_instructions as string[])?.length > 0 && (
                  <div style={{ padding: '10px 12px', background: 'var(--gov-warning-bg)', border: '1px solid #f0d060', borderRadius: 'var(--r-sm)' }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gov-warning)', marginBottom: 6 }}>Officer Instructions</p>
                    {(package_.officer_instructions as string[]).map((inst, i) => (
                      <p key={i} style={{ fontSize: '0.78rem', color: '#7a5500', margin: '3px 0' }}>{i + 1}. {inst}</p>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                  <a href="https://gem.gov.in/" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                    <ExternalLink size={12} /> Open Official GeM Portal
                  </a>
                  <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(package_, null, 2))} className="btn btn-secondary btn-sm">
                    <FileText size={12} /> Copy Package
                  </button>
                </div>
              </div>
            )}
          </GovCard>
        )}
      </div>
    </AppLayout>
  );
}
