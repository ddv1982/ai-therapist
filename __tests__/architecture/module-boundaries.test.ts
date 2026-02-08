import fs from 'node:fs';
import path from 'node:path';

type Layer = 'interface' | 'application' | 'domain' | 'infrastructure';

const REPO_ROOT = process.cwd();
const SRC_ROOT = path.join(REPO_ROOT, 'src');
const SERVER_ROOT = path.join(SRC_ROOT, 'server');
const SOURCE_EXTENSIONS = ['.ts', '.tsx'];

function listFilesRecursive(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(fullPath));
      continue;
    }

    if (SOURCE_EXTENSIONS.some((ext) => fullPath.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractImportSpecifiers(content: string): string[] {
  const specifiers = new Set<string>();
  const fromRegex = /(?:import|export)\s+[^'"`]*?from\s+['"]([^'"]+)['"]/g;
  const directImportRegex = /import\(\s*['"]([^'"]+)['"]\s*\)/g;

  let match: RegExpExecArray | null = null;
  while ((match = fromRegex.exec(content)) !== null) {
    specifiers.add(match[1]);
  }

  while ((match = directImportRegex.exec(content)) !== null) {
    specifiers.add(match[1]);
  }

  return [...specifiers];
}

function detectLayerFromPath(filePath: string): Layer | null {
  const normalized = filePath.replace(/\\/g, '/');
  const match = normalized.match(
    /\/src\/server\/(interface|application|domain|infrastructure)(?:\/|$)/
  );
  return (match?.[1] as Layer | undefined) ?? null;
}

function resolveImportToPath(fromFile: string, specifier: string): string | null {
  if (specifier.startsWith('@/')) {
    return path.join(SRC_ROOT, specifier.slice(2));
  }

  if (!specifier.startsWith('.')) {
    return null;
  }

  return path.resolve(path.dirname(fromFile), specifier);
}

describe('Architecture module boundaries', () => {
  it('enforces layered imports inside src/server', () => {
    const files = listFilesRecursive(SERVER_ROOT);
    const violations: string[] = [];

    for (const filePath of files) {
      const sourceLayer = detectLayerFromPath(filePath);
      if (!sourceLayer) continue;

      const content = fs.readFileSync(filePath, 'utf8');
      const imports = extractImportSpecifiers(content);

      for (const specifier of imports) {
        const resolved = resolveImportToPath(filePath, specifier);
        if (!resolved) continue;

        const targetLayer = detectLayerFromPath(resolved);
        if (!targetLayer) continue;

        if (
          sourceLayer === 'interface' &&
          (targetLayer === 'domain' || targetLayer === 'infrastructure')
        ) {
          violations.push(`${path.relative(REPO_ROOT, filePath)} -> ${specifier}`);
        }

        if (sourceLayer === 'domain' && targetLayer !== 'domain') {
          violations.push(`${path.relative(REPO_ROOT, filePath)} -> ${specifier}`);
        }

        if (
          sourceLayer === 'infrastructure' &&
          (targetLayer === 'interface' || targetLayer === 'application')
        ) {
          violations.push(`${path.relative(REPO_ROOT, filePath)} -> ${specifier}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('allows infrastructure imports only from application layer', () => {
    const files = listFilesRecursive(SRC_ROOT);
    const violations: string[] = [];

    for (const filePath of files) {
      const relativePath = path.relative(REPO_ROOT, filePath).replace(/\\/g, '/');
      if (
        relativePath.startsWith('src/server/application/') ||
        relativePath.startsWith('src/server/infrastructure/')
      ) {
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const imports = extractImportSpecifiers(content);

      for (const specifier of imports) {
        if (
          specifier === '@/server/infrastructure' ||
          specifier.startsWith('@/server/infrastructure/')
        ) {
          violations.push(`${relativePath} -> ${specifier}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
