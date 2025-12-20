/**
 * Domain-specific message parsers for the chat system.
 * Separates domain logic (CBT, Obsessions) from generic chat infrastructure.
 */

import type { ObsessionsCompulsionsData } from '@/types';
import { parseObsessionsCompulsionsFromMarkdown } from '@/features/therapy/obsessions-compulsions/utils/format-obsessions-compulsions';
import { isObsessionsCompulsionsMessage } from '@/features/therapy/obsessions-compulsions/utils/obsessions-message-detector';

/**
 * Attempts to derive metadata from message content based on domain rules.
 * Currently supports: Obsessions & Compulsions tables
 */
export function deriveMessageMetadata(content: string): Record<string, unknown> | undefined {
  if (!content) return undefined;

  // Obsessions & Compulsions Logic
  if (isObsessionsCompulsionsMessage(content)) {
    const parsed: ObsessionsCompulsionsData | null =
      parseObsessionsCompulsionsFromMarkdown(content);
    const data: ObsessionsCompulsionsData = parsed ?? {
      obsessions: [],
      compulsions: [],
      lastModified: new Date().toISOString(),
    };

    return {
      type: 'obsessions-compulsions-table',
      step: 'obsessions-compulsions',
      data,
    };
  }

  return undefined;
}
