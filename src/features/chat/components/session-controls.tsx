'use client';

import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/utils/utils';
import type { SessionControlsProps } from '@/types';
import { Play, Square } from 'lucide-react';

export function SessionControls({
  sessionId,
  onStartSession,
  onEndSession,
  sessionDuration,
  status,
}: SessionControlsProps) {
  const isActive = status === 'active';
  const isPaused = status === 'paused';

  return (
    <div className="border-border bg-card flex items-center justify-between border-b p-4">
      <div className="flex items-center space-x-4">
        <div className="text-xl font-semibold">
          {sessionId ? `Session Active` : 'Ready to Start'}
        </div>
        {sessionId && (
          <div className="text-muted-foreground text-base">
            Duration: {formatDuration(sessionDuration)}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div
          className={`flex items-center space-x-2 rounded-full px-3 py-1 text-sm ${
            isActive
              ? 'bg-green-100 text-green-800'
              : isPaused
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
          }`}
        >
          <div
            className={`h-2 w-2 rounded-full ${
              isActive ? 'bg-green-500' : isPaused ? 'bg-yellow-500' : 'bg-gray-500'
            }`}
          />
          <span className="capitalize">{status}</span>
        </div>

        {!sessionId ? (
          <Button onClick={onStartSession} size="sm" className="flex items-center space-x-2">
            <Play size={16} />
            <span>Start Session</span>
          </Button>
        ) : (
          <Button
            onClick={onEndSession}
            variant="destructive"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Square size={16} />
            <span>End Session</span>
          </Button>
        )}
      </div>
    </div>
  );
}
