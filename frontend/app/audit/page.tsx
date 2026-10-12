'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import StatusBadge from '@/components/ui/StatusBadge';
import { audit as auditApi } from '@/lib/api';
import type { AuditEvent } from '@/lib/types';

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
      setEvents(r.events);
      setTotal(r.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit log');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [actionFilter]);

  const fmt = (d?: string) => d ? new Date(d).toLocaleString('en-IN') : '—';

  return (
    <AppLayout>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ margin: '0 0 14px' }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1a2744', margin: 0 }}>Audit Log</h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>{total} total events — append-only record</p>
        </div>
        <div style={{ marginBottom: 14, display: 'flex', gap: 10 }}>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 3, fontSize: 12, outline: 'none' }}>
            <option value="">All Actions</option>
            {['LOGIN', 'LOGOUT', 'PROPOSAL_CREATED', 'PROPOSAL_UPDATED', 'DOCUMENT_UPLOADED', 'AI_ANALYSIS_COMPLETED', 'PRECEDENT_SEARCHED', 'POLICY_SEARCHED', 'GEM_SEARCHED', 'DECISION_BRIEF_GENERATED', 'PROPOSAL_SUBMITTED', 'PROPOSAL_APPROVED', 'PROPOSAL_REJECTED', 'PROPOSAL_RETURNED'].map((a) => (
              <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        {loading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} onRetry={load} />}
        {!loading && !error && (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 4 }}>
            <table className="gov-table">
              <thead>
                <tr>
                  <th style={{ width: 180 }}>Timestamp</th>
                  <th style={{ width: 220 }}>Action</th>
                  <th>Actor</th>
                  <th>Object</th>
                  <th>Detail</th>
                  <th style={{ width: 80 }}>Result</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>No audit events found</td></tr>
                )}
                {events.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>{fmt(e.created_at)}</td>
                    <td style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{e.action.replace(/_/g, ' ')}</td>
                    <td style={{ fontSize: 11 }}>{e.actor || '—'}</td>
                    <td style={{ fontSize: 11, color: '#6b7280' }}>
                      {e.object_type && <span style={{ marginRight: 4 }}>{e.object_type}:</span>}
                      {e.object_id && <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{e.object_id.slice(0, 12)}…</span>}
                    </td>
                    <td style={{ fontSize: 11, color: '#6b7280', maxWidth: 200 }}>{(e.detail || '').slice(0, 60) || '—'}</td>
                    <td><StatusBadge status={e.result} size="xs" /></td>
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
