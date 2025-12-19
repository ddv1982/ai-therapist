'use client';

import { useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { REPORT_MODEL_ID } from '@/features/chat/config';
import { useApiKeys } from '@/hooks/use-api-keys';
import { createBYOKHeaders, getEffectiveModelId } from '@/lib/chat/byok-helper';

// Internal mapping helper types intentionally omitted to reduce surface area

export function useGenerateReport(params: {
  currentSession: string | null;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
  setMessages: (
    updater: (
      prev: Array<{
        id: string;
        role: 'user' | 'assistant';
        content: string;
        timestamp: Date;
        modelUsed?: string;
      }>
    ) => Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
      modelUsed?: string;
    }>
  ) => void;
  loadSessions: () => Promise<void>;
  setIsGeneratingReport: (val: boolean) => void;
}) {
  const { currentSession, messages, setMessages, loadSessions, setIsGeneratingReport } = params;
  const { keys, isActive } = useApiKeys();
  const byokKey = isActive ? keys.openai : null;

  const generateReport = useCallback(async () => {
    if (!currentSession || messages.length === 0) return;
    setIsGeneratingReport(true);

    // Determine effective model: BYOK overrides report model
    const effectiveModelId = getEffectiveModelId(byokKey, REPORT_MODEL_ID);
    const headers = createBYOKHeaders(byokKey);

    try {
      const result = await apiClient.generateReportDetailed(
        {
          sessionId: currentSession,
          messages: messages
            .filter((m) => !m.content.startsWith('📊 **Session Report**'))
            .map((m) => ({
              role: m.role,
              content: m.content,
              timestamp: m.timestamp.toISOString?.(),
            })),
          model: effectiveModelId,
        },
        { headers }
      );

      const dataObj = (result as { success?: boolean; data?: { reportContent?: unknown } }).data;
      const legacyReport = (result as { reportContent?: unknown }).reportContent;
      const content =
        typeof dataObj?.reportContent === 'string'
          ? (dataObj.reportContent as string)
          : typeof legacyReport === 'string'
            ? (legacyReport as string)
            : undefined;

      if (content) {
        const reportMessage = {
          id: Date.now().toString(),
          role: 'assistant' as const,
          content: `📊 **Session Report**\n\n${content}`,
          timestamp: new Date(),
          modelUsed: effectiveModelId,
        };
        setMessages((prev) => [...prev, reportMessage]);
        try {
          await apiClient.postMessage(currentSession, {
            role: 'assistant',
            content: reportMessage.content,
            modelUsed: effectiveModelId,
          });
          await loadSessions();
        } catch {}
      }
    } finally {
      setIsGeneratingReport(false);
    }
  }, [currentSession, messages, setMessages, loadSessions, setIsGeneratingReport, byokKey]);

  return { generateReport };
}
