import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Apple-style skeleton with shimmer effect
        'bg-muted relative overflow-hidden rounded-md animate-pulse',
        className
      )}
      {...props}
    />
  );
}

// Common skeleton patterns for the chat app
function MessageSkeleton() {
  return (
    <div className="animate-message-in">
      <div className="mb-6 flex justify-start gap-4">
        <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

function SessionSkeleton() {
  return (
    <div className="animate-fade-in mb-3 p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 flex-shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

function SettingsFormSkeleton() {
  return (
    <div className="mt-4 space-y-4">
      <div>
        <Skeleton className="mb-2 h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div>
        <Skeleton className="mb-2 h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div>
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="mt-1 h-3 w-3/4" />
      </div>
    </div>
  );
}

export { Skeleton, MessageSkeleton, SessionSkeleton, SettingsFormSkeleton };
