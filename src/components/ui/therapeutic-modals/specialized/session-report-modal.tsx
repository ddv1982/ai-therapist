'use client';

import { ReactNode } from 'react';
import { ModalRoot } from '@/components/ui/therapeutic-modals/compound/modal-root';
import { ModalHeader } from '@/components/ui/therapeutic-modals/compound/modal-header';
import { ModalContent } from '@/components/ui/therapeutic-modals/compound/modal-content';
import { ModalFooter } from '@/components/ui/therapeutic-modals/compound/modal-footer';
import { ModalActions } from '@/components/ui/therapeutic-modals/compound/modal-actions';

export interface SessionReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  therapeuticIcon?: ReactNode;
  children: ReactNode;
  onClose?: () => void;
}

/**
 * Specialized modal for session reports
 * Pre-configured with report styling and larger size
 */
export function SessionReportModal({
  open,
  onOpenChange,
  title,
  therapeuticIcon,
  children,
  onClose,
}: SessionReportModalProps) {
  return (
    <ModalRoot
      open={open}
      onOpenChange={onOpenChange}
      variant="report"
      type="dialog"
      size="xl"
      mobileAsSheet={true}
      onClose={onClose}
    >
      <ModalHeader title={title} therapeuticIcon={therapeuticIcon} />

      <ModalContent className="py-6">{children}</ModalContent>

      <ModalFooter>
        <ModalActions
          primaryAction={{
            label: 'Close',
            onClick: () => onOpenChange(false),
          }}
        />
      </ModalFooter>
    </ModalRoot>
  );
}
