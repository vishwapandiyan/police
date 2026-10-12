'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FilePlus, ChevronRight, Search, BookOpen, ShoppingCart, Package, FileBarChart, Clock } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import GovCard from '@/components/ui/GovCard';
import PageHeader from '@/components/ui/PageHeader';
import { dashboard } from '@/lib/api';
import type { DashboardStats } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PIE_COLORS = ['#5F6B7A','#d97706','#1F5A92','#1a7a3c','#c0392b','#0B5D5E','#C9A227'];

function getGreeting(d?: Date | null) {
  if (!d) return 'Welcome';
  const h = d.getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { setStats(await dashboard.stats()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const firstName = user?.display_name?.split(' ')[0] || 'Officer';
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); }, []);

  const statusChartData = stats
    ? Object.entries(stats.by_status)
        .map(([k, v]) => ({ name: k.replace(/_/g, ' '), value: v }))
        .sort((a, b) => b.value - a.value)
    : [];

  const deptData = stats
    ? Object.values(stats.recent_proposals.reduce((acc, p) => {
        const k = p.department || 'Other';
        acc[k] = (acc[k] || { name: k, value: 0 });
        acc[k].value++;
        return acc;
      }, {} as Record<string, { name: string; value: number }>))
        .sort((a, b) => b.value - a.value)
        .slice(0, 7)
    : [];

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtTime = (d?: string) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <AppLayout>
      <div className="gov-page">
        <SyntheticBanner />

        {/* Welcome banner */}
        <div className="welcome-banner" style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div>
              <div className="welcome-title">
                {getGreeting(now)}, <span>{firstName}</span>
              </div>
              <div className="welcome-subtitle" style={{ marginTop: 4 }}>
                Welcome to PRISM-PY<br />
                Manage, analyse and track departmental proposals using past records, policies and procurement intelligence.
              </div>
              <div className="welcome-divider" />
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem' }}>
                {now ? now.toLocaleDateString('en-IN', { weekday: 'long' }) : '—'}
              </div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', marginTop: 2 }}>
                {now ? now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem' }}>
                {now ? now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>
              <Link href="/proposals/new" className="btn btn-teal btn-sm" style={{ marginTop: 12, color: 'white' }}>
                <FilePlus size={13} /> + New Proposal
              </Link>
            </div>
          </div>
        </div>

        {loading && <LoadingSpinner text="Retrieving dashboard data..." />}
        {error && <ErrorMessage message={error} onRetry={load} />}

        {stats && (
          <>
            {/* KPI Strip */}
            <div className="kpi-strip" style={{ marginBottom: 20 }}>
              {[
                { label: 'Total Proposals', value: stats.kpis.total_proposals, href: '/proposals', sub: '+12% from last month', cls: '' },
                { label: 'Draft', value: stats.kpis.draft, href: '/proposals?status=DRAFT', sub: 'In preparation', cls: 'kpi-orange' },
                { label: 'Pending Review', value: stats.kpis.submitted + stats.kpis.under_review, href: '/proposals?status=SUBMITTED_FOR_REVIEW', sub: 'Requires attention', cls: 'kpi-orange' },
                { label: 'Approved', value: stats.kpis.approved, href: '/proposals?status=APPROVED', sub: '+3 this month', cls: 'kpi-green' },
                { label: 'In Implementation', value: stats.kpis.in_implementation, href: '/implementation', sub: 'Across departments', cls: 'kpi-teal' },
                { label: 'Outcomes Recorded', value: stats.kpis.total_outcomes, href: '/outcomes', sub: 'Lessons learned', cls: 'kpi-blue' },
              ].map(kpi => (
                <Link key={kpi.label} href={kpi.href} className={`kpi-card ${kpi.cls}`}>
                  <div className="kpi-value">{kpi.value}</div>
                  <div className="kpi-label">{kpi.label}</div>
                  {kpi.sub && <div className="kpi-sub">{kpi.sub}</div>}
                </Link>
              ))}
            </div>

            {/* Main 2-col grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 16 }}>

              {/* Recent Proposals table */}
              <GovCard title="Recent Proposals" action={{ label: 'View All', href: '/proposals' }} noPadding>
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Proposal Number</th>
                      <th>Title / Requirement</th>
                      <th>Department / Unit</th>
                      <th>Location</th>
                      <th>Submitted On</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_proposals.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: 'var(--gov-muted)', fontSize: '0.82rem' }}>
                        No proposals found.
                      </td></tr>
                    )}
                    {stats.recent_proposals.map((p, i) => (
                      <tr key={p.id}>
                        <td style={{ color: 'var(--gov-muted)', fontSize: '0.75rem' }}>{i + 1}</td>
                        <td>
                          <Link href={`/proposals/${p.id}`} style={{ color: 'var(--gov-blue)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600 }}>
                            {p.proposal_number}
                          </Link>
                        </td>
                        <td style={{ maxWidth: 200 }}>
                          <Link href={`/proposals/${p.id}`} style={{ color: 'var(--gov-text)', fontWeight: 500, fontSize: '0.8rem' }}>
                            {p.title.length > 45 ? p.title.slice(0, 45) + '…' : p.title}
                          </Link>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--gov-text-sec)' }}>{p.department || '—'}</td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--gov-text-sec)' }}>{p.station || p.region || '—'}</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--gov-muted)', whiteSpace: 'nowrap' }}>{fmt(p.submitted_at || p.created_at)}</td>
                        <td><StatusBadge status={p.status} size="xs" /></td>
                        <td>
                          <Link href={`/proposals/${p.id}`} className="btn btn-sm btn-secondary" style={{ fontSize: '0.72rem', padding: '3px 10px' }}>
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GovCard>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Recent Activity */}
                <GovCard title="Recent Activity" action={{ label: 'View All', href: '/audit' }} noPadding>
                  <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                    {stats.recent_activity.slice(0, 8).map((e, i) => (
                      <div key={e.id} style={{
                        display: 'flex', gap: 10, padding: '8px 12px',
                        borderBottom: i < 7 ? '1px solid var(--gov-border)' : 'none',
                        alignItems: 'flex-start',
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: '#EEF1F6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.6rem', fontWeight: 700, color: 'var(--gov-navy)',
                          flexShrink: 0,
                        }}>
                          {(e.actor || 'S').slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gov-text)', lineHeight: 1.3 }}>
                            <strong>{e.actor || 'System'}</strong> · {e.action.replace(/_/g, ' ')}
                          </div>
                          {e.detail && <div style={{ fontSize: '0.7rem', color: 'var(--gov-text-sec)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.detail.slice(0, 40)}</div>}
                          <div style={{ fontSize: '0.65rem', color: 'var(--gov-muted)', marginTop: 1 }}>
                            {fmt(e.created_at)} {fmtTime(e.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {stats.recent_activity.length === 0 && (
                      <p style={{ padding: '14px 12px', color: 'var(--gov-muted)', fontSize: '0.78rem' }}>No recent activity.</p>
                    )}
                  </div>
                </GovCard>

                {/* Quick Actions */}
                <GovCard title="Quick Actions" noPadding>
                  {[
                    { label: 'Create New Proposal',        href: '/proposals/new',  icon: <FilePlus size={13} /> },
                    { label: 'Search Previous Proposals',  href: '/precedents',     icon: <Search size={13} /> },
                    { label: 'Find Relevant Policies / SOPs', href: '/policies',   icon: <BookOpen size={13} /> },
                    { label: 'Check Procurement History',  href: '/procurement',    icon: <ShoppingCart size={13} /> },
                    { label: 'View Equipment Specifications',href:'/procurement/gem',icon: <Package size={13} /> },
                    { label: 'Generate Decision Brief',    href: '/decisions',      icon: <FileBarChart size={13} /> },
                  ].map(item => (
                    <Link key={item.href + item.label} href={item.href} className="quick-action-item">
                      <span style={{ color: 'var(--gov-teal)', flexShrink: 0 }}>{item.icon}</span>
                      <span style={{ flex: 1, fontSize: '0.78rem', color: 'var(--gov-text)' }}>{item.label}</span>
                      <ChevronRight size={12} className="quick-action-arrow" />
                    </Link>
                  ))}
                </GovCard>
              </div>
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

              {/* Proposals by Department */}
              <GovCard title={`Proposals by Department — Total: ${stats.kpis.total_proposals}`} action={{ label: 'View Report', href: '/reports' }} noPadding>
                <div style={{ padding: '12px 16px' }}>
                  {deptData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gov-text)', width: 120, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                      <div className="metric-bar-bg" style={{ flex: 1 }}>
                        <div className="metric-bar-fill" style={{ width: `${Math.round((d.value / stats.kpis.total_proposals) * 100)}%` }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gov-navy)', width: 24, textAlign: 'right' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </GovCard>

              {/* Proposals by Status — Pie */}
              <GovCard title={`Proposals by Status — Total: ${stats.kpis.total_proposals}`} action={{ label: 'View Report', href: '/reports' }} noPadding>
                <div style={{ padding: '0 8px', height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="40%"
                        cy="50%"
                        outerRadius={75}
                        dataKey="value"
                        labelLine={false}
                      >
                        {statusChartData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '0.75rem', border: '1px solid var(--gov-border)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '0 8px 12px', fontSize: '0.7rem' }}>
                    {statusChartData.slice(0, 6).map((d, i) => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                        <span style={{ color: 'var(--gov-text-sec)', flex: 1 }}>{d.name}</span>
                        <span style={{ fontWeight: 600, color: 'var(--gov-text)' }}>{d.value}</span>
                        <span style={{ color: 'var(--gov-muted)' }}>({((d.value / stats.kpis.total_proposals) * 100).toFixed(1)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GovCard>
            </div>

            {/* Official resources */}
            <GovCard title="Official Resources" noPadding>
              <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
                {[
                  { label: 'Government e-Marketplace (GeM)', href: 'https://gem.gov.in/' },
                  { label: 'Puducherry Police', href: 'https://police.py.gov.in/' },
                  { label: 'Government Orders — Puducherry Police', href: 'https://police.py.gov.in/GovOrders.htm' },
                  { label: 'GeM Handbook', href: 'https://assets-bg.gem.gov.in/resources/pdf/GeM_handbook.pdf' },
                  { label: 'GeM Buyer Learning', href: 'https://elearning.gem.gov.in/' },
                ].map((l, i) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '9px 14px',
                      borderRight: '1px solid var(--gov-border)',
                      fontSize: '0.78rem', color: 'var(--gov-blue)',
                      textDecoration: 'none', whiteSpace: 'nowrap',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = '#F0F3F8')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    ↗ {l.label}
                  </a>
                ))}
              </div>
            </GovCard>
          </>
        )}
      </div>
    </AppLayout>
  );
}
