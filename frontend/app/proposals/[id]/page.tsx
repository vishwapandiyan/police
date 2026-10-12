'use client';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { RefreshCw, Upload, Play, Check, Send, RotateCcw, X, FileText, ExternalLink, AlertCircle, Sparkles, Brain, Search, ShieldCheck } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import GovCard from '@/components/ui/GovCard';
import GeMReferenceForm from '@/components/procurement/GeMReferenceForm';
import { proposals as proposalApi, documents as docApi, gem, implementation as implApi, outcomes as outcomeApi, procurementWorkflow, rag as ragApi } from '@/lib/api';
import type { Proposal, ProposalDocument, DNARecord, CompletenessCheck, Precedent, PolicyResult, CostAnalysis, DecisionAction, RAGDecisionBriefResult, RAGDnaResult, RAGHealthStatus } from '@/lib/types';
import { useAuth } from '@/lib/auth';

type Tab = 'overview'|'documents'|'dna'|'completeness'|'precedents'|'policies'|'procurement'|'proc-workflow'|'tech-eval'|'fin-eval'|'purchase-order'|'gem'|'cost'|'overlap'|'brief'|'rag-intel'|'decision'|'implementation'|'outcomes'|'audit';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',        label: 'Overview' },
  { id: 'rag-intel',       label: '⚡ RAG Intel (Flask)' },
  { id: 'documents',       label: 'Documents' },
  { id: 'dna',             label: 'Proposal DNA' },
  { id: 'completeness',    label: 'Completeness' },
  { id: 'precedents',      label: 'Precedents' },
  { id: 'policies',        label: 'Policy & SOP' },
  { id: 'procurement',     label: 'Procurement Intel' },
  { id: 'proc-workflow',   label: 'Procurement Workflow' },
  { id: 'tech-eval',       label: 'Technical Evaluation' },
  { id: 'fin-eval',        label: 'Financial Evaluation' },
  { id: 'purchase-order',  label: 'Purchase Order' },
  { id: 'gem',             label: 'GeM' },
  { id: 'cost',            label: 'Cost Analysis' },
  { id: 'overlap',         label: 'Overlap' },
  { id: 'brief',           label: 'Decision Brief' },
  { id: 'decision',        label: 'Decision' },
  { id: 'implementation',  label: 'Implementation' },
  { id: 'outcomes',        label: 'Outcomes' },
  { id: 'audit',           label: 'Audit Trail' },
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

/** Renders a decision brief section object as readable government-style content */
function BriefSection({ data }: { data: unknown }) {
  if (data === null || data === undefined) return <span style={{ color: 'var(--gov-muted)', fontSize: '0.8rem' }}>—</span>;
  if (typeof data === 'string') return <p style={{ fontSize: '0.82rem', color: 'var(--gov-text)', margin: 0, lineHeight: 1.6 }}>{data}</p>;
  if (typeof data === 'number' || typeof data === 'boolean') return <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gov-navy)' }}>{String(data)}</span>;
  if (Array.isArray(data)) {
    if (data.length === 0) return <span style={{ color: 'var(--gov-muted)', fontSize: '0.8rem' }}>None</span>;
    return (
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.8rem', color: 'var(--gov-text)', lineHeight: 1.7 }}>
        {data.map((item, i) => (
          <li key={i}>
            {typeof item === 'object' && item !== null
              ? <BriefObjectRow obj={item as Record<string, unknown>} />
              : String(item)}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof data === 'object') {
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <tbody>
          {Object.entries(data as Record<string, unknown>).map(([k, v]) => (
            <tr key={k} style={{ borderBottom: '1px solid var(--gov-border)' }}>
              <td style={{ padding: '4px 8px', fontWeight: 600, color: 'var(--gov-text-sec)', width: 200, verticalAlign: 'top', textTransform: 'capitalize' }}>
                {k.replace(/_/g, ' ')}
              </td>
              <td style={{ padding: '4px 8px' }}>
                <BriefSection data={v} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  return <span style={{ fontSize: '0.8rem', color: 'var(--gov-text)' }}>{String(data)}</span>;
}

function BriefObjectRow({ obj }: { obj: Record<string, unknown> }) {
  const keys = Object.keys(obj);
  if (keys.length === 0) return null;
  const primary = obj.title || obj.name || obj.proposal_id || obj.id;
  const secondary = obj.excerpt || obj.description || obj.message || obj.status;
  if (primary || secondary) {
    return (
      <span>
        {Boolean(primary) && <strong>{String(primary)}</strong>}
        {Boolean(secondary) && <span style={{ color: 'var(--gov-text-sec)', marginLeft: 6, fontSize: '0.78rem' }}>{String(secondary).slice(0, 120)}</span>}
      </span>
    );
  }
  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--gov-text-sec)' }}>{JSON.stringify(obj).slice(0, 100)}</span>;
}

function ProposalDetailContent() {
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

  // Flask RAG pipeline state
  const [ragHealth, setRagHealth]           = useState<RAGHealthStatus | null>(null);
  const [ragDna, setRagDna]                 = useState<RAGDnaResult | null>(null);
  const [ragBrief, setRagBrief]             = useState<RAGDecisionBriefResult | null>(null);
  const [ragQueryText, setRagQueryText]     = useState('');
  const [ragQueryResult, setRagQueryResult] = useState<import('@/lib/types').RAGQueryResult | null>(null);
  const [ragActionLoading, setRagActionLoading] = useState<string | null>(null);
  const [ragPipelineStatus, setRagPipelineStatus] = useState<Record<string, unknown> | null>(null);
  const [adhocText, setAdhocText]           = useState('');
  const [adhocFileUploading, setAdhocFileUploading] = useState(false);
  const [adhocUploadedDoc, setAdhocUploadedDoc] = useState<{ id: string; name: string } | null>(null);

  // Procurement workflow state
  const [procReqs, setProcReqs]         = useState<Record<string, unknown>[] | null>(null);
  const [procEvents, setProcEvents]     = useState<Record<string, unknown>[] | null>(null);
  const [procEventDetail, setProcEventDetail] = useState<Record<string, unknown> | null>(null);
  const [techEval, setTechEval]         = useState<Record<string, unknown> | null>(null);
  const [finEval, setFinEval]           = useState<Record<string, unknown> | null>(null);
  const [purchaseOrders, setPOs]        = useState<Record<string, unknown>[] | null>(null);
  const [approvalLevel, setApprovalLevel] = useState<Record<string, unknown> | null>(null);

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
      if (t === 'rag-intel') {
        try {
          const h = await ragApi.health();
          setRagHealth(h);
        } catch (err: unknown) {
          setRagHealth({
            rag_pipeline: 'offline',
            flask_url: 'http://localhost:5002',
            message: err instanceof Error ? err.message : 'Flask RAG service offline',
          });
        }
      }
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

      // Procurement workflow tabs
      if (t === 'proc-workflow' || t === 'tech-eval' || t === 'fin-eval' || t === 'purchase-order') {
        // Load approval level
        if (!approvalLevel) {
          try { const r = await procurementWorkflow.getProposalApprovalLevel(id); setApprovalLevel(r); } catch { /* silent */ }
        }
        // Load procurement requirements + events
        if (!procReqs) {
          try { const r = await procurementWorkflow.getRequirement(id); setProcReqs(r.requirements); } catch { setProcReqs([]); }
        }
        if (!procEvents) {
          try { const r = await procurementWorkflow.listEvents(id); setProcEvents(r.events); } catch { setProcEvents([]); }
        }
        // For tech/fin eval and PO tabs, load the first event detail
        if ((t === 'tech-eval' || t === 'fin-eval' || t === 'purchase-order') && !procEventDetail) {
          try {
            const evts = procEvents || (await procurementWorkflow.listEvents(id)).events;
            if (evts && evts.length > 0) {
              const r = await procurementWorkflow.getEvent(evts[0].id as string);
              setProcEventDetail(r.event);
            }
          } catch { /* silent */ }
        }
        if (t === 'tech-eval' && !techEval && procEventDetail) {
          try {
            const r = await procurementWorkflow.getTechEval(procEventDetail.id as string);
            setTechEval(r.evaluation);
          } catch { setTechEval(null); }
        }
        if (t === 'fin-eval' && !finEval && procEventDetail) {
          try {
            const r = await procurementWorkflow.getFinEval(procEventDetail.id as string);
            setFinEval(r.evaluation);
          } catch { setFinEval(null); }
        }
        if (t === 'purchase-order' && !purchaseOrders) {
          try { const r = await procurementWorkflow.listPOs(id); setPOs(r.purchase_orders); } catch { setPOs([]); }
        }
      }
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

          {/* RAG INTELLIGENCE (FLASK PORT 5002 VIA FASTAPI PORT 5001) */}
          {tab === 'rag-intel' && !tabLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Pipeline Status Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                background: (ragHealth?.status === 'online' || ragHealth?.rag_pipeline === 'online') ? 'var(--gov-success-bg)' : 'var(--gov-warning-bg)',
                border: `1px solid ${(ragHealth?.status === 'online' || ragHealth?.rag_pipeline === 'online') ? '#b7dfc7' : '#f0d060'}`,
                borderRadius: 'var(--r-md)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: (ragHealth?.status === 'online' || ragHealth?.rag_pipeline === 'online') ? 'var(--gov-success)' : 'var(--gov-warning)',
                    boxShadow: (ragHealth?.status === 'online' || ragHealth?.rag_pipeline === 'online') ? '0 0 8px var(--gov-success)' : 'none',
                  }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gov-navy)' }}>
                      PRISM-PY RAG Engine: {(ragHealth?.status === 'online' || ragHealth?.rag_pipeline === 'online') ? 'ACTIVE & OPERATIONAL (Unified Port 5001)' : 'STANDBY'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gov-text-sec)' }}>
                      In-Memory FAISS Vector Index + MiniLM / e5-base-v2 Grounded Precedent Intelligence
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={async () => {
                      setRagActionLoading('health');
                      try {
                        const h = await ragApi.health();
                        setRagHealth(h);
                        const s = await ragApi.status();
                        setRagPipelineStatus(s);
                      } catch (e) {
                        setRagHealth({
                          rag_pipeline: 'offline',
                          message: e instanceof Error ? e.message : 'Error checking status',
                        });
                      }
                      setRagActionLoading(null);
                    }}
                    className="btn btn-secondary btn-sm"
                    disabled={ragActionLoading === 'health'}
                  >
                    <RefreshCw size={12} className={ragActionLoading === 'health' ? 'animate-spin' : ''} />
                    Check Engine Health
                  </button>
                </div>
              </div>

              {/* Detailed Component Status Pill Badges */}
              {ragPipelineStatus && Boolean((ragPipelineStatus as Record<string, unknown>).components) && (
                <div style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  padding: '8px 14px',
                  background: '#F8FAFD',
                  border: '1px solid var(--gov-border)',
                  borderRadius: 'var(--r-md)',
                  fontSize: '0.72rem',
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--gov-navy)' }}>RAG Components:</span>
                  <span>Retriever: <strong>{((ragPipelineStatus as Record<string, unknown>).components as Record<string, boolean>).retriever ? '✅ Active' : '⚪ On-Demand'}</strong></span>
                  <span>DNA Extractor: <strong>{((ragPipelineStatus as Record<string, unknown>).components as Record<string, boolean>).dna_extractor ? '✅ Active' : '⚪ Ready'}</strong></span>
                  <span>Brief Generator: <strong>{((ragPipelineStatus as Record<string, unknown>).components as Record<string, boolean>).brief_generator ? '✅ Active' : '⚪ Ready'}</strong></span>
                  <span style={{ marginLeft: 'auto', color: 'var(--gov-text-sec)' }}>
                    Docs Processed: <strong>{String(((ragPipelineStatus as Record<string, unknown>).stats as Record<string, unknown>)?.documents_processed ?? 0)}</strong>
                  </span>
                </div>
              )}

              {/* Action Buttons: DNA & Decision Brief on Current Proposal */}
              <GovCard title="Live Proposal Intelligence Actions">
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
                  <button
                    onClick={async () => {
                      setRagActionLoading('dna');
                      try {
                        const res = await ragApi.analyzeProposal(id);
                        setRagDna(res);
                      } catch (err) {
                        alert(err instanceof Error ? err.message : 'Failed to extract Proposal DNA');
                      }
                      setRagActionLoading(null);
                    }}
                    disabled={ragActionLoading !== null}
                    className="btn btn-primary btn-sm"
                  >
                    <Sparkles size={13} />
                    {ragActionLoading === 'dna' ? 'Extracting DNA...' : 'Run Proposal DNA Extraction'}
                  </button>

                  <button
                    onClick={async () => {
                      setRagActionLoading('brief');
                      try {
                        const res = await ragApi.proposalBrief(id, 5);
                        setRagBrief(res);
                      } catch (err) {
                        alert(err instanceof Error ? err.message : 'Failed to generate Brief');
                      }
                      setRagActionLoading(null);
                    }}
                    disabled={ragActionLoading !== null}
                    className="btn btn-secondary btn-sm"
                  >
                    <Brain size={13} />
                    {ragActionLoading === 'brief' ? 'Generating Brief...' : 'Generate Decision Intelligence Brief'}
                  </button>

                  <span style={{ fontSize: '0.72rem', color: 'var(--gov-muted)' }}>
                    Runs full RAG pipeline directly on this proposal's saved records and uploaded documents.
                  </span>
                </div>

                {/* Grounded Natural Language Query for this proposal */}
                <div style={{ marginTop: 12, paddingTop: 14, borderTop: '1px solid var(--gov-border)' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gov-navy)', marginBottom: 6 }}>
                    Ask Flask RAG Intelligence about this proposal & related historical precedents
                  </label>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!ragQueryText.trim()) return;
                      setRagActionLoading('query');
                      try {
                        const fullQ = `Regarding Proposal ${proposal.proposal_number} (${proposal.title}): ${ragQueryText.trim()}`;
                        const res = await ragApi.query(fullQ, 'document_grounded', 5);
                        setRagQueryResult(res);
                      } catch (err) {
                        alert(err instanceof Error ? err.message : 'Flask Query failed');
                      }
                      setRagActionLoading(null);
                    }}
                    style={{ display: 'flex', gap: 10 }}
                  >
                    <input
                      type="text"
                      className="gov-input"
                      placeholder={`e.g. Are there similar approved CCTV budgets or deferred tenders?`}
                      value={ragQueryText}
                      onChange={(e) => setRagQueryText(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="submit"
                      disabled={!ragQueryText.trim() || ragActionLoading !== null}
                      className="btn btn-primary btn-sm"
                    >
                      <Search size={13} />
                      {ragActionLoading === 'query' ? 'Retrieving...' : 'Ask RAG'}
                    </button>
                  </form>
                </div>
              </GovCard>

              {/* Ad-hoc Raw Document / Proposal Text Workbench (Direct Flask Pipeline 1) */}
              <GovCard title="Flask RAG Direct Workbench — Upload Document or Input Custom Proposal Text">
                <p style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)', margin: '0 0 12px' }}>
                  Test Flask RAG endpoints directly with raw proposal files (PDF, DOCX, TXT) or pasted text.
                  Extracts structured Proposal DNA and generates grounded decision intelligence.
                </p>

                {/* File Upload to Flask */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                    <Upload size={12} /> {adhocFileUploading ? 'Uploading to Flask...' : 'Upload Document to Flask'}
                    <input
                      type="file"
                      style={{ display: 'none' }}
                      accept=".pdf,.docx,.txt"
                      disabled={adhocFileUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setAdhocFileUploading(true);
                        try {
                          const res = await ragApi.upload(file) as { success: boolean; document_id: string; filename: string };
                          if (res.success) {
                            setAdhocUploadedDoc({ id: res.document_id, name: res.filename });
                          }
                        } catch (err) {
                          alert(err instanceof Error ? err.message : 'Upload to Flask failed');
                        }
                        setAdhocFileUploading(false);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {adhocUploadedDoc && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--gov-success)', background: 'var(--gov-success-bg)', padding: '3px 8px', borderRadius: 'var(--r-sm)', border: '1px solid #b7dfc7' }}>
                      Uploaded: <strong>{adhocUploadedDoc.name}</strong> (ID: {adhocUploadedDoc.id.slice(0, 8)}…)
                    </span>
                  )}
                  <span style={{ fontSize: '0.72rem', color: 'var(--gov-muted)' }}>
                    Processes text via TextExtractor into Flask memory store.
                  </span>
                </div>

                {/* Raw Text Input */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--gov-navy)', marginBottom: 4 }}>
                    Or Type / Paste Custom Proposal Text:
                  </label>
                  <textarea
                    className="gov-input"
                    rows={4}
                    placeholder="e.g. PROPOSAL FOR: CCTV Camera Expansion in Sector 4&#10;BUDGET: INR 45,00,000&#10;OBJECTIVE: Deploy 50 HD dome cameras with 30 days cloud backup&#10;TIMELINE: 4 months&#10;LOCATION: Gorimedu Police Station"
                    value={adhocText}
                    onChange={(e) => setAdhocText(e.target.value)}
                    style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={async () => {
                      const docPayload = adhocUploadedDoc ? adhocUploadedDoc.id : adhocText.trim();
                      if (!docPayload) {
                        alert('Please either upload a document or enter text above.');
                        return;
                      }
                      setRagActionLoading('adhoc_dna');
                      try {
                        const res = await ragApi.analyze(docPayload, adhocUploadedDoc ? adhocUploadedDoc.id : undefined);
                        setRagDna(res);
                      } catch (err) {
                        alert(err instanceof Error ? err.message : 'Ad-hoc DNA extraction failed');
                      }
                      setRagActionLoading(null);
                    }}
                    disabled={ragActionLoading !== null || (!adhocUploadedDoc && !adhocText.trim())}
                    className="btn btn-primary btn-sm"
                  >
                    <Sparkles size={12} />
                    {ragActionLoading === 'adhoc_dna' ? 'Analyzing in Flask...' : 'Extract DNA from Custom Input'}
                  </button>

                  <button
                    onClick={async () => {
                      const docPayload = adhocUploadedDoc ? adhocUploadedDoc.id : adhocText.trim();
                      if (!docPayload) {
                        alert('Please either upload a document or enter text above.');
                        return;
                      }
                      setRagActionLoading('adhoc_brief');
                      try {
                        const res = await ragApi.brief(docPayload, adhocUploadedDoc ? adhocUploadedDoc.id : undefined, 5);
                        setRagBrief(res);
                      } catch (err) {
                        alert(err instanceof Error ? err.message : 'Ad-hoc Decision Brief failed');
                      }
                      setRagActionLoading(null);
                    }}
                    disabled={ragActionLoading !== null || (!adhocUploadedDoc && !adhocText.trim())}
                    className="btn btn-secondary btn-sm"
                  >
                    <Brain size={12} />
                    {ragActionLoading === 'adhoc_brief' ? 'Generating Brief in Flask...' : 'Generate Decision Brief from Custom Input'}
                  </button>
                </div>
              </GovCard>


              {/* Grounded Query Answer Box */}
              {ragQueryResult && (
                <GovCard title="Flask Grounded Retrieval Answer">
                  <div style={{
                    padding: '12px 16px',
                    background: '#F8FAFC',
                    border: '1px solid var(--gov-border)',
                    borderRadius: 'var(--r-md)',
                    marginBottom: 14,
                  }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gov-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                      Query
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gov-navy)', marginBottom: 10 }}>
                      {ragQueryResult.question}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--gov-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                      Grounded Answer
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--gov-text)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {ragQueryResult.answer}
                    </div>
                  </div>

                  {/* Sources Table */}
                  {ragQueryResult.sources && ragQueryResult.sources.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 8 }}>
                        Evidence Chunks Retrieved ({ragQueryResult.sources.length})
                      </div>
                      <table className="gov-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Proposal ID / Source</th>
                            <th>Score</th>
                            <th>Excerpt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ragQueryResult.sources.map((s, idx) => (
                            <tr key={idx}>
                              <td style={{ fontSize: '0.72rem', color: 'var(--gov-muted)' }}>{s.rank || idx + 1}</td>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--gov-blue)', fontWeight: 600 }}>
                                {s.proposal_id || s.document_id || s.source_filename || 'Synthetic'}
                              </td>
                              <td style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gov-navy)' }}>
                                {Math.round((s.score || 0) * 10) / 10}
                              </td>
                              <td style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)', maxWidth: 380 }}>
                                {s.text?.slice(0, 160)}{s.text && s.text.length > 160 ? '…' : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </GovCard>
              )}

              {/* RAG DNA Result Display */}
              {ragDna && (
                <GovCard title="Flask Extracted Proposal DNA">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                    <InfoPanel label="Extraction Source" value="Flask main_complete.py :5002" />
                    <InfoPanel
                      label="Completeness"
                      value={ragDna.completeness_score != null ? `${Math.round(ragDna.completeness_score * 100)}%` : 'Analyzed'}
                    />
                    <InfoPanel
                      label="Missing Fields"
                      value={ragDna.missing_fields ? `${ragDna.missing_fields.length} detected` : '0'}
                    />
                  </div>
                  <div style={{
                    padding: '12px 14px',
                    background: '#F8FAFC',
                    border: '1px solid var(--gov-border)',
                    borderRadius: 'var(--r-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.74rem',
                    overflowX: 'auto',
                    maxHeight: 280,
                  }}>
                    <pre style={{ margin: 0 }}>
                      {JSON.stringify(ragDna.dna || ragDna.extracted_fields || ragDna, null, 2)}
                    </pre>
                  </div>
                </GovCard>
              )}

              {/* RAG Decision Brief Result Display */}
              {ragBrief && (
                <GovCard title="Flask Generated Decision Intelligence Brief">
                  <div style={{ border: '1px solid var(--gov-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--gov-navy)', color: 'white', padding: '12px 16px', borderBottom: '2px solid var(--gov-gold)' }}>
                      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)' }}>
                        Flask Decision Brief Engine
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>
                        {proposal.proposal_number} — {proposal.title}
                      </div>
                      {ragBrief.brief?.proposal_summary && (
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
                          {ragBrief.brief.proposal_summary}
                        </p>
                      )}
                    </div>

                    <div style={{ padding: 16 }}>
                      {/* Top Precedents from Flask */}
                      {ragBrief.brief?.top_precedents && ragBrief.brief.top_precedents.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gov-navy)', marginBottom: 8 }}>
                            Retrieved Precedents ({ragBrief.brief.top_precedents.length})
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {ragBrief.brief.top_precedents.map((tp, idx) => (
                              <div key={idx} style={{ padding: '8px 12px', background: '#F8FAFC', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                  <span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--gov-navy)', fontFamily: 'var(--font-mono)' }}>
                                    {tp.title || tp.document_title || tp.document_id}
                                  </span>
                                  {tp.similarity_score != null && (
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gov-blue)' }}>
                                      Match: {Math.round(tp.similarity_score * 100)}%
                                    </span>
                                  )}
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)', margin: 0 }}>
                                  {tp.excerpt?.slice(0, 200)}{tp.excerpt && tp.excerpt.length > 200 ? '…' : ''}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Review Signals from Flask */}
                      {ragBrief.brief?.review_signals && ragBrief.brief.review_signals.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gov-navy)', marginBottom: 8 }}>
                            Review Signals ({ragBrief.brief.review_signals.length})
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {ragBrief.brief.review_signals.map((sig, idx) => (
                              <div key={idx} style={{
                                padding: '8px 12px',
                                background: sig.severity === 'high' ? 'var(--gov-danger-bg)' : 'var(--gov-warning-bg)',
                                border: `1px solid ${sig.severity === 'high' ? '#f5c6cb' : '#ffeeba'}`,
                                borderRadius: 'var(--r-sm)',
                              }}>
                                <div style={{ fontWeight: 600, fontSize: '0.76rem', color: sig.severity === 'high' ? 'var(--gov-danger)' : 'var(--gov-warning)' }}>
                                  {sig.title || sig.signal_type || 'Review Signal'}
                                </div>
                                <p style={{ fontSize: '0.74rem', color: 'var(--gov-text)', margin: '2px 0 0' }}>
                                  {sig.description}
                                </p>
                                {sig.recommendation && (
                                  <p style={{ fontSize: '0.7rem', color: 'var(--gov-text-sec)', marginTop: 4 }}>
                                    <strong>Recommendation:</strong> {sig.recommendation}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Executive summary fallback */}
                      {ragBrief.executive_summary && (
                        <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 'var(--r-sm)', fontSize: '0.78rem', color: 'var(--gov-text)', whiteSpace: 'pre-wrap' }}>
                          {ragBrief.executive_summary}
                        </div>
                      )}
                    </div>
                  </div>
                </GovCard>
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
              <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={handleAnalyze} className="btn btn-secondary btn-sm"><Play size={12} /> Run Standard Extraction</button>
                <button
                  onClick={async () => {
                    setTabLoading(true);
                    try {
                      const res = await ragApi.analyzeProposal(id);
                      setRagDna(res);
                      setTab('rag-intel');
                    } catch (e) {
                      alert(e instanceof Error ? e.message : 'Flask RAG DNA extraction failed');
                    }
                    setTabLoading(false);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <Sparkles size={12} /> Run Extraction (Flask RAG)
                </button>
                {dna && !dna.confirmed_by && (
                  <button
                    onClick={async () => {
                      setTabLoading(true);
                      try {
                        await proposalApi.confirmDna(id, dna.ai_extracted as Record<string, unknown>);
                        const r = await proposalApi.dna(id);
                        setDna(r);
                      } catch (e) { alert(e instanceof Error ? e.message : 'Confirm failed'); }
                      setTabLoading(false);
                    }}
                    className="btn btn-success btn-sm"
                  >
                    <Check size={12} /> Confirm DNA as Correct
                  </button>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--gov-muted)' }}>
                  Extracts structured data from proposal content and uploaded documents using either standard engine or Flask RAG pipeline.
                </span>
              </div>
              {!dna ? (
                <p style={{ color: 'var(--gov-muted)', fontSize: '0.82rem' }}>No DNA extracted yet. Click Run Extraction above.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12, padding: '10px 12px', background: '#F8FAFD', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gov-muted)', textTransform: 'uppercase' }}>Completeness</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: dna.completeness_score >= 0.8 ? 'var(--gov-success)' : dna.completeness_score >= 0.5 ? '#d97706' : 'var(--gov-danger)' }}>
                        {Math.round(dna.completeness_score * 100)}%
                      </div>
                    </div>
                    {dna.confirmed_by ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'var(--gov-success-bg)', border: '1px solid #b7dfc7', borderRadius: 'var(--r-sm)' }}>
                        <Check size={13} color="var(--gov-success)" />
                        <div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--gov-success)', fontWeight: 600 }}>Confirmed by officer</div>
                          {dna.confirmed_at && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--gov-muted)' }}>
                              {new Date(dna.confirmed_at).toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'var(--gov-warning-bg)', border: '1px solid #f0d060', borderRadius: 'var(--r-sm)' }}>
                        <AlertCircle size={13} color="var(--gov-warning)" />
                        <span style={{ fontSize: '0.78rem', color: 'var(--gov-warning)', fontWeight: 600 }}>Awaiting officer confirmation</span>
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
                          <td style={{ fontSize: '0.8rem', color: 'var(--gov-success)' }}>
                            {dna.confirmed?.[key] != null ? String(dna.confirmed[key]) : (
                              <span style={{ color: 'var(--gov-muted)' }}>—</span>
                            )}
                          </td>
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
              {/* Provenance notice */}
              <div style={{
                marginBottom: 14, padding: '8px 12px',
                background: 'var(--gov-warning-bg)', border: '1px solid #f0d060',
                borderLeft: '3px solid #C9A227', borderRadius: '0 var(--r-sm) var(--r-sm) 0',
              }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gov-warning)', margin: '0 0 3px' }}>
                  Historical reference only — not current market prices
                </p>
                <p style={{ fontSize: '0.75rem', color: '#7a5500', margin: 0 }}>
                  Records below are from a fixed synthetic corpus dated to the year shown.
                  Verify current pricing independently before procurement.
                  Do not treat historical bidder names as current suppliers or recommended vendors.
                </p>
              </div>
              <table className="gov-table">
                <thead><tr><th>Title</th><th>Type</th><th>Quantity</th><th style={{ textAlign: 'right' }}>Indicative Amount (INR)</th><th>Year</th><th>Status</th><th>Staleness</th></tr></thead>
                <tbody>
                  {((procData.historical_tenders as Record<string, unknown>[]) || []).length === 0 && (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20, color: 'var(--gov-muted)', fontSize: '0.8rem' }}>No records found.</td></tr>
                  )}
                  {((procData.historical_tenders as Record<string, unknown>[]) || []).map((t: Record<string, unknown>) => (
                    <tr key={t.tender_id as string}>
                      <td style={{ fontSize: '0.8rem' }}>{t.title as string}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)' }}>{t.procurement_type as string}</td>
                      <td style={{ fontSize: '0.75rem' }}>{t.quantity as string || '—'}</td>
                      <td style={{ fontSize: '0.8rem', textAlign: 'right', fontWeight: 500 }}>
                        {t.indicative_amount_inr ? (t.indicative_amount_inr as number).toLocaleString('en-IN') : '—'}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--gov-muted)', fontWeight: 600 }}>{t.year as number || '—'}</td>
                      <td style={{ fontSize: '0.75rem' }}>{t.decision_status as string}</td>
                      <td>
                        <span style={{
                          fontSize: '0.65rem', padding: '1px 6px', borderRadius: 'var(--r-sm)',
                          background: 'var(--gov-warning-bg)', color: 'var(--gov-warning)',
                          border: '1px solid #f0d060', fontWeight: 600,
                        }}>
                          Historical
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: '0.7rem', color: 'var(--gov-warning)', marginTop: 10 }}>{procData.notice as string}</p>
            </GovCard>
          )}

          {/* GEM */}
          {tab === 'gem' && !tabLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <GovCard title="GeM Intelligence">
                <div style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--gov-info-bg)', border: '1px solid #bcd4f0', borderLeft: '3px solid var(--gov-blue)', borderRadius: '0 var(--r-sm) var(--r-sm) 0' }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gov-review)', marginBottom: 4 }}>
                    PRISM-PY provides procurement intelligence only. Final procurement decisions remain with the authorised officer.
                  </p>
                  <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                    <a href="https://gem.gov.in/" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">
                      <ExternalLink size={12} /> Open Official GeM Portal
                    </a>
                    <a href={`/procurement/gem?proposal=${id}`} className="btn btn-sm btn-primary">
                      Open GeM Intelligence Workspace
                    </a>
                  </div>
                </div>
              </GovCard>

              {/* GeM References recorded */}
              <GovCard title="Recorded GeM References">
                {(gemData as Record<string, unknown[]>)?.references?.length === 0 && (
                  <p style={{ color: 'var(--gov-muted)', fontSize: '0.82rem', marginBottom: 12 }}>No GeM references recorded yet.</p>
                )}
                {((gemData as Record<string, unknown>)?.references as Record<string, unknown>[])?.map((r, i) => (
                  <div key={i} style={{ marginBottom: 8, padding: '8px 12px', background: '#F8FAFD', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', background: 'var(--gov-info-bg)', color: 'var(--gov-info)', padding: '1px 6px', borderRadius: 'var(--r-sm)', fontWeight: 600 }}>{r.reference_type as string}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--gov-navy)' }}>{r.reference_number as string || '—'}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)' }}>{r.status as string || '—'}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--gov-muted)', marginLeft: 'auto' }}>{r.date as string}</span>
                  </div>
                ))}
              </GovCard>

              {/* Record new GeM Reference */}
              <GovCard title="Record GeM Reference">
                <p style={{ fontSize: '0.78rem', color: 'var(--gov-text-sec)', marginBottom: 12 }}>
                  After transacting on the official GeM portal, record the reference number here for traceability.
                </p>
                <GeMReferenceForm proposalId={id} onSaved={async () => {
                  const r = await gem.status(id);
                  setGem(r as Record<string, unknown>);
                }} />
              </GovCard>
            </div>
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
              {Boolean((overlapData as Record<string, unknown>).overlap_signal) && (
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
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                <button onClick={async () => { setTabLoading(true); try { const r = await proposalApi.generateBrief(id); setBrief(r.brief); } catch { } setTabLoading(false); }} className="btn btn-secondary btn-sm">
                  <Play size={12} /> Generate Decision Brief (Standard)
                </button>
                <button
                  onClick={async () => {
                    setTabLoading(true);
                    try {
                      const res = await ragApi.proposalBrief(id, 5);
                      setRagBrief(res);
                      setTab('rag-intel');
                    } catch (e) {
                      alert(e instanceof Error ? e.message : 'Flask RAG Decision Brief failed');
                    }
                    setTabLoading(false);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <Brain size={12} /> Generate Brief (Flask RAG)
                </button>
              </div>
              {!briefData ? (
                <p style={{ color: 'var(--gov-muted)', fontSize: '0.82rem' }}>No decision brief generated yet. Click the button above.</p>
              ) : (
                <div style={{ border: '1px solid var(--gov-border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                  {/* Brief header */}
                  <div style={{ background: 'var(--gov-navy)', color: 'white', padding: '14px 18px', borderBottom: '2px solid var(--gov-gold)' }}>
                    <div style={{ fontSize: '0.68rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: 2 }}>Decision Brief — Confidential</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{proposal.proposal_number} — {proposal.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                      Generated: {briefData.generated_at ? new Date(briefData.generated_at as string).toLocaleString('en-IN') : '—'} &nbsp;·&nbsp; By: {briefData.generated_by as string || '—'}
                    </div>
                  </div>

                  {/* Brief sections — rendered as readable government-style content */}
                  <div style={{ padding: 18 }}>
                    {Object.entries((briefData as Record<string, unknown>).sections || {}).map(([key, section]) => {
                      const sectionTitle = key.replace(/^\d+_/, '').replace(/_/g, ' ').toUpperCase();
                      return (
                        <div key={key} style={{ marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid var(--gov-border)' }}>
                          <h4 style={{
                            fontSize: '0.72rem', fontWeight: 700, color: 'var(--gov-navy)',
                            margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.07em',
                            paddingBottom: 6, borderBottom: '1px solid var(--gov-bg-alt)',
                          }}>
                            {sectionTitle}
                          </h4>
                          <BriefSection data={section} />
                        </div>
                      );
                    })}

                    {/* Confidence notice */}
                    <div style={{ padding: '10px 14px', background: '#F0F3F8', borderRadius: 'var(--r-sm)', fontSize: '0.75rem', color: 'var(--gov-text-sec)', marginTop: 10 }}>
                      <strong>Confidence:</strong> {briefData.overall_confidence as string || 'MEDIUM'} &nbsp;·&nbsp;
                      {briefData.confidence_note as string}
                    </div>
                    <div style={{ marginTop: 8, fontSize: '0.68rem', color: 'var(--gov-warning)', background: 'var(--gov-warning-bg)', padding: '4px 10px', borderRadius: 'var(--r-sm)' }}>
                      SYNTHETIC DEMO DATA — NOT AN OFFICIAL GOVERNMENT RECORD. {briefData.notice as string}
                    </div>
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

          {/* ── PROCUREMENT WORKFLOW ─────────────────────────────── */}
          {tab === 'proc-workflow' && !tabLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Approval level banner */}
              {approvalLevel && (
                <div style={{
                  padding: '12px 16px',
                  background: (approvalLevel.applicable_level as string) === 'GOVERNMENT_LEVEL' ? '#fef3c7' : 'var(--gov-info-bg)',
                  border: `1px solid ${(approvalLevel.applicable_level as string) === 'GOVERNMENT_LEVEL' ? '#f0d060' : '#bcd4f0'}`,
                  borderLeft: `4px solid ${(approvalLevel.applicable_level as string) === 'GOVERNMENT_LEVEL' ? '#C9A227' : 'var(--gov-blue)'}`,
                  borderRadius: '0 var(--r-md) var(--r-md) 0',
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 3 }}>
                    Required Approval Level: {(approvalLevel.applicable_level as string)?.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gov-text-sec)' }}>
                    Estimated cost: INR {(approvalLevel.estimated_cost_inr as number)?.toLocaleString('en-IN')} &nbsp;·&nbsp;
                    Required role: {approvalLevel.required_role as string}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gov-muted)', marginTop: 4 }}>{approvalLevel.notice as string}</div>
                </div>
              )}

              {/* Procurement Requirements */}
              <GovCard title="Procurement Requirement" action={{ label: 'View Workflow →', href: `/procurement/workflow?proposal=${id}` }}>
                {(!procReqs || procReqs.length === 0) ? (
                  <div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--gov-muted)', marginBottom: 10 }}>
                      No procurement requirement created yet. A Procurement Officer can create one once the proposal is approved.
                    </p>
                    <a href={`/procurement/workflow?proposal=${id}`} className="btn btn-sm btn-secondary">
                      Open Procurement Workflow
                    </a>
                  </div>
                ) : (
                  procReqs.map(r => (
                    <div key={r.id as string} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gov-navy)' }}>{r.item_description as string}</span>
                        <StatusBadge status={r.status as string} size="xs" />
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                        <tbody>
                          {[
                            ['Category', r.category], ['Quantity', r.quantity], ['Unit', r.unit_of_measure],
                            ['Total Estimated Cost', r.total_estimated_cost ? `INR ${(r.total_estimated_cost as number).toLocaleString('en-IN')}` : '—'],
                            ['GeM Category', r.gem_category_code], ['Prepared By', r.prepared_by],
                          ].map(([label, val]) => val ? (
                            <tr key={String(label)}><td style={{ padding: '3px 8px', color: 'var(--gov-text-sec)', width: 180, fontWeight: 600 }}>{String(label)}</td><td style={{ padding: '3px 8px' }}>{String(val)}</td></tr>
                          ) : null)}
                        </tbody>
                      </table>
                    </div>
                  ))
                )}
              </GovCard>

              {/* Procurement Events */}
              <GovCard title="Procurement Events (Bid Lifecycle)" noPadding>
                {(!procEvents || procEvents.length === 0) ? (
                  <p style={{ padding: 14, color: 'var(--gov-muted)', fontSize: '0.82rem' }}>No procurement events initiated yet.</p>
                ) : (
                  <table className="gov-table">
                    <thead><tr><th>Event No.</th><th>Mode</th><th>Status</th><th>Bid Open</th><th>Bid Close</th><th>Bids Received</th><th>GeM Bid No.</th></tr></thead>
                    <tbody>
                      {procEvents.map(e => (
                        <tr key={e.id as string}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gov-blue)' }}>{e.event_number as string}</td>
                          <td style={{ fontSize: '0.75rem' }}>{e.procurement_mode as string || '—'}</td>
                          <td><StatusBadge status={(e.status as string).replace(/_/g, '_')} size="xs" /></td>
                          <td style={{ fontSize: '0.72rem', color: 'var(--gov-muted)' }}>{e.bid_start_date as string || '—'}</td>
                          <td style={{ fontSize: '0.72rem', color: 'var(--gov-muted)' }}>{e.bid_close_date as string || '—'}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{e.total_bids_received as number ?? '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{e.gem_bid_number as string || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div style={{ padding: '8px 14px', borderTop: '1px solid var(--gov-border)' }}>
                  <a href={`/procurement/workflow?proposal=${id}`} className="btn btn-sm btn-secondary">
                    Manage Procurement Workflow →
                  </a>
                </div>
              </GovCard>
            </div>
          )}

          {/* ── TECHNICAL EVALUATION ─────────────────────────────── */}
          {tab === 'tech-eval' && !tabLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(!procEvents || procEvents.length === 0) ? (
                <GovCard title="Technical Evaluation">
                  <p style={{ color: 'var(--gov-muted)', fontSize: '0.82rem' }}>No procurement event found. Create a procurement event first via the Procurement Workflow tab.</p>
                </GovCard>
              ) : (
                <>
                  {/* Event status banner */}
                  {procEventDetail && (
                    <div style={{ padding: '10px 14px', background: '#F8FAFD', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-md)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gov-navy)' }}>{procEventDetail.event_number as string}</span>
                      <StatusBadge status={procEventDetail.status as string} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)' }}>Mode: {procEventDetail.procurement_mode as string || '—'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)' }}>Bids: {procEventDetail.total_bids_received as number ?? '—'}</span>
                    </div>
                  )}

                  {!techEval ? (
                    <GovCard title="Technical Evaluation">
                      <p style={{ color: 'var(--gov-muted)', fontSize: '0.82rem', marginBottom: 10 }}>
                        No technical evaluation recorded. The evaluation committee conducts product demonstrations and specification checks.
                      </p>
                      <a href={`/procurement/workflow?proposal=${id}&tab=tech-eval`} className="btn btn-sm btn-secondary">
                        Open Evaluation Workspace
                      </a>
                    </GovCard>
                  ) : (
                    <>
                      <GovCard title="Evaluation Details">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                          {[
                            ['Evaluation Date', techEval.evaluation_date],
                            ['Demo Date', techEval.demo_date],
                            ['Venue', techEval.venue],
                            ['Status', techEval.status],
                          ].map(([l, v]) => (
                            <div key={String(l)} style={{ padding: '8px 12px', background: '#F8FAFD', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)' }}>
                              <div style={{ fontSize: '0.68rem', color: 'var(--gov-muted)', textTransform: 'uppercase' }}>{String(l)}</div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gov-navy)', marginTop: 2 }}>{String(v ?? '—')}</div>
                            </div>
                          ))}
                        </div>
                        {Boolean(techEval.overall_observations) && (
                          <div style={{ padding: '8px 12px', background: '#F0F3F8', borderRadius: 'var(--r-sm)', fontSize: '0.8rem', color: 'var(--gov-text)' }}>
                            <strong>Overall Observations:</strong> {String(techEval.overall_observations)}
                          </div>
                        )}
                      </GovCard>

                      {/* Committee */}
                      {((techEval.committee as unknown[])?.length > 0) && (
                        <GovCard title="Evaluation Committee" noPadding>
                          <table className="gov-table">
                            <thead><tr><th>Name</th><th>Designation</th><th>Role</th><th>Department</th></tr></thead>
                            <tbody>
                              {(techEval.committee as Record<string, unknown>[]).map((m, i) => (
                                <tr key={i}>
                                  <td style={{ fontSize: '0.8rem', fontWeight: 500 }}>{m.name as string}</td>
                                  <td style={{ fontSize: '0.78rem', color: 'var(--gov-text-sec)' }}>{m.designation as string || '—'}</td>
                                  <td><StatusBadge status={m.role as string} size="xs" /></td>
                                  <td style={{ fontSize: '0.75rem', color: 'var(--gov-muted)' }}>{m.department as string || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </GovCard>
                      )}

                      {/* Bidder evaluation matrix */}
                      {((techEval.bidder_lines as unknown[])?.length > 0) && (
                        <GovCard title="Specification Compliance Matrix" noPadding>
                          <div style={{ padding: '6px 14px', background: 'var(--gov-warning-bg)', borderBottom: '1px solid var(--gov-border)', fontSize: '0.72rem', color: '#7a5500' }}>
                            SYNTHETIC DEMO DATA — Technical evaluation results shown for demonstration only.
                          </div>
                          <table className="gov-table">
                            <thead><tr><th>Spec Field</th><th>Required</th><th>Offered</th><th>Compliance</th><th>Notes</th></tr></thead>
                            <tbody>
                              {(techEval.bidder_lines as Record<string, unknown>[]).map((l, i) => (
                                <tr key={i}>
                                  <td style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize' }}>{(l.spec_field as string).replace(/_/g, ' ')}</td>
                                  <td style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)' }}>{l.required_value as string || '—'}</td>
                                  <td style={{ fontSize: '0.75rem' }}>{l.offered_value as string || '—'}</td>
                                  <td>
                                    <span style={{
                                      fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--r-sm)',
                                      background: l.compliance_status === 'COMPLIANT' ? 'var(--gov-success-bg)' : l.compliance_status === 'NON_COMPLIANT' ? 'var(--gov-danger-bg)' : 'var(--gov-warning-bg)',
                                      color: l.compliance_status === 'COMPLIANT' ? 'var(--gov-success)' : l.compliance_status === 'NON_COMPLIANT' ? 'var(--gov-danger)' : 'var(--gov-warning)',
                                    }}>{l.compliance_status as string}</span>
                                  </td>
                                  <td style={{ fontSize: '0.72rem', color: 'var(--gov-text-sec)' }}>{(l.notes as string)?.slice(0, 60) || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </GovCard>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── FINANCIAL EVALUATION / L1 ─────────────────────────── */}
          {tab === 'fin-eval' && !tabLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!finEval ? (
                <GovCard title="Financial Evaluation — Comparative Statement">
                  <p style={{ color: 'var(--gov-muted)', fontSize: '0.82rem', marginBottom: 10 }}>
                    Financial evaluation not yet conducted. Only technically qualified bids proceed to this stage.
                  </p>
                  <a href={`/procurement/workflow?proposal=${id}&tab=fin-eval`} className="btn btn-sm btn-secondary">Open Evaluation Workspace</a>
                </GovCard>
              ) : (
                <>
                  {/* L1 highlight */}
                  {finEval.l1_amount_inr && (
                    <div style={{
                      padding: '14px 18px', background: 'var(--gov-success-bg)',
                      border: '1px solid #b7dfc7', borderLeft: '4px solid var(--gov-success)',
                      borderRadius: '0 var(--r-md) var(--r-md) 0',
                    }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gov-success)', fontWeight: 700, marginBottom: 4 }}>
                        L1 IDENTIFIED — Lowest Eligible Bid
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--gov-navy)' }}>
                        INR {(finEval.l1_amount_inr as number).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)', marginTop: 4 }}>
                        Recorded by: {finEval.l1_identified_by as string} &nbsp;·&nbsp;
                        Qualified bids: {finEval.technically_qualified_count as number}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--gov-muted)', marginTop: 6 }}>
                        PRISM-PY records and displays L1. Final award decision remains with the authorised officer/committee.
                      </div>
                    </div>
                  )}

                  {/* Comparative statement table */}
                  <GovCard title="Comparative Statement" noPadding>
                    <div style={{ padding: '6px 14px', background: 'var(--gov-warning-bg)', borderBottom: '1px solid var(--gov-border)', fontSize: '0.72rem', color: '#7a5500' }}>
                      SYNTHETIC DEMO DATA — Comparative statement for demonstration purposes only.
                    </div>
                    <table className="gov-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Company</th>
                          <th style={{ textAlign: 'right' }}>Bid Amount (INR)</th>
                          <th>Tech Qualified</th>
                          <th>L1</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Qualified bids */}
                        {((finEval.comparative_statement as Record<string, unknown>)?.qualified_bids as Record<string, unknown>[])?.map((b, i) => (
                          <tr key={i} style={{ background: b.is_l1 ? 'var(--gov-success-bg)' : 'transparent' }}>
                            <td style={{ fontSize: '0.8rem', fontWeight: 700 }}>#{b.rank as number}</td>
                            <td style={{ fontSize: '0.82rem', fontWeight: b.is_l1 ? 700 : 400 }}>{b.company as string}</td>
                            <td style={{ textAlign: 'right', fontSize: '0.82rem', fontWeight: 600 }}>
                              {(b.amount_inr as number)?.toLocaleString('en-IN') || '—'}
                            </td>
                            <td><span className="badge badge-approved" style={{ fontSize: '0.62rem' }}>Qualified</span></td>
                            <td>
                              {Boolean(b.is_l1) && <span className="badge badge-approved" style={{ fontSize: '0.62rem', background: 'var(--gov-success)', color: 'white' }}>L1</span>}
                            </td>
                          </tr>
                        ))}
                        {/* Disqualified bids */}
                        {((finEval.comparative_statement as Record<string, unknown>)?.disqualified_bids as Record<string, unknown>[])?.map((b, i) => (
                          <tr key={`dq-${i}`} style={{ background: '#fdf0ef' }}>
                            <td style={{ color: 'var(--gov-muted)', fontSize: '0.78rem' }}>—</td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--gov-text-sec)' }}>{b.company as string}</td>
                            <td style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--gov-muted)' }}>Not opened</td>
                            <td><span className="badge badge-rejected" style={{ fontSize: '0.62rem' }}>Not Qualified</span></td>
                            <td>—</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </GovCard>
                </>
              )}
            </div>
          )}

          {/* ── PURCHASE ORDER ────────────────────────────────────── */}
          {tab === 'purchase-order' && !tabLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '8px 14px', background: 'var(--gov-info-bg)', border: '1px solid #bcd4f0', borderLeft: '3px solid var(--gov-blue)', borderRadius: '0 var(--r-md) var(--r-md) 0', fontSize: '0.78rem', color: 'var(--gov-review)' }}>
                PRISM-PY records Purchase Orders entered by the authorised officer. It does not generate or place orders autonomously.
              </div>
              {(!purchaseOrders || purchaseOrders.length === 0) ? (
                <GovCard title="Purchase Orders">
                  <p style={{ color: 'var(--gov-muted)', fontSize: '0.82rem', marginBottom: 10 }}>No purchase orders recorded for this proposal yet.</p>
                  <a href={`/procurement/workflow?proposal=${id}&tab=po`} className="btn btn-sm btn-secondary">Record Purchase Order</a>
                </GovCard>
              ) : (
                purchaseOrders.map(po => (
                  <GovCard key={po.id as string} title={`Purchase Order — ${po.po_number as string || 'Draft'}`}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                      {[
                        ['PO Number', po.po_number],
                        ['GeM Order Number', po.gem_order_number],
                        ['Vendor', po.vendor_name],
                        ['Quantity', po.quantity],
                        ['Total Amount (INR)', po.total_amount_inr ? (po.total_amount_inr as number).toLocaleString('en-IN') : '—'],
                        ['PO Date', po.po_date],
                        ['Expected Delivery', po.expected_delivery_date],
                        ['Actual Delivery', po.actual_delivery_date],
                        ['Status', po.status],
                      ].map(([l, v]) => (
                        <div key={String(l)} style={{ padding: '8px 12px', background: '#F8FAFD', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)' }}>
                          <div style={{ fontSize: '0.68rem', color: 'var(--gov-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{String(l)}</div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gov-navy)', marginTop: 2 }}>{String(v ?? '—')}</div>
                        </div>
                      ))}
                    </div>
                    {Boolean(po.inspection_note) && (
                      <div style={{ padding: '8px 12px', background: '#F0F3F8', borderRadius: 'var(--r-sm)', fontSize: '0.78rem', color: 'var(--gov-text)' }}>
                        <strong>Inspection Note:</strong> {String(po.inspection_note)}
                      </div>
                    )}
                    <div style={{ marginTop: 10, fontSize: '0.68rem', color: 'var(--gov-muted)' }}>
                      SYNTHETIC DEMO DATA — NOT AN OFFICIAL GOVERNMENT RECORD
                    </div>
                  </GovCard>
                ))
              )}
            </div>
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

export default function ProposalDetailPage() {
  return (
    <Suspense fallback={<AppLayout><div className="gov-page"><LoadingSpinner text="Loading proposal..." /></div></AppLayout>}>
      <ProposalDetailContent />
    </Suspense>
  );
}
