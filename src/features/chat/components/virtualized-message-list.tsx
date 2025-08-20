'use client';

import React, { memo, useMemo } from 'react';
import { Heart } from 'lucide-react';
import { Message, type MessageData } from '@/features/chat/messages';
import { 
  SituationPrompt,
  EmotionScale,
  ThoughtRecord,
  CoreBelief,
  ChallengeQuestions,
  RationalThoughts,
  SchemaModes,
  ActionPlan
} from '@/features/therapy/cbt/chat-components';
import {
  type SituationData,
  type EmotionData,
  type ThoughtData,
  type ActionPlanData,
  type CoreBeliefData
} from '@/store/slices/cbtSlice';
// Use the types from the store instead of component types
import type { ChallengeQuestionsData, RationalThoughtsData, SchemaModesData } from '@/types/therapy';

interface VirtualizedMessageListProps {
  messages: MessageData[];
  isStreaming: boolean;
  isMobile: boolean;
  // CBT component handlers - optional for normal chat
  onCBTSituationComplete?: (data: SituationData) => void;
  onCBTEmotionComplete?: (data: EmotionData) => void;
  onCBTThoughtComplete?: (data: ThoughtData[]) => void;
  onCBTCoreBeliefComplete?: (data: CoreBeliefData) => void;
  onCBTChallengeQuestionsComplete?: (data: ChallengeQuestionsData) => void;
  onCBTRationalThoughtsComplete?: (data: RationalThoughtsData) => void;
  onCBTSchemaModesComplete?: (data: SchemaModesData) => void;
  onCBTSendToChat?: () => void; // For triggering send to chat from rational thoughts step
  onCBTActionComplete?: (data: ActionPlanData) => void;
}

// Simple virtualization - only render visible and near-visible messages
function VirtualizedMessageListComponent({ 
  messages, 
  isStreaming, 
  isMobile,
  onCBTSituationComplete,
  onCBTEmotionComplete,
  onCBTThoughtComplete,
  onCBTCoreBeliefComplete,
  onCBTChallengeQuestionsComplete,
  onCBTRationalThoughtsComplete,
  onCBTSchemaModesComplete,
  onCBTSendToChat,
  onCBTActionComplete
}: VirtualizedMessageListProps) {
  // For conversations with many messages, only render the most recent ones to improve performance
  const visibleMessages = useMemo(() => {
    if (messages.length <= 50) {
      // For shorter conversations, render all messages
      return messages;
    }
    
    // For longer conversations, show only the most recent 50 messages
    // This prevents the DOM from getting too heavy
    return messages.slice(-50);
  }, [messages]);

  const containerClassName = useMemo(() => 
    `max-w-4xl mx-auto ${isMobile ? 'space-y-3 pb-6' : 'space-y-6 pb-12'}`,
    [isMobile]
  );

  // Function to render CBT components based on step
  const renderCBTComponent = (message: MessageData) => {
    const step = message.metadata?.step;
    const stepNumber = message.metadata?.stepNumber;
    const totalSteps = message.metadata?.totalSteps;

    switch (step) {
      case 'situation':
        return onCBTSituationComplete ? (
          <SituationPrompt
            onComplete={onCBTSituationComplete}
          />
        ) : null;

      case 'emotions':
        return onCBTEmotionComplete ? (
          <EmotionScale
            onComplete={onCBTEmotionComplete}
          />
        ) : null;

      case 'thoughts':
        return onCBTThoughtComplete ? (
          <ThoughtRecord
            onComplete={onCBTThoughtComplete}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />
        ) : null;

      case 'core-belief':
        return onCBTCoreBeliefComplete ? (
          <CoreBelief
            onComplete={onCBTCoreBeliefComplete}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />
        ) : null;

      case 'challenge-questions':
        return onCBTChallengeQuestionsComplete ? (
          <ChallengeQuestions
            onComplete={onCBTChallengeQuestionsComplete}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />
        ) : null;

      case 'rational-thoughts':
        return onCBTRationalThoughtsComplete ? (
          <RationalThoughts
            onComplete={onCBTRationalThoughtsComplete}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />
        ) : null;

      case 'schema-modes':
        return onCBTSchemaModesComplete ? (
          <SchemaModes
            onComplete={onCBTSchemaModesComplete}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />
        ) : null;

      case 'actions':
        return onCBTActionComplete ? (
          <ActionPlan
            onComplete={onCBTActionComplete}
            onSendToChat={onCBTSendToChat}
            stepNumber={stepNumber}
            totalSteps={totalSteps}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className={containerClassName}>
      {visibleMessages.map((message, index) => {
        const isLastMessage = index === visibleMessages.length - 1;
        const isAssistantMessage = message.role === 'assistant';
        const shouldShowTypingIndicator = isStreaming && isLastMessage && isAssistantMessage && message.content === '';
        
        return (
          <div key={message.id}>
            {/* Show typing indicator before empty assistant message */}
            {shouldShowTypingIndicator && (
              <div className="flex justify-start items-center py-2 mb-2 max-w-4xl mx-auto">
                <div className="flex items-center gap-4">
                  {/* Avatar placeholder */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 shadow-lg flex items-center justify-center">
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  </div>
                  {/* Typing dots */}
                  <div className="flex space-x-2 animate-pulse">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Render CBT component if this is a CBT step, otherwise render normal message */}
            {message.metadata?.step ? (
              <div
                role="article"
                aria-label={`CBT ${message.metadata.step} step`}
              >
                {renderCBTComponent(message)}
              </div>
            ) : message.content && (
              <div
                role="article"
                aria-label={`Message from ${message.role}`}
              >
                <Message 
                  message={message}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const VirtualizedMessageList = memo(VirtualizedMessageListComponent, (prevProps, nextProps) => {
  // Only re-render if messages changed, streaming status changed, or mobile status changed
  return (
    prevProps.messages.length === nextProps.messages.length &&
    prevProps.messages[prevProps.messages.length - 1]?.id === nextProps.messages[nextProps.messages.length - 1]?.id &&
    prevProps.messages[prevProps.messages.length - 1]?.content === nextProps.messages[nextProps.messages.length - 1]?.content &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.isMobile === nextProps.isMobile
  );
});