'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LanguageToggle } from '@/components/ui/language-switcher';

import type { ChatSessionSummary } from '@/hooks/use-chat-controller';
import { Plus, MessageSquare, Trash2, Sparkles, Brain, Globe, EyeOff, Key } from 'lucide-react';

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
  onApiKeysOpen?: () => void;
  byokActive?: boolean;
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
    onApiKeysOpen,
    byokActive,
    translate,
  } = props;

  const sidebarClasses = useMemo(
    () =>
      `${open ? 'w-80 sm:w-88 md:w-88' : 'w-0'} ${open ? 'fixed md:relative' : ''} ${open ? 'inset-y-0 left-0 z-50 md:z-auto' : ''} h-screen transition-all duration-500 ease-in-out overflow-hidden bg-card/60 backdrop-blur-glass backdrop-saturate-glass shadow-apple-lg flex flex-col animate-slide-in`,
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
        className={`${sidebarClasses} bg-sidebar bg-sidebar-gradient`}
        role="navigation"
        aria-label={translate('sidebar.aria')}
        aria-hidden={!open}
      >
        <div className="p-6 shadow-[0_1px_0_rgba(255,255,255,0.06)]">
          <div className="mb-6 flex items-center">
            <div className="flex items-center gap-3">
              <Brain className="gradient-text h-6 w-6" />
              <div>
                <h2 className="gradient-text text-xl font-semibold tracking-tight">
                  {translate('sidebar.brandName')}
                </h2>
              </div>
            </div>
          </div>
          <Button
            onClick={() => {
              void onStartNewSession();
            }}
            variant="default"
            className="group h-12 w-full justify-start gap-3 rounded-xl"
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
                  variant="glass"
                  className={`group duration-base ease-out-smooth mb-3 cursor-pointer p-4 transition-all active:scale-[0.98] ${
                    isActive
                      ? 'shadow-apple-lg bg-primary/12'
                      : 'shadow-apple-sm hover:shadow-apple-md'
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
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 line-clamp-2 text-base font-semibold tracking-normal">
                        {session.title}
                      </h3>
                      <p className="text-muted-foreground text-sm tracking-wide">
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

        <div className="bg-muted/20 p-4">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onToggleSmartModel}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:outline-none ${
                smartModelActive
                  ? 'shadow-apple-md bg-violet-600 text-white'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted shadow-apple-xs backdrop-blur-sm'
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
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${
                webSearchEnabled
                  ? 'shadow-apple-md bg-blue-600 text-white'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted shadow-apple-xs backdrop-blur-sm'
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
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:outline-none ${
                  localModelActive
                    ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.65)]'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted shadow-apple-xs backdrop-blur-sm'
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
            {onApiKeysOpen && (
              <div className="group relative">
                <button
                  onClick={onApiKeysOpen}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none ${
                    byokActive
                      ? 'shadow-apple-md bg-amber-600 text-white'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted shadow-apple-xs backdrop-blur-sm'
                  }`}
                  aria-label={translate('sidebar.apiKeys')}
                  aria-pressed={byokActive}
                  title={byokActive ? translate('sidebar.byokActive') : translate('sidebar.apiKeys')}
                >
                  <Key className="h-4 w-4" />
                </button>
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform rounded bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {byokActive ? translate('sidebar.byokActive') : translate('sidebar.apiKeys')}
                </div>
              </div>
            )}
            <LanguageToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
