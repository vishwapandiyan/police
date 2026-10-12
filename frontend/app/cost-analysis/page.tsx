'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import PageHeader from '@/components/ui/PageHeader';
import GovCard from '@/components/ui/GovCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { proposals } from '@/lib/api';
import type { Proposal } from '@/lib/types';

export default function CostAnalysisPage() {
  const [list, setList] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    proposals.list({ limit: '100' }).then(r => setList(r.proposals.filter(p => p.estimated_cost))).finally(() => setLoading(false));
  }, []);

  const total = list.reduce((s, p) => s + (p.estimated_cost || 0), 0);
  const fmtCr = (v: number) => v >= 10000000 ? `₹${(v / 10000000).toFixed(1)} Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(1)} L` : `₹${v.toLocaleString('en-IN')}`;

  return (
    <AppLayout>
      <div className="gov-page">
        <SyntheticBanner />
        <PageHeader
          title="Cost Analysis"
          subtitle="Financial overview of proposals with cost estimates"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Cost Analysis' }]}
        />
        <div className="kpi-strip" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
          <div className="kpi-card"><div className="kpi-value">{list.length}</div><div className="kpi-label">Proposals with Estimates</div></div>
          <div className="kpi-card kpi-teal"><div className="kpi-value" style={{ fontSize: '1.4rem' }}>{fmtCr(total)}</div><div className="kpi-label">Total Estimated Value</div></div>
          <div className="kpi-card"><div className="kpi-value" style={{ fontSize: '1.4rem' }}>{list.length ? fmtCr(total / list.length) : '—'}</div><div className="kpi-label">Average per Proposal</div></div>
        </div>
        {loading && <LoadingSpinner />}
        <GovCard noPadding>
          <table className="gov-table">
            <thead><tr><th>#</th><th>Proposal No.</th><th>Title</th><th>Category</th><th>Status</th><th style={{ textAlign: 'right' }}>Estimated Cost</th><th>Action</th></tr></thead>
            <tbody>
              {list.sort((a, b) => (b.estimated_cost || 0) - (a.estimated_cost || 0)).map((p, i) => (
                <tr key={p.id}>
                  <td style={{ fontSize: '0.72rem', color: 'var(--gov-muted)' }}>{i + 1}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--gov-blue)' }}>{p.proposal_number}</td>
                  <td style={{ fontSize: '0.8rem' }}>{p.title.slice(0, 55)}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)', textTransform: 'capitalize' }}>{p.category || '—'}</td>
                  <td style={{ fontSize: '0.78rem' }}>{p.status.replace(/_/g, ' ')}</td>
                  <td style={{ textAlign: 'right', fontSize: '0.85rem', fontWeight: 700, color: 'var(--gov-navy)' }}>{fmtCr(p.estimated_cost || 0)}</td>
                  <td><Link href={`/proposals/${p.id}`} className="btn btn-sm btn-secondary" style={{ fontSize: '0.72rem' }}>Cost Analysis</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </GovCard>
      </div>
    </AppLayout>
  );
}
