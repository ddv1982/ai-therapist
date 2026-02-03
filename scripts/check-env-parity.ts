#!/usr/bin/env bun
/*
 * Environment Parity Validator
 * Validates that all required environment variables are present and properly configured.
 *
 * Usage:
 *   bun run env:check          # Check current environment
 *   bun run env:check -- --ci  # CI mode (strict, no prompts)
 *   bun run env:check -- --help
 */

const COLORS = {
  red: '\u001b[0;31m',
  green: '\u001b[0;32m',
  yellow: '\u001b[0;33m',
  blue: '\u001b[0;34m',
  reset: '\u001b[0m',
};

let ciMode = false;
let verbose = false;
let exitCode = 0;

const REQUIRED_VARS = ['ENCRYPTION_KEY'];
const REQUIRED_PROD_VARS = [
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_CONVEX_URL',
];
const OPTIONAL_VARS = [
  'NODE_ENV',
  'PORT',
  'LOG_LEVEL',
  'GROQ_API_KEY',
  'CONVEX_URL',
  'OLLAMA_BASE_URL',
  'OLLAMA_MODEL_ID',
  'RATE_LIMIT_DISABLED',
  'RATE_LIMIT_BLOCK_MS',
  'RATE_LIMIT_WINDOW_MS',
  'RATE_LIMIT_MAX_REQS',
  'CHAT_WINDOW_MS',
  'CHAT_MAX_REQS',
  'CHAT_MAX_CONCURRENCY',
  'CACHE_ENABLED',
  'AI_TELEMETRY_ENABLED',
  'ENABLE_METRICS_ENDPOINT',
];

function usage(): void {
  console.log('Environment Parity Validator');
  console.log('');
  console.log('Usage: bun run env:check -- [OPTIONS]');
  console.log('');
  console.log('Options:');
  console.log('  --ci       Run in CI mode (strict validation, no interactive prompts)');
  console.log('  --verbose  Show all environment variable statuses');
  console.log('  --help     Show this help message');
  console.log('');
  console.log('Required Variables:');
  for (const variable of REQUIRED_VARS) {
    console.log(`  - ${variable}`);
  }
  console.log('');
  console.log('Production Required Variables (can be mocked in CI):');
  for (const variable of REQUIRED_PROD_VARS) {
    console.log(`  - ${variable}`);
  }
}

function logInfo(message: string): void {
  console.log(`${COLORS.blue}[INFO]${COLORS.reset} ${message}`);
}

function logSuccess(message: string): void {
  console.log(`${COLORS.green}[✓]${COLORS.reset} ${message}`);
}

function logWarning(message: string): void {
  console.log(`${COLORS.yellow}[!]${COLORS.reset} ${message}`);
}

function logError(message: string): void {
  console.log(`${COLORS.red}[✗]${COLORS.reset} ${message}`);
}

function maskValue(varName: string, value: string): string {
  if (/(KEY|SECRET|PASSWORD|TOKEN)/.test(varName)) {
    return 'value masked';
  }
  if (value.length > 50) {
    return `${value.slice(0, 47)}...`;
  }
  return value;
}

function checkVar(varName: string, isRequired: boolean): boolean {
  const value = process.env[varName];

  if (!value) {
    if (isRequired) {
      logError(`Missing required variable: ${varName}`);
      exitCode = 1;
    } else if (verbose) {
      logWarning(`Optional variable not set: ${varName}`);
    }
    return false;
  }

  if (verbose) {
    logSuccess(`${varName} = ${maskValue(varName, value)}`);
  }
  return true;
}

function validateEncryptionKey(): boolean {
  const key = process.env.ENCRYPTION_KEY ?? '';
  if (!key) {
    return false;
  }

  const length = key.length;
  if (length < 32) {
    logError(`ENCRYPTION_KEY must be at least 32 characters (current: ${length})`);
    exitCode = 1;
    return false;
  }

  if (verbose) {
    logSuccess(`ENCRYPTION_KEY has valid length (${length} chars)`);
  }
  return true;
}

function validateUrl(varName: string): boolean {
  const value = process.env[varName];
  if (!value) {
    return true;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
  } catch {
    logError(`${varName} must be a valid URL starting with http:// or https://`);
    exitCode = 1;
    return false;
  }
  return true;
}

function parseArgs(args: string[]): void {
  for (const arg of args) {
    switch (arg) {
      case '--ci':
        ciMode = true;
        break;
      case '--verbose':
        verbose = true;
        break;
      case '--help':
        usage();
        process.exit(0);
      default:
        logError(`Unknown option: ${arg}`);
        usage();
        process.exit(1);
    }
  }
}

function main(): void {
  parseArgs(process.argv.slice(2));

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           Environment Parity Validator                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  if (ciMode) {
    logInfo('Running in CI mode');
  }

  logInfo('Checking required environment variables...');
  console.log('');

  for (const variable of REQUIRED_VARS) {
    checkVar(variable, true);
  }

  logInfo('Checking production environment variables...');
  console.log('');

  for (const variable of REQUIRED_PROD_VARS) {
    if (ciMode) {
      if (!checkVar(variable, false)) {
        logWarning(`${variable} not set (using mock value in CI is OK)`);
      }
    } else {
      checkVar(variable, true);
    }
  }

  if (verbose) {
    console.log('');
    logInfo('Checking optional environment variables...');
    console.log('');

    for (const variable of OPTIONAL_VARS) {
      checkVar(variable, false);
    }
  }

  console.log('');
  logInfo('Validating environment variable formats...');
  console.log('');

  validateEncryptionKey();
  validateUrl('NEXT_PUBLIC_CONVEX_URL');
  validateUrl('CONVEX_URL');
  validateUrl('OLLAMA_BASE_URL');

  console.log('');
  console.log('══════════════════════════════════════════════════════════════');
  if (exitCode === 0) {
    logSuccess('All environment checks passed!');
    console.log('');
    console.log('Your environment is properly configured.');
  } else {
    logError('Environment validation failed!');
    console.log('');
    console.log('Please set the missing required environment variables.');
    console.log('See docs/DEPLOYMENT.md for more information.');
  }
  console.log('══════════════════════════════════════════════════════════════');
  console.log('');

  process.exit(exitCode);
}

main();
