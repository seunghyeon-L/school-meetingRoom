interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = '불러오는 중...' }: SpinnerProps) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
