#!/usr/bin/env node

/**
 * Converts flat JSON with dot notation to nested structure
 * Example: { "auth.title": "Sign in" } -> { "auth": { "title": "Sign in" } }
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

function expandDotNotation(flatMessages) {
  const nested = {};
  
  for (const [key, value] of Object.entries(flatMessages)) {
    const parts = key.split('.');
    let current = nested;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        // Last part: assign the value
        current[part] = value;
      } else {
        // Intermediate part: ensure object exists
        if (
          typeof current[part] !== 'object' ||
          current[part] === null ||
          Array.isArray(current[part])
        ) {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }
  
  return nested;
}

function convertFile(filePath) {
  console.log(`Converting ${filePath}...`);
  
  // Read flat JSON
  const flatJson = JSON.parse(readFileSync(filePath, 'utf-8'));
  
  // Convert to nested
  const nested = expandDotNotation(flatJson);
  
  // Write back with nice formatting
  writeFileSync(filePath, JSON.stringify(nested, null, 2) + '\n', 'utf-8');
  
  console.log(`✅ Converted ${filePath}`);
}

// Convert both locale files
const locales = ['en', 'nl'];
for (const locale of locales) {
  const filePath = join(projectRoot, 'src', 'i18n', 'messages', `${locale}.json`);
  convertFile(filePath);
}

console.log('\n✨ All locale files converted to nested structure!');
