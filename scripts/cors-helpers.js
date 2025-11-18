import { fileURLToPath } from 'url';
import path from 'path';

const DEFAULT_DEV_ORIGINS = ['http://127.0.0.1:4000', 'http://localhost:4000'];

export function parseOriginList(raw) {
  if (typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function resolveAllowedOrigins(env = process.env) {
  const nodeEnv = env.NODE_ENV;
  const isDevelopment = nodeEnv === 'development' || nodeEnv === undefined || nodeEnv === '';
  const devOrigins = parseOriginList(env.DEV_CORS_ORIGIN);
  const prodOrigins = parseOriginList(env.CORS_ALLOWED_ORIGIN);

  let allowedOrigins = isDevelopment ? devOrigins : prodOrigins;
  let usedFallback = null;

  if (allowedOrigins.length === 0) {
    if (isDevelopment) {
      allowedOrigins = [...DEFAULT_DEV_ORIGINS];
      usedFallback = { reason: 'development-default', origins: allowedOrigins };
    } else {
      const fallback = (env.APP_ORIGIN || env.NEXT_PUBLIC_APP_URL || '').trim();
      if (fallback) {
        allowedOrigins = [fallback];
        usedFallback = { reason: 'app-origin', origins: allowedOrigins };
      }
    }
  }

  return { allowedOrigins, isDevelopment, usedFallback };
}

export function ensureAllowedOrigins(env = process.env, options = {}) {
  const { silent = false } = options;
  const result = resolveAllowedOrigins(env);

  if (result.allowedOrigins.includes('*')) {
    throw new Error('Wildcard CORS origin is not supported when credentials are required.');
  }

  if (!result.isDevelopment) {
    if (result.allowedOrigins.length === 0 || result.usedFallback) {
      throw new Error(
        'CORS configuration missing: set CORS_ALLOWED_ORIGIN or APP_ORIGIN for production builds.'
      );
    }
  } else if (!silent && result.usedFallback) {
    console.warn(`[CORS] Using development fallback origins: ${result.allowedOrigins.join(', ')}`);
  }

  return result;
}

export function ensureCorsEnvValue(env = process.env, options = {}) {
  const { silent = false } = options;
  const { allowedOrigins, isDevelopment, usedFallback } = resolveAllowedOrigins(env);

  if (!isDevelopment) {
    if (allowedOrigins.length === 0 || usedFallback) {
      throw new Error(
        'CORS configuration missing: set CORS_ALLOWED_ORIGIN or APP_ORIGIN for production builds.'
      );
    }
  } else if (!silent && usedFallback) {
    console.warn(`[CORS] Using development fallback origins: ${allowedOrigins.join(', ')}`);
  }

  return { value: allowedOrigins.join(','), allowedOrigins, isDevelopment, usedFallback };
}

export function isMainModule(meta) {
  if (!meta || !meta.url) return false;
  if (!process.argv[1]) return false;
  const modulePath = fileURLToPath(meta.url);
  return path.resolve(process.argv[1]) === modulePath;
}
