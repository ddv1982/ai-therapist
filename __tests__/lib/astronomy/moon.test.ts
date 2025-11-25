import { getMoonPhase, type MoonPhaseName } from '@/lib/astronomy/moon';

describe('Moon Phase Calculation', () => {
  describe('Major Moon Phases', () => {
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

    it('calculates First Quarter correctly', () => {
      // First Quarter: approximately 7 days after New Moon
      // Jan 14, 2000 was a First Quarter
      const date = new Date('2000-01-14T13:34:00Z');
      const phase = getMoonPhase(date);
      expect(phase.name).toBe('First Quarter');
      expect(phase.illumination).toBeGreaterThan(40);
      expect(phase.illumination).toBeLessThan(60);
    });

    it('calculates Last Quarter correctly', () => {
      // Last Quarter: approximately 22 days after New Moon
      // Jan 28, 2000 was a Last Quarter
      const date = new Date('2000-01-28T07:57:00Z');
      const phase = getMoonPhase(date);
      expect(phase.name).toBe('Last Quarter');
      expect(phase.illumination).toBeGreaterThan(40);
      expect(phase.illumination).toBeLessThan(60);
    });
  });

  describe('Intermediate Moon Phases', () => {
    it('calculates Waxing Crescent correctly', () => {
      // Waxing Crescent: between New Moon and First Quarter (days 1-6)
      // Jan 10, 2000 (~4 days after New Moon)
      const date = new Date('2000-01-10T12:00:00Z');
      const phase = getMoonPhase(date);
      expect(phase.name).toBe('Waxing Crescent');
      expect(phase.illumination).toBeGreaterThan(5);
      expect(phase.illumination).toBeLessThan(50);
    });

    it('calculates Waxing Gibbous correctly', () => {
      // Waxing Gibbous: between First Quarter and Full Moon (days 8-13)
      // Jan 17, 2000 (~11 days after New Moon)
      const date = new Date('2000-01-17T12:00:00Z');
      const phase = getMoonPhase(date);
      expect(phase.name).toBe('Waxing Gibbous');
      expect(phase.illumination).toBeGreaterThan(50);
      expect(phase.illumination).toBeLessThan(95);
    });

    it('calculates Waning Gibbous correctly', () => {
      // Waning Gibbous: between Full Moon and Last Quarter (days 16-21)
      // Jan 24, 2000 (~18 days after New Moon)
      const date = new Date('2000-01-24T12:00:00Z');
      const phase = getMoonPhase(date);
      expect(phase.name).toBe('Waning Gibbous');
      expect(phase.illumination).toBeGreaterThan(50);
      expect(phase.illumination).toBeLessThan(95);
    });

    it('calculates Waning Crescent correctly', () => {
      // Waning Crescent: between Last Quarter and New Moon (days 24-28)
      // Jan 31, 2000 (~25 days after New Moon)
      const date = new Date('2000-01-31T12:00:00Z');
      const phase = getMoonPhase(date);
      expect(phase.name).toBe('Waning Crescent');
      expect(phase.illumination).toBeGreaterThan(5);
      expect(phase.illumination).toBeLessThan(50);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('handles New Moon at end of lunar cycle (fraction > 0.965)', () => {
      // Just before the next New Moon
      // Feb 4, 2000 (~28.5 days after Jan 6 New Moon)
      const date = new Date('2000-02-04T12:00:00Z');
      const phase = getMoonPhase(date);
      expect(phase.name).toBe('New Moon');
      expect(phase.illumination).toBeLessThan(10);
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

    it('handles date without parameter (uses current date)', () => {
      const phase = getMoonPhase();
      expect(phase.name).toBeDefined();
      expect([
        'New Moon',
        'Waxing Crescent',
        'First Quarter',
        'Waxing Gibbous',
        'Full Moon',
        'Waning Gibbous',
        'Last Quarter',
        'Waning Crescent',
      ]).toContain(phase.name);
    });

    it('handles leap year date (Feb 29 2000)', () => {
      const date = new Date('2000-02-29T12:00:00Z');
      const phase = getMoonPhase(date);
      expect(phase).toBeDefined();
      expect(phase.name).toBeDefined();
      expect(phase.age).toBeGreaterThanOrEqual(0);
      expect(phase.age).toBeLessThan(30);
    });

    it('handles year boundary (Dec 31 1999 to Jan 1 2000)', () => {
      const dec31 = getMoonPhase(new Date('1999-12-31T23:59:59Z'));
      const jan1 = getMoonPhase(new Date('2000-01-01T00:00:01Z'));

      // Phases should be very close since they're only 2 seconds apart
      expect(Math.abs(dec31.fraction - jan1.fraction)).toBeLessThan(0.001);
    });

    it('handles far future date (year 2100)', () => {
      const date = new Date('2100-06-15T12:00:00Z');
      const phase = getMoonPhase(date);
      expect(phase).toBeDefined();
      expect(phase.fraction).toBeGreaterThanOrEqual(0);
      expect(phase.fraction).toBeLessThanOrEqual(1);
    });

    it('handles far past date (year 1900)', () => {
      const date = new Date('1900-06-15T12:00:00Z');
      const phase = getMoonPhase(date);
      expect(phase).toBeDefined();
      expect(phase.fraction).toBeGreaterThanOrEqual(0);
      expect(phase.fraction).toBeLessThanOrEqual(1);
    });

    it('maintains consistent illumination range (0-100)', () => {
      // Test multiple dates throughout a lunar cycle
      const dates = [
        '2000-01-06T12:00:00Z', // New Moon
        '2000-01-10T12:00:00Z', // Waxing Crescent
        '2000-01-14T12:00:00Z', // First Quarter
        '2000-01-17T12:00:00Z', // Waxing Gibbous
        '2000-01-21T12:00:00Z', // Full Moon
        '2000-01-24T12:00:00Z', // Waning Gibbous
        '2000-01-28T12:00:00Z', // Last Quarter
        '2000-01-31T12:00:00Z', // Waning Crescent
      ];

      dates.forEach((dateStr) => {
        const phase = getMoonPhase(new Date(dateStr));
        expect(phase.illumination).toBeGreaterThanOrEqual(0);
        expect(phase.illumination).toBeLessThanOrEqual(100);
      });
    });

    it('maintains consistent age range (0 to ~29.53 days)', () => {
      const LUNAR_MONTH = 29.53058867;
      const dates = [
        '2000-01-06T12:00:00Z',
        '2000-01-10T12:00:00Z',
        '2000-01-14T12:00:00Z',
        '2000-01-21T12:00:00Z',
        '2000-01-28T12:00:00Z',
      ];

      dates.forEach((dateStr) => {
        const phase = getMoonPhase(new Date(dateStr));
        expect(phase.age).toBeGreaterThanOrEqual(0);
        expect(phase.age).toBeLessThan(LUNAR_MONTH);
      });
    });
  });

  describe('Phase Name Coverage', () => {
    it('covers all 8 moon phase names throughout a lunar cycle', () => {
      // Using Jan 2000 lunar cycle starting from New Moon on Jan 6
      const phaseTests: { date: string; expectedPhase: MoonPhaseName }[] = [
        { date: '2000-01-06T12:24:00Z', expectedPhase: 'New Moon' },
        { date: '2000-01-10T12:00:00Z', expectedPhase: 'Waxing Crescent' },
        { date: '2000-01-14T13:34:00Z', expectedPhase: 'First Quarter' },
        { date: '2000-01-17T12:00:00Z', expectedPhase: 'Waxing Gibbous' },
        { date: '2000-01-21T04:40:00Z', expectedPhase: 'Full Moon' },
        { date: '2000-01-24T12:00:00Z', expectedPhase: 'Waning Gibbous' },
        { date: '2000-01-28T07:57:00Z', expectedPhase: 'Last Quarter' },
        { date: '2000-01-31T12:00:00Z', expectedPhase: 'Waning Crescent' },
      ];

      phaseTests.forEach(({ date, expectedPhase }) => {
        const phase = getMoonPhase(new Date(date));
        expect(phase.name).toBe(expectedPhase);
      });
    });
  });
});
