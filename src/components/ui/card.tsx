import { type Ref } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-lg transition-all duration-base ease-out-smooth',
  {
    variants: {
      variant: {
        // Default solid card with subtle shadow (borderless)
        default: 'bg-card text-card-foreground shadow-apple-sm hover:shadow-apple-md',
        // Glass card with Apple frosted glass effect (border for frosted frame)
        glass:
          'bg-[var(--glass-white)] backdrop-blur-glass backdrop-saturate-glass border border-[var(--glass-border)] text-foreground shadow-apple-md hover:shadow-apple-lg',
        // Elevated card with hover lift effect (borderless)
        elevated:
          'bg-card text-card-foreground shadow-apple-md hover:shadow-apple-lg hover:-translate-y-0.5',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  ref?: Ref<HTMLDivElement>;
}

function Card({ className, variant, ref, ...props }: CardProps) {
  return <div ref={ref} className={cn(cardVariants({ variant, className }))} {...props} />;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

function CardHeader({ className, ref, ...props }: CardHeaderProps) {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-2 p-6', className)} // 24px padding following 8pt grid
      {...props}
    />
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  ref?: Ref<HTMLParagraphElement>;
}

function CardTitle({ className, ref, ...props }: CardTitleProps) {
  return (
    <h3
      ref={ref}
      className={cn('text-xl leading-none font-semibold tracking-tight', className)}
      {...props}
    />
  );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  ref?: Ref<HTMLParagraphElement>;
}

function CardDescription({ className, ref, ...props }: CardDescriptionProps) {
  return <p ref={ref} className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

function CardContent({ className, ref, ...props }: CardContentProps) {
  return (
    <div
      ref={ref}
      className={cn('p-6 pt-0', className)} // 24px padding, no top padding
      {...props}
    />
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

function CardFooter({ className, ref, ...props }: CardFooterProps) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)} // 24px padding, no top padding
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
