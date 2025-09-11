/**
 * Design Tokens - Fire Your Design Team Compliant
 * NO CUSTOM CLASSES - Export Tailwind utility strings only
 * 4 font sizes: text-3xl, text-xl, text-base, text-sm
 * 2 font weights: font-semibold, normal
 * 8pt grid spacing: p-2, p-4, p-6, p-8, etc.
 * 60/30/10 color rule: bg-background, text-foreground, bg-primary
 */

// ============================================================================
// FIRE YOUR DESIGN TEAM - TAILWIND UTILITIES ONLY
// ============================================================================

export const therapeuticColors = {
  // 60% - Neutral backgrounds (most of the UI)
  neutral: {
    background: 'bg-background',
    muted: 'bg-muted',
    card: 'bg-card',
  },
  
  // 30% - Text and subtle UI elements
  subtle: {
    text: 'text-foreground',
    mutedText: 'text-muted-foreground',
    border: 'border-border',
  },
  
  // 10% - Primary accents (use sparingly)
  accent: {
    primary: 'bg-primary text-primary-foreground',
    primaryText: 'text-primary',
    primaryHover: 'hover:bg-primary/90',
  }
} as const;

// ============================================================================
// TYPOGRAPHY - FIRE YOUR DESIGN TEAM (4 Sizes, 2 Weights)
// ============================================================================

export const therapeuticTypography = {
  // Fire Your Design Team: Only 4 font sizes allowed
  heading: 'text-3xl font-semibold',      // Size 1: Large headings
  subheading: 'text-xl font-semibold',    // Size 2: Subheadings/important content
  body: 'text-base',                      // Size 3: Body text
  small: 'text-sm',                       // Size 4: Small text/labels
  
  // Typography with color combinations
  headingPrimary: 'text-3xl font-semibold text-foreground',
  subheadingPrimary: 'text-xl font-semibold text-foreground',
  bodyPrimary: 'text-base text-foreground',
  bodySecondary: 'text-base text-muted-foreground',
  smallPrimary: 'text-sm text-foreground',
  smallSecondary: 'text-sm text-muted-foreground',
  
  // Special combinations (within Fire Your Design Team constraints)
  button: 'text-base font-semibold',      // Buttons use Size 3 + semibold
  label: 'text-sm font-semibold',         // Labels use Size 4 + semibold
  messageText: 'text-base text-foreground leading-relaxed',
  strongText: 'font-semibold text-foreground',
} as const;

// ============================================================================
// SPACING - 8PT GRID SYSTEM (Fire Your Design Team)
// ============================================================================

export const therapeuticSpacing = {
  // Fire Your Design Team: Only 8pt grid compliant spacing
  xs: 'p-2',     // 8px - divisible by 8
  sm: 'p-4',     // 16px - divisible by 8  
  md: 'p-6',     // 24px - divisible by 8
  lg: 'p-8',     // 32px - divisible by 8
  xl: 'p-12',    // 48px - divisible by 8
  
  // Margin variants (8pt grid compliant)
  marginXs: 'm-2',    // 8px
  marginSm: 'm-4',    // 16px
  marginMd: 'm-6',    // 24px
  marginLg: 'm-8',    // 32px
  marginXl: 'm-12',   // 48px
  
  // Common spacing patterns
  messageSpacing: 'mb-4',        // 16px - grid compliant
  sectionSpacing: 'mb-6',        // 24px - grid compliant
  cardSpacing: 'p-4',            // 16px - grid compliant
  gapSmall: 'gap-2',             // 8px - grid compliant
  gapMedium: 'gap-4',            // 16px - grid compliant
  gapLarge: 'gap-6',             // 24px - grid compliant
} as const;

// ============================================================================
// INTERACTIVE ELEMENTS - 8PT GRID COMPLIANT
// ============================================================================

export const therapeuticInteractive = {
  // Icon buttons (8pt grid: 32px, 48px sizes)
  iconButtonSmall: 'h-8 w-8 p-0 rounded-full hover:bg-primary/10 transition-colors', // 32px
  iconButtonMedium: 'h-12 w-12 p-2 rounded-full hover:bg-primary/10 transition-colors', // 48px
  iconButtonLarge: 'h-12 w-12 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors', // 48px
  
  // Button variants (Fire Your Design Team compliant)
  buttonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded text-base font-semibold transition-colors',
  buttonSecondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded text-base font-semibold transition-colors',
  buttonGhost: 'hover:bg-muted px-4 py-2 rounded text-base font-semibold transition-colors',
  
  // Shorthand button styles for cleaner code
  primaryButton: 'bg-primary text-primary-foreground hover:bg-primary/90',
  buttonBase: 'px-4 py-2 rounded text-base font-semibold transition-colors',
  
  // Cards and containers
  cardBase: 'bg-card text-card-foreground border border-border rounded-lg p-4',
  cardHover: 'bg-card text-card-foreground border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors',
  
  // Status indicators (64px = 8pt grid)
  statusIcon: 'w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center',
} as const;

// ============================================================================
// CONTENT FORMATTING - SIMPLIFIED
// ============================================================================

export const therapeuticContent = {
  // Fire Your Design Team compliant content styling
  paragraph: 'mb-4 text-base text-foreground leading-relaxed',
  strongText: 'font-semibold text-foreground',
  mutedText: 'text-sm text-muted-foreground',
  linkText: 'text-primary underline hover:text-primary/80',
  
  // Lists (8pt grid spacing)
  listItem: 'text-base leading-relaxed pl-6 py-2',
  
  // Tables
  tableHeader: 'bg-muted text-foreground font-semibold p-3',
  tableCell: 'border border-border p-3 text-sm',
} as const;

// ============================================================================
// UTILITY FUNCTIONS - SIMPLIFIED
// ============================================================================

/**
 * Gets the appropriate icon button size (Fire Your Design Team compliant)
 * @param size - Button size: 'small' (32px) or 'large' (48px)
 * @returns Tailwind utility classes
 */
export function getIconButtonSize(size: 'small' | 'large' = 'large'): string {
  return size === 'small' 
    ? therapeuticInteractive.iconButtonSmall 
    : therapeuticInteractive.iconButtonLarge;
}

/**
 * Combines classes safely (removes duplicates)
 * @param classes - Array of class strings
 * @returns Combined unique classes
 */
export function combineClasses(...classes: (string | undefined)[]): string {
  return classes
    .filter(Boolean)
    .join(' ')
    .split(' ')
    .filter((cls, index, arr) => arr.indexOf(cls) === index)
    .join(' ');
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TherapeuticColorKey = keyof typeof therapeuticColors;
export type TherapeuticTypographyKey = keyof typeof therapeuticTypography;
export type TherapeuticSpacingKey = keyof typeof therapeuticSpacing;
export type TherapeuticInteractiveKey = keyof typeof therapeuticInteractive;