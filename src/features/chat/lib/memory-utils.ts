/**
 * Utilities for managing therapeutic memory context
 */

import { logger } from '@/lib/utils/logger';
import { apiClient } from '@/lib/api/client';
import { deleteMemoryAction, type DeletionMode } from '@/features/chat/actions/memory-actions';
import type { MemoryData, MemoryManageData, MemoryReportDetail, DeleteResponseData } from '@/types';

export interface MemoryContextInfo {
  hasMemory: boolean;
  reportCount: number;
  lastReportDate?: string;
}

export type MemoryDetailInfo = MemoryReportDetail;

export interface SessionReportDetail {
  id: string;
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  reportDate: string;
  fullContent: string;
  keyInsights: string[];
  reportSize: number;
  structuredCBTData?: unknown; // Add structured CBT data from therapeutic insights
}

export interface MemoryManagementResponse extends MemoryManageData {
  success: boolean;
}

export interface MemoryDeletionResponse extends DeleteResponseData {
  success: boolean;
}

function isMemoryContextResponse(data: MemoryData | MemoryManageData): data is MemoryData {
  return 'memoryContext' in data;
}

function isMemoryManagementResponse(data: MemoryData | MemoryManageData): data is MemoryManageData {
  return 'memoryDetails' in data;
}

/**
 * Check if memory context is available for a session
 */
export async function checkMemoryContext(sessionId?: string): Promise<MemoryContextInfo> {
  try {
    const params = new URLSearchParams();
    if (sessionId) {
      params.set('excludeSessionId', sessionId);
    }
    params.set('limit', '3');

    const raw = await apiClient.getMemoryReports(params);
    if (!raw.success || !raw.data || !isMemoryContextResponse(raw.data)) {
      return { hasMemory: false, reportCount: 0 };
    }
    const memoryList = raw.data.memoryContext;
    if (Array.isArray(memoryList) && memoryList.length > 0) {
      const sortedMemory = memoryList.sort(
        (a: { reportDate: string }, b: { reportDate: string }) =>
          new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
      );

      return {
        hasMemory: true,
        reportCount: memoryList.length,
        lastReportDate: sortedMemory[0]?.reportDate,
      };
    }
  } catch (error) {
    logger.warn('Failed to check memory context', {
      operation: 'checkMemoryContext',
      error: error instanceof Error ? error.message : 'Unknown error',
      sessionId: sessionId ? '[FILTERED_SESSION_ID]' : 'none',
    });
  }

  return { hasMemory: false, reportCount: 0 };
}

/**
 * Format memory context info for display
 */
export function formatMemoryInfo(memoryInfo: MemoryContextInfo): string {
  if (!memoryInfo.hasMemory) {
    return '';
  }

  const count = memoryInfo.reportCount;
  const lastDate = memoryInfo.lastReportDate;

  if (count === 1) {
    return `Using insights from 1 previous session${lastDate ? ` (${lastDate})` : ''}`;
  } else {
    return `Using insights from ${count} previous sessions${lastDate ? ` (latest: ${lastDate})` : ''}`;
  }
}

/**
 * Get detailed memory information for management
 */
export async function getMemoryManagementData(
  sessionId?: string
): Promise<MemoryManagementResponse> {
  const params = new URLSearchParams();
  params.set('manage', 'true');
  if (sessionId) {
    params.set('excludeSessionId', sessionId);
  }

  try {
    const raw = await apiClient.getMemoryReports(params);
    if (!raw.success || !raw.data || !isMemoryManagementResponse(raw.data)) {
      return {
        success: false,
        memoryDetails: [],
        reportCount: 0,
        stats: {
          totalReportsFound: 0,
          successfullyProcessed: 0,
          failedDecryptions: 0,
          hasMemory: false,
        },
      };
    }
    return { success: true, ...raw.data };
  } catch (error) {
    const status = (error as { status?: number })?.status;

    if (status) {
      logger.error('Failed to fetch memory management data', {
        operation: 'getMemoryManagementData',
        status: status,
        sessionId: sessionId ? '[FILTERED_SESSION_ID]' : 'none',
      });
    } else {
      logger.error('Error fetching memory management data', {
        operation: 'getMemoryManagementData',
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: sessionId ? '[FILTERED_SESSION_ID]' : 'none',
      });
    }
    return {
      success: false,
      memoryDetails: [],
      reportCount: 0,
      stats: {
        totalReportsFound: 0,
        successfullyProcessed: 0,
        failedDecryptions: 0,
        hasMemory: false,
      },
    };
  }
}

/**
 * Delete memory with various options
 */
export async function deleteMemory(options: {
  type: 'all' | 'recent' | 'specific' | 'all-except-current';
  sessionId?: string;
  sessionIds?: string[];
  limit?: number;
}): Promise<MemoryDeletionResponse> {
  try {
    const actionResult = await deleteMemoryAction({
      limit: options.limit,
      excludeSessionId: options.type === 'all-except-current' ? options.sessionId : undefined,
      sessionIds: options.sessionIds,
    });

    if (!actionResult.success || !actionResult.data) {
      throw new Error(actionResult.error || 'Failed to delete memory');
    }

    return {
      success: true,
      deletedCount: actionResult.data.deletedCount,
      message: actionResult.data.message,
      deletionType: actionResult.data.deletionType as DeletionMode,
    };
  } catch (error) {
    logger.error('Error deleting memory', {
      operation: 'deleteMemory',
      deletionType: options.type,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      deletedCount: 0,
      message: `Error deleting memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      deletionType: options.type,
    };
  }
}

/**
 * Get full content for a specific session report
 */
export async function getSessionReportDetail(
  reportId: string,
  sessionId?: string
): Promise<SessionReportDetail | null> {
  const params = new URLSearchParams();
  params.set('manage', 'true');
  params.set('includeFullContent', 'true');
  if (sessionId) {
    params.set('excludeSessionId', sessionId);
  }

  logger.reportOperation('Session report API call initiated', reportId, {
    sessionId: '[FILTERED_SESSION_ID]',
    hasReportId: !!reportId ? 'true' : 'false',
    hasParams: 'true',
  });

  try {
    const raw = await apiClient.getMemoryReports(params);

    logger.reportOperation('Session report API response received', reportId, {
      status: 200,
    });

    const data = raw.data;
    logger.reportOperation('Session report data processed', reportId, {
      success: raw.success ? 'true' : 'false',
      memoryDetailsCount:
        raw.success && data && isMemoryManagementResponse(data) ? data.memoryDetails.length : 0,
      hasMemoryDetails: raw.success && data && isMemoryManagementResponse(data) ? 'true' : 'false',
    });

    if (raw.success && data && isMemoryManagementResponse(data)) {
      // Find the specific report
      const report = data.memoryDetails.find((r: MemoryDetailInfo) => r.id === reportId);
      logger.reportOperation('Session report located', reportId, {
        reportFound: !!report ? 'true' : 'false',
        hasFullContent: !!(report as MemoryDetailInfo)?.fullContent ? 'true' : 'false',
        hasStructuredCBTData: !!(report as MemoryDetailInfo)?.structuredCBTData ? 'true' : 'false',
        reportKeyCount: report ? Object.keys(report).length : 0,
      });

      if (report && report.fullContent) {
        const result: SessionReportDetail = {
          id: report.id,
          sessionId: report.sessionId,
          sessionTitle: report.sessionTitle,
          sessionDate: report.sessionDate,
          reportDate: report.reportDate,
          fullContent: report.fullContent,
          keyInsights: report.keyInsights,
          reportSize: report.reportSize,
          structuredCBTData: (report as MemoryDetailInfo).structuredCBTData, // CRITICAL: Include structured CBT data
        };

        logger.reportOperation('Session report detail prepared for return', reportId, {
          hasStructuredCBTData: !!result.structuredCBTData ? 'true' : 'false',
          structuredCBTDataType: typeof result.structuredCBTData,
          structuredCBTDataKeyCount:
            result.structuredCBTData && typeof result.structuredCBTData === 'object'
              ? Object.keys(result.structuredCBTData as Record<string, unknown>).length
              : 0,
        });

        return result;
      } else {
        logger.warn('Session report found but missing fullContent', {
          operation: 'getSessionReportDetail',
          reportId: '[FILTERED_REPORT_ID]',
          hasReport: !!report,
          hasFullContent: !!(report as MemoryDetailInfo)?.fullContent,
        });
      }
    } else {
      logger.warn('Session report API response unsuccessful or no memoryDetails', {
        operation: 'getSessionReportDetail',
        success: raw.success,
        hasMemoryDetails: false,
      });
    }
  } catch (error) {
    const status = (error as { status?: number })?.status;

    if (status) {
      logger.error('Session report API response not ok', {
        operation: 'getSessionReportDetail',
        status: status,
        statusText: (error as Error).message,
      });
    } else {
      logger.error('Error fetching session report detail', {
        operation: 'getSessionReportDetail',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return null;
}

/**
 * Refresh memory context after deletion
 */
export async function refreshMemoryContext(sessionId?: string): Promise<MemoryContextInfo> {
  // Small delay to ensure database consistency
  await new Promise((resolve) => setTimeout(resolve, 100));
  return checkMemoryContext(sessionId);
}
