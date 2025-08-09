/**
 * UI Constants
 * Constants for UI components, styling, and design system
 */

// Design System Constants
export const DESIGN_SYSTEM = {
  GRID_SIZE: 8, // 8px base grid system
  TYPOGRAPHY_SIZES: [
    'text-sm',    // timestamps, metadata
    'text-base',  // body text, messages
    'text-xl',    // section headings 
    'text-3xl'    // main headers
  ] as const,
  SPACING: {
    XS: 'p-2',   // 8px
    SM: 'p-4',   // 16px  
    MD: 'p-6',   // 24px
    LG: 'p-8',   // 32px
    XL: 'p-12'   // 48px
  } as const,
} as const;

// Color Hierarchy (60/30/10 Rule)
export const COLORS = {
  NEUTRAL: [
    'bg-background',
    'bg-muted',
  ] as const,
  FUNCTIONAL: [
    'text-foreground', 
    'border-border'
  ] as const,
  ACCENT: [
    'bg-primary',
    'bg-accent'
  ] as const,
} as const;

// Animation Constants
export const ANIMATIONS = {
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out', 
    EASE_IN_OUT: 'ease-in-out',
  },
} as const;

// Breakpoints
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
} as const;