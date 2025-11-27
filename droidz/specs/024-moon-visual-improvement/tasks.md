# Moon Visual Improvement - Tasks

## Overview

Enhance the moon visual in the AI Therapist dashboard with artistic improvements to craters and lighting.

**Target File:** `src/features/chat/components/dashboard/realistic-moon.tsx`  
**Estimated Effort:** ~2 hours  
**Package Manager:** npm

---

## Phase 1: Crater Pattern Improvement

### Task 1.1: Update Crater Pattern Definition

- [x] Locate the `<pattern id="craters">` definition (lines ~145-163)
- [x] Replace circles with ellipses for organic shapes
- [x] Increase pattern size from 50x50 to 60x60 to reduce visible repetition
- [x] Add varied crater sizes (large, medium, small, tiny)

### Task 1.2: Add Crater Shadows and Depth

- [x] Add outer rim highlight (lighter ellipse offset up)
- [x] Add crater bowl (main shape)
- [x] Add inner shadow (darker ellipse offset down-left)
- [x] Apply layered shadow technique to large and medium craters

### Task 1.3: Verify Crater Appearance

- [ ] View moon at different phases (new, quarter, full, waning)
- [ ] Confirm no visible grid pattern
- [ ] Check opacity values look natural

**Verification:**

```bash
npm run dev
# Navigate to dashboard, observe moon at different times
```

---

## Phase 2: Lighting Gradient Enhancement

### Task 2.1: Update Primary Sphere Gradient

- [x] Locate `<radialGradient id="moon-sphere">` (lines ~165-173)
- [x] Increase gradient stops from 5 to 8 for smoother transitions
- [x] Shift center from 45%,45% to 40%,40%
- [x] Increase radius from 55% to 60%
- [x] Update color stops: slate-50 → slate-600 progression

### Task 2.2: Add Highlight Accent Gradient

- [x] Create new `<radialGradient id="highlight-accent">`
- [x] Position at 30%,30% with 40% radius
- [x] Use white/20 → white/5 → transparent stops
- [x] Add corresponding `<path>` using this gradient on lit portion

### Task 2.3: Add Limb Darkening Gradient

- [x] Create new `<radialGradient id="limb-darkening">`
- [x] Position at center (50%,50%) with 50% radius
- [x] Create edge darkening effect (transparent → black/30)
- [x] Add corresponding `<circle>` overlay

### Task 2.4: Add Atmospheric Glow Edge

- [x] Create new `<radialGradient id="atmo-glow">`
- [x] Create subtle primary color edge glow
- [x] Add corresponding `<circle>` overlay

**Verification:**

```bash
npm run dev
# Check lighting appears more 3D and spherical
# Verify terminator line is softer
```

---

## Phase 3: Surface Texture Filter

### Task 3.1: Create Turbulence Filter

- [x] Add new `<filter id="moon-texture">` to defs section
- [x] Add `<feTurbulence>` with fractalNoise type
- [x] Set baseFrequency="0.04 0.08" for asymmetric texture
- [x] Set numOctaves="4" for complexity
- [x] Add `<feBlend>` with overlay mode
- [x] Add `<feGaussianBlur>` to soften

### Task 3.2: Apply Filter to Craters

- [x] Wrap crater pattern path in `<g filter="url(#moon-texture)">`
- [x] Adjust crater opacity to work with filter (try 50%)
- [x] Ensure mix-blend-mode="multiply" still applies

### Task 3.3: Test Filter Performance

- [ ] Test on desktop Chrome, Safari, Firefox
- [ ] Test on mobile Safari (iOS)
- [ ] Test on Chrome Android
- [ ] If performance issues, add conditional rendering:
  ```tsx
  const skipFilter = prefersReducedMotion || isLowPerfDevice();
  ```

**Verification:**

```bash
npm run dev
# Test on multiple devices/browsers
# Check for any animation lag
```

---

## Phase 4: Polish and Testing

### Task 4.1: Visual QA All Moon Phases

- [ ] Test New Moon (fraction ~0)
- [ ] Test Waxing Crescent (fraction ~0.1)
- [ ] Test First Quarter (fraction ~0.25)
- [ ] Test Waxing Gibbous (fraction ~0.4)
- [ ] Test Full Moon (fraction ~0.5)
- [ ] Test Waning Gibbous (fraction ~0.6)
- [ ] Test Last Quarter (fraction ~0.75)
- [ ] Test Waning Crescent (fraction ~0.9)

### Task 4.2: Accessibility Verification

- [x] Verify aria-label still provides phase information
- [x] Check reduced motion mode works (no animations)
- [ ] Confirm WCAG contrast ratios maintained
- [ ] Test with screen reader

### Task 4.3: Run Project Tests

- [x] Run linting: `npm run lint`
- [x] Run type check: `npx tsc --noEmit`
- [x] Run unit tests: `npm run test`
- [x] Fix any failures

### Task 4.4: Cross-Browser Final Check

- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Safari iOS (latest)
- [ ] Chrome Android (latest)

**Final Verification:**

```bash
npm run lint
npx tsc --noEmit
npm run test
```

---

## Acceptance Criteria Checklist

### Visual

- [ ] Craters appear organic (no visible grid)
- [ ] Lighting has smooth terminator transition
- [ ] Moon maintains spherical 3D appearance
- [ ] Glow effects still work correctly

### Functional

- [ ] All moon phases render correctly
- [ ] Reduced motion mode works
- [ ] Hover scale effect works
- [ ] No console errors

### Performance

- [ ] No lag on mobile devices
- [ ] 60fps during animations
- [ ] Bundle size increase < 2KB

### Accessibility

- [ ] WCAG 4.5:1 contrast maintained
- [ ] Screen reader compatible
- [ ] Keyboard focus preserved

---

## Code Snippets Reference

### Improved Crater Pattern

```tsx
<pattern id="craters" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
  {/* Large crater with shadow */}
  <g>
    <ellipse cx="30" cy="28" rx="11" ry="9" fill="currentColor" className="text-white/5" />
    <ellipse cx="30" cy="30" rx="10" ry="8" fill="currentColor" className="text-black/10" />
    <ellipse cx="28" cy="31" rx="7" ry="5" fill="currentColor" className="text-black/15" />
  </g>
  {/* Medium crater */}
  <g>
    <ellipse cx="12" cy="14" rx="5" ry="4" fill="currentColor" className="text-black/8" />
    <ellipse cx="11" cy="15" rx="3" ry="2.5" fill="currentColor" className="text-black/12" />
  </g>
  {/* Small scattered craters */}
  <ellipse cx="45" cy="42" rx="4" ry="3.5" fill="currentColor" className="text-black/7" />
  <ellipse cx="8" cy="48" rx="2.5" ry="2" fill="currentColor" className="text-black/6" />
  <ellipse cx="52" cy="15" rx="3" ry="2.8" fill="currentColor" className="text-black/8" />
  {/* Tiny detail craters */}
  <circle cx="20" cy="45" r="1.2" fill="currentColor" className="text-black/5" />
  <circle cx="48" cy="28" r="1" fill="currentColor" className="text-black/4" />
</pattern>
```

### Enhanced Lighting Gradient

```tsx
<radialGradient id="moon-sphere" cx="40%" cy="40%" r="60%">
  <stop offset="0%" stopColor="currentColor" className="text-slate-50" />
  <stop offset="25%" stopColor="currentColor" className="text-slate-50" />
  <stop offset="45%" stopColor="currentColor" className="text-slate-100" />
  <stop offset="60%" stopColor="currentColor" className="text-slate-200" />
  <stop offset="75%" stopColor="currentColor" className="text-slate-300" />
  <stop offset="85%" stopColor="currentColor" className="text-slate-400" />
  <stop offset="95%" stopColor="currentColor" className="text-slate-500" />
  <stop offset="100%" stopColor="currentColor" className="text-slate-600" />
</radialGradient>
```

### Surface Texture Filter

```tsx
<filter id="moon-texture" x="-10%" y="-10%" width="120%" height="120%">
  <feTurbulence
    type="fractalNoise"
    baseFrequency="0.04 0.08"
    numOctaves="4"
    seed="42"
    result="noise"
  />
  <feBlend in="SourceGraphic" in2="noise" mode="overlay" result="textured" />
  <feGaussianBlur in="textured" stdDeviation="0.3" />
</filter>
```
