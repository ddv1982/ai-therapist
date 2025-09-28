'use client';

import { useEffect, useState } from 'react';

export function useChatViewport() {
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState('100vh');

  useEffect(() => {
    const updateViewport = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        const actualHeight = Math.min(window.innerHeight, window.screen.height);
        const value = `${actualHeight}px`;
        setViewportHeight(value);
        document.documentElement.style.setProperty('--app-height', value);
        document.documentElement.style.setProperty('--vh', `${actualHeight * 0.01}px`);
      } else {
        setViewportHeight('100vh');
        document.documentElement.style.removeProperty('--app-height');
        document.documentElement.style.removeProperty('--vh');
      }
    };

    updateViewport();
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateViewport, 150);
    };

    window.addEventListener('resize', handleResize);
    const handleOrientationChange = () => setTimeout(updateViewport, 300);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return { isMobile, viewportHeight } as const;
}
