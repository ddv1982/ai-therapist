'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LanguageToggle } from '@/components/ui/language-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';

import type { ChatSessionSummary } from '@/hooks/use-chat-controller';
import { Plus, MessageSquare, Trash2, Sparkles, Brain, Globe, EyeOff } from 'lucide-react';

interface ChatSidebarProps {
  open: boolean;
  sessions: ChatSessionSummary[];
  currentSessionId: string | null;
  isMobile: boolean;
  onClose: () => void;
  onStartNewSession: () => Promise<void> | void;
  onSelectSession: (sessionId: string) => Promise<void> | void;
  onDeleteSession: (sessionId: string) => Promise<void> | void;
  onToggleSmartModel: () => void;
  onToggleWebSearch: () => void;
  webSearchEnabled: boolean;
  smartModelActive: boolean;
  onToggleLocalModel: () => void;
  localModelActive: boolean;
  translate: (key: string) => string;
}

export function ChatSidebar(props: ChatSidebarProps) {
  const {
    open,
    sessions,
    currentSessionId,
    isMobile,
    onClose,
    onStartNewSession,
    onSelectSession,
    onDeleteSession,
    onToggleSmartModel,
    onToggleWebSearch,
    onToggleLocalModel,
    webSearchEnabled,
    smartModelActive,
    localModelActive,
    translate,
  } = props;

  const sidebarClasses = useMemo(
    () =>
      `${open ? 'w-80 sm:w-88 md:w-88' : 'w-0'} ${open ? 'fixed md:relative' : ''} ${open ? 'inset-y-0 left-0 z-50 md:z-auto' : ''} transition-all duration-500 ease-in-out overflow-hidden bg-card/80 dark:bg-card/80 backdrop-blur-md border-r border-border/50 flex flex-col shadow-xl animate-slide-in`,
    [open]
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="chat-sidebar"
        className={sidebarClasses}
        role="navigation"
        aria-label={translate('sidebar.aria')}
        aria-hidden={!open}
        style={{
          background: 'var(--sidebar-background)',
          backgroundImage: `
            linear-gradient(180deg, transparent 0%, hsl(var(--accent) / 0.03) 100%),
            radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.05) 0%, transparent 50%)
          `,
        }}
      >
        <div className="border-border/30 border-b p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-xl shadow-lg">
                <Brain className="text-primary-foreground h-6 w-6" />
              </div>
              <div>
                <h2 className="gradient-text text-xl font-semibold">
                  {translate('sidebar.brandName')}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
          <Button
            onClick={() => {
              void onStartNewSession();
            }}
            className="group h-12 w-full justify-start gap-3 rounded-xl transition-all duration-200"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-colors group-hover:bg-white/30">
              <Plus className="h-4 w-4" />
            </div>
            <span className="font-semibold">{translate('sidebar.startNew')}</span>
            <Sparkles className="ml-auto h-4 w-4 opacity-60 transition-opacity group-hover:opacity-100" />
          </Button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
          {sessions.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="text-muted-foreground/50 mx-auto mb-3 h-12 w-12" />
              <p className="text-muted-foreground text-sm">{translate('sidebar.noSessions')}</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = currentSessionId === session.id;
              const startedAt = session.startedAt ? new Date(session.startedAt) : null;
              return (
                <Card
                  key={session.id}
                  className={`group mb-3 cursor-pointer p-4 transition-all duration-300 hover:shadow-lg ${
                    isActive
                      ? 'ring-primary/50 bg-primary/5 dark:bg-primary/5 border-primary/30 shadow-md ring-2'
                      : 'hover:border-primary/20 dark:bg-card/50 dark:hover:bg-card/70 bg-white/50 hover:bg-white/80'
                  }`}
                >
                  <div
                    className="flex items-start gap-3"
                    onClick={() => {
                      void onSelectSession(session.id);
                      if (isMobile) {
                        onClose();
                      }
                    }}
                  >
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 line-clamp-2 text-base font-semibold">{session.title}</h3>
                      <p className="text-muted-foreground text-sm">
                        {startedAt ? startedAt.toLocaleString() : ''}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 rounded-lg p-1 opacity-0 transition-all duration-200 group-hover:opacity-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        void onDeleteSession(session.id);
                      }}
                      aria-label="Delete session"
                    >
                      <Trash2 className="relative z-10 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <div className="border-border/50 bg-muted/30 border-t p-4">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onToggleSmartModel}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:outline-none ${
                smartModelActive
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
              }`}
              aria-pressed={smartModelActive}
              aria-label={
                smartModelActive
                  ? translate('sidebar.smartEnabled')
                  : translate('sidebar.smartDisabled')
              }
              title={
                smartModelActive
                  ? translate('sidebar.smartEnabled')
                  : translate('sidebar.smartDisabled')
              }
            >
              <Sparkles className="h-4 w-4" />
            </button>
            <button
              onClick={onToggleWebSearch}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${
                webSearchEnabled
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
              }`}
              aria-pressed={webSearchEnabled}
              aria-label={
                webSearchEnabled
                  ? translate('sidebar.webSearchEnabled')
                  : translate('sidebar.webSearchDisabled')
              }
              title={
                webSearchEnabled
                  ? translate('sidebar.webSearchEnabled')
                  : translate('sidebar.webSearchDisabled')
              }
            >
              <Globe className="h-4 w-4" />
            </button>
            <div className="group relative">
              <button
                onClick={onToggleLocalModel}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:outline-none ${
                  localModelActive
                    ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.65)]'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                }`}
                aria-pressed={localModelActive}
                aria-label={
                  localModelActive
                    ? translate('sidebar.localModelEnabled')
                    : translate('sidebar.localModelDisabled')
                }
                title={
                  localModelActive
                    ? translate('sidebar.localModelTooltipActive')
                    : translate('sidebar.localModelTooltipInactive')
                }
              >
                <EyeOff className="h-4 w-4" />
              </button>
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform rounded bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
                {localModelActive
                  ? translate('sidebar.localModelTooltipActive')
                  : translate('sidebar.localModelTooltipInactive')}
              </div>
            </div>
            <LanguageToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
