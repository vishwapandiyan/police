'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { RefreshCw, Upload, Play, Check, Send, RotateCcw, X, FileText, ExternalLink } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import { proposals as proposalApi, documents as docApi } from '@/lib/api';
import type {
  Proposal, ProposalDocument, DNARecord, CompletenessCheck,
  Precedent, PolicyResult, CostAnalysis, DecisionAction
} from '@/lib/types';
import { useAuth } from '@/lib/auth';

type Tab = 'overview' | 'documents' | 'dna' | 'completeness' | 'precedents' | 'policies' | 'procurement' | 'gem' | 'cost' | 'overlap' | 'brief' | 'decision' | 'implementation' | 'outcomes' | 'audit';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'documents', label: 'Documents' },
  { id: 'dna', label: 'Proposal DNA' },
  { id: 'completeness', label: 'Completeness' },
  { id: 'precedents', label: 'Precedents' },
  { id: 'policies', label: 'Policy & SOP' },
  { id: 'procurement', label: 'Procurement' },
  { id: 'gem', label: 'GeM' },
  { id: 'cost', label: 'Cost Analysis' },
  { id: 'overlap', label: 'Overlap' },
  { id: 'brief', label: 'Decision Brief' },
  { id: 'decision', label: 'Decision' },
  { id: 'implementation', label: 'Implementation' },
  { id: 'outcomes', label: 'Outcomes' },
  { id: 'audit', label: 'Audit' },
];

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        border: 'none',
        borderBottom: active ? '2px solid #1a2744' : '2px solid transparent',
        background: 'none',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        color: active ? '#1a2744' : '#6b7280',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16, background: 'white', border: '1px solid #e5e7eb', borderRadius: 4 }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #e5e7eb', background: '#f8f9fa' }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: '#1a2744', margin: 0, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{title}</h3>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <tr>
      <td style={{ padding: '5px 10px', fontWeight: 600, fontSize: 12, color: '#6b7280', width: 180, verticalAlign: 'top', whiteSpace: 'nowrap' }}>{label}</td>
      <td style={{ padding: '5px 10px', fontSize: 12, color: value ? '#1a2744' : '#9ca3af' }}>{value ?? '—'}</td>
    </tr>
  );
}

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, hasPermission } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab data state
  const [docs, setDocs] = useState<ProposalDocument[] | null>(null);
  const [dna, setDna] = useState<DNARecord | null>(null);
  const [completeness, setCompleteness] = useState<CompletenessCheck | null>(null);
  const [precedents, setPrecedents] = useState<Precedent[] | null>(null);
  const [policies, setPolicies] = useState<PolicyResult[] | null>(null);
  const [procData, setProcData] = useState<Record<string, unknown> | null>(null);
  const [gemData, setGemData] = useState<Record<string, unknown> | null>(null);
  const [costData, setCostData] = useState<CostAnalysis | null>(null);
  const [overlapData, setOverlapData] = useState<Record<string, unknown> | null>(null);
  const [briefData, setBriefData] = useState<Record<string, unknown> | null>(null);
  const [historyData, setHistoryData] = useState<DecisionAction[] | null>(null);
  const [implData, setImplData] = useState<Record<string, unknown> | null>(null);
  const [outcomeData, setOutcomeData] = useState<Record<string, unknown> | null>(null);
  const [auditData, setAuditData] = useState<unknown[] | null>(null);

  // Decision modal state
  const [decisionModal, setDecisionModal] = useState<'approve' | 'return' | 'reject' | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionLoading, setDecisionLoading] = useState(false);

  // File upload
  const [uploading, setUploading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);

  const loadProposal = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await proposalApi.get(id);
      setProposal(res.proposal);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load proposal');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadProposal(); }, [loadProposal]);

  const loadTab = async (t: Tab) => {
    setTab(t);
    setTabLoading(true);
    try {
      if (t === 'documents' && !docs) {
        const r = await docApi.list(id); setDocs(r.documents);
      } else if (t === 'dna' && !dna) {
        try { const r = await proposalApi.dna(id); setDna(r); } catch { setDna(null); }
      } else if (t === 'completeness' && !completeness) {
        const r = await proposalApi.completeness(id); setCompleteness(r);
      } else if (t === 'precedents' && !precedents) {
        const r = await proposalApi.precedents(id); setPrecedents(r.precedents);
      } else if (t === 'policies' && !policies) {
        const r = await proposalApi.policies(id); setPolicies(r.policies);
      } else if (t === 'procurement' && !procData) {
        const r = await proposalApi.procurement(id); setProcData(r as Record<string, unknown>);
      } else if (t === 'gem' && !gemData) {
        try { const r = await (await import('@/lib/api')).gem.status(id); setGemData(r as Record<string, unknown>); } catch { setGemData({}); }
      } else if (t === 'cost' && !costData) {
        const r = await proposalApi.costAnalysis(id); setCostData(r);
      } else if (t === 'overlap' && !overlapData) {
        const r = await proposalApi.overlap(id); setOverlapData(r as Record<string, unknown>);
      } else if (t === 'brief') {
        try { const r = await proposalApi.decisionBrief(id); setBriefData(r.brief); }
        catch { setBriefData(null); }
      } else if (t === 'decision' && !historyData) {
        const r = await proposalApi.history(id); setHistoryData(r.history);
      } else if (t === 'implementation' && !implData) {
        try { const r = await (await import('@/lib/api')).implementation.get(id); setImplData(r as Record<string, unknown>); } catch { setImplData(null); }
      } else if (t === 'outcomes' && !outcomeData) {
        try { const r = await (await import('@/lib/api')).outcomes.get(id); setOutcomeData(r as Record<string, unknown>); } catch { setOutcomeData(null); }
      } else if (t === 'audit' && !auditData) {
        const r = await proposalApi.audit(id); setAuditData(r.events);
      }
    } catch { /* silent */ }
    setTabLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await docApi.upload(id, file);
      const r = await docApi.list(id);
      setDocs(r.documents);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    setTabLoading(true);
    try {
      await proposalApi.analyze(id);
      const r = await proposalApi.dna(id);
      setDna(r);
      await loadProposal();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Analysis failed');
    }
    setTabLoading(false);
  };

  const handleDecision = async () => {
    if (!decisionModal) return;
    setDecisionLoading(true);
    try {
      if (decisionModal === 'approve') await proposalApi.approve(id, decisionReason);
      else if (decisionModal === 'return') await proposalApi.return(id, decisionReason);
      else if (decisionModal === 'reject') await proposalApi.reject(id, decisionReason);
      setDecisionModal(null);
      setDecisionReason('');
      setHistoryData(null);
      await loadProposal();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed');
    }
    setDecisionLoading(false);
  };

  const handleSubmit = async () => {
    try {
      await proposalApi.submit(id);
      await loadProposal();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Submit failed');
    }
  };

  const generateBrief = async () => {
    setTabLoading(true);
    try {
      const r = await proposalApi.generateBrief(id);
      setBriefData(r.brief);
    } catch { /* silent */ }
    setTabLoading(false);
  };

  const fmtCost = (v?: number | null) => v != null ? `INR ${v.toLocaleString('en-IN')}` : '—';
  const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

  if (loading) return <AppLayout><LoadingSpinner text="Loading proposal..." /></AppLayout>;
  if (error) return <AppLayout><div style={{ padding: 20 }}><ErrorMessage message={error} onRetry={loadProposal} /></div></AppLayout>;
  if (!proposal) return null;

  return (
    <AppLayout>
      <div style={{ padding: '0 0 40px 0' }}>
        <SyntheticBanner />

        {/* Proposal header */}
        <div style={{ padding: '14px 20px', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#6b7280', background: '#f1f5f9', padding: '2px 6px', borderRadius: 2 }}>
                  {proposal.proposal_number}
                </span>
                <StatusBadge status={proposal.status} />
                <StatusBadge status={proposal.priority} size="xs" />
                {proposal.category && (
                  <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize', background: '#f1f5f9', padding: '2px 6px', borderRadius: 2 }}>
                    {proposal.category}
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: 15, fontWeight: 700, color: '#1a2744', margin: 0, lineHeight: 1.3 }}>{proposal.title}</h1>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                {proposal.department && <span>{proposal.department}</span>}
                {proposal.station && <span> · {proposal.station}</span>}
                {proposal.region && <span> · {proposal.region}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              {proposal.status === 'DRAFT' && (
                <button onClick={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 3, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                  <Send size={13} /> Submit for Review
                </button>
              )}
              {['SUBMITTED_FOR_REVIEW', 'UNDER_REVIEW', 'RESUBMITTED'].includes(proposal.status) && hasPermission('proposal:approve') && (
                <>
                  <button onClick={() => setDecisionModal('approve')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 3, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                    <Check size={13} /> Approve
                  </button>
                  <button onClick={() => setDecisionModal('return')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#d97706', color: 'white', border: 'none', borderRadius: 3, fontSize: 12, cursor: 'pointer' }}>
                    <RotateCcw size={13} /> Return
                  </button>
                  <button onClick={() => setDecisionModal('reject')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 3, fontSize: 12, cursor: 'pointer' }}>
                    <X size={13} /> Reject
                  </button>
                </>
              )}
              <button onClick={loadProposal} style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 3, background: 'white', cursor: 'pointer' }}>
                <RefreshCw size={13} color="#6b7280" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', overflowX: 'auto', paddingLeft: 8 }}>
          {TABS.map((t) => (
            <TabButton key={t.id} label={t.label} active={tab === t.id} onClick={() => loadTab(t.id)} />
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: '16px 20px' }}>
          {tabLoading && <LoadingSpinner />}

          {/* Overview */}
          {tab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Section title="Proposal Summary">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <FieldRow label="Title" value={proposal.title} />
                    <FieldRow label="Department" value={proposal.department} />
                    <FieldRow label="Unit" value={proposal.unit} />
                    <FieldRow label="Region" value={proposal.region} />
                    <FieldRow label="Station" value={proposal.station} />
                    <FieldRow label="Category" value={proposal.category} />
                    <FieldRow label="Priority" value={proposal.priority} />
                    <FieldRow label="Status" value={proposal.status.replace(/_/g, ' ')} />
                    <FieldRow label="Created" value={fmt(proposal.created_at)} />
                    <FieldRow label="Submitted" value={fmt(proposal.submitted_at)} />
                    <FieldRow label="Expected Completion" value={fmt(proposal.expected_completion_date)} />
                  </tbody>
                </table>
              </Section>
              <Section title="Requirement & Budget">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <FieldRow label="Purpose" value={proposal.purpose} />
                    <FieldRow label="Problem Statement" value={proposal.problem_statement} />
                    <FieldRow label="Expected Outcome" value={proposal.expected_outcome} />
                    <FieldRow label="Quantity" value={proposal.quantity} />
                    <FieldRow label="Estimated Cost" value={fmtCost(proposal.estimated_cost)} />
                    <FieldRow label="Technology" value={proposal.technology} />
                  </tbody>
                </table>
              </Section>
              {proposal.specification && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <Section title="Technical Specification">
                    <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#374151', margin: 0 }}>
                      {proposal.specification}
                    </pre>
                  </Section>
                </div>
              )}
            </div>
          )}

          {/* Documents */}
          {tab === 'documents' && !tabLoading && (
            <Section title="Supporting Documents">
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#1a2744', color: 'white', borderRadius: 3, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  <Upload size={13} />
                  {uploading ? 'Uploading...' : 'Upload Document'}
                  <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} accept=".pdf,.docx,.xlsx,.pptx,.txt" disabled={uploading} />
                </label>
                <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 10 }}>PDF, DOCX, XLSX, PPTX, TXT — max 25 MB</span>
              </div>
              {(!docs || docs.length === 0) ? (
                <p style={{ color: '#9ca3af', fontSize: 12 }}>No documents uploaded yet.</p>
              ) : (
                <table className="gov-table">
                  <thead><tr><th>Filename</th><th>Type</th><th>Uploaded</th><th>Status</th></tr></thead>
                  <tbody>
                    {docs.map((d) => (
                      <tr key={d.id}>
                        <td style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FileText size={13} color="#6b7280" /> {d.filename}
                        </td>
                        <td style={{ fontSize: 11, color: '#6b7280' }}>{d.document_type}</td>
                        <td style={{ fontSize: 11, color: '#9ca3af' }}>{fmt(d.uploaded_at)}</td>
                        <td><StatusBadge status={d.processing_status} size="xs" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>
          )}

          {/* DNA */}
          {tab === 'dna' && !tabLoading && (
            <div>
              <Section title="Proposal DNA Extraction">
                <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
                  <button onClick={handleAnalyze} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#1a2744', color: 'white', border: 'none', borderRadius: 3, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                    <Play size={12} /> Run DNA Extraction
                  </button>
                </div>
                {!dna ? (
                  <p style={{ color: '#9ca3af', fontSize: 12 }}>No DNA extracted yet. Click Run DNA Extraction above.</p>
                ) : (
                  <>
                    <div style={{ marginBottom: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Completeness Score:</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: dna.completeness_score >= 0.8 ? '#16a34a' : dna.completeness_score >= 0.5 ? '#d97706' : '#dc2626' }}>
                        {Math.round(dna.completeness_score * 100)}%
                      </span>
                      {dna.confirmed_by && (
                        <span style={{ fontSize: 11, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                          Confirmed
                        </span>
                      )}
                    </div>
                    <table className="gov-table">
                      <thead><tr><th>Field</th><th>AI Extracted</th><th>Confirmed</th></tr></thead>
                      <tbody>
                        {Object.entries(dna.ai_extracted || {}).filter(([k]) => !['proposal_id', 'document_id'].includes(k)).map(([key, val]) => (
                          <tr key={key}>
                            <td style={{ fontWeight: 600, fontSize: 12, textTransform: 'capitalize', color: '#374151' }}>{key.replace(/_/g, ' ')}</td>
                            <td style={{ fontSize: 12, color: val ? '#374151' : '#9ca3af' }}>{val != null ? String(val) : '—'}</td>
                            <td style={{ fontSize: 12, color: '#16a34a' }}>
                              {dna.confirmed?.[key] != null ? String(dna.confirmed[key]) : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {dna.missing_fields && dna.missing_fields.length > 0 && (
                      <div style={{ marginTop: 12, padding: 10, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 3 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#c2410c', margin: '0 0 4px' }}>Missing Fields:</p>
                        {dna.missing_fields.map((f) => <span key={f} style={{ display: 'inline-block', margin: '2px 4px', padding: '1px 8px', background: '#fef3c7', color: '#92400e', borderRadius: 2, fontSize: 11 }}>{f}</span>)}
                      </div>
                    )}
                  </>
                )}
              </Section>
            </div>
          )}

          {/* Completeness */}
          {tab === 'completeness' && !tabLoading && completeness && (
            <Section title="Proposal Completeness Check">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '10px 14px', background: '#f8f9fa', borderRadius: 3, border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: completeness.overall_status === 'PASS' ? '#16a34a' : completeness.overall_status === 'WARNING' ? '#d97706' : '#dc2626' }}>
                  {completeness.completeness_percentage}%
                </div>
                <div>
                  <StatusBadge status={completeness.overall_status} />
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>{completeness.summary}</p>
                </div>
              </div>
              <table className="gov-table">
                <thead><tr><th>Field</th><th>Status</th><th>Value</th><th>Why It Matters</th><th>How to Fix</th></tr></thead>
                <tbody>
                  {completeness.checks.map((c) => (
                    <tr key={c.field}>
                      <td style={{ fontSize: 12, fontWeight: 600 }}>{c.label}</td>
                      <td><StatusBadge status={c.status} size="xs" /></td>
                      <td style={{ fontSize: 11, color: c.value ? '#374151' : '#9ca3af' }}>{c.value || '—'}</td>
                      <td style={{ fontSize: 11, color: '#6b7280' }}>{c.why_it_matters}</td>
                      <td style={{ fontSize: 11, color: '#9ca3af' }}>{c.status === 'FAIL' ? c.how_to_fix : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Precedents */}
          {tab === 'precedents' && !tabLoading && (
            <Section title="Historical Precedents">
              {!precedents || precedents.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: 12 }}>No precedents found in demo corpus.</p>
              ) : (
                precedents.map((p) => (
                  <div key={p.id} style={{ marginBottom: 12, padding: 12, border: '1px solid #e5e7eb', borderRadius: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#1a2744' }}>Rank {p.rank}</span>
                          <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>{p.proposal_id}</span>
                          <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', padding: '1px 6px', borderRadius: 2 }}>
                            {p.jurisdiction_label}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: '#374151', margin: '0 0 6px' }}>{p.excerpt}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#1d4ed8' }}>{Math.round(p.match_score * 100)}%</div>
                        <div style={{ fontSize: 10, color: '#9ca3af' }}>match</div>
                      </div>
                    </div>
                    {Object.keys(p.why_match).length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {Object.entries(p.why_match).map(([k, v]) => (
                          <span key={k} style={{ fontSize: 10, padding: '2px 8px', background: v === 'Strong match' ? '#f0fdf4' : '#f8f9fa', color: v === 'Strong match' ? '#15803d' : '#6b7280', border: `1px solid ${v === 'Strong match' ? '#bbf7d0' : '#e5e7eb'}`, borderRadius: 2 }}>
                            <strong>{k}:</strong> {v}
                          </span>
                        ))}
                      </div>
                    )}
                    <p style={{ fontSize: 10, color: '#f59e0b', margin: '6px 0 0', background: '#fffbeb', padding: '2px 6px', borderRadius: 2, display: 'inline-block' }}>
                      SYNTHETIC DEMO DATA
                    </p>
                  </div>
                ))
              )}
            </Section>
          )}

          {/* Policies */}
          {tab === 'policies' && !tabLoading && (
            <Section title="Policy & SOP Intelligence">
              <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 12, padding: '6px 10px', background: '#f8f9fa', borderRadius: 3 }}>
                Potentially relevant policies identified from the demo corpus. Officer review required. Not verified as current official documents.
              </p>
              {!policies || policies.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: 12 }}>No policies found for this proposal.</p>
              ) : (
                policies.map((p, i) => (
                  <div key={i} style={{ marginBottom: 10, padding: 12, border: '1px solid #e5e7eb', borderRadius: 3 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1a2744', marginBottom: 3 }}>{p.title}</div>
                        {p.issuer && <div style={{ fontSize: 11, color: '#6b7280' }}>{p.issuer}</div>}
                        {p.excerpt && <p style={{ fontSize: 12, color: '#374151', margin: '6px 0 0' }}>{p.excerpt.slice(0, 250)}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {p.official && <span style={{ fontSize: 10, background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: 2, fontWeight: 600 }}>OFFICIAL</span>}
                        {p.synthetic && <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 2 }}>SYNTHETIC</span>}
                      </div>
                    </div>
                    {p.validity_warning && (
                      <p style={{ fontSize: 11, color: '#92400e', margin: '6px 0 0' }}>{p.validity_warning}</p>
                    )}
                  </div>
                ))
              )}
            </Section>
          )}

          {/* Procurement */}
          {tab === 'procurement' && !tabLoading && procData && (
            <Section title="Procurement Intelligence">
              {(procData.historical_tenders as unknown[])?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: '0 0 10px' }}>Historical Tenders (Synthetic Demo)</h4>
                  <table className="gov-table">
                    <thead><tr><th>Title</th><th>Type</th><th>Quantity</th><th>Amount (INR)</th><th>Year</th><th>Status</th></tr></thead>
                    <tbody>
                      {(procData.historical_tenders as Record<string, unknown>[]).map((t) => (
                        <tr key={t.tender_id as string}>
                          <td style={{ fontSize: 11 }}>{t.title as string}</td>
                          <td style={{ fontSize: 11, color: '#6b7280' }}>{t.procurement_type as string}</td>
                          <td style={{ fontSize: 11, color: '#6b7280' }}>{t.quantity as string || '—'}</td>
                          <td style={{ fontSize: 11, textAlign: 'right' }}>{t.indicative_amount_inr ? (t.indicative_amount_inr as number).toLocaleString('en-IN') : '—'}</td>
                          <td style={{ fontSize: 11, color: '#6b7280' }}>{t.year as number || '—'}</td>
                          <td style={{ fontSize: 11 }}>{t.decision_status as string}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div style={{ marginTop: 12, padding: 10, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 3, fontSize: 11, color: '#78350f' }}>
                {procData.notice as string}
              </div>
            </Section>
          )}

          {/* GeM */}
          {tab === 'gem' && !tabLoading && (
            <Section title="GeM Intelligence">
              <div style={{ marginBottom: 12, padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 3 }}>
                <p style={{ fontSize: 12, color: '#1e40af', margin: 0 }}>
                  GeM — Government e-Marketplace.
                  <a href="https://gem.gov.in/" target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8', marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    Open Official GeM Portal <ExternalLink size={11} />
                  </a>
                </p>
                <p style={{ fontSize: 11, color: '#3730a3', margin: '4px 0 0' }}>
                  PRISM-PY provides intelligence support only. Final procurement decisions remain with the authorized officer on the official GeM portal.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <a
                  href={`/procurement/gem?proposal=${id}`}
                  style={{ padding: '7px 14px', background: '#1a2744', color: 'white', textDecoration: 'none', borderRadius: 3, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  Open GeM Intelligence Workspace
                </a>
                <a
                  href="https://gem.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: '7px 14px', border: '1px solid #d1d5db', color: '#374151', textDecoration: 'none', borderRadius: 3, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <ExternalLink size={13} /> Official GeM Portal
                </a>
              </div>
              <p style={{ fontSize: 11, color: '#9ca3af' }}>
                All GeM search results shown in PRISM-PY are synthetic demo data. Use the official GeM portal for actual procurement.
              </p>
            </Section>
          )}

          {/* Cost */}
          {tab === 'cost' && !tabLoading && costData && (
            <Section title="Cost Intelligence">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'Proposed', value: costData.proposed_cost, highlight: true },
                  { label: 'Historical Min', value: costData.historical_min },
                  { label: 'Historical Median', value: costData.historical_median },
                  { label: 'Historical Max', value: costData.historical_max },
                ].map((item) => (
                  <div key={item.label} style={{ padding: '12px 14px', background: item.highlight ? '#eff6ff' : '#f8f9fa', border: `1px solid ${item.highlight ? '#bfdbfe' : '#e5e7eb'}`, borderRadius: 3 }}>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: item.highlight ? '#1d4ed8' : '#374151' }}>
                      {item.value != null ? `₹${item.value.toLocaleString('en-IN')}` : '—'}
                    </div>
                  </div>
                ))}
              </div>
              {costData.is_significant_variance && costData.variance_signal && (
                <div style={{ padding: '8px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderLeft: '4px solid #f59e0b', borderRadius: 3, marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: '#c2410c', margin: 0 }}>
                    <strong>Variance Signal:</strong> {costData.variance_signal}
                    {costData.variance_percentage != null && ` (${costData.variance_percentage > 0 ? '+' : ''}${costData.variance_percentage}%)`}
                  </p>
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                {costData.limitations.map((l) => (
                  <p key={l} style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0' }}>• {l}</p>
                ))}
              </div>
              <p style={{ fontSize: 10, color: '#f59e0b', background: '#fffbeb', padding: '3px 8px', borderRadius: 2, display: 'inline-block' }}>SYNTHETIC DEMO DATA</p>
            </Section>
          )}

          {/* Overlap */}
          {tab === 'overlap' && !tabLoading && overlapData && (
            <Section title="Overlap & Duplicate Detection">
              {(overlapData as Record<string, unknown>).overlap_signal && (
                <div style={{ padding: '8px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderLeft: '4px solid #f59e0b', borderRadius: 3, marginBottom: 12 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#c2410c', margin: 0 }}>
                    {((overlapData as Record<string, unknown>).overlap_signal as Record<string, unknown>).message as string}
                  </p>
                  <p style={{ fontSize: 11, color: '#78350f', margin: '3px 0 0' }}>
                    This is a review signal only, not an automatic rejection.
                  </p>
                </div>
              )}
              {((overlapData as Record<string, unknown>).potential_overlaps as unknown[])?.length === 0 && (
                <p style={{ color: '#16a34a', fontSize: 12 }}>No potential overlaps detected in the demo corpus.</p>
              )}
              {((overlapData as Record<string, unknown>).potential_overlaps as Record<string, unknown>[])?.map((o, i) => (
                <div key={i} style={{ marginBottom: 10, padding: 12, border: '1px solid #e5e7eb', borderRadius: 3 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1a2744' }}>{o.proposal_id as string}</div>
                  <div style={{ fontSize: 12, color: '#374151', margin: '4px 0' }}>{o.excerpt as string}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(o.reasons as string[]).map((r) => (
                      <span key={r} style={{ fontSize: 11, background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: 2 }}>{r}</span>
                    ))}
                  </div>
                </div>
              ))}
            </Section>
          )}

          {/* Brief */}
          {tab === 'brief' && !tabLoading && (
            <Section title="Decision Brief">
              <button onClick={generateBrief} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#1a2744', color: 'white', border: 'none', borderRadius: 3, fontSize: 12, cursor: 'pointer', fontWeight: 600, marginBottom: 14 }}>
                <Play size={13} /> Generate Decision Brief
              </button>
              {briefData && (
                <div>
                  {Object.entries((briefData as Record<string, unknown>).sections || {}).map(([key, section]) => (
                    <div key={key} style={{ marginBottom: 12, padding: 12, border: '1px solid #e5e7eb', borderRadius: 3 }}>
                      <h4 style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{key.replace(/^\d+_/, '').replace(/_/g, ' ')}</h4>
                      <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#374151', margin: 0 }}>
                        {JSON.stringify(section, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
              {!briefData && <p style={{ color: '#9ca3af', fontSize: 12 }}>No decision brief generated yet.</p>}
            </Section>
          )}

          {/* Decision history */}
          {tab === 'decision' && !tabLoading && (
            <Section title="Decision History">
              {!historyData || historyData.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: 12 }}>No decisions recorded.</p>
              ) : (
                <div style={{ position: 'relative', paddingLeft: 24 }}>
                  {historyData.map((d, i) => (
                    <div key={d.id} style={{ marginBottom: 14, paddingLeft: 16, borderLeft: '2px solid #e5e7eb', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: -8, top: 0, width: 14, height: 14, borderRadius: '50%', background: d.action === 'APPROVED' ? '#16a34a' : d.action === 'REJECTED' ? '#dc2626' : '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <StatusBadge status={d.action} size="xs" />
                        <span style={{ fontSize: 11, color: '#6b7280' }}>{d.officer_name}</span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>{fmt(d.created_at)}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                        {d.previous_status} → {d.new_status}
                      </div>
                      {(d.comment || d.reason) && (
                        <p style={{ fontSize: 12, color: '#374151', margin: '4px 0 0', padding: '4px 8px', background: '#f8f9fa', borderRadius: 2 }}>
                          {d.comment || d.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Implementation */}
          {tab === 'implementation' && !tabLoading && (
            <Section title="Implementation Tracking">
              {!implData ? (
                <p style={{ color: '#9ca3af', fontSize: 12 }}>No implementation record found. Implementation is created when the proposal is approved and moved to implementation stage.</p>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                    {[
                      { label: 'Status', value: ((implData as Record<string, unknown>).implementation as Record<string, unknown>)?.status as string },
                      { label: 'Planned Start', value: ((implData as Record<string, unknown>).implementation as Record<string, unknown>)?.planned_start as string },
                      { label: 'Planned End', value: ((implData as Record<string, unknown>).implementation as Record<string, unknown>)?.planned_end as string },
                      { label: 'Actual Start', value: ((implData as Record<string, unknown>).implementation as Record<string, unknown>)?.actual_start as string },
                      { label: 'Actual End', value: ((implData as Record<string, unknown>).implementation as Record<string, unknown>)?.actual_end as string },
                      { label: 'Responsible Unit', value: ((implData as Record<string, unknown>).implementation as Record<string, unknown>)?.responsible_unit as string },
                    ].map((item) => (
                      <div key={item.label} style={{ padding: '8px 12px', background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 3 }}>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{item.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 2 }}>{item.value || '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          )}

          {/* Outcomes */}
          {tab === 'outcomes' && !tabLoading && (
            <Section title="Outcomes & Lessons Learned">
              {!outcomeData ? (
                <p style={{ color: '#9ca3af', fontSize: 12 }}>No outcome recorded for this proposal.</p>
              ) : (
                <div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <tbody>
                      {Object.entries((outcomeData as Record<string, unknown>).outcome as Record<string, unknown> || {}).map(([k, v]) => (
                        k !== 'lessons' && v != null && (
                          <tr key={k}>
                            <td style={{ padding: '5px 10px', fontWeight: 600, color: '#6b7280', width: 180 }}>{k.replace(/_/g, ' ')}</td>
                            <td style={{ padding: '5px 10px' }}>{String(v)}</td>
                          </tr>
                        )
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          )}

          {/* Audit */}
          {tab === 'audit' && !tabLoading && (
            <Section title="Audit Trail">
              {!auditData || auditData.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: 12 }}>No audit events.</p>
              ) : (
                <table className="gov-table">
                  <thead><tr><th>Action</th><th>Actor</th><th>Detail</th><th>Result</th><th>Timestamp</th></tr></thead>
                  <tbody>
                    {(auditData as Record<string, unknown>[]).map((e) => (
                      <tr key={e.id as string}>
                        <td style={{ fontSize: 11, fontWeight: 600 }}>{(e.action as string).replace(/_/g, ' ')}</td>
                        <td style={{ fontSize: 11 }}>{e.actor as string || '—'}</td>
                        <td style={{ fontSize: 11, color: '#6b7280' }}>{(e.detail as string)?.slice(0, 60) || '—'}</td>
                        <td><StatusBadge status={e.result as string} size="xs" /></td>
                        <td style={{ fontSize: 11, color: '#9ca3af' }}>{fmt(e.created_at as string)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>
          )}
        </div>
      </div>

      {/* Decision modal */}
      {decisionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: 4, padding: 24, width: 440, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a2744', margin: '0 0 14px' }}>
              {decisionModal === 'approve' ? 'Approve Proposal' : decisionModal === 'return' ? 'Return for Modification' : 'Reject Proposal'}
            </h3>
            <textarea
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              placeholder={decisionModal === 'approve' ? 'Optional comment...' : 'Reason (required)...'}
              required={decisionModal !== 'approve'}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 3, fontSize: 12, minHeight: 80, resize: 'vertical', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
              <button onClick={() => { setDecisionModal(null); setDecisionReason(''); }} style={{ padding: '7px 14px', border: '1px solid #d1d5db', borderRadius: 3, background: 'white', fontSize: 12, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleDecision}
                disabled={decisionLoading || (decisionModal !== 'approve' && !decisionReason.trim())}
                style={{
                  padding: '7px 14px', border: 'none', borderRadius: 3, fontSize: 12, cursor: 'pointer', fontWeight: 600,
                  background: decisionModal === 'approve' ? '#16a34a' : decisionModal === 'return' ? '#d97706' : '#dc2626',
                  color: 'white', opacity: decisionLoading ? 0.7 : 1,
                }}
              >
                {decisionLoading ? 'Processing...' : decisionModal === 'approve' ? 'Confirm Approval' : decisionModal === 'return' ? 'Return' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
