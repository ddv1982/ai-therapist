'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LanguageToggle } from '@/components/ui/language-switcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { therapeuticInteractive } from '@/lib/ui/design-tokens';
import type { ChatSessionSummary } from '@/hooks/use-chat-controller';
import {
  Plus,
  MessageSquare,
  Trash2,
  X,
  Sparkles,
  Brain,
  Globe,
} from 'lucide-react';

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
    webSearchEnabled,
    smartModelActive,
    translate,
  } = props;

  const sidebarClasses = useMemo(() => (
    `${open ? 'w-80 sm:w-88 md:w-88' : 'w-0'} ${open ? 'fixed md:relative' : ''} ${open ? 'inset-y-0 left-0 z-50 md:z-auto' : ''} transition-all duration-500 ease-in-out overflow-hidden bg-card/80 dark:bg-card/80 backdrop-blur-md border-r border-border/50 flex flex-col shadow-xl animate-slide-in`
  ), [open]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
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
        <div className="p-6 border-b border-border/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold gradient-text">{translate('sidebar.brandName')}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close sidebar"
                className={therapeuticInteractive.iconButtonSmall}
              >
                <X className="w-4 h-4 relative z-10" />
              </Button>
            </div>
          </div>
          <Button
            onClick={() => { void onStartNewSession(); }}
            className="w-full justify-start gap-3 h-12 rounded-xl transition-all duration-200 group"
          >
            <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <span className="font-semibold">{translate('sidebar.startNew')}</span>
            <Sparkles className="w-4 h-4 ml-auto opacity-60 group-hover:opacity-100 transition-opacity" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{translate('sidebar.noSessions')}</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = currentSessionId === session.id;
              const startedAt = session.startedAt ? new Date(session.startedAt) : null;
              return (
                <Card
                  key={session.id}
                  className={`p-4 mb-3 group transition-all duration-300 hover:shadow-lg cursor-pointer ${
                    isActive
                      ? 'ring-2 ring-primary/50 bg-primary/5 dark:bg-primary/5 border-primary/30 shadow-md'
                      : 'hover:border-primary/20 bg-white/50 dark:bg-card/50 hover:bg-white/80 dark:hover:bg-card/70'
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
                      className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold line-clamp-2 mb-1">
                        {session.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {startedAt ? startedAt.toLocaleString() : ''}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                      onClick={(event) => {
                        event.stopPropagation();
                        void onDeleteSession(session.id);
                      }}
                      aria-label="Delete session"
                    >
                      <Trash2 className="w-4 h-4 relative z-10" />
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-border/50 bg-muted/30">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onToggleSmartModel}
              className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${
                smartModelActive
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
              }`}
              aria-pressed={smartModelActive}
              aria-label={smartModelActive ? translate('sidebar.smartEnabled') : translate('sidebar.smartDisabled')}
              title={smartModelActive ? translate('sidebar.smartEnabled') : translate('sidebar.smartDisabled')}
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleWebSearch}
              className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                webSearchEnabled
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
              }`}
              aria-pressed={webSearchEnabled}
              aria-label={webSearchEnabled ? translate('sidebar.webSearchEnabled') : translate('sidebar.webSearchDisabled')}
              title={webSearchEnabled ? translate('sidebar.webSearchEnabled') : translate('sidebar.webSearchDisabled')}
            >
              <Globe className="w-4 h-4" />
            </button>
            <LanguageToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
