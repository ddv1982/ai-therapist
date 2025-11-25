import type { TherapeuticModalProps } from '../base/modal-types';
import { therapeuticModalPresets } from '../base/modal-presets';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
}

/**
 * Hook for quick confirmation modals
 * Returns props to spread onto a ConfirmationModal component
 *
 * Usage:
 * const confirmDelete = useTherapeuticConfirm();
 *
 * <ConfirmationModal {...confirmDelete({
 *   title: "Delete session?",
 *   description: "This cannot be undone",
 *   onConfirm: handleDelete
 * })} />
 */
export function useTherapeuticConfirm() {
  return (options: ConfirmOptions): Partial<TherapeuticModalProps> => {
    return {
      ...therapeuticModalPresets.confirmation({}),
      title: options.title,
      description: options.description,
      primaryAction: {
        label: options.confirmText || 'Confirm',
        onClick: options.onConfirm,
        variant: options.variant === 'destructive' ? 'destructive' : 'therapeutic',
      },
      secondaryAction: {
        label: options.cancelText || 'Cancel',
        onClick: () => {},
        variant: 'ghost',
      },
    };
  };
}
