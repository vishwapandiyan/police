export default function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 p-6 text-gray-500 text-sm">
      <div
        style={{
          width: 18,
          height: 18,
          border: '2px solid #e5e7eb',
          borderTopColor: '#1a2744',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {text}
    </div>
  );
}
