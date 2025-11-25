'use client';

import { ReactNode } from 'react';
import { CardRoot } from '@/components/ui/therapeutic-cards/compound/card-root';
import { CardHeader } from '@/components/ui/therapeutic-cards/compound/card-header';
import { CardContent } from '@/components/ui/therapeutic-cards/compound/card-content';
import { CardActions } from '@/components/ui/therapeutic-cards/compound/card-actions';
import { CardAction } from '@/components/ui/therapeutic-cards/compound/card-action';
import type { CardAction as CardActionType } from '../base/card-types';

export interface SessionCardProps {
  title: string;
  subtitle?: string;
  statusBadge?: { text: string; variant?: 'default' | 'therapy' | 'success' | 'warning' };
  children: ReactNode;
  onAction?: () => void;
  actionLabel?: string;
  actionIcon?: ReactNode;
  secondaryActions?: CardActionType[];
  className?: string;
}

/**
 * Specialized card for session reports
 * Pre-configured with interactive styling and action buttons
 */
export function SessionCard({
  title,
  subtitle,
  statusBadge,
  children,
  onAction,
  actionLabel,
  actionIcon,
  secondaryActions,
  className,
}: SessionCardProps) {
  return (
    <CardRoot
      variant="interactive"
      size="lg"
      onAction={onAction}
      mobileOptimized={true}
      className={className}
    >
      <CardHeader title={title} subtitle={subtitle} statusBadge={statusBadge} headerLayout="split">
        <CardActions actions={secondaryActions} />
      </CardHeader>

      <CardContent contentPadding="md">{children}</CardContent>

      {onAction && actionLabel && (
        <CardAction onClick={onAction} label={actionLabel} icon={actionIcon} />
      )}
    </CardRoot>
  );
}
