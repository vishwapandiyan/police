'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import { proposals } from '@/lib/api';
import type { Proposal } from '@/lib/types';

export default function DecisionsPage() {
  const [list, setList] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    proposals.list({ limit: '200' }).then((r) => {
      setList(r.proposals.filter((p) => ['SUBMITTED_FOR_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMITTED'].includes(p.status)));
    }).finally(() => setLoading(false));
  }, []);

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

  return (
    <AppLayout>
      <div style={{ padding: '16px 20px' }}>
        <SyntheticBanner />
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1a2744', margin: '14px 0' }}>Decision Briefs</h1>
        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>Proposals requiring or having decisions</p>
        {loading && <LoadingSpinner />}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 4 }}>
          <table className="gov-table">
            <thead><tr><th>Proposal No.</th><th>Title</th><th>Status</th><th>Priority</th><th>Department</th><th>Submitted</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{p.proposal_number}</span></td>
                  <td><Link href={`/proposals/${p.id}`} style={{ color: '#1a2744', textDecoration: 'none', fontSize: 12 }}>{p.title.slice(0, 55)}</Link></td>
                  <td><StatusBadge status={p.status} size="xs" /></td>
                  <td><StatusBadge status={p.priority} size="xs" /></td>
                  <td style={{ fontSize: 11, color: '#6b7280' }}>{p.department || '—'}</td>
                  <td style={{ fontSize: 11, color: '#9ca3af' }}>{fmt(p.submitted_at)}</td>
                  <td>
                    <Link href={`/proposals/${p.id}`} style={{ fontSize: 11, color: '#1d4ed8', textDecoration: 'none' }}>Review</Link>
                  </td>
                </tr>
              ))}
              {!loading && list.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#9ca3af', fontSize: 12 }}>No proposals pending decision</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
