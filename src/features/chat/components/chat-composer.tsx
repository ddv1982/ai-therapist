'use client';

import {
  useCallback,
  memo,
  KeyboardEvent,
  FormEvent,
  RefObject,
  MutableRefObject,
  ChangeEvent,
} from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ChatComposerProps {
  input: string;
  isLoading: boolean;
  isMobile: boolean;
  onChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onStop: () => void;
  inputContainerRef?: RefObject<HTMLDivElement | null> | MutableRefObject<HTMLDivElement | null>;
  textareaRef?:
    | RefObject<HTMLTextAreaElement | null>
    | MutableRefObject<HTMLTextAreaElement | null>;
}

export const ChatComposer = memo(function ChatComposer({
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
      className={`${isMobile ? 'p-3 pt-2' : 'p-3 sm:p-6'} bg-card/50 relative flex-shrink-0 shadow-[0_-1px_0_rgba(255,255,255,0.06)] backdrop-blur-md`}
      role="form"
      aria-label="Chat composer"
    >
      <div className="mx-auto max-w-4xl">
        <form onSubmit={onSubmit} className="flex items-end gap-3" aria-label="Send a message">
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={useCallback(
                (e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value),
                [onChange]
              )}
              onKeyDown={onKeyDown}
              onFocus={useCallback(() => {
                if (isMobile) {
                  setTimeout(() => {
                    textareaRef?.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                  }, 100);
                }
              }, [isMobile, textareaRef])}
              placeholder={!isLoading && input.trim().length === 0 ? t('input.placeholder') : ''}
              className="bg-background/80 placeholder:text-muted-foreground/70 shadow-apple-xs focus:shadow-apple-md focus:shadow-primary/20 tap-transparent max-h-[120px] min-h-[52px] touch-manipulation resize-none rounded-xl px-3 py-3 text-base backdrop-blur-sm transition-all duration-300 focus:outline-none sm:max-h-[200px] sm:min-h-[80px] sm:rounded-2xl sm:px-6 sm:py-4"
              disabled={false}
              style={{
                fontSize: isMobile ? '16px' : undefined,
              }}
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
              className={`${isMobile ? 'h-[52px] w-[52px] rounded-xl' : 'h-[80px] w-[80px] rounded-2xl'} bg-muted text-foreground hover:bg-muted/90 active:bg-muted/80 group tap-transparent relative flex-shrink-0 touch-manipulation overflow-hidden border shadow-lg transition-all duration-200 hover:shadow-xl active:shadow-md`}
              aria-label={t('main.stopGenerating')}
              aria-busy={isLoading}
            >
              <Loader2
                className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} relative z-10 animate-spin`}
              />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!input.trim()}
              className={`${isMobile ? 'h-[52px] w-[52px] rounded-xl' : 'h-[80px] w-[80px] rounded-2xl'} group tap-transparent relative flex-shrink-0 touch-manipulation overflow-hidden text-white shadow-lg transition-all duration-200 hover:shadow-xl active:shadow-md disabled:cursor-not-allowed disabled:opacity-50`}
              aria-label={t('input.send')}
              aria-disabled={!input.trim()}
            >
              <Send className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} relative z-10`} />
            </Button>
          )}
        </form>
        {!input.trim() && (
          <p id="chat-composer-error" role="alert" className="sr-only">
            Message cannot be empty
          </p>
        )}
      </div>
      <div className="from-accent/50 absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r to-transparent"></div>
    </div>
  );
});
