'use client';

import React from 'react';
import { Button } from '@/components/ui/primitives/button';
import { formatDuration } from '@/lib/utils/utils';
import type { SessionControlsProps } from '@/types';
import { Play, Square } from 'lucide-react';

export function SessionControls({
  sessionId,
  onStartSession,
  onEndSession,
  sessionDuration,
  status
}: SessionControlsProps) {
  const isActive = status === 'active';
  const isPaused = status === 'paused';

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card">
      <div className="flex items-center space-x-4">
        <div className="text-therapy-lg font-semibold">
          {sessionId ? `Session Active` : 'Ready to Start'}
        </div>
        {sessionId && (
          <div className="text-therapy-base text-muted-foreground">
            Duration: {formatDuration(sessionDuration)}
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-therapy-sm ${
          isActive 
            ? 'bg-green-100 text-green-800' 
            : isPaused 
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isActive ? 'bg-green-500' : isPaused ? 'bg-yellow-500' : 'bg-gray-500'
          }`} />
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