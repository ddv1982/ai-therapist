/**
 * Performance optimization utilities for therapeutic AI application
 * Provides code splitting, lazy loading, and bundle optimization helpers
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react';
import { logger } from '@/lib/logger';

// ============================================================================
// DYNAMIC COMPONENT LOADING
// ============================================================================

/**
 * Enhanced lazy loading with error boundary and loading states
 */
export function createLazyComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  componentName: string
): LazyExoticComponent<ComponentType<T>> {
  return lazy(async () => {
    const startTime = performance.now();
    
    try {
      const component = await importFn();
      const loadTime = performance.now() - startTime;
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Component ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
      }
      
      return component;
    } catch (error) {
      logger.error(`Failed to load component ${componentName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        componentName,
        loadTime: performance.now() - startTime
      });
      
      // Return a fallback error component
      return {
        default: (() => (
          <div className="p-4 text-center text-muted-foreground">
            <p>Unable to load component. Please refresh the page.</p>
          </div>
        )) as ComponentType<T>
      };
    }
  });
}

/**
 * Preload component for better user experience
 */
export function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<any> }>,
  componentName: string
): void {
  // Use requestIdleCallback if available, otherwise setTimeout
  const preload = () => {
    importFn().then(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Preloaded component: ${componentName}`);
      }
    }).catch((error) => {
      logger.warn(`Failed to preload component ${componentName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        componentName
      });
    });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(preload);
  } else {
    setTimeout(preload, 100);
  }
}

// ============================================================================
// THERAPEUTIC-SPECIFIC COMPONENT SPLITTING
// ============================================================================

/**
 * Lazy loaded CBT diary modal for better initial bundle size
 */
export const LazyCSBTDiaryModal = createLazyComponent(
  () => import('@/components/cbt/cbt-diary-modal'),
  'CBTDiaryModal'
);

/**
 * Lazy loaded settings panel for non-critical functionality
 */
export const LazySettingsPanel = createLazyComponent(
  () => import('@/components/chat/settings-panel'),
  'SettingsPanel'
);

/**
 * Lazy loaded security settings for administrative features
 */
export const LazySecuritySettings = createLazyComponent(
  () => import('@/components/auth/security-settings'),
  'SecuritySettings'
);

// ============================================================================
// BUNDLE ANALYSIS UTILITIES
// ============================================================================

/**
 * Performance monitoring for therapeutic session loading
 */
export class TherapeuticPerformanceMonitor {
  private static instance: TherapeuticPerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): TherapeuticPerformanceMonitor {
    if (!TherapeuticPerformanceMonitor.instance) {
      TherapeuticPerformanceMonitor.instance = new TherapeuticPerformanceMonitor();
    }
    return TherapeuticPerformanceMonitor.instance;
  }

  /**
   * Record component load time
   */
  recordLoadTime(componentName: string, loadTime: number): void {
    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, []);
    }
    
    const times = this.metrics.get(componentName)!;
    times.push(loadTime);
    
    // Keep only last 10 measurements
    if (times.length > 10) {
      times.shift();
    }
  }

  /**
   * Get average load time for a component
   */
  getAverageLoadTime(componentName: string): number {
    const times = this.metrics.get(componentName);
    if (!times || times.length === 0) return 0;
    
    const sum = times.reduce((acc, time) => acc + time, 0);
    return sum / times.length;
  }

  /**
   * Get performance report for therapeutic components
   */
  getPerformanceReport(): Record<string, {
    averageLoadTime: number;
    measurements: number;
    performance: 'excellent' | 'good' | 'fair' | 'poor';
  }> {
    const report: Record<string, any> = {};
    
    this.metrics.forEach((times, componentName) => {
      const averageLoadTime = this.getAverageLoadTime(componentName);
      
      let performance: 'excellent' | 'good' | 'fair' | 'poor';
      if (averageLoadTime < 100) performance = 'excellent';
      else if (averageLoadTime < 250) performance = 'good';
      else if (averageLoadTime < 500) performance = 'fair';
      else performance = 'poor';
      
      report[componentName] = {
        averageLoadTime: Math.round(averageLoadTime),
        measurements: times.length,
        performance
      };
    });
    
    return report;
  }
}

// ============================================================================
// MEMORY OPTIMIZATION FOR THERAPEUTIC SESSIONS
// ============================================================================

/**
 * Memory-efficient message history management
 */
export class TherapeuticMessageCache {
  private cache: Map<string, any[]> = new Map();
  private maxCacheSize = 1000; // Maximum messages to keep in memory
  private maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Store messages for a session with automatic cleanup
   */
  setMessages(sessionId: string, messages: any[]): void {
    // Limit message history to prevent memory bloat
    const limitedMessages = messages.slice(-this.maxCacheSize);
    
    this.cache.set(sessionId, {
      messages: limitedMessages,
      timestamp: Date.now(),
      size: JSON.stringify(limitedMessages).length
    });
    
    // Trigger cleanup if cache is getting large
    if (this.cache.size > 10) {
      this.cleanup();
    }
  }

  /**
   * Get cached messages for a session
   */
  getMessages(sessionId: string): any[] | null {
    const cached = this.cache.get(sessionId);
    if (!cached) return null;
    
    // Check if cache is stale
    if (Date.now() - cached.timestamp > this.maxSessionAge) {
      this.cache.delete(sessionId);
      return null;
    }
    
    return cached.messages;
  }

  /**
   * Cleanup old sessions from cache
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.maxSessionAge) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Cleaned up ${keysToDelete.length} stale cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalSessions: number;
    totalSize: number;
    averageSessionSize: number;
  } {
    let totalSize = 0;
    let sessionCount = 0;
    
    this.cache.forEach((value) => {
      totalSize += value.size;
      sessionCount++;
    });
    
    return {
      totalSessions: sessionCount,
      totalSize: Math.round(totalSize / 1024), // KB
      averageSessionSize: sessionCount > 0 ? Math.round((totalSize / sessionCount) / 1024) : 0 // KB
    };
  }
}

// ============================================================================
// THERAPEUTIC UI OPTIMIZATION
// ============================================================================

/**
 * Optimize therapeutic message rendering for large sessions
 */
export function optimizeMessageRendering(messages: any[]): {
  visibleMessages: any[];
  totalCount: number;
  shouldVirtualize: boolean;
} {
  const VIRTUALIZATION_THRESHOLD = 100;
  const INITIAL_VISIBLE_COUNT = 50;
  
  const shouldVirtualize = messages.length > VIRTUALIZATION_THRESHOLD;
  
  if (shouldVirtualize) {
    // Show most recent messages initially
    const visibleMessages = messages.slice(-INITIAL_VISIBLE_COUNT);
    
    return {
      visibleMessages,
      totalCount: messages.length,
      shouldVirtualize: true
    };
  }
  
  return {
    visibleMessages: messages,
    totalCount: messages.length,
    shouldVirtualize: false
  };
}

/**
 * Debounced input handler for therapeutic message input
 */
export function createDebouncedInputHandler(
  handler: (value: string) => void,
  delay: number = 300
): (value: string) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (value: string) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => handler(value), delay);
  };
}

/**
 * Throttled scroll handler for message lists
 */
export function createThrottledScrollHandler(
  handler: (event: Event) => void,
  delay: number = 100
): (event: Event) => void {
  let isThrottled = false;
  
  return (event: Event) => {
    if (isThrottled) return;
    
    isThrottled = true;
    requestAnimationFrame(() => {
      handler(event);
      setTimeout(() => {
        isThrottled = false;
      }, delay);
    });
  };
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

// Export singleton instances
export const performanceMonitor = TherapeuticPerformanceMonitor.getInstance();
export const messageCache = new TherapeuticMessageCache();

// Export preloading helpers
export const preloadTherapeuticComponents = () => {
  // Preload commonly used components
  preloadComponent(
    () => import('@/components/cbt/cbt-diary-modal'),
    'CBTDiaryModal'
  );
  
  preloadComponent(
    () => import('@/components/chat/settings-panel'),
    'SettingsPanel'
  );
};

// Development-only performance reporting
if (process.env.NODE_ENV === 'development') {
  // Report performance metrics every 30 seconds
  setInterval(() => {
    const report = performanceMonitor.getPerformanceReport();
    const cacheStats = messageCache.getCacheStats();
    
    if (Object.keys(report).length > 0) {
      console.group('🚀 Therapeutic App Performance Report');
      console.table(report);
      console.log('💾 Cache Statistics:', cacheStats);
      console.groupEnd();
    }
  }, 30000);
}