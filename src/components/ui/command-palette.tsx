'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useSession } from '@/contexts/session-context';
import { useChatSettings } from '@/contexts/chat-settings-context';
import { useSessionsQuery, SessionData } from '@/lib/queries/sessions';
import { MessageSquare, Brain, Plus, Settings, Moon, Search, Clock, Loader2 } from 'lucide-react';
// import { v4 as uuidv4 } from 'uuid'; // Unused
import { useTranslations } from 'next-intl';
import { useSelectSession } from '@/hooks';

interface CommandPaletteProps {
  onCBTOpen?: () => void;
  onSettingsOpen?: () => void;
  onThemeToggle?: () => void;
}

export function CommandPalette({ onCBTOpen, onSettingsOpen, onThemeToggle }: CommandPaletteProps) {
  const t = useTranslations('ui');
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { currentSessionId, setCurrentSession, selectionStatus } = useSession();
  const { clearMessages } = useChatSettings();

  const { data: sessions = [] } = useSessionsQuery();
  const { selectSession } = useSelectSession();

  // Keyboard shortcut to open command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  const createNewSession = () => {
    selectSession(null).catch(() => {
      setCurrentSession(null);
    });
    clearMessages();
  };

  const switchToSession = async (sessionId: string) => {
    await selectSession(sessionId);
  };

  const openCBTDiary = () => {
    // CBT diary now manages its own state
    onCBTOpen?.();
  };

  return (
    <>
      {/* Global keyboard shortcut trigger */}
      <div className="fixed right-4 bottom-4 z-50 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full shadow-lg"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl overflow-hidden p-0 shadow-2xl">
          <Command className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-semibold">
            <CommandInput placeholder={t('command.placeholder')} className="h-12" />
            <CommandList className="max-h-[400px] overflow-y-auto">
              <CommandEmpty>{t('command.noResults')}</CommandEmpty>

              {/* Quick Actions */}
              <CommandGroup heading={t('command.quick')}>
                <CommandItem onSelect={() => handleSelect(createNewSession)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('command.newChat')}
                </CommandItem>
                <CommandItem onSelect={() => handleSelect(openCBTDiary)}>
                  <Brain className="mr-2 h-4 w-4" />
                  {t('command.cbt')}
                </CommandItem>
                <CommandItem onSelect={() => handleSelect(() => onSettingsOpen?.())}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t('command.settings')}
                </CommandItem>
                <CommandItem onSelect={() => handleSelect(() => onThemeToggle?.())}>
                  <Moon className="mr-2 h-4 w-4" />
                  {t('command.theme')}
                </CommandItem>
              </CommandGroup>

              {/* Recent Sessions */}
              {sessions.length > 0 && (
                <CommandGroup heading={t('command.recent')}>
                  {sessions.slice(0, 6).map((session: SessionData) => {
                    const isActive = currentSessionId === session.id;
                    const isSwitching =
                      selectionStatus.sessionId === session.id &&
                      selectionStatus.phase !== 'idle' &&
                      selectionStatus.phase !== 'complete';
                    return (
                      <CommandItem
                        key={session.id}
                        onSelect={() => handleSelect(() => switchToSession(session.id))}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate">{session.title}</div>
                          <div className="text-muted-foreground text-sm">
                            {(session as unknown as { _count?: { messages?: number } })._count
                              ?.messages ??
                              (session as unknown as { messageCount?: number }).messageCount ??
                              0}{' '}
                            {t('command.messages')}
                          </div>
                          {isSwitching && (
                            <div className="text-primary flex items-center gap-1 text-xs">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              {selectionStatus.message ?? 'Switching…'}
                            </div>
                          )}
                        </div>
                        {isActive && !isSwitching && (
                          <div className="bg-primary ml-auto h-2 w-2 rounded-full" />
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {/* Navigation */}
              <CommandGroup heading={t('command.nav')}>
                <CommandItem onSelect={() => handleSelect(() => router.push('/'))}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {t('command.gotoChat')}
                </CommandItem>
                <CommandItem onSelect={() => handleSelect(() => router.push('/reports'))}>
                  <Clock className="mr-2 h-4 w-4" />
                  {t('command.reports')}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Hook for easy integration
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
