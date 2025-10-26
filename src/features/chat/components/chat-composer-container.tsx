'use client';

import React, { useState, useRef } from 'react';
import { ChatComposer } from './chat-composer';
import { useSendMessageMutation } from '@/store/slices/chatApi';
import { useToast } from '@/components/ui/toast';
import { logger } from '@/lib/utils/logger';
import { useTranslations } from 'next-intl';

interface ChatComposerContainerProps {
  sessionId: string;
  isMobile: boolean;
}

export function ChatComposerContainer({ sessionId, isMobile }: ChatComposerContainerProps) {
  const [input, setInput] = useState('');
  const [sendMessage, { isLoading }] = useSendMessageMutation();
  const inputContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { showToast } = useToast();
  const t = useTranslations('toast');

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
      showToast({ type: 'error', title: t('sendFailedTitle'), message: t('sendFailedBody') });
      logger.error('Failed to send message', { component: 'ChatComposerContainer', sessionId }, err as Error);
    }
  };

  const handleStop = () => {
    logger.info('Stop streaming requested (not yet implemented)', { component: 'ChatComposerContainer', sessionId });
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
