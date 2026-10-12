'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { proposals } from '@/lib/api';
import type { Proposal } from '@/lib/types';

export default function CostAnalysisPage() {
  const [list, setList] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    proposals.list({ limit: '100' }).then((r) => setList(r.proposals.filter((p) => p.estimated_cost))).finally(() => setLoading(false));
  }, []);

  const total = list.reduce((sum, p) => sum + (p.estimated_cost || 0), 0);
  const fmtCr = (v: number) => v >= 10000000 ? `₹${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString('en-IN')}`;

  return (
    <AppLayout>
      <div style={{ padding: '16px 20px' }}>
        <SyntheticBanner />
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1a2744', margin: '14px 0' }}>Cost Analysis</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Total Proposals with Cost', value: list.length.toString() },
            { label: 'Total Estimated Value', value: fmtCr(total) },
            { label: 'Average per Proposal', value: list.length ? fmtCr(total / list.length) : '—' },
          ].map((kpi) => (
            <div key={kpi.label} style={{ padding: '12px 16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 4, borderTop: '3px solid #1a2744' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2744' }}>{kpi.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{kpi.label}</div>
            </div>
          ))}
        </div>
        {loading && <LoadingSpinner />}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 4 }}>
          <table className="gov-table">
            <thead><tr><th>Proposal</th><th>Title</th><th>Category</th><th>Status</th><th style={{ textAlign: 'right' }}>Estimated Cost</th><th>View</th></tr></thead>
            <tbody>
              {list.sort((a, b) => (b.estimated_cost || 0) - (a.estimated_cost || 0)).map((p) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{p.proposal_number}</td>
                  <td style={{ fontSize: 12 }}>{p.title.slice(0, 55)}</td>
                  <td style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize' }}>{p.category || '—'}</td>
                  <td style={{ fontSize: 11 }}>{p.status.replace(/_/g, ' ')}</td>
                  <td style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#1a2744' }}>{fmtCr(p.estimated_cost || 0)}</td>
                  <td><Link href={`/proposals/${p.id}?tab=cost`} style={{ fontSize: 11, color: '#1d4ed8', textDecoration: 'none' }}>Cost Analysis</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
