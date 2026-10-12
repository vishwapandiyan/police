import React from 'react';

const MAP: Record<string, { label: string; cls: string }> = {
  DRAFT:                     { label: 'Draft',             cls: 'badge-draft'    },
  ANALYZING:                 { label: 'Analyzing',         cls: 'badge-review'   },
  ANALYSIS_COMPLETE:         { label: 'Analysis Complete', cls: 'badge-impl'     },
  SUBMITTED_FOR_REVIEW:      { label: 'Submitted',         cls: 'badge-pending'  },
  RETURNED_FOR_MODIFICATION: { label: 'Returned',          cls: 'badge-returned' },
  RESUBMITTED:               { label: 'Resubmitted',       cls: 'badge-review'   },
  UNDER_REVIEW:              { label: 'Under Review',      cls: 'badge-review'   },
  APPROVED:                  { label: 'Approved',          cls: 'badge-approved' },
  REJECTED:                  { label: 'Rejected',          cls: 'badge-rejected' },
  PROCUREMENT:               { label: 'Procurement',       cls: 'badge-impl'     },
  IMPLEMENTATION:            { label: 'Implementation',    cls: 'badge-impl'     },
  COMPLETED:                 { label: 'Completed',         cls: 'badge-completed'},
  CLOSED:                    { label: 'Closed',            cls: 'badge-draft'    },
  ARCHIVED:                  { label: 'Archived',          cls: 'badge-draft'    },
  HIGH:                      { label: 'High',              cls: 'badge-high'     },
  NORMAL:                    { label: 'Normal',            cls: 'badge-normal'   },
  LOW:                       { label: 'Low',               cls: 'badge-low'      },
  URGENT:                    { label: 'Urgent',            cls: 'badge-urgent'   },
  PASS:                      { label: 'Pass',              cls: 'badge-pass'     },
  WARNING:                   { label: 'Warning',           cls: 'badge-warn'     },
  FAIL:                      { label: 'Fail',              cls: 'badge-fail'     },
  SUCCESS:                   { label: 'Success',           cls: 'badge-success'  },
  PENDING:                   { label: 'Pending',           cls: 'badge-pending'  },
  SUBMITTED:                 { label: 'Submitted',         cls: 'badge-review'   },
  RETURNED:                  { label: 'Returned',          cls: 'badge-returned' },
  NOT_STARTED:               { label: 'Not Started',       cls: 'badge-draft'    },
  IN_PROGRESS:               { label: 'In Progress',       cls: 'badge-review'   },
  DELAYED:                   { label: 'Delayed',           cls: 'badge-high'     },
  VERIFIED:                  { label: 'Verified',          cls: 'badge-completed'},
};

interface Props {
  status: string;
  size?: 'xs' | 'sm';
}

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const key = (status || '').toUpperCase().replace(/ /g, '_');
  const cfg = MAP[key] || { label: status, cls: 'badge-draft' };
  return (
    <span
      className={`badge ${cfg.cls}`}
      style={size === 'xs' ? { fontSize: '0.65rem', padding: '1px 6px' } : undefined}
    >
      {cfg.label}
    </span>
  );
}
