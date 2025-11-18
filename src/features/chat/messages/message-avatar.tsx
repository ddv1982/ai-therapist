/**
 * Message Avatar Component - Clean, focused component for message avatars
 */

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
    <div className={cn(avatarClasses, 'hidden md:flex', className)}>
      {role === 'user' ? (
        <User className="h-4 w-4" />
      ) : (
        <Heart className="message-avatar-assistant h-4 w-4" />
      )}
    </div>
  );
}
