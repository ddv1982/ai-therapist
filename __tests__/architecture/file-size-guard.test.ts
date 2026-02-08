import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = process.cwd();
const SRC_ROOT = path.join(REPO_ROOT, 'src');
const MAX_FILE_LINES = 350;

const EXEMPT_FILES = new Set([
  'src/types/api.generated.ts',
  'src/i18n/types.ts',
  'src/features/therapy/lib/parsers.ts',
  'src/lib/utils/errors.ts',
  'src/hooks/therapy/use-cbt-data-manager.ts',
  'src/features/chat/context/chat-context.tsx',
  'src/lib/utils/helpers.ts',
  'src/features/therapy/lib/validators.ts',
  'src/lib/api/middleware.ts',
  'src/features/chat/components/chat-message-list/cbt-renderer.tsx',
  'src/features/settings/api-keys-panel.tsx',
  'src/lib/api/retry.ts',
  'src/features/therapy/memory/memory-management-modal.tsx',
  'src/lib/cbt/export-utils.ts',
  'src/ai/providers.ts',
  'src/lib/utils/result.ts',
  'src/lib/utils/logger.ts',
  'src/lib/cache/cache-utils.ts',
  'src/server/application/chat/handle-chat-post.ts',
  'src/types/domains/therapy.ts',
  'src/features/therapy/lib/cbt-template.ts',
  'src/features/chat/lib/memory-management-service.ts',
  'src/hooks/chat/use-therapy-chat.ts',
  'src/features/therapy/memory/session-report-viewer.tsx',
  'src/features/therapy/cbt/chat-components/thought-record.tsx',
  'src/features/therapy/lib/report-generation-service.ts',
  'src/lib/monitoring/performance-metrics.ts',
  'src/lib/utils/render-profiler.ts',
  'src/features/chat/lib/cbt-message-detector.ts',
  'src/features/therapy/cbt/chat-components/rational-thoughts.tsx',
  'src/contexts/api-keys-context.tsx',
  'src/features/therapy/cbt/flow/summary.ts',
  'src/features/therapy/cbt/hooks/use-cbt-flow.ts',
  'src/features/therapy/cbt/chat-components/final-emotion-reflection.tsx',
  'src/features/therapy/cbt/chat-components/schema-modes.tsx',
]);

function listSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
      continue;
    }

    if (!fullPath.endsWith('.ts') && !fullPath.endsWith('.tsx')) {
      continue;
    }

    const relativePath = path.relative(REPO_ROOT, fullPath).replace(/\\/g, '/');

    if (relativePath.includes('/__tests__/')) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

describe('File size guard', () => {
  it(`keeps source files under ${MAX_FILE_LINES} lines unless exempted`, () => {
    const files = listSourceFiles(SRC_ROOT);
    const offenders: string[] = [];

    for (const filePath of files) {
      const relativePath = path.relative(REPO_ROOT, filePath).replace(/\\/g, '/');
      const lines = fs.readFileSync(filePath, 'utf8').split('\n').length;

      if (lines > MAX_FILE_LINES && !EXEMPT_FILES.has(relativePath)) {
        offenders.push(`${relativePath} (${lines} lines)`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
