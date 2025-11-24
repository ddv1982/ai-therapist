'use client';

import { ReactNode } from 'react';
import { ModalRoot } from '@/components/ui/therapeutic-modals/compound/modal-root';
import { ModalHeader } from '@/components/ui/therapeutic-modals/compound/modal-header';
import { ModalContent } from '@/components/ui/therapeutic-modals/compound/modal-content';
import { ModalFooter } from '@/components/ui/therapeutic-modals/compound/modal-footer';
import { ModalActions } from '@/components/ui/therapeutic-modals/compound/modal-actions';

export interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  confirmLoading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * Specialized confirmation modal
 * Pre-configured for yes/no decisions
 */
export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  confirmLoading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  return (
    <ModalRoot
      open={open}
      onOpenChange={onOpenChange}
      variant="confirm"
      type="dialog"
      size="sm"
      preventClose={true}
    >
      <ModalHeader title={title} description={description} />

      {children && <ModalContent className="py-6">{children}</ModalContent>}

      <ModalFooter>
        <ModalActions
          secondaryAction={{
            label: cancelText,
            onClick: () => {
              onCancel?.();
              onOpenChange(false);
            },
            variant: 'ghost',
          }}
          primaryAction={{
            label: confirmText,
            onClick: onConfirm,
            loading: confirmLoading,
            variant: variant === 'destructive' ? 'destructive' : 'therapeutic',
          }}
        />
      </ModalFooter>
    </ModalRoot>
  );
}
