'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Session {
  id: string;
  title: string;
  lastMessage?: string;
  startedAt: Date;
  _count?: {
    messages: number;
  };
}

interface SessionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  currentSession: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  isMobile?: boolean;
}

export function SessionSidebar({
  isOpen,
  onClose,
  sessions,
  currentSession,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  isMobile = false
}: SessionSidebarProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen && isMobile) return null;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "bg-card border-r border-border flex flex-col transition-all duration-300 z-50",
        isMobile
          ? cn(
              "fixed top-0 left-0 h-full w-80 shadow-lg",
              isOpen ? "translate-x-0" : "-translate-x-full"
            )
          : cn(
              "relative w-80",
              isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0"
            )
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Sessions</h2>
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
          
          <Button 
            onClick={onNewSession}
            className="w-full mt-3 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No sessions yet</p>
              <p className="text-xs">Start a conversation to begin</p>
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onSessionSelect(session.id)}
                  className={cn(
                    "group flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-muted/50",
                    currentSession === session.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/30"
                  )}
                >
                  <MessageSquare className={cn(
                    "w-4 h-4 mt-1 shrink-0",
                    currentSession === session.id
                      ? "text-primary"
                      : "text-muted-foreground"
                  )} />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-medium text-sm truncate",
                      currentSession === session.id
                        ? "text-primary"
                        : "text-foreground"
                    )}>
                      {session.title}
                    </h3>
                    
                    {session.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {session.lastMessage}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(session.startedAt)}
                      </span>
                      
                      {session._count?.messages && (
                        <span className="text-xs text-muted-foreground">
                          {session._count.messages} messages
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}