import { getIconButtonSize, therapeuticTypography } from '@/lib/ui/design-tokens';

describe('design-tokens utility functions', () => {
  it('getIconButtonSize returns large by default and handles small', () => {
    expect(getIconButtonSize()).toBe(
      'h-12 w-12 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors'
    );
    expect(getIconButtonSize('small')).toBe(
      'h-8 w-8 p-0 rounded-full hover:bg-primary/10 transition-colors'
    );
  });

  it('therapeuticTypography exposes shared classes', () => {
    expect(therapeuticTypography.heading).toBe('text-3xl font-semibold');
    expect(therapeuticTypography.bodySecondary).toBe('text-base text-muted-foreground');
  });
});
