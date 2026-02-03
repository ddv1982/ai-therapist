import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Apple-style skeleton with shimmer effect
        'bg-muted relative animate-pulse overflow-hidden rounded-md',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
