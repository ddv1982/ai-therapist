// Base types and component
export type { TherapeuticLayoutProps } from './base/layout-types';
export { TherapeuticLayout } from '@/components/ui/therapeutic-layouts/base/therapeutic-layout';

// Layout configuration (server-side)
export {
  spacingClasses,
  paddingClasses,
  gridClasses,
  gapClasses,
  typographyClasses,
  variantClasses,
  backgroundClasses,
  shadowClasses,
  maxWidthClasses,
  therapeuticLayoutClasses,
} from './base/layout-classes';

// Layout presets (server-side)
export { therapeuticLayoutPresets } from './base/layout-presets';

// Specialized layouts (client-side)
export {
  TherapeuticSection,
  type TherapeuticSectionProps,
} from '@/components/ui/therapeutic-layouts/specialized/therapeutic-section';
export {
  CBTFlowLayout,
  type CBTFlowLayoutProps,
} from '@/components/ui/therapeutic-layouts/specialized/cbt-flow-layout';
export {
  ModalLayout,
  type ModalLayoutProps,
} from '@/components/ui/therapeutic-layouts/specialized/modal-layout';
export { ResponsiveGrid } from '@/components/ui/therapeutic-layouts/specialized/responsive-grid';
