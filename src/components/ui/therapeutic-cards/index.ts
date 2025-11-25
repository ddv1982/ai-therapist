// Base types and config (server-side)
export type {
  TherapeuticBaseCardProps,
  CardAction as CardActionType,
  CardContextValue,
} from './base/card-types';
export {
  cardVariants,
  sizeVariants,
  headerLayouts,
  contentPaddingVariants,
  therapeuticCardClasses,
} from './base/card-config';
export { therapeuticCardPresets } from './base/card-presets';

// Compound components (client-side)
export { CardRoot, useCardContext } from './compound/card-root';
export { CardHeader, type CardHeaderProps } from './compound/card-header';
export { CardContent, type CardContentProps } from './compound/card-content';
export { CardActions, type CardActionsProps } from './compound/card-actions';
export { CardProgress, type CardProgressProps } from './compound/card-progress';
export { CardCollapse, type CardCollapseProps } from './compound/card-collapse';
export { CardAction, type CardActionProps } from './compound/card-action';

// Main component with compound components attached (client-side)
export { TherapeuticBaseCard } from '@/components/ui/therapeutic-cards/base/therapeutic-base-card';

// Specialized cards (client-side)
export {
  CBTSectionCard,
  type CBTSectionCardProps,
} from '@/components/ui/therapeutic-cards/specialized/cbt-section-card';
export {
  EmotionCard,
  type EmotionCardProps,
} from '@/components/ui/therapeutic-cards/specialized/emotion-card';
export {
  SessionCard,
  type SessionCardProps,
} from '@/components/ui/therapeutic-cards/specialized/session-card';
