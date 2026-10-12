import React from 'react';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT:                    { label: 'Draft',             bg: '#f1f5f9', text: '#475569' },
  ANALYZING:                { label: 'Analyzing',         bg: '#eff6ff', text: '#1d4ed8' },
  ANALYSIS_COMPLETE:        { label: 'Analysis Complete', bg: '#f0fdf4', text: '#16a34a' },
  SUBMITTED_FOR_REVIEW:     { label: 'Submitted',         bg: '#eff6ff', text: '#1d4ed8' },
  RETURNED_FOR_MODIFICATION:{ label: 'Returned',          bg: '#fef3c7', text: '#92400e' },
  RESUBMITTED:              { label: 'Resubmitted',       bg: '#eff6ff', text: '#1d4ed8' },
  UNDER_REVIEW:             { label: 'Under Review',      bg: '#faf5ff', text: '#7e22ce' },
  APPROVED:                 { label: 'Approved',          bg: '#f0fdf4', text: '#15803d' },
  REJECTED:                 { label: 'Rejected',          bg: '#fef2f2', text: '#b91c1c' },
  PROCUREMENT:              { label: 'Procurement',       bg: '#fff7ed', text: '#c2410c' },
  IMPLEMENTATION:           { label: 'Implementation',   bg: '#f0fdfa', text: '#0f766e' },
  COMPLETED:                { label: 'Completed',         bg: '#f0fdf4', text: '#166534' },
  CLOSED:                   { label: 'Closed',            bg: '#f1f5f9', text: '#64748b' },
  ARCHIVED:                 { label: 'Archived',          bg: '#f1f5f9', text: '#94a3b8' },
  // Generic statuses
  HIGH:    { label: 'High',    bg: '#fef2f2', text: '#b91c1c' },
  NORMAL:  { label: 'Normal',  bg: '#f1f5f9', text: '#475569' },
  LOW:     { label: 'Low',     bg: '#f0fdf4', text: '#16a34a' },
  URGENT:  { label: 'Urgent',  bg: '#fef2f2', text: '#7f1d1d' },
  PASS:    { label: 'Pass',    bg: '#f0fdf4', text: '#15803d' },
  WARNING: { label: 'Warning', bg: '#fef3c7', text: '#92400e' },
  FAIL:    { label: 'Fail',    bg: '#fef2f2', text: '#b91c1c' },
  SUCCESS: { label: 'Success', bg: '#f0fdf4', text: '#15803d' },
};

export default function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'xs' }) {
  const config = STATUS_CONFIG[status?.toUpperCase?.()] || { label: status, bg: '#f1f5f9', text: '#475569' };
  const pad = size === 'xs' ? '1px 6px' : '2px 8px';
  const fontSize = size === 'xs' ? '10px' : '11px';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: pad,
        borderRadius: '3px',
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
        background: config.bg,
        color: config.text,
      }}
    >
      {config.label}
    </span>
  );
}
