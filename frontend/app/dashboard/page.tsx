'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FilePlus, FileText, CheckSquare, TrendingUp, Clock, Activity, ExternalLink } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import { dashboard } from '@/lib/api';
import type { DashboardStats } from '@/lib/types';
import { useAuth } from '@/lib/auth';

function KpiCard({ label, value, sub, href, color = '#1a2744' }: {
  label: string; value: number; sub?: string; href?: string; color?: string;
}) {
  const content = (
    <div
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 4,
        padding: '14px 16px',
        borderTop: `3px solid ${color}`,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{content}</Link> : content;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 4, marginBottom: 16 }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', background: '#f8f9fa' }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: '#1a2744', letterSpacing: '0.3px', textTransform: 'uppercase', margin: 0 }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await dashboard.stats();
      setStats(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <AppLayout>
      <div style={{ padding: '16px 20px' }}>
        <SyntheticBanner />

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0' }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1a2744', margin: 0 }}>Dashboard</h1>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
              Welcome, {user?.display_name} &mdash; {user?.department}
            </p>
          </div>
          <Link
            href="/proposals/new"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              background: '#1a2744',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 3,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <FilePlus size={14} />
            New Proposal
          </Link>
        </div>

        {loading && <LoadingSpinner text="Loading dashboard data..." />}
        {error && <ErrorMessage message={error} onRetry={load} />}

        {stats && (
          <>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
              <KpiCard label="Total Proposals" value={stats.kpis.total_proposals} href="/proposals" color="#1a2744" />
              <KpiCard label="Draft" value={stats.kpis.draft} href="/proposals?status=DRAFT" color="#6b7280" />
              <KpiCard label="Pending Review" value={stats.kpis.submitted + stats.kpis.under_review} href="/proposals?status=SUBMITTED_FOR_REVIEW" color="#d97706" />
              <KpiCard label="Approved" value={stats.kpis.approved} href="/proposals?status=APPROVED" color="#16a34a" />
              <KpiCard label="Completed" value={stats.kpis.completed} href="/proposals?status=COMPLETED" color="#1d4ed8" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
              <KpiCard label="Returned" value={stats.kpis.returned} color="#d97706" />
              <KpiCard label="Rejected" value={stats.kpis.rejected} color="#dc2626" />
              <KpiCard label="Under Review" value={stats.kpis.under_review} color="#7e22ce" />
              <KpiCard label="In Implementation" value={stats.kpis.in_implementation} color="#0f766e" />
              <KpiCard label="Outcomes Recorded" value={stats.kpis.total_outcomes} color="#0369a1" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Recent proposals */}
              <Section title="Recent Proposals">
                <table className="gov-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_proposals.length === 0 && (
                      <tr><td colSpan={4} style={{ color: '#9ca3af', textAlign: 'center', padding: 16 }}>No proposals found</td></tr>
                    )}
                    {stats.recent_proposals.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <Link href={`/proposals/${p.id}`} style={{ color: '#1d4ed8', fontSize: 11, fontFamily: 'monospace' }}>
                            {p.proposal_number}
                          </Link>
                        </td>
                        <td style={{ maxWidth: 200 }}>
                          <Link href={`/proposals/${p.id}`} style={{ color: '#1a2744', textDecoration: 'none', fontSize: 12 }}>
                            {p.title.length > 50 ? p.title.slice(0, 50) + '…' : p.title}
                          </Link>
                        </td>
                        <td><StatusBadge status={p.status} size="xs" /></td>
                        <td style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize' }}>{p.category || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: '8px 14px', borderTop: '1px solid #f1f3f5' }}>
                  <Link href="/proposals" style={{ fontSize: 12, color: '#1d4ed8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    View all proposals <ExternalLink size={11} />
                  </Link>
                </div>
              </Section>

              {/* Recent activity */}
              <Section title="Recent Activity">
                {stats.recent_activity.length === 0 ? (
                  <p style={{ padding: 16, color: '#9ca3af', fontSize: 12 }}>No recent activity</p>
                ) : (
                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {stats.recent_activity.map((event) => (
                      <div
                        key={event.id}
                        style={{
                          display: 'flex',
                          gap: 10,
                          padding: '8px 14px',
                          borderBottom: '1px solid #f1f3f5',
                          alignItems: 'flex-start',
                        }}
                      >
                        <Activity size={12} color="#9ca3af" style={{ marginTop: 2, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: '#374151' }}>
                            <strong style={{ color: '#1a2744' }}>{event.actor || 'System'}</strong>
                            {' · '}{event.action.replace(/_/g, ' ')}
                          </div>
                          {event.detail && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{event.detail.slice(0, 60)}</div>}
                          {event.created_at && (
                            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>
                              {new Date(event.created_at).toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>

            {/* Quick actions */}
            <Section title="Quick Actions">
              <div style={{ display: 'flex', gap: 10, padding: '12px 14px', flexWrap: 'wrap' }}>
                {[
                  { label: 'New Proposal', href: '/proposals/new', icon: <FilePlus size={14} />, color: '#1a2744' },
                  { label: 'Precedent Search', href: '/precedents', icon: <FileText size={14} />, color: '#2563eb' },
                  { label: 'Policy & SOP', href: '/policies', icon: <CheckSquare size={14} />, color: '#7e22ce' },
                  { label: 'GeM Intelligence', href: '/procurement/gem', icon: <TrendingUp size={14} />, color: '#0f766e' },
                  { label: 'Audit Log', href: '/audit', icon: <Clock size={14} />, color: '#6b7280' },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 14px',
                      border: `1px solid ${action.color}20`,
                      background: `${action.color}10`,
                      color: action.color,
                      textDecoration: 'none',
                      borderRadius: 3,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {action.icon}
                    {action.label}
                  </Link>
                ))}
              </div>
            </Section>

            {/* Public procurement links */}
            <Section title="Official Resources">
              <div style={{ padding: '10px 14px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Government e-Marketplace (GeM)', href: 'https://gem.gov.in/' },
                  { label: 'Puducherry Police', href: 'https://police.py.gov.in/' },
                  { label: 'Government Orders — Puducherry Police', href: 'https://police.py.gov.in/GovOrders.htm' },
                  { label: 'GeM Handbook', href: 'https://assets-bg.gem.gov.in/resources/pdf/GeM_handbook.pdf' },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      color: '#1d4ed8',
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={11} />
                    {link.label}
                  </a>
                ))}
              </div>
            </Section>
          </>
        )}
      </div>
    </AppLayout>
  );
}
