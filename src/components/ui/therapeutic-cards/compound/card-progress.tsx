'use client';

export interface CardProgressProps {
  value: number;
  className?: string;
}

/**
 * Card progress compound component
 * Displays progress bar for CBT sections
 */
export function CardProgress({ value, className }: CardProgressProps) {
  return (
    <div className={`bg-muted mt-3 h-1 w-full overflow-hidden rounded-full ${className || ''}`}>
      <div
        className="from-primary to-accent h-full bg-gradient-to-r transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
