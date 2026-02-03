'use client';

import { Component, ErrorInfo, ReactNode, startTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/utils/logger';
import { ToastContext, ToastContextType } from '@/components/ui/toast';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ToastMessages {
  issueReportedTitle: string;
  issueReportedBody: string;
  issueReportFailedTitle: string;
  issueReportFailedBody: string;
  reportIssueButtonLabel: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  toastMessages?: Partial<ToastMessages>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

const defaultToastMessages: ToastMessages = {
  issueReportedTitle: 'Issue reported',
  issueReportedBody: 'Thanks for letting us know—our team will take a look.',
  issueReportFailedTitle: 'Unable to report issue',
  issueReportFailedBody: 'We could not send the error report. Please try again later.',
  reportIssueButtonLabel: 'Report this issue',
};

class ErrorBoundaryBase extends Component<ErrorBoundaryProps, State> {
  static contextType = ToastContext;
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with structured logging
    logger.error(
      'Error Boundary caught an error',
      {
        component: 'ErrorBoundary',
        errorId: this.state.errorId,
        componentStack: errorInfo.componentStack,
      },
      error
    );

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to log to an error reporting service
    // Example: Sentry, LogRocket, etc.
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys !== resetKeys) {
      if (resetKeys.some((key, index) => prevProps.resetKeys?.[index] !== key)) {
        this.resetErrorBoundary();
      }
    }

    // Reset error boundary when any props change (if enabled)
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      startTransition(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          errorId: '',
        });
      });
    }, 100);
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    const toastContext = this.context as ToastContextType | null;
    const messages = { ...defaultToastMessages, ...this.props.toastMessages };

    logger.error('Error report generated for user feedback', {
      component: 'ErrorBoundary',
      operation: 'handleReportError',
      errorId,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    const jsonPayload = JSON.stringify({
      error: {
        message: error?.message,
        name: error?.name,
        stack: error?.stack?.slice(0, 2000),
      },
      context: {
        errorId,
        componentStack: errorInfo?.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    });

    const sendErrorReport = async () => {
      let sent = false;
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([jsonPayload], { type: 'application/json' });
          sent = navigator.sendBeacon('/api/errors', blob);
        }
        if (!sent) {
          await fetch('/api/errors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: jsonPayload,
            credentials: 'include',
          });
          sent = true;
        }
      } catch (err) {
        logger.error(
          'Failed to report error via ErrorBoundary',
          {
            component: 'ErrorBoundary',
            operation: 'handleReportError',
            errorId,
          },
          err instanceof Error ? err : new Error(String(err))
        );
      }

      if (toastContext) {
        toastContext.showToast({
          type: sent ? 'success' : 'error',
          title: sent ? messages.issueReportedTitle : messages.issueReportFailedTitle,
          message: sent ? messages.issueReportedBody : messages.issueReportFailedBody,
          duration: 6000,
        });
      }
    };

    void sendErrorReport();
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showErrorDetails = false, toastMessages } = this.props;
    const messages = { ...defaultToastMessages, ...toastMessages };

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <Card className="border-destructive/20 bg-destructive/5 mx-auto mt-8 max-w-2xl">
          <CardHeader className="text-center">
            <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <AlertTriangle className="text-destructive h-6 w-6" />
            </div>
            <CardTitle className="text-destructive text-xl font-semibold">
              Something went wrong
            </CardTitle>
            <p className="text-muted-foreground mt-2 text-sm">
              We encountered an error while displaying this content. Don&apos;t worry - your data is
              safe.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-col justify-center gap-2 sm:flex-row">
              <Button onClick={this.handleRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>

              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Refresh Page
              </Button>
            </div>

            {showErrorDetails && error && (
              <details className="bg-muted mt-4 rounded-lg p-4">
                <summary className="text-foreground hover:text-primary cursor-pointer text-sm font-semibold">
                  Technical Details (click to expand)
                </summary>
                <div className="mt-3 space-y-2">
                  <div>
                    <h4 className="text-foreground text-sm font-semibold">Error Message:</h4>
                    <code className="bg-background text-destructive mt-1 block rounded border p-2 text-sm">
                      {error.message}
                    </code>
                  </div>

                  {error.stack && (
                    <div>
                      <h4 className="text-foreground text-sm font-semibold">Stack Trace:</h4>
                      <pre className="bg-background text-muted-foreground mt-1 max-h-40 overflow-auto rounded border p-2 text-sm">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {errorInfo?.componentStack && (
                    <div>
                      <h4 className="text-foreground text-sm font-semibold">Component Stack:</h4>
                      <pre className="bg-background text-muted-foreground mt-1 max-h-40 overflow-auto rounded border p-2 text-sm">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={this.handleReportError}
                    className="mt-2"
                  >
                    {messages.reportIssueButtonLabel}
                  </Button>
                </div>
              </details>
            )}

            <p className="text-muted-foreground text-center text-sm">
              If this error continues, please refresh the page or contact support.
            </p>
          </CardContent>
        </Card>
      );
    }

    return children;
  }
}

type PublicErrorBoundaryProps = ErrorBoundaryProps;

export function ErrorBoundary(props: PublicErrorBoundaryProps) {
  const t = useTranslations('toast');
  const translations: ToastMessages = {
    issueReportedTitle: t('issueReportedTitle'),
    issueReportedBody: t('issueReportedBody'),
    issueReportFailedTitle: t('issueReportFailedTitle'),
    issueReportFailedBody: t('issueReportFailedBody'),
    reportIssueButtonLabel: t('reportIssueButton'),
  };
  const mergedMessages = { ...translations, ...props.toastMessages };
  return <ErrorBoundaryBase {...props} toastMessages={mergedMessages} />;
}
