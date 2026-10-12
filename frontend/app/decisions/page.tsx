'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import GovCard from '@/components/ui/GovCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import { proposals } from '@/lib/api';
import type { Proposal } from '@/lib/types';

export default function DecisionsPage() {
  const [list, setList] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    proposals.list({ limit: '200' }).then(r => {
      setList(r.proposals.filter(p => ['SUBMITTED_FOR_REVIEW','UNDER_REVIEW','APPROVED','REJECTED','RESUBMITTED'].includes(p.status)));
    }).finally(() => setLoading(false));
  }, []);
  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <AppLayout>
      <div className="gov-page">
        <SyntheticBanner />
        <PageHeader
          title="Decision Briefs"
          subtitle="Proposals requiring or having officer decisions"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Decisions' }]}
        />
        {loading && <LoadingSpinner />}
        <GovCard noPadding>
          <table className="gov-table">
            <thead><tr><th>#</th><th>Proposal No.</th><th>Title</th><th>Status</th><th>Priority</th><th>Department</th><th>Submitted</th><th>Action</th></tr></thead>
            <tbody>
              {list.map((p, i) => (
                <tr key={p.id}>
                  <td style={{ fontSize: '0.72rem', color: 'var(--gov-muted)' }}>{i + 1}</td>
                  <td><Link href={`/proposals/${p.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--gov-blue)', fontWeight: 600 }}>{p.proposal_number}</Link></td>
                  <td><Link href={`/proposals/${p.id}`} style={{ color: 'var(--gov-text)', fontWeight: 500, fontSize: '0.8rem' }}>{p.title.slice(0, 55)}</Link></td>
                  <td><StatusBadge status={p.status} size="xs" /></td>
                  <td><StatusBadge status={p.priority} size="xs" /></td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--gov-text-sec)' }}>{p.department || '—'}</td>
                  <td style={{ fontSize: '0.72rem', color: 'var(--gov-muted)', whiteSpace: 'nowrap' }}>{fmt(p.submitted_at)}</td>
                  <td><Link href={`/proposals/${p.id}`} className="btn btn-sm btn-secondary" style={{ fontSize: '0.72rem' }}>Review</Link></td>
                </tr>
              ))}
              {!loading && list.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 20, color: 'var(--gov-muted)', fontSize: '0.82rem' }}>No proposals pending decision.</td></tr>}
            </tbody>
          </table>
        </GovCard>
      </div>
    </AppLayout>
  );
}
