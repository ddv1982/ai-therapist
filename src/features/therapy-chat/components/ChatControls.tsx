/**
 * Chat Controls Component
 *
 * Renders the input area, send button, and related controls.
 * Extracted from ChatPageContent to reduce complexity.
 */

'use client';

import { ChatComposer } from '@/features/chat/components/chat-composer';
import type { ChatState } from '../hooks/useChatState';
import type { ChatActions } from '../hooks/useChatActions';

export interface ChatControlsProps {
  chatState: ChatState;
  chatActions: Pick<
    ChatActions,
    'handleInputChange' | 'handleKeyDown' | 'handleFormSubmit'
  >;
  onStop: () => void;
}

/**
 * Component that renders the chat input controls.
 * Includes the input area, send button, and stop button.
 */
export function ChatControls({
  chatState,
  chatActions,
  onStop,
}: ChatControlsProps) {
  const { input, isLoading, isMobile, inputContainerRef, textareaRef } = chatState;
  const { handleInputChange, handleKeyDown, handleFormSubmit } = chatActions;

  return (
    <ChatComposer
      input={input}
      isLoading={Boolean(isLoading)}
      isMobile={isMobile}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onSubmit={handleFormSubmit}
      onStop={onStop}
      inputContainerRef={inputContainerRef}
      textareaRef={textareaRef}
    />
  );
}
