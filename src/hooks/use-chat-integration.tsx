/**
 * Simplified Chat Integration Hook
 *
 * Replaces complex ChatUI context and CBT chat bridge with simple chat messaging.
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useSession } from './use-session';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';

export function useChatIntegration() {
  const { sessionId } = useSession();

  const sendMessage = useCallback(async (content: string) => {
    if (!sessionId) {
      logger.warn('Cannot send message: no active session');
      return { success: false, error: 'No active session' };
    }

    try {
      await apiClient.postMessage(sessionId, {
        role: 'user',
        content
      });

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to send message to chat', { error: message, sessionId });
      return { success: false, error: message };
    }
  }, [sessionId]);

  const sendCBTSummary = useCallback(async (summaryData: {
    situation?: string;
    emotions?: Record<string, number>;
    thoughts?: string[];
  }) => {
    if (!sessionId) {
      return { success: false, error: 'No active session' };
    }

    try {
      const summary = generateCBTSummary(summaryData);
      return await sendMessage(summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to send CBT summary', { error: message, sessionId });
      return { success: false, error: message };
    }
  }, [sessionId, sendMessage]);

  return useMemo(() => ({
    sendMessage,
    sendCBTSummary,
    canSend: !!sessionId,
  }), [sendMessage, sendCBTSummary, sessionId]);
}

/**
 * Simple CBT summary generator
 */
function generateCBTSummary(data: {
  situation?: string;
  emotions?: Record<string, number>;
  thoughts?: string[];
}): string {
  const parts = [];

  if (data.situation) {
    parts.push(`**Situation:** ${data.situation}`);
  }

  if (data.emotions) {
    const emotionStrings = Object.entries(data.emotions)
      .filter(([_, intensity]) => intensity > 0)
      .map(([emotion, intensity]) => `${emotion}: ${intensity}/10`);

    if (emotionStrings.length > 0) {
      parts.push(`**Emotions:** ${emotionStrings.join(', ')}`);
    }
  }

  if (data.thoughts && data.thoughts.length > 0) {
    parts.push(`**Thoughts:** ${data.thoughts.join('; ')}`);
  }

  return parts.length > 0
    ? `CBT Session Summary:\n${parts.join('\n\n')}`
    : 'CBT session data recorded';
}
