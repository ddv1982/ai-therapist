/**
 * Backward Compatible Wrapper for therapeutic-base-card.tsx
 * 
 * This file maintains the old API for backward compatibility.
 * All exports from the old therapeutic-base-card.tsx are re-exported here.
 * 
 * MIGRATION GUIDE:
 * 
 * OLD (Monolithic API):
 *   import { TherapeuticBaseCard } from '@/components/ui/therapeutic-cards';
 *   
 *   <TherapeuticBaseCard
 *     title="Title"
 *     subtitle="Subtitle"
 *     variant="therapeutic"
 *     collapsible
 *     secondaryActions={[...]}
 *   >
 *     Content
 *   </TherapeuticBaseCard>
 * 
 * NEW (Compound Components - Recommended):
 *   import { TherapeuticBaseCard } from '@/components/ui/therapeutic-cards';
 *   
 *   <TherapeuticBaseCard.Root variant="therapeutic" collapsible>
 *     <TherapeuticBaseCard.Header title="Title" subtitle="Subtitle">
 *       <TherapeuticBaseCard.Actions actions={[...]} />
 *       <TherapeuticBaseCard.Collapse />
 *     </TherapeuticBaseCard.Header>
 *     <TherapeuticBaseCard.Content>
 *       Content
 *     </TherapeuticBaseCard.Content>
 *   </TherapeuticBaseCard.Root>
 * 
 * OR use specialized cards:
 *   import { CBTSectionCard } from '@/components/ui/therapeutic-cards';
 *   
 *   <CBTSectionCard
 *     title="Identify Thoughts"
 *     stepIndicator={{ current: 1, total: 5 }}
 *     progressPercentage={20}
 *   >
 *     Content
 *   </CBTSectionCard>
 */

// Re-export everything from the new structure
export {
  TherapeuticBaseCard,
  CBTSectionCard,
  EmotionCard,
  SessionCard,
  therapeuticCardPresets,
  therapeuticCardClasses,
  type TherapeuticBaseCardProps,
  type CBTSectionCardProps,
  type EmotionCardProps,
  type SessionCardProps,
} from './index';
