/**
 * Message Avatar Component - Clean, focused component for message avatars
 */

import React from 'react';
import { User, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildMessageClasses, type MessageRole } from '@/lib/ui/design-system/message';

interface MessageAvatarProps {
  role: MessageRole;
  className?: string;
}

export function MessageAvatar({ role, className }: MessageAvatarProps) {
  const avatarClasses = buildMessageClasses(role, 'avatar');
  
  return (
    <div className={cn(avatarClasses, "hidden md:flex", className)}>
      {role === 'user' ? (
        <User className="w-4 h-4" />
      ) : (
        <Heart className="w-4 h-4 message-avatar-assistant" />
      )}
    </div>
  );
}