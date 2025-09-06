'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ChatComposerProps {
  input: string;
  isLoading: boolean;
  isMobile: boolean;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onStop: () => void;
  inputContainerRef?: React.RefObject<HTMLDivElement | null> | React.MutableRefObject<HTMLDivElement | null>;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null> | React.MutableRefObject<HTMLTextAreaElement | null>;
}

export function ChatComposer({
  input,
  isLoading,
  isMobile,
  onChange,
  onKeyDown,
  onSubmit,
  onStop,
  inputContainerRef,
  textareaRef,
}: ChatComposerProps) {
  const t = useTranslations('chat');

  return (
    <div
      ref={inputContainerRef}
      className={`${isMobile ? 'p-3 pt-2' : 'p-3 sm:p-6'} border-t border-border/30 bg-card/50 backdrop-blur-md relative flex-shrink-0`}
      role="form"
      aria-label="Chat composer"
    >
      <div className="max-w-4xl mx-auto">
        <form onSubmit={onSubmit} className="flex gap-3 items-end" aria-label="Send a message">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => {
                if (isMobile) {
                  setTimeout(() => {
                    textareaRef?.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                  }, 100);
                }
              }}
              placeholder={!isLoading && input.trim().length === 0 ? t('input.placeholder') : ''}
              className="min-h-[52px] sm:min-h-[80px] max-h-[120px] sm:max-h-[200px] resize-none rounded-xl sm:rounded-2xl border-border/50 bg-background/80 backdrop-blur-sm px-3 sm:px-6 py-3 sm:py-4 text-base placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all duration-300 touch-manipulation"
              disabled={false}
              style={{ fontSize: isMobile ? '16px' : undefined, WebkitTapHighlightColor: 'transparent' }}
              aria-label={t('input.ariaLabel')}
              aria-describedby="chat-composer-help"
              aria-multiline="true"
              role="textbox"
            />
            <p id="chat-composer-help" className="sr-only">
              {t('input.help', { defaultMessage: 'Type your message and press Enter to send' })}
            </p>
            {/* Removed inline help text to avoid cluttering UI */}
          </div>
          {isLoading ? (
            <Button
              type="button"
              onClick={onStop}
              className={`${isMobile ? 'h-[52px] w-[52px] rounded-xl' : 'h-[80px] w-[80px] rounded-2xl'} bg-muted text-foreground hover:bg-muted/90 active:bg-muted/80 shadow-lg hover:shadow-xl active:shadow-md transition-all duration-200 group relative overflow-hidden touch-manipulation flex-shrink-0 border`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label={t('main.stopGenerating')}
            >
              <div className="shimmer-effect"></div>
              <X className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} relative z-10`} />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!input.trim()}
              className={`${isMobile ? 'h-[52px] w-[52px] rounded-xl' : 'h-[80px] w-[80px] rounded-2xl'} bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 active:from-primary/80 active:to-accent/80 text-white shadow-lg hover:shadow-xl active:shadow-md transition-all duration-200 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex-shrink-0`}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              aria-label={t('input.send')}
              aria-disabled={!input.trim()}
              aria-describedby={!input.trim() ? 'chat-composer-error' : undefined}
            >
              <div className="shimmer-effect"></div>
              <Send className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} relative z-10`} />
            </Button>
          )}
        </form>
      </div>
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent/50 to-transparent"></div>
    </div>
  );
}
