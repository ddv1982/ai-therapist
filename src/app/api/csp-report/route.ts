import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { getRateLimiter } from '@/lib/api/rate-limiter';
import { getClientIPFromRequest } from '@/lib/api/middleware/request-utils';
import { env } from '@/config/env';
import { addCSPViolation, type CSPViolation } from '@/lib/security/csp-violations';

/**
 * CSP Violation Report Structure
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP#violation_report_syntax
 */
interface CSPViolationReport {
  'csp-report'?: {
    'document-uri'?: string;
    referrer?: string;
    'violated-directive'?: string;
    'effective-directive'?: string;
    'original-policy'?: string;
    disposition?: string;
    'blocked-uri'?: string;
    'status-code'?: number;
    'script-sample'?: string;
    'source-file'?: string;
    'line-number'?: number;
    'column-number'?: number;
  };
}

/**
 * Reporting API Format (newer standard)
 * @see https://w3c.github.io/reporting/
 */
interface ReportingAPIViolation {
  type?: string;
  age?: number;
  url?: string;
  user_agent?: string;
  body?: {
    documentURL?: string;
    referrer?: string;
    violatedDirective?: string;
    effectiveDirective?: string;
    originalPolicy?: string;
    disposition?: string;
    blockedURL?: string;
    statusCode?: number;
    sample?: string;
    sourceFile?: string;
    lineNumber?: number;
    columnNumber?: number;
  };
}

/**
 * Normalize a CSP violation report to a consistent format
 */
function normalizeCSPViolation(
  report: CSPViolationReport | ReportingAPIViolation | ReportingAPIViolation[]
): CSPViolation | null {
  // Handle array of reports (Reporting API v2)
  if (Array.isArray(report)) {
    if (report.length === 0) return null;
    return normalizeCSPViolation(report[0]);
  }

  // Handle Reporting API format
  if ('type' in report && report.body) {
    const body = report.body;
    return {
      timestamp: new Date().toISOString(),
      documentUri: body.documentURL || report.url || 'unknown',
      referrer: body.referrer,
      violatedDirective: body.violatedDirective || body.effectiveDirective || 'unknown',
      effectiveDirective: body.effectiveDirective,
      blockedUri: body.blockedURL || 'unknown',
      disposition: body.disposition,
      statusCode: body.statusCode,
      scriptSample: body.sample,
      sourceFile: body.sourceFile,
      lineNumber: body.lineNumber,
      columnNumber: body.columnNumber,
    };
  }

  // Handle legacy CSP report format
  const cspReport = (report as CSPViolationReport)['csp-report'];
  if (cspReport) {
    return {
      timestamp: new Date().toISOString(),
      documentUri: cspReport['document-uri'] || 'unknown',
      referrer: cspReport['referrer'],
      violatedDirective:
        cspReport['violated-directive'] || cspReport['effective-directive'] || 'unknown',
      effectiveDirective: cspReport['effective-directive'],
      blockedUri: cspReport['blocked-uri'] || 'unknown',
      disposition: cspReport['disposition'],
      statusCode: cspReport['status-code'],
      scriptSample: cspReport['script-sample'],
      sourceFile: cspReport['source-file'],
      lineNumber: cspReport['line-number'],
      columnNumber: cspReport['column-number'],
    };
  }

  return null;
}

/**
 * POST /api/csp-report
 *
 * Receives CSP violation reports from browsers when the Content Security Policy
 * is violated. These reports help identify potential security issues and CSP
 * misconfigurations.
 *
 * Accepts both:
 * - Legacy CSP report format (application/csp-report)
 * - Reporting API format (application/reports+json)
 *
 * Rate limiting is applied to prevent abuse from malicious actors attempting
 * to flood the logging system.
 *
 * @returns 204 No Content on success (no response body per CSP spec)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = crypto.randomUUID();

  // Apply rate limiting to prevent abuse
  const rateLimitDisabled = env.RATE_LIMIT_DISABLED && env.NODE_ENV !== 'production';
  if (!rateLimitDisabled) {
    const clientIP = getClientIPFromRequest(request);
    const limiter = getRateLimiter();

    // Use a specific bucket for CSP reports with stricter limits
    // Allow 50 reports per minute per IP to catch real violations
    // while preventing flood attacks
    const result = await limiter.checkRateLimit(clientIP, 'api');

    if (!result.allowed) {
      logger.warn('CSP report rate limit exceeded', {
        requestId,
        clientIP: '[FILTERED]', // Don't log actual IP
      });
      // Return 204 even on rate limit to not leak information
      return new NextResponse(null, { status: 204 });
    }
  }

  try {
    // Parse the CSP violation report
    let report: CSPViolationReport | ReportingAPIViolation | ReportingAPIViolation[];

    const contentType = request.headers.get('content-type') || '';

    if (
      contentType.includes('application/csp-report') ||
      contentType.includes('application/reports+json') ||
      contentType.includes('application/json')
    ) {
      try {
        report = await request.json();
      } catch {
        logger.warn('CSP report: Invalid JSON payload', { requestId });
        return new NextResponse(null, { status: 204 });
      }
    } else {
      // Accept reports without proper content-type (some browsers don't set it correctly)
      try {
        const text = await request.text();
        if (!text) {
          return new NextResponse(null, { status: 204 });
        }
        report = JSON.parse(text);
      } catch {
        logger.warn('CSP report: Unable to parse payload', { requestId });
        return new NextResponse(null, { status: 204 });
      }
    }

    // Normalize the violation to a consistent format
    const violation = normalizeCSPViolation(report);

    if (!violation) {
      logger.warn('CSP report: Unable to extract violation data', { requestId });
      return new NextResponse(null, { status: 204 });
    }

    // Add to in-memory store for dev dashboard
    addCSPViolation(violation);

    // Log the violation with structured format for monitoring
    logger.warn('CSP Violation detected', {
      requestId,
      cspViolation: {
        documentUri: violation.documentUri,
        violatedDirective: violation.violatedDirective,
        effectiveDirective: violation.effectiveDirective,
        blockedUri: violation.blockedUri,
        disposition: violation.disposition,
        sourceFile: violation.sourceFile,
        lineNumber: violation.lineNumber,
      },
    });

    // Return 204 No Content as per CSP specification
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Log error but still return 204 to not leak information
    logger.error('CSP report processing error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return new NextResponse(null, { status: 204 });
  }
}

/**
 * OPTIONS /api/csp-report
 *
 * Handle CORS preflight requests for CSP reports.
 * Some browsers send OPTIONS before POST for CSP reports.
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
    },
  });
}

/**
 * GET /api/csp-report
 *
 * Development-only endpoint to retrieve recent CSP violations.
 * Not available in production for security reasons.
 */
export async function GET(): Promise<NextResponse> {
  // Only allow in development
  if (env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 });
  }

  const { getCSPViolations, getCSPViolationStats } = await import('@/lib/security/csp-violations');

  return NextResponse.json({
    violations: getCSPViolations(),
    stats: getCSPViolationStats(),
  });
}

/**
 * DELETE /api/csp-report
 *
 * Development-only endpoint to clear CSP violations.
 */
export async function DELETE(): Promise<NextResponse> {
  // Only allow in development
  if (env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 });
  }

  const { clearCSPViolations } = await import('@/lib/security/csp-violations');
  clearCSPViolations();

  return new NextResponse(null, { status: 204 });
}
