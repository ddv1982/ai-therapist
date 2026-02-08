/**
 * Chat Header Component
 *
 * Renders the top navigation bar with model selector, action buttons, and user menu.
 * Now uses ChatContext for cleaner state access.
 *
 * @module ChatHeader
 */

'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Menu, X, Brain, List } from 'lucide-react';
import { getIconButtonSize } from '@/lib/ui/design-tokens';
import { useTranslations } from 'next-intl';
import { useChat } from '@/features/chat/context/chat-context';
import { UserButton } from '@clerk/nextjs';

/**
 * Main chat header component.
 * Displays navigation controls, AI model info, action buttons, and user menu.
 *
 * @component
 * @returns {JSX.Element} The chat header with all controls
 */
export function ChatHeader() {
  const { state, actions, controller, modelLabel } = useChat();
  const t = useTranslations('chat');

  const {
    showSidebar,
    isGeneratingReport,
    isSessionReadyForReport,
    isLoading,
    isMobile,
    currentSession,
    messages,
  } = state;
  const messageCount = messages.length;

  const hasActiveSession = Boolean(currentSession);
  const hasMessages = messageCount > 0;
  const canGenerateReport = isSessionReadyForReport && !isGeneratingReport;

  const containerClassName = `${isMobile ? 'p-3' : 'p-6'} bg-card/50 relative flex-shrink-0 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md`;
  const leftGroupClassName = `flex items-center ${isMobile ? 'gap-3' : 'gap-4'}`;
  const rightGroupClassName = `flex items-center ${isMobile ? 'gap-2' : 'gap-3'}`;
  const iconButtonClassName = `${getIconButtonSize('large')} tap-transparent`;
  const iconClassName = 'relative z-10 h-4 w-4';
  const reportButtonClassName = `${iconButtonClassName} text-foreground`;
  const reportIcon = isGeneratingReport ? (
    <div className="relative z-10 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent opacity-100" />
  ) : (
    <FileText className={`text-foreground ${iconClassName}`} />
  );

  const onToggleSidebar = useCallback(
    () => controller.setShowSidebar(!showSidebar),
    [controller, showSidebar]
  );

  return (
    <div className={containerClassName}>
      <div className="flex items-center justify-between">
        <div className={leftGroupClassName}>
          <Button
            variant="ghost"
            size="sm"
            onTouchStart={onToggleSidebar}
            onClick={onToggleSidebar}
            className={iconButtonClassName}
            aria-label={t('main.toggleSidebar')}
            aria-expanded={showSidebar}
            aria-controls="chat-sidebar"
          >
            <Menu className={iconClassName} />
          </Button>
          <ModelChip
            label={t('main.modelChipLabel')}
            model={modelLabel}
            ariaLabel={t('main.modelChipAria', { model: modelLabel })}
          />
        </div>
        <div className={rightGroupClassName}>
          {hasActiveSession && (
            <Button
              variant="ghost"
              size="sm"
              onClick={controller.generateReport}
              disabled={!canGenerateReport}
              className={reportButtonClassName}
              aria-disabled={!canGenerateReport}
              title={t('main.generateReport')}
            >
              {reportIcon}
            </Button>
          )}
          {isLoading && (
            <Button
              variant="secondary"
              size="sm"
              onClick={controller.stopGenerating}
              className={iconButtonClassName}
              title={t('main.stopGenerating')}
            >
              <X className={iconClassName} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={actions.openCBTDiary}
            className={iconButtonClassName}
            title={isMobile ? t('main.cbtMobile') : t('main.cbtOpen')}
          >
            <Brain className={iconClassName} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void actions.handleCreateObsessionsTable()}
            className={iconButtonClassName}
            title={t('main.obsessionsTooltip')}
          >
            <List className={iconClassName} />
          </Button>
          <div className="ml-1">
            <UserButton afterSignOutUrl="/sign-in" />
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

function ModelChip({
  label,
  model,
  ariaLabel,
}: {
  label: string;
  model: string;
  ariaLabel: string;
}) {
  return (
    <div className="ml-2 hidden items-center gap-2 sm:flex" aria-label={ariaLabel}>
      <span className="text-muted-foreground text-xs tracking-wide uppercase">{label}</span>
      <span className="bg-muted/40 text-foreground rounded-full px-2 py-1 text-sm font-medium">
        {model}
      </span>
    </div>
  );
}
