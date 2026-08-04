import { useEffect, useRef } from 'react';
import styles from './ConfirmModal.module.scss';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
      if (e.key === 'Enter') {
        onConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    confirmButtonRef.current?.focus();
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, onConfirm]);

  return (
    <div
      className={styles.modalOverlay}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={styles.modal}
      >
        <h2 className={styles.modalTitle}>{title}</h2>
        <p className={styles.modalMessage}>{message}</p>
        <div className={styles.modalActions}>
          <button
            onClick={onCancel}
            className={styles.cancelBtn}
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={styles.confirmBtn}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
