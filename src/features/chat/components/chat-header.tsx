/**
 * Chat Header Component
 *
 * Renders the top navigation bar with model selector, action buttons, and user menu.
 * Uses ChatHeaderContext to access state and avoid prop drilling.
 *
 * @module ChatHeader
 */

'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { FileText, Menu, X, Brain, List } from 'lucide-react';
import { getIconButtonSize } from '@/lib/ui/design-tokens';
import { useTranslations } from 'next-intl';
import { useChatHeader } from '@/features/chat/context/chat-header-context';

/**
 * Main chat header component.
 * Displays navigation controls, AI model info, action buttons, and user menu.
 * Now uses context for cleaner state access.
 *
 * @component
 * @returns {JSX.Element} The chat header with all controls
 *
 * @example
 * ```tsx
 * <ChatHeaderProvider value={headerState}>
 *   <ChatHeader />
 * </ChatHeaderProvider>
 * ```
 */
export function ChatHeader() {
  const {
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
  } = useChatHeader();
  const t = useTranslations('chat');
  const UserMenu = useMemo(
    () =>
      dynamic(() => import('./user-menu'), {
        ssr: false,
        loading: () => (
          <a href="/profile" className="text-sm underline">
            Profile
          </a>
        ),
      }),
    []
  );

  return (
    <div
      className={`${isMobile ? 'p-3' : 'p-6'} bg-card/50 relative flex-shrink-0 shadow-[0_1px_0_rgba(0,0,0,0.06)] dark:shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md`}
    >
      <div className="flex items-center justify-between">
        <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'}`}>
          <Button
            variant="ghost"
            size="sm"
            onTouchStart={onToggleSidebar}
            onClick={onToggleSidebar}
            className={`${getIconButtonSize('large')} tap-transparent`}
            aria-label={t('main.toggleSidebar')}
            aria-expanded={showSidebar}
            aria-controls="chat-sidebar"
          >
            <Menu className="relative z-10 h-4 w-4" />
          </Button>
          <div
            className="ml-2 hidden items-center gap-2 sm:flex"
            aria-label={t('main.modelChipAria', { model: modelLabel })}
          >
            <span className="text-muted-foreground text-xs tracking-wide uppercase">
              {t('main.modelChipLabel')}
            </span>
            <span className="bg-muted/80 dark:bg-muted/40 text-foreground rounded-full px-2 py-1 text-sm font-medium">
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
              className={`${getIconButtonSize('large')} ${isGeneratingReport ? 'pointer-events-none' : ''} text-foreground tap-transparent`}
              aria-disabled={isGeneratingReport}
              title={t('main.generateReport')}
            >
              {isGeneratingReport ? (
                <div className="relative z-10 h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent opacity-100 dark:border-white" />
              ) : (
                <FileText className="text-foreground relative z-10 h-4 w-4" />
              )}
            </Button>
          )}
          {isLoading && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onStopGenerating}
              className={`${getIconButtonSize('large')} tap-transparent`}
              title={t('main.stopGenerating')}
            >
              <X className="relative z-10 h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenCBTDiary}
            className={`${getIconButtonSize('large')} tap-transparent`}
            title={isMobile ? t('main.cbtMobile') : t('main.cbtOpen')}
          >
            <Brain className="relative z-10 h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateObsessionsTable}
            className={`${getIconButtonSize('large')} tap-transparent`}
            title={t('main.obsessionsTooltip')}
          >
            <List className="relative z-10 h-4 w-4" />
          </Button>
          <div className="ml-1">
            <UserMenu />
          </div>
        </div>
      </div>
      {/* Accessible heading for screen readers and tests (next-intl mock returns key text) */}
      {!hasActiveSession && !hasMessages && (
        <h1 className="sr-only" aria-live="polite">
          {t('main.newConversation')}
        </h1>
      )}
      <div className="via-primary/50 absolute right-0 bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent to-transparent"></div>
    </div>
  );
}
