export default function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '24px 0', color: 'var(--gov-text-sec)', fontSize: '0.82rem' }}>
      <div style={{
        width: 18, height: 18,
        border: '2px solid var(--gov-border)',
        borderTopColor: 'var(--gov-navy)',
        borderRadius: '50%',
        flexShrink: 0,
        animation: 'gov-spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes gov-spin { to { transform: rotate(360deg); } }`}</style>
      {text}
    </div>
  );
}
