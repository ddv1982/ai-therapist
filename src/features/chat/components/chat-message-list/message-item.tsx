'use client';

import { memo, type ReactNode } from 'react';
import { Heart } from 'lucide-react';
import { Message } from '@/features/chat/messages/message';
import type { MessageData } from '@/features/chat/messages/message';

export type RenderCBTComponent = (message: MessageData) => ReactNode;

function shouldShowTypingIndicator(
  message: MessageData,
  isLastMessage: boolean,
  isStreaming: boolean
) {
  return isStreaming && isLastMessage && message.role === 'assistant' && message.content === '';
}

function renderMessageContent(message: MessageData, renderCBTComponent: RenderCBTComponent) {
  const metadata = message.metadata as Record<string, unknown> | undefined;
  if (metadata?.step) {
    return (
      <div role="article" aria-label={`CBT ${metadata.step} step`}>
        {renderCBTComponent(message)}
      </div>
    );
  }
  if (message.content) {
    return <Message message={message} />;
  }
  return null;
}

const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="mx-auto mb-2 flex max-w-4xl items-center justify-start py-2" aria-live="polite">
      <div className="flex items-center gap-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 shadow-lg">
          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
        </div>
        <div
          className="flex animate-pulse space-x-2 motion-reduce:animate-none"
          aria-label="Assistant is typing"
        >
          <div className="bg-primary h-2 w-2 animate-bounce rounded-full motion-reduce:animate-none"></div>
          <div
            className="bg-primary h-2 w-2 animate-bounce rounded-full motion-reduce:animate-none"
            style={{ animationDelay: '0.1s' }}
          ></div>
          <div
            className="bg-primary h-2 w-2 animate-bounce rounded-full motion-reduce:animate-none"
            style={{ animationDelay: '0.2s' }}
          ></div>
        </div>
      </div>
    </div>
  );
});

function isMessageItemEqual(
  prevProps: {
    message: MessageData;
    isLastMessage: boolean;
    isStreaming: boolean;
  },
  nextProps: {
    message: MessageData;
    isLastMessage: boolean;
    isStreaming: boolean;
  }
) {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.role === nextProps.message.role &&
    prevProps.isLastMessage === nextProps.isLastMessage &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.message.metadata?.step === nextProps.message.metadata?.step
  );
}

const MemoizedMessageItem = memo(
  ({
    message,
    isLastMessage,
    isStreaming,
    renderCBTComponent,
  }: {
    message: MessageData;
    isLastMessage: boolean;
    isStreaming: boolean;
    renderCBTComponent: RenderCBTComponent;
  }) => {
    const showTypingIndicator = shouldShowTypingIndicator(message, isLastMessage, isStreaming);
    const content = renderMessageContent(message, renderCBTComponent);

    return (
      <>
        {showTypingIndicator && <TypingIndicator />}
        {content}
      </>
    );
  },
  (prevProps, nextProps) => isMessageItemEqual(prevProps, nextProps)
);

export function renderMessageItem(
  message: MessageData,
  isLastMessage: boolean,
  isStreaming: boolean,
  renderCBTComponent: RenderCBTComponent
) {
  return (
    <MemoizedMessageItem
      message={message}
      isLastMessage={isLastMessage}
      isStreaming={isStreaming}
      renderCBTComponent={renderCBTComponent}
    />
  );
}
