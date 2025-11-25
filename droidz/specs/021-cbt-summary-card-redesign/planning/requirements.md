# CBT Session Summary Card Redesign

## Problem Statement

The CBT Session Summary Card currently displays with visual issues when rendered inside chat messages:

1. **Double-wrapping effect**: The card is rendered inside a message bubble, creating a "card within a card" appearance with doubled borders and shadows
2. **Thick border**: The message bubble's `therapeutic-content` class styling creates an unwanted thick border around the card
3. **Inconsistent styling**: The same `therapeutic-content` class works well for regular chat bubbles but conflicts with the card component

## Current Implementation

### Files Involved
- `src/features/therapy/components/cbt-session-summary-card.tsx` - The card component
- `src/features/chat/messages/message-content.tsx` - Wraps content with message bubble styling
- `src/components/ui/markdown.tsx` - Renders CBT card when detected in message content
- `src/lib/ui/design-system/message.ts` - Message bubble styling definitions
- `src/styles/typography.css` - `therapeutic-content` class styles

### Current Flow
1. AI generates message with CBT summary data embedded as HTML comment
2. `markdown.tsx` detects and extracts CBT data, renders `CBTSessionSummaryCard`
3. `message-content.tsx` wraps the card in message bubble with `therapeutic-content` class
4. Result: Card appears with doubled styling (message bubble + card styling)

## Requirements

### Visual Design
1. CBT Summary Card should display as a standalone, visually distinct element
2. No double-border or double-shadow effects
3. Clean separation from regular chat message styling
4. Maintain dark theme consistency with rest of app
5. Card should feel "premium" - polished, Apple-inspired design

### Technical Requirements
1. CBT Summary Card should NOT be wrapped in message bubble styling
2. Preserve the `therapeutic-content` styling for regular chat messages (it works well there)
3. Card should be responsive (mobile and desktop)
4. Maintain accessibility (proper contrast, focus states)
5. Keep animation/transition effects subtle and performant

### Card Content Sections
The card displays these CBT therapy sections:
- Header with date and completed steps count
- Situation description
- Initial Emotions (badges with ratings)
- Automatic Thoughts (list with credibility scores)
- Core Belief (with credibility)
- Rational Alternative Thoughts (list with confidence scores)
- Schema Modes (if applicable)
- Action Plan (new behaviors, final emotions)
- Completion note

## Design Direction

### Option A: Glass Card (Recommended)
- Use the existing `glass` variant from Card component
- Frosted glass effect with subtle backdrop blur
- Subtle border for definition
- Works well with dark theme

### Option B: Elevated Card
- Use `elevated` variant with hover lift effect
- More prominent shadow
- Clear visual hierarchy

### Option C: Custom Summary Card Style
- Create a new card variant specifically for CBT summaries
- Unique styling that distinguishes it from other cards
- Could include accent color border or gradient

## User's Notes
- The thick border effect is caused by the `therapeutic-content` class
- This class should remain on chat bubbles where it works well
- Only the CBT Summary Card needs special handling

## Visual Reference
Screenshot provided shows:
- Current card with visible thick border issue
- Card displayed in chat context with sidebar visible
- Dark theme environment
