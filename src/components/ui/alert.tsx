import { type Ref } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-xl border px-4 py-3 text-sm transition-all duration-base [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-8 shadow-apple-sm',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground border-border',
        destructive: 'border-destructive/30 bg-destructive/10 text-destructive [&>svg]:text-destructive',
        success: 'border-therapy-success/30 bg-therapy-success/10 text-therapy-success [&>svg]:text-therapy-success',
        warning: 'border-therapy-warning/30 bg-therapy-warning/10 text-therapy-warning [&>svg]:text-therapy-warning',
        info: 'border-therapy-info/30 bg-therapy-info/10 text-therapy-info [&>svg]:text-therapy-info',
        therapy: 'border-primary/30 bg-primary/10 text-primary [&>svg]:text-primary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  ref?: Ref<HTMLDivElement>;
}

function Alert({ className, variant, ref, ...props }: AlertProps) {
  return (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  );
}

interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  ref?: Ref<HTMLParagraphElement>;
}

function AlertTitle({ className, ref, ...props }: AlertTitleProps) {
  return (
    <h5
      ref={ref}
      className={cn('mb-1 leading-none font-semibold tracking-tight', className)}
      {...props}
    />
  );
}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  ref?: Ref<HTMLParagraphElement>;
}

function AlertDescription({ className, ref, ...props }: AlertDescriptionProps) {
  return <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
