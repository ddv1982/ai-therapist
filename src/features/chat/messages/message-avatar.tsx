/**
 * Message Avatar Component - Clean, focused component for message avatars
 */

import { memo } from 'react';
import { User, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildMessageClasses, type MessageRole } from '@/lib/ui/design-system/message';

interface MessageAvatarProps {
  role: MessageRole;
  className?: string;
}

const MessageAvatarComponent = function MessageAvatar({ role, className }: MessageAvatarProps) {
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
};

// Memoized export - only re-render when role changes
export const MessageAvatar = memo(MessageAvatarComponent, (prevProps, nextProps) => {
  return prevProps.role === nextProps.role && prevProps.className === nextProps.className;
});
