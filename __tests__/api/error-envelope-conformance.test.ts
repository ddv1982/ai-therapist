import fs from 'node:fs';
import path from 'node:path';

const ROUTES_ROOT = path.join(process.cwd(), 'src', 'app', 'api');

function listRouteFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listRouteFiles(fullPath));
      continue;
    }

    if (entry.name === 'route.ts') {
      files.push(fullPath);
    }
  }

  return files;
}

describe('API error envelope conformance', () => {
  it('does not use raw new Response for 4xx/5xx API failures', () => {
    const routes = listRouteFiles(ROUTES_ROOT);
    const offenders: string[] = [];

    for (const filePath of routes) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (!line.includes('new Response(')) {
          continue;
        }

        const nearby = lines.slice(i, i + 12).join('\n');
        if (/status\s*:\s*(4\d\d|5\d\d)/.test(nearby)) {
          offenders.push(`${path.relative(process.cwd(), filePath)}:${i + 1}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
