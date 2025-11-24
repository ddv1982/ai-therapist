'use client';

import { ReactElement } from 'react';
import { ModalRoot } from '@/components/ui/therapeutic-modals/compound/modal-root';
import { ModalHeader } from '@/components/ui/therapeutic-modals/compound/modal-header';
import { ModalContent } from '@/components/ui/therapeutic-modals/compound/modal-content';
import { ModalFooter } from '@/components/ui/therapeutic-modals/compound/modal-footer';
import { ModalActions } from '@/components/ui/therapeutic-modals/compound/modal-actions';
import type { TherapeuticModalProps } from './modal-types';

/**
 * Legacy wrapper that maintains the old monolithic API
 * Uses compound components under the hood
 * 
 * For new code, prefer using compound components directly:
 * <TherapeuticModal open={open} onOpenChange={setOpen}>
 *   <TherapeuticModal.Header title="Title" />
 *   <TherapeuticModal.Content>...</TherapeuticModal.Content>
 *   <TherapeuticModal.Footer>...</TherapeuticModal.Footer>
 * </TherapeuticModal>
 */
const TherapeuticModalComponent = function TherapeuticModal({
  trigger,
  open,
  onOpenChange,
  title,
  subtitle,
  description,
  children,
  type,
  variant,
  size,
  primaryAction,
  secondaryAction,
  actions,
  preventClose,
  hideCloseButton,
  showProgress,
  progressValue,
  stepIndicator,
  therapeuticIcon,
  mobileOptimized,
  mobileAsSheet,
  contentClassName,
  headerClassName,
  footerClassName,
  role,
  ariaLabel,
  onClose,
  ...props
}: TherapeuticModalProps) {
  const hasActions = primaryAction || secondaryAction || (actions && actions.length > 0);

  return (
    <ModalRoot
      trigger={trigger}
      open={open}
      onOpenChange={onOpenChange}
      type={type}
      variant={variant}
      size={size}
      preventClose={preventClose}
      mobileOptimized={mobileOptimized}
      mobileAsSheet={mobileAsSheet}
      contentClassName={contentClassName}
      role={role}
      ariaLabel={ariaLabel}
      onClose={onClose}
      {...props}
    >
      <ModalHeader
        title={title}
        subtitle={subtitle}
        description={description}
        therapeuticIcon={therapeuticIcon}
        stepIndicator={stepIndicator}
        showProgress={showProgress}
        progressValue={progressValue}
        hideCloseButton={hideCloseButton}
        className={headerClassName}
      />

      <ModalContent className="py-6">{children}</ModalContent>

      {hasActions && (
        <ModalFooter className={footerClassName}>
          <ModalActions
            primaryAction={primaryAction}
            secondaryAction={secondaryAction}
            actions={actions}
          />
        </ModalFooter>
      )}
    </ModalRoot>
  );
};

// Create compound component interface
interface TherapeuticModalComponent {
  (props: TherapeuticModalProps): ReactElement;
  Root: typeof ModalRoot;
  Header: typeof ModalHeader;
  Content: typeof ModalContent;
  Footer: typeof ModalFooter;
  Actions: typeof ModalActions;
}

// Export non-memoized component with compound components attached
export const TherapeuticModal = TherapeuticModalComponent as TherapeuticModalComponent;

// Attach compound components
TherapeuticModal.Root = ModalRoot;
TherapeuticModal.Header = ModalHeader;
TherapeuticModal.Content = ModalContent;
TherapeuticModal.Footer = ModalFooter;
TherapeuticModal.Actions = ModalActions;
