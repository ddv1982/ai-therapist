#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const target = path.join(__dirname, '..', '.env.local');

if (fs.existsSync(target)) {
  const existing = fs.readFileSync(target, { encoding: 'utf8' });
  let changed = false;

  // Backfill missing keys if the file predates newer defaults
  if (!/^GROQ_API_KEY=/m.test(existing)) {
    fs.appendFileSync(target, `\n# AI provider API keys\nGROQ_API_KEY=""\n`, { encoding: 'utf8' });
    changed = true;
  }

  if (!/^NEXT_PUBLIC_CONVEX_URL=/m.test(existing)) {
    fs.appendFileSync(
      target,
      `\n# Convex backend URL\nNEXT_PUBLIC_CONVEX_URL=""\nCONVEX_URL=""\n`,
      { encoding: 'utf8' }
    );
    changed = true;
  }

  if (changed) {
    console.log('✅ Updated .env.local with missing keys (e.g., GROQ_API_KEY).');
  } else {
    console.log('✅ .env.local already exists, no changes made');
  }
  process.exit(0);
}

const template = `# Local environment configuration
# Fill in your values as needed. ENCRYPTION_KEY should be a 32-byte (base64) value.

GROQ_API_KEY=""
ENCRYPTION_KEY=""
NEXTAUTH_SECRET=""
NEXT_PUBLIC_CONVEX_URL=""
CONVEX_URL=""

# Redis Configuration
REDIS_URL="redis://localhost:6379"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
REDIS_DB="0"

# Cache Configuration
CACHE_ENABLED="true"
CACHE_DEFAULT_TTL="300"
CACHE_SESSION_TTL="1800"
CACHE_MESSAGE_TTL="900"

# Development-only options
BYPASS_AUTH=true
RATE_LIMIT_DISABLED=true
`;

fs.writeFileSync(target, template, { encoding: 'utf8' });
console.log('✅ Created .env.local with defaults (ENCRYPTION_KEY left empty).');
