/**
 * Message Design System - Single Source of Truth
 * Centralized styling system for all message components
 */

// Base message structure - common to all message types
export const messageBase = {
  container: "flex items-start gap-4 mb-6 max-w-4xl mx-auto",
  avatar: "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm",
  contentWrapper: "flex-1 min-w-0",
  bubble: "p-4 rounded-2xl shadow-sm break-words selectable-text transition-all duration-200 hover:shadow-md",
  timestamp: "text-xs mt-2 px-1 opacity-70",
} as const;

// Role-specific variants
export const messageVariants = {
  user: {
    container: "flex-row-reverse gap-reverse",
    avatar: "bg-primary text-primary-foreground shadow-lg",
    contentWrapper: "text-right",
    bubble: "bg-primary text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-md shadow-sm hover:shadow-md transition-shadow duration-200 max-w-[min(80%,_42rem)] ml-auto",
    timestamp: "text-white/80 text-right",
  },
  assistant: {
    container: "flex-row",
    avatar: "bg-purple-600 shadow-lg",
    contentWrapper: "text-left", 
    bubble: "bg-card/95 backdrop-blur-sm border border-border/20 text-foreground rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-md shadow-md max-w-[min(85%,_45rem)] mr-auto",
    timestamp: "text-muted-foreground text-left",
  }
} as const;

// Note: Content styling now handled by CSS classes in globals.css for simplicity

// Typography scale for messages
export const messageTypography = {
  h1: "text-xl sm:text-2xl font-bold mb-4 mt-6 first:mt-0",
  h2: "text-lg sm:text-xl font-semibold mb-3 mt-6 first:mt-0", 
  h3: "text-base sm:text-lg font-semibold mb-2 mt-4 first:mt-0",
  body: "text-base leading-relaxed",
  small: "text-sm leading-normal",
} as const;

// Note: List styling now handled by standard browser defaults with CSS classes

// CBT Component styling tokens - extends message system for forms
export const cbtComponentTokens = {
  // Modal sections match message bubble aesthetic
  modal: {
    header: "px-6 py-4 border-b border-border/30 flex-shrink-0",
    navigation: "px-6 py-3 border-b border-border/20 bg-muted/20 flex-shrink-0", 
    content: "flex-1 overflow-y-auto p-6",
    footer: "px-6 py-5 flex-shrink-0"
  },
  
  // Form sections styled like message content areas
  section: {
    container: "space-y-6",
    header: "text-lg font-semibold mb-4 flex items-center gap-2 text-foreground",
    subHeader: "text-base font-semibold mb-4 text-foreground",
    description: "text-sm text-muted-foreground mb-4"
  },

  // Form inputs matching message bubble styling with improved UX
  input: {
    field: "w-full min-h-[120px] resize-none bg-card border border-border/30 rounded-lg p-4 text-foreground leading-relaxed hover:border-border/50 focus:border-primary/50 transition-colors duration-200",
    label: "block text-sm font-medium mb-2 text-foreground",
    helper: "text-xs text-muted-foreground mt-2",
    error: "text-red-500 text-xs mt-1",
    required: "text-red-500"
  },

  // Emotion sliders with message system colors
  slider: {
    container: "space-y-2",
    label: "flex justify-between items-center",
    labelText: "text-sm font-medium text-foreground",
    value: "text-sm text-muted-foreground font-mono",
    track: "w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer",
    scale: "flex justify-between text-xs text-muted-foreground"
  },

  // Array fields styled like message content blocks
  arrayField: {
    container: "space-y-4",
    item: "relative p-4 border border-border/30 rounded-lg bg-card/50",
    empty: "text-sm text-muted-foreground text-center py-4 italic",
    addButton: "w-full h-12 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-colors",
    removeButton: "absolute top-2 right-2 h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
  },

  // Navigation tabs match message system aesthetic
  navigation: {
    tab: "flex items-center gap-2 h-8 px-3 text-xs rounded-md transition-colors",
    tabActive: "bg-primary text-primary-foreground",
    tabInactive: "bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground",
    tabError: "border-red-300 text-red-600"
  },

  // Buttons following message system patterns with improved feel
  button: {
    primary: "h-10 px-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium transition-all duration-200",
    secondary: "h-10 px-6 bg-transparent border border-border/30 hover:bg-muted/50 font-medium transition-all duration-200",
    ghost: "h-9 px-4 bg-transparent hover:bg-muted/50 transition-colors duration-200",
    navigation: "h-9 px-4 bg-transparent hover:bg-muted/50 transition-colors duration-200"
  }
} as const;

// Complete message design system
export const messageDesignSystem = {
  base: messageBase,
  variants: messageVariants,
  typography: messageTypography,
  cbt: cbtComponentTokens,
} as const;

// Type definitions
export type MessageRole = 'user' | 'assistant';
export type MessageVariant = keyof typeof messageVariants;

/**
 * Get design tokens for a specific message role
 */
export function getMessageTokens(role: MessageRole) {
  return {
    base: messageBase,
    variant: messageVariants[role],
    typography: messageTypography,
  };
}

/**
 * Get CBT component design tokens
 */
export function getCBTTokens() {
  return messageDesignSystem.cbt;
}

/**
 * Utility function to build message classes
 */
export function buildMessageClasses(role: MessageRole, element: keyof typeof messageBase) {
  const tokens = getMessageTokens(role);
  return `${tokens.base[element]} ${tokens.variant[element] || ''}`.trim();
}