import { z } from 'zod';
import { envDefaults } from '@/config/env.defaults';

const TRUE_VALUES = new Set(['true', '1', 'yes', 'on']);
const FALSE_VALUES = new Set(['false', '0', 'no', 'off']);

const nodeEnvSchema = z.enum(['development', 'production', 'test']);

const coerceBoolean = (defaultValue: boolean) =>
  z
    .union([z.string(), z.boolean(), z.number()])
    .optional()
    .transform((value, ctx) => {
      if (value === undefined || value === null || value === '') {
        return defaultValue;
      }
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value !== 0;
      const normalised = value.trim().toLowerCase();
      if (TRUE_VALUES.has(normalised)) return true;
      if (FALSE_VALUES.has(normalised)) return false;
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid boolean value: "${value}"`,
      });
      return z.NEVER;
    });

const coerceNumber = (defaultValue: number, options: { min?: number; max?: number } = {}) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((value, ctx) => {
      if (value === undefined || value === null || value === '') {
        return defaultValue;
      }
      const numeric = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(numeric)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Expected a numeric value but received "${value}"`,
        });
        return z.NEVER;
      }
      if (options.min !== undefined && numeric < options.min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Value must be >= ${options.min}`,
        });
        return z.NEVER;
      }
      if (options.max !== undefined && numeric > options.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Value must be <= ${options.max}`,
        });
        return z.NEVER;
      }
      return numeric;
    });

const optionalUrl = z
  .string()
  .url()
  .or(z.string().trim().length(0))
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  });

const serverEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema.default(envDefaults.NODE_ENV),
  PORT: coerceNumber(envDefaults.PORT, { min: 1 }),

  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: optionalUrl,
  ENCRYPTION_KEY: z
    .string()
    .min(32, 'ENCRYPTION_KEY must be at least 32 characters'),

  GROQ_API_KEY: z.string().min(1).optional(),
  CONVEX_URL: optionalUrl,

  OLLAMA_BASE_URL: z
    .string()
    .trim()
    .transform((value) => (value && value.length > 0 ? value : envDefaults.OLLAMA_BASE_URL)),
  OLLAMA_MODEL_ID: z
    .string()
    .trim()
    .default(envDefaults.OLLAMA_MODEL_ID),

  REDIS_URL: optionalUrl,
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: coerceNumber(envDefaults.REDIS_PORT, { min: 0 }),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: coerceNumber(envDefaults.REDIS_DB, { min: 0 }),

  RATE_LIMIT_BLOCK_MS: coerceNumber(envDefaults.RATE_LIMIT_BLOCK_MS, { min: 0 }),
  RATE_LIMIT_WINDOW_MS: coerceNumber(envDefaults.RATE_LIMIT_WINDOW_MS, { min: 0 }),
  RATE_LIMIT_MAX_REQS: coerceNumber(envDefaults.RATE_LIMIT_MAX_REQS, { min: 1 }),
  RATE_LIMIT_DISABLED: coerceBoolean(envDefaults.RATE_LIMIT_DISABLED),
  RATE_LIMIT_USE_REDIS: coerceBoolean(envDefaults.RATE_LIMIT_USE_REDIS),

  CHAT_WINDOW_MS: coerceNumber(envDefaults.CHAT_WINDOW_MS, { min: 0 }),
  CHAT_MAX_REQS: coerceNumber(envDefaults.CHAT_MAX_REQS, { min: 1 }),
  CHAT_MAX_CONCURRENCY: coerceNumber(envDefaults.CHAT_MAX_CONCURRENCY, { min: 1 }),
  CHAT_CLEANUP_INTERVAL_MS: coerceNumber(envDefaults.CHAT_CLEANUP_INTERVAL_MS, { min: 1_000 }),
  CHAT_RESPONSE_MAX_CHARS: coerceNumber(envDefaults.CHAT_RESPONSE_MAX_CHARS, { min: 1 }),
  CHAT_INPUT_MAX_BYTES: coerceNumber(envDefaults.CHAT_INPUT_MAX_BYTES, { min: 1 }),

  API_WINDOW_MS: coerceNumber(envDefaults.API_WINDOW_MS, { min: 0 }),
  API_MAX_REQS: coerceNumber(envDefaults.API_MAX_REQS, { min: 1 }),

  CACHE_ENABLED: coerceBoolean(envDefaults.CACHE_ENABLED),
  CACHE_DEFAULT_TTL: coerceNumber(envDefaults.CACHE_DEFAULT_TTL, { min: 0 }),
  CACHE_SESSION_TTL: coerceNumber(envDefaults.CACHE_SESSION_TTL, { min: 0 }),
  CACHE_MESSAGE_TTL: coerceNumber(envDefaults.CACHE_MESSAGE_TTL, { min: 0 }),
  MESSAGES_CACHE_ENABLED: coerceBoolean(envDefaults.MESSAGES_CACHE_ENABLED),

  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug'])
    .default(envDefaults.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug')
    .transform((value) => value as 'error' | 'warn' | 'info' | 'debug'),

  AI_TELEMETRY_ENABLED: coerceBoolean(envDefaults.AI_TELEMETRY_ENABLED),
  AI_TELEMETRY_RECORD_INPUTS: coerceBoolean(envDefaults.AI_TELEMETRY_RECORD_INPUTS),
  AI_TELEMETRY_RECORD_OUTPUTS: coerceBoolean(envDefaults.AI_TELEMETRY_RECORD_OUTPUTS),
  AI_TELEMETRY_FUNCTION_ID: z.string().optional(),
  AI_TELEMETRY_APPLICATION: z.string().optional(),

  ENABLE_METRICS_ENDPOINT: coerceBoolean(envDefaults.ENABLE_METRICS_ENDPOINT),
  BYPASS_AUTH: coerceBoolean(envDefaults.BYPASS_AUTH),

  NEXT_PUBLIC_CONVEX_URL: optionalUrl,
  NEXT_PUBLIC_MARKDOWN_ALLOW_HTTP: coerceBoolean(envDefaults.NEXT_PUBLIC_MARKDOWN_ALLOW_HTTP),
  NEXT_PUBLIC_MARKDOWN_ALLOW_MAILTO: coerceBoolean(envDefaults.NEXT_PUBLIC_MARKDOWN_ALLOW_MAILTO),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function buildRawServerEnv(): Record<keyof ServerEnv, unknown> {
  return {
    NODE_ENV: process.env.NODE_ENV ?? envDefaults.NODE_ENV,
    PORT: process.env.PORT,

    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,

    GROQ_API_KEY: process.env.GROQ_API_KEY,
    CONVEX_URL: process.env.CONVEX_URL,

    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL ?? envDefaults.OLLAMA_BASE_URL,
    OLLAMA_MODEL_ID: process.env.OLLAMA_MODEL_ID ?? envDefaults.OLLAMA_MODEL_ID,

    REDIS_URL: process.env.REDIS_URL,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_DB: process.env.REDIS_DB,

    RATE_LIMIT_BLOCK_MS: process.env.RATE_LIMIT_BLOCK_MS,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQS: process.env.RATE_LIMIT_MAX_REQS,
    RATE_LIMIT_DISABLED: process.env.RATE_LIMIT_DISABLED,
    RATE_LIMIT_USE_REDIS: process.env.RATE_LIMIT_USE_REDIS,

    CHAT_WINDOW_MS: process.env.CHAT_WINDOW_MS,
    CHAT_MAX_REQS: process.env.CHAT_MAX_REQS,
    CHAT_MAX_CONCURRENCY: process.env.CHAT_MAX_CONCURRENCY,
    CHAT_CLEANUP_INTERVAL_MS: process.env.CHAT_CLEANUP_INTERVAL_MS,
    CHAT_RESPONSE_MAX_CHARS: process.env.CHAT_RESPONSE_MAX_CHARS,
    CHAT_INPUT_MAX_BYTES: process.env.CHAT_INPUT_MAX_BYTES,

    API_WINDOW_MS: process.env.API_WINDOW_MS,
    API_MAX_REQS: process.env.API_MAX_REQS,

    CACHE_ENABLED: process.env.CACHE_ENABLED,
    CACHE_DEFAULT_TTL: process.env.CACHE_DEFAULT_TTL,
    CACHE_SESSION_TTL: process.env.CACHE_SESSION_TTL,
    CACHE_MESSAGE_TTL: process.env.CACHE_MESSAGE_TTL,
    MESSAGES_CACHE_ENABLED: process.env.MESSAGES_CACHE_ENABLED,

    LOG_LEVEL: process.env.LOG_LEVEL ?? envDefaults.LOG_LEVEL,

    AI_TELEMETRY_ENABLED: process.env.AI_TELEMETRY_ENABLED,
    AI_TELEMETRY_RECORD_INPUTS: process.env.AI_TELEMETRY_RECORD_INPUTS,
    AI_TELEMETRY_RECORD_OUTPUTS: process.env.AI_TELEMETRY_RECORD_OUTPUTS,
    AI_TELEMETRY_FUNCTION_ID: process.env.AI_TELEMETRY_FUNCTION_ID,
    AI_TELEMETRY_APPLICATION: process.env.AI_TELEMETRY_APPLICATION,

    ENABLE_METRICS_ENDPOINT: process.env.ENABLE_METRICS_ENDPOINT,
    BYPASS_AUTH: process.env.BYPASS_AUTH,

    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL ?? envDefaults.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_MARKDOWN_ALLOW_HTTP: process.env.NEXT_PUBLIC_MARKDOWN_ALLOW_HTTP,
    NEXT_PUBLIC_MARKDOWN_ALLOW_MAILTO: process.env.NEXT_PUBLIC_MARKDOWN_ALLOW_MAILTO,
  };
}

function parseServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(buildRawServerEnv());
  if (!result.success) {
    const errorLines = result.error.issues.map((issue) => {
      const path = issue.path.join('.') || '(root)';
      return `  - ${path}: ${issue.message}`;
    });
    const message = ['Environment validation failed:', ...errorLines].join('\n');
    throw new Error(message);
  }
  return result.data;
}

let cachedEnv: ServerEnv | null = null;

const isTestRuntime = () => process.env.NODE_ENV === 'test' || typeof process.env.JEST_WORKER_ID !== 'undefined';

function getCachedEnv(): ServerEnv {
  if (isTestRuntime()) {
    return parseServerEnv();
  }
  if (!cachedEnv) {
    cachedEnv = parseServerEnv();
  }
  return cachedEnv;
}

export function getServerEnv(): ServerEnv {
  return getCachedEnv();
}

const serverEnvProxy = new Proxy({} as ServerEnv, {
  get: (_target, property: string | symbol) => {
    const current = getCachedEnv();
    return (current as Record<string | symbol, unknown>)[property];
  },
  ownKeys: () => Reflect.ownKeys(getCachedEnv()),
  getOwnPropertyDescriptor: (_target, property: string | symbol) => {
    const current = getCachedEnv();
    const descriptor = Object.getOwnPropertyDescriptor(current, property);
    if (!descriptor) return undefined;
    return { ...descriptor, configurable: true };
  },
}) as ServerEnv;

export const env = serverEnvProxy;

export function reloadServerEnvForTesting(): void {
  if (!isTestRuntime()) {
    throw new Error('reloadServerEnvForTesting is only supported in test environment');
  }
  cachedEnv = null;
}
