import { action, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import type { TableNames } from './_generated/dataModel';

interface UserRecord {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

interface SessionRecord {
  id: string;
  userId: string;
  title: string;
  messageCount?: number;
  startedAt: string;
  endedAt?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface MessageRecord {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  modelUsed?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  createdAt: string;
}

interface SessionReportRecord {
  id: string;
  sessionId: string;
  reportContent: string;
  keyPoints?: string[];
  therapeuticInsights?: Record<string, unknown>;
  patternsIdentified?: string[];
  actionItems?: string[];
  moodAssessment?: string;
  progressNotes?: string;
  cognitiveDistortions?: Record<string, unknown>;
  schemaAnalysis?: Record<string, unknown>;
  therapeuticFrameworks?: Record<string, unknown>;
  recommendations?: string[];
  analysisConfidence?: number;
  analysisVersion?: number;
  createdAt: string;
}

interface AuthConfigRecord {
  id: string;
  secret: string;
  backupCodes: string[];
  isSetup: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TrustedDeviceRecord {
  id: string;
  deviceId: string;
  name: string;
  fingerprint: string;
  ipAddress: string;
  userAgent: string;
  lastSeen: string;
  trustedAt: string;
  createdAt: string;
}

interface AuthSessionRecord {
  id: string;
  sessionToken: string;
  deviceId: string;
  ipAddress: string;
  expiresAt: string;
  lastActivity: string;
  createdAt: string;
}

type ExportShape = {
  users: UserRecord[];
  sessions: SessionRecord[];
  messages: MessageRecord[];
  sessionReports: SessionReportRecord[];
  authConfigs: AuthConfigRecord[];
  trustedDevices: TrustedDeviceRecord[];
  authSessions: AuthSessionRecord[];
};

export const importAll = action({
  args: { data: v.any() },
  handler: async (ctx, { data }) => {
    const payload = data as ExportShape;
    const idMap = { users: new Map<string, string>(), sessions: new Map<string, string>(), messages: new Map<string, string>(), devices: new Map<string, string>(), sessionsByUuid: new Map<string, string>() };

    // Users
    for (const u of payload.users || []) {
      const now = Date.now();
      const id = await ctx.runMutation(internal.import.internalInsert, {
        table: 'users',
        doc: {
          legacyId: u.id,
          email: u.email,
          name: u.name ?? undefined,
          createdAt: new Date(u.createdAt).getTime() || now,
          updatedAt: new Date(u.updatedAt).getTime() || now,
        },
      });
      idMap.users.set(u.id, id);
    }

    // Sessions
    for (const s of payload.sessions || []) {
      const userId = idMap.users.get(s.userId);
      if (!userId) continue;
      const id = await ctx.runMutation(internal.import.internalInsert, {
        table: 'sessions',
        doc: {
          legacyId: s.id,
          userId,
          title: s.title,
          messageCount: s.messageCount ?? 0,
          startedAt: new Date(s.startedAt).getTime(),
          endedAt: s.endedAt != null ? new Date(s.endedAt).getTime() : null,
          status: s.status,
          createdAt: new Date(s.createdAt).getTime(),
          updatedAt: new Date(s.updatedAt).getTime(),
        },
      });
      idMap.sessions.set(s.id, id);
    }

    // Messages
    for (const m of payload.messages || []) {
      const sessionId = idMap.sessions.get(m.sessionId);
      if (!sessionId) continue;
      const id = await ctx.runMutation(internal.import.internalInsert, {
        table: 'messages',
        doc: {
          legacyId: m.id,
          sessionId,
          role: m.role,
          content: m.content,
          modelUsed: m.modelUsed ?? undefined,
          metadata: m.metadata ?? undefined,
          timestamp: new Date(m.timestamp).getTime(),
          createdAt: new Date(m.createdAt).getTime(),
        },
      });
      idMap.messages.set(m.id, id);
    }

    // Session Reports
    for (const r of payload.sessionReports || []) {
      const sessionId = idMap.sessions.get(r.sessionId);
      if (!sessionId) continue;
      await ctx.runMutation(internal.import.internalInsert, {
        table: 'sessionReports',
        doc: {
          legacyId: r.id,
          sessionId,
          reportContent: r.reportContent,
          keyPoints: r.keyPoints ?? [],
          therapeuticInsights: r.therapeuticInsights ?? {},
          patternsIdentified: r.patternsIdentified ?? [],
          actionItems: r.actionItems ?? [],
          moodAssessment: r.moodAssessment ?? undefined,
          progressNotes: r.progressNotes ?? undefined,
          cognitiveDistortions: r.cognitiveDistortions ?? undefined,
          schemaAnalysis: r.schemaAnalysis ?? undefined,
          therapeuticFrameworks: r.therapeuticFrameworks ?? undefined,
          recommendations: r.recommendations ?? undefined,
          analysisConfidence: r.analysisConfidence ?? undefined,
          analysisVersion: r.analysisVersion ?? undefined,
          createdAt: new Date(r.createdAt).getTime(),
        },
      });
    }

    // Auth Configs (single)
    if (payload.authConfigs && payload.authConfigs[0]) {
      const c = payload.authConfigs[0];
      await ctx.runMutation(internal.import.internalInsert, {
        table: 'authConfigs',
        doc: {
          legacyId: c.id,
          secret: c.secret,
          backupCodes: c.backupCodes,
          isSetup: c.isSetup,
          createdAt: new Date(c.createdAt).getTime(),
          updatedAt: new Date(c.updatedAt).getTime(),
        },
      });
    }

    // Trusted Devices
    for (const d of payload.trustedDevices || []) {
      const id = await ctx.runMutation(internal.import.internalInsert, {
        table: 'trustedDevices',
        doc: {
          legacyId: d.id,
          deviceId: d.deviceId,
          name: d.name,
          fingerprint: d.fingerprint,
          ipAddress: d.ipAddress,
          userAgent: d.userAgent,
          lastSeen: new Date(d.lastSeen).getTime(),
          trustedAt: new Date(d.trustedAt).getTime(),
          createdAt: new Date(d.createdAt).getTime(),
        },
      });
      idMap.devices.set(d.id, id);
    }

    // Auth Sessions
    for (const s of payload.authSessions || []) {
      const deviceId = idMap.devices.get(s.deviceId);
      if (!deviceId) continue;
      await ctx.runMutation(internal.import.internalInsert, {
        table: 'authSessions',
        doc: {
          legacyId: s.id,
          sessionToken: s.sessionToken,
          deviceId,
          ipAddress: s.ipAddress,
          expiresAt: new Date(s.expiresAt).getTime(),
          lastActivity: new Date(s.lastActivity).getTime(),
          createdAt: new Date(s.createdAt).getTime(),
        },
      });
    }

    return { ok: true };
  },
});

const allowedTables = [
  'users',
  'sessions',
  'messages',
  'sessionReports',
] as const satisfies readonly TableNames[];

type AllowedTable = (typeof allowedTables)[number];

function assertAllowedTable(table: string): AllowedTable {
  if ((allowedTables as readonly string[]).includes(table)) {
    return table as AllowedTable;
  }
  throw new Error(`Unsupported table for import: ${table}`);
}

export const internalInsert = internalMutation({
  args: {
    table: v.union(
      v.literal('users'),
      v.literal('sessions'),
      v.literal('messages'),
      v.literal('sessionReports'),
      v.literal('authConfigs'),
      v.literal('trustedDevices'),
      v.literal('authSessions'),
    ),
    doc: v.any(),
  },
  handler: async (ctx, { table, doc }) => {
    const allowedTable = assertAllowedTable(table);
    // Convex type inference doesn't understand the dynamic table mapping yet,
    // so we rely on runtime validation above and cast for insertion.
    return ctx.db.insert(allowedTable as TableNames, doc as never);
  },
});
