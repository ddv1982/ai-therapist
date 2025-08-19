/**
 * CBT Chat Bridge Hook
 * 
 * Provides a bridge between CBT diary components and the chat system,
 * allowing CBT data to be formatted and sent as chat messages for 
 * inclusion in session reports.
 */

'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';
import { 
  formatSituationForChat,
  formatEmotionsForChat, 
  formatThoughtsForChat,
  formatCoreBeliefForChat,
  formatChallengeQuestionsForChat,
  formatRationalThoughtsForChat,
  formatSchemaModesForChat,
  formatActionPlanForChat,
  generateCBTSessionSummary,
  generateEmotionComparison
} from './cbt-data-manager';
import type { 
  EmotionData,
  CoreBeliefData,
  SchemaModesData,
  CBTSituationData,
  CBTThoughtsData,
  CBTChallengeData,
  CBTRationalData,
  CBTActionPlanData
} from '@/types/therapy';

/**
 * Hook to bridge CBT components with chat system
 */
export function useCBTChatBridge() {
  /**
   * Send a message to the current chat session
   */
  const sendChatMessage = useCallback(async (content: string, sessionId?: string) => {
    if (!sessionId) {
      logger.warn('CBT data send attempted without active session', { operation: 'sendChatMessage' });
      return false;
    }

    try {
      // Send message to chat API
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          role: 'user',
          content: content,
          source: 'cbt-diary' // Tag to identify CBT-generated messages
        }),
      });

      return true;
    } catch (error) {
      logger.therapeuticOperation('Failed to send CBT data to chat', { error: (error as Error).message });
      return false;
    }
  }, []);

  /**
   * Send situation data to chat
   */
  const sendSituationData = useCallback(async (data: CBTSituationData, sessionId?: string) => {
    const message = formatSituationForChat(data);
    return await sendChatMessage(message, sessionId);
  }, [sendChatMessage]);

  /**
   * Send emotion data to chat
   */
  const sendEmotionData = useCallback(async (data: EmotionData, sessionId?: string) => {
    const message = formatEmotionsForChat(data);
    return await sendChatMessage(message, sessionId);
  }, [sendChatMessage]);

  /**
   * Send thoughts data to chat
   */
  const sendThoughtsData = useCallback(async (data: CBTThoughtsData, sessionId?: string) => {
    const message = formatThoughtsForChat(data);
    return await sendChatMessage(message, sessionId);
  }, [sendChatMessage]);

  /**
   * Send core belief data to chat
   */
  const sendCoreBeliefData = useCallback(async (data: CoreBeliefData, sessionId?: string) => {
    const message = formatCoreBeliefForChat(data);
    return await sendChatMessage(message, sessionId);
  }, [sendChatMessage]);

  /**
   * Send challenge questions data to chat
   */
  const sendChallengeData = useCallback(async (data: CBTChallengeData, sessionId?: string) => {
    const message = formatChallengeQuestionsForChat(data);
    return await sendChatMessage(message, sessionId);
  }, [sendChatMessage]);

  /**
   * Send rational thoughts data to chat
   */
  const sendRationalThoughtsData = useCallback(async (data: CBTRationalData, sessionId?: string) => {
    const message = formatRationalThoughtsForChat(data);
    return await sendChatMessage(message, sessionId);
  }, [sendChatMessage]);

  /**
   * Send schema modes data to chat
   */
  const sendSchemaModesData = useCallback(async (data: SchemaModesData, sessionId?: string) => {
    const message = formatSchemaModesForChat(data);
    return await sendChatMessage(message, sessionId);
  }, [sendChatMessage]);

  /**
   * Send action plan data to chat
   */
  const sendActionPlanData = useCallback(async (data: CBTActionPlanData, sessionId?: string) => {
    const message = formatActionPlanForChat(data);
    return await sendChatMessage(message, sessionId);
  }, [sendChatMessage]);

  /**
   * Send emotion comparison data to chat
   */
  const sendEmotionComparison = useCallback(async (
    initialEmotions: EmotionData, 
    finalEmotions: EmotionData, 
    sessionId?: string
  ) => {
    const message = generateEmotionComparison(initialEmotions, finalEmotions);
    return await sendChatMessage(message, sessionId);
  }, [sendChatMessage]);

  /**
   * Send complete CBT session summary to chat
   */
  const sendCBTSessionSummary = useCallback(async (steps: {
    situation?: CBTSituationData;
    emotions?: EmotionData;
    thoughts?: CBTThoughtsData;
    coreBeliefs?: CoreBeliefData;
    challenges?: CBTChallengeData;
    rationalThoughts?: CBTRationalData;
    schemaModes?: SchemaModesData;
    actionPlan?: CBTActionPlanData;
  }, sessionId?: string) => {
    // Convert partial steps to complete session data for summary generation
    const completeData = {
      ...steps,
      timestamp: new Date().toISOString(),
      isComplete: false
    };
    const message = generateCBTSessionSummary(completeData);
    return await sendChatMessage(message, sessionId);
  }, [sendChatMessage]);

  return {
    sendChatMessage,
    sendSituationData,
    sendEmotionData,
    sendThoughtsData,
    sendCoreBeliefData,
    sendChallengeData,
    sendRationalThoughtsData,
    sendSchemaModesData,
    sendActionPlanData,
    sendEmotionComparison,
    sendCBTSessionSummary
  };
}

/**
 * Context for providing session ID to CBT components
 */

interface CBTSessionContextType {
  sessionId?: string;
  setSessionId?: (id: string) => void;
}

const CBTSessionContext = createContext<CBTSessionContextType>({});

export function CBTSessionProvider(props: { 
  children: React.ReactNode;
  sessionId?: string;
  setSessionId?: (id: string) => void;
}) {
  const { children, sessionId, setSessionId } = props;
  return React.createElement(
    CBTSessionContext.Provider,
    { value: { sessionId, setSessionId } },
    children
  );
}

export function useCBTSession() {
  return useContext(CBTSessionContext);
}