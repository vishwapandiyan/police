'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { RefreshCw, Upload, Play, Check, Send, RotateCcw, X, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import GovCard from '@/components/ui/GovCard';
import { proposals as proposalApi, documents as docApi, gem, implementation as implApi, outcomes as outcomeApi } from '@/lib/api';
import type { Proposal, ProposalDocument, DNARecord, CompletenessCheck, Precedent, PolicyResult, CostAnalysis, DecisionAction } from '@/lib/types';
import { useAuth } from '@/lib/auth';

type Tab = 'overview'|'documents'|'dna'|'completeness'|'precedents'|'policies'|'procurement'|'gem'|'cost'|'overlap'|'brief'|'decision'|'implementation'|'outcomes'|'audit';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',       label: 'Overview' },
  { id: 'documents',      label: 'Documents' },
  { id: 'dna',            label: 'Proposal DNA' },
  { id: 'completeness',   label: 'Completeness' },
  { id: 'precedents',     label: 'Precedents' },
  { id: 'policies',       label: 'Policy & SOP' },
  { id: 'procurement',    label: 'Procurement' },
  { id: 'gem',            label: 'GeM' },
  { id: 'cost',           label: 'Cost Analysis' },
  { id: 'overlap',        label: 'Overlap' },
  { id: 'brief',          label: 'Decision Brief' },
  { id: 'decision',       label: 'Decision' },
  { id: 'implementation', label: 'Implementation' },
  { id: 'outcomes',       label: 'Outcomes' },
  { id: 'audit',          label: 'Audit Trail' },
];

function FieldRow({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--gov-border)' }}>
      <td style={{ padding: '6px 10px', fontWeight: 600, fontSize: '0.78rem', color: 'var(--gov-text-sec)', width: 180, verticalAlign: 'top', whiteSpace: 'nowrap' }}>{label}</td>
      <td style={{ padding: '6px 10px', fontSize: '0.82rem', color: value ? 'var(--gov-text)' : 'var(--gov-muted)', fontFamily: mono ? 'var(--font-mono)' : undefined }}>
        {value ?? '—'}
      </td>
    </tr>
  );
}

function InfoPanel({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div style={{ padding: '10px 12px', background: '#F8FAFD', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)' }}>
      <div style={{ fontSize: '0.68rem', color: 'var(--gov-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--gov-navy)', marginTop: 3 }}>{value ?? '—'}</div>
    </div>
  );
}

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, hasPermission } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabLoading, setTabLoading] = useState(false);

  const [docs, setDocs]             = useState<ProposalDocument[] | null>(null);
  const [dna, setDna]               = useState<DNARecord | null>(null);
  const [completeness, setComp]     = useState<CompletenessCheck | null>(null);
  const [precedents, setPrec]       = useState<Precedent[] | null>(null);
  const [policies, setPol]          = useState<PolicyResult[] | null>(null);
  const [procData, setProc]         = useState<Record<string, unknown> | null>(null);
  const [gemData, setGem]           = useState<Record<string, unknown> | null>(null);
  const [costData, setCost]         = useState<CostAnalysis | null>(null);
  const [overlapData, setOverlap]   = useState<Record<string, unknown> | null>(null);
  const [briefData, setBrief]       = useState<Record<string, unknown> | null>(null);
  const [history, setHistory]       = useState<DecisionAction[] | null>(null);
  const [implData, setImpl]         = useState<Record<string, unknown> | null>(null);
  const [outcomeData, setOutcome]   = useState<Record<string, unknown> | null>(null);
  const [auditData, setAudit]       = useState<unknown[] | null>(null);

  const [decisionModal, setDModal]  = useState<'approve'|'return'|'reject'|null>(null);
  const [decisionReason, setDReason]= useState('');
  const [decisionLoading, setDLoading] = useState(false);
  const [uploading, setUploading]   = useState(false);

  const loadProposal = useCallback(async () => {
    setLoading(true); setError('');
    try { const r = await proposalApi.get(id); setProposal(r.proposal); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load proposal'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadProposal(); }, [loadProposal]);

  const loadTab = async (t: Tab) => {
    setTab(t); setTabLoading(true);
    try {
      if (t === 'documents' && !docs) { const r = await docApi.list(id); setDocs(r.documents); }
      if (t === 'dna') { try { const r = await proposalApi.dna(id); setDna(r); } catch { setDna(null); } }
      if (t === 'completeness' && !completeness) { const r = await proposalApi.completeness(id); setComp(r); }
      if (t === 'precedents' && !precedents) { const r = await proposalApi.precedents(id); setPrec(r.precedents); }
      if (t === 'policies' && !policies) { const r = await proposalApi.policies(id); setPol(r.policies); }
      if (t === 'procurement' && !procData) { const r = await proposalApi.procurement(id); setProc(r as Record<string, unknown>); }
      if (t === 'gem' && !gemData) { try { const r = await gem.status(id); setGem(r as Record<string, unknown>); } catch { setGem({}); } }
      if (t === 'cost' && !costData) { const r = await proposalApi.costAnalysis(id); setCost(r); }
      if (t === 'overlap' && !overlapData) { const r = await proposalApi.overlap(id); setOverlap(r as Record<string, unknown>); }
      if (t === 'brief') { try { const r = await proposalApi.decisionBrief(id); setBrief(r.brief); } catch { setBrief(null); } }
      if (t === 'decision' && !history) { const r = await proposalApi.history(id); setHistory(r.history); }
      if (t === 'implementation' && !implData) { try { const r = await implApi.get(id); setImpl(r as Record<string, unknown>); } catch { setImpl(null); } }
      if (t === 'outcomes' && !outcomeData) { try { const r = await outcomeApi.get(id); setOutcome(r as Record<string, unknown>); } catch { setOutcome(null); } }
      if (t === 'audit' && !auditData) { const r = await proposalApi.audit(id); setAudit(r.events); }
    } catch { /* silent */ }
    setTabLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    try { await docApi.upload(id, file); const r = await docApi.list(id); setDocs(r.documents); }
    catch (err) { alert(err instanceof Error ? err.message : 'Upload failed'); }
    setUploading(false); e.target.value = '';
  };

  const handleAnalyze = async () => {
    setTabLoading(true);
    try { await proposalApi.analyze(id); const r = await proposalApi.dna(id); setDna(r); await loadProposal(); }
    catch (e) { alert(e instanceof Error ? e.message : 'Analysis failed'); }
    setTabLoading(false);
  };

  const handleDecision = async () => {
    if (!decisionModal) return; setDLoading(true);
    try {
      if (decisionModal === 'approve') await proposalApi.approve(id, decisionReason);
      else if (decisionModal === 'return') await proposalApi.return(id, decisionReason);
      else if (decisionModal === 'reject') await proposalApi.reject(id, decisionReason);
      setDModal(null); setDReason(''); setHistory(null); await loadProposal();
    } catch (e) { alert(e instanceof Error ? e.message : 'Action failed'); }
    setDLoading(false);
  };

  const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtCost = (v?: number | null) => v != null ? `INR ${v.toLocaleString('en-IN')}` : '—';

  if (loading) return <AppLayout><div className="gov-page"><LoadingSpinner text="Loading proposal..." /></div></AppLayout>;
  if (error)   return <AppLayout><div className="gov-page"><ErrorMessage message={error} onRetry={loadProposal} /></div></AppLayout>;
  if (!proposal) return null;

  const canDecide = ['SUBMITTED_FOR_REVIEW', 'UNDER_REVIEW', 'RESUBMITTED'].includes(proposal.status) && hasPermission('proposal:approve');

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <SyntheticBanner />

        {/* Proposal file header */}
        <div style={{ padding: '12px 20px', background: 'white', borderBottom: '1px solid var(--gov-border)' }}>
          <nav style={{ fontSize: '0.72rem', color: 'var(--gov-muted)', marginBottom: 6 }}>
            <a href="/dashboard" style={{ color: 'var(--gov-blue)' }}>Home</a> › <a href="/proposals" style={{ color: 'var(--gov-blue)' }}>Proposals</a> › {proposal.proposal_number}
          </nav>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--gov-muted)', background: '#F0F3F8', padding: '2px 8px', borderRadius: 'var(--r-sm)', border: '1px solid var(--gov-border)' }}>
                  {proposal.proposal_number}
                </span>
                <StatusBadge status={proposal.status} />
                <StatusBadge status={proposal.priority} size="xs" />
                {proposal.category && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--gov-text-sec)', background: '#F0F3F8', padding: '2px 8px', borderRadius: 'var(--r-sm)', textTransform: 'capitalize' }}>
                    {proposal.category}
                  </span>
                )}
                {proposal.synthetic && (
                  <span className="badge badge-synthetic" style={{ fontSize: '0.62rem' }}>Synthetic Demo</span>
                )}
              </div>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gov-navy)', margin: 0, lineHeight: 1.3 }}>
                {proposal.title}
              </h1>
              <div style={{ fontSize: '0.78rem', color: 'var(--gov-text-sec)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {proposal.department && <span>{proposal.department}</span>}
                {proposal.station && <span>· {proposal.station}</span>}
                {proposal.region && <span>· {proposal.region}</span>}
                {proposal.estimated_cost && <span>· {fmtCost(proposal.estimated_cost)}</span>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              {proposal.status === 'DRAFT' && (
                <button onClick={async () => { await proposalApi.submit(id); await loadProposal(); }} className="btn btn-secondary btn-sm">
                  <Send size={13} /> Submit for Review
                </button>
              )}
              {canDecide && (
                <>
                  <button onClick={() => setDModal('approve')} className="btn btn-success btn-sm"><Check size={12} /> Approve</button>
                  <button onClick={() => setDModal('return')} className="btn btn-warning btn-sm"><RotateCcw size={12} /> Return</button>
                  <button onClick={() => setDModal('reject')} className="btn btn-danger btn-sm"><X size={12} /> Reject</button>
                </>
              )}
              <button onClick={loadProposal} className="btn btn-secondary btn-icon btn-sm" title="Refresh"><RefreshCw size={13} /></button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="gov-tabs" style={{ paddingLeft: 8 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => loadTab(t.id)} className={`gov-tab${tab === t.id ? ' active' : ''}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="gov-page" style={{ flex: 1 }}>
          {tabLoading && <LoadingSpinner />}

          {/* OVERVIEW */}
          {tab === 'overview' && !tabLoading && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <GovCard title="Proposal Details">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <FieldRow label="Proposal Number" value={proposal.proposal_number} mono />
                    <FieldRow label="Title" value={proposal.title} />
                    <FieldRow label="Department" value={proposal.department} />
                    <FieldRow label="Unit" value={proposal.unit} />
                    <FieldRow label="Region" value={proposal.region} />
                    <FieldRow label="Station" value={proposal.station} />
                    <FieldRow label="Category" value={proposal.category} />
                    <FieldRow label="Priority" value={proposal.priority} />
                    <FieldRow label="Status" value={proposal.status?.replace(/_/g, ' ')} />
                  </tbody>
                </table>
              </GovCard>
              <GovCard title="Requirement & Financial">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <FieldRow label="Purpose" value={proposal.purpose} />
                    <FieldRow label="Problem Statement" value={proposal.problem_statement} />
                    <FieldRow label="Expected Outcome" value={proposal.expected_outcome} />
                    <FieldRow label="Quantity" value={proposal.quantity} />
                    <FieldRow label="Estimated Cost" value={fmtCost(proposal.estimated_cost)} />
                    <FieldRow label="Technology" value={proposal.technology} />
                    <FieldRow label="Created" value={fmt(proposal.created_at)} />
                    <FieldRow label="Submitted" value={fmt(proposal.submitted_at)} />
                    <FieldRow label="Expected Completion" value={fmt(proposal.expected_completion_date)} />
                  </tbody>
                </table>
              </GovCard>
              {proposal.specification && (
                <div style={{ gridColumn: '1/-1' }}>
                  <GovCard title="Technical Specification">
                    <pre style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--gov-text)', fontFamily: 'var(--font-body)', margin: 0 }}>
                      {proposal.specification}
                    </pre>
                  </GovCard>
                </div>
              )}
            </div>
          )}

          {/* DOCUMENTS */}
          {tab === 'documents' && !tabLoading && (
            <GovCard title="Supporting Documents">
              <div style={{ marginBottom: 12 }}>
                <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                  <Upload size={13} /> {uploading ? 'Uploading...' : 'Upload Document'}
                  <input type="file" style={{ display: 'none' }} onChange={handleUpload} accept=".pdf,.docx,.xlsx,.pptx,.txt" disabled={uploading} />
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--gov-muted)', marginLeft: 10 }}>PDF, DOCX, XLSX, PPTX, TXT — max 25 MB</span>
              </div>
              {(!docs || docs.length === 0) ? (
                <p style={{ color: 'var(--gov-muted)', fontSize: '0.82rem' }}>No documents uploaded yet.</p>
              ) : (
                <table className="gov-table">
                  <thead><tr><th>Filename</th><th>Type</th><th>Uploaded By</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {docs.map(d => (
                      <tr key={d.id}>
                        <td style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                          <FileText size={13} color="var(--gov-muted)" /> {d.filename}
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)' }}>{d.document_type}</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)' }}>{d.uploaded_by || '—'}</td>
                        <td style={{ fontSize: '0.72rem', color: 'var(--gov-muted)' }}>{fmt(d.uploaded_at)}</td>
                        <td><StatusBadge status={d.processing_status} size="xs" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </GovCard>
          )}

          {/* DNA */}
          {tab === 'dna' && !tabLoading && (
            <GovCard title="Proposal DNA — Structured Extraction">
              <div style={{ marginBottom: 12 }}>
                <button onClick={handleAnalyze} className="btn btn-secondary btn-sm"><Play size={12} /> Run Extraction</button>
                <span style={{ fontSize: '0.75rem', color: 'var(--gov-muted)', marginLeft: 10 }}>Extracts structured data from the proposal content and uploaded documents.</span>
              </div>
              {!dna ? (
                <p style={{ color: 'var(--gov-muted)', fontSize: '0.82rem' }}>No DNA extracted yet. Click Run Extraction above.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12, padding: '10px 12px', background: '#F8FAFD', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gov-muted)', textTransform: 'uppercase' }}>Completeness</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: dna.completeness_score >= 0.8 ? 'var(--gov-success)' : dna.completeness_score >= 0.5 ? '#d97706' : 'var(--gov-danger)' }}>
                        {Math.round(dna.completeness_score * 100)}%
                      </div>
                    </div>
                    {dna.confirmed_by && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'var(--gov-success-bg)', border: '1px solid #b7dfc7', borderRadius: 'var(--r-sm)' }}>
                        <Check size={13} color="var(--gov-success)" />
                        <span style={{ fontSize: '0.78rem', color: 'var(--gov-success)', fontWeight: 600 }}>Confirmed by officer</span>
                      </div>
                    )}
                  </div>
                  <table className="gov-table">
                    <thead><tr><th>Field</th><th>AI Extracted</th><th>Officer Confirmed</th></tr></thead>
                    <tbody>
                      {Object.entries(dna.ai_extracted || {}).filter(([k]) => !['proposal_id', 'document_id'].includes(k)).map(([key, val]) => (
                        <tr key={key}>
                          <td style={{ fontWeight: 600, fontSize: '0.78rem', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</td>
                          <td style={{ fontSize: '0.8rem', color: val ? 'var(--gov-text)' : 'var(--gov-muted)' }}>{val != null ? String(val) : '—'}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--gov-success)' }}>{dna.confirmed?.[key] != null ? String(dna.confirmed[key]) : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {dna.missing_fields && dna.missing_fields.length > 0 && (
                    <div style={{ marginTop: 12, padding: 10, background: 'var(--gov-warning-bg)', border: '1px solid #f0d060', borderRadius: 'var(--r-sm)' }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gov-warning)', marginBottom: 6 }}>Missing Fields:</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {dna.missing_fields.map(f => (
                          <span key={f} style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'var(--gov-warning-bg)', color: 'var(--gov-warning)', border: '1px solid #f0d060', borderRadius: 'var(--r-sm)' }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </GovCard>
          )}

          {/* COMPLETENESS */}
          {tab === 'completeness' && !tabLoading && completeness && (
            <GovCard title="Proposal Completeness Check">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, padding: '12px 14px', background: '#F8FAFD', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-md)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: completeness.overall_status === 'PASS' ? 'var(--gov-success)' : completeness.overall_status === 'WARNING' ? '#d97706' : 'var(--gov-danger)' }}>
                  {completeness.completeness_percentage}%
                </div>
                <div>
                  <StatusBadge status={completeness.overall_status} />
                  <p style={{ fontSize: '0.78rem', color: 'var(--gov-text-sec)', marginTop: 4 }}>{completeness.summary}</p>
                </div>
              </div>
              <table className="gov-table">
                <thead><tr><th>Field</th><th>Status</th><th>Value Found</th><th>Why It Matters</th><th>How to Fix</th></tr></thead>
                <tbody>
                  {completeness.checks.map(c => (
                    <tr key={c.field}>
                      <td style={{ fontWeight: 600, fontSize: '0.8rem' }}>{c.label}</td>
                      <td><StatusBadge status={c.status} size="xs" /></td>
                      <td style={{ fontSize: '0.78rem', color: c.value ? 'var(--gov-text)' : 'var(--gov-muted)' }}>{c.value || '—'}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)' }}>{c.why_it_matters}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--gov-muted)' }}>{c.status === 'FAIL' ? c.how_to_fix : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GovCard>
          )}

          {/* PRECEDENTS */}
          {tab === 'precedents' && !tabLoading && (
            <GovCard title="Historical Precedents">
              <p style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)', marginBottom: 12, padding: '6px 10px', background: '#F0F3F8', borderRadius: 'var(--r-sm)' }}>
                Relevant historical proposals retrieved from the demo corpus based on this proposal's requirements. Each match is explained with specific reasons.
              </p>
              {!precedents || precedents.length === 0 ? (
                <p style={{ color: 'var(--gov-muted)', fontSize: '0.82rem' }}>No precedents found in the demo corpus for this proposal.</p>
              ) : (
                <table className="gov-table">
                  <thead><tr><th>#</th><th>Proposal ID</th><th>Relevance</th><th>Jurisdiction</th><th>Why This Matches</th><th>Excerpt</th></tr></thead>
                  <tbody>
                    {precedents.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontSize: '0.75rem', color: 'var(--gov-muted)' }}>{p.rank}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--gov-blue)' }}>{p.proposal_id}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--gov-navy)' }}>{Math.round(p.match_score * 100)}%</span>
                        </td>
                        <td style={{ fontSize: '0.75rem' }}>
                          <span style={{ background: 'var(--gov-info-bg)', color: 'var(--gov-info)', padding: '1px 6px', borderRadius: 'var(--r-sm)', fontSize: '0.68rem', fontWeight: 600 }}>
                            {p.jurisdiction_label}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {Object.entries(p.why_match).map(([k, v]) => (
                              <span key={k} style={{ fontSize: '0.65rem', padding: '1px 6px', background: v === 'Strong match' ? 'var(--gov-success-bg)' : '#F0F3F8', color: v === 'Strong match' ? 'var(--gov-success)' : 'var(--gov-text-sec)', border: `1px solid ${v === 'Strong match' ? '#b7dfc7' : 'var(--gov-border)'}`, borderRadius: 'var(--r-sm)' }}>
                                <strong>{k}:</strong> {v}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)', maxWidth: 220 }}>{p.excerpt?.slice(0, 120)}…</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p style={{ fontSize: '0.68rem', color: 'var(--gov-muted)', marginTop: 10 }}>SYNTHETIC DEMO DATA — Results are from the demo corpus only.</p>
            </GovCard>
          )}

          {/* POLICIES */}
          {tab === 'policies' && !tabLoading && (
            <GovCard title="Policy & SOP Intelligence">
              <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--gov-info-bg)', border: '1px solid #bcd4f0', borderRadius: 'var(--r-sm)' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--gov-review)' }}>
                  Potentially relevant policies identified. Officer review required. Not verified as current official documents.
                  <a href="https://police.py.gov.in/GovOrders.htm" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, fontWeight: 600 }}>
                    Official Puducherry Police GOs ↗
                  </a>
                </p>
              </div>
              {(!policies || policies.length === 0) ? (
                <p style={{ color: 'var(--gov-muted)', fontSize: '0.82rem' }}>No policies matched for this proposal.</p>
              ) : (
                policies.map((p, i) => (
                  <div key={i} style={{ marginBottom: 10, padding: 12, border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', borderLeft: '3px solid var(--gov-navy)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gov-navy)', marginBottom: 3 }}>{p.title}</div>
                        {p.issuer && <div style={{ fontSize: '0.72rem', color: 'var(--gov-text-sec)', marginBottom: 5 }}>{p.issuer}</div>}
                        {p.excerpt && <p style={{ fontSize: '0.8rem', color: 'var(--gov-text-sec)', lineHeight: 1.5 }}>{p.excerpt.slice(0, 300)}</p>}
                        {p.validity_warning && (
                          <p style={{ fontSize: '0.72rem', color: 'var(--gov-warning)', marginTop: 5, padding: '3px 8px', background: 'var(--gov-warning-bg)', borderRadius: 'var(--r-sm)' }}>
                            {p.validity_warning}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 4, marginLeft: 10, flexShrink: 0 }}>
                        {p.official && <span className="badge badge-approved" style={{ fontSize: '0.62rem' }}>Official</span>}
                        {p.synthetic && <span className="badge badge-synthetic" style={{ fontSize: '0.62rem' }}>Synthetic</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </GovCard>
          )}

          {/* PROCUREMENT */}
          {tab === 'procurement' && !tabLoading && procData && (
            <GovCard title="Historical Procurement Intelligence">
              <p style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)', marginBottom: 12 }}>
                Historical tender and procurement records from the synthetic demo corpus. PRISM-PY does not select or recommend a vendor.
              </p>
              <table className="gov-table">
                <thead><tr><th>Title</th><th>Type</th><th>Quantity</th><th>Amount (INR)</th><th>Year</th><th>Status</th></tr></thead>
                <tbody>
                  {((procData.historical_tenders as Record<string, unknown>[]) || []).length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--gov-muted)', fontSize: '0.8rem' }}>No records found.</td></tr>
                  )}
                  {((procData.historical_tenders as Record<string, unknown>[]) || []).map((t: Record<string, unknown>) => (
                    <tr key={t.tender_id as string}>
                      <td style={{ fontSize: '0.8rem' }}>{t.title as string}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)' }}>{t.procurement_type as string}</td>
                      <td style={{ fontSize: '0.75rem' }}>{t.quantity as string || '—'}</td>
                      <td style={{ fontSize: '0.8rem', textAlign: 'right', fontWeight: 500 }}>{t.indicative_amount_inr ? (t.indicative_amount_inr as number).toLocaleString('en-IN') : '—'}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--gov-muted)' }}>{t.year as number || '—'}</td>
                      <td style={{ fontSize: '0.75rem' }}>{t.decision_status as string}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: '0.7rem', color: 'var(--gov-warning)', marginTop: 10 }}>{procData.notice as string}</p>
            </GovCard>
          )}

          {/* GEM */}
          {tab === 'gem' && !tabLoading && (
            <GovCard title="GeM Intelligence">
              <div style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--gov-info-bg)', border: '1px solid #bcd4f0', borderLeft: '3px solid var(--gov-blue)', borderRadius: '0 var(--r-sm) var(--r-sm) 0' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gov-review)', marginBottom: 4 }}>
                  PRISM-PY provides procurement intelligence only. Final procurement decisions remain with the authorised officer.
                </p>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <a href="https://gem.gov.in/" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">
                    <ExternalLink size={12} /> Open Official GeM Portal
                  </a>
                  <a href={`/procurement/gem?proposal=${id}`} className="btn btn-sm btn-primary">
                    Open GeM Intelligence Workspace
                  </a>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--gov-muted)' }}>
                All search results in GeM Intelligence are synthetic demo data. Use the official GeM portal (gem.gov.in) for actual procurement.
              </p>
            </GovCard>
          )}

          {/* COST */}
          {tab === 'cost' && !tabLoading && costData && (
            <GovCard title="Cost Intelligence">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                <InfoPanel label="Proposed Cost" value={fmtCost(costData.proposed_cost)} />
                <InfoPanel label="Historical Min" value={fmtCost(costData.historical_min)} />
                <InfoPanel label="Historical Median" value={fmtCost(costData.historical_median)} />
                <InfoPanel label="Historical Max" value={fmtCost(costData.historical_max)} />
              </div>
              {costData.is_significant_variance && costData.variance_signal && (
                <div style={{ padding: '8px 12px', background: 'var(--gov-warning-bg)', border: '1px solid #f0d060', borderLeft: '3px solid #C9A227', borderRadius: '0 var(--r-md) var(--r-md) 0', marginBottom: 12 }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--gov-warning)', fontWeight: 600 }}>
                    Price Variance Signal: {costData.variance_signal}
                    {costData.variance_percentage != null && ` (${costData.variance_percentage > 0 ? '+' : ''}${costData.variance_percentage}%)`}
                  </p>
                </div>
              )}
              <div>
                {costData.limitations.map(l => (
                  <p key={l} style={{ fontSize: '0.75rem', color: 'var(--gov-muted)', margin: '2px 0' }}>• {l}</p>
                ))}
              </div>
            </GovCard>
          )}

          {/* OVERLAP */}
          {tab === 'overlap' && !tabLoading && overlapData && (
            <GovCard title="Overlap & Duplicate Detection">
              {(overlapData as Record<string, unknown>).overlap_signal && (
                <div style={{ padding: '10px 12px', background: 'var(--gov-warning-bg)', border: '1px solid #f0d060', borderLeft: '3px solid #C9A227', borderRadius: '0 var(--r-md) var(--r-md) 0', marginBottom: 12 }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gov-warning)' }}>
                    {((overlapData as Record<string, unknown>).overlap_signal as Record<string, unknown>).message as string}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#7a5500', marginTop: 3 }}>This is a review signal only, not an automatic rejection. Officer must assess.</p>
                </div>
              )}
              {((overlapData as Record<string, unknown>).potential_overlaps as unknown[])?.length === 0 && (
                <p style={{ color: 'var(--gov-success)', fontSize: '0.82rem' }}>No potential overlaps detected in the demo corpus.</p>
              )}
              {((overlapData as Record<string, unknown>).potential_overlaps as Record<string, unknown>[])?.map((o, i) => (
                <div key={i} style={{ marginBottom: 10, padding: 12, border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gov-navy)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>{o.proposal_id as string}</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gov-text-sec)', margin: '0 0 6px' }}>{o.excerpt as string}</p>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {(o.reasons as string[]).map(r => (
                      <span key={r} style={{ fontSize: '0.72rem', background: 'var(--gov-warning-bg)', color: 'var(--gov-warning)', padding: '1px 7px', borderRadius: 'var(--r-sm)' }}>{r}</span>
                    ))}
                  </div>
                </div>
              ))}
            </GovCard>
          )}

          {/* DECISION BRIEF */}
          {tab === 'brief' && !tabLoading && (
            <GovCard title="Decision Brief">
              <button onClick={async () => { setTabLoading(true); try { const r = await proposalApi.generateBrief(id); setBrief(r.brief); } catch { } setTabLoading(false); }} className="btn btn-secondary btn-sm" style={{ marginBottom: 14 }}>
                <Play size={12} /> Generate Decision Brief
              </button>
              {!briefData ? (
                <p style={{ color: 'var(--gov-muted)', fontSize: '0.82rem' }}>No decision brief generated yet. Click the button above.</p>
              ) : (
                <div style={{ border: '1px solid var(--gov-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--gov-navy)', color: 'white', padding: '12px 16px' }}>
                    <div style={{ fontSize: '0.7rem', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: 2 }}>Decision Brief</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{proposal.proposal_number} — {proposal.title.slice(0, 60)}</div>
                  </div>
                  <div style={{ padding: 16 }}>
                    {Object.entries((briefData as Record<string, unknown>).sections || {}).map(([key, section]) => (
                      <div key={key} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--gov-border)' }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gov-text-sec)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {key.replace(/^\d+_/, '').replace(/_/g, ' ')}
                        </h4>
                        <pre style={{ fontSize: '0.78rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--gov-text)', fontFamily: 'var(--font-body)', margin: 0 }}>
                          {JSON.stringify(section, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GovCard>
          )}

          {/* DECISION */}
          {tab === 'decision' && !tabLoading && (
            <GovCard title="Decision History">
              {!history || history.length === 0 ? (
                <p style={{ color: 'var(--gov-muted)', fontSize: '0.82rem' }}>No decisions recorded for this proposal.</p>
              ) : (
                <div className="timeline">
                  {history.map(d => (
                    <div key={d.id} className="timeline-item">
                      <div className={`timeline-dot ${d.action === 'APPROVED' ? 'approved' : d.action === 'REJECTED' ? 'rejected' : d.action.includes('RETURN') ? 'returned' : 'default'}`} />
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                        <StatusBadge status={d.action} size="xs" />
                        <span style={{ fontSize: '0.78rem', color: 'var(--gov-text-sec)' }}>{d.officer_name}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--gov-muted)' }}>{fmt(d.created_at)}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gov-muted)', marginBottom: 3 }}>
                        {d.previous_status.replace(/_/g, ' ')} → {d.new_status.replace(/_/g, ' ')}
                      </div>
                      {(d.comment || d.reason) && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--gov-text-sec)', padding: '5px 10px', background: '#F8FAFD', borderRadius: 'var(--r-sm)', border: '1px solid var(--gov-border)' }}>
                          {d.comment || d.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </GovCard>
          )}

          {/* IMPLEMENTATION */}
          {tab === 'implementation' && !tabLoading && (
            <GovCard title="Implementation Tracking">
              {!implData ? (
                <p style={{ color: 'var(--gov-muted)', fontSize: '0.82rem' }}>No implementation record found for this proposal.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    ['Status',           ((implData as Record<string, unknown>).implementation as Record<string, unknown>)?.status],
                    ['Planned Start',    ((implData as Record<string, unknown>).implementation as Record<string, unknown>)?.planned_start],
                    ['Planned End',      ((implData as Record<string, unknown>).implementation as Record<string, unknown>)?.planned_end],
                    ['Actual Start',     ((implData as Record<string, unknown>).implementation as Record<string, unknown>)?.actual_start],
                    ['Actual End',       ((implData as Record<string, unknown>).implementation as Record<string, unknown>)?.actual_end],
                    ['Responsible Unit', ((implData as Record<string, unknown>).implementation as Record<string, unknown>)?.responsible_unit],
                    ['Planned Cost',     ((implData as Record<string, unknown>).implementation as Record<string, unknown>)?.planned_cost ? fmtCost(((implData as Record<string, unknown>).implementation as Record<string, unknown>)?.planned_cost as number) : null],
                    ['Actual Cost',      ((implData as Record<string, unknown>).implementation as Record<string, unknown>)?.actual_cost ? fmtCost(((implData as Record<string, unknown>).implementation as Record<string, unknown>)?.actual_cost as number) : null],
                    ['Observations',     ((implData as Record<string, unknown>).implementation as Record<string, unknown>)?.observations],
                  ].map(([label, value]) => (
                    <InfoPanel key={label as string} label={label as string} value={value as string} />
                  ))}
                </div>
              )}
            </GovCard>
          )}

          {/* OUTCOMES */}
          {tab === 'outcomes' && !tabLoading && (
            <GovCard title="Outcomes & Lessons Learned">
              {!outcomeData ? (
                <p style={{ color: 'var(--gov-muted)', fontSize: '0.82rem' }}>No outcome recorded for this proposal.</p>
              ) : (
                <div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: 16 }}>
                    <tbody>
                      {Object.entries((outcomeData as Record<string, unknown>).outcome as Record<string, unknown> || {}).map(([k, v]) =>
                        k !== 'lessons' && v != null ? (
                          <tr key={k} style={{ borderBottom: '1px solid var(--gov-border)' }}>
                            <td style={{ padding: '6px 10px', fontWeight: 600, color: 'var(--gov-text-sec)', width: 200 }}>{k.replace(/_/g, ' ')}</td>
                            <td style={{ padding: '6px 10px' }}>{String(v)}</td>
                          </tr>
                        ) : null
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </GovCard>
          )}

          {/* AUDIT */}
          {tab === 'audit' && !tabLoading && (
            <GovCard title="Audit Trail — Append-only record" noPadding>
              <table className="gov-table">
                <thead><tr><th>Timestamp</th><th>Action</th><th>By</th><th>Detail</th><th>Result</th></tr></thead>
                <tbody>
                  {(!auditData || auditData.length === 0) && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: 'var(--gov-muted)', fontSize: '0.8rem' }}>No audit events.</td></tr>
                  )}
                  {(auditData as Record<string, unknown>[])?.map(e => (
                    <tr key={e.id as string}>
                      <td style={{ fontSize: '0.72rem', color: 'var(--gov-muted)', whiteSpace: 'nowrap' }}>{fmt(e.created_at as string)}</td>
                      <td style={{ fontSize: '0.78rem', fontWeight: 600 }}>{(e.action as string).replace(/_/g, ' ')}</td>
                      <td style={{ fontSize: '0.78rem' }}>{e.actor as string || '—'}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)' }}>{(e.detail as string)?.slice(0, 60) || '—'}</td>
                      <td><StatusBadge status={e.result as string} size="xs" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GovCard>
          )}
        </div>
      </div>

      {/* Decision modal */}
      {decisionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'white', borderRadius: 'var(--r-lg)', width: 460, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ background: 'var(--gov-navy)', padding: '14px 18px', color: 'white', fontSize: '0.9rem', fontWeight: 700 }}>
              {decisionModal === 'approve' ? 'Approve Proposal' : decisionModal === 'return' ? 'Return for Modification' : 'Reject Proposal'}
            </div>
            <div style={{ padding: 20 }}>
              <label className="form-label">
                {decisionModal === 'approve' ? 'Comment (optional)' : 'Reason'} {decisionModal !== 'approve' && <span className="req">*</span>}
              </label>
              <textarea
                value={decisionReason}
                onChange={e => setDReason(e.target.value)}
                placeholder={decisionModal === 'approve' ? 'Optional comment...' : 'State the reason...'}
                className="gov-textarea"
                style={{ minHeight: 90 }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
                <button onClick={() => { setDModal(null); setDReason(''); }} className="btn btn-secondary">Cancel</button>
                <button
                  onClick={handleDecision}
                  disabled={decisionLoading || (decisionModal !== 'approve' && !decisionReason.trim())}
                  className={`btn ${decisionModal === 'approve' ? 'btn-success' : decisionModal === 'return' ? 'btn-warning' : 'btn-danger'}`}
                >
                  {decisionLoading ? 'Processing...' : decisionModal === 'approve' ? 'Confirm Approval' : decisionModal === 'return' ? 'Return Proposal' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
