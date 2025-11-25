/**
 * CSP Violation Storage
 *
 * In-memory storage for CSP violations in development mode.
 * This allows viewing violations in the dev dashboard without
 * external logging infrastructure.
 *
 * In production, violations are only logged (not stored in memory)
 * as they should be sent to a proper monitoring system.
 */

import { isDevelopment } from '@/config/env.public';

/**
 * Normalized CSP violation structure
 */
export interface CSPViolation {
  timestamp: string;
  documentUri: string;
  referrer?: string;
  violatedDirective: string;
  effectiveDirective?: string;
  blockedUri: string;
  disposition?: string;
  statusCode?: number;
  scriptSample?: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
}

/**
 * Statistics for CSP violations grouped by directive
 */
export interface CSPViolationStats {
  totalViolations: number;
  violationsByDirective: Record<string, number>;
  violationsByBlockedUri: Record<string, number>;
  recentViolations: number;
  oldestViolation?: string;
  newestViolation?: string;
}

// In-memory storage for violations (development only)
const MAX_STORED_VIOLATIONS = 100;
let violations: CSPViolation[] = [];

/**
 * Add a CSP violation to the in-memory store
 * Only stores violations in development mode
 */
export function addCSPViolation(violation: CSPViolation): void {
  if (!isDevelopment) {
    return;
  }

  violations.unshift(violation);

  // Keep only the most recent violations
  if (violations.length > MAX_STORED_VIOLATIONS) {
    violations = violations.slice(0, MAX_STORED_VIOLATIONS);
  }
}

/**
 * Get all stored CSP violations
 * Returns empty array in production
 */
export function getCSPViolations(): CSPViolation[] {
  if (!isDevelopment) {
    return [];
  }
  return [...violations];
}

/**
 * Get statistics about stored CSP violations
 */
export function getCSPViolationStats(): CSPViolationStats {
  if (!isDevelopment || violations.length === 0) {
    return {
      totalViolations: 0,
      violationsByDirective: {},
      violationsByBlockedUri: {},
      recentViolations: 0,
    };
  }

  const violationsByDirective: Record<string, number> = {};
  const violationsByBlockedUri: Record<string, number> = {};
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  let recentCount = 0;

  for (const v of violations) {
    // Count by directive
    const directive = v.effectiveDirective || v.violatedDirective;
    violationsByDirective[directive] = (violationsByDirective[directive] || 0) + 1;

    // Count by blocked URI (sanitize to domain only for grouping)
    let blockedDomain = v.blockedUri;
    try {
      if (v.blockedUri && !v.blockedUri.startsWith('inline') && !v.blockedUri.startsWith('eval')) {
        const url = new URL(v.blockedUri);
        blockedDomain = url.hostname || v.blockedUri;
      }
    } catch {
      // Keep original if not a valid URL
    }
    violationsByBlockedUri[blockedDomain] = (violationsByBlockedUri[blockedDomain] || 0) + 1;

    // Count recent violations
    if (v.timestamp >= oneHourAgo) {
      recentCount++;
    }
  }

  return {
    totalViolations: violations.length,
    violationsByDirective,
    violationsByBlockedUri,
    recentViolations: recentCount,
    oldestViolation: violations[violations.length - 1]?.timestamp,
    newestViolation: violations[0]?.timestamp,
  };
}

/**
 * Clear all stored CSP violations
 * Only works in development mode
 */
export function clearCSPViolations(): void {
  if (!isDevelopment) {
    return;
  }
  violations = [];
}
