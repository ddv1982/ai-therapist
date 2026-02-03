#!/usr/bin/env bun
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const envPath = path.join(projectRoot, '.env.local');
const templatePath = path.join(projectRoot, '.env.local.example');
const keyName = 'ENCRYPTION_KEY';

function normalizeEnvValue(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function getEnvValue(content: string, key: string): string | undefined {
  const regex = new RegExp(`^\\s*${key}\\s*=\\s*(.*)$`, 'm');
  const match = content.match(regex);
  if (!match) return undefined;
  return normalizeEnvValue(match[1] ?? '');
}

function setEnvValue(content: string, key: string, value: string): string {
  const line = `${key}="${value}"`;
  const regex = new RegExp(`^\\s*${key}\\s*=.*$`, 'm');
  if (regex.test(content)) {
    return content.replace(regex, line);
  }
  const suffix = content.endsWith('\n') ? '' : '\n';
  return `${content}${suffix}${line}\n`;
}

function ensureEnvFileExists(): void {
  if (fs.existsSync(envPath)) return;
  if (!fs.existsSync(templatePath)) {
    console.error('❌ Missing .env.local.example. Please restore the template file.');
    process.exit(1);
  }
  fs.copyFileSync(templatePath, envPath);
  console.log('✅ Created .env.local from .env.local.example.');
}

function generateKey(): string {
  return randomBytes(32).toString('base64');
}

ensureEnvFileExists();

const content = fs.readFileSync(envPath, 'utf8');
const existingValue = getEnvValue(content, keyName);
const isPlaceholder = (value: string | undefined) =>
  !value || /generate-a-32-byte-base64-key/i.test(value);

if (existingValue && existingValue.length >= 32 && !isPlaceholder(existingValue)) {
  console.log('✅ ENCRYPTION_KEY already configured.');
  process.exit(0);
}

if (existingValue && existingValue.length > 0 && existingValue.length < 32) {
  console.warn('⚠️  ENCRYPTION_KEY is too short. Generating a new key.');
}

const newKey = generateKey();
const updated = setEnvValue(content, keyName, newKey);
fs.writeFileSync(envPath, updated, 'utf8');
console.log('✅ ENCRYPTION_KEY set in .env.local.');
