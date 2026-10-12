'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FilePlus, Search, Filter } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import PageHeader from '@/components/ui/PageHeader';
import { proposals } from '@/lib/api';
import type { Proposal } from '@/lib/types';

const STATUSES = ['', 'DRAFT', 'SUBMITTED_FOR_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RETURNED_FOR_MODIFICATION', 'COMPLETED', 'IMPLEMENTATION'];
const CATEGORIES = ['', 'technology', 'infrastructure', 'procurement', 'training', 'vehicles', 'communication', 'operational', 'administrative', 'welfare'];

function ProposalsContent() {
  const searchParams = useSearchParams();
  const [list, setList] = useState<Proposal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const PER_PAGE = 20;

  const load = async () => {
    setLoading(true); setError('');
    try {
      const params: Record<string, string> = { limit: '100' };
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const data = await proposals.list(params);
      setList(data.proposals);
      setTotal(data.total);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [statusFilter, categoryFilter]);

  const filtered = searchText
    ? list.filter(p =>
        p.title.toLowerCase().includes(searchText.toLowerCase()) ||
        p.proposal_number.toLowerCase().includes(searchText.toLowerCase()) ||
        (p.department || '').toLowerCase().includes(searchText.toLowerCase())
      )
    : list;

  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtCost = (v?: number) => v != null ? `₹${v >= 100000 ? (v / 100000).toFixed(1) + 'L' : v.toLocaleString('en-IN')}` : '—';

  return (
    <AppLayout>
      <div className="gov-page">
        <SyntheticBanner />
        <PageHeader
          title="Proposals"
          subtitle={`${total} proposals in the system`}
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Proposals' }]}
          actions={
            <Link href="/proposals/new" className="btn btn-primary">
              <FilePlus size={14} /> New Proposal
            </Link>
          }
        />

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center', background: 'white', padding: '10px 14px', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 220 }}>
            <Search size={14} color="var(--gov-muted)" />
            <input
              type="search"
              placeholder="Search title, proposal number, department..."
              value={searchText}
              onChange={e => { setSearchText(e.target.value); setPage(0); }}
              className="gov-input"
              style={{ border: 'none', boxShadow: 'none', padding: '4px 6px', background: 'transparent' }}
              aria-label="Search proposals"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={13} color="var(--gov-muted)" />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} className="gov-select" style={{ width: 'auto', padding: '5px 8px' }} aria-label="Filter by status">
              <option value="">All Statuses</option>
              {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(0); }} className="gov-select" style={{ width: 'auto', padding: '5px 8px' }} aria-label="Filter by category">
              <option value="">All Categories</option>
              {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
            </select>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--gov-muted)', marginLeft: 'auto' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading && <LoadingSpinner text="Retrieving proposals..." />}
        {error && <ErrorMessage message={error} onRetry={load} />}

        {!loading && !error && (
          <>
            <div style={{ background: 'white', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
              <table className="gov-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Proposal No.</th>
                    <th>Title / Requirement</th>
                    <th>Department / Unit</th>
                    <th>Location</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Submitted On</th>
                    <th>Status</th>
                    <th>Est. Cost</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ textAlign: 'center', padding: '32px', color: 'var(--gov-muted)' }}>
                        <div style={{ fontSize: '0.9rem', marginBottom: 6 }}>No proposals found.</div>
                        <div style={{ fontSize: '0.78rem' }}>Try changing your filters or <Link href="/proposals/new" style={{ color: 'var(--gov-blue)' }}>create a new proposal</Link>.</div>
                      </td>
                    </tr>
                  )}
                  {paged.map((p, i) => (
                    <tr key={p.id}>
                      <td style={{ color: 'var(--gov-muted)', fontSize: '0.72rem' }}>{page * PER_PAGE + i + 1}</td>
                      <td>
                        <Link href={`/proposals/${p.id}`} style={{ color: 'var(--gov-blue)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600 }}>
                          {p.proposal_number}
                        </Link>
                      </td>
                      <td>
                        <Link href={`/proposals/${p.id}`} style={{ color: 'var(--gov-text)', fontWeight: 500, fontSize: '0.8rem' }}>
                          {p.title.length > 55 ? p.title.slice(0, 55) + '…' : p.title}
                        </Link>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--gov-text-sec)' }}>{p.department || '—'}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--gov-text-sec)' }}>{p.station || p.region || '—'}</td>
                      <td style={{ fontSize: '0.72rem', color: 'var(--gov-text-sec)', textTransform: 'capitalize' }}>{p.category || '—'}</td>
                      <td><StatusBadge status={p.priority} size="xs" /></td>
                      <td style={{ fontSize: '0.72rem', color: 'var(--gov-muted)', whiteSpace: 'nowrap' }}>{fmt(p.submitted_at || p.created_at)}</td>
                      <td><StatusBadge status={p.status} size="xs" /></td>
                      <td style={{ fontSize: '0.78rem', textAlign: 'right', fontWeight: 500 }}>{fmtCost(p.estimated_cost)}</td>
                      <td>
                        <Link href={`/proposals/${p.id}`} className="btn btn-sm btn-secondary" style={{ fontSize: '0.72rem', padding: '3px 10px' }}>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: '0.78rem', color: 'var(--gov-text-sec)' }}>
                <span>Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn btn-sm btn-secondary">Previous</button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} onClick={() => setPage(i)} className={`btn btn-sm ${page === i ? 'btn-primary' : 'btn-secondary'}`}>{i + 1}</button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="btn btn-sm btn-secondary">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

export default function ProposalsPage() {
  return (
    <Suspense fallback={<AppLayout><div className="gov-page"><LoadingSpinner text="Loading proposals..." /></div></AppLayout>}>
      <ProposalsContent />
    </Suspense>
  );
}
