/**
 * Backward Compatible Wrapper for therapeutic-layout.tsx
 * 
 * This file maintains the old API for backward compatibility.
 * All exports from the old therapeutic-layout.tsx are re-exported here.
 * 
 * MIGRATION GUIDE:
 * OLD:
 *   import { TherapeuticLayout } from '@/components/ui/therapeutic-layouts';
 * 
 * NEW (RECOMMENDED):
 *   import { TherapeuticLayout } from '@/components/ui/therapeutic-layouts';
 * 
 * The functionality is identical, but the new structure allows:
 * - Better tree-shaking
 * - Lazy loading of specialized layouts
 * - Server-side rendering of presets/classes
 */

// Re-export everything from the new structure
export {
  TherapeuticLayout,
  TherapeuticSection,
  CBTFlowLayout,
  ModalLayout,
  ResponsiveGrid,
  therapeuticLayoutPresets,
  therapeuticLayoutClasses,
  type TherapeuticLayoutProps,
  type TherapeuticSectionProps,
  type CBTFlowLayoutProps,
  type ModalLayoutProps,
} from './index';
