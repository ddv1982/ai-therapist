/**
 * Memory Domain Types
 * Shared API and UI-facing types for cross-session memory endpoints.
 */

export interface MemoryContextEntry {
  sessionTitle: string;
  sessionDate: string;
  reportDate: string;
  content: string;
  summary: string;
}

export interface MemoryStats {
  totalReportsFound: number;
  successfullyDecrypted: number;
  failedDecryptions: number;
}

export interface MemoryData {
  memoryContext: MemoryContextEntry[];
  reportCount: number;
  stats: MemoryStats;
}

export interface MemoryReportDetail {
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
  structuredCBTData?: Record<string, unknown>;
}

export interface MemoryManagementStats {
  totalReportsFound: number;
  successfullyProcessed: number;
  failedDecryptions: number;
  hasMemory: boolean;
}

export interface MemoryManageData {
  memoryDetails: MemoryReportDetail[];
  reportCount: number;
  stats: MemoryManagementStats;
}

export type MemoryDeleteType = 'specific' | 'recent' | 'all-except-current' | 'all';

export interface DeleteResponseData {
  deletedCount: number;
  message: string;
  deletionType: MemoryDeleteType;
}
