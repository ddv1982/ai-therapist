export interface ClientErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp?: string;
  userAgent?: string;
  url?: string;
}

export function reportClientError(data: ClientErrorReport) {
  try {
    const payload = JSON.stringify({
      error: data.message,
      stack: data.stack,
      componentStack: data.componentStack,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : data.userAgent,
      url: typeof window !== 'undefined' ? window.location.href : data.url,
      timestamp: new Date().toISOString(),
    });

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/errors', blob);
      return;
    }

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => {
        void fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        });
      });
      return;
    }

    void fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    });
  } catch {}
}

export function useErrorReporter() {
  return (error: Error, componentStack?: string) => {
    reportClientError({ message: error.message, stack: error.stack, componentStack });
  };
}


