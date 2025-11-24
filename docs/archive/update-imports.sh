#!/bin/bash
set -e

echo "🔄 Updating import statements..."

# Update therapeutic-forms imports
find /Users/vriesd/projects/ai-therapist/src/components/ui/therapeutic-forms -name "*.tsx" -o -name "*.ts" | while read file; do
  sed -i '' "s|from '\\.\\./base/TherapeuticFieldError'|from '../base/therapeutic-field-error'|g" "$file"
  sed -i '' "s|from '\\.\\./base/TherapeuticFieldLabel'|from '../base/therapeutic-field-label'|g" "$file"
  sed -i '' "s|from '\\.\\./base/TherapeuticFieldWrapper'|from '../base/therapeutic-field-wrapper'|g" "$file"
  sed -i '' "s|from '\\.\\./base/useTherapeuticField'|from '../base/use-therapeutic-field'|g" "$file"
  sed -i '' "s|from '\\./base/TherapeuticFieldError'|from './base/therapeutic-field-error'|g" "$file"
  sed -i '' "s|from '\\./base/TherapeuticFieldLabel'|from './base/therapeutic-field-label'|g" "$file"
  sed -i '' "s|from '\\./base/TherapeuticFieldWrapper'|from './base/therapeutic-field-wrapper'|g" "$file"
  sed -i '' "s|from '\\./base/useTherapeuticField'|from './base/use-therapeutic-field'|g" "$file"
  
  sed -i '' "s|from '\\.\\./compound/ModalRoot'|from '../compound/modal-root'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/ModalHeader'|from '../compound/modal-header'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/ModalContent'|from '../compound/modal-content'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/ModalFooter'|from '../compound/modal-footer'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/ModalActions'|from '../compound/modal-actions'|g" "$file"
  
  sed -i '' "s|from '\\.\\./specialized/EmotionScaleInput'|from '../specialized/emotion-scale-input'|g" "$file"
  sed -i '' "s|from '\\.\\./specialized/ArrayFieldInput'|from '../specialized/array-field-input'|g" "$file"
done

echo "✅ therapeutic-forms imports updated"

# Update therapeutic-layouts imports
find /Users/vriesd/projects/ai-therapist/src/components/ui/therapeutic-layouts -name "*.tsx" -o -name "*.ts" | while read file; do
  sed -i '' "s|from '\\.\\./base/TherapeuticLayout'|from '../base/therapeutic-layout'|g" "$file"
  sed -i '' "s|from '\\./base/TherapeuticLayout'|from './base/therapeutic-layout'|g" "$file"
  sed -i '' "s|from '\\.\\./specialized/TherapeuticSection'|from '../specialized/therapeutic-section'|g" "$file"
  sed -i '' "s|from '\\.\\./specialized/CBTFlowLayout'|from '../specialized/cbt-flow-layout'|g" "$file"
  sed -i '' "s|from '\\.\\./specialized/ModalLayout'|from '../specialized/modal-layout'|g" "$file"
  sed -i '' "s|from '\\.\\./specialized/ResponsiveGrid'|from '../specialized/responsive-grid'|g" "$file"
done

echo "✅ therapeutic-layouts imports updated"

# Update therapeutic-modals imports  
find /Users/vriesd/projects/ai-therapist/src/components/ui/therapeutic-modals -name "*.tsx" -o -name "*.ts" | while read file; do
  sed -i '' "s|from '\\.\\./base/TherapeuticModal'|from '../base/therapeutic-modal'|g" "$file"
  sed -i '' "s|from '\\./base/TherapeuticModal'|from './base/therapeutic-modal'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/ModalRoot'|from '../compound/modal-root'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/ModalHeader'|from '../compound/modal-header'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/ModalContent'|from '../compound/modal-content'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/ModalFooter'|from '../compound/modal-footer'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/ModalActions'|from '../compound/modal-actions'|g" "$file"
  sed -i '' "s|from '\\./compound/ModalRoot'|from './compound/modal-root'|g" "$file"
  sed -i '' "s|from '\\./compound/ModalHeader'|from './compound/modal-header'|g" "$file"
  sed -i '' "s|from '\\./compound/ModalContent'|from './compound/modal-content'|g" "$file"
  sed -i '' "s|from '\\./compound/ModalFooter'|from './compound/modal-footer'|g" "$file"
  sed -i '' "s|from '\\./compound/ModalActions'|from './compound/modal-actions'|g" "$file"
  sed -i '' "s|from '\\.\\./specialized/CBTFlowModal'|from '../specialized/cbt-flow-modal'|g" "$file"
  sed -i '' "s|from '\\.\\./specialized/ConfirmationModal'|from '../specialized/confirmation-modal'|g" "$file"
  sed -i '' "s|from '\\.\\./specialized/SessionReportModal'|from '../specialized/session-report-modal'|g" "$file"
  sed -i '' "s|from '\\.\\./hooks/useTherapeuticConfirm'|from '../hooks/use-therapeutic-confirm'|g" "$file"
done

echo "✅ therapeutic-modals imports updated"

# Update therapeutic-cards imports
find /Users/vriesd/projects/ai-therapist/src/components/ui/therapeutic-cards -name "*.tsx" -o -name "*.ts" | while read file; do
  sed -i '' "s|from '\\.\\./base/TherapeuticBaseCard'|from '../base/therapeutic-base-card'|g" "$file"
  sed -i '' "s|from '\\./base/TherapeuticBaseCard'|from './base/therapeutic-base-card'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/CardRoot'|from '../compound/card-root'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/CardHeader'|from '../compound/card-header'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/CardContent'|from '../compound/card-content'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/CardActions'|from '../compound/card-actions'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/CardProgress'|from '../compound/card-progress'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/CardCollapse'|from '../compound/card-collapse'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/CardAction'|from '../compound/card-action'|g" "$file"
  sed -i '' "s|from '\\./compound/CardRoot'|from './compound/card-root'|g" "$file"
  sed -i '' "s|from '\\./compound/CardHeader'|from './compound/card-header'|g" "$file"
  sed -i '' "s|from '\\./compound/CardContent'|from './compound/card-content'|g" "$file"
  sed -i '' "s|from '\\./compound/CardActions'|from './compound/card-actions'|g" "$file"
  sed -i '' "s|from '\\./compound/CardProgress'|from './compound/card-progress'|g" "$file"
  sed -i '' "s|from '\\./compound/CardCollapse'|from './compound/card-collapse'|g" "$file"
  sed -i '' "s|from '\\./compound/CardAction'|from './compound/card-action'|g" "$file"
  sed -i '' "s|from '\\.\\./specialized/CBTSectionCard'|from '../specialized/cbt-section-card'|g" "$file"
  sed -i '' "s|from '\\.\\./specialized/EmotionCard'|from '../specialized/emotion-card'|g" "$file"
  sed -i '' "s|from '\\.\\./specialized/SessionCard'|from '../specialized/session-card'|g" "$file"
done

echo "✅ therapeutic-cards imports updated"

echo "🎉 All imports updated to kebab-case!"
