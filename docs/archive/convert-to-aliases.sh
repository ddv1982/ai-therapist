#!/bin/bash
set -e

echo "🔄 Converting relative imports to @/ aliases..."

# therapeutic-forms/
echo "Processing therapeutic-forms/..."

# Update base/ imports
find /Users/vriesd/projects/ai-therapist/src/components/ui/therapeutic-forms -name "*.tsx" -o -name "*.ts" | while read file; do
  # From inputs/ to base/
  sed -i '' "s|from '\\.\\./base/therapeutic-field-error'|from '@/components/ui/therapeutic-forms/base/therapeutic-field-error'|g" "$file"
  sed -i '' "s|from '\\.\\./base/therapeutic-field-label'|from '@/components/ui/therapeutic-forms/base/therapeutic-field-label'|g" "$file"
  sed -i '' "s|from '\\.\\./base/therapeutic-field-wrapper'|from '@/components/ui/therapeutic-forms/base/therapeutic-field-wrapper'|g" "$file"
  sed -i '' "s|from '\\.\\./base/use-therapeutic-field'|from '@/components/ui/therapeutic-forms/base/use-therapeutic-field'|g" "$file"
  
  # From base/ to base/
  sed -i '' "s|from '\\./therapeutic-field-error'|from '@/components/ui/therapeutic-forms/base/therapeutic-field-error'|g" "$file"
  sed -i '' "s|from '\\./therapeutic-field-label'|from '@/components/ui/therapeutic-forms/base/therapeutic-field-label'|g" "$file"
  sed -i '' "s|from '\\./therapeutic-field-wrapper'|from '@/components/ui/therapeutic-forms/base/therapeutic-field-wrapper'|g" "$file"
  sed -i '' "s|from '\\./use-therapeutic-field'|from '@/components/ui/therapeutic-forms/base/use-therapeutic-field'|g" "$file"
  
  # From specialized/ to base/
  sed -i '' "s|from '\\.\\./specialized/emotion-scale-input'|from '@/components/ui/therapeutic-forms/specialized/emotion-scale-input'|g" "$file"
  sed -i '' "s|from '\\.\\./specialized/array-field-input'|from '@/components/ui/therapeutic-forms/specialized/array-field-input'|g" "$file"
  
  # From root to inputs/
  sed -i '' "s|from '\\./inputs/therapeutic-text-input'|from '@/components/ui/therapeutic-forms/inputs/therapeutic-text-input'|g" "$file"
  sed -i '' "s|from '\\./inputs/therapeutic-text-area'|from '@/components/ui/therapeutic-forms/inputs/therapeutic-text-area'|g" "$file"
  sed -i '' "s|from '\\./inputs/therapeutic-slider'|from '@/components/ui/therapeutic-forms/inputs/therapeutic-slider'|g" "$file"
  
  # From root to specialized/
  sed -i '' "s|from '\\./specialized/emotion-scale-input'|from '@/components/ui/therapeutic-forms/specialized/emotion-scale-input'|g" "$file"
  sed -i '' "s|from '\\./specialized/array-field-input'|from '@/components/ui/therapeutic-forms/specialized/array-field-input'|g" "$file"
  
  # From root to base/
  sed -i '' "s|from '\\./base/use-therapeutic-field'|from '@/components/ui/therapeutic-forms/base/use-therapeutic-field'|g" "$file"
  sed -i '' "s|from '\\./base/therapeutic-field-label'|from '@/components/ui/therapeutic-forms/base/therapeutic-field-label'|g" "$file"
  sed -i '' "s|from '\\./base/therapeutic-field-error'|from '@/components/ui/therapeutic-forms/base/therapeutic-field-error'|g" "$file"
  sed -i '' "s|from '\\./base/therapeutic-field-wrapper'|from '@/components/ui/therapeutic-forms/base/therapeutic-field-wrapper'|g" "$file"
  
  # Root compat file
  sed -i '' "s|from '\\./therapeutic-form-field-new'|from '@/components/ui/therapeutic-forms/therapeutic-form-field-new'|g" "$file"
done

echo "✅ therapeutic-forms/ converted"

# therapeutic-layouts/
echo "Processing therapeutic-layouts/..."

find /Users/vriesd/projects/ai-therapist/src/components/ui/therapeutic-layouts -name "*.tsx" -o -name "*.ts" | while read file; do
  # From specialized/ to base/
  sed -i '' "s|from '\\.\\./base/therapeutic-layout'|from '@/components/ui/therapeutic-layouts/base/therapeutic-layout'|g" "$file"
  sed -i '' "s|from '\\./base/therapeutic-layout'|from '@/components/ui/therapeutic-layouts/base/therapeutic-layout'|g" "$file"
  
  # Root to specialized/
  sed -i '' "s|from '\\./specialized/therapeutic-section'|from '@/components/ui/therapeutic-layouts/specialized/therapeutic-section'|g" "$file"
  sed -i '' "s|from '\\./specialized/cbt-flow-layout'|from '@/components/ui/therapeutic-layouts/specialized/cbt-flow-layout'|g" "$file"
  sed -i '' "s|from '\\./specialized/modal-layout'|from '@/components/ui/therapeutic-layouts/specialized/modal-layout'|g" "$file"
  sed -i '' "s|from '\\./specialized/responsive-grid'|from '@/components/ui/therapeutic-layouts/specialized/responsive-grid'|g" "$file"
done

echo "✅ therapeutic-layouts/ converted"

# therapeutic-modals/
echo "Processing therapeutic-modals/..."

find /Users/vriesd/projects/ai-therapist/src/components/ui/therapeutic-modals -name "*.tsx" -o -name "*.ts" | while read file; do
  # Compound components
  sed -i '' "s|from '\\.\\./compound/modal-root'|from '@/components/ui/therapeutic-modals/compound/modal-root'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/modal-header'|from '@/components/ui/therapeutic-modals/compound/modal-header'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/modal-content'|from '@/components/ui/therapeutic-modals/compound/modal-content'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/modal-footer'|from '@/components/ui/therapeutic-modals/compound/modal-footer'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/modal-actions'|from '@/components/ui/therapeutic-modals/compound/modal-actions'|g" "$file"
  
  sed -i '' "s|from '\\./modal-root'|from '@/components/ui/therapeutic-modals/compound/modal-root'|g" "$file"
  sed -i '' "s|from '\\./modal-header'|from '@/components/ui/therapeutic-modals/compound/modal-header'|g" "$file"
  sed -i '' "s|from '\\./modal-content'|from '@/components/ui/therapeutic-modals/compound/modal-content'|g" "$file"
  sed -i '' "s|from '\\./modal-footer'|from '@/components/ui/therapeutic-modals/compound/modal-footer'|g" "$file"
  sed -i '' "s|from '\\./modal-actions'|from '@/components/ui/therapeutic-modals/compound/modal-actions'|g" "$file"
  
  # Base
  sed -i '' "s|from '\\.\\./base/therapeutic-modal'|from '@/components/ui/therapeutic-modals/base/therapeutic-modal'|g" "$file"
  sed -i '' "s|from '\\./base/therapeutic-modal'|from '@/components/ui/therapeutic-modals/base/therapeutic-modal'|g" "$file"
  
  # Specialized
  sed -i '' "s|from '\\./specialized/cbt-flow-modal'|from '@/components/ui/therapeutic-modals/specialized/cbt-flow-modal'|g" "$file"
  sed -i '' "s|from '\\./specialized/confirmation-modal'|from '@/components/ui/therapeutic-modals/specialized/confirmation-modal'|g" "$file"
  sed -i '' "s|from '\\./specialized/session-report-modal'|from '@/components/ui/therapeutic-modals/specialized/session-report-modal'|g" "$file"
  
  # Hooks
  sed -i '' "s|from '\\./hooks/use-therapeutic-confirm'|from '@/components/ui/therapeutic-modals/hooks/use-therapeutic-confirm'|g" "$file"
done

echo "✅ therapeutic-modals/ converted"

# therapeutic-cards/
echo "Processing therapeutic-cards/..."

find /Users/vriesd/projects/ai-therapist/src/components/ui/therapeutic-cards -name "*.tsx" -o -name "*.ts" | while read file; do
  # Compound components
  sed -i '' "s|from '\\.\\./compound/card-root'|from '@/components/ui/therapeutic-cards/compound/card-root'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/card-header'|from '@/components/ui/therapeutic-cards/compound/card-header'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/card-content'|from '@/components/ui/therapeutic-cards/compound/card-content'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/card-actions'|from '@/components/ui/therapeutic-cards/compound/card-actions'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/card-progress'|from '@/components/ui/therapeutic-cards/compound/card-progress'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/card-collapse'|from '@/components/ui/therapeutic-cards/compound/card-collapse'|g" "$file"
  sed -i '' "s|from '\\.\\./compound/card-action'|from '@/components/ui/therapeutic-cards/compound/card-action'|g" "$file"
  
  sed -i '' "s|from '\\./card-root'|from '@/components/ui/therapeutic-cards/compound/card-root'|g" "$file"
  sed -i '' "s|from '\\./card-header'|from '@/components/ui/therapeutic-cards/compound/card-header'|g" "$file"
  sed -i '' "s|from '\\./card-content'|from '@/components/ui/therapeutic-cards/compound/card-content'|g" "$file"
  sed -i '' "s|from '\\./card-actions'|from '@/components/ui/therapeutic-cards/compound/card-actions'|g" "$file"
  sed -i '' "s|from '\\./card-progress'|from '@/components/ui/therapeutic-cards/compound/card-progress'|g" "$file"
  sed -i '' "s|from '\\./card-collapse'|from '@/components/ui/therapeutic-cards/compound/card-collapse'|g" "$file"
  sed -i '' "s|from '\\./card-action'|from '@/components/ui/therapeutic-cards/compound/card-action'|g" "$file"
  
  # Base
  sed -i '' "s|from '\\.\\./base/therapeutic-base-card'|from '@/components/ui/therapeutic-cards/base/therapeutic-base-card'|g" "$file"
  sed -i '' "s|from '\\./base/therapeutic-base-card'|from '@/components/ui/therapeutic-cards/base/therapeutic-base-card'|g" "$file"
  
  # Specialized
  sed -i '' "s|from '\\./specialized/cbt-section-card'|from '@/components/ui/therapeutic-cards/specialized/cbt-section-card'|g" "$file"
  sed -i '' "s|from '\\./specialized/emotion-card'|from '@/components/ui/therapeutic-cards/specialized/emotion-card'|g" "$file"
  sed -i '' "s|from '\\./specialized/session-card'|from '@/components/ui/therapeutic-cards/specialized/session-card'|g" "$file"
done

echo "✅ therapeutic-cards/ converted"

echo "🎉 All imports converted to @/ aliases!"
