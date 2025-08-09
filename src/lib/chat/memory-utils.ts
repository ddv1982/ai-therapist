/**
 * Utilities for managing therapeutic memory context
 */

export interface MemoryContextInfo {
  hasMemory: boolean;
  reportCount: number;
  lastReportDate?: string;
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