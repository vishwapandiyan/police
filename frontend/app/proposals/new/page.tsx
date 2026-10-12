'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import PageHeader from '@/components/ui/PageHeader';
import { proposals } from '@/lib/api';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const STEPS: { num: Step; label: string; desc: string }[] = [
  { num: 1, label: '1. Identification',    desc: 'Basic proposal details' },
  { num: 2, label: '2. Requirement',       desc: 'What is needed' },
  { num: 3, label: '3. Specification',     desc: 'Technical requirements' },
  { num: 4, label: '4. Justification',     desc: 'Why it is required' },
  { num: 5, label: '5. Financial',         desc: 'Budget information' },
  { num: 6, label: '6. Documents',         desc: 'Supporting documents' },
  { num: 7, label: '7. Review',            desc: 'Check and submit' },
];

const CATEGORIES = ['technology', 'infrastructure', 'procurement', 'training', 'vehicles', 'communication', 'operational', 'administrative', 'welfare', 'other'];
const REGIONS    = ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'];

interface Form {
  title: string; department: string; unit: string; category: string;
  priority: string; region: string; station: string; expected_completion_date: string;
  purpose: string; problem_statement: string; expected_outcome: string;
  quantity: string; unit_of_measure: string;
  technology: string; specification: string;
  justification: string; operational_need: string; expected_benefit: string;
  estimated_cost: string; cost_basis: string; funding_source: string;
}

const INIT: Form = {
  title: '', department: '', unit: '', category: 'technology',
  priority: 'NORMAL', region: 'Puducherry', station: '', expected_completion_date: '',
  purpose: '', problem_statement: '', expected_outcome: '',
  quantity: '', unit_of_measure: '',
  technology: '', specification: '',
  justification: '', operational_need: '', expected_benefit: '',
  estimated_cost: '', cost_basis: '', funding_source: '',
};

function FormSection({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid var(--gov-border)' }}>
        <span style={{ background: 'var(--gov-navy)', color: 'white', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>
          {num}
        </span>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--gov-navy)', margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="form-label">
        {label}{required && <span className="req"> *</span>}
      </label>
      {children}
      {hint && <p className="form-hint">{hint}</p>}
    </div>
  );
}

export default function NewProposalPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Form>(INIT);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const canNext = () => {
    if (step === 1) return !!(form.title && form.department && form.category);
    if (step === 2) return !!(form.purpose && form.problem_statement);
    return true;
  };

  const handleAction = async (action: 'draft' | 'submit') => {
    setSubmitting(true); setError('');
    try {
      const body: Record<string, unknown> = {
        title: form.title, description: form.purpose, department: form.department,
        unit: form.unit, category: form.category, priority: form.priority,
        region: form.region, station: form.station,
        expected_completion_date: form.expected_completion_date,
        purpose: form.purpose, problem_statement: form.problem_statement,
        expected_outcome: form.expected_outcome, quantity: form.quantity,
        unit_of_measure: form.unit_of_measure, technology: form.technology,
        specification: form.specification, cost_basis: form.cost_basis,
        funding_source: form.funding_source,
      };
      if (form.estimated_cost) body.estimated_cost = parseFloat(form.estimated_cost);
      const res = await proposals.create(body);
      if (action === 'submit') await proposals.submit(res.proposal.id, 'Submitted via proposal creation form');
      router.push(`/proposals/${res.proposal.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create proposal');
      setSubmitting(false);
    }
  };

  const reviewRows = [
    ['Proposal Title', form.title],
    ['Department', form.department],
    ['Unit', form.unit],
    ['Category', form.category],
    ['Priority', form.priority],
    ['Region', form.region],
    ['Station / Location', form.station],
    ['Expected Completion', form.expected_completion_date],
    ['Purpose', form.purpose],
    ['Problem Statement', form.problem_statement],
    ['Expected Outcome', form.expected_outcome],
    ['Quantity', form.quantity],
    ['Technology / Equipment', form.technology],
    ['Estimated Cost (INR)', form.estimated_cost ? `₹ ${Number(form.estimated_cost).toLocaleString('en-IN')}` : ''],
    ['Funding Source', form.funding_source],
  ].filter(([, v]) => v);

  return (
    <AppLayout>
      <div className="gov-page" style={{ maxWidth: 860 }}>
        <SyntheticBanner />
        <PageHeader
          title="New Proposal"
          subtitle="Complete the form to create a departmental proposal"
          breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Proposals', href: '/proposals' }, { label: 'New Proposal' }]}
        />

        {/* Step indicator */}
        <div style={{ display: 'flex', background: 'white', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-md)', overflow: 'hidden', marginBottom: 20 }}>
          {STEPS.map((s, i) => {
            const done   = step > s.num;
            const active = step === s.num;
            return (
              <button
                key={s.num}
                onClick={() => done && setStep(s.num)}
                style={{
                  flex: 1, padding: '10px 6px', border: 'none', borderRight: i < STEPS.length - 1 ? '1px solid var(--gov-border)' : 'none',
                  background: active ? 'var(--gov-navy)' : done ? '#EEF6F1' : '#F8FAFD',
                  cursor: done ? 'pointer' : 'default',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: active ? 'white' : done ? 'var(--gov-success)' : 'var(--gov-muted)', marginBottom: 2 }}>
                  {done ? <Check size={12} style={{ display: 'inline' }} /> : s.num}
                </div>
                <div style={{ fontSize: '0.65rem', color: active ? 'rgba(255,255,255,0.85)' : done ? '#1a7a3c' : 'var(--gov-muted)', lineHeight: 1.2 }}>
                  {s.label.replace(/^\d+\. /, '')}
                </div>
              </button>
            );
          })}
        </div>

        {/* Form body */}
        <div style={{ background: 'white', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-md)', padding: 24 }}>

          {step === 1 && (
            <FormSection num="1" title="Proposal Identification">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
                <Field label="Proposal Title" required hint="Use a concise, descriptive title that clearly identifies the requirement.">
                  <input className="gov-input" value={form.title} onChange={set('title')} placeholder="e.g. CCTV Modernisation — Grand Bazaar Police Station" />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Department" required>
                    <input className="gov-input" value={form.department} onChange={set('department')} placeholder="e.g. Technical Wing" />
                  </Field>
                  <Field label="Unit">
                    <input className="gov-input" value={form.unit} onChange={set('unit')} placeholder="e.g. Surveillance Unit" />
                  </Field>
                  <Field label="Category" required>
                    <select className="gov-select" value={form.category} onChange={set('category')}>
                      {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Priority">
                    <select className="gov-select" value={form.priority} onChange={set('priority')}>
                      {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                  <Field label="Region">
                    <select className="gov-select" value={form.region} onChange={set('region')}>
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </Field>
                  <Field label="Police Station / Location">
                    <input className="gov-input" value={form.station} onChange={set('station')} placeholder="e.g. Grand Bazaar Police Station" />
                  </Field>
                </div>
                <Field label="Expected Completion Date">
                  <input type="date" className="gov-input" value={form.expected_completion_date} onChange={set('expected_completion_date')} />
                </Field>
              </div>
            </FormSection>
          )}

          {step === 2 && (
            <FormSection num="2" title="Requirement">
              <Field label="Purpose / Objective" required hint="What operational objective will this proposal achieve?">
                <textarea className="gov-textarea" value={form.purpose} onChange={set('purpose')} placeholder="Describe the operational objective clearly..." />
              </Field>
              <Field label="Problem Statement" required hint="Describe the operational gap, problem or deficiency this proposal addresses.">
                <textarea className="gov-textarea" value={form.problem_statement} onChange={set('problem_statement')} placeholder="Describe the current problem or deficiency..." />
              </Field>
              <Field label="Expected Outcome" hint="Describe measurable outcomes and success criteria.">
                <textarea className="gov-textarea" value={form.expected_outcome} onChange={set('expected_outcome')} placeholder="Describe expected benefits and measurable outcomes..." />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Quantity">
                  <input className="gov-input" value={form.quantity} onChange={set('quantity')} placeholder="e.g. 10" />
                </Field>
                <Field label="Unit of Measure">
                  <input className="gov-input" value={form.unit_of_measure} onChange={set('unit_of_measure')} placeholder="e.g. cameras, handsets, workshops" />
                </Field>
              </div>
            </FormSection>
          )}

          {step === 3 && (
            <FormSection num="3" title="Technical Specification">
              <Field label="Technology / Equipment / System" hint="Specify the technology category. This is used for specification intelligence and GeM search.">
                <input className="gov-input" value={form.technology} onChange={set('technology')} placeholder="e.g. IP CCTV cameras, Digital handheld radios, Body-worn cameras" />
              </Field>
              <Field label="Technical Requirements" hint="Minimum technical specifications. Do not specify a particular brand — use technical parameters only.">
                <textarea className="gov-textarea" style={{ minHeight: 120 }} value={form.specification} onChange={set('specification')} placeholder="e.g. Minimum 4MP IP cameras; H.265 compression; 30m IR range; ONVIF compliant; PoE enabled; 30-day NVR retention..." />
              </Field>
            </FormSection>
          )}

          {step === 4 && (
            <FormSection num="4" title="Justification">
              <Field label="Operational Need" hint="Why is this required from an operational standpoint?">
                <textarea className="gov-textarea" value={form.operational_need} onChange={set('operational_need')} placeholder="Describe the operational need..." />
              </Field>
              <Field label="Expected Benefit" hint="What measurable improvement will this deliver?">
                <textarea className="gov-textarea" value={form.expected_benefit} onChange={set('expected_benefit')} placeholder="Describe expected operational benefits..." />
              </Field>
            </FormSection>
          )}

          {step === 5 && (
            <FormSection num="5" title="Financial Information">
              <Field label="Indicative / Estimated Cost (INR)" hint="Provide your best estimate. PRISM-PY will compare against historical records.">
                <input type="number" className="gov-input" value={form.estimated_cost} onChange={set('estimated_cost')} placeholder="e.g. 450000" />
              </Field>
              <Field label="Cost Basis" hint="How was this estimate derived?">
                <textarea className="gov-textarea" style={{ minHeight: 60 }} value={form.cost_basis} onChange={set('cost_basis')} placeholder="e.g. Based on quotations obtained from previous similar procurement in 2023-24..." />
              </Field>
              <Field label="Funding Source / Budget Head">
                <input className="gov-input" value={form.funding_source} onChange={set('funding_source')} placeholder="e.g. State Police Budget 2025-26, MHA Modernisation Grant" />
              </Field>
            </FormSection>
          )}

          {step === 6 && (
            <FormSection num="6" title="Supporting Documents">
              <div style={{ padding: 20, background: '#F8FAFD', border: '1px dashed var(--gov-border)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--gov-text-sec)', marginBottom: 6 }}>
                  Document upload is available after the proposal is saved.
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--gov-muted)' }}>
                  Supported formats: PDF, DOCX, XLSX, PPTX, TXT (maximum 25 MB per file)
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gov-muted)', marginTop: 6 }}>
                  Proceed to save the proposal, then upload documents from the proposal detail page.
                </p>
              </div>
            </FormSection>
          )}

          {step === 7 && (
            <FormSection num="7" title="Review & Submit">
              <div style={{ background: '#F8FAFD', border: '1px solid var(--gov-border)', borderRadius: 'var(--r-md)', padding: 16, marginBottom: 18 }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gov-navy)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Proposal Summary
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <tbody>
                    {reviewRows.map(([label, value]) => (
                      <tr key={label} style={{ borderBottom: '1px solid var(--gov-border)' }}>
                        <td style={{ padding: '5px 8px', fontWeight: 600, color: 'var(--gov-text-sec)', width: 200, verticalAlign: 'top' }}>{label}</td>
                        <td style={{ padding: '5px 8px', color: 'var(--gov-text)' }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {error && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', background: 'var(--gov-danger-bg)', border: '1px solid #f5c6c2', borderRadius: 'var(--r-md)', marginBottom: 14, fontSize: '0.8rem', color: 'var(--gov-danger)' }}>
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => handleAction('draft')} disabled={submitting} className="btn btn-secondary">
                  {submitting ? 'Saving...' : 'Save as Draft'}
                </button>
                <button onClick={() => handleAction('submit')} disabled={submitting || !form.title} className="btn btn-primary">
                  {submitting ? 'Submitting...' : 'Save & Submit for Review'}
                </button>
              </div>
            </FormSection>
          )}
        </div>

        {/* Navigation */}
        {step < 7 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
            <button
              onClick={() => setStep(s => (s > 1 ? (s - 1) as Step : s))}
              disabled={step === 1}
              className="btn btn-secondary"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              onClick={() => setStep(s => (s < 7 ? (s + 1) as Step : s))}
              disabled={!canNext()}
              className="btn btn-primary"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
