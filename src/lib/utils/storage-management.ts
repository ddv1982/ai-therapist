/**
 * Storage management utilities for Redux persist and localStorage
 * Handles storage quota monitoring, cleanup, and error recovery
 */

import { logger } from './logger';

export interface StorageInfo {
  used: number;
  quota: number;
  available: number;
  usagePercentage: number;
}

export interface StorageCleanupResult {
  success: boolean;
  bytesFreed: number;
  itemsRemoved: string[];
  error?: string;
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
 * Check if storage is approaching quota limits
 */
export async function isStorageNearLimit(threshold: number = 80): Promise<boolean> {
  const info = await getStorageInfo();
  return info ? info.usagePercentage > threshold : false;
}

/**
 * Get size of a localStorage item
 */
export function getLocalStorageItemSize(key: string): number {
  try {
    const item = localStorage.getItem(key);
    if (!item) return 0;
    
    // Rough estimate: 2 bytes per character for UTF-16
    return new Blob([item]).size;
  } catch (error) {
    logger.warn('Failed to get localStorage item size', {
      operation: 'getLocalStorageItemSize',
      key,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return 0;
  }
}

/**
 * Get all localStorage items with their sizes
 */
export function getLocalStorageUsage(): Array<{ key: string; size: number; sizeFormatted: string }> {
  const items: Array<{ key: string; size: number; sizeFormatted: string }> = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const size = getLocalStorageItemSize(key);
        items.push({
          key,
          size,
          sizeFormatted: formatBytes(size)
        });
      }
    }
  } catch (error) {
    logger.error('Failed to analyze localStorage usage', {
      operation: 'getLocalStorageUsage',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return items.sort((a, b) => b.size - a.size);
}

/**
 * Clean up old or large localStorage items
 */
export function cleanupLocalStorage(options: {
  maxAge?: number; // Max age in milliseconds
  maxSize?: number; // Max size per item in bytes
  preserveKeys?: string[]; // Keys to preserve
} = {}): StorageCleanupResult {
  const {
    maxAge = 7 * 24 * 60 * 60 * 1000, // 7 days default
    maxSize = 5 * 1024 * 1024, // 5MB default
    preserveKeys = ['persist:therapeuticAI', 'currentSessionId']
  } = options;

  const itemsRemoved: string[] = [];
  let bytesFreed = 0;

  try {
    const itemsToRemove: string[] = [];

    // Scan all localStorage items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || preserveKeys.includes(key)) continue;

      try {
        const item = localStorage.getItem(key);
        if (!item) continue;

        const size = getLocalStorageItemSize(key);
        
        // Check size limit
        if (size > maxSize) {
          itemsToRemove.push(key);
          bytesFreed += size;
          continue;
        }

        // Check age (for items that store timestamps)
        try {
          const parsed = JSON.parse(item);
          if (parsed && typeof parsed === 'object') {
            // Look for timestamp fields
            const timestamps = [
              parsed.timestamp,
              parsed.lastSaved,
              parsed.lastModified,
              parsed.createdAt,
              parsed.updatedAt
            ].filter(Boolean);

            if (timestamps.length > 0) {
              const oldestTimestamp = Math.min(...timestamps.map(t => new Date(t).getTime()));
              const age = Date.now() - oldestTimestamp;
              
              if (age > maxAge) {
                itemsToRemove.push(key);
                bytesFreed += size;
                continue;
              }
            }
          }
        } catch {
          // Not JSON or no timestamp, skip age check
        }
      } catch (error) {
        logger.warn('Error processing localStorage item during cleanup', {
          operation: 'cleanupLocalStorage',
          key,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Remove items
    itemsToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        itemsRemoved.push(key);
      } catch (error) {
        logger.error('Failed to remove localStorage item', {
          operation: 'cleanupLocalStorage',
          key,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    logger.info('localStorage cleanup completed', {
      operation: 'cleanupLocalStorage',
      itemsRemoved: itemsRemoved.length,
      bytesFreed,
      bytesFreedFormatted: formatBytes(bytesFreed)
    });

    return {
      success: true,
      bytesFreed,
      itemsRemoved
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown cleanup error';
    
    logger.error('localStorage cleanup failed', {
      operation: 'cleanupLocalStorage',
      error: errorMessage
    });

    return {
      success: false,
      bytesFreed,
      itemsRemoved,
      error: errorMessage
    };
  }
}

/**
 * Emergency cleanup - removes all non-essential data
 */
export function emergencyStorageCleanup(): StorageCleanupResult {
  const preserveKeys = ['currentSessionId']; // Only preserve session ID
  let bytesFreed = 0;
  const itemsRemoved: string[] = [];

  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !preserveKeys.includes(key)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      try {
        const size = getLocalStorageItemSize(key);
        localStorage.removeItem(key);
        itemsRemoved.push(key);
        bytesFreed += size;
      } catch (error) {
        logger.error('Failed to remove item during emergency cleanup', {
          operation: 'emergencyStorageCleanup',
          key,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    logger.warn('Emergency storage cleanup performed', {
      operation: 'emergencyStorageCleanup',
      itemsRemoved: itemsRemoved.length,
      bytesFreed,
      bytesFreedFormatted: formatBytes(bytesFreed)
    });

    return {
      success: true,
      bytesFreed,
      itemsRemoved
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Emergency cleanup failed';
    
    logger.error('Emergency storage cleanup failed', {
      operation: 'emergencyStorageCleanup',
      error: errorMessage
    });

    return {
      success: false,
      bytesFreed: 0,
      itemsRemoved: [],
      error: errorMessage
    };
  }
}

/**
 * Check if persist storage is corrupted
 */
export function isPersistStorageCorrupted(): boolean {
  try {
    const persistData = localStorage.getItem('persist:therapeuticAI');
    if (!persistData) return false;

    // Try to parse the persist data
    const parsed = JSON.parse(persistData);
    
    // Basic validation - check if it has expected structure
    if (!parsed || typeof parsed !== 'object') {
      return true;
    }

    // Check for common corruption indicators
    if (parsed._persist && typeof parsed._persist !== 'object') {
      return true;
    }

    return false;
  } catch (error) {
    logger.warn('Detected corrupted persist storage', {
      operation: 'isPersistStorageCorrupted',
      error: error instanceof Error ? error.message : 'Parse error'
    });
    return true;
  }
}

/**
 * Repair or clear corrupted persist storage
 */
export function repairPersistStorage(): boolean {
  try {
    if (isPersistStorageCorrupted()) {
      localStorage.removeItem('persist:therapeuticAI');
      logger.info('Cleared corrupted persist storage', {
        operation: 'repairPersistStorage'
      });
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Failed to repair persist storage', {
      operation: 'repairPersistStorage',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

/**
 * Monitor storage usage and perform automatic cleanup
 */
export async function monitorAndCleanupStorage(): Promise<void> {
  try {
    const storageInfo = await getStorageInfo();
    
    if (storageInfo && storageInfo.usagePercentage > 85) {
      logger.warn('Storage usage approaching limit', {
        operation: 'monitorAndCleanupStorage',
        usagePercentage: storageInfo.usagePercentage,
        used: formatBytes(storageInfo.used),
        quota: formatBytes(storageInfo.quota)
      });

      // Perform cleanup
      const cleanup = cleanupLocalStorage({
        maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days for high usage
        maxSize: 2 * 1024 * 1024 // 2MB max per item
      });

      if (cleanup.success && cleanup.bytesFreed > 0) {
        logger.info('Automatic storage cleanup completed', {
          operation: 'monitorAndCleanupStorage',
          bytesFreed: formatBytes(cleanup.bytesFreed),
          itemsRemoved: cleanup.itemsRemoved.length
        });
      }
    }

    // Check for corrupted persist data
    if (isPersistStorageCorrupted()) {
      repairPersistStorage();
    }

  } catch (error) {
    logger.error('Storage monitoring failed', {
      operation: 'monitorAndCleanupStorage',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}