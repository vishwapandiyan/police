'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import { proposals } from '@/lib/api';
import type { Proposal } from '@/lib/types';

export default function OutcomesPage() {
  const [list, setList] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    proposals.list({ status: 'COMPLETED', limit: '100' }).then((r) => setList(r.proposals)).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div style={{ padding: '16px 20px' }}>
        <SyntheticBanner />
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1a2744', margin: '14px 0' }}>Outcomes & Lessons Learned</h1>
        {loading && <LoadingSpinner />}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 4 }}>
          <table className="gov-table">
            <thead><tr><th>Proposal</th><th>Title</th><th>Category</th><th>Department</th><th>Cost (INR)</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7280' }}>{p.proposal_number}</span></td>
                  <td><Link href={`/proposals/${p.id}?tab=outcomes`} style={{ color: '#1a2744', textDecoration: 'none', fontSize: 12 }}>{p.title.slice(0, 60)}</Link></td>
                  <td style={{ fontSize: 11, textTransform: 'capitalize', color: '#6b7280' }}>{p.category || '—'}</td>
                  <td style={{ fontSize: 11, color: '#6b7280' }}>{p.department || '—'}</td>
                  <td style={{ fontSize: 11, textAlign: 'right' }}>{p.estimated_cost ? `₹${(p.estimated_cost / 100000).toFixed(1)}L` : '—'}</td>
                  <td><Link href={`/proposals/${p.id}`} style={{ fontSize: 11, color: '#1d4ed8', textDecoration: 'none' }}>View</Link></td>
                </tr>
              ))}
              {!loading && list.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20, color: '#9ca3af', fontSize: 12 }}>No completed proposals found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
