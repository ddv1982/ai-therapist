# Apple Design System - Quick Reference Guide

**Version:** 1.0.0  
**Date:** 2025-11-22

---

## 🚀 Quick Start

The Apple Design System is now active! All components automatically use:
- ✅ System fonts (SF Pro on macOS, Segoe UI on Windows)
- ✅ Apple-style shadows and transitions
- ✅ Spring physics animations
- ✅ Enhanced accessibility

---

## 📐 Design Tokens

### Typography
```tsx
// Sizes (4 only - "Fire Your Design Team" compliant)
text-3xl  // 30px - Large headings
text-xl   // 20px - Section headings
text-base // 16px - Body text (default)
text-sm   // 14px - Captions, meta

// Weights (2 only)
font-normal   // 400 - Body text
font-semibold // 600 - Headings, emphasis

// Line Heights
leading-tight   // 1.2 - Large headings
leading-normal  // 1.3 - Default
leading-relaxed // 1.5 - Body paragraphs

// Letter Spacing
tracking-tight  // -0.02em - Large headings only
tracking-normal // 0 - Default
```

### Spacing (8pt Grid)
```tsx
// Use these values only (8pt grid compliant)
p-0.5  // 2px
p-1    // 4px
p-2    // 8px
p-3    // 12px
p-4    // 16px
p-6    // 24px
p-8    // 32px
p-12   // 48px
p-16   // 64px
p-24   // 96px
```

### Shadows (Apple-Style)
```tsx
shadow-apple-sm      // Subtle elevation
shadow-apple-md      // Medium elevation
shadow-apple-lg      // Large elevation
shadow-apple-xl      // Extra large
shadow-apple-primary // Colored primary glow
shadow-apple-accent  // Colored accent glow
```

### Transitions
```tsx
// Durations
duration-instant // 150ms - Micro-interactions
duration-fast    // 200ms - Hovers, focus (most common)
duration-base    // 300ms - Standard transitions
duration-slow    // 500ms - Large movements

// Easings (Apple Spring Physics)
ease-spring          // Bouncy spring effect
ease-out-smooth      // Smooth deceleration
ease-in-out-smooth   // Balanced ease
ease-smooth          // Ultra smooth (theme changes)
```

### Glassmorphism
```tsx
// Frosted Glass Effect
backdrop-blur-glass      // 20px blur
backdrop-saturate-glass  // 180% saturation
bg-[var(--glass-white)]  // 70% opacity white
border-[var(--glass-border)] // 18% opacity border

// Dark Mode
// Automatically switches to dark glass in dark mode
```

---

## 🎨 Component Usage

### Button

**Default (Primary CTA)**
```tsx
<Button>Primary Action</Button>
```

**Glass Variant (Premium)**
```tsx
<Button variant="glass">
  Frosted Glass Button
</Button>
```

**All Variants**
```tsx
<Button variant="default">Primary with gradient + colored shadow</Button>
<Button variant="secondary">Secondary with border</Button>
<Button variant="ghost">Minimal ghost button</Button>
<Button variant="glass">Frosted glass effect</Button>
<Button variant="destructive">Destructive action</Button>
<Button variant="outline">Outline button</Button>
<Button variant="link">Link-style button</Button>
```

**Features:**
- ✅ Scale-on-press (0.96) - iOS-style
- ✅ Colored shadows on primary/accent
- ✅ Spring animations
- ✅ Enhanced focus rings

---

### Card

**Default Card**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

**Glass Card (Glassmorphism)**
```tsx
<Card variant="glass">
  <CardHeader>
    <CardTitle>Frosted Glass Card</CardTitle>
  </CardHeader>
  <CardContent>
    Content with backdrop blur effect
  </CardContent>
</Card>
```

**Elevated Card (Lifts on Hover)**
```tsx
<Card variant="elevated">
  <CardHeader>
    <CardTitle>Hover to Lift</CardTitle>
  </CardHeader>
  <CardContent>
    This card lifts on hover with shadow increase
  </CardContent>
</Card>
```

**Variants:**
- `default` - Solid background, subtle shadow
- `glass` - Frosted glass with backdrop-blur
- `elevated` - Lifts on hover (-translate-y-0.5)

---

### Input

**Standard Input**
```tsx
<Input 
  type="text" 
  placeholder="Enter text..." 
/>
```

**Features:**
- ✅ h-12 (48px) - Better touch target
- ✅ Focus glow (blue ring + shadow)
- ✅ Border highlights on focus
- ✅ Spring transitions

---

### Textarea

**Standard Textarea**
```tsx
<Textarea 
  placeholder="Enter longer text..." 
  rows={4}
/>
```

**Features:**
- ✅ Matches Input styling
- ✅ min-h-[96px] default
- ✅ resize-y for vertical resizing

---

### Select

**Standard Select**
```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

**Features:**
- ✅ h-12 trigger (48px)
- ✅ Rounded dropdown (rounded-lg)
- ✅ Apple shadows
- ✅ Smooth item transitions

---

### Switch

**iOS-Style Switch**
```tsx
<Switch defaultChecked />
```

**With Label**
```tsx
<div className="flex items-center gap-2">
  <Switch id="notifications" />
  <Label htmlFor="notifications">Enable notifications</Label>
</div>
```

**Features:**
- ✅ h-8 w-14 (iOS size)
- ✅ Spring slide animation
- ✅ Apple shadow on thumb

---

### Dialog/Modal

**Standard Dialog**
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description goes here
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      Dialog content
    </div>
    <DialogFooter>
      <Button variant="secondary">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Features:**
- ✅ Backdrop blur (12px)
- ✅ rounded-2xl (16px corners)
- ✅ Spring zoom + slide animations
- ✅ Lighter backdrop (black/40)

---

### Skeleton (Loading States)

**Basic Skeleton**
```tsx
<Skeleton className="h-4 w-3/4" />
```

**Message Skeleton (Pre-built)**
```tsx
<MessageSkeleton />
```

**Session Skeleton (Pre-built)**
```tsx
<SessionSkeleton />
```

**Features:**
- ✅ Shimmer animation (Apple style)
- ✅ No more pulse effect
- ✅ GPU-accelerated

---

### Toast (Sonner)

**Usage** (No changes needed)
```tsx
import { toast } from 'sonner';

toast.success('Success message');
toast.error('Error message');
toast.info('Info message');
```

**Features:**
- ✅ Glassmorphism effect (frosted glass)
- ✅ Apple shadows
- ✅ Smooth slide-down animation
- ✅ 12px rounded corners

---

## 🎯 Best Practices

### When to Use Glass Variant

**✅ Good Use Cases:**
- Hero sections with background images
- Floating navigation bars
- Modal overlays
- Premium feature cards
- Media player controls

**❌ Avoid:**
- Text-heavy content (readability issues)
- High-contrast backgrounds (effect less visible)
- Mobile-first content (performance concerns)
- Nested glass effects (compounds blur cost)

---

### Animation Guidelines

**✅ Do:**
- Use `transform` and `opacity` only (GPU-accelerated)
- Limit backdrop-blur to 20px max
- Use spring easing for interactive elements
- Test animations at 60fps

**❌ Don't:**
- Animate `width`, `height`, `top`, `left` (layout shifts)
- Nest backdrop-filters (performance cost)
- Create jank with complex animations
- Ignore `prefers-reduced-motion`

---

### Accessibility Reminders

**Always:**
- ✅ Ensure touch targets are ≥ 44x44px
- ✅ Provide visible focus indicators (2px ring)
- ✅ Test keyboard navigation
- ✅ Verify color contrast ≥ 4.5:1
- ✅ Respect `prefers-reduced-motion`

---

## 🔧 Customization

### Override Glass Colors

```tsx
<Card 
  variant="glass"
  className="bg-primary/70 backdrop-blur-glass"
>
  Custom glass color
</Card>
```

### Custom Shadow

```tsx
<Button className="shadow-apple-primary hover:shadow-apple-accent">
  Custom colored shadow
</Button>
```

### Custom Transition

```tsx
<div className="transition-all duration-base ease-spring">
  Custom spring animation
</div>
```

---

## 🐛 Troubleshooting

### Backdrop-filter Not Working

**Issue:** Glassmorphism not visible

**Solution:**
1. Check browser support (Chrome 90+, Safari 14+, Firefox 103+)
2. Ensure element has `overflow: hidden` or is isolated
3. Verify element is above content (z-index)
4. Check for conflicting CSS

### Animations Not Smooth

**Issue:** Jank or stuttering animations

**Solution:**
1. Use `transform` and `opacity` only
2. Add `will-change: transform` before animating
3. Limit backdrop-blur radius to 20px
4. Check for layout shifts (use DevTools Performance)

### Font Not Using System Font

**Issue:** Still seeing Inter font

**Solution:**
1. Clear browser cache
2. Check `font-family` in DevTools
3. Verify `var(--font-system)` is applied
4. Restart dev server

---

## 📚 Additional Resources

### Documentation
- [Full Implementation Report](../.factory/reports/apple-design-system-implementation.md)
- [Original Spec](../.factory/specs/active/003-apple-design-system.md)

### External References
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Glassmorphism UI](https://ui.glass/)
- [Cubic Bezier Visualizer](https://cubic-bezier.com/)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Questions or Issues?**
- File an issue with `[Apple Design System]` prefix
- Check implementation report for detailed info
- Review spec for rationale and alternatives

---

*Last Updated: 2025-11-22*  
*Version: 1.0.0*
