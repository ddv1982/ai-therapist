/**
 * Simplified Notifications Hook
 *
 * Replaces complex toast context with simple notification functions.
 */

'use client';

import { useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useNotifications() {
  const showNotification = useCallback((
    message: string,
    type: NotificationType = 'info',
    _options: NotificationOptions = {}
  ) => {
    // Simple browser notification for now
    // In a real app, this could integrate with a proper toast system
    const method = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log';
    console[method](`[${type.toUpperCase()}] ${message}`);

    // For success/error, we could show browser notifications
    if (type === 'success' || type === 'error') {
      // This is a simplified version - in practice you'd want a proper toast library
      alert(`${type === 'success' ? '✅' : '❌'} ${message}`);
    }
  }, []);

  const showSuccess = useCallback((message: string, options?: NotificationOptions) => {
    showNotification(message, 'success', options);
  }, [showNotification]);

  const showError = useCallback((message: string, options?: NotificationOptions) => {
    showNotification(message, 'error', options);
  }, [showNotification]);

  const showInfo = useCallback((message: string, options?: NotificationOptions) => {
    showNotification(message, 'info', options);
  }, [showNotification]);

  const showWarning = useCallback((message: string, options?: NotificationOptions) => {
    showNotification(message, 'warning', options);
  }, [showNotification]);

  return {
    showNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
}
