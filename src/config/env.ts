import { z } from 'zod';
import { envDefaults } from '@/config/env.defaults';

// Custom boolean coercion for environment variables
// z.coerce.boolean() doesn't work correctly for string 'false' (it becomes true)
const coerceBoolean = (defaultValue: boolean) =>
  z
    .union([z.string(), z.boolean(), z.number()])
    .optional()
    .transform((value) => {
      if (value === undefined || value === null || value === '') {
        return defaultValue;
      }
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value !== 0;
      const normalised = value.trim().toLowerCase();
      if (normalised === 'true' || normalised === '1' || normalised === 'yes') return true;
      if (normalised === 'false' || normalised === '0' || normalised === 'no') return false;
      return defaultValue;
    });

/**
 * Get the appropriate default log level based on NODE_ENV.
 * Development defaults to 'debug' for verbose output.
 * Production/test defaults to 'info' for cleaner logs.
 */
function getDefaultLogLevel(): 'error' | 'warn' | 'info' | 'debug' {
  const nodeEnv = process.env.NODE_ENV ?? envDefaults.NODE_ENV;
  if (nodeEnv === 'development') {
    return 'debug';
  }
  return 'info';
}

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default(envDefaults.NODE_ENV),
  PORT: z.coerce.number().int().positive().default(envDefaults.PORT),

  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters'),

  GROQ_API_KEY: z.string().min(1).optional(),
  CONVEX_URL: z.string().url().optional().or(z.literal('')),

  OLLAMA_BASE_URL: z.string().default(envDefaults.OLLAMA_BASE_URL),
  OLLAMA_MODEL_ID: z.string().default(envDefaults.OLLAMA_MODEL_ID),

  RATE_LIMIT_BLOCK_MS: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(envDefaults.RATE_LIMIT_BLOCK_MS),
  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .nonnegative()
    .default(envDefaults.RATE_LIMIT_WINDOW_MS),
  RATE_LIMIT_MAX_REQS: z.coerce.number().int().positive().default(envDefaults.RATE_LIMIT_MAX_REQS),
  RATE_LIMIT_DISABLED: coerceBoolean(envDefaults.RATE_LIMIT_DISABLED),

  CHAT_WINDOW_MS: z.coerce.number().int().nonnegative().default(envDefaults.CHAT_WINDOW_MS),
  CHAT_MAX_REQS: z.coerce.number().int().positive().default(envDefaults.CHAT_MAX_REQS),
  CHAT_MAX_CONCURRENCY: z.coerce
    .number()
    .int()
    .positive()
    .default(envDefaults.CHAT_MAX_CONCURRENCY),
  CHAT_CLEANUP_INTERVAL_MS: z.coerce
    .number()
    .int()
    .min(1000)
    .default(envDefaults.CHAT_CLEANUP_INTERVAL_MS),
  CHAT_RESPONSE_MAX_CHARS: z.coerce
    .number()
    .int()
    .positive()
    .default(envDefaults.CHAT_RESPONSE_MAX_CHARS),
  CHAT_INPUT_MAX_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(envDefaults.CHAT_INPUT_MAX_BYTES),

  API_WINDOW_MS: z.coerce.number().int().nonnegative().default(envDefaults.API_WINDOW_MS),
  API_MAX_REQS: z.coerce.number().int().positive().default(envDefaults.API_MAX_REQS),

  CACHE_ENABLED: coerceBoolean(envDefaults.CACHE_ENABLED),
  CACHE_DEFAULT_TTL: z.coerce.number().int().nonnegative().default(envDefaults.CACHE_DEFAULT_TTL),
  CACHE_SESSION_TTL: z.coerce.number().int().nonnegative().default(envDefaults.CACHE_SESSION_TTL),
  CACHE_MESSAGE_TTL: z.coerce.number().int().nonnegative().default(envDefaults.CACHE_MESSAGE_TTL),
  MESSAGES_CACHE_ENABLED: coerceBoolean(envDefaults.MESSAGES_CACHE_ENABLED),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default(getDefaultLogLevel()),

  AI_TELEMETRY_ENABLED: coerceBoolean(envDefaults.AI_TELEMETRY_ENABLED),
  AI_TELEMETRY_RECORD_INPUTS: coerceBoolean(envDefaults.AI_TELEMETRY_RECORD_INPUTS),
  AI_TELEMETRY_RECORD_OUTPUTS: coerceBoolean(envDefaults.AI_TELEMETRY_RECORD_OUTPUTS),
  AI_TELEMETRY_FUNCTION_ID: z.string().optional(),
  AI_TELEMETRY_APPLICATION: z.string().optional(),

  ENABLE_METRICS_ENDPOINT: coerceBoolean(envDefaults.ENABLE_METRICS_ENDPOINT),

  NEXT_PUBLIC_CONVEX_URL: z.string().url().optional().or(z.literal('')),
  NEXT_PUBLIC_MARKDOWN_ALLOW_HTTP: coerceBoolean(envDefaults.NEXT_PUBLIC_MARKDOWN_ALLOW_HTTP),
  NEXT_PUBLIC_MARKDOWN_ALLOW_MAILTO: coerceBoolean(envDefaults.NEXT_PUBLIC_MARKDOWN_ALLOW_MAILTO),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function parseServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);
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

const isTestRuntime = () =>
  process.env.NODE_ENV === 'test' || typeof process.env.JEST_WORKER_ID !== 'undefined';

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

export const env = getCachedEnv();

export function reloadServerEnvForTesting(): void {
  if (!isTestRuntime()) {
    throw new Error('reloadServerEnvForTesting is only supported in test environment');
  }
  cachedEnv = null;
}
