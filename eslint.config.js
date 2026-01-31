import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPerfPlugin from 'eslint-plugin-react-perf';
import unicornPlugin from 'eslint-plugin-unicorn';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
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
    files: ['__tests__/**/*.{ts,tsx}', 'e2e/**/*.{ts,tsx}', 'convex/**/*.ts', 'scripts/**/*.js'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-namespace': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.eslint.json',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooksPlugin,
      'react-perf': reactPerfPlugin,
      unicorn: unicornPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'error',
      'no-restricted-imports': ['warn', { patterns: ['../*'] }],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
      ],
      'unicorn/filename-case': ['warn', { cases: { kebabCase: true } }],
      'react-perf/jsx-no-new-object-as-prop': 'off',
      'react-perf/jsx-no-new-function-as-prop': 'off',
      'react-perf/jsx-no-new-array-as-prop': 'off',
      // Enforce structured logging - use logger instead of console
      // Allow specific console.* calls only with eslint-disable-next-line
      'no-console': 'error',
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
      'react-perf/jsx-no-new-object-as-prop': 'off',
      'react-perf/jsx-no-new-function-as-prop': 'off',
      'react-perf/jsx-no-new-array-as-prop': 'off',
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
    files: ['src/types/api.generated.ts', 'src/types/api/**', 'src/types/api/*.ts'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
    },
  },
  {
    files: ['scripts/**/*.js', 'jest.setup.js', 'jest.config.js', '*.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'import/no-anonymous-default-export': 'off',
      // Scripts can use console
      'no-console': 'off',
    },
  },
  {
    files: ['convex/**/*.ts'],
    rules: {
      // Convex doesn't allow hyphens in filenames (only alphanumeric, underscores, periods)
      'unicorn/filename-case': 'off',
    },
  },
  prettierConfig,
];
