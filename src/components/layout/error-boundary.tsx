'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Bug, Wifi } from 'lucide-react';
import { logger } from '@/lib/utils/logger';
import { reportClientError } from '@/lib/utils/error-reporter';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error | undefined;
  errorInfo?: ErrorInfo | undefined;
  errorDetails?: {
    userAgent: string;
    url: string;
    timestamp: string;
    isMobile: boolean;
    isSafari: boolean;
    isNetworkUrl: boolean;
  } | undefined;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Safely collect browser and network information for debugging
    let errorDetails;
    try {
      errorDetails = {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
        timestamp: new Date().toISOString(),
        isMobile: typeof window !== 'undefined' && window.innerWidth < 768,
        isSafari: typeof navigator !== 'undefined' && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
        isNetworkUrl: typeof window !== 'undefined' && !window.location.hostname.match(/localhost|127\.0\.0\.1/)
      };
    } catch {
      // Fallback if browser APIs are not available (SSR)
      errorDetails = {
        userAgent: 'Unknown',
        url: 'Unknown',
        timestamp: new Date().toISOString(),
        isMobile: false,
        isSafari: false,
        isNetworkUrl: false
      };
    }

    return { hasError: true, error, errorDetails };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught React error', {
      component: 'ErrorBoundary',
      operation: 'componentDidCatch',
      componentStack: errorInfo.componentStack?.split('\n')[1] || 'Unknown'
    }, error);
    
    this.setState({
      errorInfo
    });
    
    // Asynchronously report error without blocking render
    try {
      reportClientError({ message: error.message, stack: error.stack ?? undefined, componentStack: errorInfo.componentStack ?? undefined });
    } catch {}
  }

  // Removed heavy in-render reporting/retries in favor of async reporter

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-2 text-foreground">
              {this.state.errorDetails?.isSafari && this.state.errorDetails?.isMobile
                ? 'Mobile Safari Error Detected'
                : 'Something went wrong'}
            </h2>
            
            <p className="text-muted-foreground mb-4">
              {this.state.errorDetails?.isSafari && this.state.errorDetails?.isMobile
                ? 'A mobile Safari-specific error occurred. This might be related to network access or JavaScript compatibility.'
                : 'We apologize for the inconvenience. The application encountered an unexpected error.'}
            </p>
            
            {/* Therapeutic-specific reassurance */}
            <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary/90">
                <strong>Your therapeutic data is safe.</strong> This error doesn&apos;t affect your saved sessions or conversations. 
                All your therapeutic progress remains secure and will be available once the issue is resolved.
              </p>
            </div>
            
            {this.state.errorDetails?.isNetworkUrl && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Wifi className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">Network Access Detected</span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  You&apos;re accessing this app via network URL. Some mobile browsers have restrictions on network-accessed applications.
                </p>
              </div>
            )}
            
            {(process.env.NODE_ENV === 'development' || this.state.errorDetails?.isSafari) && this.state.error && (
              <div className="mb-4 p-3 bg-muted rounded-lg text-left overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Error Details</span>
                </div>
                <p className="text-sm text-muted-foreground font-mono mb-2 break-words">
                  {this.state.error.message}
                </p>
                {this.state.errorDetails && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Browser:</strong> {this.state.errorDetails.isSafari ? 'Safari' : 'Other'} {this.state.errorDetails.isMobile ? '(Mobile)' : '(Desktop)'}</p>
                    <p><strong>Time:</strong> {new Date(this.state.errorDetails.timestamp).toLocaleString()}</p>
                    {this.state.errorDetails.isNetworkUrl && (
                      <p><strong>Access:</strong> Network URL</p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Application
              </Button>
              
              <Button
                variant="outline"
                onClick={() => this.setState({ 
                  hasError: false, 
                  error: undefined as Error | undefined, 
                  errorInfo: undefined as ErrorInfo | undefined, 
                  errorDetails: undefined as State['errorDetails'] 
                })}
                className="w-full"
              >
                Try Again
              </Button>
              
              {this.state.errorDetails?.isSafari && this.state.errorDetails?.isMobile && (
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">Mobile Safari Quick Fixes:</h4>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                      <li>• Try refreshing the page (swipe down to reload)</li>
                      <li>• Check your Wi-Fi or cellular connection</li>
                      <li>• Clear Safari cache: Settings → Safari → Clear History</li>
                      <li>• Close other Safari tabs to free up memory</li>
                      <li>• Restart Safari completely</li>
                      {this.state.errorDetails?.isNetworkUrl && (
                        <li>• Try accessing via localhost if on the same network</li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Advanced Troubleshooting:</h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Enable JavaScript: Settings → Safari → Advanced → JavaScript</li>
                      <li>• Disable Content Blockers temporarily</li>
                      <li>• Check if Private Browsing is affecting the app</li>
                      <li>• Try using a different browser (Chrome, Firefox)</li>
                      <li>• Ensure iOS is up to date</li>
                    </ul>
                  </div>
                  
                  {this.state.errorDetails?.isNetworkUrl && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">Network Access Tips:</h4>
                      <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                        <li>• Make sure you&apos;re on the same Wi-Fi network</li>
                        <li>• Check if the server is still running</li>
                        <li>• Try accessing other devices on the network</li>
                        <li>• Temporarily disable VPN if enabled</li>
                        <li>• Check firewall settings on the host device</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}