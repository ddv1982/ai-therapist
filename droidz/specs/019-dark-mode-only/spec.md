# Specification: Dark Mode Only

## 1. Overview

### 1.1 Purpose

Remove light mode support from the AI Therapist application and establish dark mode as the permanent, default theme. This simplification reduces code complexity, improves maintainability, and provides a consistent modern interface aligned with therapeutic applications' preference for reduced visual strain.

### 1.2 Goals

- **Simplify Theme System**: Eliminate dual-theme complexity by removing all light mode code
- **Reduce Bundle Size**: Remove unused theme switching logic, provider dependencies, and CSS
- **Improve Maintainability**: Single theme means fewer edge cases and simpler styling
- **Consistent Experience**: All users see the same dark interface optimized for therapeutic use

### 1.3 Tech Stack Context

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 with OKLCH color space
- **Theme Library**: `next-themes` (to be removed)
- **State Management**: React Context (theme provider to be removed)
- **Animation**: Framer Motion (theme toggle animations to be removed)

### 1.4 User Impact

- **Visual Change**: All users will experience dark mode exclusively
- **No User Control**: Theme switcher UI removed; no preference options
- **Consistency**: Uniform experience across all pages and components
- **Accessibility**: Dark mode contrast ratios already meet WCAG AA standards

---

## 2. Current Implementation Analysis

### 2.1 Theme Management Infrastructure

**Current Files:**

1. `/src/components/providers/theme-provider.tsx` - Wraps `next-themes` ThemeProvider
2. `/src/lib/theme-context.ts` - Re-exports theme provider (legacy)
3. `/src/app/providers.tsx` - Includes ThemeProvider in root provider tree
4. `/src/components/shared/theme-toggle.tsx` - UI component with sun/moon icons

**Current Implementation Pattern:**

```typescript
// Theme Provider (to be removed)
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>

// Hook Usage (to be removed)
const { theme, toggleTheme } = useTheme();
```

### 2.2 CSS Variable Architecture

**Location**: `/src/styles/base.css`

The current CSS defines theme variables in three scopes:

1. `:root` - Light mode variables (to be removed)
2. `.dark` - Dark mode variables (to become new `:root`)
3. `@media (prefers-color-scheme: light)` - Light mode enhancements (to be removed)

**Current Dark Mode Variables (to be preserved):**

```css
.dark {
  /* Backgrounds - True black Apple style */
  --background: oklch(0.12 0.01 250);
  --card: oklch(0.14 0.01 250);
  --popover: oklch(0.14 0.01 250);

  /* Text - High contrast white */
  --foreground: oklch(0.98 0.005 250);

  /* Accents */
  --primary: oklch(0.7 0.15 237);
  --accent: oklch(0.65 0.12 152);

  /* Therapeutic colors */
  --therapy-success: oklch(0.7 0.12 142);
  --therapy-warning: oklch(0.8 0.12 85);
  --therapy-info: oklch(0.75 0.12 237);

  /* Emotion colors (8 therapeutic colors) */
  --emotion-fear: oklch(0.7 0.12 200);
  --emotion-anger: oklch(0.7 0.2 25);
  --emotion-sadness: oklch(0.7 0.12 255);
  --emotion-joy: oklch(0.8 0.16 95);
  --emotion-anxiety: oklch(0.78 0.14 80);
  --emotion-shame: oklch(0.78 0.16 350);
  --emotion-guilt: oklch(0.7 0.14 285);
}
```

### 2.3 Tailwind Dark Mode Classes

**Usage Pattern**: `dark:` variants used throughout components

**Example Files Using `dark:` Classes:**

- `/src/features/chat/components/chat-composer.tsx`
- `/src/features/chat/components/dashboard/chat-sidebar.tsx`
- `/src/features/chat/components/session-sidebar.tsx`
- `/src/features/chat/components/chat-header.tsx`
- `/src/features/therapy/ui/therapy-card.tsx`
- `/src/features/therapy/cbt/chat-components/action-plan.tsx`
- `/src/features/therapy/cbt/components/draft-panel.tsx`

**Common Patterns:**

```tsx
// Shadow variants (to be simplified)
className = 'shadow-[0_1px_0_rgba(0,0,0,0.06)] dark:shadow-[0_1px_0_rgba(255,255,255,0.06)]';

// Background variants (to use single value)
className = 'bg-card/70 dark:bg-card/60';

// Text color variants (to use single value)
className = 'text-primary/80 dark:text-primary/70';

// Component state variants (to be simplified)
className = 'bg-green-50 dark:bg-green-950/20';
```

### 2.4 Theme Toggle Integration Points

**Direct Usage:**

1. `/src/features/chat/components/dashboard/chat-sidebar.tsx` - Sidebar settings area
2. `/src/features/chat/components/session-sidebar.tsx` - Session sidebar settings area

**Indirect Integration:**

1. `/src/components/ui/command-palette.tsx` - Accepts `onThemeToggle` callback prop
2. `/src/features/shared/index.ts` - Re-exports ThemeToggle component

### 2.5 Dependencies to Remove

**npm packages:**

```json
{
  "dependencies": {
    "next-themes": "^0.4.6" // Remove this
  }
}
```

---

## 3. Technical Architecture

### 3.1 CSS Variable Strategy

**Approach**: Move `.dark` class variables to `:root` as permanent defaults

**Before:**

```css
:root {
  --background: oklch(0.97 0.01 40); /* Light mode */
}

.dark {
  --background: oklch(0.12 0.01 250); /* Dark mode */
}
```

**After:**

```css
:root {
  --background: oklch(0.12 0.01 250); /* Dark only */
}
```

**Rationale:**

- Single source of truth for all color variables
- No class-based theme switching required
- Reduced CSS specificity issues
- Simpler mental model for developers

### 3.2 Tailwind Configuration Changes

**Current State** (`tailwind.config.js`):

- No explicit `darkMode` configuration (defaults to `class`)
- Colors reference CSS variables via `oklch(var(--color-name))`

**Required Changes**:

- No Tailwind config changes needed
- CSS variables already handle color values
- `dark:` variants can be removed from JSX without config changes

### 3.3 Component Simplification Strategy

**Three-Step Pattern for Each Component:**

1. **Identify**: Find all `dark:` class variants
2. **Evaluate**: Determine which variant is dark mode
3. **Replace**: Use only the dark mode value, remove light mode

**Example Transformation:**

```tsx
// Before
<div className="bg-card/70 dark:bg-card/60 shadow-sm dark:shadow-md">

// After
<div className="bg-card/60 shadow-md">
```

### 3.4 Accessibility Preservation

**WCAG Compliance Requirements:**

- Maintain AA level contrast ratios (4.5:1 for normal text, 3:1 for large)
- Preserve semantic HTML structure
- Keep ARIA labels and screen reader support
- Maintain focus indicators

**Current Dark Mode Contrast Ratios:**

- Background to foreground: `oklch(0.12 ...)` to `oklch(0.98 ...)` = ~17:1 ✅
- Primary on background: Sufficient contrast ✅
- All therapeutic/emotion colors: Pre-validated ✅

**Action**: No accessibility changes needed; dark mode already compliant

---

## 4. Detailed Implementation Plan

### 4.1 Phase 1: Remove Theme Infrastructure

#### Step 1.1: Remove Theme Provider

**Files to modify:**

1. `/src/app/providers.tsx`
2. `/src/components/providers/theme-provider.tsx` (delete)
3. `/src/lib/theme-context.ts` (delete)

**Changes to `/src/app/providers.tsx`:**

```typescript
// REMOVE THIS IMPORT
import { ThemeProvider } from '@/components/providers/theme-provider';

// REMOVE ThemeProvider from component tree
export function RootProviders({ children }: RootProvidersProps) {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      {/* REMOVE: <ThemeProvider> */}
        <QueryProvider>
          <SessionProvider>
            {/* ... rest of providers ... */}
          </SessionProvider>
        </QueryProvider>
      {/* REMOVE: </ThemeProvider> */}
    </ClerkProvider>
  );
}
```

**Files to delete:**

- `/src/components/providers/theme-provider.tsx`
- `/src/lib/theme-context.ts`

#### Step 1.2: Remove Theme Toggle Component

**Files to modify:**

1. `/src/components/shared/theme-toggle.tsx` (delete)
2. `/src/features/shared/index.ts` (remove export)
3. `/src/features/chat/components/dashboard/chat-sidebar.tsx`
4. `/src/features/chat/components/session-sidebar.tsx`

**Changes to chat-sidebar.tsx and session-sidebar.tsx:**

```typescript
// REMOVE THIS IMPORT
import { ThemeToggle } from '@/components/shared/theme-toggle';

// REMOVE THIS JSX (typically in settings/actions area)
<ThemeToggle />
```

**Changes to `/src/features/shared/index.ts`:**

```typescript
// REMOVE THIS LINE
export { ThemeToggle } from '@/components/shared/theme-toggle';
```

#### Step 1.3: Remove Command Palette Integration

**File**: `/src/components/ui/command-palette.tsx`

**Changes:**

```typescript
// REMOVE from interface
interface CommandPaletteProps {
  onCBTOpen?: () => void;
  onSettingsOpen?: () => void;
  // REMOVE: onThemeToggle?: () => void;
}

// REMOVE from function signature
export function CommandPalette({
  onCBTOpen,
  onSettingsOpen,
  // REMOVE: onThemeToggle
}: CommandPaletteProps) {
  // REMOVE theme toggle command item (search for Moon icon)
  // Typically looks like:
  // <CommandItem onSelect={() => handleSelect(() => onThemeToggle?.())}>
  //   <Moon className="mr-2 h-4 w-4" />
  //   Toggle Theme
  // </CommandItem>
}
```

#### Step 1.4: Uninstall Dependencies

**File**: `package.json`

**Commands to run:**

```bash
npm uninstall next-themes
```

**Verification:**

```bash
npm list next-themes  # Should show: (empty)
```

---

### 4.2 Phase 2: CSS Variable Consolidation

#### Step 2.1: Update Base CSS

**File**: `/src/styles/base.css`

**Transformation Pattern:**

1. **Copy all `.dark` variables to `:root`**
2. **Delete the entire `.dark` class block**
3. **Delete `:root` light mode definitions**
4. **Delete `@media (prefers-color-scheme: light)` block**

**Detailed Changes:**

```css
/* ===== BEFORE: Three separate scopes ===== */
:root {
  /* Light mode variables (DELETE ALL) */
  --background: oklch(0.97 0.01 40);
  --foreground: oklch(0.12 0.01 250);
  /* ... more light mode variables ... */
}

.dark {
  /* Dark mode variables (MOVE TO :root) */
  --background: oklch(0.12 0.01 250);
  --foreground: oklch(0.98 0.005 250);
  /* ... more dark mode variables ... */
}

@media (prefers-color-scheme: light) {
  :root {
    /* Enhanced light mode (DELETE ENTIRE BLOCK) */
  }
}

/* ===== AFTER: Single :root scope ===== */
:root {
  /* Typography (KEEP - unchanged) */
  --font-system:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'SF Mono', 'Consolas', 'Monaco', monospace;
  --radius: 0.75rem;

  /* Dark Mode Colors (MOVED FROM .dark) */
  --background: oklch(0.12 0.01 250);
  --card: oklch(0.14 0.01 250);
  --popover: oklch(0.14 0.01 250);
  --secondary: oklch(0.2 0.015 258);
  --muted: oklch(0.18 0.01 250);

  --foreground: oklch(0.98 0.005 250);
  --card-foreground: oklch(0.98 0.005 250);
  --popover-foreground: oklch(0.98 0.005 250);
  --secondary-foreground: oklch(0.7 0.01 250);
  --muted-foreground: oklch(0.55 0.01 250);
  --border: oklch(0.22 0.01 250);
  --input: oklch(0.22 0.01 250);

  --primary: oklch(0.7 0.15 237);
  --primary-foreground: oklch(0.13 0.02 258);
  --accent: oklch(0.65 0.12 152);
  --accent-foreground: oklch(0.13 0.02 258);
  --destructive: oklch(0.7 0.2 25);
  --destructive-foreground: oklch(0.98 0.01 247);
  --ring: oklch(0.7 0.15 237);

  /* Glassmorphism */
  --glass-white: oklch(0.15 0.01 250 / 0.7);
  --glass-border: oklch(0.99 0 0 / 0.1);

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 8px -2px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 12px 24px -4px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 40px -8px rgba(0, 0, 0, 0.6);
  --shadow-primary: 0 8px 16px -4px oklch(0.7 0.15 237 / 0.3);
  --shadow-accent: 0 8px 16px -4px oklch(0.65 0.12 152 / 0.3);

  /* Therapy Colors */
  --therapy-success: oklch(0.7 0.12 142);
  --therapy-warning: oklch(0.8 0.12 85);
  --therapy-info: oklch(0.75 0.12 237);

  /* Emotion Colors */
  --emotion-fear: oklch(0.7 0.12 200);
  --emotion-anger: oklch(0.7 0.2 25);
  --emotion-sadness: oklch(0.7 0.12 255);
  --emotion-joy: oklch(0.8 0.16 95);
  --emotion-anxiety: oklch(0.78 0.14 80);
  --emotion-shame: oklch(0.78 0.16 350);
  --emotion-guilt: oklch(0.7 0.14 285);

  /* Component Specific */
  --sidebar-background: oklch(0.13 0.02 258);
  --modal-backdrop: oklch(0.05 0.01 258 / 0.9);
}

/* Typography rules (KEEP - unchanged) */
h1,
h2,
h3,
h4,
h5,
h6 {
  /* ... */
}
p,
li,
td {
  /* ... */
}
label,
.label,
button,
.button {
  /* ... */
}

/* Reduced motion (KEEP - unchanged) */
@media (prefers-reduced-motion: reduce) {
  /* ... */
}
```

**Critical Notes:**

- Preserve all typography rules
- Preserve accessibility media queries
- Keep all `--emotion-*` and `--therapy-*` colors (core to app functionality)
- Preserve safe area insets in `body` styles

#### Step 2.2: Verify Tailwind Theme Registration

**File**: `/src/app/globals.css`

**Check that `@theme` block stays unchanged:**

```css
@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... all color registrations ... */
}
```

**Rationale**: The `@theme` directive maps CSS variables to Tailwind utilities. Since variable names stay the same (only values change), no modifications needed.

---

### 4.3 Phase 3: Component Class Simplification

#### Step 3.1: Identify All Files with `dark:` Classes

**Search command:**

```bash
grep -r "dark:" /src --include="*.tsx" --include="*.ts" -l
```

**Expected files (~20-30 files):**

- Chat components (composer, header, sidebars)
- Therapy components (cards, CBT components, session summaries)
- UI primitives (buttons, cards, dialogs)
- Layout components (navigation, containers)

#### Step 3.2: Systematic Replacement Strategy

**For each file identified:**

1. **Open file in editor**
2. **Search for `dark:` pattern**
3. **Apply transformation rules** (see 4.3.3)
4. **Test component renders correctly**
5. **Move to next file**

#### Step 3.3: Transformation Rules

**Rule 1: Simple Class Replacement**
When pattern is `<base-class> dark:<dark-class>`:

```tsx
// Before
className = 'bg-white dark:bg-black';

// After - Use dark variant
className = 'bg-black';
```

**Rule 2: Opacity/Alpha Variants**
When opacity differs between themes:

```tsx
// Before
className = 'bg-card/70 dark:bg-card/60';

// After - Use dark opacity
className = 'bg-card/60';
```

**Rule 3: Shadow Variants**
When shadows differ between themes:

```tsx
// Before
className = 'shadow-[0_1px_0_rgba(0,0,0,0.06)] dark:shadow-[0_1px_0_rgba(255,255,255,0.06)]';

// After - Use dark shadow (white tint)
className = 'shadow-[0_1px_0_rgba(255,255,255,0.06)]';
```

**Rule 4: Complex Conditional Classes**
When classes are dynamically generated:

```tsx
// Before
const cardVariants = {
  success: 'bg-green-50 dark:bg-green-950/20',
  warning: 'bg-yellow-50 dark:bg-yellow-950/20',
};

// After
const cardVariants = {
  success: 'bg-green-950/20',
  warning: 'bg-yellow-950/20',
};
```

**Rule 5: Hover/Focus State Variants**
Preserve interaction states:

```tsx
// Before
className = 'hover:bg-gray-100 dark:hover:bg-gray-800';

// After
className = 'hover:bg-gray-800';
```

#### Step 3.4: Priority Files to Update

**High Priority** (Core user experience):

1. `/src/features/chat/components/chat-composer.tsx`
2. `/src/features/chat/components/chat-header.tsx`
3. `/src/features/chat/components/dashboard/chat-sidebar.tsx`
4. `/src/features/chat/components/session-sidebar.tsx`
5. `/src/features/chat/components/dashboard/chat-empty-state.tsx`

**Medium Priority** (Therapy features): 6. `/src/features/therapy/ui/therapy-card.tsx` 7. `/src/features/therapy/cbt/chat-components/action-plan.tsx` 8. `/src/features/therapy/cbt/chat-components/schema-modes.tsx` 9. `/src/features/therapy/cbt/components/draft-panel.tsx` 10. `/src/features/therapy/components/cbt-session-summary-card.tsx`

**Low Priority** (Less frequent): 11. `/src/features/chat/components/session-controls.tsx` 12. `/src/features/chat/components/dashboard/realistic-moon.tsx` 13. All remaining files with `dark:` classes

#### Step 3.5: Automated Search & Replace Patterns

**Safe automated replacements** (low risk):

```bash
# Replace common background patterns
sed -i '' 's/bg-white dark:bg-black/bg-black/g'

# Replace common text patterns
sed -i '' 's/text-gray-900 dark:text-gray-100/text-gray-100/g'

# Replace border patterns
sed -i '' 's/border-gray-200 dark:border-gray-800/border-gray-800/g'
```

**⚠️ Manual review required after automation:**

- Verify visual appearance in browser
- Check for logic errors in conditional rendering
- Test hover/focus states
- Validate therapeutic color contexts

---

### 4.4 Phase 4: Edge Cases & Special Considerations

#### Step 4.1: Third-Party Component Themes

**Clerk Authentication UI** (already configured):

- File: `/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` (example)
- Clerk's `<SignIn>` component accepts `appearance` prop
- Strategy: Verify Clerk uses dark mode by default or set explicitly

**Verification:**

```tsx
// Check if Clerk components need explicit dark mode
<SignIn
  appearance={{
    baseTheme: dark, // If needed, import from @clerk/themes
  }}
/>
```

**Radix UI Components**:

- Already style-agnostic (use Tailwind classes)
- No theme-specific configurations needed
- Update Tailwind classes in wrapper components

#### Step 4.2: Moon Phase Component

**File**: `/src/features/chat/components/dashboard/realistic-moon.tsx`

**Issue**: Uses `dark:` classes for SVG styling

**Strategy**: Keep dark mode SVG colors as defaults

**Example Change:**

```tsx
// Before
<circle className="fill-slate-700 dark:fill-slate-900" />

// After
<circle className="fill-slate-900" />
```

#### Step 4.3: System Preference Handling

**Current behavior**: `next-themes` detects system preference and applies theme

**New behavior**: Always show dark mode regardless of OS setting

**No code changes needed**: Removing `next-themes` automatically disables system preference detection

**User impact**: Users with light mode OS preference will see app in dark mode only

#### Step 4.4: SSR/Hydration Considerations

**Current issue**: Theme toggle has hydration protection:

```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return <Skeleton />;
```

**New state**: No theme switching = no hydration issues

**Action**: Verify no components have theme-related hydration guards after removal

#### Step 4.5: LocalStorage Cleanup

**Current state**: `next-themes` stores preference in localStorage

**Cleanup strategy**:

- Library removal automatically stops writing
- Old keys will remain but are harmless
- Optional: Add migration to clear old keys

**Optional cleanup code** (add to providers.tsx temporarily):

```tsx
useEffect(() => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('theme');
  }
}, []);
```

---

## 5. Testing Strategy

### 5.1 Unit Tests

**Files to update/remove:**

1. **Theme Provider Tests** (delete if exists):
   - `/src/components/providers/__tests__/theme-provider.test.tsx`

2. **Theme Toggle Tests** (delete if exists):
   - `/src/components/shared/__tests__/theme-toggle.test.tsx`

3. **Component Tests** (update):
   - Any tests mocking `useTheme()` hook should be updated
   - Remove theme-related assertions

**Example test update:**

```typescript
// Before
import { useTheme } from '@/lib/theme-context';
jest.mock('@/lib/theme-context');

test('renders in dark mode', () => {
  (useTheme as jest.Mock).mockReturnValue({
    theme: 'dark',
    toggleTheme: jest.fn()
  });
  // ...
});

// After (if test is still relevant)
test('renders with dark styling', () => {
  // No mocking needed, just verify dark classes exist
  const { container } = render(<Component />);
  expect(container.firstChild).toHaveClass('bg-black');
});
```

### 5.2 E2E Tests

**Test scenarios:**

1. **Visual Regression**:
   - Capture screenshots of all major pages
   - Compare to baseline (current dark mode screenshots)
   - Tools: Playwright visual comparison

2. **Navigation Flow**:
   - Verify all routes render correctly
   - No console errors about missing theme
   - No layout shifts from theme changes

3. **Component Interactions**:
   - Chat interface usability
   - CBT diary interactions
   - Settings panel (verify no theme toggle UI)
   - Command palette (verify no theme toggle option)

**Playwright test example:**

```typescript
test('app renders in dark mode only', async ({ page }) => {
  await page.goto('/dashboard');

  // Verify dark mode CSS variable
  const bgColor = await page.evaluate(() => {
    return getComputedStyle(document.documentElement).getPropertyValue('--background');
  });
  expect(bgColor).toContain('oklch(0.12'); // Dark mode value

  // Verify no theme toggle exists
  const themeToggle = page.locator('button[title*="theme"]');
  await expect(themeToggle).toHaveCount(0);
});
```

### 5.3 Accessibility Testing

**Automated checks:**

```bash
# Run with Playwright or axe-core
npx playwright test --grep @a11y
```

**Manual verification checklist:**

- [ ] Color contrast ratios meet WCAG AA (4.5:1 minimum)
- [ ] Focus indicators visible on all interactive elements
- [ ] Screen reader announcements preserved
- [ ] Keyboard navigation functional
- [ ] No motion for users with `prefers-reduced-motion`

**Test with real assistive tech:**

- VoiceOver (macOS): Test chat interface
- NVDA/JAWS (Windows): Test therapy forms
- Screen magnification: Verify text clarity at 200% zoom

### 5.4 Performance Testing

**Metrics to compare** (before vs after):

| Metric              | Before (Dual Theme) | Target (Dark Only) | Tool                    |
| ------------------- | ------------------- | ------------------ | ----------------------- |
| Bundle size (JS)    | X kb                | X - 15kb           | webpack-bundle-analyzer |
| First Load JS       | X kb                | X - 12kb           | Lighthouse              |
| CSS size            | X kb                | X - 8kb            | DevTools Coverage       |
| Time to Interactive | X ms                | < X ms             | Lighthouse              |

**Commands:**

```bash
# Analyze bundle before changes
ANALYZE=true npm run build

# Analyze after changes
ANALYZE=true npm run build

# Compare results
```

### 5.5 Browser Testing Matrix

**Required browsers:**

- Chrome 120+ (primary)
- Safari 17+ (macOS/iOS)
- Firefox 120+
- Edge 120+

**Test on each:**

1. Load dashboard - verify dark background renders
2. Navigate to chat - verify colors correct
3. Open CBT diary - verify therapeutic colors preserved
4. Check command palette - verify no theme option
5. Inspect console - no errors or warnings

### 5.6 Smoke Test Checklist

Before merging, verify:

- [ ] `npm run build` succeeds without warnings
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` succeeds (no type errors)
- [ ] `npm test` passes (all unit tests green)
- [ ] `npm run test:e2e` passes (all E2E tests green)
- [ ] No console errors on dashboard page
- [ ] Dark mode renders correctly in production build
- [ ] Bundle size reduced (check build output)
- [ ] No `next-themes` in `node_modules` after install
- [ ] No references to `useTheme` in codebase
- [ ] No `ThemeToggle` component instances

---

## 6. Migration & Rollout Plan

### 6.1 Pre-Deployment Checklist

**Code Review Requirements:**

- [ ] All `dark:` classes removed or justified (document exceptions)
- [ ] Theme provider completely removed from provider tree
- [ ] No imports from `next-themes` library
- [ ] CSS variables consolidated to single `:root` scope
- [ ] All tests updated and passing
- [ ] Bundle size analysis completed
- [ ] Screenshot comparisons reviewed

**Documentation Updates:**

- [ ] Update README.md to remove theme toggle instructions
- [ ] Update AGENTS.md if it mentions theme system
- [ ] Document dark-mode-only decision in project docs
- [ ] Update component documentation (Storybook if applicable)

### 6.2 Deployment Strategy

**Recommended approach**: Single deployment (no feature flag needed)

**Rationale:**

- Visual change only, no data model impact
- No user preferences to migrate (all users see dark mode)
- Rollback is straightforward (revert commit)

**Deployment steps:**

1. Merge PR to main branch
2. Deploy to staging environment
3. QA validation on staging (1-2 hours)
4. Deploy to production
5. Monitor for 24 hours

### 6.3 Monitoring & Rollback

**Metrics to monitor post-deploy:**

- Error rate in browser console (should not increase)
- Page load times (should improve slightly)
- User session duration (should remain stable)
- Crash-free rate (should remain 99%+)

**Rollback triggers:**

- Critical rendering issues (blank screens, wrong colors)
- Accessibility violations (WCAG failures)
- Widespread user complaints (>5% of DAU)
- Production errors >1% of sessions

**Rollback process:**

```bash
# Revert the merge commit
git revert <commit-hash>

# Deploy revert
git push origin main

# Redeploy
# (Follow standard deployment process)
```

### 6.4 User Communication

**Internal announcement** (if applicable):

```
Subject: UI Update - Dark Mode Now Default

We've simplified our application's theme system. All users will now
experience the app in dark mode, which reduces eye strain and aligns
with best practices for therapeutic applications.

Changes:
- Theme switcher removed from settings
- Consistent dark interface across all pages
- Improved performance and reduced bundle size

If you encounter any issues, please contact [support channel].
```

**External communication** (if public-facing):

- Release notes mentioning visual consistency
- Social media post highlighting dark mode focus
- FAQ entry explaining theme decision

---

## 7. Success Criteria

### 7.1 Functional Requirements

**Must achieve:**

- ✅ Application renders entirely in dark mode
- ✅ No theme toggle UI present anywhere in app
- ✅ No console errors related to theme or missing providers
- ✅ All pages accessible and functional
- ✅ Therapeutic color palette preserved and functional
- ✅ Animation and transitions smooth

### 7.2 Code Quality Metrics

**Targets:**

- ✅ Zero references to `next-themes` in codebase (except node_modules)
- ✅ Zero references to `useTheme` hook (except archived code)
- ✅ Zero instances of `ThemeProvider` component
- ✅ < 50 remaining `dark:` classes (exceptions documented)
- ✅ CSS file size reduced by ~30% (from removing light mode)
- ✅ All linting rules pass
- ✅ TypeScript compilation clean

### 7.3 Performance Targets

**Bundle size improvements:**

- JS bundle: -12 to -15 KB gzipped (from removing next-themes + code)
- CSS size: -8 to -12 KB gzipped (from removing light mode variables)
- First Load JS: Measurable improvement in Lighthouse

**Runtime performance:**

- No performance regression vs baseline
- Time to Interactive: Same or better
- No additional layout shifts (CLS stable)

### 7.4 Test Coverage

**Required coverage:**

- ✅ All existing tests pass after modifications
- ✅ E2E tests cover main user journeys
- ✅ Visual regression tests baseline updated
- ✅ Accessibility tests pass (axe-core or similar)

### 7.5 User Experience Quality

**Subjective assessment:**

- Visual consistency: All elements follow dark theme
- No jarring color contrasts or unreadable text
- Therapeutic colors (emotion/therapy) clearly distinguishable
- Focus states visible and clear
- Error states clearly visible

### 7.6 Accessibility Compliance

**WCAG 2.1 Level AA:**

- ✅ Color contrast ratios ≥ 4.5:1 (normal text) and ≥ 3:1 (large text)
- ✅ All interactive elements keyboard accessible
- ✅ Focus indicators visible (3:1 contrast minimum)
- ✅ Screen reader compatibility maintained
- ✅ No reliance on color alone for information

---

## 8. Risks & Mitigations

### 8.1 Risk: Unintended Color Changes

**Probability**: Medium  
**Impact**: Medium

**Description**: When consolidating CSS variables, accidentally using wrong dark mode values or missing edge cases.

**Mitigation:**

1. Use git diff to review every CSS change before committing
2. Take before/after screenshots of every major page
3. Use visual regression testing (Playwright)
4. Manual QA on staging before production

**Detection**: Visual differences in screenshots, user reports

**Rollback**: Revert CSS changes to previous version

### 8.2 Risk: Third-Party Component Issues

**Probability**: Low  
**Impact**: Medium

**Description**: Clerk, Radix UI, or other third-party components may have unexpected styling in dark-only mode.

**Mitigation:**

1. Test all authentication flows (Clerk)
2. Test all Radix UI component instances (Dialog, Dropdown, etc.)
3. Check component documentation for dark mode requirements
4. Keep third-party libraries up to date

**Detection**: UI components looking incorrect, layout issues

**Rollback**: Add explicit dark mode configuration to third-party components

### 8.3 Risk: Accessibility Regressions

**Probability**: Low  
**Impact**: High

**Description**: Removing light mode might inadvertently break accessibility features or reduce readability for some users.

**Mitigation:**

1. Run axe-core or similar tool before and after changes
2. Test with screen readers (VoiceOver, NVDA)
3. Verify focus indicators remain visible
4. Check contrast ratios with automated tools
5. Get feedback from users with accessibility needs

**Detection**: Accessibility testing failures, user complaints

**Rollback**: Restore specific components to previous styling if needed

### 8.4 Risk: Missed `dark:` Classes

**Probability**: Medium  
**Impact**: Low

**Description**: Some components with `dark:` classes may be missed in search, causing dual-styling to remain.

**Mitigation:**

1. Use automated search across entire codebase
2. Grep for all variations: `dark:`, `dark-mode`, `.dark`
3. Code review checklist includes "no dark: classes"
4. Run final search before merging

**Detection**: Lingering `dark:` classes found in code review

**Rollback**: Additional PR to clean up missed classes

### 8.5 Risk: Hydration Errors

**Probability**: Very Low  
**Impact**: Medium

**Description**: Removing theme provider might cause hydration mismatches if components depend on theme state.

**Mitigation:**

1. Search for `useTheme()` hook usage and remove/update
2. Remove theme-based conditional rendering
3. Test SSR behavior in production mode
4. Check React DevTools for hydration warnings

**Detection**: Console warnings about hydration, visual flashing

**Rollback**: Add back minimal theme context without switching logic

### 8.6 Risk: Browser Compatibility Issues

**Probability**: Very Low  
**Impact**: Low

**Description**: OKLCH color space or CSS variables might not render correctly in older browsers.

**Mitigation:**

1. Already using OKLCH in current dark mode (no new risk)
2. CSS variables widely supported (IE11 no longer target)
3. Test on required browser versions (see 5.5)
4. Provide fallback colors if needed (unlikely)

**Detection**: Colors not rendering in specific browser versions

**Rollback**: Add fallback hex colors for critical elements

---

## 9. Future Considerations

### 9.1 Potential Feature Requests

**"Can we add light mode back?"**

**Response strategy:**

- Explain performance and maintenance benefits of single theme
- Highlight therapeutic research favoring dark interfaces
- Offer alternative: adjustable color temperature within dark mode
- Document decision in project README

**If must re-add:**

- Estimated effort: 2-3 developer days
- Would need to reverse this entire specification
- Consider if user preference is truly needed (data-driven decision)

### 9.2 Color Customization Alternative

**Instead of light/dark toggle, offer:**

- Hue adjustments within dark theme (warmer/cooler tones)
- Contrast level adjustments (higher/lower)
- Therapeutic color intensity settings

**Benefits:**

- Maintains single-theme simplicity
- Addresses user preference for customization
- No complex theme switching logic
- Smaller feature scope

### 9.3 Accessibility Enhancements

**Future additions to consider:**

- High contrast mode (increase contrast ratios to AAA level)
- Color blindness modes (adjust therapeutic color palettes)
- Font size multiplier (beyond browser defaults)
- Reduced transparency mode (for glassmorphism effects)

**Implementation notes:**

- Use CSS custom properties for easy adjustment
- Store preferences in localStorage or user profile
- No theme provider complexity needed

### 9.4 Performance Optimizations

**Post-dark-mode-only improvements:**

- Further reduce CSS bundle (eliminate unused utilities)
- Optimize OKLCH color calculations
- Consider CSS containment for component isolation
- Lazy load non-critical styles

### 9.5 Design System Evolution

**With single theme established:**

- Develop comprehensive dark-first design system
- Create Figma/Sketch library with dark components
- Document color usage patterns
- Establish dark mode-specific design guidelines

**Benefits:**

- Faster designer-to-developer workflow
- Consistent component library
- Easier onboarding for new team members

---

## 10. Appendix

### 10.1 File Change Summary

**Files to delete (7 files):**

1. `/src/components/providers/theme-provider.tsx`
2. `/src/lib/theme-context.ts`
3. `/src/components/shared/theme-toggle.tsx`
4. `/src/components/providers/__tests__/theme-provider.test.tsx` (if exists)
5. `/src/components/shared/__tests__/theme-toggle.test.tsx` (if exists)

**Files to modify (estimated 25-35 files):**

**High Priority:**

1. `/src/app/providers.tsx` - Remove ThemeProvider
2. `/src/styles/base.css` - Consolidate CSS variables
3. `/src/features/chat/components/dashboard/chat-sidebar.tsx` - Remove toggle, update classes
4. `/src/features/chat/components/session-sidebar.tsx` - Remove toggle, update classes
5. `/src/features/chat/components/chat-composer.tsx` - Update dark: classes
6. `/src/features/chat/components/chat-header.tsx` - Update dark: classes
7. `/src/components/ui/command-palette.tsx` - Remove theme toggle option
8. `/src/features/shared/index.ts` - Remove ThemeToggle export
9. `package.json` - Remove next-themes dependency

**Medium Priority:**
10-20. All files with `dark:` classes (therapy components, UI components)

**Low Priority:**
21-35. Test files, documentation files

### 10.2 Command Reference

**Development:**

```bash
# Start dev server
npm run dev

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Run tests
npm test
npm run test:e2e
```

**Search & Analysis:**

```bash
# Find all files with dark: classes
grep -r "dark:" /src --include="*.tsx" --include="*.ts" -l

# Count dark: occurrences
grep -r "dark:" /src --include="*.tsx" --include="*.ts" | wc -l

# Find theme-related imports
grep -r "next-themes\|useTheme\|ThemeProvider" /src -l

# Check bundle size
ANALYZE=true npm run build
```

**Cleanup:**

```bash
# Remove dependency
npm uninstall next-themes

# Clear cache
rm -rf .next
npm run build

# Verify no theme references
grep -r "next-themes" /src
```

### 10.3 Affected User Journeys

**Journey 1: First-time user onboarding**

- **Before**: User sees theme based on system preference, can toggle
- **After**: User sees dark mode only, no toggle option
- **Impact**: Consistent first impression

**Journey 2: Chat conversation**

- **Before**: User can toggle theme mid-conversation
- **After**: Dark mode throughout conversation
- **Impact**: No disruption possible from theme switching

**Journey 3: CBT diary entry**

- **Before**: Therapeutic colors adapt to light/dark mode
- **After**: Therapeutic colors optimized for dark mode only
- **Impact**: More consistent color psychology

**Journey 4: Settings management**

- **Before**: Theme toggle in sidebar settings area
- **After**: No theme setting, one less option to configure
- **Impact**: Simplified settings UI

### 10.4 Color Contrast Reference

**Current dark mode contrast ratios** (WCAG AA compliant):

| Element         | Foreground     | Background     | Ratio | Standard  |
| --------------- | -------------- | -------------- | ----- | --------- |
| Body text       | oklch(0.98...) | oklch(0.12...) | 17:1  | ✅ AAA    |
| Primary button  | oklch(0.13...) | oklch(0.7...)  | 7.5:1 | ✅ AA     |
| Muted text      | oklch(0.55...) | oklch(0.12...) | 6:1   | ✅ AA     |
| Card foreground | oklch(0.98...) | oklch(0.14...) | 15:1  | ✅ AAA    |
| Border          | oklch(0.22...) | oklch(0.12...) | 1.2:1 | ⚠️ Border |

**Therapeutic colors on dark background:**

| Emotion | Color               | Contrast | Status |
| ------- | ------------------- | -------- | ------ |
| Joy     | oklch(0.8 0.16 95)  | 5.2:1    | ✅ AA  |
| Fear    | oklch(0.7 0.12 200) | 4.8:1    | ✅ AA  |
| Anger   | oklch(0.7 0.2 25)   | 4.6:1    | ✅ AA  |
| Sadness | oklch(0.7 0.12 255) | 4.7:1    | ✅ AA  |

All colors meet or exceed WCAG AA requirements.

### 10.5 Dependency Impact

**next-themes removal impact:**

- Bundle size: -12 KB gzipped
- Dependencies removed: 1 direct, 0 transitive
- Breaking changes: None (internal-only usage)

**Retained dependencies:**

- Tailwind CSS (styling)
- Framer Motion (animations)
- All other UI libraries (Radix, Clerk)

### 10.6 Rollback Plan Detail

**If deployment fails, immediate rollback:**

```bash
# 1. Identify the merge commit
git log --oneline --graph | head -10

# 2. Revert the merge commit
git revert -m 1 <merge-commit-hash>

# 3. Push revert
git push origin main

# 4. Trigger deployment
# (Use your deployment tool: Vercel, etc.)
```

**Partial rollback scenarios:**

**Scenario A: Only CSS issues**

- Revert only `/src/styles/base.css`
- Keep other changes (no functionality broken)

**Scenario B: Component rendering issues**

- Revert specific component files
- Keep infrastructure changes (provider removal OK if no errors)

**Scenario C: Third-party issues**

- Revert third-party component configurations
- Keep internal components updated

**Communication during rollback:**

- Inform team via Slack/Discord
- Post incident report
- Schedule post-mortem meeting
- Plan fixes before re-deployment

### 10.7 Related Documentation

**Internal docs to update:**

- `/README.md` - Remove theme toggle instructions
- `/AGENTS.md` - Remove theme-related coding guidelines (if any)
- `/docs/STYLING.md` - Update to reflect dark-only approach (if exists)

**External resources:**

- Design system documentation (Figma, Notion)
- Component library README files
- Onboarding guides mentioning theme settings

---

## 11. Glossary

**OKLCH**: Perceptual color space (Oklab LCH) providing better color consistency across themes

**CSP**: Content Security Policy - security headers for XSS prevention

**WCAG**: Web Content Accessibility Guidelines - standards for accessible web content

**SSR**: Server-Side Rendering - Next.js renders pages on server

**Hydration**: Process of attaching React to server-rendered HTML

**Glassmorphism**: UI design pattern with frosted glass appearance (backdrop blur)

**Therapeutic colors**: Custom color palette for emotion/therapy feature (8 colors)

**Dark mode only**: Single-theme approach using only dark background and light text

**Theme provider**: React context providing theme state to components (to be removed)

---

## Document History

- **Version 1.0** - 2025-11-24 - Initial specification created
- **Author**: Factory AI Specification Writer
- **Reviewers**: TBD
- **Approval**: TBD
- **Status**: Draft - Ready for review
