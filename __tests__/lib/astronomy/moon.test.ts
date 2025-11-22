import { getMoonPhase } from '@/lib/astronomy/moon';

describe('Moon Phase Calculation', () => {
  it('calculates New Moon correctly (approx Jan 6 2000)', () => {
    // Jan 6, 2000 was a New Moon
    const date = new Date('2000-01-06T12:24:00Z');
    const phase = getMoonPhase(date);
    expect(phase.name).toBe('New Moon');
    expect(phase.illumination).toBeLessThan(5); // Close to 0
  });

  it('calculates Full Moon correctly (approx Jan 21 2000)', () => {
    // Jan 21, 2000 was a Full Moon
    const date = new Date('2000-01-21T04:40:00Z');
    const phase = getMoonPhase(date);
    expect(phase.name).toBe('Full Moon');
    expect(phase.illumination).toBeGreaterThan(95); // Close to 100
  });

  it('returns consistent data structure', () => {
    const phase = getMoonPhase();
    expect(phase).toHaveProperty('fraction');
    expect(phase).toHaveProperty('name');
    expect(phase).toHaveProperty('illumination');
    expect(phase).toHaveProperty('age');
    expect(phase.fraction).toBeGreaterThanOrEqual(0);
    expect(phase.fraction).toBeLessThanOrEqual(1);
  });
});
