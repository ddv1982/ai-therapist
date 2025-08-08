/**
 * Design tokens for therapeutic AI application
 * Centralizes common styling patterns to maintain consistency and reduce duplication
 * Follows the therapeutic design system: 60/30/10 color rule, 8pt grid, 4 typography sizes
 */

// ============================================================================
// THERAPEUTIC COLOR PATTERNS (60/30/10 Rule)
// ============================================================================

export const therapeuticColors = {
  // 60% - Neutral backgrounds and containers
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
    borderMuted: 'border-border/30',
  },
  
  // 10% - Therapeutic highlights and interactive elements
  accent: {
    primary: 'bg-primary',
    primarySubtle: 'bg-primary/10',
    primaryBorder: 'border-primary/20',
    textPrimary: 'text-primary',
    hoverPrimary: 'hover:bg-primary/10',
    hoverTextPrimary: 'hover:text-primary',
  }
} as const;

// ============================================================================
// THERAPEUTIC TYPOGRAPHY SYSTEM (4 Sizes Only)
// ============================================================================

export const therapeuticTypography = {
  // Main headers
  mainHeader: 'text-3xl font-semibold',
  
  // Section headings
  sectionHeading: 'text-xl font-semibold', 
  
  // Chat messages and body text
  bodyText: 'text-base',
  bodyTextRelaxed: 'text-base leading-relaxed',
  
  // Timestamps and metadata
  metadata: 'text-sm',
  
  // Specific therapeutic text patterns
  messageText: 'text-foreground leading-relaxed',
  messageTextWithMargin: 'mb-4 text-foreground leading-relaxed last:mb-0',
  strongText: 'font-bold text-foreground',
} as const;

// ============================================================================
// THERAPEUTIC SPACING SYSTEM (8pt Grid)
// ============================================================================

export const therapeuticSpacing = {
  // Core spacing units (8pt grid)
  xs: 'p-2',    // 8px
  sm: 'p-4',    // 16px  
  md: 'p-6',    // 24px
  lg: 'p-8',    // 32px
  xl: 'p-12',   // 48px
  
  // Margin variants
  margin: {
    xs: 'm-2',
    sm: 'm-4', 
    md: 'm-6',
    lg: 'm-8',
    xl: 'm-12',
  },
  
  // Specific therapeutic spacing patterns
  messageSpacing: 'mb-4',
  listItemSpacing: 'pl-1 mb-1',
  iconSpacing: 'mb-4',
} as const;

// ============================================================================
// THERAPEUTIC INTERACTIVE ELEMENTS
// ============================================================================

export const therapeuticInteractive = {
  // Icon buttons - small (8x8)
  iconButtonSmall: 'rounded-full h-8 w-8 p-0 hover:bg-primary/10 relative overflow-hidden group',
  
  // Icon buttons - medium (9x9) 
  iconButtonMedium: 'relative h-9 w-9 p-0 rounded-full hover:bg-primary/10 transition-all duration-300 group border-2 border-primary/20 overflow-hidden',
  
  // Icon buttons - large (10x10)
  iconButtonLarge: 'rounded-full h-10 w-10 p-0 hover:bg-primary/10 hover:text-primary transition-colors relative overflow-hidden group touch-manipulation',
  
  // Icon buttons - large disabled
  iconButtonLargeDisabled: 'rounded-full h-10 w-10 p-0 hover:bg-primary/10 hover:text-primary transition-colors relative overflow-hidden group touch-manipulation disabled:opacity-50',
  
  // Therapeutic status indicators
  statusIconContainer: 'mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4',
  
  // Session/item hover states
  itemHover: 'bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary',
} as const;

// ============================================================================
// THERAPEUTIC CONTENT FORMATTING
// ============================================================================

export const therapeuticContent = {
  // Markdown formatting for chat messages
  strongHighlight: 'font-bold text-foreground bg-primary/10 px-1 py-0.5 rounded',
  
  // List formatting
  listItem: 'text-foreground leading-relaxed pl-1',
  listItemWithMargin: 'text-foreground leading-relaxed pl-1 mb-1',
  
  // Table formatting
  tableHeader: 'bg-primary/10 border-b border-border/30',
  
  // Paragraph formatting
  paragraph: 'mb-4 text-foreground leading-relaxed last:mb-0',
} as const;

// ============================================================================
// COMPOSITE THERAPEUTIC STYLES
// ============================================================================

export const therapeuticComposite = {
  // Common card patterns
  therapeuticCard: `${therapeuticColors.neutral.card} ${therapeuticSpacing.md} rounded-lg ${therapeuticColors.subtle.border}`,
  
  // Chat message containers
  messageContainer: `${therapeuticSpacing.sm} ${therapeuticContent.paragraph}`,
  
  // Settings panels
  settingsPanel: `${therapeuticColors.neutral.background} ${therapeuticSpacing.lg}`,
  
  // Status displays
  statusDisplay: `${therapeuticInteractive.statusIconContainer}`,
  
  // Interactive lists
  interactiveListItem: `${therapeuticSpacing.sm} ${therapeuticInteractive.itemHover} transition-colors`,
} as const;

// ============================================================================
// UTILITY FUNCTIONS FOR DYNAMIC STYLING
// ============================================================================

/**
 * Combines therapeutic design tokens with additional classes
 * @param tokenKey - Key from therapeutic design tokens
 * @param additionalClasses - Additional Tailwind classes
 * @returns Combined class string
 */
export function combineTherapeuticStyles(
  tokenKey: string, 
  additionalClasses?: string
): string {
  return additionalClasses ? `${tokenKey} ${additionalClasses}` : tokenKey;
}

/**
 * Gets the appropriate icon button size based on context
 * @param size - Button size context
 * @param disabled - Whether button is disabled
 * @returns Appropriate therapeutic button classes
 */
export function getTherapeuticIconButton(
  size: 'small' | 'medium' | 'large' = 'medium',
  disabled = false
): string {
  if (size === 'small') return therapeuticInteractive.iconButtonSmall;
  if (size === 'medium') return therapeuticInteractive.iconButtonMedium;
  if (size === 'large' && disabled) return therapeuticInteractive.iconButtonLargeDisabled;
  return therapeuticInteractive.iconButtonLarge;
}

/**
 * Type definitions for better TypeScript integration
 */
export type TherapeuticColorKey = keyof typeof therapeuticColors;
export type TherapeuticTypographyKey = keyof typeof therapeuticTypography;
export type TherapeuticSpacingKey = keyof typeof therapeuticSpacing;
export type TherapeuticInteractiveKey = keyof typeof therapeuticInteractive;
export type TherapeuticContentKey = keyof typeof therapeuticContent;
export type TherapeuticCompositeKey = keyof typeof therapeuticComposite;