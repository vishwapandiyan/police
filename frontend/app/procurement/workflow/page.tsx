'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight, Plus, AlertCircle, Check,
  FileText, Users, BarChart2, Package, RefreshCw
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/ui/PageHeader';
import GovCard from '@/components/ui/GovCard';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { procurementWorkflow, proposals as proposalApi } from '@/lib/api';
import type { Proposal } from '@/lib/types';
import { useAuth } from '@/lib/auth';

type WFTab = 'requirement' | 'events' | 'bids' | 'tech-eval' | 'fin-eval' | 'po';

const WF_STEPS = [
  { id: 'requirement' as WFTab, label: 'Procurement Requirement', icon: <FileText size={14} /> },
  { id: 'events'      as WFTab, label: 'Bid Event',               icon: <Package size={14} /> },
  { id: 'bids'        as WFTab, label: 'Bids',                    icon: <Users size={14} /> },
  { id: 'tech-eval'   as WFTab, label: 'Technical Evaluation',    icon: <Check size={14} /> },
  { id: 'fin-eval'    as WFTab, label: 'Financial Evaluation',    icon: <BarChart2 size={14} /> },
  { id: 'po'          as WFTab, label: 'Purchase Order',           icon: <Package size={14} /> },
];

const NOTICE = {
  background: 'var(--gov-warning-bg)', border: '1px solid #f0d060',
  borderLeft: '3px solid #C9A227', borderRadius: '0 var(--r-md) var(--r-md) 0',
  padding: '8px 14px', fontSize: '0.78rem', color: '#7a5500',
};

function WorkflowContent() {
  const { hasPermission } = useAuth();
  const searchParams = useSearchParams();
  const proposalId = searchParams.get('proposal') || '';
  const initialTab = (searchParams.get('tab') as WFTab) || 'requirement';

  const [tab, setTab] = useState<WFTab>(initialTab);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [approvalLevel, setApprovalLevel] = useState<Record<string, unknown> | null>(null);
  const [requirements, setRequirements] = useState<Record<string, unknown>[]>([]);
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Record<string, unknown> | null>(null);
  const [bids, setBids] = useState<Record<string, unknown>[]>([]);
  const [techEval, setTechEval] = useState<Record<string, unknown> | null>(null);
  const [finEval, setFinEval] = useState<Record<string, unknown> | null>(null);
  const [purchaseOrders, setPOs] = useState<Record<string, unknown>[]>([]);
  const [allProposals, setAllProposals] = useState<Proposal[]>([]);

  // Form states
  const [reqForm, setReqForm] = useState({
    item_description: '', category: '', quantity: '', unit_of_measure: '',
    technical_specification: '', functional_requirements: '',
    compliance_requirements: '', delivery_requirements: '', warranty_requirements: '',
    total_estimated_cost: '', gem_category_code: '', justification: '',
  });
  const [eventForm, setEventForm] = useState({
    procurement_mode: 'e-Bid / Reverse Auction', gem_bid_number: '',
    bid_start_date: '', bid_close_date: '', bid_duration_days: '21', notes: '',
  });
  const [bidForm, setBidForm] = useState({
    company_name: '', bid_reference: '', bid_amount_inr: '',
    quantity_offered: '', delivery_period: '', warranty_offered: '',
    offered_specification: '', country_of_origin: 'India',
  });
  const [evalForm, setEvalForm] = useState({ evaluation_date: '', demo_date: '', venue: '', overall_observations: '' });
  const [memberForm, setMemberForm] = useState({ member_name: '', designation: '', role: 'MEMBER', department: '' });
  const [l1BidId, setL1BidId] = useState('');
  const [poForm, setPOForm] = useState({
    po_number: '', gem_order_number: '', vendor_name: '', quantity: '',
    total_amount_inr: '', po_date: '', expected_delivery_date: '', delivery_location: '',
    inspection_note: '',
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Load data
  useEffect(() => {
    proposalApi.list({ status: 'APPROVED', limit: '100' }).then(r => setAllProposals(r.proposals));
  }, []);

  useEffect(() => {
    if (!proposalId) return;
    setLoading(true);
    Promise.all([
      proposalApi.get(proposalId).then(r => setProposal(r.proposal)),
      procurementWorkflow.getProposalApprovalLevel(proposalId).then(setApprovalLevel).catch(() => {}),
      procurementWorkflow.getRequirement(proposalId).then(r => { setRequirements(r.requirements); if (r.requirements[0]) setReqForm(f => ({ ...f, ...r.requirements[0] as Record<string, string> })); }).catch(() => setRequirements([])),
      procurementWorkflow.listEvents(proposalId).then(r => {
        setEvents(r.events);
        if (r.events[0]) {
          const first = r.events[0];
          setSelectedEvent(first);
          const eid = first.id as string;
          return Promise.all([
            procurementWorkflow.listBids(eid).then(b => setBids(b.bids)).catch(() => {}),
            procurementWorkflow.getTechEval(eid).then(t => setTechEval(t.evaluation)).catch(() => setTechEval(null)),
            procurementWorkflow.getFinEval(eid).then(f => setFinEval(f.evaluation)).catch(() => setFinEval(null)),
          ]);
        }
      }).catch(() => setEvents([])),
      procurementWorkflow.listPOs(proposalId).then(r => setPOs(r.purchase_orders)).catch(() => setPOs([])),
    ]).finally(() => setLoading(false));
  }, [proposalId]);

  const setF = (setter: React.Dispatch<React.SetStateAction<Record<string, string>>>) =>
    (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setter((f: Record<string, string>) => ({ ...f, [k]: e.target.value }));

  const handleCreateReq = async () => {
    if (!proposalId) return;
    setSaving(true);
    try {
      const r = await procurementWorkflow.createRequirement(proposalId, {
        ...reqForm,
        total_estimated_cost: reqForm.total_estimated_cost ? parseFloat(reqForm.total_estimated_cost) : undefined,
      });
      setRequirements([r.requirement]);
      showFeedback('success', 'Procurement requirement created.');
    } catch (e) { showFeedback('error', e instanceof Error ? e.message : 'Failed'); }
    setSaving(false);
  };

  const handleCreateEvent = async () => {
    if (requirements.length === 0) { showFeedback('error', 'Create a procurement requirement first.'); return; }
    setSaving(true);
    try {
      const r = await procurementWorkflow.createEvent(requirements[0].id as string, {
        ...eventForm, bid_duration_days: eventForm.bid_duration_days ? parseInt(eventForm.bid_duration_days) : undefined,
      });
      setEvents(prev => [r.event, ...prev]);
      setSelectedEvent(r.event);
      showFeedback('success', 'Procurement event created.');
    } catch (e) { showFeedback('error', e instanceof Error ? e.message : 'Failed'); }
    setSaving(false);
  };

  const handleEventStatus = async (status: string) => {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      await procurementWorkflow.updateEventStatus(selectedEvent.id as string, { status });
      const r = await procurementWorkflow.listEvents(proposalId);
      setEvents(r.events);
      const updated = r.events.find(e => e.id === selectedEvent.id) || r.events[0];
      setSelectedEvent(updated || null);
      showFeedback('success', `Event moved to ${status.replace(/_/g, ' ')}.`);
    } catch (e) { showFeedback('error', e instanceof Error ? e.message : 'Failed'); }
    setSaving(false);
  };

  const handleAddBid = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      const r = await procurementWorkflow.addBid(selectedEvent.id as string, {
        ...bidForm, bid_amount_inr: bidForm.bid_amount_inr ? parseFloat(bidForm.bid_amount_inr) : undefined,
      });
      setBids(prev => [...prev, r.bid]);
      setBidForm({ company_name: '', bid_reference: '', bid_amount_inr: '', quantity_offered: '', delivery_period: '', warranty_offered: '', offered_specification: '', country_of_origin: 'India' });
      showFeedback('success', 'Bid recorded.');
    } catch (e) { showFeedback('error', e instanceof Error ? e.message : 'Failed'); }
    setSaving(false);
  };

  const handleQualifyBid = async (evalId: string, bidId: string, status: string) => {
    setSaving(true);
    try {
      await procurementWorkflow.qualifyBid(evalId, bidId, status);
      if (selectedEvent) {
        const r = await procurementWorkflow.getTechEval(selectedEvent.id as string);
        setTechEval(r.evaluation);
      }
      // Refresh bids
      if (selectedEvent) {
        const rb = await procurementWorkflow.listBids(selectedEvent.id as string);
        setBids(rb.bids);
      }
      showFeedback('success', `Bid marked as ${status}.`);
    } catch (e) { showFeedback('error', e instanceof Error ? e.message : 'Failed'); }
    setSaving(false);
  };

  const handleCreateTechEval = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      const r = await procurementWorkflow.createTechEval(selectedEvent.id as string, evalForm);
      // Add committee members if provided
      if (memberForm.member_name) {
        await procurementWorkflow.addCommitteeMember(r.evaluation_id, memberForm);
      }
      const te = await procurementWorkflow.getTechEval(selectedEvent.id as string);
      setTechEval(te.evaluation);
      showFeedback('success', 'Technical evaluation created.');
    } catch (e) { showFeedback('error', e instanceof Error ? e.message : 'Failed'); }
    setSaving(false);
  };

  const handleCreateFinEval = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      await procurementWorkflow.createFinEval(selectedEvent.id as string, { evaluation_date: new Date().toISOString().split('T')[0] });
      const r = await procurementWorkflow.getFinEval(selectedEvent.id as string);
      setFinEval(r.evaluation);
      showFeedback('success', 'Financial evaluation created. Comparative statement computed.');
    } catch (e) { showFeedback('error', e instanceof Error ? e.message : 'Failed'); }
    setSaving(false);
  };

  const handleRecordL1 = async () => {
    if (!finEval || !l1BidId) return;
    setSaving(true);
    try {
      await procurementWorkflow.recordL1(finEval.id as string, { l1_bid_id: l1BidId });
      const r = await procurementWorkflow.getFinEval(selectedEvent!.id as string);
      setFinEval(r.evaluation);
      showFeedback('success', 'L1 determination recorded by officer.');
    } catch (e) { showFeedback('error', e instanceof Error ? e.message : 'Failed'); }
    setSaving(false);
  };

  const handleCreatePO = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      const r = await procurementWorkflow.createPO(selectedEvent.id as string, {
        ...poForm,
        total_amount_inr: poForm.total_amount_inr ? parseFloat(poForm.total_amount_inr) : undefined,
      });
      setPOs(prev => [...prev, r.purchase_order]);
      showFeedback('success', 'Purchase order recorded.');
    } catch (e) { showFeedback('error', e instanceof Error ? e.message : 'Failed'); }
    setSaving(false);
  };

  const inp = { className: 'gov-input' as const };
  const ta  = { className: 'gov-textarea' as const };
  const sel = { className: 'gov-select' as const };
  const label = (text: string, req?: boolean) => (
    <label className="form-label" style={{ marginBottom: 4, display: 'block' }}>
      {text}{req && <span className="req"> *</span>}
    </label>
  );
  const row2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 };
  const row3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 };

  const EVENT_TRANSITIONS: Record<string, string[]> = {
    'PREPARING': ['PUBLISHED'],
    'PUBLISHED': ['BID_ACTIVE'],
    'BID_ACTIVE': ['BID_CLOSED'],
    'BID_CLOSED': ['BID_OPENING'],
    'BID_OPENING': ['TECHNICAL_EVALUATION'],
    'TECHNICAL_EVALUATION': ['FINANCIAL_EVALUATION'],
    'FINANCIAL_EVALUATION': ['AWARD_DECISION'],
    'AWARD_DECISION': ['AWARDED'],
  };

  const qualifiedBids = bids.filter(b => b.technical_qualification_status === 'QUALIFIED');

  return (
    <AppLayout>
      <div className="gov-page">
        <SyntheticBanner />
        <PageHeader
          title="Procurement Workflow"
          subtitle="End-to-end procurement lifecycle management"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Procurement', href: '/procurement' }, { label: 'Workflow' }]}
        />

        {/* Proposal selector */}
        <GovCard title="Select Proposal" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              {label('Approved Proposal', true)}
              <select {...sel} value={proposalId} onChange={e => window.location.href = `/procurement/workflow?proposal=${e.target.value}`}>
                <option value="">— Select a proposal —</option>
                {allProposals.map(p => (
                  <option key={p.id} value={p.id}>{p.proposal_number} — {p.title.slice(0, 60)}</option>
                ))}
              </select>
            </div>
            {proposal && (
              <div style={{ padding: '8px 12px', background: '#F8FAFD', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)', fontSize: '0.78rem' }}>
                <strong>{proposal.department}</strong> &nbsp;·&nbsp; {proposal.category} &nbsp;·&nbsp;
                <StatusBadge status={proposal.status} size="xs" />
              </div>
            )}
          </div>
        </GovCard>

        {!proposalId && (
          <div style={{ padding: '40px 20px', background: 'white', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-md)', textAlign: 'center', color: 'var(--gov-muted)' }}>
            <Package size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
            <p style={{ fontSize: '0.9rem' }}>Select an approved proposal above to begin the procurement workflow.</p>
          </div>
        )}

        {proposalId && loading && <LoadingSpinner text="Loading procurement data..." />}

        {proposalId && !loading && (
          <>
            {/* Approval level */}
            {approvalLevel && (
              <div style={{ ...NOTICE, marginBottom: 16 }}>
                <strong>Required Approval Level:</strong> {(approvalLevel.applicable_level as string)?.replace(/_/g, ' ')} &nbsp;·&nbsp;
                INR {(approvalLevel.estimated_cost_inr as number)?.toLocaleString('en-IN')} &nbsp;·&nbsp;
                Role: {approvalLevel.required_role as string}
                <div style={{ fontSize: '0.72rem', color: '#92400e', marginTop: 3 }}>{approvalLevel.notice as string}</div>
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div style={{
                marginBottom: 14, padding: '8px 14px',
                background: feedback.type === 'success' ? 'var(--gov-success-bg)' : 'var(--gov-danger-bg)',
                border: `1px solid ${feedback.type === 'success' ? '#b7dfc7' : '#f5c6c2'}`,
                borderRadius: 'var(--r-sm)', fontSize: '0.82rem',
                color: feedback.type === 'success' ? 'var(--gov-success)' : 'var(--gov-danger)',
              }}>
                {feedback.msg}
              </div>
            )}

            {/* Workflow stepper */}
            <div style={{ display: 'flex', background: 'white', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: 18 }}>
              {WF_STEPS.map((step, i) => {
                const isActive = tab === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => setTab(step.id)}
                    style={{
                      flex: 1, padding: '10px 6px',
                      border: 'none',
                      borderRight: i < WF_STEPS.length - 1 ? '1px solid var(--gov-border)' : 'none',
                      background: isActive ? 'var(--gov-navy)' : '#F8FAFD',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <div style={{ color: isActive ? 'var(--gov-gold-light)' : 'var(--gov-muted)', marginBottom: 4, display: 'flex', justifyContent: 'center' }}>
                      {step.icon}
                    </div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 600, color: isActive ? 'white' : 'var(--gov-text-sec)', lineHeight: 1.3 }}>
                      {step.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ── TAB: REQUIREMENT ── */}
            {tab === 'requirement' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {requirements.length > 0 ? (
                  <GovCard title="Procurement Requirement — Recorded">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <tbody>
                        {[
                          ['Item Description', requirements[0].item_description],
                          ['Category', requirements[0].category],
                          ['Quantity', requirements[0].quantity],
                          ['Technical Specification', requirements[0].technical_specification],
                          ['Functional Requirements', requirements[0].functional_requirements],
                          ['Compliance Requirements', requirements[0].compliance_requirements],
                          ['Delivery Requirements', requirements[0].delivery_requirements],
                          ['Warranty Requirements', requirements[0].warranty_requirements],
                          ['Total Estimated Cost (INR)', requirements[0].total_estimated_cost ? (requirements[0].total_estimated_cost as number).toLocaleString('en-IN') : '—'],
                          ['GeM Category Code', requirements[0].gem_category_code],
                          ['Status', requirements[0].status],
                        ].map(([l, v]) => v ? (
                          <tr key={String(l)} style={{ borderBottom: '1px solid var(--gov-border)' }}>
                            <td style={{ padding: '5px 8px', fontWeight: 600, color: 'var(--gov-text-sec)', width: 220 }}>{String(l)}</td>
                            <td style={{ padding: '5px 8px' }}>{String(v)}</td>
                          </tr>
                        ) : null)}
                      </tbody>
                    </table>
                  </GovCard>
                ) : (
                  <GovCard title="Create Procurement Requirement">
                    <p style={{ fontSize: '0.8rem', color: 'var(--gov-text-sec)', marginBottom: 16 }}>
                      Convert the approved proposal requirement into a structured procurement requirement.
                      This will be specification-driven and brand-neutral.
                    </p>
                    <div style={row2}>
                      <div>{label('Item Description', true)}<input {...inp} value={reqForm.item_description} onChange={e => setReqForm(f => ({ ...f, item_description: e.target.value }))} placeholder="e.g. IP CCTV Cameras with AI analytics" /></div>
                      <div>{label('Category')}<input {...inp} value={reqForm.category} onChange={e => setReqForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Surveillance Equipment" /></div>
                      <div>{label('Quantity')}<input {...inp} value={reqForm.quantity} onChange={e => setReqForm(f => ({ ...f, quantity: e.target.value }))} placeholder="e.g. 50 cameras + 5 NVR" /></div>
                      <div>{label('Unit of Measure')}<input {...inp} value={reqForm.unit_of_measure} onChange={e => setReqForm(f => ({ ...f, unit_of_measure: e.target.value }))} placeholder="e.g. system" /></div>
                      <div>{label('Total Estimated Cost (INR)')}<input {...inp} type="number" value={reqForm.total_estimated_cost} onChange={e => setReqForm(f => ({ ...f, total_estimated_cost: e.target.value }))} placeholder="e.g. 2500000" /></div>
                      <div>{label('GeM Category Code')}<input {...inp} value={reqForm.gem_category_code} onChange={e => setReqForm(f => ({ ...f, gem_category_code: e.target.value }))} placeholder="e.g. CCTV-IP-CAM" /></div>
                    </div>
                    <div style={{ marginBottom: 14 }}>{label('Technical Specification', true)}<textarea {...ta} value={reqForm.technical_specification} onChange={e => setReqForm(f => ({ ...f, technical_specification: e.target.value }))} placeholder="Minimum 4MP; H.265; 30m IR; ONVIF; PoE; 30-day NVR..." /></div>
                    <div style={{ marginBottom: 14 }}>{label('Functional Requirements')}<textarea {...ta} value={reqForm.functional_requirements} onChange={e => setReqForm(f => ({ ...f, functional_requirements: e.target.value }))} placeholder="Real-time surveillance with 30-day retention..." /></div>
                    <div style={row2}>
                      <div>{label('Compliance Requirements')}<textarea {...ta} style={{ minHeight: 60 }} value={reqForm.compliance_requirements} onChange={e => setReqForm(f => ({ ...f, compliance_requirements: e.target.value }))} placeholder="BIS/STQC certified; IP66..." /></div>
                      <div>{label('Delivery Requirements')}<textarea {...ta} style={{ minHeight: 60 }} value={reqForm.delivery_requirements} onChange={e => setReqForm(f => ({ ...f, delivery_requirements: e.target.value }))} placeholder="Delivery within 45 days of PO..." /></div>
                      <div>{label('Warranty Requirements')}<textarea {...ta} style={{ minHeight: 60 }} value={reqForm.warranty_requirements} onChange={e => setReqForm(f => ({ ...f, warranty_requirements: e.target.value }))} placeholder="3-year comprehensive warranty..." /></div>
                      <div>{label('Justification')}<textarea {...ta} style={{ minHeight: 60 }} value={reqForm.justification} onChange={e => setReqForm(f => ({ ...f, justification: e.target.value }))} placeholder="Operational need..." /></div>
                    </div>
                    <button onClick={handleCreateReq} disabled={saving || !reqForm.item_description} className="btn btn-primary btn-sm">
                      {saving ? 'Saving...' : <><Plus size={12} /> Create Procurement Requirement</>}
                    </button>
                  </GovCard>
                )}
              </div>
            )}

            {/* ── TAB: EVENTS ── */}
            {tab === 'events' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {events.length > 0 && (
                  <GovCard title="Active Procurement Event" noPadding>
                    {events.map(ev => (
                      <div key={ev.id as string} style={{ padding: 14, borderBottom: '1px solid var(--gov-border)' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--gov-navy)' }}>{ev.event_number as string}</span>
                          <StatusBadge status={ev.status as string} />
                          <span style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)' }}>{ev.procurement_mode as string}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)', marginBottom: 8 }}>
                          Bid period: {ev.bid_start_date as string || '—'} to {ev.bid_close_date as string || '—'} &nbsp;·&nbsp;
                          Duration: {ev.bid_duration_days as number || '—'} days &nbsp;·&nbsp;
                          GeM Bid: {ev.gem_bid_number as string || '—'}
                        </div>
                        {/* Status transition buttons */}
                        {(EVENT_TRANSITIONS[ev.status as string] || []).length > 0 && (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {(EVENT_TRANSITIONS[ev.status as string] || []).map(next => (
                              <button key={next} onClick={() => { setSelectedEvent(ev); handleEventStatus(next); }} disabled={saving} className="btn btn-sm btn-secondary">
                                Move to: {next.replace(/_/g, ' ')} <ChevronRight size={12} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </GovCard>
                )}

                {events.length === 0 && (
                  <GovCard title="Create Procurement Event">
                    <div style={{ marginBottom: 14, ...NOTICE }}>
                      Bid duration is configurable. Approximately 20–21 days is typical per GeM platform guidance, but the actual duration depends on procurement mode and applicable rules.
                    </div>
                    <div style={row2}>
                      <div>
                        {label('Procurement Mode', true)}
                        <select {...sel} value={eventForm.procurement_mode} onChange={e => setEventForm(f => ({ ...f, procurement_mode: e.target.value }))}>
                          <option>e-Bid / Reverse Auction</option>
                          <option>Direct Purchase with L1</option>
                          <option>Direct Purchase</option>
                          <option>Limited Tender</option>
                          <option>Open Tender</option>
                        </select>
                      </div>
                      <div>{label('GeM Bid Number')}<input {...inp} value={eventForm.gem_bid_number} onChange={e => setEventForm(f => ({ ...f, gem_bid_number: e.target.value }))} placeholder="GEM/2024/B/..." /></div>
                      <div>{label('Bid Start Date')}<input {...inp} type="date" value={eventForm.bid_start_date} onChange={e => setEventForm(f => ({ ...f, bid_start_date: e.target.value }))} /></div>
                      <div>{label('Bid Close Date')}<input {...inp} type="date" value={eventForm.bid_close_date} onChange={e => setEventForm(f => ({ ...f, bid_close_date: e.target.value }))} /></div>
                      <div>{label('Bid Duration (days)')}<input {...inp} type="number" value={eventForm.bid_duration_days} onChange={e => setEventForm(f => ({ ...f, bid_duration_days: e.target.value }))} placeholder="21" /></div>
                    </div>
                    <div style={{ marginBottom: 14 }}>{label('Notes')}<textarea {...ta} style={{ minHeight: 60 }} value={eventForm.notes} onChange={e => setEventForm(f => ({ ...f, notes: e.target.value }))} /></div>
                    <button onClick={handleCreateEvent} disabled={saving || requirements.length === 0} className="btn btn-primary btn-sm">
                      {saving ? 'Creating...' : <><Plus size={12} /> Create Procurement Event</>}
                    </button>
                    {requirements.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--gov-warning)', marginTop: 8 }}>Create a procurement requirement first.</p>}
                  </GovCard>
                )}
              </div>
            )}

            {/* ── TAB: BIDS ── */}
            {tab === 'bids' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ ...NOTICE }}>
                  Bids are recorded after bid opening. Financial amounts are only visible after technical evaluation is complete.
                  PRISM-PY does not select vendors or recommend awards.
                </div>

                {bids.length > 0 && (
                  <GovCard title={`Recorded Bids (${bids.length})`} noPadding>
                    <table className="gov-table">
                      <thead><tr><th>Company</th><th>Reference</th><th style={{ textAlign: 'right' }}>Amount (INR)</th><th>Delivery</th><th>Warranty</th><th>Tech Status</th><th>L1</th></tr></thead>
                      <tbody>
                        {bids.map(b => (
                          <tr key={b.id as string} style={{ background: b.is_l1 ? 'var(--gov-success-bg)' : 'transparent' }}>
                            <td style={{ fontSize: '0.8rem', fontWeight: 500 }}>{b.company_name as string}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{b.bid_reference as string || '—'}</td>
                            <td style={{ textAlign: 'right', fontSize: '0.82rem', fontWeight: 600 }}>
                              {b.bid_amount_inr ? (b.bid_amount_inr as number).toLocaleString('en-IN') : '—'}
                            </td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)' }}>{b.delivery_period as string || '—'}</td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)' }}>{b.warranty_offered as string || '—'}</td>
                            <td>
                              <span style={{
                                fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: 'var(--r-sm)',
                                background: b.technical_qualification_status === 'QUALIFIED' ? 'var(--gov-success-bg)' : b.technical_qualification_status === 'NOT_QUALIFIED' ? 'var(--gov-danger-bg)' : 'var(--gov-warning-bg)',
                                color: b.technical_qualification_status === 'QUALIFIED' ? 'var(--gov-success)' : b.technical_qualification_status === 'NOT_QUALIFIED' ? 'var(--gov-danger)' : 'var(--gov-warning)',
                              }}>{b.technical_qualification_status as string}</span>
                            </td>
                            <td>{Boolean(b.is_l1) && <span className="badge badge-approved" style={{ fontSize: '0.62rem' }}>L1</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </GovCard>
                )}

                {selectedEvent && ['BID_OPENING', 'TECHNICAL_EVALUATION', 'BID_CLOSED'].includes(selectedEvent.status as string) && (
                  <GovCard title="Record Bid">
                    <div style={row3}>
                      <div style={{ gridColumn: '1/3' }}>{label('Company Name', true)}<input {...inp} value={bidForm.company_name} onChange={e => setBidForm(f => ({ ...f, company_name: e.target.value }))} placeholder="Company name (for reference only)" /></div>
                      <div>{label('Bid Reference')}<input {...inp} value={bidForm.bid_reference} onChange={e => setBidForm(f => ({ ...f, bid_reference: e.target.value }))} placeholder="BID-A-2024-001" /></div>
                      <div>{label('Bid Amount (INR)')}<input {...inp} type="number" value={bidForm.bid_amount_inr} onChange={e => setBidForm(f => ({ ...f, bid_amount_inr: e.target.value }))} placeholder="e.g. 2350000" /></div>
                      <div>{label('Quantity Offered')}<input {...inp} value={bidForm.quantity_offered} onChange={e => setBidForm(f => ({ ...f, quantity_offered: e.target.value }))} /></div>
                      <div>{label('Delivery Period')}<input {...inp} value={bidForm.delivery_period} onChange={e => setBidForm(f => ({ ...f, delivery_period: e.target.value }))} placeholder="45 days from PO" /></div>
                      <div>{label('Warranty Offered')}<input {...inp} value={bidForm.warranty_offered} onChange={e => setBidForm(f => ({ ...f, warranty_offered: e.target.value }))} placeholder="3 years" /></div>
                      <div>{label('Country of Origin')}<input {...inp} value={bidForm.country_of_origin} onChange={e => setBidForm(f => ({ ...f, country_of_origin: e.target.value }))} /></div>
                    </div>
                    <div style={{ marginBottom: 14 }}>{label('Offered Specification')}<textarea {...ta} style={{ minHeight: 60 }} value={bidForm.offered_specification} onChange={e => setBidForm(f => ({ ...f, offered_specification: e.target.value }))} /></div>
                    <button onClick={handleAddBid} disabled={saving || !bidForm.company_name} className="btn btn-primary btn-sm">
                      {saving ? 'Saving...' : <><Plus size={12} /> Record Bid</>}
                    </button>
                  </GovCard>
                )}
              </div>
            )}

            {/* ── TAB: TECHNICAL EVALUATION ── */}
            {tab === 'tech-eval' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ ...NOTICE }}>
                  Technical evaluation determines which bids meet the specification. Only technically qualified bids proceed to financial evaluation.
                  This is recorded by the officer — PRISM-PY does not auto-qualify bids.
                </div>

                {!techEval ? (
                  <GovCard title="Create Technical Evaluation">
                    <div style={row2}>
                      <div>{label('Evaluation Date')}<input {...inp} type="date" value={evalForm.evaluation_date} onChange={e => setEvalForm(f => ({ ...f, evaluation_date: e.target.value }))} /></div>
                      <div>{label('Demo / Demonstration Date')}<input {...inp} type="date" value={evalForm.demo_date} onChange={e => setEvalForm(f => ({ ...f, demo_date: e.target.value }))} /></div>
                      <div style={{ gridColumn: '1/3' }}>{label('Venue')}<input {...inp} value={evalForm.venue} onChange={e => setEvalForm(f => ({ ...f, venue: e.target.value }))} placeholder="Police Headquarters Conference Room..." /></div>
                    </div>
                    <div style={{ marginBottom: 14 }}>{label('Overall Observations')}<textarea {...ta} value={evalForm.overall_observations} onChange={e => setEvalForm(f => ({ ...f, overall_observations: e.target.value }))} /></div>
                    <div style={{ marginBottom: 14, padding: 12, background: '#F8FAFD', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)' }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gov-navy)', marginBottom: 8 }}>Add Committee Chairman / First Member</p>
                      <div style={row3}>
                        <div>{label('Name', true)}<input {...inp} value={memberForm.member_name} onChange={e => setMemberForm(f => ({ ...f, member_name: e.target.value }))} placeholder="Officer Name" /></div>
                        <div>{label('Designation')}<input {...inp} value={memberForm.designation} onChange={e => setMemberForm(f => ({ ...f, designation: e.target.value }))} placeholder="Superintendent of Police" /></div>
                        <div>
                          {label('Role')}
                          <select {...sel} value={memberForm.role} onChange={e => setMemberForm(f => ({ ...f, role: e.target.value }))}>
                            <option value="CHAIRMAN">CHAIRMAN</option>
                            <option value="MEMBER">MEMBER</option>
                            <option value="TECHNICAL_EXPERT">TECHNICAL_EXPERT</option>
                            <option value="OBSERVER">OBSERVER</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <button onClick={handleCreateTechEval} disabled={saving || !selectedEvent || selectedEvent.status !== 'TECHNICAL_EVALUATION'} className="btn btn-primary btn-sm">
                      {saving ? 'Creating...' : <><Plus size={12} /> Create Technical Evaluation</>}
                    </button>
                    {selectedEvent && selectedEvent.status !== 'TECHNICAL_EVALUATION' && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--gov-warning)', marginTop: 8 }}>
                        Event must be in TECHNICAL_EVALUATION status. Current: {selectedEvent.status as string}
                      </p>
                    )}
                  </GovCard>
                ) : (
                  <>
                    <GovCard title={`Technical Evaluation — ${techEval.status as string}`}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                        {[['Date', techEval.evaluation_date], ['Demo Date', techEval.demo_date], ['Venue', techEval.venue]].map(([l, v]) => (
                          <div key={String(l)} style={{ padding: '8px 12px', background: '#F8FAFD', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)' }}>
                            <div style={{ fontSize: '0.68rem', color: 'var(--gov-muted)', textTransform: 'uppercase' }}>{String(l)}</div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gov-navy)', marginTop: 2 }}>{String(v ?? '—')}</div>
                          </div>
                        ))}
                      </div>
                      {(techEval.committee as unknown[])?.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gov-text-sec)', marginBottom: 6, textTransform: 'uppercase' }}>Committee</p>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {(techEval.committee as Record<string, unknown>[]).map((m, i) => (
                              <span key={i} style={{ fontSize: '0.75rem', padding: '3px 10px', background: '#EEF1F6', borderRadius: 'var(--r-sm)', color: 'var(--gov-navy)' }}>
                                <strong>{m.role as string}</strong>: {m.name as string}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </GovCard>

                    {/* Qualify bids */}
                    {bids.length > 0 && (
                      <GovCard title="Technical Qualification Decision" noPadding>
                        <div style={{ padding: '6px 14px', background: 'var(--gov-warning-bg)', borderBottom: '1px solid var(--gov-border)', fontSize: '0.72rem', color: '#7a5500' }}>
                          Officer must set qualification status for each bid. Only QUALIFIED bids proceed to financial evaluation.
                        </div>
                        <table className="gov-table">
                          <thead><tr><th>Company</th><th style={{ textAlign: 'right' }}>Amount</th><th>Offered Spec</th><th>Current Status</th><th>Set Status</th></tr></thead>
                          <tbody>
                            {bids.map(b => (
                              <tr key={b.id as string}>
                                <td style={{ fontSize: '0.8rem', fontWeight: 500 }}>{b.company_name as string}</td>
                                <td style={{ textAlign: 'right', fontSize: '0.78rem' }}>
                                  {b.bid_amount_inr ? `₹${(b.bid_amount_inr as number).toLocaleString('en-IN')}` : '—'}
                                </td>
                                <td style={{ fontSize: '0.72rem', color: 'var(--gov-text-sec)', maxWidth: 200 }}>
                                  {(b.offered_specification as string)?.slice(0, 80) || '—'}
                                </td>
                                <td>
                                  <span style={{
                                    fontSize: '0.65rem', fontWeight: 700, padding: '1px 7px', borderRadius: 'var(--r-sm)',
                                    background: b.technical_qualification_status === 'QUALIFIED' ? 'var(--gov-success-bg)' : b.technical_qualification_status === 'NOT_QUALIFIED' ? 'var(--gov-danger-bg)' : 'var(--gov-warning-bg)',
                                    color: b.technical_qualification_status === 'QUALIFIED' ? 'var(--gov-success)' : b.technical_qualification_status === 'NOT_QUALIFIED' ? 'var(--gov-danger)' : 'var(--gov-warning)',
                                  }}>{b.technical_qualification_status as string}</span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button onClick={() => handleQualifyBid(techEval.id as string, b.id as string, 'QUALIFIED')} disabled={saving} className="btn btn-sm btn-success" style={{ padding: '2px 8px', fontSize: '0.68rem' }}>
                                      Qualify
                                    </button>
                                    <button onClick={() => handleQualifyBid(techEval.id as string, b.id as string, 'NOT_QUALIFIED')} disabled={saving} className="btn btn-sm btn-danger" style={{ padding: '2px 8px', fontSize: '0.68rem' }}>
                                      Disqualify
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ padding: '8px 14px', background: '#F8FAFD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--gov-text-sec)' }}>
                            Qualified: {qualifiedBids.length} / {bids.length}
                          </span>
                          <button onClick={() => handleEventStatus('FINANCIAL_EVALUATION')} disabled={saving || qualifiedBids.length === 0} className="btn btn-sm btn-primary">
                            Move to Financial Evaluation →
                          </button>
                        </div>
                      </GovCard>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── TAB: FINANCIAL EVALUATION ── */}
            {tab === 'fin-eval' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ ...NOTICE }}>
                  Financial bids are opened only for technically qualified bidders. L1 is the lowest eligible bid.
                  PRISM-PY computes the comparative statement — the final decision rests with the authorised officer.
                </div>

                {!finEval ? (
                  <GovCard title="Create Financial Evaluation">
                    <p style={{ fontSize: '0.82rem', color: 'var(--gov-text-sec)', marginBottom: 12 }}>
                      {qualifiedBids.length} technically qualified bids will be included in the comparative statement.
                    </p>
                    <button onClick={handleCreateFinEval} disabled={saving || !selectedEvent || selectedEvent.status !== 'FINANCIAL_EVALUATION' || qualifiedBids.length === 0} className="btn btn-primary btn-sm">
                      {saving ? 'Computing...' : <><BarChart2 size={12} /> Compute Comparative Statement</>}
                    </button>
                    {qualifiedBids.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--gov-danger)', marginTop: 8 }}>No qualified bids found. Complete technical evaluation first.</p>}
                  </GovCard>
                ) : (
                  <>
                    {/* L1 highlight */}
                    {finEval.l1_amount_inr ? (
                      <div style={{ padding: '14px 18px', background: 'var(--gov-success-bg)', border: '1px solid #b7dfc7', borderLeft: '4px solid var(--gov-success)', borderRadius: '0 var(--r-md) var(--r-md) 0' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gov-success)', fontWeight: 700, marginBottom: 3 }}>L1 — Lowest Eligible Bid (Officer Confirmed)</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gov-navy)' }}>INR {(finEval.l1_amount_inr as number).toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gov-text-sec)', marginTop: 4 }}>Recorded by: {finEval.l1_identified_by as string}</div>
                      </div>
                    ) : (
                      <div style={{ padding: 14, background: 'var(--gov-warning-bg)', border: '1px solid #f0d060', borderRadius: 'var(--r-sm)' }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gov-warning)', marginBottom: 8 }}>Comparative statement computed. Officer must confirm L1.</p>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                          <div>
                            {label('Select L1 Bid', true)}
                            <select {...sel} value={l1BidId} onChange={e => setL1BidId(e.target.value)} style={{ minWidth: 260 }}>
                              <option value="">— Select the L1 bid —</option>
                              {qualifiedBids.map(b => (
                                <option key={b.id as string} value={b.id as string}>
                                  {b.company_name as string} — INR {b.bid_amount_inr ? (b.bid_amount_inr as number).toLocaleString('en-IN') : 'N/A'}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button onClick={handleRecordL1} disabled={saving || !l1BidId} className="btn btn-primary btn-sm">
                            {saving ? 'Recording...' : 'Confirm L1 Determination'}
                          </button>
                        </div>
                      </div>
                    )}

                    <GovCard title="Comparative Statement" noPadding>
                      <table className="gov-table">
                        <thead><tr><th>Rank</th><th>Company</th><th style={{ textAlign: 'right' }}>Bid Amount (INR)</th><th>Technically Qualified</th><th>L1</th></tr></thead>
                        <tbody>
                          {((finEval.comparative_statement as Record<string, unknown>)?.qualified_bids as Record<string, unknown>[])?.map((b, i) => (
                            <tr key={i} style={{ background: b.is_l1 ? 'var(--gov-success-bg)' : 'transparent' }}>
                              <td style={{ fontSize: '0.82rem', fontWeight: 700 }}>#{b.rank as number}</td>
                              <td style={{ fontSize: '0.82rem', fontWeight: b.is_l1 ? 700 : 400 }}>{b.company as string}</td>
                              <td style={{ textAlign: 'right', fontSize: '0.85rem', fontWeight: 600 }}>{(b.amount_inr as number)?.toLocaleString('en-IN')}</td>
                              <td><span className="badge badge-approved" style={{ fontSize: '0.62rem' }}>Qualified</span></td>
                              <td>{Boolean(b.is_l1) && <span style={{ background: 'var(--gov-success)', color: 'white', padding: '1px 8px', borderRadius: 'var(--r-sm)', fontSize: '0.65rem', fontWeight: 700 }}>L1</span>}</td>
                            </tr>
                          ))}
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

            {/* ── TAB: PURCHASE ORDER ── */}
            {tab === 'po' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ ...NOTICE }}>
                  Record the Purchase Order details after the award decision. PRISM-PY does not generate or place orders.
                  All procurement must be transacted through the official GeM portal or applicable procurement process.
                </div>

                {purchaseOrders.length > 0 && (
                  purchaseOrders.map(po => (
                    <GovCard key={po.id as string} title={`Purchase Order — ${po.po_number as string || po.gem_order_number as string || 'Recorded'}`}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                        {[
                          ['PO Number', po.po_number], ['GeM Order Number', po.gem_order_number], ['Vendor', po.vendor_name],
                          ['Quantity', po.quantity], ['Total Amount (INR)', po.total_amount_inr ? (po.total_amount_inr as number).toLocaleString('en-IN') : '—'],
                          ['PO Date', po.po_date], ['Expected Delivery', po.expected_delivery_date], ['Actual Delivery', po.actual_delivery_date || '—'], ['Status', po.status],
                        ].map(([l, v]) => (
                          <div key={String(l)} style={{ padding: '8px 12px', background: '#F8FAFD', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-sm)' }}>
                            <div style={{ fontSize: '0.68rem', color: 'var(--gov-muted)', textTransform: 'uppercase' }}>{String(l)}</div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gov-navy)', marginTop: 2 }}>{String(v ?? '—')}</div>
                          </div>
                        ))}
                      </div>
                    </GovCard>
                  ))
                )}

                {purchaseOrders.length === 0 && (
                  <GovCard title="Record Purchase Order">
                    <div style={row3}>
                      <div>{label('PO Number')}<input {...inp} value={poForm.po_number} onChange={e => setPOForm(f => ({ ...f, po_number: e.target.value }))} placeholder="PO/PDY/2024/001" /></div>
                      <div>{label('GeM Order Number')}<input {...inp} value={poForm.gem_order_number} onChange={e => setPOForm(f => ({ ...f, gem_order_number: e.target.value }))} placeholder="GEMC-..." /></div>
                      <div>{label('Vendor Name', true)}<input {...inp} value={poForm.vendor_name} onChange={e => setPOForm(f => ({ ...f, vendor_name: e.target.value }))} placeholder="Vendor name (reference)" /></div>
                      <div>{label('Quantity')}<input {...inp} value={poForm.quantity} onChange={e => setPOForm(f => ({ ...f, quantity: e.target.value }))} /></div>
                      <div>{label('Total Amount (INR)', true)}<input {...inp} type="number" value={poForm.total_amount_inr} onChange={e => setPOForm(f => ({ ...f, total_amount_inr: e.target.value }))} /></div>
                      <div>{label('PO Date')}<input {...inp} type="date" value={poForm.po_date} onChange={e => setPOForm(f => ({ ...f, po_date: e.target.value }))} /></div>
                      <div>{label('Expected Delivery Date')}<input {...inp} type="date" value={poForm.expected_delivery_date} onChange={e => setPOForm(f => ({ ...f, expected_delivery_date: e.target.value }))} /></div>
                      <div>{label('Delivery Location')}<input {...inp} value={poForm.delivery_location} onChange={e => setPOForm(f => ({ ...f, delivery_location: e.target.value }))} placeholder="Police Headquarters..." /></div>
                    </div>
                    <div style={{ marginBottom: 14 }}>{label('Inspection / Acceptance Note')}<textarea {...ta} value={poForm.inspection_note} onChange={e => setPOForm(f => ({ ...f, inspection_note: e.target.value }))} /></div>
                    <button onClick={handleCreatePO} disabled={saving || !poForm.vendor_name || !poForm.total_amount_inr} className="btn btn-primary btn-sm">
                      {saving ? 'Recording...' : <><Plus size={12} /> Record Purchase Order</>}
                    </button>
                  </GovCard>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

export default function ProcurementWorkflowPage() {
  return (
    <Suspense fallback={<AppLayout><div className="gov-page"><LoadingSpinner /></div></AppLayout>}>
      <WorkflowContent />
    </Suspense>
  );
}
