'use client';

import { Suspense } from 'react';
import { ErrorBoundary as ChatErrorBoundary } from '@/components/ui/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Loader2 } from 'lucide-react';

interface SuspenseChatProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

// Chat loading skeleton
function ChatSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col space-y-6 p-4">
      {/* Header skeleton */}
      <div className="border-border flex items-center gap-3 border-b pb-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Message skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          {/* User message */}
          <div className="flex justify-end">
            <div className="flex max-w-2xl items-start gap-3">
              <div className="bg-primary/10 space-y-2 rounded-lg p-4">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>

          {/* Assistant message */}
          <div className="flex justify-start">
            <div className="flex max-w-2xl items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="bg-muted/50 space-y-2 rounded-lg p-4">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Input skeleton */}
      <div className="bg-background border-border sticky bottom-0 border-t pt-4">
        <div className="flex gap-2">
          <Skeleton className="h-12 flex-1 rounded-lg" />
          <Skeleton className="h-12 w-12 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Connection loading component
function ConnectionSkeleton() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="space-y-4 text-center">
        <div className="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
        <div className="space-y-2">
          <h3 className="text-foreground text-xl font-semibold">Connecting to AI Therapist</h3>
          <p className="text-muted-foreground max-w-md text-sm">
            Setting up your secure therapeutic session...
          </p>
        </div>
      </div>
    </div>
  );
}

// Error fallback component
function ChatErrorFallback() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="max-w-md space-y-4 text-center">
        <div className="bg-destructive/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
          <MessageSquare className="text-destructive h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-foreground text-xl font-semibold">Unable to Load Chat</h3>
          <p className="text-muted-foreground text-sm">
            There was an issue loading the chat interface. This is usually temporary.
          </p>
        </div>
      </div>
    </div>
  );
}

export function SuspenseChat({
  children,
  fallback = <ChatSkeleton />,
  errorFallback = <ChatErrorFallback />,
}: SuspenseChatProps) {
  return (
    <ChatErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </ChatErrorBoundary>
  );
}

// Specialized suspense wrappers
export function SuspenseChatConnection({ children }: { children: React.ReactNode }) {
  return <SuspenseChat fallback={<ConnectionSkeleton />}>{children}</SuspenseChat>;
}

export function SuspenseChatMessages({ children }: { children: React.ReactNode }) {
  return (
    <SuspenseChat
      fallback={
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex justify-start">
              <div className="flex max-w-2xl items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="bg-muted/50 space-y-2 rounded-lg p-4">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </div>
          ))}
        </div>
      }
    >
      {children}
    </SuspenseChat>
  );
}
