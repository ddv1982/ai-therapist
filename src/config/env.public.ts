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

const publicEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema.default(envDefaults.NODE_ENV),
  NEXT_PUBLIC_CONVEX_URL: optionalUrl,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'Clerk publishable key is required')
    .optional(),
  NEXT_PUBLIC_MARKDOWN_ALLOW_HTTP: coerceBoolean(envDefaults.NEXT_PUBLIC_MARKDOWN_ALLOW_HTTP),
  NEXT_PUBLIC_MARKDOWN_ALLOW_MAILTO: coerceBoolean(envDefaults.NEXT_PUBLIC_MARKDOWN_ALLOW_MAILTO),
  NEXT_PUBLIC_ENABLE_RENDER_PROFILING: coerceBoolean(false),
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug'])
    .default(envDefaults.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug')
    .transform((value) => value as 'error' | 'warn' | 'info' | 'debug'),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

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

function parsePublicEnv(): PublicEnv {
  const rawPublicEnv: Record<keyof PublicEnv, unknown> = {
    NODE_ENV: process.env.NODE_ENV ?? envDefaults.NODE_ENV,
    NEXT_PUBLIC_CONVEX_URL:
      process.env.NEXT_PUBLIC_CONVEX_URL ?? envDefaults.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_MARKDOWN_ALLOW_HTTP: process.env.NEXT_PUBLIC_MARKDOWN_ALLOW_HTTP,
    NEXT_PUBLIC_MARKDOWN_ALLOW_MAILTO: process.env.NEXT_PUBLIC_MARKDOWN_ALLOW_MAILTO,
    NEXT_PUBLIC_ENABLE_RENDER_PROFILING: process.env.NEXT_PUBLIC_ENABLE_RENDER_PROFILING,
    LOG_LEVEL: process.env.LOG_LEVEL ?? getDefaultLogLevel(),
  };

  const parsedPublicEnv = publicEnvSchema.safeParse(rawPublicEnv);
  if (!parsedPublicEnv.success) {
    const errorLines = parsedPublicEnv.error.issues.map((issue) => {
      const path = issue.path.join('.') || '(root)';
      return `  - ${path}: ${issue.message}`;
    });
    const message = ['Public environment validation failed:', ...errorLines].join('\n');
    throw new Error(message);
  }

  return parsedPublicEnv.data;
}

export let publicEnv = parsePublicEnv();

export function getPublicEnv(): PublicEnv {
  return parsePublicEnv();
}

export let isDevelopment = publicEnv.NODE_ENV === 'development';
export let isTest = publicEnv.NODE_ENV === 'test';

export function reloadPublicEnvForTesting(): void {
  const isTestRuntime =
    process.env.NODE_ENV === 'test' || typeof process.env.JEST_WORKER_ID !== 'undefined';
  if (!isTestRuntime) {
    throw new Error('reloadPublicEnvForTesting is only supported in test environment');
  }
  publicEnv = parsePublicEnv();
  isDevelopment = publicEnv.NODE_ENV === 'development';
  isTest = publicEnv.NODE_ENV === 'test';
}
