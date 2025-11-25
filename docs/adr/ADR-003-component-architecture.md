# ADR-003: Component Architecture

## Status

Accepted

## Date

2024-11-25

## Context

The AI Therapist application has a significant UI surface area with:

- **48+ UI components** in `src/components/ui/`
- **Therapeutic-specific components** (cards, forms, modals, layouts)
- **Shadcn/ui primitives** as the foundation
- **Domain features** in `src/features/` (auth, chat, therapy)

Initial challenges:

- Large, monolithic components (some 400+ lines)
- Mixing primitive and domain-specific components in flat structure
- Inconsistent patterns between different UI categories
- Difficulty discovering and reusing existing components

## Decision

We adopted a **compound component architecture** with clear separation between:

1. **Primitives**: Base shadcn/ui components (button, input, dialog, etc.)
2. **Therapeutic Components**: Domain-specific compound components
3. **Feature Components**: Page-level compositions in `src/features/`

### Directory Structure

```
src/components/ui/
├── button.tsx              # Primitive
├── input.tsx               # Primitive
├── dialog.tsx              # Primitive
├── therapeutic-button.tsx  # Enhanced primitive
├── therapeutic-card.tsx    # Main card component
├── therapeutic-cards/      # Card system
│   ├── base/               # Core logic & types
│   ├── compound/           # Composable parts
│   ├── specialized/        # Domain variants
│   └── index.ts            # Public API
├── therapeutic-forms/      # Form system
│   ├── base/               # Hooks & wrappers
│   ├── inputs/             # Input components
│   ├── specialized/        # Domain inputs
│   └── index.ts            # Public API
├── therapeutic-layouts/    # Layout system
│   ├── base/               # Core layout
│   ├── specialized/        # Page layouts
│   └── index.ts            # Public API
└── therapeutic-modals/     # Modal system
    ├── base/               # Core modal
    ├── compound/           # Modal parts
    ├── specialized/        # Domain modals
    └── index.ts            # Public API
```

### Compound Component Pattern

Each therapeutic system follows the compound component pattern:

```typescript
// Usage example - therapeutic cards
import {
  TherapeuticBaseCard,
  CardHeader,
  CardContent,
  CardActions,
} from '@/components/ui/therapeutic-cards';

function MyCard() {
  return (
    <TherapeuticBaseCard variant="elevated">
      <CardHeader title="Session Summary" />
      <CardContent>
        {/* Content */}
      </CardContent>
      <CardActions>
        <CardAction label="View Details" />
      </CardActions>
    </TherapeuticBaseCard>
  );
}

// Specialized variant - pre-configured
import { SessionCard } from '@/components/ui/therapeutic-cards';

function SessionList() {
  return <SessionCard session={session} onSelect={handleSelect} />;
}
```

### Key Patterns

1. **Base + Specialized Split**:
   - `base/` contains core types, config, and default implementations
   - `specialized/` contains domain-specific variants (CBT, Session, Emotion)

2. **Server/Client Separation**:
   - Types and config are server-safe (can be imported anywhere)
   - Interactive components marked with `'use client'`

3. **Barrel Exports**:
   - Each system has `index.ts` defining the public API
   - Internal implementation details are not exported

4. **Variant-Based Styling**:
   - Using `class-variance-authority` for type-safe variants
   - Presets for common configurations

## Consequences

### Positive

- **Discoverability**: Clear categories make finding components easier
- **Reusability**: Compound pattern enables flexible composition
- **Consistency**: Shared base components ensure consistent behavior
- **Type Safety**: Full TypeScript coverage with exported types
- **Maintainability**: Smaller, focused files (40-73% bundle reduction)
- **Server Components**: Config can be imported without client boundary

### Negative

- **Learning Curve**: Team needs to understand compound component pattern
- **More Files**: Granular structure means more files to navigate
- **Import Paths**: Need to use correct barrel export paths

### Neutral

- **Backward Compatibility**: Compat wrappers maintain old APIs during transition
- **Bundle Size**: Tree-shaking works well with the structure

## Implementation Guidelines

### When to Create a New Component

1. **Primitive**: Extends shadcn/ui with app-specific defaults → `therapeutic-*.tsx`
2. **System**: Multiple related variants with shared logic → `therapeutic-*/` directory
3. **Feature**: Page-specific composition → `src/features/*/components/`

### Naming Conventions

- **Primitives**: `button.tsx`, `input.tsx` (lowercase, single word)
- **Therapeutic**: `therapeutic-button.tsx`, `therapeutic-card.tsx` (prefixed)
- **Specialized**: `cbt-section-card.tsx`, `emotion-card.tsx` (domain-prefixed)
- **Directories**: `therapeutic-cards/`, `therapeutic-forms/` (plural)

### Export Guidelines

```typescript
// Good - public API in index.ts
export { TherapeuticBaseCard } from './base/therapeutic-base-card';
export type { TherapeuticBaseCardProps } from './base/card-types';

// Bad - exporting internal utilities
export { internalHelper } from './internal/helper'; // Don't do this
```

## References

- [Compound Components Pattern](https://kentcdodds.com/blog/compound-components-with-react-hooks)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Class Variance Authority](https://cva.style/docs)
- [React Server Components](https://react.dev/reference/react/use-server)
