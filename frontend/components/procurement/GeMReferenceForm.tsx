'use client';
import { useState } from 'react';
import { gem } from '@/lib/api';

interface Props {
  proposalId: string;
  onSaved?: () => void;
}

const REF_TYPES = ['BID', 'ORDER', 'SEARCH'];
const STATUSES  = ['SUBMITTED', 'UNDER_EVALUATION', 'AWARDED', 'COMPLETED', 'CANCELLED'];

export default function GeMReferenceForm({ proposalId, onSaved }: Props) {
  const [form, setForm] = useState({
    reference_type: 'BID',
    reference_number: '',
    date: '',
    status: 'SUBMITTED',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(v => ({ ...v, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reference_number.trim()) { setError('Reference number is required'); return; }
    setSaving(true); setError('');
    try {
      await gem.reference({ ...form, proposal_id: proposalId });
      setSaved(true);
      setForm({ reference_type: 'BID', reference_number: '', date: '', status: 'SUBMITTED', notes: '' });
      onSaved?.();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
    setSaving(false);
  };

  const inp = { className: 'gov-input' as const, style: { marginBottom: 0 } };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label className="form-label">Reference Type</label>
          <select {...inp} value={form.reference_type} onChange={set('reference_type')}>
            {REF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Reference Number <span className="req">*</span></label>
          <input {...inp} value={form.reference_number} onChange={set('reference_number')}
            placeholder="e.g. GEM/2024/B/1234567" />
        </div>
        <div>
          <label className="form-label">Date</label>
          <input type="date" {...inp} value={form.date} onChange={set('date')} />
        </div>
        <div>
          <label className="form-label">Status</label>
          <select {...inp} value={form.status} onChange={set('status')}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '2 / 4' }}>
          <label className="form-label">Notes</label>
          <input {...inp} value={form.notes} onChange={set('notes')}
            placeholder="Optional notes about this reference..." />
        </div>
      </div>

      {error && (
        <div style={{ padding: '6px 10px', background: 'var(--gov-danger-bg)', border: '1px solid #f5c6c2',
          borderRadius: 'var(--r-sm)', fontSize: '0.78rem', color: 'var(--gov-danger)', marginBottom: 10 }}>
          {error}
        </div>
      )}
      {saved && (
        <div style={{ padding: '6px 10px', background: 'var(--gov-success-bg)', border: '1px solid #b7dfc7',
          borderRadius: 'var(--r-sm)', fontSize: '0.78rem', color: 'var(--gov-success)', marginBottom: 10 }}>
          GeM reference saved successfully.
        </div>
      )}

      <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
        {saving ? 'Saving...' : 'Record GeM Reference'}
      </button>
      <p style={{ fontSize: '0.7rem', color: 'var(--gov-muted)', marginTop: 8 }}>
        This records the reference for traceability. PRISM-PY does not transact on GeM. 
        All procurement must be done through the official GeM portal.
      </p>
    </form>
  );
}
