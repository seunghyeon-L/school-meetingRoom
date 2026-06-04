import type { ReactNode } from 'react';

interface EmptyStateProps {
  message: string;
  children?: ReactNode;
}

export function EmptyState({ message, children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p>{message}</p>
      {children}
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
}

export function ErrorState({
  message = '정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
}: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <p>{message}</p>
    </div>
  );
}
