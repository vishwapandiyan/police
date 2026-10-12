export default function SyntheticBanner({ className = '' }: { className?: string }) {
  return (
    <div className={`synthetic-notice ${className}`}>
      SYNTHETIC DEMO DATA — NOT AN OFFICIAL GOVERNMENT RECORD.
      All proposals, amounts and outcomes shown are fictional and provided only for demonstration purposes.
    </div>
  );
}
