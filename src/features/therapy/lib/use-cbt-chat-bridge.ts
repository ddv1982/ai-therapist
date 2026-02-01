'use client';

import { useCallback } from 'react';
import { useLocale } from 'next-intl';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';
import {
  buildEmotionComparisonCard,
  buildSessionSummaryCard,
  buildStepCard,
} from '@/features/therapy/cbt/flow/cards';
import {
  CBT_STEP_ORDER,
  type CBTFlowContext,
  type CBTFlowState,
  type CBTStepId,
} from '@/features/therapy/cbt/flow';
import type { EmotionData } from '@/types';
import type { Locale } from '@/i18n/routing';

export interface SendStepOptions {
  onlyIfExists?: boolean;
}

export function useCBTChatBridge() {
  const locale = useLocale() as Locale;
  const sendChatMessage = useCallback(async (content: string, sessionId?: string) => {
    if (!sessionId) {
      logger.warn('CBT data send attempted without active session', {
        operation: 'sendChatMessage',
      });
      return false;
    }
    try {
      await apiClient.postMessage(sessionId, { role: 'user', content });
      return true;
    } catch (error) {
      logger.therapeuticOperation('Failed to send CBT data to chat', {
        operation: 'sendChatMessage',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }, []);

  const sendStepCard = useCallback(
    async (
      stepId: CBTStepId,
      context: CBTFlowContext,
      sessionId?: string,
      options?: SendStepOptions
    ) => {
      const card = buildStepCard(stepId, context);
      if (!card) {
        if (!options?.onlyIfExists) {
          logger.therapeuticOperation?.('No CBT card generated for step', { stepId });
        }
        return false;
      }
      return sendChatMessage(card, sessionId);
    },
    [sendChatMessage]
  );

  const sendAllCompletedSteps = useCallback(
    async (context: CBTFlowContext, sessionId?: string) => {
      let result = true;
      for (const stepId of CBT_STEP_ORDER) {
        const card = buildStepCard(stepId, context);
        if (!card) continue;
        const success = await sendChatMessage(card, sessionId);
        result = result && success;
      }
      return result;
    },
    [sendChatMessage]
  );

  const sendSessionSummary = useCallback(
    async (state: CBTFlowState, sessionId?: string) => {
      const card = buildSessionSummaryCard(state, locale);
      return sendChatMessage(card, sessionId);
    },
    [locale, sendChatMessage]
  );

  const sendEmotionComparison = useCallback(
    async (initialEmotions: EmotionData, finalEmotions: EmotionData, sessionId?: string) => {
      const card = buildEmotionComparisonCard(initialEmotions, finalEmotions);
      return sendChatMessage(card, sessionId);
    },
    [sendChatMessage]
  );

  return {
    sendChatMessage,
    sendStepCard,
    sendAllCompletedSteps,
    sendSessionSummary,
    sendEmotionComparison,
  };
}
