'use client';

import { useEffect, useState } from 'react';
import { checkMemoryContext, type MemoryContextInfo } from '@/lib/chat/memory-utils';

export function useMemoryContext(sessionId: string | null) {
  const [memoryContext, setMemoryContext] = useState<MemoryContextInfo>({
    hasMemory: false,
    reportCount: 0,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const info = await checkMemoryContext(sessionId ?? undefined);
        if (active) setMemoryContext(info);
      } catch {
        // ignore
      }
    })();
    return () => {
      active = false;
    };
  }, [sessionId]);

  return { memoryContext, setMemoryContext } as const;
}
