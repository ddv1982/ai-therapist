'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn, generateSecureRandomString } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export interface Toast {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = generateSecureRandomString(8, 'abcdefghijklmnopqrstuvwxyz0123456789');
      const newToast: Toast = {
        ...toast,
        id,
        duration: toast.duration || 5000,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove toast after duration
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

// Provide a safe translation accessor for tests/environments without NextIntl provider
function useSafeUiTranslations() {
  try {
    return useTranslations('ui');
  } catch {
    return ((key: string) => (key === 'close' ? 'Close notification' : key)) as unknown as (
      key: string
    ) => string;
  }
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const t = useSafeUiTranslations();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setIsVisible(true);
  }, []);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-background border-border shadow-lg ring-1 ring-green-500/20';
      case 'error':
        return 'bg-background border-border shadow-lg ring-1 ring-red-500/20';
      case 'warning':
        return 'bg-background border-border shadow-lg ring-1 ring-yellow-500/20';
      case 'info':
        return 'bg-background border-border shadow-lg ring-1 ring-blue-500/20';
      default:
        return 'bg-background border-border shadow-lg ring-1 ring-blue-500/20';
    }
  };

  const ariaRole = toast.type === 'error' ? 'alert' : 'status';
  const ariaLive = toast.type === 'error' ? 'assertive' : 'polite';

  return (
    <div
      role={ariaRole}
      aria-live={ariaLive}
      aria-atomic="true"
      className={cn(
        'transform rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out',
        getBackgroundColor(),
        'motion-reduce:transition-none',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="min-w-0 flex-1">
          {toast.title && (
            <h4 className="text-foreground mb-1 text-sm font-semibold">{toast.title}</h4>
          )}
          <p className="text-muted-foreground text-sm leading-relaxed">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-muted ml-2 flex-shrink-0 rounded-full p-1 transition-colors"
          aria-label={t('close')}
        >
          <X className="text-muted-foreground h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
