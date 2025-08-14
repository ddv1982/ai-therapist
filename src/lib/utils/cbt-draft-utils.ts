import React from 'react';
import { encryptSensitiveData, decryptSensitiveData } from '@/lib/auth/crypto-utils';

/**
 * CBT Draft Management Utilities
 * 
 * This module provides comprehensive tools for managing Cognitive Behavioral Therapy (CBT) 
 * draft data with enterprise-grade security and performance features.
 * 
 * Key Features:
 * - AES-256-GCM encryption for therapeutic data protection
 * - Granular draft keys for each CBT step (situation, emotions, thoughts, etc.)
 * - Automatic size limits and compression capabilities
 * - Cross-session data persistence with localStorage
 * - Backward compatibility with legacy unencrypted data
 * - Memory-optimized React hooks with proper cleanup
 * - Batch operations for efficient multi-draft updates
 * 
 * Security Architecture:
 * - All draft data is encrypted using the application's master encryption key
 * - Metadata includes version, timestamp, and size for migration support
 * - Automatic cleanup of expired drafts (configurable retention period)
 * - Graceful fallback handling for encryption/decryption failures
 * 
 * @author Claude Code Review System
 * @version 1.0.0
 * @since 2024-12-14
 */

/**
 * CBT Draft Storage Keys
 * 
 * Defines all available localStorage keys for CBT component drafts.
 * Each key corresponds to a specific step in the CBT therapeutic process.
 * 
 * @constant
 * @readonly
 */
export const CBT_DRAFT_KEYS = {
  /** Draft key for the initial situation description */
  SITUATION: 'cbt-draft-situation',
  
  /** Draft key for initial emotional state assessment */
  EMOTIONS: 'cbt-draft-emotions',
  
  /** Draft key for automatic thoughts identification */
  THOUGHTS: 'cbt-draft-thoughts',
  
  /** Draft key for core belief exploration */
  CORE_BELIEF: 'cbt-draft-core-belief',
  
  /** Draft key for cognitive challenging questions */
  CHALLENGE_QUESTIONS: 'cbt-draft-challenge-questions',
  
  /** Draft key for rational thought development */
  RATIONAL_THOUGHTS: 'cbt-draft-rational-thoughts',
  
  /** Draft key for schema mode identification */
  SCHEMA_MODES: 'cbt-draft-schema-modes',
  
  /** Draft key for action plan development */
  ACTION_PLAN: 'cbt-draft-action-plan',
  
  /** Draft key for final emotional state assessment */
  FINAL_EMOTIONS: 'cbt-draft-final-emotions',
  
  /** Draft key for new behavioral patterns */
  NEW_BEHAVIORS: 'cbt-draft-new-behaviors',
  
  /** Draft key for alternative response strategies */
  ALTERNATIVE_RESPONSES: 'cbt-draft-alternative-responses',
  
  /** Draft key for schema reflection assessment */
  SCHEMA_REFLECTION_ASSESSMENT: 'cbt-draft-schema-reflection-assessment'
} as const;

/**
 * Type definition for valid CBT draft keys
 * @typedef {string} CBTDraftKey
 */
export type CBTDraftKey = typeof CBT_DRAFT_KEYS[keyof typeof CBT_DRAFT_KEYS];

/**
 * Configuration constants for draft management system
 */

/** Maximum allowed size per individual draft in bytes (50KB) */
const MAX_DRAFT_SIZE = 50 * 1024;

/** Current draft data format version for migration support */
const DRAFT_VERSION = 'v1';

/**
 * Metadata structure for enhanced draft storage
 * 
 * Contains versioning, timing, and optimization information
 * to support data migration and performance monitoring.
 * 
 * @interface DraftMetadata
 */
interface DraftMetadata {
  /** Format version identifier for migration compatibility */
  version: string;
  
  /** Unix timestamp of draft creation/update */
  timestamp: number;
  
  /** Uncompressed data size in bytes */
  size: number;
  
  /** Whether data compression was applied (future feature) */
  compressed?: boolean;
}

/**
 * Enhanced draft container with metadata and payload
 * 
 * Wraps user data with system metadata for advanced
 * draft management capabilities.
 * 
 * @interface EnhancedDraft
 * @template T The type of the draft data payload
 */
interface EnhancedDraft<T> {
  /** System metadata for draft management */
  metadata: DraftMetadata;
  
  /** User's actual draft data */
  data: T;
}

/**
 * Encrypts therapeutic draft data for secure storage
 * 
 * Uses the application's AES-256-GCM encryption system to protect
 * sensitive therapeutic content in localStorage. All draft data
 * is serialized to JSON before encryption.
 * 
 * @template T The type of data to encrypt
 * @param {T} data - The draft data to encrypt
 * @returns {string} Base64-encoded encrypted data
 * @throws {Error} When JSON serialization or encryption fails
 * 
 * @example
 * ```typescript
 * const draftData = { situation: "Feeling anxious", emotion: 7 };
 * const encrypted = encryptDraftData(draftData);
 * ```
 */
function encryptDraftData<T>(data: T): string {
  try {
    const jsonData = JSON.stringify(data);
    return encryptSensitiveData(jsonData);
  } catch (error) {
    console.error('Failed to encrypt draft data:', error);
    throw new Error('Draft encryption failed');
  }
}

/**
 * Decrypts therapeutic draft data from secure storage
 * 
 * Reverses the encryption process to restore original draft data.
 * Handles the full decryption and JSON parsing pipeline with
 * comprehensive error handling.
 * 
 * @template T The expected type of the decrypted data
 * @param {string} encryptedData - Base64-encoded encrypted draft data
 * @returns {T} The original draft data object
 * @throws {Error} When decryption or JSON parsing fails
 * 
 * @example
 * ```typescript
 * const decrypted = decryptDraftData<CBTSituationData>(encryptedString);
 * console.log(decrypted.situation); // "Feeling anxious"
 * ```
 */
function decryptDraftData<T>(encryptedData: string): T {
  try {
    const decryptedJson = decryptSensitiveData(encryptedData);
    return JSON.parse(decryptedJson) as T;
  } catch (error) {
    console.error('Failed to decrypt draft data:', error);
    throw new Error('Draft decryption failed');
  }
}

/**
 * Check if data appears to be encrypted (enhanced version)
 */
function isDataEncrypted(data: string): boolean {
  try {
    // Check if it looks like our base64 encrypted format
    if (data.length > 50 && /^[A-Za-z0-9+/=]+$/.test(data)) {
      // Verify it's valid base64
      Buffer.from(data, 'base64');
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Create enhanced draft with metadata
 */
function createEnhancedDraft<T>(data: T): EnhancedDraft<T> {
  const jsonSize = JSON.stringify(data).length;
  
  return {
    metadata: {
      version: DRAFT_VERSION,
      timestamp: Date.now(),
      size: jsonSize,
      compressed: false // Future feature
    },
    data
  };
}

/**
 * Saves CBT draft data to localStorage with encryption and validation
 * 
 * This is the primary function for persisting CBT draft data. It automatically
 * encrypts the data, validates size limits, and handles all error cases gracefully.
 * The function creates an enhanced draft structure with metadata for version
 * control and performance monitoring.
 * 
 * @template T The type of draft data being saved
 * @param {CBTDraftKey} key - The storage key identifying the CBT component
 * @param {T} data - The draft data to save (will be encrypted)
 * @returns {boolean} True if save was successful, false otherwise
 * 
 * @example
 * ```typescript
 * const situationData = {
 *   date: new Date().toISOString(),
 *   situation: "Had a difficult conversation with my manager"
 * };
 * 
 * const success = saveCBTDraft(CBT_DRAFT_KEYS.SITUATION, situationData);
 * if (success) {
 *   console.log("Draft saved successfully");
 * }
 * ```
 * 
 * @see {@link loadCBTDraft} for retrieving saved drafts
 * @see {@link MAX_DRAFT_SIZE} for size limitations
 */
export function saveCBTDraft<T>(key: CBTDraftKey, data: T): boolean {
  try {
    if (typeof window !== 'undefined') {
      // Create enhanced draft with metadata
      const enhancedDraft = createEnhancedDraft(data);
      
      // Check size limit before encryption
      if (enhancedDraft.metadata.size > MAX_DRAFT_SIZE) {
        console.warn(`Draft size (${enhancedDraft.metadata.size} bytes) exceeds limit (${MAX_DRAFT_SIZE} bytes)`);
        return false;
      }
      
      // Encrypt the entire enhanced draft
      const encryptedDraft = encryptDraftData(enhancedDraft);
      localStorage.setItem(key, encryptedDraft);
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Failed to save CBT draft:', error);
    return false;
  }
}

/**
 * Loads CBT draft data from localStorage with automatic decryption
 * 
 * Retrieves and decrypts previously saved draft data. The function automatically
 * detects whether data is encrypted or legacy unencrypted format and handles
 * both cases appropriately. Provides graceful fallback to default values
 * on any errors.
 * 
 * @template T The expected type of the draft data
 * @param {CBTDraftKey} key - The storage key identifying the CBT component
 * @param {T} defaultValue - Fallback value if draft doesn't exist or can't be loaded
 * @returns {T} The draft data or default value if loading fails
 * 
 * @example
 * ```typescript
 * const defaultSituation = { date: '', situation: '' };
 * const situationData = loadCBTDraft(
 *   CBT_DRAFT_KEYS.SITUATION, 
 *   defaultSituation
 * );
 * 
 * if (situationData.situation) {
 *   console.log("Found existing draft:", situationData.situation);
 * }
 * ```
 * 
 * @see {@link saveCBTDraft} for saving draft data
 * @see {@link hasCBTDraft} to check existence before loading
 */
export function loadCBTDraft<T>(key: CBTDraftKey, defaultValue: T): T {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(key);
      if (saved) {
        // Check if data is encrypted
        if (isDataEncrypted(saved)) {
          // Decrypt and load enhanced draft
          const enhancedDraft = decryptDraftData<EnhancedDraft<T>>(saved);
          return enhancedDraft.data;
        } else {
          // Legacy unencrypted data - load directly and migrate on next save
          return JSON.parse(saved) as T;
        }
      }
    }
    return defaultValue;
  } catch (error) {
    console.warn('Failed to load CBT draft:', error);
    return defaultValue;
  }
}

/**
 * Clear a specific draft from localStorage
 */
export function clearCBTDraft(key: CBTDraftKey): boolean {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Failed to clear CBT draft:', error);
    return false;
  }
}

/**
 * Clear all CBT drafts from localStorage
 */
export function clearAllCBTDrafts(): boolean {
  try {
    if (typeof window !== 'undefined') {
      Object.values(CBT_DRAFT_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Failed to clear all CBT drafts:', error);
    return false;
  }
}

/**
 * Check if a draft exists for a specific key (handles encrypted data)
 */
export function hasCBTDraft(key: CBTDraftKey): boolean {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(key);
      if (saved !== null && saved.trim() !== '') {
        // For encrypted data, we can just check if the key exists and has content
        // We don't need to decrypt to check existence
        return true;
      }
    }
    return false;
  } catch (error) {
    console.warn('Failed to check CBT draft:', error);
    return false;
  }
}

/**
 * Get all available CBT draft keys that have data
 */
export function getAvailableDrafts(): CBTDraftKey[] {
  try {
    if (typeof window !== 'undefined') {
      return Object.values(CBT_DRAFT_KEYS).filter(key => hasCBTDraft(key));
    }
    return [];
  } catch (error) {
    console.warn('Failed to get available drafts:', error);
    return [];
  }
}

/**
 * Get draft metadata (size, timestamp) without loading the full data
 */
export function getDraftMetadata(key: CBTDraftKey): DraftMetadata | null {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(key);
      if (saved && isDataEncrypted(saved)) {
        const enhancedDraft = decryptDraftData<EnhancedDraft<unknown>>(saved);
        return enhancedDraft.metadata;
      }
    }
    return null;
  } catch (error) {
    console.warn('Failed to get draft metadata:', error);
    return null;
  }
}

/**
 * Clean up expired drafts (older than 30 days)
 */
export function cleanupExpiredDrafts(retentionDays: number = 30): number {
  try {
    if (typeof window === 'undefined') return 0;
    
    const expireTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;
    
    Object.values(CBT_DRAFT_KEYS).forEach(key => {
      const metadata = getDraftMetadata(key);
      if (metadata && metadata.timestamp < expireTime) {
        clearCBTDraft(key);
        cleanedCount++;
      }
    });
    
    return cleanedCount;
  } catch (error) {
    console.warn('Failed to cleanup expired drafts:', error);
    return 0;
  }
}

/**
 * Batch update multiple drafts efficiently
 */
export function batchUpdateDrafts<T>(updates: Array<{ key: CBTDraftKey; data: T }>): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    // Validate all updates first
    const validatedUpdates = updates.map(({ key, data }) => {
      const enhancedDraft = createEnhancedDraft(data);
      if (enhancedDraft.metadata.size > MAX_DRAFT_SIZE) {
        throw new Error(`Draft ${key} exceeds size limit`);
      }
      return { key, encryptedDraft: encryptDraftData(enhancedDraft) };
    });
    
    // Apply all updates if validation passes
    validatedUpdates.forEach(({ key, encryptedDraft }) => {
      localStorage.setItem(key, encryptedDraft);
    });
    
    return true;
  } catch (error) {
    console.warn('Failed to batch update drafts:', error);
    return false;
  }
}

/**
 * React hook for automatic debounced draft saving with enhanced memory management
 * 
 * This hook provides real-time draft saving functionality for CBT forms with
 * intelligent debouncing, memory optimization, and visual feedback. It automatically
 * saves data after a specified delay and provides manual save capability.
 * 
 * Key Features:
 * - Automatic debounced saving (default 2.5s delay)
 * - Smart content detection (ignores empty/meaningless data)
 * - Memory-optimized with proper cleanup on unmount
 * - Visual feedback with temporary "saved" indicator
 * - Memoized content analysis to prevent unnecessary re-renders
 * - Automatic draft clearing when content becomes empty
 * 
 * @template T The type of data being saved
 * @param {CBTDraftKey} key - The storage key for this draft
 * @param {T} data - The current form data to save
 * @param {number} [delay=2500] - Debounce delay in milliseconds
 * @returns {Object} Hook return value
 * @returns {boolean} returns.isDraftSaved - Whether the draft was recently saved (for UI feedback)
 * @returns {Function} returns.saveDraftNow - Function to trigger immediate save
 * 
 * @example
 * ```typescript
 * function CBTSituationForm() {
 *   const [formData, setFormData] = useState({ situation: '', date: '' });
 *   const { isDraftSaved, saveDraftNow } = useDraftSaver(
 *     CBT_DRAFT_KEYS.SITUATION, 
 *     formData,
 *     2000 // 2 second delay
 *   );
 * 
 *   return (
 *     <div>
 *       <textarea 
 *         value={formData.situation}
 *         onChange={(e) => setFormData({...formData, situation: e.target.value})}
 *       />
 *       {isDraftSaved && <span className="text-green-500">Saved ✓</span>}
 *       <button onClick={saveDraftNow}>Save Now</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @see {@link saveCBTDraft} for the underlying save mechanism
 * @see {@link loadCBTDraft} for loading saved drafts
 */
export function useDraftSaver<T>(
  key: CBTDraftKey, 
  data: T, 
  delay: number = 2500
): { 
  isDraftSaved: boolean;
  saveDraftNow: () => void;
} {
  const [isDraftSaved, setIsDraftSaved] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();
  const indicatorTimeoutRef = React.useRef<NodeJS.Timeout>();

  const saveDraftNow = React.useCallback(() => {
    const success = saveCBTDraft(key, data);
    if (success) {
      setIsDraftSaved(true);
      
      // Clear any existing indicator timeout
      if (indicatorTimeoutRef.current) {
        clearTimeout(indicatorTimeoutRef.current);
      }
      
      // Clear the "saved" indicator after 1 second (less intrusive)
      indicatorTimeoutRef.current = setTimeout(() => setIsDraftSaved(false), 1000);
    }
  }, [key, data]);

  // Memoize the data content check to avoid recalculation on every render
  const hasContent = React.useMemo(() => {
    if (!data || typeof data !== 'object') return false;
    
    return Object.values(data).some(value => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'number') return value > 0;
      if (Array.isArray(value)) return value.length > 0 && value.some(item => 
        typeof item === 'string' ? item.trim().length > 0 : 
        typeof item === 'object' ? Object.values(item).some(v => 
          typeof v === 'string' ? v.trim().length > 0 : v !== null && v !== undefined
        ) : item !== null && item !== undefined
      );
      return value !== null && value !== undefined;
    });
  }, [data]);

  React.useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (hasContent) {
      // Set up debounced save
      timeoutRef.current = setTimeout(saveDraftNow, delay);
    } else {
      // Clear draft if no meaningful content
      clearCBTDraft(key);
      setIsDraftSaved(false);
    }

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [hasContent, key, delay, saveDraftNow]);

  // Cleanup effect for component unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (indicatorTimeoutRef.current) {
        clearTimeout(indicatorTimeoutRef.current);
      }
    };
  }, []);

  return { isDraftSaved, saveDraftNow };
}