'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { FileText, Menu, X, Brain, List } from 'lucide-react';
import { getIconButtonSize } from '@/lib/ui/design-tokens';
import { useTranslations } from 'next-intl';

interface ChatHeaderProps {
  showSidebar: boolean;
  onToggleSidebar: () => void;
  hasActiveSession: boolean;
  hasMessages: boolean;
  isGeneratingReport: boolean;
  isLoading: boolean;
  isMobile: boolean;
  onGenerateReport: () => void;
  onStopGenerating: () => void;
  onOpenCBTDiary: () => void;
  onCreateObsessionsTable: () => void;
  modelLabel: string;
}

export function ChatHeader({
  showSidebar,
  onToggleSidebar,
  hasActiveSession,
  hasMessages,
  isGeneratingReport,
  isLoading,
  isMobile,
  onGenerateReport,
  onStopGenerating,
  onOpenCBTDiary,
  onCreateObsessionsTable,
  modelLabel,
}: ChatHeaderProps) {
  const t = useTranslations('chat');
  const UserMenu = React.useMemo(
    () => dynamic(() => import('./user-menu'), {
      ssr: false,
      loading: () => <a href="/profile" className="text-sm underline">Profile</a>,
    }),
    []
  );

  return (
    <div className={`${isMobile ? 'p-3' : 'p-6'} border-b border-border/30 bg-card/50 backdrop-blur-md relative flex-shrink-0`}>
      <div className="flex items-center justify-between">
        <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'}`}>
          <Button
            variant="ghost"
            size="sm"
            onTouchStart={onToggleSidebar}
            onClick={onToggleSidebar}
            className={getIconButtonSize('large')}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            aria-label={t('main.toggleSidebar')}
            aria-expanded={showSidebar}
            aria-controls="chat-sidebar"
          >
            <Menu className="w-4 h-4 relative z-10" />
          </Button> 
          <div
            className="hidden sm:flex items-center gap-2 ml-2"
            aria-label={t('main.modelChipAria', { model: modelLabel })}
          >
            <span className="text-xs uppercase tracking-wide text-muted-foreground">{t('main.modelChipLabel')}</span>
            <span className="px-2 py-1 rounded-full bg-muted/80 dark:bg-muted/40 text-sm font-medium text-foreground">
              {modelLabel}
            </span>
          </div>
        </div>
        <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
          {hasActiveSession && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onGenerateReport}
              // Avoid disabled to keep spinner fully opaque; block clicks via pointer-events
              className={`${getIconButtonSize('large')} ${isGeneratingReport ? 'pointer-events-none' : ''} text-foreground`}
              aria-disabled={isGeneratingReport}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              title={t('main.generateReport')}
            >
              {isGeneratingReport ? (
                <div className="w-4 h-4 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin relative z-10 opacity-100" />
              ) : (
                <FileText className="w-4 h-4 relative z-10 text-foreground" />
              )}
            </Button>
          )}
          {isLoading && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onStopGenerating}
              className={getIconButtonSize('large')}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              title={t('main.stopGenerating')}
            >
                <X className="w-4 h-4 relative z-10" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenCBTDiary}
            className={getIconButtonSize('large')}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            title={isMobile ? t('main.cbtMobile') : t('main.cbtOpen')}
          >
            <Brain className="w-4 h-4 relative z-10" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateObsessionsTable}
            className={getIconButtonSize('large')}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            title={t('main.obsessionsTooltip')}
          >
            <List className="w-4 h-4 relative z-10" />
          </Button>
          <div className="ml-1">
            <UserMenu />
          </div>
        </div>
      </div>
      {/* Accessible heading for screen readers and tests (next-intl mock returns key text) */}
      {!hasActiveSession && !hasMessages && (
        <h1 className="sr-only" aria-live="polite">{t('main.newConversation')}</h1>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
    </div>
  );
}