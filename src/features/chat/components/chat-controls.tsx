/**
 * Chat Controls Component
 *
 * Renders the input area, send button, and related controls.
 * Extracted from ChatPageContent to reduce complexity.
 * Optimized with React.memo to prevent unnecessary re-renders.
 */

'use client';

import { memo } from 'react';
import { ChatComposer } from '@/features/chat/components/chat-composer';
import { useChat } from '@/features/chat/context/chat-context';

/**
 * Component that renders the chat input controls.
 * Includes the input area, send button, and stop button.
 * Wrapped with React.memo to prevent unnecessary re-renders.
 */
export const ChatControls = memo(function ChatControls() {
  const { state: chatState, actions: chatActions, controller } = useChat();
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
      onStop={controller.stopGenerating}
      inputContainerRef={inputContainerRef}
      textareaRef={textareaRef}
    />
  );
});
