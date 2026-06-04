import { useEffect } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
  kind?: 'info' | 'error';
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(onDismiss, 2800);
    return () => window.clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      className={['toast', toast.kind === 'error' ? 'toast--error' : '']
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="assertive"
    >
      {toast.text}
    </div>
  );
}
