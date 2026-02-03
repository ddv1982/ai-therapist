/**
 * Message Design System - Single Source of Truth
 * Centralized styling system for all message components
 */

// Base message structure - common to all message types
export const messageBase = {
  container: 'flex items-start gap-0 md:gap-4 mb-6 max-w-4xl mx-auto',
  avatar:
    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm',
  contentWrapper: 'flex-1 min-w-0',
  bubble:
    'p-4 rounded-2xl shadow-sm break-words selectable-text transition-all duration-200 hover:shadow-md',
  timestamp: 'text-sm mt-2 px-1 opacity-70',
} as const;

// Role-specific variants
export const messageVariants = {
  user: {
    container: 'flex-row md:flex-row-reverse md:gap-reverse',
    avatar: 'bg-primary text-primary-foreground shadow-lg',
    contentWrapper: 'text-left',
    bubble:
      'bg-primary text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-md shadow-sm hover:shadow-md transition-shadow duration-200 max-w-none md:max-w-[min(80%,_42rem)] md:ml-auto',
    timestamp: 'text-white/80 text-left',
  },
  assistant: {
    container: 'flex-row',
    avatar: 'bg-purple-600 shadow-lg',
    contentWrapper: 'text-left',
    bubble:
      'bg-card/95 backdrop-blur-sm text-foreground rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-md shadow-md max-w-none md:max-w-[min(85%,_45rem)] md:mr-auto',
    timestamp: 'text-muted-foreground text-left',
  },
} as const;

// Note: Content styling now handled by CSS classes in globals.css for simplicity

// Typography scale for messages
export const messageTypography = {
  h1: 'text-3xl font-semibold mb-4 mt-6 first:mt-0',
  h2: 'text-xl font-semibold mb-3 mt-6 first:mt-0',
  h3: 'text-base font-semibold mb-2 mt-4 first:mt-0',
  body: 'text-base leading-relaxed',
  small: 'text-sm leading-normal',
} as const;

// Note: List styling now handled by standard browser defaults with CSS classes

// Complete message design system
export const messageDesignSystem = {
  base: messageBase,
  variants: messageVariants,
  typography: messageTypography,
} as const;

// Type definitions
export type MessageRole = 'user' | 'assistant';

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
 * Utility function to build message classes
 */
export function buildMessageClasses(role: MessageRole, element: keyof typeof messageBase) {
  const tokens = getMessageTokens(role);
  const baseClass = tokens.base[element] || '';
  const variantClass = tokens.variant[element] || '';
  return `${baseClass} ${variantClass}`.trim();
}
