/**
 * Utilities for managing therapeutic memory context
 */

export interface MemoryContextInfo {
  hasMemory: boolean;
  reportCount: number;
  lastReportDate?: string;
}

export interface MemoryDetailInfo {
  id: string;
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  reportDate: string;
  contentPreview: string;
  keyInsights: string[];
  hasEncryptedContent: boolean;
  reportSize: number;
  fullContent?: string; // Optional full content for detail view
}

export interface SessionReportDetail {
  id: string;
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  reportDate: string;
  fullContent: string;
  keyInsights: string[];
  reportSize: number;
}

export interface MemoryManagementResponse {
  success: boolean;
  memoryDetails: MemoryDetailInfo[];
  reportCount: number;
  stats: {
    totalReportsFound: number;
    successfullyProcessed: number;
    failedDecryptions: number;
    hasMemory: boolean;
  };
}

export interface MemoryDeletionResponse {
  success: boolean;
  deletedCount: number;
  message: string;
  deletionType: 'specific' | 'recent' | 'all-except-current' | 'all';
}

/**
 * Check if memory context is available for a session
 */
export async function checkMemoryContext(sessionId?: string): Promise<MemoryContextInfo> {
  if (!sessionId) {
    return { hasMemory: false, reportCount: 0 };
  }
  
  try {
    const response = await fetch(`/api/reports/memory?excludeSessionId=${sessionId}&limit=3`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.memoryContext && data.memoryContext.length > 0) {
        const sortedMemory = data.memoryContext.sort((a: { reportDate: string }, b: { reportDate: string }) => 
          new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
        );
        
        return {
          hasMemory: true,
          reportCount: data.memoryContext.length,
          lastReportDate: sortedMemory[0]?.reportDate
        };
      }
    }
  } catch (error) {
    console.warn('Failed to check memory context:', error);
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
export async function getMemoryManagementData(sessionId?: string): Promise<MemoryManagementResponse> {
  const excludeParam = sessionId ? `?excludeSessionId=${sessionId}` : '';
  
  try {
    const response = await fetch(`/api/reports/memory/manage${excludeParam}`);
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      console.error('Failed to fetch memory management data:', response.status);
      return {
        success: false,
        memoryDetails: [],
        reportCount: 0,
        stats: {
          totalReportsFound: 0,
          successfullyProcessed: 0,
          failedDecryptions: 0,
          hasMemory: false
        }
      };
    }
  } catch (error) {
    console.error('Error fetching memory management data:', error);
    return {
      success: false,
      memoryDetails: [],
      reportCount: 0,
      stats: {
        totalReportsFound: 0,
        successfullyProcessed: 0,
        failedDecryptions: 0,
        hasMemory: false
      }
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
    const params = new URLSearchParams();
    
    if (options.type === 'all-except-current' && options.sessionId) {
      params.set('excludeSessionId', options.sessionId);
    } else if (options.type === 'recent' && options.limit) {
      params.set('limit', options.limit.toString());
      if (options.sessionId) {
        params.set('excludeSessionId', options.sessionId);
      }
    } else if (options.type === 'specific' && options.sessionIds) {
      params.set('sessionIds', options.sessionIds.join(','));
    }
    
    const url = `/api/reports/memory?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to delete memory:', response.status, errorData);
      return {
        success: false,
        deletedCount: 0,
        message: `Failed to delete memory: ${errorData.error || 'Unknown error'}`,
        deletionType: options.type
      };
    }
  } catch (error) {
    console.error('Error deleting memory:', error);
    return {
      success: false,
      deletedCount: 0,
      message: `Error deleting memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      deletionType: options.type
    };
  }
}

/**
 * Get full content for a specific session report
 */
export async function getSessionReportDetail(reportId: string, sessionId?: string): Promise<SessionReportDetail | null> {
  const excludeParam = sessionId ? `?excludeSessionId=${sessionId}&includeFullContent=true` : '?includeFullContent=true';
  
  try {
    const response = await fetch(`/api/reports/memory/manage${excludeParam}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.memoryDetails) {
        // Find the specific report
        const report = data.memoryDetails.find((r: MemoryDetailInfo) => r.id === reportId);
        if (report && report.fullContent) {
          return {
            id: report.id,
            sessionId: report.sessionId,
            sessionTitle: report.sessionTitle,
            sessionDate: report.sessionDate,
            reportDate: report.reportDate,
            fullContent: report.fullContent,
            keyInsights: report.keyInsights,
            reportSize: report.reportSize
          };
        }
      }
    }
  } catch (error) {
    console.error('Error fetching session report detail:', error);
  }
  
  return null;
}

/**
 * Refresh memory context after deletion
 */
export async function refreshMemoryContext(sessionId?: string): Promise<MemoryContextInfo> {
  // Small delay to ensure database consistency
  await new Promise(resolve => setTimeout(resolve, 100));
  return checkMemoryContext(sessionId);
}