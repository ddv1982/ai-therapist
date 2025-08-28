#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', '.env.local');

if (fs.existsSync(target)) {
  console.log('✅ .env.local already exists, no changes made');
  process.exit(0);
}

const template = `# Local environment configuration
# Fill in your values as needed. ENCRYPTION_KEY should be a 32-byte (base64) value.

DATABASE_URL="file:./prisma/dev.db"
GROQ_API_KEY=""
ENCRYPTION_KEY=""
NEXTAUTH_SECRET=""

# Development-only options
BYPASS_AUTH=true
RATE_LIMIT_DISABLED=true
`;

fs.writeFileSync(target, template, { encoding: 'utf8' });
console.log('✅ Created .env.local with defaults (ENCRYPTION_KEY left empty).');

