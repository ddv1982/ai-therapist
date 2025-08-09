'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bug, X } from 'lucide-react';

interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

interface DebugInfo {
  userAgent: string;
  isSafari: boolean;
  isMobile: boolean;
  isNetworkUrl: boolean;
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
  };
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  url: string;
  timestamp: string;
}

export function MobileDebugInfo() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    // Still collect debug info for error logging purposes, but don't show UI by default
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isMobile = window.innerWidth < 768;
    const isNetworkUrl = !window.location.hostname.match(/localhost|127\.0\.0\.1/);
    
    if (isSafari && isMobile && isNetworkUrl) {
      const info: DebugInfo = {
        userAgent: navigator.userAgent,
        isSafari,
        isMobile,
        isNetworkUrl,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio
        },
        connection: 'connection' in navigator && (navigator as NavigatorWithConnection).connection ? {
          effectiveType: (navigator as NavigatorWithConnection).connection?.effectiveType,
          downlink: (navigator as NavigatorWithConnection).connection?.downlink,
          rtt: (navigator as NavigatorWithConnection).connection?.rtt,
        } : undefined,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
      
      setDebugInfo(info);
      
      // Make debug info available in console for developers
      console.log('Mobile Debug Info Available:', info);
      
      // Make debug info globally available for developer console access
      (window as unknown as Record<string, unknown>).__mobileDebugInfo = info;
      (window as unknown as Record<string, unknown>).__showMobileDebug = () => setShowDebug(true);
    }
    
    // Check for URL parameter to force show debug panel
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'mobile') {
      setShowDebug(true);
    }
  }, []);

  // Don't render the debug button in normal usage - keeps UI clean
  if (!debugInfo || !showDebug) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full max-h-[80vh] overflow-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bug className="w-5 h-5" />
              Mobile Debug Info
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDebug(false)}
              className="rounded-full h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-3 text-sm">
            <div>
              <strong>Browser:</strong> {debugInfo.isSafari ? 'Safari' : 'Other'} {debugInfo.isMobile ? '(Mobile)' : '(Desktop)'}
            </div>
            
            <div>
              <strong>Access Type:</strong> {debugInfo.isNetworkUrl ? 'Network URL' : 'Local'}
            </div>
            
            <div>
              <strong>Viewport:</strong> {debugInfo.viewport.width}x{debugInfo.viewport.height} 
              (Ratio: {debugInfo.viewport.devicePixelRatio})
            </div>
            
            {debugInfo.connection && (
              <div>
                <strong>Connection:</strong> {debugInfo.connection.effectiveType || 'Unknown'}
                {debugInfo.connection.downlink && ` (${debugInfo.connection.downlink} Mbps)`}
              </div>
            )}
            
            <div className="break-all">
              <strong>URL:</strong> {debugInfo.url}
            </div>
            
            <div>
              <strong>Time:</strong> {new Date(debugInfo.timestamp).toLocaleString()}
            </div>
            
            <div className="pt-2 border-t">
              <strong>User Agent:</strong>
              <div className="text-xs mt-1 p-2 bg-muted rounded font-mono break-all">
                {debugInfo.userAgent}
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
                alert('Debug info copied to clipboard');
              }}
              className="flex-1"
            >
              Copy Debug Info
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Reload App
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs">
            <p className="text-muted-foreground">
              <strong>Developer Access:</strong><br/>
              • Console: <code>window.__mobileDebugInfo</code><br/>
              • URL: <code>?debug=mobile</code><br/>
              • Console: <code>window.__showMobileDebug()</code>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}