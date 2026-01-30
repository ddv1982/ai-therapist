import type { QueryCtx, MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
export const MESSAGE_COUNT_SHARDS = 16;

function getShardIndex(): number {
  return Math.floor(Math.random() * MESSAGE_COUNT_SHARDS);
}

export async function incrementMessageCount(
  ctx: MutationCtx,
  args: { sessionId: Id<'sessions'>; userId: Id<'users'>; delta: number }
): Promise<void> {
  const { sessionId, userId, delta } = args;
  const shard = getShardIndex();

  const existing = await ctx.db
    .query('messageCountShards')
    .withIndex('by_session_shard', (q) => q.eq('sessionId', sessionId).eq('shard', shard))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      count: Math.max(0, (existing.count ?? 0) + delta),
      updatedAt: Date.now(),
    });
    return;
  }

  await ctx.db.insert('messageCountShards', {
    sessionId,
    userId,
    shard,
    count: Math.max(0, delta),
    updatedAt: Date.now(),
  });
}

export async function getMessageCountForSession(
  ctx: QueryCtx,
  sessionId: Id<'sessions'>
): Promise<number> {
  const shards = await ctx.db
    .query('messageCountShards')
    .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
    .collect();

  if (!shards.length) return 0;
  return shards.reduce((sum, shard) => sum + (shard.count ?? 0), 0);
}

export async function getMessageCountsByUser(
  ctx: QueryCtx,
  userId: Id<'users'>
): Promise<Map<string, number>> {
  const shards = await ctx.db
    .query('messageCountShards')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .collect();

  const counts = new Map<string, number>();
  for (const shard of shards) {
    const current = counts.get(shard.sessionId) ?? 0;
    counts.set(shard.sessionId, current + (shard.count ?? 0));
  }

  return counts;
}

export async function ensureMessageCountShardsInitialized(
  ctx: MutationCtx,
  sessionId: Id<'sessions'>,
  userId: Id<'users'>
): Promise<void> {
  const existing = await ctx.db
    .query('messageCountShards')
    .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
    .first();

  if (existing) return;

  const now = Date.now();
  for (let shard = 0; shard < MESSAGE_COUNT_SHARDS; shard += 1) {
    await ctx.db.insert('messageCountShards', {
      sessionId,
      userId,
      shard,
      count: 0,
      updatedAt: now,
    });
  }
}
