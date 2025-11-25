/**
 * Lazy-loaded Session Analytics Components
 *
 * These wrappers enable code splitting for heavy chart components (recharts library).
 * Use these instead of importing directly from session-analytics.tsx to reduce initial bundle size.
 */

'use client';

import dynamic from 'next/dynamic';
import { ChartSkeleton } from '@/components/ui/loading-fallback';

/**
 * Lazy-loaded SessionAnalytics component
 * Use this for session activity charts
 */
export const SessionAnalytics = dynamic(
  () => import('./session-analytics').then((mod) => ({ default: mod.SessionAnalytics })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

/**
 * Lazy-loaded MessageDistribution component
 * Use this for message distribution bar charts
 */
export const MessageDistribution = dynamic(
  () => import('./session-analytics').then((mod) => ({ default: mod.MessageDistribution })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

/**
 * Lazy-loaded ProgressTrend component
 * Use this for progress trend area charts
 */
export const ProgressTrend = dynamic(
  () => import('./session-analytics').then((mod) => ({ default: mod.ProgressTrend })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);
