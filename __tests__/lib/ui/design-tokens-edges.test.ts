import { getIconButtonSize, combineClasses, therapeuticInteractive } from '@/lib/ui/design-tokens';

describe('design-tokens utility functions', () => {
  it('getIconButtonSize returns large by default and handles small', () => {
    expect(getIconButtonSize()).toBe(therapeuticInteractive.iconButtonLarge);
    expect(getIconButtonSize('small')).toBe(therapeuticInteractive.iconButtonSmall);
  });

  it('combineClasses removes duplicates and skips falsy', () => {
    const combined = combineClasses('text-base', undefined, 'text-base', 'font-semibold', '', 'font-semibold');
    expect(combined.split(' ').sort()).toEqual(['font-semibold', 'text-base'].sort());
  });
});


