'use client';

import React, { Suspense } from 'react';
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
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full space-y-6 p-4">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
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
            <div className="flex items-start gap-3 max-w-2xl">
              <div className="bg-primary/10 rounded-lg p-4 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>

          {/* Assistant message */}
          <div className="flex justify-start">
            <div className="flex items-start gap-3 max-w-2xl">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Input skeleton */}
      <div className="sticky bottom-0 bg-background pt-4 border-t border-border">
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-12 rounded-lg" />
          <Skeleton className="h-12 w-12 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Connection loading component
function ConnectionSkeleton() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Connecting to AI Therapist
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
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
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-md">
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
          <MessageSquare className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Unable to Load Chat
          </h3>
          <p className="text-sm text-muted-foreground">
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
  errorFallback = <ChatErrorFallback />
}: SuspenseChatProps) {
  return (
    <ChatErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ChatErrorBoundary>
  );
}

// Specialized suspense wrappers
export function SuspenseChatConnection({ children }: { children: React.ReactNode }) {
  return (
    <SuspenseChat fallback={<ConnectionSkeleton />}>
      {children}
    </SuspenseChat>
  );
}

export function SuspenseChatMessages({ children }: { children: React.ReactNode }) {
  return (
    <SuspenseChat fallback={
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex justify-start">
            <div className="flex items-start gap-3 max-w-2xl">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
        ))}
      </div>
    }>
      {children}
    </SuspenseChat>
  );
}