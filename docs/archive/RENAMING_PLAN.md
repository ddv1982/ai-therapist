# File Renaming Plan: PascalCase → kebab-case

## Issue
New refactored components use PascalCase, but project convention is kebab-case.

## Files to Rename

### therapeutic-forms/
```
base/
  TherapeuticFieldError.tsx      → therapeutic-field-error.tsx
  TherapeuticFieldLabel.tsx      → therapeutic-field-label.tsx
  TherapeuticFieldWrapper.tsx    → therapeutic-field-wrapper.tsx
  useTherapeuticField.ts         → use-therapeutic-field.ts (already kebab ✓)

inputs/
  TherapeuticTextInput.tsx       → therapeutic-text-input.tsx
  TherapeuticTextArea.tsx        → therapeutic-text-area.tsx
  TherapeuticSlider.tsx          → therapeutic-slider.tsx

specialized/
  EmotionScaleInput.tsx          → emotion-scale-input.tsx
  ArrayFieldInput.tsx            → array-field-input.tsx

TherapeuticFormField.tsx         → therapeutic-form-field.tsx (root - compat wrapper)
```

### therapeutic-layouts/
```
base/
  TherapeuticLayout.tsx          → therapeutic-layout.tsx
  (types/config already kebab ✓)

specialized/
  TherapeuticSection.tsx         → therapeutic-section.tsx
  CBTFlowLayout.tsx              → cbt-flow-layout.tsx
  ModalLayout.tsx                → modal-layout.tsx
  ResponsiveGrid.tsx             → responsive-grid.tsx

TherapeuticLayoutCompat.tsx      → therapeutic-layout-compat.tsx
```

### therapeutic-modals/
```
base/
  TherapeuticModal.tsx           → therapeutic-modal.tsx

compound/
  ModalRoot.tsx                  → modal-root.tsx
  ModalHeader.tsx                → modal-header.tsx
  ModalContent.tsx               → modal-content.tsx
  ModalFooter.tsx                → modal-footer.tsx
  ModalActions.tsx               → modal-actions.tsx

specialized/
  CBTFlowModal.tsx               → cbt-flow-modal.tsx
  ConfirmationModal.tsx          → confirmation-modal.tsx
  SessionReportModal.tsx         → session-report-modal.tsx

hooks/
  useTherapeuticConfirm.ts       → use-therapeutic-confirm.ts (already kebab ✓)

TherapeuticModalCompat.tsx       → therapeutic-modal-compat.tsx
```

### therapeutic-cards/
```
base/
  TherapeuticBaseCard.tsx        → therapeutic-base-card.tsx

compound/
  CardRoot.tsx                   → card-root.tsx
  CardHeader.tsx                 → card-header.tsx
  CardContent.tsx                → card-content.tsx
  CardActions.tsx                → card-actions.tsx
  CardProgress.tsx               → card-progress.tsx
  CardCollapse.tsx               → card-collapse.tsx
  CardAction.tsx                 → card-action.tsx

specialized/
  CBTSectionCard.tsx             → cbt-section-card.tsx
  EmotionCard.tsx                → emotion-card.tsx
  SessionCard.tsx                → session-card.tsx

TherapeuticBaseCardCompat.tsx    → therapeutic-base-card-compat.tsx
```

## Files to Delete (after verification)
```
src/components/ui/therapeutic-form-field.tsx
src/components/ui/therapeutic-layout.tsx
src/components/ui/therapeutic-modal.tsx
src/components/ui/therapeutic-base-card.tsx
```

## Execution Strategy
1. Rename files systematically (one directory at a time)
2. Update import statements in index.ts files
3. Update import statements in component files
4. Verify TypeScript compilation
5. Run tests
6. Delete old monolithic files
7. Verify everything still works
