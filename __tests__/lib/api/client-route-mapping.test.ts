import fs from 'node:fs';
import path from 'node:path';
import { ApiClient } from '@/lib/api/client';

const API_ROOT = path.join(process.cwd(), 'src/app/api');

function walkFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(fullPath);
    }
    return [fullPath];
  });
}

function getImplementedApiPaths(): string[] {
  return walkFiles(API_ROOT)
    .filter((file) => file.endsWith('/route.ts'))
    .map((file) => {
      const relative = file
        .replace(`${API_ROOT}${path.sep}`, '')
        .replace(new RegExp(`${path.sep}route\\.ts$`), '');
      return `/${relative}`.replace(/\\/g, '/').replace(/\[([^\]]+)\]/g, '{$1}');
    });
}

function pathMatchesImplemented(pathname: string, implementedPaths: string[]): boolean {
  return implementedPaths.some((template) => {
    const regex = new RegExp(`^${template.replace(/\{[^}]+\}/g, '[^/]+')}$`);
    return regex.test(pathname);
  });
}

describe('ApiClient route mapping', () => {
  it('maps every public request method to an implemented Next.js API route', async () => {
    const client = new ApiClient('/api');
    const requestedPaths: string[] = [];

    (client as unknown as { request: (path: string) => Promise<unknown> }).request = jest.fn(
      async (requestPath: string) => {
        requestedPaths.push(requestPath);
        return { success: true };
      }
    );

    await client.listSessions();
    await client.createSession({ title: 'Session' });
    await client.resumeSession('sess-123');
    await client.deleteSession('sess-123');
    await client.listMessages('sess-123', { page: 2, limit: 10 });
    await client.postMessage('sess-123', { role: 'user', content: 'hello' });
    await client.patchMessageMetadata('sess-123', 'msg-456', {
      metadata: { source: 'test' },
      mergeStrategy: 'merge',
    });
    await client.generateReportDetailed({ sessionId: 'sess-123' });
    await client.generateReportFromContext({
      sessionId: 'sess-123',
      contextualMessages: [{ role: 'user', content: 'summary' }],
    });
    await client.getMemoryReports();
    await client.deleteMemoryReports();
    await client.getSessionById('sess-123');

    const implementedPaths = getImplementedApiPaths();
    const unmapped = requestedPaths
      .map((requestPath) => requestPath.split('?')[0] ?? requestPath)
      .map((requestPath) => requestPath.replace(/^\/api/, ''))
      .filter((pathname) => !pathMatchesImplemented(pathname, implementedPaths));

    expect(unmapped).toEqual([]);
  });
});
