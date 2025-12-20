'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Trash2, Shield, Info, XCircle } from 'lucide-react';
import type { CSPViolation, CSPViolationStats } from '@/lib/security/csp-violations';

interface CSPResponse {
  violations: CSPViolation[];
  stats: CSPViolationStats;
}

/**
 * CSP Monitoring Dashboard
 *
 * Development-only page to view and manage CSP violations.
 * This helps identify CSP misconfigurations and potential security issues.
 *
 * Features:
 * - View recent violations
 * - Group violations by directive
 * - Clear violations for testing
 * - Auto-refresh option
 */
export default function CSPMonitorPage() {
  const [data, setData] = useState<CSPResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchViolations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/csp-report');

      if (response.status === 404) {
        setError('CSP monitoring is only available in development mode.');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearViolations = async () => {
    try {
      const response = await fetch('/api/csp-report', { method: 'DELETE' });
      if (response.ok) {
        await fetchViolations();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear violations');
    }
  };

  // Initial fetch
  useEffect(() => {
    void fetchViolations();
  }, [fetchViolations]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchViolations, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchViolations]);

  // Check if in production
  if (error === 'CSP monitoring is only available in development mode.') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle>Not Available</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Shield className="h-5 w-5" />
            CSP Violation Monitor
          </h1>
          <p className="text-muted-foreground text-sm">
            Development tool for monitoring Content Security Policy violations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh'}
          </Button>

          <Button variant="outline" size="sm" onClick={fetchViolations} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant="destructive" size="sm" onClick={clearViolations}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 py-4 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            {error}
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      {data?.stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Violations</CardDescription>
              <CardTitle className="text-2xl">{data.stats.totalViolations}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Recent (1 hour)</CardDescription>
              <CardTitle className="text-2xl">{data.stats.recentViolations}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unique Directives</CardDescription>
              <CardTitle className="text-2xl">
                {Object.keys(data.stats.violationsByDirective).length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unique Sources</CardDescription>
              <CardTitle className="text-2xl">
                {Object.keys(data.stats.violationsByBlockedUri).length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Violations by Directive */}
      {data?.stats && Object.keys(data.stats.violationsByDirective).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Violations by Directive</CardTitle>
            <CardDescription>Which CSP directives are being violated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.stats.violationsByDirective)
                .sort(([, a], [, b]) => b - a)
                .map(([directive, count]) => (
                  <Badge key={directive} variant="secondary" className="px-3 py-1">
                    {directive}: {count}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Violations by Blocked URI */}
      {data?.stats && Object.keys(data.stats.violationsByBlockedUri).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Violations by Blocked Source</CardTitle>
            <CardDescription>Which resources are being blocked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.stats.violationsByBlockedUri)
                .sort(([, a], [, b]) => b - a)
                .map(([uri, count]) => (
                  <Badge key={uri} variant="outline" className="px-3 py-1">
                    {uri}: {count}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Violations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Violations</CardTitle>
          <CardDescription>
            {data?.violations.length
              ? `Showing ${data.violations.length} most recent violations`
              : 'No violations recorded'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.violations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <Shield className="text-muted-foreground h-8 w-8" />
              </div>
              <p className="text-muted-foreground">No CSP violations detected</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Violations will appear here when they occur
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data?.violations.map((violation, index) => (
                <ViolationCard key={`${violation.timestamp}-${index}`} violation={violation} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Footer */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-start gap-3 py-4">
          <Info className="mt-0.5 h-5 w-5 text-blue-600" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">How CSP Violation Reporting Works</p>
            <p className="mt-1">
              When a browser blocks a resource due to Content Security Policy, it sends a report to
              the <code className="rounded bg-blue-100 px-1">/api/csp-report</code> endpoint. This
              helps identify misconfigurations and potential XSS attack attempts.
            </p>
            <p className="mt-2">
              See <code className="rounded bg-blue-100 px-1">src/lib/security/csp-config.ts</code>{' '}
              for documentation of all CSP exceptions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Individual violation card component
 */
function ViolationCard({ violation }: { violation: CSPViolation }) {
  const time = new Date(violation.timestamp).toLocaleString();

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="font-medium">{violation.violatedDirective}</span>
          {violation.effectiveDirective &&
            violation.effectiveDirective !== violation.violatedDirective && (
              <Badge variant="outline" className="text-xs">
                {violation.effectiveDirective}
              </Badge>
            )}
        </div>
        <span className="text-muted-foreground text-xs">{time}</span>
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <div className="grid grid-cols-[120px_1fr] gap-2">
          <span className="text-muted-foreground">Blocked URI:</span>
          <code className="truncate rounded bg-gray-100 px-1 text-xs">{violation.blockedUri}</code>
        </div>

        <div className="grid grid-cols-[120px_1fr] gap-2">
          <span className="text-muted-foreground">Document:</span>
          <code className="truncate rounded bg-gray-100 px-1 text-xs">{violation.documentUri}</code>
        </div>

        {violation.sourceFile && (
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <span className="text-muted-foreground">Source File:</span>
            <code className="truncate rounded bg-gray-100 px-1 text-xs">
              {violation.sourceFile}
              {violation.lineNumber && `:${violation.lineNumber}`}
              {violation.columnNumber && `:${violation.columnNumber}`}
            </code>
          </div>
        )}

        {violation.scriptSample && (
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <span className="text-muted-foreground">Sample:</span>
            <code className="truncate rounded bg-gray-100 px-1 text-xs">
              {violation.scriptSample}
            </code>
          </div>
        )}

        {violation.disposition && (
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <span className="text-muted-foreground">Disposition:</span>
            <Badge variant={violation.disposition === 'enforce' ? 'destructive' : 'secondary'}>
              {violation.disposition}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
