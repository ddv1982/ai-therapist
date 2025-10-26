import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import nextPlugin from '@next/eslint-plugin-next';
import reactPerfPlugin from 'eslint-plugin-react-perf';
import unicornPlugin from 'eslint-plugin-unicorn';

import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

/** @type {import('eslint').Linter.Config[]} */
/** @type {import("eslint").Linter.Config[]} */
export default [...compat.extends("next/core-web-vitals", "next/typescript"), {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "dist", "coverage", "convex/_generated/**", "graphite-demo/**" ]
}, {
  files: ["__tests__/**/*.{ts,tsx}", "e2e/**/*.{ts,tsx}", "convex/**/*.ts", "scripts/**/*.js"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-require-imports": "off",
    "@typescript-eslint/no-namespace": "off"
  }
}, {
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  }
}, {
  files: ['**/*.{ts,tsx,js,jsx}'],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      project: './tsconfig.eslint.json',
      tsconfigRootDir: import.meta.dirname,
    },
  },
  plugins: {
    '@typescript-eslint': tsPlugin,
    '@next/next': nextPlugin,
    'react-perf': reactPerfPlugin,
    'unicorn': unicornPlugin,
  },
  rules: {
    ...nextPlugin.configs['core-web-vitals'].rules,
    ...tsPlugin.configs.recommended.rules,
    '@typescript-eslint/naming-convention': [
      'error',
      { selector: 'typeLike', format: ['PascalCase'] },
      { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
    ],
    'unicorn/filename-case': [
      'warn',
      { cases: { kebabCase: true } }
    ],
    'react-perf/jsx-no-new-object-as-prop': 'off',
    'react-perf/jsx-no-new-function-as-prop': 'off',
    'react-perf/jsx-no-new-array-as-prop': 'off',
  },
}, {
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
}, {
  files: ["__tests__/**/*.{ts,tsx,js}", "e2e/**/*.{ts,tsx,js}"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-require-imports": "off",
    "@typescript-eslint/no-namespace": "off"
  }
}, {
  files: ["src/types/api.generated.ts", "src/types/api/**", "src/types/api/*.ts"],
  rules: {
    "@typescript-eslint/naming-convention": "off"
  }
}, {
  files: ["scripts/**/*.js", "jest.setup.js", "jest.config.js", "*.config.js"],
  rules: {
    "@typescript-eslint/no-require-imports": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "import/no-anonymous-default-export": "off"
  }
}];
