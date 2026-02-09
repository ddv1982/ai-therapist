import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = process.cwd();
const DOCS = ['docs/DATA_MODEL.md', 'docs/DEVELOPMENT.md', 'docs/DEPLOYMENT.md'] as const;
const PATH_LIKE_PREFIXES = ['src/', 'convex/', 'docs/', '__tests__/', '.husky/', 'scripts/'];
const PATH_LIKE_FILES = [
  'package.json',
  'bun.lock',
  'eslint.config.ts',
  'jest.config.ts',
  'tsconfig.json',
  'tsconfig.eslint.json',
];

function normalizeToken(token: string): string {
  return token
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/[),.;:]+$/g, '')
    .replace(/:\d+(?::\d+)?$/g, '');
}

function toCandidatePath(token: string): string | null {
  const normalized = normalizeToken(token);
  if (!normalized) return null;
  if (normalized.includes('://')) return null;
  if (normalized.includes(' ')) return null;
  if (normalized.startsWith('<') || normalized.endsWith('>')) return null;
  if (normalized.startsWith('/')) return null;

  const isPathLike =
    PATH_LIKE_PREFIXES.some((prefix) => normalized.startsWith(prefix)) ||
    PATH_LIKE_FILES.includes(normalized) ||
    (normalized.includes('/') && /\.[a-z0-9]+$/i.test(normalized));

  if (!isPathLike) return null;

  if (normalized.includes('*')) {
    const wildcardIndex = normalized.search(/[*[{]/);
    const base = normalized.slice(0, wildcardIndex).replace(/\/+$/g, '');
    return base || null;
  }

  return normalized;
}

describe('Documentation path references', () => {
  it('does not reference removed Redux store paths', () => {
    for (const doc of DOCS) {
      const content = fs.readFileSync(path.join(REPO_ROOT, doc), 'utf8');
      expect(content).not.toContain('src/store/slices');
    }
  });

  it('points to existing repository paths for key code references', () => {
    const missing: string[] = [];

    for (const doc of DOCS) {
      const content = fs.readFileSync(path.join(REPO_ROOT, doc), 'utf8');
      const codeTokens = [...content.matchAll(/`([^`]+)`/g)].map((m) => m[1]);

      for (const token of codeTokens) {
        const candidate = toCandidatePath(token);
        if (!candidate) continue;

        const fullPath = path.join(REPO_ROOT, candidate);
        if (!fs.existsSync(fullPath)) {
          missing.push(`${doc} -> ${candidate}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });
});
