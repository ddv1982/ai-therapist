import type { ConvexHttpClient } from 'convex/browser';
import { anyApi } from '@/lib/convex/http-client';
import { logger } from '@/lib/utils/logger';
import { decryptSessionReportContent } from '@/lib/chat/message-encryption';
import type { ConvexSessionReport, ConvexSession, ConvexUser } from '@/types/convex';

interface MemoryContextEntry {
  sessionTitle: string;
  sessionDate: string;
  reportDate: string;
  content: string;
  summary: string;
}

interface MemoryStats {
  totalReportsFound: number;
  successfullyDecrypted: number;
  failedDecryptions: number;
}

interface MemoryData {
  memoryContext: MemoryContextEntry[];
  reportCount: number;
  stats: MemoryStats;
}

interface MemoryReportDetail {
  id: string;
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  reportDate: string;
  contentPreview: string;
  keyInsights: string[];
  hasEncryptedContent: boolean;
  reportSize: number;
  fullContent?: string;
  structuredCBTData?: unknown;
}

interface MemoryManageData {
  memoryDetails: MemoryReportDetail[];
  reportCount: number;
  stats: {
    totalReportsFound: number;
    successfullyProcessed: number;
    failedDecryptions: number;
    hasMemory: boolean;
  };
}

interface DeleteMemoryData {
  deletedCount: number;
  message: string;
  deletionType: 'specific' | 'recent' | 'all-except-current' | 'all';
}

export class MemoryManagementService {
  constructor(private readonly client: ConvexHttpClient) {}
  /**
   * Creates a therapeutic summary from structured session report data
   */
  private createTherapeuticSummary(
    keyPoints: unknown,
    therapeuticInsights: unknown,
    patternsIdentified: unknown,
    decryptedContent: string
  ): string {
    const summaryParts: string[] = [];

    // Extract key points if available
    if (Array.isArray(keyPoints) && keyPoints.length > 0) {
      const pointsText = keyPoints
        .filter((point) => typeof point === 'string')
        .slice(0, 3)
        .join('; ');
      if (pointsText) summaryParts.push(`Key insights: ${pointsText}`);
    }

    // Extract therapeutic insights
    if (therapeuticInsights && typeof therapeuticInsights === 'object') {
      const insights = therapeuticInsights as Record<string, unknown>;
      if (insights.primaryInsights && Array.isArray(insights.primaryInsights)) {
        const insightsText = insights.primaryInsights
          .filter((insight) => typeof insight === 'string')
          .slice(0, 2)
          .join('; ');
        if (insightsText) summaryParts.push(`Therapeutic focus: ${insightsText}`);
      }

      if (insights.growthAreas && Array.isArray(insights.growthAreas)) {
        const growthText = insights.growthAreas
          .filter((area) => typeof area === 'string')
          .slice(0, 2)
          .join('; ');
        if (growthText) summaryParts.push(`Growth areas: ${growthText}`);
      }
    }

    // Extract patterns if available
    if (Array.isArray(patternsIdentified) && patternsIdentified.length > 0) {
      const patternsText = patternsIdentified
        .filter((pattern) => typeof pattern === 'string')
        .slice(0, 2)
        .join('; ');
      if (patternsText) summaryParts.push(`Patterns identified: ${patternsText}`);
    }

    // If we have structured summary, return it
    if (summaryParts.length > 0) {
      return summaryParts.join('. ');
    }

    // Fallback to content truncation
    return decryptedContent.length > 500
      ? decryptedContent.substring(0, 500) + '...'
      : decryptedContent;
  }

  /**
   * Retrieves recent session reports for memory context
   */
  async getMemoryContext(
    clerkId: string,
    limit: number,
    excludeSessionId: string | null
  ): Promise<MemoryData> {
    logger.info('Retrieving session reports for memory context', {
      limit,
      excludeSessionId,
    });

    const client = this.client;

    // Get user from Clerk ID
    const user = await client.query(anyApi.users.getByClerkId, { clerkId });
    const convexUser = user as ConvexUser | null;

    if (!convexUser) {
      logger.warn('User not found for memory context', { clerkId: '[FILTERED]' });
      return {
        memoryContext: [],
        reportCount: 0,
        stats: {
          totalReportsFound: 0,
          successfullyDecrypted: 0,
          failedDecryptions: 0,
        },
      };
    }

    const reports = await client.query(anyApi.reports.listRecent, {
      userId: convexUser._id,
      limit: Math.min(limit, 10),
      excludeSessionId: excludeSessionId || undefined,
    });

    const convexReports = Array.isArray(reports) ? (reports as ConvexSessionReport[]) : [];

    logger.info('Found session reports for memory processing', {
      reportCount: convexReports.length,
      reportIds: convexReports.map((r) => String(r._id).substring(0, 8)),
    });

    const memoryContext: MemoryContextEntry[] = [];
    let successfulReports = 0;
    let failedDecryptions = 0;

    for (const report of convexReports) {
      try {
        const decryptedContent = decryptSessionReportContent(report.reportContent);

        const summary = this.createTherapeuticSummary(
          report.keyPoints,
          report.therapeuticInsights,
          report.patternsIdentified,
          decryptedContent
        );

        const session = await client.query(anyApi.sessions.get, { sessionId: report.sessionId });
        const convexSession = session as ConvexSession | null;

        memoryContext.push({
          sessionTitle: convexSession?.title ?? 'Session',
          sessionDate: convexSession
            ? new Date(convexSession.startedAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          reportDate: new Date(report.createdAt).toISOString().split('T')[0],
          content: decryptedContent,
          summary: summary,
        });

        successfulReports++;

        logger.info('Successfully processed session report for memory', {
          reportId: String(report._id).substring(0, 8),
          summaryLength: summary.length,
          hasStructuredData: !!(
            report.keyPoints ||
            report.therapeuticInsights ||
            report.patternsIdentified
          ),
        });
      } catch (decryptionError) {
        failedDecryptions++;
        logger.warn('Failed to decrypt session report, skipping', {
          reportId: String(report._id).substring(0, 8),
          error:
            decryptionError instanceof Error ? decryptionError.message : 'Unknown decryption error',
        });
        continue;
      }
    }

    logger.info('Memory context processing completed', {
      totalReports: convexReports.length,
      successfulReports,
      failedDecryptions,
      memoryContextSize: memoryContext.length,
      totalMemoryLength: memoryContext.reduce((acc, r) => acc + r.content.length, 0),
      totalSummaryLength: memoryContext.reduce((acc, r) => acc + r.summary.length, 0),
    });

    return {
      memoryContext,
      reportCount: memoryContext.length,
      stats: {
        totalReportsFound: convexReports.length,
        successfullyDecrypted: successfulReports,
        failedDecryptions: failedDecryptions,
      },
    };
  }

  /**
   * Retrieves detailed memory management information
   */
  async getMemoryManagement(
    clerkId: string,
    limit: number,
    excludeSessionId: string | null,
    includeFullContent: boolean
  ): Promise<MemoryManageData> {
    logger.info('Memory management request received');

    const client = this.client;

    // Get user from Clerk ID
    const user = await client.query(anyApi.users.getByClerkId, { clerkId });
    const convexUser = user as ConvexUser | null;

    if (!convexUser) {
      logger.warn('User not found for memory management', { clerkId: '[FILTERED]' });
      return {
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

    const limited = await client.query(anyApi.reports.listRecent, {
      userId: convexUser._id,
      limit: Math.min(limit, 20),
      excludeSessionId: excludeSessionId || undefined,
    });

    const limitedReports = Array.isArray(limited) ? (limited as ConvexSessionReport[]) : [];

    logger.info('Found session reports for memory management', {
      reportCount: limitedReports.length,
    });

    const memoryDetails: MemoryReportDetail[] = [];
    let successfulReports = 0;
    let failedDecryptions = 0;

    for (const report of limitedReports) {
      try {
        let contentPreview = '';
        let fullContent: string | undefined = undefined;
        let hasEncryptedContent = false;

        try {
          const decryptedContent = decryptSessionReportContent(report.reportContent);
          contentPreview =
            decryptedContent.length > 200
              ? decryptedContent.substring(0, 200) + '...'
              : decryptedContent;

          if (includeFullContent) {
            fullContent = decryptedContent;
          }

          hasEncryptedContent = true;
          successfulReports++;
        } catch {
          contentPreview = 'Encrypted content (unable to decrypt for preview)';
          hasEncryptedContent = false;
          failedDecryptions++;
        }

        const keyInsights: string[] = [];

        if (Array.isArray(report.keyPoints)) {
          const points = (report.keyPoints as unknown[]).filter(
            (point): point is string => typeof point === 'string'
          );
          keyInsights.push(...points.slice(0, 3));
        }

        if (report.therapeuticInsights && typeof report.therapeuticInsights === 'object') {
          const insights = report.therapeuticInsights as Record<string, unknown>;
          if (Array.isArray(insights.primaryInsights)) {
            keyInsights.push(
              ...insights.primaryInsights.filter((i) => typeof i === 'string').slice(0, 2)
            );
          }
        }

        const session = await client.query(anyApi.sessions.get, { sessionId: report.sessionId });
        const convexSession = session as ConvexSession | null;

        const reportDetail: MemoryReportDetail = {
          id: String(report._id),
          sessionId: String(report.sessionId),
          sessionTitle: convexSession?.title ?? 'Session',
          sessionDate: convexSession
            ? new Date(convexSession.startedAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          reportDate: new Date(report.createdAt).toISOString().split('T')[0],
          contentPreview,
          keyInsights: keyInsights.slice(0, 5),
          hasEncryptedContent,
          reportSize: report.reportContent.length,
        };

        if (includeFullContent) {
          if (fullContent !== undefined) {
            reportDetail.fullContent = fullContent;
          }

          if (report.therapeuticInsights && typeof report.therapeuticInsights === 'object') {
            const insights = report.therapeuticInsights as Record<string, unknown>;
            if (insights.structuredAssessment) {
              reportDetail.structuredCBTData = insights.structuredAssessment;
            }
          }
        }

        memoryDetails.push(reportDetail);
      } catch (error) {
        logger.warn('Failed to process session report for management', {
          reportId: report._id.substring(0, 8),
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        continue;
      }
    }

    logger.info('Memory management processing completed', {
      totalReports: limitedReports.length,
      successfulReports,
      failedDecryptions,
      memoryDetailsCount: memoryDetails.length,
    });

    return {
      memoryDetails,
      reportCount: memoryDetails.length,
      stats: {
        totalReportsFound: limitedReports.length,
        successfullyProcessed: successfulReports,
        failedDecryptions: failedDecryptions,
        hasMemory: memoryDetails.length > 0,
      },
    };
  }

  /**
   * Deletes session reports from memory
   */
  async deleteMemory(
    clerkId: string,
    sessionIds?: string[],
    limit?: number,
    excludeSessionId?: string | null
  ): Promise<DeleteMemoryData> {
    logger.info('Memory deletion request received');

    const client = this.client;
    const user = await client.query(anyApi.users.getByClerkId, { clerkId });
    const convexUser = user as ConvexUser | null;

    if (!convexUser) {
      throw new Error('User not found');
    }

    const sessions = await client.query(anyApi.sessions.listByUser, { userId: convexUser._id });
    const convexSessions = Array.isArray(sessions) ? (sessions as ConvexSession[]) : [];
    const allReports: ConvexSessionReport[] = [];

    for (const s of convexSessions) {
      const rs = await client.query(anyApi.reports.listBySession, { sessionId: s._id });
      const sessionReports = Array.isArray(rs) ? (rs as ConvexSessionReport[]) : [];
      for (const r of sessionReports) allReports.push(r);
    }

    let toDelete: string[] = [];
    let deletionDescription = '';

    if (sessionIds && sessionIds.length > 0) {
      toDelete = allReports
        .filter((r) => sessionIds.includes(String(r.sessionId)))
        .map((r) => String(r._id));
      deletionDescription = `specific sessions: ${sessionIds.join(', ')}`;
    } else if (limit) {
      const filtered = excludeSessionId
        ? allReports.filter((r) => String(r.sessionId) !== excludeSessionId)
        : allReports;
      const sorted = filtered.sort((a, b) => b.createdAt - a.createdAt);
      toDelete = sorted.slice(0, limit).map((r) => String(r._id));
      deletionDescription = `${toDelete.length} recent reports${excludeSessionId ? ` (excluding current session)` : ''}`;
    } else if (excludeSessionId) {
      toDelete = allReports
        .filter((r) => String(r.sessionId) !== excludeSessionId)
        .map((r) => String(r._id));
      deletionDescription = 'all memory (excluding current session)';
    } else {
      toDelete = allReports.map((r) => String(r._id));
      deletionDescription = 'all memory';
    }

    logger.info('Executing memory deletion', {
      deletionDescription,
      candidateCount: toDelete.length,
    });

    let deletedCount = 0;
    if (toDelete.length > 0) {
      const deletionResult = await client.mutation(anyApi.reports.removeMany, { ids: toDelete });
      const result = deletionResult as { count?: number } | null;
      deletedCount = result?.count ?? toDelete.length;
    }

    logger.info('Memory deletion completed successfully', {
      deletionDescription,
      deletedCount,
    });

    return {
      deletedCount,
      message: `Successfully deleted ${deletedCount} session reports (${deletionDescription})`,
      deletionType: sessionIds
        ? 'specific'
        : limit
          ? 'recent'
          : excludeSessionId
            ? 'all-except-current'
            : 'all',
    };
  }
}
