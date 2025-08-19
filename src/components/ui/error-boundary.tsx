'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/utils/logger';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with structured logging
    logger.error('Error Boundary caught an error', {
      component: 'ErrorBoundary',
      errorId: this.state.errorId,
      componentStack: errorInfo.componentStack
    }, error);

    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to log to an error reporting service
    // Example: Sentry, LogRocket, etc.
  }

  componentDidUpdate(prevProps: Props) {
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
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: ''
      });
    }, 100);
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    
    // In a real app, you'd send this to your error reporting service
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    logger.error('Error report generated for user feedback', {
      component: 'ErrorBoundary',
      operation: 'handleReportError',
      errorId,
      url: window.location.href,
      userAgent: navigator.userAgent
    });
    
    // Copy to clipboard for easy reporting
    navigator.clipboard?.writeText(JSON.stringify(errorReport, null, 2));
    alert('Error details copied to clipboard. Please share with support if this issue persists.');
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showErrorDetails = false } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <Card className="mx-auto max-w-2xl mt-8 border-destructive/20 bg-destructive/5">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl font-semibold text-destructive">
              Something went wrong
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              We encountered an error while displaying this content. Don&apos;t worry - your data is safe.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={this.handleRetry}
                className="flex items-center gap-2"
              >
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
              <details className="mt-4 p-4 bg-muted rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-foreground hover:text-primary">
                  Technical Details (click to expand)
                </summary>
                <div className="mt-3 space-y-2">
                  <div>
                    <h4 className="text-sm font-medium text-foreground">Error Message:</h4>
                    <code className="text-xs bg-background p-2 rounded border block mt-1 text-destructive">
                      {error.message}
                    </code>
                  </div>
                  
                  {error.stack && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Stack Trace:</h4>
                      <pre className="text-xs bg-background p-2 rounded border mt-1 overflow-auto max-h-40 text-muted-foreground">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  
                  {errorInfo?.componentStack && (
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Component Stack:</h4>
                      <pre className="text-xs bg-background p-2 rounded border mt-1 overflow-auto max-h-40 text-muted-foreground">
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
                    Copy Error Details
                  </Button>
                </div>
              </details>
            )}
            
            <p className="text-xs text-muted-foreground text-center">
              If this error continues, please refresh the page or contact support.
            </p>
          </CardContent>
        </Card>
      );
    }

    return children;
  }
}

// Higher-order component wrapper for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// React Hook for error boundaries in functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    // Log error with structured logging
    logger.error('Error caught by useErrorHandler hook', {
      component: 'useErrorHandler',
      componentStack: errorInfo?.componentStack
    }, error);
    
    // Throw the error to trigger the nearest error boundary
    throw error;
  };
}