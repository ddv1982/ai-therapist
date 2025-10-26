#!/usr/bin/env node
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');

const NEXT_RESERVED_FILES = new Set([
  'page.tsx', 'layout.tsx', 'route.ts', 'loading.tsx', 'error.tsx', 'not-found.tsx', 'manifest.ts'
]);
const ALLOWED_BASENAMES = new Set(['env.defaults', 'env.public', 'logger.data']);

const isKebab = (s) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
const isKebabFile = (s) => {
  if (s.endsWith('.d.ts')) return true;
  if (!/\.(ts|tsx)$/.test(s)) return true; // ignore other files
  if (NEXT_RESERVED_FILES.has(s)) return true;
  const base = s.replace(/\.(ts|tsx)$/,'');
  if (ALLOWED_BASENAMES.has(base)) return true;
  return isKebab(base);
};

const shouldSkipDir = (name) => name.startsWith('(') || name.startsWith('_') || name.startsWith('[') || name === '.next' || name === 'node_modules';

/** @param {string} dir */
async function walk(dir, out) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const name = entry.name;
    const full = join(dir, name);
    if (entry.isDirectory()) {
      if (!shouldSkipDir(name) && !isKebab(name)) {
        out.push({ kind: 'dir', path: full, name });
      }
      await walk(full, out);
    } else if (entry.isFile()) {
      if (!isKebabFile(name)) {
        out.push({ kind: 'file', path: full, name });
      }
    }
  }
}

async function main() {
  const issues = [];
  try {
    const s = await stat(SRC);
    if (!s.isDirectory()) throw new Error('src is not a directory');
  } catch (e) {
    console.error('Could not locate src directory:', SRC, e);
    process.exit(2);
  }
  await walk(SRC, issues);
  const shareHits = issues.filter(i => /\bshare\b/.test(i.path) && !i.path.includes('/app/'));
  const total = issues.length;
  console.log(`Naming audit complete. Issues: ${total}`);
  if (total) {
    for (const i of issues) {
      console.log(`- [${i.kind}] ${i.path}`);
    }
  }
  if (shareHits.length) {
    console.log(`\nFound ${shareHits.length} paths containing "share". Consider consolidating to "shared".`);
  }
  process.exit(total ? 1 : 0);
}

main();
