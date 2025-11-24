'use client';

import { TherapeuticButton } from '@/components/ui/therapeutic-button';
import { useModalContext } from '@/components/ui/therapeutic-modals/compound/modal-root';
import type { ModalAction } from '../base/modal-types';

export interface ModalActionsProps {
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  actions?: ModalAction[];
}

/**
 * Modal actions compound component
 * Renders action buttons with proper styling
 */
export function ModalActions({ primaryAction, secondaryAction, actions = [] }: ModalActionsProps) {
  const { mobileOptimized } = useModalContext();

  // Combined actions
  const allActions = [
    ...(primaryAction ? [{ ...primaryAction, isPrimary: true }] : []),
    ...(secondaryAction ? [{ ...secondaryAction, isSecondary: true }] : []),
    ...actions,
  ];

  if (allActions.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {allActions.map((action, index) => (
        <TherapeuticButton
          key={index}
          variant={
            'isPrimary' in action && action.isPrimary
              ? 'therapeutic'
              : 'isSecondary' in action && action.isSecondary
                ? 'outline'
                : (action.variant as 'outline' | 'ghost' | 'destructive') || 'ghost'
          }
          onClick={action.onClick}
          loading={action.loading}
          disabled={action.disabled}
          size={mobileOptimized ? 'mobile-touch' : 'default'}
        >
          {action.label}
        </TherapeuticButton>
      ))}
    </div>
  );
}
