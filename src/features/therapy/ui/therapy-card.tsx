import { type Ref } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const therapyCardVariants = cva('therapy-card transition-all duration-200', {
  variants: {
    variant: {
      default: 'bg-card shadow-apple-sm hover:shadow-apple-md',
      primary: 'bg-primary/5 shadow-apple-sm hover:shadow-apple-md',
      accent: 'bg-accent/5 shadow-apple-sm hover:shadow-apple-md',
      success: 'bg-green-950/20 shadow-apple-sm hover:shadow-apple-md',
      warning: 'bg-yellow-950/20 shadow-apple-sm hover:shadow-apple-md',
      destructive: 'bg-destructive/5 shadow-apple-sm hover:shadow-apple-md',
      muted: 'bg-muted/50 hover:bg-muted/70 shadow-apple-sm hover:shadow-apple-md',
    },
    size: {
      default: 'p-4',
      sm: 'p-2',
      lg: 'p-6',
      xl: 'p-8',
    },
    elevation: {
      none: 'shadow-none',
      sm: 'shadow-apple-sm hover:shadow-apple-md',
      md: 'shadow-apple-md hover:shadow-apple-lg',
      lg: 'shadow-apple-lg hover:shadow-apple-xl',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    elevation: 'sm',
  },
});

interface TherapyCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof therapyCardVariants> {
  title?: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'success' | 'warning' | 'info' | 'therapy';
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  ref?: Ref<HTMLDivElement>;
}

function TherapyCard({
  className,
  variant,
  size,
  elevation,
  title,
  subtitle,
  description,
  badge,
  badgeVariant = 'therapy',
  icon,
  action,
  children,
  ref,
  ...props
}: TherapyCardProps) {
    return (
      <Card
        ref={ref}
        className={cn(therapyCardVariants({ variant, size, elevation }), className)}
        {...props}
      >
        {/* Header Section */}
        {(title || subtitle || badge || icon || action) && (
          <div className="mb-2 flex items-start justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              {/* Icon */}
              {icon && (
                <div className="bg-primary/10 text-primary flex-shrink-0 rounded p-1">{icon}</div>
              )}

              {/* Title and Subtitle */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-1">
                  {title && (
                    <h3 className="text-foreground truncate text-xl font-semibold">{title}</h3>
                  )}
                  {badge && (
                    <Badge variant={badgeVariant} size="sm">
                      {badge}
                    </Badge>
                  )}
                </div>
                {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
              </div>
            </div>

            {/* Action */}
            {action && <div className="ml-2 flex-shrink-0">{action}</div>}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-muted-foreground mb-4 text-sm leading-relaxed">{description}</p>
        )}

        {/* Content */}
        {children && <div className="therapy-card-content">{children}</div>}
      </Card>
    );
}

// Specialized variants for common therapy use cases
function InsightCard({ ref, ...props }: Omit<TherapyCardProps, 'variant'>) {
  return <TherapyCard ref={ref} variant="accent" badgeVariant="info" {...props} />;
}

function ProgressCard({ ref, ...props }: Omit<TherapyCardProps, 'variant'>) {
  return <TherapyCard ref={ref} variant="success" badgeVariant="success" {...props} />;
}

function ConcernCard({ ref, ...props }: Omit<TherapyCardProps, 'variant'>) {
  return <TherapyCard ref={ref} variant="warning" badgeVariant="warning" {...props} />;
}

function ActionCard({ ref, ...props }: Omit<TherapyCardProps, 'variant'>) {
  return <TherapyCard ref={ref} variant="primary" badgeVariant="therapy" {...props} />;
}

export {
  TherapyCard,
  InsightCard,
  ProgressCard,
  ConcernCard,
  ActionCard,
  therapyCardVariants,
  type TherapyCardProps,
};
