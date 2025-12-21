# Components

## Overview
Guidelines for React 19 components in Next.js 16 App Router using feature-first structure and shadcn/ui + CVA.

## When to Apply
- Components in `src/features/*/components` or `src/components/ui`
- Server vs client decisions
- Accessibility and composition patterns

## Core Principles
1. **Server by default**: Prefer Server Components; use `'use client'` only for interactivity/state/refs.
2. **Client leaves**: Keep client components thin; fetch data server-side.
3. **Accessible**: Semantic roles/labels; align with RTL queries.
4. **Composable**: Use CVA for variants; reuse shadcn/ui primitives.
5. **Typed props**: Explicit prop types; avoid `any`.

## ✅ DO
### Server vs client
**✅ DO**:
```tsx
// Server component
export default async function Page() {
  const reports = await getReports();
  return <ReportsClient initialReports={reports} />;
}

// Client leaf
'use client';
export function ReportsClient({ initialReports }: { initialReports: Report[] }) {
  const [reports] = useState(initialReports);
  return <ReportList reports={reports} />;
}
```

### CVA variants
**✅ DO**:
```ts
const badgeVariants = cva('inline-flex items-center rounded px-2 py-1 text-xs', {
  variants: { tone: { info: 'bg-blue-100 text-blue-800', danger: 'bg-red-100 text-red-800' } },
  defaultVariants: { tone: 'info' },
});
```

### Accessibility
**✅ DO**: Provide aria and roles.
```tsx
<button aria-label="Open session" onClick={onOpen} className="btn">Open</button>
```

### Typed props
**✅ DO**: Explicit prop types.
```ts
type SessionCardProps = { title: string; createdAt: string; onSelect: () => void };
```

### Reuse primitives
**✅ DO**: Use `@/components/ui` for Dialog/Button/Input rather than bespoke elements.

## ❌ DON'T
### Client-first pages
**❌ DON'T**: Add `'use client'` to top-level pages without need.

### Variant sprawl
**❌ DON'T**: Hardcode style branches instead of CVA.

### Missing aria
**❌ DON'T**: Omit labels on controls.

### Inline business logic
**❌ DON'T**: Call services inside render; move to hooks/server.

### Layout shifts
**❌ DON'T**: Render images without dimensions; avoid CLS.

## Patterns & Examples
### Pattern: Dialog with client interactivity
```tsx
'use client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export function SessionDialog({ open, onOpenChange, session }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{session.title}</DialogTitle>
        <p>{session.summary}</p>
      </DialogContent>
    </Dialog>
  );
}
```

### Pattern: Loading states
Use `loading.tsx` per route; prefer skeletons from `src/components/ui`.

## Common Mistakes
1. Marking everything client-side → hydration cost.
2. Duplicating primitives → reuse shadcn/ui.
3. Ignoring focus management in modals/menus → rely on Radix props.
4. Passing huge objects to client components → trim or memoize.
5. Missing `key` on lists → rendering bugs.

## Testing Standards
- RTL with role-based queries; assert accessibility.
- Snapshot only small, stable primitives.
- Playwright for critical dialogs/menus flows.

## Resources
- Next.js App Router components
- shadcn/ui + Tailwind v4
- Radix UI accessibility
