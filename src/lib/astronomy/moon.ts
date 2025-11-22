/**
 * Moon Phase Calculation Utilities
 * Calculates the current moon phase based on the Julian Date.
 *
 * Algorithms based on standard astronomical formulas.
 */

export type MoonPhaseName =
  | 'New Moon'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full Moon'
  | 'Waning Gibbous'
  | 'Last Quarter'
  | 'Waning Crescent';

export interface MoonPhaseData {
  /**
   * Phase fraction from 0.0 to 1.0
   * 0.0 = New Moon
   * 0.25 = First Quarter
   * 0.5 = Full Moon
   * 0.75 = Last Quarter
   */
  fraction: number;
  
  /**
   * The common name of the phase
   */
  name: MoonPhaseName;
  
  /**
   * Percentage of the moon illuminated (0-100)
   */
  illumination: number;
  
  /**
   * Age of the moon in days (0 to ~29.53)
   */
  age: number;
}

const LUNAR_MONTH = 29.53058867; // Synodic month in days

/**
 * Calculates the current moon phase for a given date
 */
export function getMoonPhase(date: Date = new Date()): MoonPhaseData {
  const julian = getJulianDate(date);
  const daysSinceNew = julian - 2451549.5; // Known New Moon: Jan 6, 2000 12:24:01 UTC
  const newMoons = daysSinceNew / LUNAR_MONTH;
  const currentCycle = newMoons - Math.floor(newMoons);
  
  // Ensure positive fraction
  const fraction = currentCycle < 0 ? currentCycle + 1 : currentCycle;
  const age = fraction * LUNAR_MONTH;
  
  // Calculate illumination (0 to 1)
  // 0 at New (0.0) and (1.0), 1 at Full (0.5)
  const illumination = (1 - Math.cos(fraction * 2 * Math.PI)) / 2;

  return {
    fraction,
    name: getPhaseName(fraction),
    illumination: Math.round(illumination * 100),
    age
  };
}

/**
 * Converts a JS Date to Julian Date
 */
function getJulianDate(date: Date): number {
  const time = date.getTime();
  return time / 86400000 + 2440587.5;
}

/**
 * Determines the phase name based on the fraction
 */
function getPhaseName(fraction: number): MoonPhaseName {
  // Phase buffer aligned with NASA standards
  // 0.035 gives ~1 day (24.8 hours) for each major phase period
  // This matches astronomical calendars where major phases (New, Full, Quarters) last ~1-2 days
  const buffer = 0.035;

  if (fraction < buffer || fraction > 1 - buffer) return 'New Moon';
  if (fraction < 0.25 - buffer) return 'Waxing Crescent';
  if (fraction < 0.25 + buffer) return 'First Quarter';
  if (fraction < 0.5 - buffer) return 'Waxing Gibbous';
  if (fraction < 0.5 + buffer) return 'Full Moon';
  if (fraction < 0.75 - buffer) return 'Waning Gibbous';
  if (fraction < 0.75 + buffer) return 'Last Quarter';
  return 'Waning Crescent';
}
