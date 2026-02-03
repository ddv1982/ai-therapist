#!/usr/bin/env bun
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const templatePath = path.join(projectRoot, '.env.local.example');
const targetPath = path.join(projectRoot, '.env.local');

const keyRegex = /^\s*([A-Z0-9_]+)\s*=/;

function extractKeys(content: string): Set<string> {
  const keys = new Set<string>();
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(keyRegex);
    if (match) {
      keys.add(match[1]);
    }
  }
  return keys;
}

function extractTemplateKeyLines(content: string): Array<{ key: string; line: string }> {
  const lines: Array<{ key: string; line: string }> = [];
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(keyRegex);
    if (match) {
      lines.push({ key: match[1], line });
    }
  }
  return lines;
}

if (!fs.existsSync(templatePath)) {
  console.error('❌ Missing .env.local.example. Please restore the template file.');
  process.exit(1);
}

if (!fs.existsSync(targetPath)) {
  fs.copyFileSync(templatePath, targetPath);
  console.log('✅ Created .env.local from .env.local.example.');
  process.exit(0);
}

const templateContent = fs.readFileSync(templatePath, { encoding: 'utf8' });
const existingContent = fs.readFileSync(targetPath, { encoding: 'utf8' });

const existingKeys = extractKeys(existingContent);
const templateKeyLines = extractTemplateKeyLines(templateContent);

const missingLines = templateKeyLines
  .filter(({ key }) => !existingKeys.has(key))
  .map(({ line }) => line);

if (missingLines.length === 0) {
  console.log('✅ .env.local already up to date.');
  process.exit(0);
}

const stamp = new Date().toISOString().split('T')[0];
const header = `\n# Added by env:init on ${stamp}\n`;
const addition = header + missingLines.join('\n') + '\n';

fs.appendFileSync(targetPath, addition, { encoding: 'utf8' });
console.log(`✅ Updated .env.local with ${missingLines.length} missing keys.`);
