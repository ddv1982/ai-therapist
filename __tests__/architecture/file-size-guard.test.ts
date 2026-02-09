import fs from 'node:fs';
import path from 'node:path';

interface ExemptionEntry {
  path: string;
  owner: string;
  reason: string;
  targetRemoval: string;
}

const REPO_ROOT = process.cwd();
const SRC_ROOT = path.join(REPO_ROOT, 'src');
const MAX_FILE_LINES = 350;
const MAX_EXEMPTIONS = 34;

const EXEMPTIONS: ExemptionEntry[] = [
  {
    path: 'src/types/api.generated.ts',
    owner: 'api-contracts',
    reason: 'generated OpenAPI client types',
    targetRemoval: 'n/a-generated',
  },
  {
    path: 'src/i18n/types.ts',
    owner: 'i18n',
    reason: 'generated translation type map',
    targetRemoval: 'n/a-generated',
  },
  {
    path: 'src/features/therapy/lib/parsers.ts',
    owner: 'therapy',
    reason: 'parser consolidation pending domain split',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/lib/utils/errors.ts',
    owner: 'platform',
    reason: 'error taxonomy extraction pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/hooks/therapy/use-cbt-data-manager.ts',
    owner: 'therapy',
    reason: 'CBT state transitions pending hook decomposition',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/features/chat/context/chat-context.tsx',
    owner: 'chat',
    reason: 'chat provider orchestration split in progress',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/lib/utils/helpers.ts',
    owner: 'platform',
    reason: 'utility extraction backlog',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/features/therapy/lib/validators.ts',
    owner: 'therapy',
    reason: 'schema split pending domain boundaries',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/features/chat/components/chat-message-list/cbt-renderer.tsx',
    owner: 'chat',
    reason: 'renderer split pending step component extraction',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/features/settings/api-keys-panel.tsx',
    owner: 'settings',
    reason: 'panel decomposition pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/lib/api/retry.ts',
    owner: 'platform',
    reason: 'retry strategy extraction pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/features/therapy/memory/memory-management-modal.tsx',
    owner: 'therapy',
    reason: 'modal split pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/lib/cbt/export-utils.ts',
    owner: 'therapy',
    reason: 'export flow helper split pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/ai/providers.ts',
    owner: 'ai-platform',
    reason: 'provider registry centralization',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/lib/utils/result.ts',
    owner: 'platform',
    reason: 'result helpers grouped pending cleanup',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/lib/utils/logger.ts',
    owner: 'platform',
    reason: 'logger transport split pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/lib/cache/cache-utils.ts',
    owner: 'platform',
    reason: 'cache strategy split pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/types/domains/therapy.ts',
    owner: 'therapy',
    reason: 'domain type split pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/features/therapy/lib/cbt-template.ts',
    owner: 'therapy',
    reason: 'template extraction pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/features/chat/lib/memory-management-service.ts',
    owner: 'chat',
    reason: 'memory service split pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/hooks/chat/use-therapy-chat.ts',
    owner: 'chat',
    reason: 'hook orchestration split pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/features/therapy/memory/session-report-viewer.tsx',
    owner: 'therapy',
    reason: 'viewer decomposition pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/features/therapy/cbt/chat-components/thought-record.tsx',
    owner: 'therapy',
    reason: 'step component split pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/features/therapy/lib/report-generation-service.ts',
    owner: 'therapy',
    reason: 'report generation phases split pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/lib/monitoring/performance-metrics.ts',
    owner: 'platform',
    reason: 'metrics adapter split pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/lib/encryption/client-crypto.ts',
    owner: 'platform',
    reason: 'client crypto utility split pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/lib/utils/render-profiler.ts',
    owner: 'platform',
    reason: 'profiler output split pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/features/chat/lib/cbt-message-detector.ts',
    owner: 'chat',
    reason: 'detector rule modules pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/features/therapy/cbt/chat-components/rational-thoughts.tsx',
    owner: 'therapy',
    reason: 'step component split pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/contexts/api-keys-context.tsx',
    owner: 'settings',
    reason: 'context extraction pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/features/therapy/cbt/flow/summary.ts',
    owner: 'therapy',
    reason: 'summary sections split pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/features/therapy/cbt/hooks/use-cbt-flow.ts',
    owner: 'therapy',
    reason: 'hook decomposition pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/features/therapy/cbt/chat-components/final-emotion-reflection.tsx',
    owner: 'therapy',
    reason: 'step component split pending',
    targetRemoval: '2026-05-31',
  },
  {
    path: 'src/features/therapy/cbt/chat-components/schema-modes.tsx',
    owner: 'therapy',
    reason: 'step component split pending',
    targetRemoval: '2026-05-31',
  },
];

const EXEMPT_FILE_SET = new Set(EXEMPTIONS.map((entry) => entry.path));

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

      if (lines > MAX_FILE_LINES && !EXEMPT_FILE_SET.has(relativePath)) {
        offenders.push(`${relativePath} (${lines} lines)`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('keeps exemption list bounded', () => {
    expect(EXEMPTIONS.length).toBeLessThanOrEqual(MAX_EXEMPTIONS);
  });

  it('tracks only existing files in the exemption list', () => {
    const staleEntries = EXEMPTIONS.filter(
      (entry) => !fs.existsSync(path.join(REPO_ROOT, entry.path))
    ).map(
      (entry) => `${entry.path} (owner: ${entry.owner}, targetRemoval: ${entry.targetRemoval})`
    );
    expect(staleEntries).toEqual([]);
  });
});
