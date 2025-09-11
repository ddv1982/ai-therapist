import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const therapyCardVariants = cva(
  "therapy-card transition-all duration-200 hover:shadow-md",
  {
    variants: {
      variant: {
        default: "border-border bg-card",
        primary: "border-primary/20 bg-primary/5 hover:border-primary/30",
        accent: "border-accent/20 bg-accent/5 hover:border-accent/30",
        success: "border-green-500/20 bg-green-50 dark:bg-green-950/20 hover:border-green-500/30",
        warning: "border-yellow-500/20 bg-yellow-50 dark:bg-yellow-950/20 hover:border-yellow-500/30",
        destructive: "border-destructive/20 bg-destructive/5 hover:border-destructive/30",
        muted: "border-muted bg-muted/50 hover:bg-muted/70",
      },
      size: {
        default: "p-4",
        sm: "p-2",
        lg: "p-6",
        xl: "p-8",
      },
      elevation: {
        none: "shadow-none",
        sm: "shadow-sm",
        md: "shadow-md",
        lg: "shadow-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      elevation: "sm",
    },
  }
);

interface TherapyCardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof therapyCardVariants> {
  title?: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "success" | "warning" | "info" | "therapy";
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

const TherapyCard = React.forwardRef<HTMLDivElement, TherapyCardProps>(
  ({
    className,
    variant,
    size,
    elevation,
    title,
    subtitle,
    description,
    badge,
    badgeVariant = "therapy",
    icon,
    action,
    children,
    ...props
  }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(therapyCardVariants({ variant, size, elevation }), className)}
        {...props}
      >
        {/* Header Section */}
        {(title || subtitle || badge || icon || action) && (
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              {/* Icon */}
              {icon && (
                <div className="flex-shrink-0 p-1 rounded bg-primary/10 text-primary">
                  {icon}
                </div>
              )}
              
              {/* Title and Subtitle */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  {title && (
                    <h3 className="text-xl font-semibold text-foreground truncate">
                      {title}
                    </h3>
                  )}
                  {badge && (
                    <Badge variant={badgeVariant} size="sm">
                      {badge}
                    </Badge>
                  )}
                </div>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            
            {/* Action */}
            {action && (
              <div className="flex-shrink-0 ml-2">
                {action}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {description}
          </p>
        )}

        {/* Content */}
        {children && (
          <div className="therapy-card-content">
            {children}
          </div>
        )}
      </Card>
    );
  }
);

TherapyCard.displayName = "TherapyCard";

// Specialized variants for common therapy use cases
const InsightCard = React.forwardRef<HTMLDivElement, Omit<TherapyCardProps, 'variant'>>(
  (props, ref) => (
    <TherapyCard ref={ref} variant="accent" badgeVariant="info" {...props} />
  )
);
InsightCard.displayName = "InsightCard";

const ProgressCard = React.forwardRef<HTMLDivElement, Omit<TherapyCardProps, 'variant'>>(
  (props, ref) => (
    <TherapyCard ref={ref} variant="success" badgeVariant="success" {...props} />
  )
);
ProgressCard.displayName = "ProgressCard";

const ConcernCard = React.forwardRef<HTMLDivElement, Omit<TherapyCardProps, 'variant'>>(
  (props, ref) => (
    <TherapyCard ref={ref} variant="warning" badgeVariant="warning" {...props} />
  )
);
ConcernCard.displayName = "ConcernCard";

const ActionCard = React.forwardRef<HTMLDivElement, Omit<TherapyCardProps, 'variant'>>(
  (props, ref) => (
    <TherapyCard ref={ref} variant="primary" badgeVariant="therapy" {...props} />
  )
);
ActionCard.displayName = "ActionCard";

export { 
  TherapyCard, 
  InsightCard, 
  ProgressCard, 
  ConcernCard, 
  ActionCard,
  therapyCardVariants,
  type TherapyCardProps
};