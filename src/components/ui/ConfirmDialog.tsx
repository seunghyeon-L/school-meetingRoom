import type { ReactNode } from 'react';
import { Modal } from './Modal';
import { BigButton } from './BigButton';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = '확인',
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <div className="modal__body">{message}</div>
      <div className="modal__actions">
        <BigButton variant="ghost" size="sm" onClick={onCancel}>
          {cancelLabel}
        </BigButton>
        <BigButton
          variant={danger ? 'danger' : 'primary'}
          size="sm"
          onClick={onConfirm}
        >
          {confirmLabel}
        </BigButton>
      </div>
    </Modal>
  );
}
