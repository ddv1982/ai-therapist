'use client';

import React from 'react';
import type { MemoryContextInfo } from '@/lib/chat/memory-utils';
import { Button } from '@/components/ui/button';
import { Sparkles, Trash2 } from 'lucide-react';

interface SystemBannerProps {
  hasMemory: boolean;
  messageCount: number;
  isMobile: boolean;
  onManageMemory: () => void;
  formatText: (info: MemoryContextInfo) => string;
  contextInfo: MemoryContextInfo;
}

export function SystemBanner({ hasMemory, messageCount, isMobile, onManageMemory, formatText, contextInfo }: SystemBannerProps) {
  if (!hasMemory || messageCount === 0) return null;

  return (
    <div className={`mb-4 ${isMobile ? 'mx-1' : 'mx-2'}`} role="status" aria-live="polite">
      <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-primary/80 flex items-center gap-2">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            <span>{formatText(contextInfo)}</span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onManageMemory}
            className="text-primary/60 hover:text-primary hover:bg-primary/10 h-6 px-2"
            aria-label="Manage memory"
          >
            <Trash2 className="w-3 h-3" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
