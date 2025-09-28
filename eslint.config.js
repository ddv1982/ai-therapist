import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import nextPlugin from '@next/eslint-plugin-next';

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
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "dist", "coverage" ]
}, {
  files: ["__tests__/**/*.{ts,tsx}", "e2e/**/*.{ts,tsx}", "scripts/**/*.js"],
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
  },
  rules: {
    ...nextPlugin.configs['core-web-vitals'].rules,
    ...tsPlugin.configs.recommended.rules,
  },
}, {
  files: ["__tests__/**/*.{ts,tsx,js}", "e2e/**/*.{ts,tsx,js}"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-require-imports": "off",
    "@typescript-eslint/no-namespace": "off"
  }
}, {
  files: ["scripts/**/*.js", "jest.setup.js", "jest.config.js", "*.config.js"],
  rules: {
    "@typescript-eslint/no-require-imports": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "import/no-anonymous-default-export": "off"
  }
}];
