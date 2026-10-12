import { AlertCircle } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded text-sm">
      <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="text-red-800">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="mt-2 text-red-700 underline text-xs">
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
