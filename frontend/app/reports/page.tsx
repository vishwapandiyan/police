'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AppLayout from '@/components/layout/AppLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import { dashboard } from '@/lib/api';
import type { DashboardStats } from '@/lib/types';

const COLORS = ['#1a2744', '#2563eb', '#16a34a', '#d97706', '#dc2626', '#7e22ce', '#0f766e', '#0369a1', '#92400e', '#374151'];

export default function ReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboard.stats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout><LoadingSpinner /></AppLayout>;

  const statusData = stats ? Object.entries(stats.by_status).map(([k, v]) => ({ name: k.replace(/_/g, ' '), value: v })).sort((a, b) => b.value - a.value) : [];
  const kpiValues = stats ? [
    { name: 'Total', value: stats.kpis.total_proposals },
    { name: 'Draft', value: stats.kpis.draft },
    { name: 'Submitted', value: stats.kpis.submitted },
    { name: 'Approved', value: stats.kpis.approved },
    { name: 'Completed', value: stats.kpis.completed },
    { name: 'Rejected', value: stats.kpis.rejected },
  ] : [];

  return (
    <AppLayout>
      <div style={{ padding: '16px 20px' }}>
        <SyntheticBanner />
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1a2744', margin: '14px 0 16px' }}>Reports & Analytics</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 4 }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', background: '#f8f9fa' }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: '#1a2744', margin: 0, textTransform: 'uppercase' }}>Proposals by Status</h3>
            </div>
            <div style={{ padding: 16, height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="value" fill="#1a2744" radius={[2, 2, 0, 0]}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 4 }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', background: '#f8f9fa' }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: '#1a2744', margin: 0, textTransform: 'uppercase' }}>Key Performance Indicators</h3>
            </div>
            <div style={{ padding: 16, height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={kpiValues.filter(k => k.name !== 'Total')} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                    {kpiValues.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16, background: 'white', border: '1px solid #e5e7eb', borderRadius: 4 }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', background: '#f8f9fa' }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: '#1a2744', margin: 0, textTransform: 'uppercase' }}>Summary Table</h3>
          </div>
          <table className="gov-table">
            <thead><tr><th>Status</th><th style={{ textAlign: 'right' }}>Count</th><th style={{ textAlign: 'right' }}>% of Total</th></tr></thead>
            <tbody>
              {statusData.map((row) => (
                <tr key={row.name}>
                  <td style={{ fontSize: 12 }}>{row.name}</td>
                  <td style={{ fontSize: 12, textAlign: 'right', fontWeight: 600 }}>{row.value}</td>
                  <td style={{ fontSize: 12, textAlign: 'right', color: '#6b7280' }}>
                    {stats ? ((row.value / stats.kpis.total_proposals) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
              <tr style={{ background: '#f8f9fa', fontWeight: 700 }}>
                <td style={{ fontSize: 12 }}>Total</td>
                <td style={{ fontSize: 12, textAlign: 'right' }}>{stats?.kpis.total_proposals}</td>
                <td style={{ fontSize: 12, textAlign: 'right' }}>100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
