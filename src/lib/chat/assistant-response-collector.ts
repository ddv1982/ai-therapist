import { prisma } from '@/lib/database/db';
import { encryptMessage } from '@/lib/chat/message-encryption';
import { logger } from '@/lib/utils/logger';

type SessionOwnership = {
  valid: boolean;
  session?: { messages?: Array<{ id: string }> };
};

export class AssistantResponseCollector {
  private buffer = '';
  private truncated = false;

  constructor(
    private readonly sessionId: string | undefined,
    private readonly ownership: SessionOwnership,
    private readonly modelId: string,
    private readonly requestId: string,
    private readonly maxChars: number,
    private readonly appendWithLimit: (current: string, addition: string, maxChars: number) => { value: string; truncated: boolean }
  ) {}

  append(chunk: string): boolean {
    if (!chunk || this.truncated) return this.truncated;
    const appended = this.appendWithLimit(this.buffer, chunk, this.maxChars);
    this.buffer = appended.value;
    this.truncated = this.truncated || appended.truncated;
    return this.truncated;
  }

  async persist(): Promise<void> {
    if (!this.sessionId || !this.ownership.valid) return;
    const trimmed = this.buffer.trim();
    if (!trimmed) return;

    const encrypted = encryptMessage({ role: 'assistant', content: trimmed, timestamp: new Date() });
    try {
      await prisma.message.create({
        data: {
          sessionId: this.sessionId,
          role: encrypted.role,
          content: encrypted.content,
          timestamp: encrypted.timestamp,
          modelUsed: this.modelId,
        },
      });
      try {
        const { MessageCache } = await import('@/lib/cache');
        await MessageCache.invalidate(this.sessionId);
      } catch {}
      logger.info('Assistant message persisted after stream', {
        apiEndpoint: '/api/chat',
        requestId: this.requestId,
        sessionId: this.sessionId,
        truncated: this.truncated,
      });
    } catch (error) {
      logger.error(
        'Failed to persist assistant message after stream',
        { apiEndpoint: '/api/chat', requestId: this.requestId, sessionId: this.sessionId },
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  wasTruncated(): boolean {
    return this.truncated;
  }
}
