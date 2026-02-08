import path from 'node:path';
import type { ESLint, Linter, Rule } from 'eslint';
import tseslint from 'typescript-eslint';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

const ignoredFilenames = new Set([
  'index.js',
  'index.mjs',
  'index.cjs',
  'index.ts',
  'index.tsx',
  'index.jsx',
  'index.vue',
]);

const kebabCaseRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const filenameCaseRule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce kebab-case filenames',
    },
    schema: [],
    messages: {
      kebabCase: 'Filename "{{name}}" should be kebab-case.',
      extension: 'File extension "{{extension}}" should be lowercase.',
    },
  },
  create(context) {
    const physicalFilename = context.physicalFilename ?? context.getFilename();
    if (physicalFilename === '<input>' || physicalFilename === '<text>') {
      return {};
    }

    const basename = path.basename(physicalFilename);
    if (ignoredFilenames.has(basename)) {
      return {};
    }

    const extension = path.extname(basename);
    const filename = path.basename(basename, extension);
    const primaryName = filename.split('.')[0] ?? filename;
    const match = /^(_+)?(.*)$/.exec(primaryName);
    const coreName = match?.[2] ?? primaryName;

    return {
      Program(node) {
        if (extension && extension !== extension.toLowerCase()) {
          context.report({
            node,
            messageId: 'extension',
            data: { extension },
          });
        }

        if (!coreName) {
          return;
        }

        if (!kebabCaseRegex.test(coreName)) {
          context.report({
            node,
            messageId: 'kebabCase',
            data: { name: basename },
          });
        }
      },
    };
  },
};

const localPlugin: ESLint.Plugin = {
  rules: {
    'filename-case': filenameCaseRule,
  },
};

const config: Linter.Config[] = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'dist',
      'coverage',
      'convex/_generated/**',
      'graphite-demo/**',
      'playwright-report/**',
      '.droidz/**',
      '.factory/**',
    ],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.eslint.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin as ESLint.Plugin,
      'react-hooks': reactHooksPlugin as ESLint.Plugin,
      local: localPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
      ],
      'local/filename-case': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Enforce structured logging - use logger instead of console
      // Allow specific console.* calls only with eslint-disable-next-line
      'no-console': 'error',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['../*', '@/server/infrastructure', '@/server/infrastructure/*'] },
      ],
    },
  },
  {
    // Application layer: restrict interface access, but ALLOW infrastructure
    // (per ADR-005: "Infrastructure must only be imported by application layer")
    // Note: this block fully overrides the src/** no-restricted-imports rule above
    files: ['src/server/application/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['../*', '@/server/interface', '@/server/interface/*'] },
      ],
    },
  },
  {
    files: ['src/server/interface/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '../*',
            '@/server/domain',
            '@/server/domain/*',
            '@/server/infrastructure',
            '@/server/infrastructure/*',
          ],
        },
      ],
    },
  },
  {
    files: ['src/server/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '../*',
            '@/server/interface',
            '@/server/interface/*',
            '@/server/application',
            '@/server/application/*',
            '@/server/infrastructure',
            '@/server/infrastructure/*',
          ],
        },
      ],
    },
  },
  {
    files: ['src/server/infrastructure/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '../*',
            '@/server/interface',
            '@/server/interface/*',
            '@/server/application',
            '@/server/application/*',
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/api/health/route.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: [
      'src/app/(dashboard)/**/*.{ts,tsx}',
      'src/features/chat/components/dashboard/**/*.{ts,tsx}',
      'src/hooks/use-chat-controller.ts',
      'src/hooks/chat/**/*.{ts,tsx}',
    ],
    rules: {
      'max-lines': ['warn', { max: 360, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 320, skipBlankLines: true, skipComments: true }],
      complexity: ['warn', 25],
    },
  },
  {
    files: ['__tests__/**/*.{ts,tsx,js}', 'e2e/**/*.{ts,tsx,js}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-namespace': 'off',
      // Tests can use console
      'no-console': 'off',
    },
  },
  {
    files: ['src/types/api.generated.ts', 'src/types/api/**'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
    },
  },
  {
    files: [
      'scripts/**/*.js',
      'scripts/**/*.ts',
      'jest.setup.ts',
      'jest.config.ts',
      '*.config.js',
      '*.config.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      // Scripts can use console
      'no-console': 'off',
    },
  },
  {
    files: ['convex/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-namespace': 'off',
      // Convex doesn't allow hyphens in filenames (only alphanumeric, underscores, periods)
      'local/filename-case': 'off',
    },
  },
  prettierConfig,
];

export default config;
