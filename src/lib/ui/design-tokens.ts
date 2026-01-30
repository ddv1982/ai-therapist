/**
 * Design Tokens - minimal shared UI tokens.
 * Keep exports to the few tokens used in the app.
 */

export const therapeuticTypography = {
  heading: 'text-3xl font-semibold',
  subheading: 'text-xl font-semibold',
  body: 'text-base',
  small: 'text-sm',
  headingPrimary: 'text-3xl font-semibold text-foreground',
  subheadingPrimary: 'text-xl font-semibold text-foreground',
  bodyPrimary: 'text-base text-foreground',
  bodySecondary: 'text-base text-muted-foreground',
  smallPrimary: 'text-sm text-foreground',
  smallSecondary: 'text-sm text-muted-foreground',
  button: 'text-base font-semibold',
  label: 'text-sm font-semibold',
  messageText: 'text-base text-foreground leading-relaxed',
  strongText: 'font-semibold text-foreground',
} as const;

const iconButtonSizes = {
  small: 'h-8 w-8 p-0 rounded-full hover:bg-primary/10 transition-colors',
  large: 'h-12 w-12 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors',
} as const;

export function getIconButtonSize(size: 'small' | 'large' = 'large'): string {
  return iconButtonSizes[size];
}
