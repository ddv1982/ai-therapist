'use client';

import { ReactElement } from 'react';
import { CardRoot } from '@/components/ui/therapeutic-cards/compound/card-root';
import { CardHeader } from '@/components/ui/therapeutic-cards/compound/card-header';
import { CardContent } from '@/components/ui/therapeutic-cards/compound/card-content';
import { CardActions } from '@/components/ui/therapeutic-cards/compound/card-actions';
import { CardProgress } from '@/components/ui/therapeutic-cards/compound/card-progress';
import { CardCollapse } from '@/components/ui/therapeutic-cards/compound/card-collapse';
import { CardAction } from '@/components/ui/therapeutic-cards/compound/card-action';
import type { TherapeuticBaseCardProps } from './card-types';

/**
 * Legacy wrapper that maintains the old monolithic API
 * Uses compound components under the hood
 *
 * For new code, prefer using compound components directly:
 * <TherapeuticCard variant="therapeutic">
 *   <TherapeuticCard.Header title="Title" />
 *   <TherapeuticCard.Content>...</TherapeuticCard.Content>
 * </TherapeuticCard>
 */
const TherapeuticBaseCardComponent = function TherapeuticBaseCard({
  title,
  subtitle,
  content,
  children,
  variant,
  size,
  stepIndicator,
  statusBadge,
  isDraftSaved,
  collapsible,
  defaultExpanded,
  onToggle,
  onAction,
  actionLabel,
  actionIcon,
  secondaryActions,
  animationDelay,
  className,
  headerClassName,
  contentClassName,
  headerLayout,
  contentPadding,
  emotionColor,
  progressPercentage,
  mobileOptimized,
  hideOnMobile,
  ...props
}: TherapeuticBaseCardProps) {
  return (
    <CardRoot
      variant={variant}
      size={size}
      collapsible={collapsible}
      defaultExpanded={defaultExpanded}
      onToggle={onToggle}
      onAction={onAction}
      mobileOptimized={mobileOptimized}
      hideOnMobile={hideOnMobile}
      emotionColor={emotionColor}
      animationDelay={animationDelay}
      className={className}
      {...props}
    >
      {(title || subtitle || stepIndicator || statusBadge || collapsible || secondaryActions) && (
        <CardHeader
          title={title}
          subtitle={subtitle}
          stepIndicator={stepIndicator}
          statusBadge={statusBadge}
          isDraftSaved={isDraftSaved}
          headerLayout={headerLayout}
          className={headerClassName}
        >
          <CardActions actions={secondaryActions} />
          {collapsible && <CardCollapse />}
        </CardHeader>
      )}

      {progressPercentage !== undefined && <CardProgress value={progressPercentage} />}

      <CardContent contentPadding={contentPadding} className={contentClassName}>
        {content || children}
      </CardContent>

      {onAction && actionLabel && (
        <CardAction onClick={onAction} label={actionLabel} icon={actionIcon} />
      )}
    </CardRoot>
  );
};

// Create compound component interface
interface TherapeuticBaseCardComponent {
  (props: TherapeuticBaseCardProps): ReactElement;
  Root: typeof CardRoot;
  Header: typeof CardHeader;
  Content: typeof CardContent;
  Actions: typeof CardActions;
  Progress: typeof CardProgress;
  Collapse: typeof CardCollapse;
  Action: typeof CardAction;
}

// Export component with compound components attached
export const TherapeuticBaseCard = TherapeuticBaseCardComponent as TherapeuticBaseCardComponent;

// Attach compound components
TherapeuticBaseCard.Root = CardRoot;
TherapeuticBaseCard.Header = CardHeader;
TherapeuticBaseCard.Content = CardContent;
TherapeuticBaseCard.Actions = CardActions;
TherapeuticBaseCard.Progress = CardProgress;
TherapeuticBaseCard.Collapse = CardCollapse;
TherapeuticBaseCard.Action = CardAction;
