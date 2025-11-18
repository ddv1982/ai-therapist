'use client';

import { useEffect, useState } from 'react';
import { isDevelopment } from '@/config/env.public';

declare global {
  interface Window {
    __DEV_THROW__?: () => void;
  }
}

// Headless dev-only error probe to test ErrorBoundaries without any visible UI.
// Triggers a render-time error (caught by ErrorBoundary) via one of:
// - Keyboard: Cmd/Ctrl + Shift + E
// - URL flag: ?devThrow=1
// - Console: window.__DEV_THROW__()
export function DevErrorTrigger(): null {
  const isDev = isDevelopment;

  const [shouldThrow, setShouldThrow] = useState(false);

  useEffect(() => {
    if (!isDev) return;

    const trigger = () => setShouldThrow(true);

    window.__DEV_THROW__ = trigger;

    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('devThrow')) {
        setTimeout(trigger, 0);
      }
    } catch {
      // no-op
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const primary = isMac ? e.metaKey : e.ctrlKey;
      if (primary && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        trigger();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (window.__DEV_THROW__ === trigger) {
        delete window.__DEV_THROW__;
      }
    };
  }, [isDev]);

  if (!isDev) return null;
  if (shouldThrow) {
    throw new Error('Synthetic dev error to test ErrorBoundary');
  }
  return null;
}
