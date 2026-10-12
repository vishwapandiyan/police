'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FilePlus, Filter, Search } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import { proposals } from '@/lib/api';
import type { Proposal } from '@/lib/types';

const STATUSES = ['', 'DRAFT', 'SUBMITTED_FOR_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RETURNED_FOR_MODIFICATION', 'COMPLETED', 'IMPLEMENTATION'];
const CATEGORIES = ['', 'technology', 'infrastructure', 'procurement', 'training', 'vehicles', 'communication', 'operational', 'administrative', 'welfare'];

export default function ProposalsPage() {
  const searchParams = useSearchParams();
  const [list, setList] = useState<Proposal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchText, setSearchText] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { limit: '100' };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const data = await proposals.list(params);
      setList(data.proposals);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter, categoryFilter]);

  const filtered = searchText
    ? list.filter((p) =>
        p.title.toLowerCase().includes(searchText.toLowerCase()) ||
        p.proposal_number.toLowerCase().includes(searchText.toLowerCase()) ||
        (p.department || '').toLowerCase().includes(searchText.toLowerCase())
      )
    : list;

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
  const fmtCost = (v?: number) => v != null ? `₹${(v / 100000).toFixed(1)}L` : '—';

  return (
    <AppLayout>
      <div style={{ padding: '16px 20px' }}>
        <SyntheticBanner />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0' }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1a2744', margin: 0 }}>Proposals</h1>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
              {total} proposals in system
            </p>
          </div>
          <Link
            href="/proposals/new"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              background: '#1a2744', color: 'white', textDecoration: 'none', borderRadius: 3, fontSize: 12, fontWeight: 600,
            }}
          >
            <FilePlus size={14} /> New Proposal
          </Link>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 200 }}>
            <Search size={14} color="#9ca3af" />
            <input
              type="text"
              placeholder="Search title, number, department..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ flex: 1, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 3, fontSize: 12, outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={13} color="#6b7280" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 3, fontSize: 12, outline: 'none' }}
            >
              <option value="">All Statuses</option>
              {STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 3, fontSize: 12, outline: 'none' }}
            >
              <option value="">All Categories</option>
              {CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
            </select>
          </div>
        </div>

        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} onRetry={load} />}

        {!loading && !error && (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 4 }}>
            <table className="gov-table">
              <thead>
                <tr>
                  <th style={{ width: 140 }}>Proposal No.</th>
                  <th>Title</th>
                  <th style={{ width: 90 }}>Category</th>
                  <th style={{ width: 80 }}>Priority</th>
                  <th style={{ width: 110 }}>Status</th>
                  <th style={{ width: 85 }}>Estimated Cost</th>
                  <th style={{ width: 130 }}>Department</th>
                  <th style={{ width: 90 }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>
                      No proposals found
                    </td>
                  </tr>
                )}
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/proposals/${p.id}`} style={{ color: '#1d4ed8', fontFamily: 'monospace', fontSize: 11 }}>
                        {p.proposal_number}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/proposals/${p.id}`} style={{ color: '#1a2744', textDecoration: 'none', fontSize: 12 }}>
                        {p.title.length > 65 ? p.title.slice(0, 65) + '…' : p.title}
                      </Link>
                    </td>
                    <td style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize' }}>{p.category || '—'}</td>
                    <td><StatusBadge status={p.priority} size="xs" /></td>
                    <td><StatusBadge status={p.status} size="xs" /></td>
                    <td style={{ fontSize: 12, textAlign: 'right' }}>{fmtCost(p.estimated_cost)}</td>
                    <td style={{ fontSize: 11, color: '#6b7280' }}>{p.department || '—'}</td>
                    <td style={{ fontSize: 11, color: '#9ca3af' }}>{fmt(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
