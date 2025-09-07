'use client';

import React, { useState, useRef } from 'react';
import { ChatComposer } from './chat-composer';
import { useSendMessageMutation } from '@/store/slices/chatApi';

interface ChatComposerContainerProps {
  sessionId: string;
  isMobile: boolean;
}

export function ChatComposerContainer({ sessionId, isMobile }: ChatComposerContainerProps) {
  const [input, setInput] = useState('');
  const [sendMessage, { isLoading }] = useSendMessageMutation();
  const inputContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      await sendMessage({
        sessionId,
        role: 'user',
        content: input.trim(),
      }).unwrap();
      setInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleStop = () => {
    // TODO: integrate with streaming cancellation if supported
    console.log('Stop streaming not yet implemented');
  };

  return (
    <ChatComposer
      input={input}
      isLoading={isLoading}
      isMobile={isMobile}
      onChange={setInput}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
        }
      }}
      onSubmit={handleSubmit}
      onStop={handleStop}
      inputContainerRef={inputContainerRef}
      textareaRef={textareaRef}
    />
  );
}
