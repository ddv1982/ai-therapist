import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// AuthConfig
export const getAuthConfig = query({
  args: {},
  handler: async (ctx) => {
    const cfg = await ctx.db.query('authConfigs').first();
    return cfg ?? null;
  },
});

export const upsertAuthConfig = mutation({
  args: {
    secret: v.string(),
    backupCodes: v.string(),
    isSetup: v.boolean(),
  },
  handler: async (ctx, { secret, backupCodes, isSetup }) => {
    const existing = await ctx.db.query('authConfigs').first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { secret, backupCodes, isSetup, updatedAt: now });
      return await ctx.db.get(existing._id);
    }
    const id = await ctx.db.insert('authConfigs', {
      legacyId: undefined,
      secret,
      backupCodes,
      isSetup,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const resetAuthConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const cfg = await ctx.db.query('authConfigs').first();
    if (cfg) await ctx.db.delete(cfg._id);
    // Clear trusted devices and sessions as part of reset
    const devices = await ctx.db.query('trustedDevices').collect();
    for (const d of devices) await ctx.db.delete(d._id);
    const sessions = await ctx.db.query('authSessions').collect();
    for (const s of sessions) await ctx.db.delete(s._id);
    return { ok: true };
  },
});

// Trusted Devices
export const upsertTrustedDevice = mutation({
  args: {
    deviceId: v.string(),
    name: v.string(),
    fingerprint: v.string(),
    ipAddress: v.string(),
    userAgent: v.string(),
    lastSeen: v.number(),
  },
  handler: async (ctx, args) => {
    const existingByDevice = await ctx.db
      .query('trustedDevices')
      .withIndex('by_deviceId', q => q.eq('deviceId', args.deviceId))
      .unique();
    const existingByFingerprint = await ctx.db
      .query('trustedDevices')
      .withIndex('by_fingerprint', q => q.eq('fingerprint', args.fingerprint))
      .unique();
    const now = Date.now();
    if (existingByDevice) {
      await ctx.db.patch(existingByDevice._id, { ...args, createdAt: existingByDevice.createdAt, trustedAt: existingByDevice.trustedAt });
      return await ctx.db.get(existingByDevice._id);
    }
    if (existingByFingerprint) {
      await ctx.db.patch(existingByFingerprint._id, { ...args, createdAt: existingByFingerprint.createdAt, trustedAt: existingByFingerprint.trustedAt });
      return await ctx.db.get(existingByFingerprint._id);
    }
    const id = await ctx.db.insert('trustedDevices', {
      legacyId: undefined,
      ...args,
      trustedAt: now,
      createdAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const deleteTrustedDevice = mutation({
  args: { fingerprint: v.string() },
  handler: async (ctx, { fingerprint }) => {
    const device = await ctx.db
      .query('trustedDevices')
      .withIndex('by_fingerprint', q => q.eq('fingerprint', fingerprint))
      .unique();
    if (device) await ctx.db.delete(device._id);
    return { ok: true };
  },
});

export const listTrustedDevices = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('trustedDevices').collect();
  },
});

export const getTrustedDeviceByDeviceId = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    return await ctx.db
      .query('trustedDevices')
      .withIndex('by_deviceId', q => q.eq('deviceId', deviceId))
      .unique();
  },
});

export const getTrustedDevice = query({
  args: { id: v.id('trustedDevices') },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Auth Sessions
export const createAuthSession = mutation({
  args: {
    sessionToken: v.string(),
    deviceId: v.id('trustedDevices'),
    ipAddress: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, { sessionToken, deviceId, ipAddress, expiresAt }) => {
    const now = Date.now();
    const id = await ctx.db.insert('authSessions', {
      legacyId: undefined,
      sessionToken,
      deviceId,
      ipAddress,
      expiresAt,
      lastActivity: now,
      createdAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const touchAuthSession = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const s = await ctx.db
      .query('authSessions')
      .withIndex('by_sessionToken', q => q.eq('sessionToken', sessionToken))
      .unique();
    if (s) await ctx.db.patch(s._id, { lastActivity: Date.now() });
    return s ? await ctx.db.get(s._id) : null;
  },
});

export const deleteExpiredAuthSessions = mutation({
  args: { now: v.number() },
  handler: async (ctx, { now }) => {
    const sessions = await ctx.db
      .query('authSessions')
      .withIndex('by_expires', q => q.lte('expiresAt', now))
      .collect();
    for (const s of sessions) await ctx.db.delete(s._id);
    return { ok: true, count: sessions.length };
  },
});

export const getAuthSessionByToken = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const s = await ctx.db
      .query('authSessions')
      .withIndex('by_sessionToken', q => q.eq('sessionToken', sessionToken))
      .unique();
    return s ?? null;
  },
});

export const deleteAuthSessionByToken = mutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    const s = await ctx.db
      .query('authSessions')
      .withIndex('by_sessionToken', q => q.eq('sessionToken', sessionToken))
      .unique();
    if (s) await ctx.db.delete(s._id);
    return { ok: true };
  },
});
