# Styles Structure

This project previously had a very large `globals.css`.  
It has now been modularized for clarity and maintainability.

## Structure

- **globals.css**  
  Entry point that imports all modular CSS files.  
  Imported in `src/app/layout.tsx`.

- **base.css**  
  Tailwind base layer, resets, root variables, dark mode variables.

- **typography.css**  
  Global typography rules, therapeutic content text improvements, lists, blockquotes.

- **layout.css**  
  Global layout rules, scroll/viewport fixes, safe-area insets, responsive adjustments.

- **components.css**  
  Shared component classes (buttons, modals, forms, chat message content, therapeutic cards, tables, streaming animations).

- **utilities.css**  
  Custom utility classes, spacing helpers, gradient text, shimmer effects, scrollbar styling.

- **markdown.css**  
  Imported from `src/components/ui/markdown-styles.css`.

## Guidelines

- **Global styles** (resets, variables, typography) → `base.css` / `typography.css`.
- **Shared UI patterns** (buttons, modals, forms, chat bubbles) → `components.css`.
- **Layout rules** (scrolling, safe-area, viewport fixes) → `layout.css`.
- **One-off helpers** (spacing utilities, shimmer, gradient text) → `utilities.css`.
- **Component-specific styles** → co-located `ComponentName.module.css`.

This separation ensures:

- Easier navigation and maintenance.
- Reduced risk of unintended global overrides.
- Better alignment with Tailwind’s utility-first approach.
