'use client';

import { useState, useEffect, useRef } from 'react';
import { handleClientError } from '@/lib/utils/error-utils';
import { logger } from '@/lib/utils/logger';

interface AuthStatus {
  isAuthenticated: boolean;
  needsSetup: boolean;
  needsVerification: boolean;
  isLoading: boolean;
  deviceName?: string;
}

// Global cache to prevent multiple simultaneous requests
let authCache: { status: AuthStatus | null; timestamp: number } = { status: null, timestamp: 0 };
const CACHE_DURATION = 15000; // 15 seconds cache (reduced for faster auth updates)

// Function to clear auth cache (useful after login/logout)
export function clearAuthCache() {
  authCache = { status: null, timestamp: 0 };
  // Trigger a custom event to notify hooks to recheck
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth-cache-cleared'));
  }
}

export function useAuth(): AuthStatus {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    needsSetup: false,
    needsVerification: false,
    isLoading: true,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    checkAuthStatus();
    
    // Listen for auth cache clear events
    const handleAuthCacheCleared = () => {
      checkAuthStatus();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('auth-cache-cleared', handleAuthCacheCleared);
    }
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth-cache-cleared', handleAuthCacheCleared);
      }
    };
  }, []);

  const checkAuthStatus = async () => {
    // Check cache first to avoid redundant requests
    const now = Date.now();
    if (authCache.status && (now - authCache.timestamp) < CACHE_DURATION) {
      setAuthStatus(authCache.status);
      return;
    }

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Auth check timeout')), 10000); // 10 second timeout
      });
      
      const fetchPromise = fetch('/api/auth/session', {
        signal: abortControllerRef.current.signal,
        cache: 'no-cache',
        credentials: 'include'
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      
      if (response.ok) {
        const data = await response.json();
        const newStatus: AuthStatus = {
          isAuthenticated: data.isAuthenticated,
          needsSetup: data.needsSetup,
          needsVerification: data.needsVerification,
          isLoading: false,
          deviceName: data.device?.name,
        };
        
        // Update cache
        authCache = { status: newStatus, timestamp: now };
        setAuthStatus(newStatus);
      } else {
        const fallbackStatus: AuthStatus = {
          isAuthenticated: false,
          needsSetup: true,
          needsVerification: false,
          isLoading: false,
        };
        
        // Update cache
        authCache = { status: fallbackStatus, timestamp: now };
        setAuthStatus(fallbackStatus);
      }
    } catch (error) {
      // Ignore abort errors
      if ((error as Error).name === 'AbortError') {
        return;
      }
      
      const { userMessage, shouldRetry, category } = handleClientError(error, {
        operation: 'auth_status_check',
        fallbackMessage: 'Unable to verify authentication status'
      });
      
      // Log with enhanced error info (in development only)
      if (process.env.NODE_ENV === 'development') {
        logger.error('Auth status check failed in development', {
          component: 'useAuth',
          operation: 'checkAuthStatus',
          category,
          shouldRetry,
          userMessage
        }, error instanceof Error ? error : new Error(String(error)));
      }
      
      const errorStatus: AuthStatus = {
        isAuthenticated: false,
        needsSetup: true,
        needsVerification: false,
        isLoading: false,
      };
      
      // Update cache
      authCache = { status: errorStatus, timestamp: now };
      setAuthStatus(errorStatus);
    }
  };

  return authStatus;
}