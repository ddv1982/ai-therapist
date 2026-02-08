import { NextRequest } from 'next/server';
import {
  withAuthAndRateLimitStreaming,
  type AuthenticatedRequestContext,
} from '@/lib/api/api-middleware';
import { handleChatPost } from '@/server/application/chat/handle-chat-post';

export const maxDuration = 30;

export const POST = withAuthAndRateLimitStreaming(
  async (req: NextRequest, context: AuthenticatedRequestContext) => handleChatPost(req, context)
);
