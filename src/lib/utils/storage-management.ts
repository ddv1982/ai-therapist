/**
 * Simple storage management utilities
 * Handles basic storage quota monitoring and cleanup
 */

import { logger } from './logger';

export interface StorageInfo {
  used: number;
  quota: number;
  available: number;
  usagePercentage: number;
}

/**
 * Get storage quota information
 */
export async function getStorageInfo(): Promise<StorageInfo | null> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const used = estimate.usage || 0;
      const available = quota - used;
      const usagePercentage = quota > 0 ? (used / quota) * 100 : 0;

      return {
        used,
        quota,
        available,
        usagePercentage
      };
    }
  } catch (error) {
    logger.warn('Failed to get storage estimate', {
      operation: 'getStorageInfo',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  return null;
}

/**
 * Simple cleanup - only removes obviously old data
 */
export function cleanupLocalStorage(): void {
  try {
    // Only remove items that are clearly temporary or corrupted
    const itemsToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      // Skip our main app data
      if (key === 'persist:therapeuticAI' || key === 'currentSessionId') {
        continue;
      }
      
      // Check if item looks corrupted (too large or unparseable)
      try {
        const item = localStorage.getItem(key);
        if (!item) continue;
        
        // If item is larger than 1MB, consider removing it
        if (item.length > 1024 * 1024) {
          itemsToRemove.push(key);
        }
      } catch {
        // If we can't read it, remove it
        itemsToRemove.push(key);
      }
    }
    
    // Remove problematic items
    itemsToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        logger.info('Removed large/corrupted localStorage item', {
          operation: 'cleanupLocalStorage',
          key
        });
      } catch (error) {
        logger.warn('Failed to remove localStorage item', {
          operation: 'cleanupLocalStorage',
          key,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
  } catch (error) {
    logger.error('Storage cleanup failed', {
      operation: 'cleanupLocalStorage',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Check if we should clean up storage (simple threshold check)
 */
export async function shouldCleanupStorage(): Promise<boolean> {
  try {
    const info = await getStorageInfo();
    return info ? info.usagePercentage > 90 : false;
  } catch {
    return false;
  }
}

/**
 * Simple storage initialization - just check if we need cleanup
 */
export async function initializeStorage(): Promise<void> {
  try {
    if (await shouldCleanupStorage()) {
      logger.info('Storage usage high, performing cleanup', {
        operation: 'initializeStorage'
      });
      cleanupLocalStorage();
    }
  } catch (error) {
    logger.error('Storage initialization failed', {
      operation: 'initializeStorage',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
