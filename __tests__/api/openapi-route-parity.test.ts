import fs from 'node:fs';
import path from 'node:path';

const API_ROOT = path.join(process.cwd(), 'src/app/api');
const OPENAPI_PATH = path.join(process.cwd(), 'docs/api.yaml');

const INTERNAL_UNDOCUMENTED_PATHS = new Set([
  '/csp-report',
  '/health',
  '/health/cache',
  '/metrics',
  '/ollama/health',
]);

function walkFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(fullPath);
    }
    return [fullPath];
  });
}

function getImplementedApiRoutes(): Map<string, Set<string>> {
  const routeFiles = walkFiles(API_ROOT).filter((file) => file.endsWith('/route.ts'));
  const routes = new Map<string, Set<string>>();

  for (const file of routeFiles) {
    const relative = file
      .replace(`${API_ROOT}${path.sep}`, '')
      .replace(new RegExp(`${path.sep}route\\.ts$`), '');
    const normalized = `/${relative}`.replace(/\\/g, '/').replace(/\[([^\]]+)\]/g, '{$1}');
    const routePath = normalized === '/.' || normalized === '/' ? '/' : normalized;

    const source = fs.readFileSync(file, 'utf8');
    const methods = [
      ...source.matchAll(
        /export\s+(?:const|async\s+function)\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS)\b/g
      ),
    ]
      .map((match) => match[1])
      .filter((method): method is string => typeof method === 'string');

    routes.set(routePath, new Set(methods));
  }

  return routes;
}

function getOpenApiRoutes(): Map<string, Set<string>> {
  const content = fs.readFileSync(OPENAPI_PATH, 'utf8');
  const lines = content.split('\n');
  const routes = new Map<string, Set<string>>();
  let inPathsSection = false;
  let currentPath: string | null = null;

  for (const line of lines) {
    if (!inPathsSection && line.trim() === 'paths:') {
      inPathsSection = true;
      continue;
    }

    if (inPathsSection && /^[^\s]/.test(line)) {
      break;
    }

    if (inPathsSection) {
      const pathMatch = line.match(/^\s{2}(\/[^:]+):\s*$/);
      if (pathMatch?.[1]) {
        currentPath = pathMatch[1];
        if (!routes.has(currentPath)) {
          routes.set(currentPath, new Set());
        }
        continue;
      }

      const methodMatch = line.match(/^\s{4}(get|post|put|patch|delete|options):\s*$/i);
      if (methodMatch?.[1] && currentPath) {
        routes.get(currentPath)?.add(methodMatch[1].toUpperCase());
      }
    }
  }

  return routes;
}

describe('OpenAPI route parity', () => {
  it('documents only implemented API paths and methods', () => {
    const implemented = getImplementedApiRoutes();
    const documented = getOpenApiRoutes();

    const missingInCode: string[] = [];

    for (const [pathName, methods] of documented.entries()) {
      const implementedMethods = implemented.get(pathName);
      if (!implementedMethods) {
        missingInCode.push(pathName);
        continue;
      }

      for (const method of methods) {
        if (!implementedMethods.has(method)) {
          missingInCode.push(`${method} ${pathName}`);
        }
      }
    }

    expect(missingInCode).toEqual([]);
  });

  it('documents all non-internal API paths and methods', () => {
    const implemented = getImplementedApiRoutes();
    const documented = getOpenApiRoutes();
    const undocumentedPublic: string[] = [];

    for (const [pathName, methods] of implemented.entries()) {
      if (INTERNAL_UNDOCUMENTED_PATHS.has(pathName)) continue;

      const documentedMethods = documented.get(pathName);
      if (!documentedMethods) {
        undocumentedPublic.push(pathName);
        continue;
      }

      for (const method of methods) {
        if (!documentedMethods.has(method)) {
          undocumentedPublic.push(`${method} ${pathName}`);
        }
      }
    }

    expect(undocumentedPublic).toEqual([]);
  });
});
