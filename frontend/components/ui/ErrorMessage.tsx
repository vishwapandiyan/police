import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '12px 14px',
      background: 'var(--gov-danger-bg)',
      border: '1px solid #f5c6c2',
      borderLeft: '3px solid var(--gov-danger)',
      borderRadius: 'var(--r-md)',
      fontSize: '0.82rem',
      color: 'var(--gov-danger)',
    }}>
      <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>Error</div>
        <div style={{ marginTop: 2, color: '#a93226' }}>{message}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn btn-sm btn-secondary"
            style={{ marginTop: 8 }}
          >
            <RefreshCw size={12} /> Retry
          </button>
        )}
      </div>
    </div>
  );
}
