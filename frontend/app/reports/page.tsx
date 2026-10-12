'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import GovCard from '@/components/ui/GovCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import { dashboard } from '@/lib/api';
import type { DashboardStats } from '@/lib/types';

const COLORS = ['#12345B','#1F5A92','#1a7a3c','#d97706','#c0392b','#0B5D5E','#C9A227','#5F6B7A'];

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { dashboard.stats().then(setStats).finally(() => setLoading(false)); }, []);
  if (loading) return <AppLayout><div className="gov-page"><LoadingSpinner /></div></AppLayout>;

  const statusData = stats ? Object.entries(stats.by_status).map(([k, v]) => ({ name: k.replace(/_/g, ' '), value: v })).sort((a, b) => b.value - a.value) : [];
  const total = stats?.kpis.total_proposals || 0;

  return (
    <AppLayout>
      <div className="gov-page">
        <SyntheticBanner />
        <PageHeader
          title="Reports & Analytics"
          subtitle="Proposal statistics and departmental performance overview"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Reports' }]}
        />

        {/* KPI summary */}
        <div className="kpi-strip" style={{ marginBottom: 20 }}>
          {stats && [
            { label: 'Total Proposals', value: stats.kpis.total_proposals },
            { label: 'Approved',         value: stats.kpis.approved,    cls: 'kpi-green' },
            { label: 'Completed',        value: stats.kpis.completed,   cls: 'kpi-teal' },
            { label: 'Rejected',         value: stats.kpis.rejected,    cls: 'kpi-red' },
            { label: 'Pending Review',   value: stats.kpis.submitted + stats.kpis.under_review, cls: 'kpi-orange' },
            { label: 'In Implementation',value: stats.kpis.in_implementation },
          ].map(kpi => (
            <div key={kpi.label} className={`kpi-card ${(kpi as { cls?: string }).cls || ''}`}>
              <div className="kpi-value">{kpi.value}</div>
              <div className="kpi-label">{kpi.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <GovCard title="Proposals by Status" noPadding>
            <div style={{ padding: '8px 0', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 5, right: 16, left: -20, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gov-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--gov-text-sec)' }} angle={-35} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--gov-text-sec)' }} />
                  <Tooltip contentStyle={{ fontSize: '0.75rem', border: '1px solid var(--gov-border)' }} />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GovCard>

          <GovCard title="Status Distribution" noPadding>
            <div style={{ height: 200, padding: '8px 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData.filter(d => d.value > 0)} cx="50%" cy="50%" outerRadius={75} dataKey="value">
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '0.75rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <table className="gov-table" style={{ marginTop: 0 }}>
              <thead><tr><th>Status</th><th style={{ textAlign: 'right' }}>Count</th><th style={{ textAlign: 'right' }}>%</th></tr></thead>
              <tbody>
                {statusData.map((row, i) => (
                  <tr key={row.name}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      {row.name}
                    </td>
                    <td style={{ textAlign: 'right', fontSize: '0.82rem', fontWeight: 600 }}>{row.value}</td>
                    <td style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--gov-muted)' }}>
                      {total ? ((row.value / total) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
                <tr style={{ background: '#F0F3F8', fontWeight: 700 }}>
                  <td style={{ fontSize: '0.82rem' }}>Total</td>
                  <td style={{ textAlign: 'right', fontSize: '0.82rem' }}>{total}</td>
                  <td style={{ textAlign: 'right', fontSize: '0.78rem' }}>100%</td>
                </tr>
              </tbody>
            </table>
          </GovCard>
        </div>
      </div>
    </AppLayout>
  );
}
