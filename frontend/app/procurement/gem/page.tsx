'use client';
import { useState } from 'react';
import { Search, ExternalLink, Package, FileText } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { gem as gemApi } from '@/lib/api';

export default function GeMPage() {
  const [form, setForm] = useState({ category: '', product: '', keywords: '', quantity: '', delivery_location: 'Puducherry' });
  const [results, setResults] = useState<Record<string, unknown>[] | null>(null);
  const [modes, setModes] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [package_, setPackage_] = useState<Record<string, unknown> | null>(null);
  const [pkgLoading, setPkgLoading] = useState(false);

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const r = await gemApi.search({ ...form }) as Record<string, unknown>;
      setResults(r.results as Record<string, unknown>[]);
      setModes(r.procurement_modes as Record<string, unknown>[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    }
    setLoading(false);
  };

  const generatePackage = async () => {
    setPkgLoading(true);
    try {
      const r = await gemApi.package({ ...form, title: form.product || form.keywords }) as Record<string, unknown>;
      setPackage_(r.package as Record<string, unknown>);
    } catch { /* silent */ }
    setPkgLoading(false);
  };

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((v) => ({ ...v, [field]: e.target.value }));

  return (
    <AppLayout>
      <div style={{ padding: '16px 20px', maxWidth: 960 }}>
        <SyntheticBanner />
        <div style={{ margin: '14px 0 16px' }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1a2744', margin: 0 }}>GeM Intelligence Workspace</h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>Procurement intelligence and GeM portal preparation</p>
        </div>

        {/* Important notice */}
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderLeft: '4px solid #2563eb', borderRadius: 4 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#1e40af', margin: 0 }}>
            PRISM-PY provides procurement intelligence only.
            <a href="https://gem.gov.in/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 3, color: '#1d4ed8' }}>
              Open Official GeM Portal <ExternalLink size={11} />
            </a>
          </p>
          <p style={{ fontSize: 11, color: '#3730a3', margin: '4px 0 0' }}>
            Final procurement decisions remain with the authorized officer. This workspace does not place orders or select vendors. All demo results shown are synthetic.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 4, padding: 16 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: '#1a2744', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Search Parameters</h3>
            <form onSubmit={doSearch}>
              {[
                { label: 'Category', field: 'category' as const, placeholder: 'e.g. Surveillance Equipment, Communication' },
                { label: 'Product / Service', field: 'product' as const, placeholder: 'e.g. IP CCTV Camera, Digital Radio' },
                { label: 'Keywords', field: 'keywords' as const, placeholder: 'e.g. 4MP ONVIF PoE' },
                { label: 'Quantity', field: 'quantity' as const, placeholder: 'e.g. 10 units' },
                { label: 'Delivery Location', field: 'delivery_location' as const, placeholder: 'e.g. Puducherry' },
              ].map((item) => (
                <div key={item.field} style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 3 }}>{item.label}</label>
                  <input
                    value={form[item.field]}
                    onChange={f(item.field)}
                    placeholder={item.placeholder}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 3, fontSize: 12, outline: 'none' }}
                  />
                </div>
              ))}
              <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#1a2744', color: 'white', border: 'none', borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                <Search size={14} /> Search GeM Intelligence
              </button>
            </form>
          </div>

          {/* Procurement mode guidance */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 4, padding: 16 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: '#1a2744', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Procurement Mode Guidance</h3>
            {modes ? (
              modes.map((m, i) => (
                <div key={i} style={{ marginBottom: 10, padding: '8px 10px', background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 3 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1a2744' }}>{m.mode as string}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{m.context as string}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Source: {m.source as string}</div>
                  {m.officer_verification_required && (
                    <div style={{ fontSize: 10, color: '#d97706', marginTop: 2, fontWeight: 600 }}>Officer verification required</div>
                  )}
                </div>
              ))
            ) : (
              <div>
                <p style={{ fontSize: 12, color: '#6b7280' }}>GeM procurement modes (for reference):</p>
                {['Direct Purchase', 'Direct Purchase with L1', 'e-Bid / Reverse Auction'].map((mode) => (
                  <div key={mode} style={{ padding: '6px 10px', marginBottom: 6, background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 3, fontSize: 12, color: '#374151' }}>{mode}</div>
                ))}
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>Refer to current GeM guidelines for applicable thresholds. Officer must determine the applicable mode.</p>
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <a href="https://gem.gov.in/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: '1px solid #2563eb', borderRadius: 3, fontSize: 12, color: '#1d4ed8', textDecoration: 'none', fontWeight: 600, justifyContent: 'center' }}>
                <ExternalLink size={13} /> Open Official GeM Portal
              </a>
            </div>
          </div>
        </div>

        {loading && <LoadingSpinner text="Searching procurement intelligence..." />}
        {error && <ErrorMessage message={error} />}

        {results && (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 4, marginBottom: 16 }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: '#1a2744', margin: 0, textTransform: 'uppercase' }}>Intelligence Results ({results.length})</h3>
              <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 2, fontWeight: 600 }}>SYNTHETIC DEMO DATA</span>
            </div>
            {results.length === 0 ? (
              <p style={{ padding: 16, color: '#9ca3af', fontSize: 12 }}>No results found. Try broader search terms.</p>
            ) : (
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>Product / Service</th>
                    <th>Specification</th>
                    <th>Observed Price (INR)</th>
                    <th>Procurement Mode</th>
                    <th>Observed</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: 12, fontWeight: 600 }}>{r.product as string}</td>
                      <td style={{ fontSize: 11, color: '#6b7280' }}>{(r.specification_summary as string)?.slice(0, 80) || '—'}</td>
                      <td style={{ fontSize: 12, textAlign: 'right' }}>
                        {r.observed_price_inr ? (r.observed_price_inr as number).toLocaleString('en-IN') : '—'}
                      </td>
                      <td style={{ fontSize: 11, color: '#6b7280' }}>{r.procurement_mode as string || '—'}</td>
                      <td style={{ fontSize: 11, color: '#9ca3af' }}>{r.observed_at as string || '—'}</td>
                      <td style={{ fontSize: 10, color: '#f59e0b' }}>SYNTHETIC</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ padding: '8px 14px', background: '#fef3c7', borderTop: '1px solid #fde68a', fontSize: 11, color: '#78350f' }}>
              These are synthetic demo observations only. Do not use as official price benchmarks. Use the official GeM portal for current prices.
            </div>
          </div>
        )}

        {/* Package generation */}
        {results && (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 4 }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: '#1a2744', margin: 0, textTransform: 'uppercase' }}>Procurement Package</h3>
            </div>
            <div style={{ padding: 16 }}>
              <button onClick={generatePackage} disabled={pkgLoading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#1a2744', color: 'white', border: 'none', borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 14 }}>
                <Package size={13} /> {pkgLoading ? 'Generating...' : 'Generate Procurement Package'}
              </button>
              {package_ && (
                <div>
                  <div style={{ padding: 12, background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 3, marginBottom: 12 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <tbody>
                        {Object.entries(package_).filter(([k]) => !['gem_search_parameters', 'officer_instructions', 'data_classification', 'vendor_selection'].includes(k)).map(([k, v]) => (
                          <tr key={k}>
                            <td style={{ padding: '4px 8px', fontWeight: 600, color: '#6b7280', width: 180, verticalAlign: 'top' }}>{k.replace(/_/g, ' ')}</td>
                            <td style={{ padding: '4px 8px', color: '#374151' }}>{v != null ? String(v) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {(package_.officer_instructions as string[])?.length > 0 && (
                    <div style={{ padding: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 3 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#92400e', margin: '0 0 6px' }}>Officer Instructions</p>
                      {(package_.officer_instructions as string[]).map((inst, i) => (
                        <p key={i} style={{ fontSize: 12, color: '#78350f', margin: '3px 0', display: 'flex', gap: 6 }}>
                          <span>{i + 1}.</span> {inst}
                        </p>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                    <a href="https://gem.gov.in/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#1a2744', color: 'white', textDecoration: 'none', borderRadius: 3, fontSize: 12, fontWeight: 600 }}>
                      <ExternalLink size={13} /> Open Official GeM Portal
                    </a>
                    <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(package_, null, 2))} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid #d1d5db', background: 'white', borderRadius: 3, fontSize: 12, cursor: 'pointer' }}>
                      <FileText size={13} /> Copy Package
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
