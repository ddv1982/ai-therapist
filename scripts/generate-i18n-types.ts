#!/usr/bin/env bun
/**
 * Generates TypeScript types from translation JSON files
 * Provides autocomplete and type safety for translation keys
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

/**
 * Recursively generates TypeScript type definitions from nested objects
 */
function generateTypeFromObject(obj: Record<string, unknown>, indent = 0): string {
  const indentStr = '  '.repeat(indent);
  const lines: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Nested object
      lines.push(`${indentStr}${JSON.stringify(key)}: {`);
      lines.push(generateTypeFromObject(value as Record<string, unknown>, indent + 1));
      lines.push(`${indentStr}}`);
    } else if (Array.isArray(value)) {
      // Array of strings
      lines.push(`${indentStr}${JSON.stringify(key)}: string[]`);
    } else {
      // String value
      lines.push(`${indentStr}${JSON.stringify(key)}: string`);
    }
  }

  return lines.join('\n');
}

/**
 * Flattens nested object to dot notation paths for IntlMessages type
 */
function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }

  return keys;
}

function generateTypes(): void {
  console.log('Generating i18n types from en.json...\n');

  // Read English messages (source of truth)
  const messagesPath = join(projectRoot, 'src', 'i18n', 'messages', 'en.json');
  const messages = JSON.parse(readFileSync(messagesPath, 'utf-8')) as Record<string, unknown>;

  // Generate nested interface
  const nestedType = generateTypeFromObject(messages, 1);

  // Generate flat keys union type
  const flatKeys = flattenKeys(messages);
  const keysUnion = flatKeys.map((key) => `  | '${key}'`).join('\n');

  // Generate TypeScript declaration file
  const typeDefinition = `/**
 * Auto-generated translation types from en.json
 * Run 'bun run i18n:types' to regenerate
 * 
 * @generated
 * DO NOT EDIT MANUALLY
 */

/**
 * Nested structure of all translation messages
 */
export interface Messages {
${nestedType}
}

/**
 * All available translation keys (dot notation)
 * Provides autocomplete and type safety for t() calls
 */
export type TranslationKey =
${keysUnion};

/**
 * Namespace keys (top-level keys)
 * Use with useTranslations('namespace')
 */
export type Namespace = keyof Messages;

/**
 * Helper type to get keys for a specific namespace
 * Example: NamespaceKeys<'auth'> = 'title' | 'submit'
 */
export type NamespaceKeys<T extends Namespace> = T extends keyof Messages
  ? Messages[T] extends Record<string, any>
    ? Extract<keyof Messages[T], string>
    : never
  : never;

/**
 * Type augmentation for next-intl
 * This makes useTranslations() type-safe across your app
 */
declare global {
  interface IntlMessages extends Messages {}
}
`;

  // Write to types file
  const outputPath = join(projectRoot, 'src', 'i18n', 'types.ts');
  writeFileSync(outputPath, typeDefinition, 'utf-8');

  console.log(`✅ Generated types with ${flatKeys.length} translation keys`);
  console.log(`📁 Output: ${outputPath}`);
  console.log('\n✨ Type-safe translations are now enabled!');
  console.log('\nUsage examples:');
  console.log("  const t = useTranslations('auth');");
  console.log("  t('title')  // ✅ Autocomplete works!");
  console.log("  t('typo')   // ❌ TypeScript error");
}

generateTypes();
