/**
 * Backward Compatible Wrapper for therapeutic-modal.tsx
 * 
 * This file maintains the old API for backward compatibility.
 * All exports from the old therapeutic-modal.tsx are re-exported here.
 * 
 * MIGRATION GUIDE:
 * 
 * OLD (Monolithic API):
 *   import { TherapeuticModal } from '@/components/ui/therapeutic-modals';
 *   
 *   <TherapeuticModal
 *     open={open}
 *     title="Title"
 *     description="Description"
 *     primaryAction={{ label: "OK", onClick: handleOk }}
 *   >
 *     Content
 *   </TherapeuticModal>
 * 
 * NEW (Compound Components - Recommended):
 *   import { TherapeuticModal } from '@/components/ui/therapeutic-modals';
 *   
 *   <TherapeuticModal open={open} onOpenChange={setOpen}>
 *     <TherapeuticModal.Header title="Title" description="Description" />
 *     <TherapeuticModal.Content>
 *       Content
 *     </TherapeuticModal.Content>
 *     <TherapeuticModal.Footer>
 *       <TherapeuticModal.Actions
 *         primaryAction={{ label: "OK", onClick: handleOk }}
 *       />
 *     </TherapeuticModal.Footer>
 *   </TherapeuticModal>
 * 
 * OR use specialized modals:
 *   import { ConfirmationModal } from '@/components/ui/therapeutic-modals';
 *   
 *   <ConfirmationModal
 *     open={open}
 *     onOpenChange={setOpen}
 *     title="Are you sure?"
 *     onConfirm={handleConfirm}
 *   />
 */

// Re-export everything from the new structure
export {
  TherapeuticModal,
  CBTFlowModal,
  ConfirmationModal,
  SessionReportModal,
  therapeuticModalPresets,
  therapeuticModalClasses,
  useTherapeuticConfirm,
  type TherapeuticModalProps,
  type CBTFlowModalProps,
  type ConfirmationModalProps,
  type SessionReportModalProps,
  type ConfirmOptions,
} from './index';
