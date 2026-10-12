'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import SyntheticBanner from '@/components/ui/SyntheticBanner';
import { proposals } from '@/lib/api';

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEPS = [
  { num: 1 as Step, label: 'Basic Information' },
  { num: 2 as Step, label: 'Requirement' },
  { num: 3 as Step, label: 'Budget' },
  { num: 4 as Step, label: 'Technical' },
  { num: 5 as Step, label: 'Documents' },
  { num: 6 as Step, label: 'Review & Submit' },
];

const CATEGORIES = ['technology', 'infrastructure', 'procurement', 'training', 'vehicles', 'communication', 'operational', 'administrative', 'welfare', 'other'];
const REGIONS = ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'];
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

interface FormData {
  title: string;
  description: string;
  department: string;
  unit: string;
  category: string;
  priority: string;
  region: string;
  station: string;
  expected_completion_date: string;
  purpose: string;
  problem_statement: string;
  expected_outcome: string;
  quantity: string;
  unit_of_measure: string;
  estimated_cost: string;
  cost_basis: string;
  funding_source: string;
  technology: string;
  specification: string;
}

function Field({ label, required, children, note }: { label: string; required?: boolean; children: React.ReactNode; note?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      {children}
      {note && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{note}</p>}
    </div>
  );
}

const inp = {
  width: '100%',
  padding: '7px 10px',
  border: '1px solid #d1d5db',
  borderRadius: 3,
  fontSize: 13,
  outline: 'none',
  background: 'white',
} as const;

const textarea = { ...inp, minHeight: 80, resize: 'vertical' as const };
const sel = { ...inp };

export default function NewProposalPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormData>({
    title: '', description: '', department: '', unit: '', category: 'technology',
    priority: 'NORMAL', region: 'Puducherry', station: '', expected_completion_date: '',
    purpose: '', problem_statement: '', expected_outcome: '', quantity: '', unit_of_measure: '',
    estimated_cost: '', cost_basis: '', funding_source: '',
    technology: '', specification: '',
  });

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (action: 'draft' | 'submit') => {
    setSubmitting(true);
    setError('');
    try {
      const payload: Record<string, unknown> = { ...form };
      if (form.estimated_cost) payload.estimated_cost = parseFloat(form.estimated_cost);
      const res = await proposals.create(payload);
      const id = res.proposal.id;
      if (action === 'submit') {
        await proposals.submit(id, 'Submitted via proposal wizard');
      }
      router.push(`/proposals/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create proposal');
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return !!(form.title && form.department && form.category);
    if (step === 2) return !!(form.purpose && form.problem_statement);
    return true;
  };

  return (
    <AppLayout>
      <div style={{ padding: '16px 20px', maxWidth: 800 }}>
        <SyntheticBanner />
        <div style={{ marginTop: 14, marginBottom: 20 }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1a2744', margin: 0 }}>New Proposal</h1>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>Complete all steps to create a proposal</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', marginBottom: 24, background: 'white', border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
          {STEPS.map((s, i) => {
            const done = step > s.num;
            const active = step === s.num;
            return (
              <div
                key={s.num}
                style={{
                  flex: 1,
                  padding: '10px 6px',
                  textAlign: 'center',
                  background: active ? '#1a2744' : done ? '#f0fdf4' : '#f8f9fa',
                  borderRight: i < STEPS.length - 1 ? '1px solid #e5e7eb' : 'none',
                  cursor: done ? 'pointer' : 'default',
                }}
                onClick={() => done && setStep(s.num)}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: active ? 'white' : done ? '#16a34a' : '#9ca3af' }}>
                  {done ? <Check size={12} style={{ display: 'inline' }} /> : s.num}
                </div>
                <div style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.8)' : done ? '#15803d' : '#9ca3af', marginTop: 2 }}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Form content */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 4, padding: 20 }}>
          {/* Step 1 */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a2744', marginBottom: 16 }}>Basic Information</h3>
              <Field label="Proposal Title" required note="Use a clear, descriptive title that identifies the requirement">
                <input style={inp} value={form.title} onChange={set('title')} placeholder="e.g. CCTV Expansion — North Station" />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Department" required>
                  <input style={inp} value={form.department} onChange={set('department')} placeholder="e.g. Technical Wing" />
                </Field>
                <Field label="Unit">
                  <input style={inp} value={form.unit} onChange={set('unit')} placeholder="e.g. Surveillance" />
                </Field>
                <Field label="Category" required>
                  <select style={sel} value={form.category} onChange={set('category')}>
                    {CATEGORIES.map((c) => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Priority">
                  <select style={sel} value={form.priority} onChange={set('priority')}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Region">
                  <select style={sel} value={form.region} onChange={set('region')}>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Police Station / Location">
                  <input style={inp} value={form.station} onChange={set('station')} placeholder="e.g. Puducherry Central Station" />
                </Field>
              </div>
              <Field label="Expected Completion Date">
                <input type="date" style={inp} value={form.expected_completion_date} onChange={set('expected_completion_date')} />
              </Field>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a2744', marginBottom: 16 }}>Requirement Details</h3>
              <Field label="Purpose / Objective" required note="What operational objective will this proposal achieve?">
                <textarea style={textarea} value={form.purpose} onChange={set('purpose')} placeholder="Describe the operational objective..." />
              </Field>
              <Field label="Problem Statement" required note="Describe the operational gap or problem this proposal addresses">
                <textarea style={textarea} value={form.problem_statement} onChange={set('problem_statement')} placeholder="Describe the current problem or gap..." />
              </Field>
              <Field label="Expected Outcome" note="Describe measurable outcomes and success criteria">
                <textarea style={textarea} value={form.expected_outcome} onChange={set('expected_outcome')} placeholder="Describe expected benefits and outcomes..." />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Quantity">
                  <input style={inp} value={form.quantity} onChange={set('quantity')} placeholder="e.g. 10 units" />
                </Field>
                <Field label="Unit of Measure">
                  <input style={inp} value={form.unit_of_measure} onChange={set('unit_of_measure')} placeholder="e.g. cameras, handsets, workshops" />
                </Field>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a2744', marginBottom: 16 }}>Budget Information</h3>
              <Field label="Estimated Cost (INR)" note="Provide your best estimate with basis. PRISM-PY will compare against historical records.">
                <input type="number" style={inp} value={form.estimated_cost} onChange={set('estimated_cost')} placeholder="e.g. 450000" />
              </Field>
              <Field label="Cost Basis" note="How was this estimate derived?">
                <textarea style={{ ...textarea, minHeight: 60 }} value={form.cost_basis} onChange={set('cost_basis')} placeholder="e.g. Based on quotations from previous similar procurement..." />
              </Field>
              <Field label="Funding Source">
                <input style={inp} value={form.funding_source} onChange={set('funding_source')} placeholder="e.g. State Police Budget 2024-25, MHA Grant" />
              </Field>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a2744', marginBottom: 16 }}>Technical Requirements</h3>
              <Field label="Technology / Equipment Type" note="Specify the technology category for specification intelligence and GeM search">
                <input style={inp} value={form.technology} onChange={set('technology')} placeholder="e.g. IP CCTV cameras, Digital handheld radios, Body-worn cameras" />
              </Field>
              <Field label="Technical Specification" note="Minimum technical requirements. Avoid specifying a brand — specify technical parameters only.">
                <textarea style={{ ...textarea, minHeight: 120 }} value={form.specification} onChange={set('specification')} placeholder="e.g. 4MP IP camera; H.265; 30m IR range; ONVIF compliant; PoE; 30-day NVR retention..." />
              </Field>
            </div>
          )}

          {/* Step 5 */}
          {step === 5 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a2744', marginBottom: 16 }}>Supporting Documents</h3>
              <div style={{ padding: 20, background: '#f8f9fa', border: '1px dashed #d1d5db', borderRadius: 4, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#6b7280' }}>
                  Document upload is available after the proposal is saved.
                </p>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                  Supported formats: PDF, DOCX, XLSX, PPTX, TXT (max 25 MB each)
                </p>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                  Proceed to save the proposal, then upload documents from the proposal detail page.
                </p>
              </div>
            </div>
          )}

          {/* Step 6 — Review */}
          {step === 6 && (
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1a2744', marginBottom: 16 }}>Review & Submit</h3>
              <div style={{ background: '#f8f9fa', border: '1px solid #e5e7eb', borderRadius: 3, padding: 14, marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <tbody>
                    {[
                      ['Title', form.title],
                      ['Department', form.department],
                      ['Category', form.category],
                      ['Priority', form.priority],
                      ['Region', form.region],
                      ['Station', form.station],
                      ['Purpose', form.purpose],
                      ['Problem Statement', form.problem_statement],
                      ['Quantity', form.quantity],
                      ['Estimated Cost', form.estimated_cost ? `INR ${Number(form.estimated_cost).toLocaleString('en-IN')}` : '—'],
                      ['Technology', form.technology],
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <td style={{ padding: '4px 8px', fontWeight: 600, color: '#374151', width: 160, verticalAlign: 'top' }}>{label}</td>
                        <td style={{ padding: '4px 8px', color: value ? '#1a2744' : '#9ca3af' }}>{value || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {error && (
                <div style={{ display: 'flex', gap: 8, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 3, marginBottom: 14 }}>
                  <AlertCircle size={14} color="#dc2626" />
                  <span style={{ fontSize: 12, color: '#b91c1c' }}>{error}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => handleSubmit('draft')}
                  disabled={submitting}
                  style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 3, background: 'white', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                >
                  {submitting ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  onClick={() => handleSubmit('submit')}
                  disabled={submitting || !form.title}
                  style={{ padding: '8px 16px', border: 'none', borderRadius: 3, background: '#1a2744', color: 'white', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                >
                  {submitting ? 'Submitting...' : 'Save & Submit for Review'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        {step !== 6 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
            <button
              onClick={() => setStep((s) => (s > 1 ? (s - 1) as Step : s))}
              disabled={step === 1}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid #d1d5db', borderRadius: 3, background: 'white', cursor: step === 1 ? 'not-allowed' : 'pointer', fontSize: 12, color: step === 1 ? '#9ca3af' : '#374151' }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              onClick={() => setStep((s) => (s < 6 ? (s + 1) as Step : s))}
              disabled={!canProceed()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: 'none', borderRadius: 3, background: canProceed() ? '#1a2744' : '#9ca3af', color: 'white', cursor: canProceed() ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 600 }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
