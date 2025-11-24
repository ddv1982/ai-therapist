# Type-Safe Translations Guide

This guide explains how to use type-safe translations in the AI Therapist app.

## Overview

Translation keys are now fully type-checked at compile time, providing:
- ✅ **Autocomplete** in your IDE
- ✅ **TypeScript errors** for invalid keys
- ✅ **Refactoring safety** when renaming keys
- ✅ **Documentation** through types

## Usage

### Basic Usage with Namespace

```typescript
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('auth');
  
  // ✅ Autocomplete works - shows: title, submit
  return <h1>{t('title')}</h1>;
  
  // ❌ TypeScript error - 'typo' doesn't exist in 'auth' namespace
  // return <h1>{t('typo')}</h1>;
}
```

### Global Translations (No Namespace)

```typescript
function MyComponent() {
  const t = useTranslations();
  
  // ✅ Use full path with dot notation
  return <p>{t('chat.input.placeholder')}</p>;
  
  // ❌ TypeScript error - invalid path
  // return <p>{t('invalid.path')}</p>;
}
```

### With Variables

```typescript
const t = useTranslations('cbt');

// ✅ Type-safe with interpolation
const message = t('summary.completedSteps', { count: 5 });
```

### Server Components

```typescript
import { getTranslations } from 'next-intl/server';

export default async function ServerComponent() {
  const t = await getTranslations('reports');
  
  // ✅ Same type safety in server components
  return <h1>{t('title')}</h1>;
}
```

## Regenerating Types

Whenever you modify translation files, regenerate types:

```bash
npm run i18n:types
```

**When to regenerate:**
- ✅ After adding new translation keys
- ✅ After removing translation keys
- ✅ After renaming keys
- ✅ Before committing changes

**Tip:** Add to your build process or pre-commit hook:

```json
{
  "scripts": {
    "prebuild": "npm run i18n:types",
    "pretest": "npm run i18n:types"
  }
}
```

## Type Reference

The generated types provide several useful type exports:

### `Messages`
Complete nested structure of all translations:

```typescript
import type { Messages } from '@/i18n/types';

// Messages = { auth: { title: string, ... }, chat: { ... }, ... }
```

### `TranslationKey`
Union of all valid translation keys:

```typescript
import type { TranslationKey } from '@/i18n/types';

// TranslationKey = 'auth.title' | 'auth.submit' | 'chat.input.placeholder' | ...
```

### `Namespace`
Union of top-level namespace keys:

```typescript
import type { Namespace } from '@/i18n/types';

// Namespace = 'auth' | 'chat' | 'ui' | 'cbt' | ...
```

### `NamespaceKeys<T>`
Get keys for a specific namespace:

```typescript
import type { NamespaceKeys } from '@/i18n/types';

// NamespaceKeys<'auth'> = 'title' | 'submit'
// NamespaceKeys<'chat'> = 'input' | 'empty' | 'main' | ...
```

## IDE Setup

### VS Code

Type safety works automatically! Just hover over `t()` calls to see:
- Available keys
- Expected parameters
- Return types

### IntelliJ/WebStorm

1. Ensure TypeScript language service is enabled
2. Restart IDE after generating types
3. Autocomplete should work immediately

## Common Patterns

### Conditional Translations

```typescript
const t = useTranslations('toast');

const message = hasError 
  ? t('messageNotSentTitle')
  : t('saved');
```

### Dynamic Keys (Use Carefully)

```typescript
// ⚠️ Type safety is lost with dynamic keys
const key = condition ? 'title' : 'submit';
const text = t(key as any); // Need to cast

// ✅ Better: Use explicit conditionals
const text = condition ? t('title') : t('submit');
```

### Reusing Translations

```typescript
const t = useTranslations('ui');

// ✅ All these are type-checked
const okText = t('ok');
const cancelText = t('cancel');
const saveText = t('save');
```

## Best Practices

1. **Always regenerate types** after changing JSON files
2. **Use namespaces** for better organization and autocomplete
3. **Avoid dynamic keys** when possible
4. **Commit generated types** to version control
5. **Run type check** before pushing: `npx tsc --noEmit`

## Troubleshooting

### "Property doesn't exist" error

**Cause:** Types are out of sync with JSON files

**Solution:**
```bash
npm run i18n:types
```

### No autocomplete in IDE

**Cause:** IDE hasn't picked up type changes

**Solution:**
1. Restart TypeScript language server (VS Code: Cmd+Shift+P → "Restart TS Server")
2. Close and reopen the file
3. Restart IDE if needed

### Type errors after refactoring

**Cause:** Old keys still referenced in code

**Solution:** This is a feature! The type errors help you find all places that need updating after renaming keys.

## Examples

See the following files for real-world examples:
- `src/features/chat/components/chat-composer.tsx`
- `src/features/therapy/cbt/chat-components/situation-prompt.tsx`
- `src/app/(dashboard)/cbt-diary/page.tsx`

## Integration with Translation Tools

The type system works seamlessly with:
- Crowdin
- Lokalise
- POEditor
- Manual JSON editing

Just remember to run `npm run i18n:types` after sync!
