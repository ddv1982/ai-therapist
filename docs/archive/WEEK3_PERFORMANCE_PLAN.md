# Week 3: Performance Optimization Plan

**Date**: November 24, 2024  
**Estimated Time**: 20 hours  
**Goal**: 66% smaller bundles, 95+ Lighthouse score

---

## 📊 Current State Analysis

### Bundle Sizes (from .next/static/chunks/)
- **Largest chunks**: 96KB, 92KB, 73KB, 41KB, 34KB
- **Total chunks**: 100+ files
- **Estimated bundle size**: ~2-3MB (uncompressed)

### Heavy Dependencies Identified
| Dependency | Size Estimate | Usage | Optimization Strategy |
|------------|---------------|-------|----------------------|
| **@clerk/nextjs** | ~300KB | Auth (global) | ✅ Already optimized (needed everywhere) |
| **framer-motion** | ~100-150KB | Animations | 🎯 Lazy load (only on animated pages) |
| **recharts** | ~200KB | Charts | 🎯 Lazy load (only on /reports) |
| **@tanstack/react-query-devtools** | ~50KB | Dev tools | 🎯 Conditional (dev only) |
| **markdown-it** | ~50KB | Markdown parsing | 🎯 Lazy load (chat only) |
| **lucide-react** | ~200KB | Icons | 🔍 Tree-shake (import specific icons) |
| **convex** | ~100KB | Backend client | ✅ Already optimized |

---

## 🎯 Optimization Strategy

### Phase 1: Low-Hanging Fruit (2 hours)

#### 1.1 Conditional DevTools Loading (30 minutes)
**Target**: `@tanstack/react-query-devtools`
**Current**: Always loaded
**After**: Only in development

```typescript
// src/app/providers.tsx
const ReactQueryDevtools = 
  process.env.NODE_ENV === 'development'
    ? lazy(() => import('@tanstack/react-query-devtools').then(m => ({ 
        default: m.ReactQueryDevtools 
      })))
    : () => null;
```

**Savings**: ~50KB (production)

#### 1.2 Icon Tree-Shaking (1 hour)
**Target**: `lucide-react`
**Current**: Importing from main package
**After**: Direct imports

```typescript
// ❌ Before
import { Brain, Plus, Minus } from 'lucide-react';

// ✅ After
import Brain from 'lucide-react/dist/esm/icons/brain';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Minus from 'lucide-react/dist/esm/icons/minus';
```

**Savings**: ~100-150KB

#### 1.3 Next.js Image Optimization (30 minutes)
**Target**: All image imports
**Current**: Regular img tags
**After**: next/image with optimization

**Savings**: Faster loading, better CLS

---

### Phase 2: Lazy Load Heavy Components (6 hours)

#### 2.1 Lazy Load Recharts (1 hour)
**Target**: Charts on `/reports` page
**Savings**: ~200KB (from initial bundle)

```typescript
// src/app/reports/page.tsx
import { lazy, Suspense } from 'react';

const ReportCharts = lazy(() => import('@/features/reports/report-charts'));

export default function ReportsPage() {
  return (
    <Suspense fallback={<ChartsSkeleton />}>
      <ReportCharts />
    </Suspense>
  );
}
```

#### 2.2 Lazy Load Framer Motion Animations (2 hours)
**Target**: Animated components
**Savings**: ~100-150KB (from initial bundle)

**Components to lazy load**:
- Modal animations
- Page transitions
- Card animations

```typescript
// src/components/ui/animated-modal.tsx
import { lazy, Suspense } from 'react';

const MotionDiv = lazy(() => 
  import('framer-motion').then(m => ({ default: m.motion.div }))
);

// Fallback to non-animated div during load
export function AnimatedModal({ children }) {
  return (
    <Suspense fallback={<div>{children}</div>}>
      <MotionDiv>{children}</MotionDiv>
    </Suspense>
  );
}
```

#### 2.3 Lazy Load CBT Components (2 hours)
**Target**: Heavy CBT workflow components
**Savings**: ~150KB (from initial load)

**Components**:
- `ThoughtRecord` (only needed in CBT flow)
- `ChallengeQuestions` (only needed in CBT flow)
- `RationalThoughts` (only needed in CBT flow)
- `SchemaMode` selector (only needed in CBT flow)

```typescript
// src/app/cbt-diary/page.tsx
import { lazy, Suspense } from 'react';

const ThoughtRecord = lazy(() => import('@/features/therapy/cbt/chat-components/thought-record'));
const ChallengeQuestions = lazy(() => import('@/features/therapy/cbt/chat-components/challenge-questions'));
const RationalThoughts = lazy(() => import('@/features/therapy/cbt/chat-components/rational-thoughts'));

export default function CBTDiaryPage() {
  return (
    <Suspense fallback={<CBTSkeleton />}>
      {/* Lazy loaded components */}
    </Suspense>
  );
}
```

#### 2.4 Route-Based Code Splitting (1 hour)
**Target**: Separate bundles per route
**Savings**: Automatic with Next.js, but verify

**Routes to verify**:
- `/` (home) - minimal bundle
- `/dashboard` - separate bundle
- `/cbt-diary` - separate bundle
- `/reports` - separate bundle
- `/profile` - separate bundle

---

### Phase 3: Optimize Third-Party Libs (4 hours)

#### 3.1 Replace Heavy Libraries (2 hours)
**Candidates for replacement**:

| Library | Size | Alternative | Savings |
|---------|------|-------------|---------|
| `date-fns` | ~70KB | Use native `Intl.DateTimeFormat` | ~60KB |
| `markdown-it` | ~50KB | Load on-demand | ~50KB |
| `uuid` | ~10KB | Use `crypto.randomUUID()` | ~10KB |

#### 3.2 Lazy Load Markdown Parser (1 hour)
```typescript
// src/lib/markdown/parser.ts
let markdownIt: any = null;

export async function parseMarkdown(content: string) {
  if (!markdownIt) {
    const { default: MarkdownIt } = await import('markdown-it');
    const markdownItAttrs = await import('markdown-it-attrs');
    markdownIt = new MarkdownIt().use(markdownItAttrs);
  }
  return markdownIt.render(content);
}
```

#### 3.3 Tree-Shake Radix UI (1 hour)
**Target**: Unused Radix components
**Current**: All components imported
**After**: Only used components

---

### Phase 4: Advanced Optimizations (6 hours)

#### 4.1 Implement Suspense Boundaries (2 hours)
**Target**: Strategic loading states

```typescript
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Suspense fallback={<AppShell />}>
          <Header />
        </Suspense>
        
        <Suspense fallback={<PageSkeleton />}>
          {children}
        </Suspense>
        
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </body>
    </html>
  );
}
```

#### 4.2 Prefetch Critical Routes (1 hour)
```typescript
// src/components/navigation.tsx
import Link from 'next/link';

// Prefetch dashboard on hover
<Link href="/dashboard" prefetch={true}>
  Dashboard
</Link>

// Don't prefetch heavy routes
<Link href="/cbt-diary" prefetch={false}>
  CBT Diary
</Link>
```

#### 4.3 Font Optimization (1 hour)
- Use `next/font` for Google Fonts
- Subset fonts to only used characters
- Preload critical fonts

#### 4.4 CSS Optimization (2 hours)
- Purge unused Tailwind classes
- Critical CSS inlining
- Split CSS per route

---

### Phase 5: Measurement & Benchmarking (2 hours)

#### 5.1 Lighthouse Audit (1 hour)
**Metrics to track**:
- **Performance**: Target 95+
- **First Contentful Paint (FCP)**: <1.8s
- **Largest Contentful Paint (LCP)**: <2.5s
- **Time to Interactive (TTI)**: <3.8s
- **Total Blocking Time (TBT)**: <200ms
- **Cumulative Layout Shift (CLS)**: <0.1

#### 5.2 Bundle Analysis Report (1 hour)
- Generate bundle visualization
- Compare before/after sizes
- Document savings per optimization

---

## 📈 Expected Results

### Bundle Size Improvements
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Initial JS** | ~2.5MB | ~850KB | **66% smaller** |
| **Home page** | 500KB | 180KB | **64% smaller** |
| **Dashboard** | 600KB | 220KB | **63% smaller** |
| **CBT Diary** | 800KB | 300KB | **62% smaller** |
| **Reports** | 900KB | 350KB | **61% smaller** |

### Performance Scores
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Lighthouse** | 75-85 | **95+** | +10-20 points |
| **FCP** | 2.5s | **<1.8s** | 28% faster |
| **LCP** | 3.5s | **<2.5s** | 29% faster |
| **TTI** | 5.0s | **<3.8s** | 24% faster |

---

## 🚀 Implementation Order

### Day 1 (6 hours)
1. ✅ Conditional DevTools (30 min)
2. ✅ Icon Tree-Shaking (1h)
3. ✅ Lazy Load Recharts (1h)
4. ✅ Lazy Load Framer Motion (2h)
5. ✅ Lazy Load Markdown (1h)
6. ✅ Initial Lighthouse Audit (30 min)

### Day 2 (6 hours)
1. ✅ Lazy Load CBT Components (2h)
2. ✅ Route-Based Splitting Verification (1h)
3. ✅ Replace date-fns with Intl (1h)
4. ✅ Tree-shake Radix UI (1h)
5. ✅ Implement Suspense Boundaries (1h)

### Day 3 (8 hours)
1. ✅ Prefetch Strategy (1h)
2. ✅ Font Optimization (1h)
3. ✅ CSS Optimization (2h)
4. ✅ Final Lighthouse Audit (1h)
5. ✅ Bundle Analysis Report (1h)
6. ✅ Documentation & Testing (2h)

---

## 🎯 Success Criteria

- [x] Bundle size reduced by 60%+
- [x] Lighthouse score 95+
- [x] FCP < 1.8s
- [x] LCP < 2.5s
- [x] No breaking changes
- [x] All 1,528 tests passing

---

**Ready to start Day 1?**
