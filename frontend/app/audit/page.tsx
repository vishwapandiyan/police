'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import GovCard from '@/components/ui/GovCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import StatusBadge from '@/components/ui/StatusBadge';
import { audit as auditApi } from '@/lib/api';
import type { AuditEvent } from '@/lib/types';

const ACTIONS = ['LOGIN','LOGOUT','PROPOSAL_CREATED','PROPOSAL_UPDATED','DOCUMENT_UPLOADED','AI_ANALYSIS_COMPLETED','PRECEDENT_SEARCHED','POLICY_SEARCHED','GEM_SEARCHED','DECISION_BRIEF_GENERATED','PROPOSAL_SUBMITTED','PROPOSAL_APPROVED','PROPOSAL_REJECTED','PROPOSAL_RETURNED'];

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const params: Record<string, string> = { limit: '200' };
      if (actionFilter) params.action = actionFilter;
      const r = await auditApi.list(params);
      setEvents(r.events); setTotal(r.total);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [actionFilter]);

  const fmt = (d?: string) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <AppLayout>
      <div className="gov-page">
        <PageHeader
          title="Audit Log"
          subtitle={`${total} total events — append-only record`}
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Administration', href: '/administration' }, { label: 'Audit Log' }]}
        />
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="gov-select" style={{ width: 'auto', padding: '6px 10px' }} aria-label="Filter by action">
            <option value="">All Actions</option>
            {ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
          </select>
          <span style={{ fontSize: '0.75rem', color: 'var(--gov-muted)' }}>{events.length} events shown</span>
        </div>
        {loading && <LoadingSpinner text="Loading audit events..." />}
        {error && <ErrorMessage message={error} onRetry={load} />}
        {!loading && !error && (
          <GovCard noPadding>
            <table className="gov-table">
              <thead>
                <tr>
                  <th style={{ width: 160 }}>Timestamp</th>
                  <th>Action</th>
                  <th style={{ width: 160 }}>Officer / Actor</th>
                  <th>Object</th>
                  <th>Detail</th>
                  <th style={{ width: 90 }}>Result</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--gov-muted)' }}>No audit events found</td></tr>
                )}
                {events.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontSize: '0.72rem', color: 'var(--gov-muted)', whiteSpace: 'nowrap' }}>{fmt(e.created_at)}</td>
                    <td style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gov-text)' }}>{e.action.replace(/_/g, ' ')}</td>
                    <td style={{ fontSize: '0.78rem' }}>{e.actor || '—'}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)' }}>
                      {e.object_type && <span style={{ marginRight: 4 }}>{e.object_type}:</span>}
                      {e.object_id && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>{e.object_id.slice(0, 14)}…</span>}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)', maxWidth: 220 }}>{(e.detail || '').slice(0, 60) || '—'}</td>
                    <td><StatusBadge status={e.result} size="xs" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GovCard>
        )}
      </div>
    </AppLayout>
  );
}
