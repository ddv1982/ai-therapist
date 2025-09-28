import { ensureCorsEnvValue, isMainModule } from './cors-helpers.js';

export function ensureCorsOriginCli(env = process.env) {
  const { value, allowedOrigins, isDevelopment, usedFallback } = ensureCorsEnvValue(env);

  if (usedFallback && isDevelopment) {
    console.warn(`[CORS] No CORS_ALLOWED_ORIGIN set; using development fallback origins: ${allowedOrigins.join(', ')}`);
  }

  return value;
}

if (isMainModule(import.meta)) {
  try {
    const value = ensureCorsOriginCli();
    console.log(value);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
