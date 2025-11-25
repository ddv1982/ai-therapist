# Component Usage Patterns

This document provides a guide to the therapeutic component library used in the AI Therapist application. The library is built on shadcn/ui primitives and extends them with therapy-specific functionality.

## Table of Contents

- [Overview](#overview)
- [Component Organization](#component-organization)
- [Therapeutic Buttons](#therapeutic-buttons)
- [Therapeutic Cards](#therapeutic-cards)
- [Therapeutic Forms](#therapeutic-forms)
- [Therapeutic Layouts](#therapeutic-layouts)
- [Therapeutic Modals](#therapeutic-modals)
- [Accessibility Guidelines](#accessibility-guidelines)
- [Best Practices](#best-practices)

---

## Overview

The component library follows a **compound component architecture** with three layers:

1. **Primitives** (`src/components/ui/`) - Base shadcn/ui components (button, input, dialog)
2. **Therapeutic Components** (`src/components/ui/therapeutic-*`) - Domain-specific enhanced components
3. **Feature Components** (`src/features/*/components/`) - Page-level compositions

### Design Principles

- **Dark Mode First**: All components are optimized for dark backgrounds
- **Accessibility**: WCAG AA compliant with proper ARIA attributes
- **Mobile Responsive**: Touch-friendly with appropriate hit targets (44px minimum)
- **Type Safe**: Full TypeScript coverage with exported types
- **Composable**: Compound component pattern for flexibility

---

## Component Organization

```
src/components/ui/
├── button.tsx                    # Base button primitive
├── therapeutic-button.tsx        # Enhanced therapeutic button
├── therapeutic-card.tsx          # Main card component
├── therapeutic-cards/            # Card system
│   ├── base/                     # Core types, config, presets
│   ├── compound/                 # Composable parts (header, content, actions)
│   ├── specialized/              # Domain variants (session, emotion, CBT)
│   └── index.ts                  # Public API
├── therapeutic-forms/            # Form system
│   ├── base/                     # Hooks, wrappers, labels
│   ├── inputs/                   # Text, textarea, slider
│   ├── specialized/              # Emotion scale, array fields
│   └── index.ts                  # Public API
├── therapeutic-layouts/          # Layout system
│   ├── base/                     # Core layout, classes
│   ├── specialized/              # Section, CBT flow, modal layout
│   └── index.ts                  # Public API
└── therapeutic-modals/           # Modal system
    ├── base/                     # Core modal, types
    ├── compound/                 # Header, content, footer
    ├── specialized/              # Confirmation, report, CBT flow
    └── index.ts                  # Public API
```

---

## Therapeutic Buttons

The `TherapeuticButton` component extends the base button with therapy-specific variants and features.

### Import

```typescript
import { TherapeuticButton, therapeuticButtonPresets } from '@/components/ui/therapeutic-button';
```

### Variants

| Variant               | Use Case          | Description                             |
| --------------------- | ----------------- | --------------------------------------- |
| `therapeutic`         | Primary actions   | Gradient background with shimmer effect |
| `therapeutic-outline` | Secondary actions | Bordered with subtle gradient fill      |
| `therapeutic-ghost`   | Tertiary actions  | Text only with hover effect             |
| `action-primary`      | Confirmations     | Primary color with soft background      |
| `action-destructive`  | Delete/remove     | Destructive color with soft background  |
| `mobile`              | Touch interfaces  | Larger touch target (44px min height)   |

### Basic Usage

```tsx
// Primary therapeutic action
<TherapeuticButton variant="therapeutic" size="lg">
  Start Session
</TherapeuticButton>

// With loading state
<TherapeuticButton
  variant="therapeutic"
  loading={isLoading}
  loadingText="Saving..."
>
  Save Progress
</TherapeuticButton>

// With icon
<TherapeuticButton
  variant="therapeutic-outline"
  icon={<PlusIcon />}
>
  Add Entry
</TherapeuticButton>

// Mobile optimized
<TherapeuticButton
  variant="mobile"
  mobileOptimized
  preventZoom
>
  Continue
</TherapeuticButton>
```

### Using Presets

```tsx
// Primary action preset
<TherapeuticButton {...therapeuticButtonPresets.primaryAction({})}>
  Begin Therapy
</TherapeuticButton>

// Submit preset (full width)
<TherapeuticButton {...therapeuticButtonPresets.submit({})}>
  Submit Reflection
</TherapeuticButton>

// Destructive preset
<TherapeuticButton {...therapeuticButtonPresets.destructive({})}>
  Delete Session
</TherapeuticButton>
```

### Props Reference

| Prop              | Type      | Default        | Description                |
| ----------------- | --------- | -------------- | -------------------------- |
| `variant`         | string    | `'default'`    | Visual style variant       |
| `size`            | string    | `'default'`    | Button size                |
| `icon`            | ReactNode | -              | Left icon                  |
| `rightIcon`       | ReactNode | -              | Right icon                 |
| `loading`         | boolean   | `false`        | Show loading spinner       |
| `loadingText`     | string    | `'Loading...'` | Text during loading        |
| `progress`        | number    | -              | Progress bar (0-100)       |
| `mobileOptimized` | boolean   | `false`        | Enable touch optimizations |
| `glowEffect`      | boolean   | `false`        | Add glow on hover          |

---

## Therapeutic Cards

The card system provides multiple ways to display therapeutic content.

### Import

```typescript
// Individual component
import { TherapeuticCard } from '@/components/ui/therapeutic-card';

// Compound components
import {
  TherapeuticBaseCard,
  CardHeader,
  CardContent,
  CardActions,
  CardProgress,
  // Specialized cards
  SessionCard,
  EmotionCard,
  CBTSectionCard,
} from '@/components/ui/therapeutic-cards';
```

### Basic Card Usage

```tsx
// Simple card with data mapping
<TherapeuticCard
  data={{
    title: 'Morning Reflection',
    date: '2024-11-25',
    mood: 'hopeful',
    notes: 'Feeling positive about today...',
  }}
  columns={[
    { key: 'title', label: 'Title', priority: 'high' },
    { key: 'date', label: 'Date', type: 'text' },
    { key: 'mood', label: 'Mood', type: 'badge' },
    { key: 'notes', label: 'Notes' },
  ]}
  variant="therapeutic"
  onClick={handleCardClick}
/>
```

### Compound Card Pattern

```tsx
import {
  TherapeuticBaseCard,
  CardHeader,
  CardContent,
  CardActions,
} from '@/components/ui/therapeutic-cards';

<TherapeuticBaseCard variant="elevated">
  <CardHeader
    title="Session Summary"
    subtitle="November 25, 2024"
    action={<Badge>Completed</Badge>}
  />
  <CardContent>
    <p>Your session covered important topics around anxiety management...</p>
  </CardContent>
  <CardActions>
    <CardAction label="View Full Report" onClick={viewReport} />
    <CardAction label="Download PDF" onClick={downloadPdf} variant="secondary" />
  </CardActions>
</TherapeuticBaseCard>;
```

### Specialized Cards

#### Session Card

```tsx
import { SessionCard } from '@/components/ui/therapeutic-cards';

<SessionCard
  session={{
    id: 'session-123',
    title: 'Anxiety Management',
    date: new Date(),
    messageCount: 24,
    status: 'completed',
  }}
  onSelect={(session) => navigateToSession(session.id)}
  onDelete={(session) => deleteSession(session.id)}
/>;
```

#### Emotion Card

```tsx
import { EmotionCard } from '@/components/ui/therapeutic-cards';

<EmotionCard
  emotion="anxiety"
  intensity={7}
  description="Feeling anxious about upcoming presentation"
  onClick={() => openEmotionDetails('anxiety')}
/>;
```

#### CBT Section Card

```tsx
import { CBTSectionCard } from '@/components/ui/therapeutic-cards';

<CBTSectionCard
  sectionType="situation"
  content="Meeting with manager to discuss project timeline"
  isComplete={true}
  onEdit={() => editSection('situation')}
/>;
```

### Card Variants

| Variant       | Use Case                                |
| ------------- | --------------------------------------- |
| `default`     | Standard card with subtle shadow        |
| `therapeutic` | Gradient background with enhanced hover |
| `compact`     | Reduced padding for dense layouts       |
| `detailed`    | More space for complex content          |
| `elevated`    | Prominent shadow for emphasis           |

---

## Therapeutic Forms

The form system provides therapeutic-specific input components with built-in validation.

### Import

```typescript
import {
  TherapeuticTextInput,
  TherapeuticTextArea,
  TherapeuticSlider,
  EmotionScaleInput,
  ArrayFieldInput,
  TherapeuticFieldWrapper,
  useTherapeuticField,
} from '@/components/ui/therapeutic-forms';
```

### Text Input

```tsx
<TherapeuticTextInput
  label="What's on your mind?"
  placeholder="Share your thoughts..."
  value={thought}
  onChange={setThought}
  helperText="This is a safe space to express yourself"
  maxLength={500}
  showCharCount
/>
```

### Text Area

```tsx
<TherapeuticTextArea
  label="Describe your feelings"
  placeholder="Take your time..."
  value={feelings}
  onChange={setFeelings}
  rows={4}
  variant="therapeutic"
/>
```

### Sliders

```tsx
// Basic therapeutic slider
<TherapeuticSlider
  label="Anxiety Level"
  value={anxietyLevel}
  onChange={setAnxietyLevel}
  min={0}
  max={10}
  step={1}
  showValue
  variant="emotion"
/>

// With custom labels
<TherapeuticSlider
  label="How helpful was this session?"
  value={helpfulness}
  onChange={setHelpfulness}
  min={1}
  max={5}
  minLabel="Not helpful"
  maxLabel="Very helpful"
/>
```

### Emotion Scale Input

```tsx
import { EmotionScaleInput, type Emotion } from '@/components/ui/therapeutic-forms';

const emotions: Emotion[] = [
  { id: 'joy', label: 'Joy', color: 'oklch(75% 0.18 90)' },
  { id: 'sadness', label: 'Sadness', color: 'oklch(50% 0.15 250)' },
  { id: 'anxiety', label: 'Anxiety', color: 'oklch(65% 0.20 30)' },
];

<EmotionScaleInput
  emotions={emotions}
  selectedEmotions={selectedEmotions}
  onSelectEmotion={handleEmotionSelect}
  intensities={emotionIntensities}
  onIntensityChange={handleIntensityChange}
  multiSelect
/>;
```

### Array Field Input

```tsx
<ArrayFieldInput
  label="Coping strategies"
  items={strategies}
  onAdd={(value) => addStrategy(value)}
  onRemove={(index) => removeStrategy(index)}
  placeholder="Add a coping strategy..."
  maxItems={10}
/>
```

### Using the Field Hook

```tsx
import { useTherapeuticField } from '@/components/ui/therapeutic-forms';

function MyCustomInput() {
  const field = useTherapeuticField({
    initialValue: '',
    validate: (value) => {
      if (!value) return 'This field is required';
      if (value.length < 10) return 'Please provide more detail';
      return undefined;
    },
  });

  return (
    <TherapeuticFieldWrapper label="Custom Field" error={field.error} touched={field.touched}>
      <input
        value={field.value}
        onChange={(e) => field.setValue(e.target.value)}
        onBlur={field.onBlur}
      />
    </TherapeuticFieldWrapper>
  );
}
```

---

## Therapeutic Layouts

Layout components provide consistent structure for therapeutic content.

### Import

```typescript
import {
  TherapeuticLayout,
  TherapeuticSection,
  CBTFlowLayout,
  ModalLayout,
  ResponsiveGrid,
  therapeuticLayoutPresets,
} from '@/components/ui/therapeutic-layouts';
```

### Main Layout

```tsx
<TherapeuticLayout variant="centered" maxWidth="md" padding="comfortable" background="subtle">
  {children}
</TherapeuticLayout>
```

### Section Layout

```tsx
<TherapeuticSection
  title="Today's Reflection"
  subtitle="Take a moment to check in with yourself"
  icon={<HeartIcon />}
  collapsible
  defaultOpen
>
  <ReflectionContent />
</TherapeuticSection>
```

### CBT Flow Layout

```tsx
<CBTFlowLayout
  currentStep={currentStep}
  steps={[
    { id: 'situation', label: 'Situation', isComplete: true },
    { id: 'thoughts', label: 'Thoughts', isComplete: true },
    { id: 'emotions', label: 'Emotions', isComplete: false },
    { id: 'behaviors', label: 'Behaviors', isComplete: false },
    { id: 'reframe', label: 'Reframe', isComplete: false },
  ]}
  onStepClick={handleStepClick}
>
  <StepContent step={currentStep} />
</CBTFlowLayout>
```

### Responsive Grid

```tsx
<ResponsiveGrid columns={{ sm: 1, md: 2, lg: 3 }} gap="md">
  <SessionCard session={session1} />
  <SessionCard session={session2} />
  <SessionCard session={session3} />
</ResponsiveGrid>
```

---

## Therapeutic Modals

Modal components for therapeutic interactions and confirmations.

### Import

```typescript
import {
  TherapeuticModal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  ConfirmationModal,
  CBTFlowModal,
  SessionReportModal,
  useTherapeuticConfirm,
} from '@/components/ui/therapeutic-modals';
```

### Basic Modal

```tsx
<TherapeuticModal open={isOpen} onClose={() => setIsOpen(false)} size="md">
  <ModalHeader title="Session Complete" onClose={() => setIsOpen(false)} />
  <ModalContent>
    <p>Great work on completing your session!</p>
  </ModalContent>
  <ModalFooter>
    <TherapeuticButton variant="therapeutic-ghost" onClick={() => setIsOpen(false)}>
      Close
    </TherapeuticButton>
    <TherapeuticButton variant="therapeutic" onClick={viewReport}>
      View Report
    </TherapeuticButton>
  </ModalFooter>
</TherapeuticModal>
```

### Confirmation Modal

```tsx
<ConfirmationModal
  open={showConfirm}
  onClose={() => setShowConfirm(false)}
  title="Delete Session?"
  description="This action cannot be undone. All messages and progress will be permanently deleted."
  confirmLabel="Delete"
  cancelLabel="Keep Session"
  variant="destructive"
  onConfirm={handleDelete}
/>
```

### Using the Confirm Hook

```tsx
import { useTherapeuticConfirm } from '@/components/ui/therapeutic-modals';

function MyComponent() {
  const confirm = useTherapeuticConfirm();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Entry?',
      description: 'This will permanently remove this reflection.',
      variant: 'destructive',
    });

    if (confirmed) {
      // Proceed with deletion
      deleteEntry();
    }
  };

  return <Button onClick={handleDelete}>Delete</Button>;
}
```

### Session Report Modal

```tsx
<SessionReportModal
  open={showReport}
  onClose={() => setShowReport(false)}
  report={{
    sessionId: 'session-123',
    title: 'Anxiety Management Session',
    date: new Date(),
    keyPoints: [...],
    therapeuticInsights: [...],
    recommendations: [...],
  }}
  onDownload={handleDownloadPdf}
/>
```

---

## Accessibility Guidelines

### Keyboard Navigation

All interactive components support full keyboard navigation:

- **Tab**: Move between focusable elements
- **Enter/Space**: Activate buttons, open dropdowns
- **Escape**: Close modals, cancel operations
- **Arrow Keys**: Navigate within lists, sliders

### ARIA Attributes

Components include appropriate ARIA attributes:

```tsx
// Buttons announce their state
<TherapeuticButton
  aria-busy={isLoading}
  aria-disabled={isDisabled}
>
  Submit
</TherapeuticButton>

// Modals have proper roles
<TherapeuticModal
  role="dialog"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  ...
</TherapeuticModal>

// Forms have accessible labels
<TherapeuticTextInput
  id="thought-input"
  label="Share your thought"
  aria-describedby="thought-help"
  aria-invalid={hasError}
/>
```

### Color Contrast

All text meets WCAG AA contrast requirements:

- Normal text: 4.5:1 minimum ratio
- Large text: 3:1 minimum ratio
- UI components: 3:1 minimum ratio

### Focus Management

- Visible focus indicators on all interactive elements
- Focus trapped within modals when open
- Focus restored to trigger element when modal closes

---

## Best Practices

### 1. Use the Right Component

| Need              | Component               |
| ----------------- | ----------------------- |
| Single action     | `TherapeuticButton`     |
| Display data      | `TherapeuticCard`       |
| User input        | Therapeutic form inputs |
| Grouped content   | `TherapeuticSection`    |
| Step-by-step flow | `CBTFlowLayout`         |
| Confirmation      | `ConfirmationModal`     |

### 2. Mobile-First Design

```tsx
// ✅ Good - Mobile optimized
<TherapeuticButton
  variant="mobile"
  mobileOptimized
  size="mobile-touch"
>
  Continue
</TherapeuticButton>

// ❌ Avoid - Small touch targets on mobile
<Button size="sm">Continue</Button>
```

### 3. Loading States

Always provide feedback during async operations:

```tsx
// ✅ Good - Shows loading state
<TherapeuticButton loading={isSaving} loadingText="Saving your reflection...">
  Save
</TherapeuticButton>
```

### 4. Error Handling

Use error states in forms:

```tsx
// ✅ Good - Shows validation error
<TherapeuticTextInput label="Your thought" error={errors.thought} touched={touched.thought} />
```

### 5. Import from Index Files

```tsx
// ✅ Good - Import from barrel export
import { SessionCard } from '@/components/ui/therapeutic-cards';

// ❌ Avoid - Deep imports
import { SessionCard } from '@/components/ui/therapeutic-cards/specialized/session-card';
```

### 6. Consistent Variants

Use appropriate variants for context:

```tsx
// Primary action
<TherapeuticButton variant="therapeutic">Begin Session</TherapeuticButton>

// Secondary action
<TherapeuticButton variant="therapeutic-outline">Save Draft</TherapeuticButton>

// Destructive action
<TherapeuticButton variant="destructive">Delete</TherapeuticButton>
```

---

## Component Quick Reference

### Buttons

| Import                     | Purpose                       |
| -------------------------- | ----------------------------- |
| `TherapeuticButton`        | Main button with variants     |
| `therapeuticButtonPresets` | Pre-configured button configs |

### Cards

| Import                | Purpose             |
| --------------------- | ------------------- |
| `TherapeuticCard`     | Data-driven card    |
| `TherapeuticBaseCard` | Compound card base  |
| `SessionCard`         | Session display     |
| `EmotionCard`         | Emotion display     |
| `CBTSectionCard`      | CBT section display |

### Forms

| Import                 | Purpose               |
| ---------------------- | --------------------- |
| `TherapeuticTextInput` | Text input            |
| `TherapeuticTextArea`  | Multiline text        |
| `TherapeuticSlider`    | Range input           |
| `EmotionScaleInput`    | Emotion selection     |
| `ArrayFieldInput`      | List input            |
| `useTherapeuticField`  | Field validation hook |

### Layouts

| Import               | Purpose         |
| -------------------- | --------------- |
| `TherapeuticLayout`  | Page layout     |
| `TherapeuticSection` | Content section |
| `CBTFlowLayout`      | Step flow       |
| `ResponsiveGrid`     | Grid layout     |

### Modals

| Import                  | Purpose              |
| ----------------------- | -------------------- |
| `TherapeuticModal`      | Base modal           |
| `ConfirmationModal`     | Confirm/cancel       |
| `SessionReportModal`    | Report display       |
| `useTherapeuticConfirm` | Programmatic confirm |

---

For implementation details, see the component source code in `src/components/ui/`.
