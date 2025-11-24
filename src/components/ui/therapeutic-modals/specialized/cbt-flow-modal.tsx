'use client';

import { ReactNode } from 'react';
import { ModalRoot } from '@/components/ui/therapeutic-modals/compound/modal-root';
import { ModalHeader } from '@/components/ui/therapeutic-modals/compound/modal-header';
import { ModalContent } from '@/components/ui/therapeutic-modals/compound/modal-content';
import { ModalFooter } from '@/components/ui/therapeutic-modals/compound/modal-footer';
import { ModalActions } from '@/components/ui/therapeutic-modals/compound/modal-actions';
import type { ModalAction } from '../base/modal-types';

export interface CBTFlowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  currentStep: number;
  totalSteps: number;
  progressValue?: number;
  children: ReactNode;
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  onClose?: () => void;
}

/**
 * Specialized modal for CBT exercise flows
 * Pre-configured with step indicators and progress bar
 */
export function CBTFlowModal({
  open,
  onOpenChange,
  title,
  subtitle,
  currentStep,
  totalSteps,
  progressValue,
  children,
  primaryAction,
  secondaryAction,
  onClose,
}: CBTFlowModalProps) {
  return (
    <ModalRoot
      open={open}
      onOpenChange={onOpenChange}
      variant="cbt-flow"
      type="auto"
      size="lg"
      mobileOptimized={true}
      onClose={onClose}
    >
      <ModalHeader
        title={title}
        subtitle={subtitle}
        stepIndicator={{ current: currentStep, total: totalSteps }}
        showProgress={progressValue !== undefined}
        progressValue={progressValue}
      />

      <ModalContent className="py-6">{children}</ModalContent>

      {(primaryAction || secondaryAction) && (
        <ModalFooter>
          <ModalActions primaryAction={primaryAction} secondaryAction={secondaryAction} />
        </ModalFooter>
      )}
    </ModalRoot>
  );
}
