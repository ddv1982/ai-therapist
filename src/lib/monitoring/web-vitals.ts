/**
 * Web Vitals Performance Monitoring
 * 
 * Tracks Core Web Vitals metrics for performance observability:
 * - LCP (Largest Contentful Paint): Loading performance
 * - INP (Interaction to Next Paint): Interactivity (replaces FID)
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FCP (First Contentful Paint): Initial paint
 * - TTFB (Time to First Byte): Server response time
 * 
 * @fileoverview Client-side performance monitoring with Web Vitals
 * @version 1.0.0
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { logger } from '@/lib/utils/logger';
import { isDevelopment } from '@/config/env.public';

/**
 * Performance metric thresholds based on Web Vitals recommendations
 * Good: Green, Needs Improvement: Yellow, Poor: Red
 */
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint (ms) - replaces FID
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift (score)
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint (ms)
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte (ms)
};

/**
 * Determine performance rating based on metric value
 */
function getRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metric.name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (metric.value <= threshold.good) return 'good';
  if (metric.value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Send metric to analytics/monitoring service
 * 
 * In production, this would send to:
 * - Vercel Analytics
 * - Google Analytics
 * - DataDog
 * - Custom monitoring endpoint
 */
function sendToAnalytics(metric: Metric): void {
  const rating = getRating(metric);
  const path = window.location.pathname;

  // Log to structured logger
  logger.info('Web Vitals Metric', {
    metric: metric.name,
    value: Math.round(metric.value),
    rating,
    route: path,
    id: metric.id,
    navigationType: metric.navigationType,
  });

  // In development, also show in console for debugging
  if (isDevelopment) {
    const color = rating === 'good' ? '🟢' : rating === 'needs-improvement' ? '🟡' : '🔴';
    // eslint-disable-next-line no-console
    console.info(
      `${color} ${metric.name}: ${Math.round(metric.value)} (${rating}) [${path}]`
    );
  }

  // Send to analytics service
  // Example: Vercel Analytics
  if (typeof window !== 'undefined' && 'webVitals' in window) {
    // Vercel Analytics automatically collects Web Vitals
    // No additional code needed if using Vercel deployment
  }

  // Example: Google Analytics
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as any).gtag;
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.value),
      non_interaction: true,
    });
  }

  // Example: Custom monitoring endpoint
  // Uncomment to send to custom backend
  /*
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating,
        route: path,
        id: metric.id,
      }),
    }).catch((error) => {
      logger.error('Failed to send Web Vitals metric', { metric: metric.name }, error);
    });
  }
  */
}

/**
 * Initialize Web Vitals monitoring
 * 
 * Call this once in your root layout or _app component:
 * ```tsx
 * useEffect(() => {
 *   reportWebVitals();
 * }, []);
 * ```
 */
export function reportWebVitals(): void {
  // Only run on client-side
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Register all Web Vitals metrics
    onCLS(sendToAnalytics);
    onFCP(sendToAnalytics);
    onINP(sendToAnalytics); // Replaces FID in web-vitals v4+
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  } catch (error) {
    logger.error('Failed to initialize Web Vitals monitoring', {}, error as Error);
  }
}

/**
 * Export thresholds for testing and documentation
 */
export { THRESHOLDS };
