// Base types and config (server-side)
export type { TherapeuticModalProps, ModalAction, ModalContextValue } from './base/modal-types';
export { sizeClasses, variantClasses, therapeuticModalClasses } from './base/modal-config';
export { therapeuticModalPresets } from './base/modal-presets';

// Compound components (client-side)
export { ModalRoot, useModalContext } from './compound/modal-root';
export { ModalHeader, type ModalHeaderProps } from './compound/modal-header';
export { ModalContent, type ModalContentProps } from './compound/modal-content';
export { ModalFooter, type ModalFooterProps } from './compound/modal-footer';
export { ModalActions, type ModalActionsProps } from './compound/modal-actions';

// Main component with compound components attached (client-side)
export { TherapeuticModal } from '@/components/ui/therapeutic-modals/base/therapeutic-modal';

// Specialized modals (client-side)
export { CBTFlowModal, type CBTFlowModalProps } from '@/components/ui/therapeutic-modals/specialized/cbt-flow-modal';
export { ConfirmationModal, type ConfirmationModalProps } from '@/components/ui/therapeutic-modals/specialized/confirmation-modal';
export { SessionReportModal, type SessionReportModalProps } from '@/components/ui/therapeutic-modals/specialized/session-report-modal';

// Hooks
export { useTherapeuticConfirm, type ConfirmOptions } from '@/components/ui/therapeutic-modals/hooks/use-therapeutic-confirm';
