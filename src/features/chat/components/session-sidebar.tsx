'use client';

import { memo, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, MessageSquare, Trash2, Heart, Sparkles, Loader2 } from 'lucide-react';
import { SessionSidebarProps } from '@/types/ui';

// Using centralized props interface from types/component-props.ts
// SessionSidebarProps includes all necessary props

export const SessionSidebar = memo(function SessionSidebar({
  showSidebar,
  setShowSidebar,
  sessions,
  currentSession,
  setCurrentSession,
  loadMessages,
  deleteSession,
  startNewSession,
  isMobile,
  selectionStatus,
  children,
}: SessionSidebarProps) {
  const [isPending, startTransition] = useTransition();

  const handleSessionSelect = (sessionId: string) => {
    startTransition(() => {
      setCurrentSession(sessionId);
      loadMessages(sessionId);
      if (isMobile) {
        setShowSidebar(false);
      }
    });
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="chat-sidebar"
        className={`${showSidebar ? 'w-80 sm:w-88 md:w-88' : 'w-0'} ${showSidebar ? 'fixed md:relative' : ''} ${showSidebar ? 'inset-y-0 left-0 z-50 md:z-auto' : ''} bg-sidebar bg-sidebar-gradient bg-card/60 animate-slide-in shadow-apple-lg backdrop-blur-glass backdrop-saturate-glass flex flex-col overflow-hidden transition-all duration-500 ease-in-out`}
        role="navigation"
        aria-label="Chat sessions"
        aria-hidden={!showSidebar}
      >
        <div className="p-6 shadow-[0_1px_0_rgba(255,255,255,0.06)]">
          <div className="mb-6 flex items-center">
            <div className="flex items-center gap-3">
              <div className="from-primary to-accent flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br shadow-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <h2 className="gradient-text mb-4 text-3xl tracking-tight">Therapeutic AI</h2>
            </div>
          </div>
          <Button
            onClick={startNewSession}
            className="group h-12 w-full justify-start gap-3 rounded-xl transition-all"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-colors group-hover:bg-white/30">
              <Plus className="h-4 w-4" />
            </div>
            <span className="font-semibold">Start New Session</span>
            <Sparkles className="ml-auto h-4 w-4 opacity-60 transition-opacity group-hover:opacity-100" />
          </Button>
        </div>

        {/* Sessions */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
          {sessions.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="text-muted-foreground/50 mx-auto mb-3 h-12 w-12" />
              <p className="text-muted-foreground text-sm">No sessions yet</p>
              <p className="text-muted-foreground/70 text-sm">Start a conversation to begin</p>
            </div>
          ) : (
            sessions.map((session, index) => {
              const isSwitching =
                selectionStatus?.sessionId === session.id &&
                selectionStatus.phase !== 'idle' &&
                selectionStatus.phase !== 'complete';
              return (
                <Card
                  key={session.id}
                  className={`group animate-fade-in mb-3 cursor-pointer p-4 transition-all duration-300 ${
                    currentSession === session.id
                      ? 'shadow-apple-lg bg-primary/12'
                      : 'shadow-apple-sm hover:shadow-apple-md bg-card/50 hover:bg-card/70 hover:-translate-y-0.5'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    aria-current={currentSession === session.id ? 'true' : undefined}
                    aria-busy={isPending && currentSession === session.id}
                    className="focus-visible:ring-ring flex items-start gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    onClick={() => handleSessionSelect(session.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleSessionSelect(session.id);
                      }
                    }}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        currentSession === session.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 truncate text-base font-semibold tracking-normal">
                        {session.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <p className="text-muted-foreground truncate text-sm tracking-wide">
                          {session._count?.messages
                            ? `${session._count.messages} messages`
                            : 'No messages yet'}
                        </p>
                        <div className="bg-muted-foreground/30 h-1 w-1 rounded-full"></div>
                        <p className="text-muted-foreground text-sm tracking-wide">
                          {session.startedAt
                            ? new Date(session.startedAt).toLocaleDateString()
                            : 'Unknown date'}
                        </p>
                      </div>
                      {(isSwitching || (isPending && currentSession === session.id)) && (
                        <p className="text-primary flex items-center gap-2 pt-2 text-xs">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {selectionStatus?.message ?? 'Switching session…'}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-destructive/10 hover:text-destructive relative h-8 w-8 overflow-hidden rounded-lg p-1 opacity-0 transition-all duration-200 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                    >
                      <Trash2 className="relative z-10 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Settings Panel */}
        {children}
      </aside>
    </>
  );
});
