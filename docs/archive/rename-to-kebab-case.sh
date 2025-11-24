#!/bin/bash
set -e

echo "🔄 Renaming files to kebab-case..."

# therapeutic-forms/
cd /Users/vriesd/projects/ai-therapist/src/components/ui/therapeutic-forms

mv base/TherapeuticFieldError.tsx base/therapeutic-field-error.tsx 2>/dev/null || true
mv base/TherapeuticFieldLabel.tsx base/therapeutic-field-label.tsx 2>/dev/null || true
mv base/TherapeuticFieldWrapper.tsx base/therapeutic-field-wrapper.tsx 2>/dev/null || true
mv base/useTherapeuticField.ts base/use-therapeutic-field.ts 2>/dev/null || true

mv inputs/TherapeuticTextInput.tsx inputs/therapeutic-text-input.tsx 2>/dev/null || true
mv inputs/TherapeuticTextArea.tsx inputs/therapeutic-text-area.tsx 2>/dev/null || true
mv inputs/TherapeuticSlider.tsx inputs/therapeutic-slider.tsx 2>/dev/null || true

mv specialized/EmotionScaleInput.tsx specialized/emotion-scale-input.tsx 2>/dev/null || true
mv specialized/ArrayFieldInput.tsx specialized/array-field-input.tsx 2>/dev/null || true

mv TherapeuticFormField.tsx therapeutic-form-field-new.tsx 2>/dev/null || true

echo "✅ therapeutic-forms/ renamed"

# therapeutic-layouts/
cd /Users/vriesd/projects/ai-therapist/src/components/ui/therapeutic-layouts

mv base/TherapeuticLayout.tsx base/therapeutic-layout.tsx 2>/dev/null || true

mv specialized/TherapeuticSection.tsx specialized/therapeutic-section.tsx 2>/dev/null || true
mv specialized/CBTFlowLayout.tsx specialized/cbt-flow-layout.tsx 2>/dev/null || true
mv specialized/ModalLayout.tsx specialized/modal-layout.tsx 2>/dev/null || true
mv specialized/ResponsiveGrid.tsx specialized/responsive-grid.tsx 2>/dev/null || true

mv TherapeuticLayoutCompat.tsx therapeutic-layout-compat.tsx 2>/dev/null || true

echo "✅ therapeutic-layouts/ renamed"

# therapeutic-modals/
cd /Users/vriesd/projects/ai-therapist/src/components/ui/therapeutic-modals

mv base/TherapeuticModal.tsx base/therapeutic-modal.tsx 2>/dev/null || true

mv compound/ModalRoot.tsx compound/modal-root.tsx 2>/dev/null || true
mv compound/ModalHeader.tsx compound/modal-header.tsx 2>/dev/null || true
mv compound/ModalContent.tsx compound/modal-content.tsx 2>/dev/null || true
mv compound/ModalFooter.tsx compound/modal-footer.tsx 2>/dev/null || true
mv compound/ModalActions.tsx compound/modal-actions.tsx 2>/dev/null || true

mv specialized/CBTFlowModal.tsx specialized/cbt-flow-modal.tsx 2>/dev/null || true
mv specialized/ConfirmationModal.tsx specialized/confirmation-modal.tsx 2>/dev/null || true
mv specialized/SessionReportModal.tsx specialized/session-report-modal.tsx 2>/dev/null || true

mv hooks/useTherapeuticConfirm.ts hooks/use-therapeutic-confirm.ts 2>/dev/null || true

mv TherapeuticModalCompat.tsx therapeutic-modal-compat.tsx 2>/dev/null || true

echo "✅ therapeutic-modals/ renamed"

# therapeutic-cards/
cd /Users/vriesd/projects/ai-therapist/src/components/ui/therapeutic-cards

mv base/TherapeuticBaseCard.tsx base/therapeutic-base-card.tsx 2>/dev/null || true

mv compound/CardRoot.tsx compound/card-root.tsx 2>/dev/null || true
mv compound/CardHeader.tsx compound/card-header.tsx 2>/dev/null || true
mv compound/CardContent.tsx compound/card-content.tsx 2>/dev/null || true
mv compound/CardActions.tsx compound/card-actions.tsx 2>/dev/null || true
mv compound/CardProgress.tsx compound/card-progress.tsx 2>/dev/null || true
mv compound/CardCollapse.tsx compound/card-collapse.tsx 2>/dev/null || true
mv compound/CardAction.tsx compound/card-action.tsx 2>/dev/null || true

mv specialized/CBTSectionCard.tsx specialized/cbt-section-card.tsx 2>/dev/null || true
mv specialized/EmotionCard.tsx specialized/emotion-card.tsx 2>/dev/null || true
mv specialized/SessionCard.tsx specialized/session-card.tsx 2>/dev/null || true

mv TherapeuticBaseCardCompat.tsx therapeutic-base-card-compat.tsx 2>/dev/null || true

echo "✅ therapeutic-cards/ renamed"

echo "🎉 All files renamed to kebab-case!"
