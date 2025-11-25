'use client';

import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/monitoring/web-vitals';

/**
 * Web Vitals Reporter Component
 *
 * Initializes Web Vitals monitoring on the client side.
 * Should be included once in the root layout/providers.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    reportWebVitals();
  }, []);

  // This component doesn't render anything
  return null;
}
