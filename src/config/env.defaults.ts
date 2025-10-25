export const envDefaults = {
  NODE_ENV: 'development' as const,
  PORT: 4000,

  // Auth
  BYPASS_AUTH: false,

  // API rate limiting
  RATE_LIMIT_BLOCK_MS: 5 * 60 * 1000,
  RATE_LIMIT_WINDOW_MS: 5 * 60 * 1000,
  RATE_LIMIT_MAX_REQS: 50,
  RATE_LIMIT_DISABLED: false,
  RATE_LIMIT_USE_REDIS: false,

  // Chat limits
  CHAT_WINDOW_MS: 5 * 60 * 1000,
  CHAT_MAX_REQS: 120,
  CHAT_MAX_CONCURRENCY: 2,
  CHAT_CLEANUP_INTERVAL_MS: 30_000,
  CHAT_RESPONSE_MAX_CHARS: 100_000,
  CHAT_INPUT_MAX_BYTES: 128 * 1024,

  // API defaults
  API_WINDOW_MS: 5 * 60 * 1000,
  API_MAX_REQS: 300,

  // Cache defaults
  CACHE_ENABLED: true,
  CACHE_DEFAULT_TTL: 300,
  CACHE_SESSION_TTL: 1_800,
  CACHE_MESSAGE_TTL: 900,
  MESSAGES_CACHE_ENABLED: true,

  // Logging and telemetry
  LOG_LEVEL: 'info',
  AI_TELEMETRY_ENABLED: false,
  AI_TELEMETRY_RECORD_INPUTS: true,
  AI_TELEMETRY_RECORD_OUTPUTS: true,

  // Metrics
  ENABLE_METRICS_ENDPOINT: false,

  // Ollama / local AI
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
  OLLAMA_MODEL_ID: 'gemma3:4b',

  // Markdown sanitization
  NEXT_PUBLIC_MARKDOWN_ALLOW_HTTP: false,
  NEXT_PUBLIC_MARKDOWN_ALLOW_MAILTO: false,

  // Convex defaults
  NEXT_PUBLIC_CONVEX_URL: '',

  // Redis defaults
  REDIS_PORT: 6_379,
  REDIS_DB: 0,
} as const;

export type EnvDefaults = typeof envDefaults;
