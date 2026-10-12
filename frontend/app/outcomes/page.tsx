'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import GovCard from '@/components/ui/GovCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import { proposals } from '@/lib/api';
import type { Proposal } from '@/lib/types';

export default function OutcomesPage() {
  const [list, setList] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    proposals.list({ status: 'COMPLETED', limit: '100' }).then(r => setList(r.proposals)).finally(() => setLoading(false));
  }, []);
  const fmtCost = (v?: number) => v != null ? `₹${v >= 100000 ? (v / 100000).toFixed(1) + 'L' : v.toLocaleString('en-IN')}` : '—';

  return (
    <AppLayout>
      <div className="gov-page">
        <SyntheticBanner />
        <PageHeader
          title="Outcomes & Lessons Learned"
          subtitle="Completed proposals with outcomes and institutional lessons"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Outcomes' }]}
        />
        {loading && <LoadingSpinner />}
        <GovCard noPadding>
          <table className="gov-table">
            <thead><tr><th>#</th><th>Proposal No.</th><th>Title</th><th>Category</th><th>Department</th><th>Actual Cost</th><th>Action</th></tr></thead>
            <tbody>
              {list.map((p, i) => (
                <tr key={p.id}>
                  <td style={{ fontSize: '0.72rem', color: 'var(--gov-muted)' }}>{i + 1}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--gov-blue)', fontWeight: 600 }}>{p.proposal_number}</td>
                  <td><Link href={`/proposals/${p.id}`} style={{ color: 'var(--gov-text)', fontWeight: 500, fontSize: '0.8rem' }}>{p.title.slice(0, 55)}</Link></td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)', textTransform: 'capitalize' }}>{p.category || '—'}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--gov-text-sec)' }}>{p.department || '—'}</td>
                  <td style={{ fontSize: '0.82rem', textAlign: 'right' }}>{fmtCost(p.estimated_cost)}</td>
                  <td><Link href={`/proposals/${p.id}`} className="btn btn-sm btn-secondary" style={{ fontSize: '0.72rem' }}>View Outcome</Link></td>
                </tr>
              ))}
              {!loading && list.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--gov-muted)', fontSize: '0.82rem' }}>No completed proposals found.</td></tr>}
            </tbody>
          </table>
        </GovCard>
      </div>
    </AppLayout>
  );
}
