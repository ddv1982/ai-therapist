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
 * Calculates the current moon phase for a given date using Meeus' accurate algorithm
 * Implements Jean Meeus' Astronomical Algorithms (Chapter 48) with perturbations
 */
export function getMoonPhase(date: Date = new Date()): MoonPhaseData {
  const julian = getJulianDate(date);
  
  // Calculate time in Julian centuries from J2000.0
  const T = (julian - 2451545.0) / 36525.0;
  
  // Calculate mean elongation of the Moon (D) - Meeus formula 47.2
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T * T * T / 545868.0 - T * T * T * T / 113065000.0;
  
  // Calculate Sun's mean anomaly (M) - Meeus formula 47.3
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + T * T * T / 24490000.0;
  
  // Calculate Moon's mean anomaly (Mp) - Meeus formula 47.4
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + T * T * T / 69699.0 - T * T * T * T / 14712000.0;
  
  // Normalize to 0-360 degrees
  const DNorm = ((D % 360) + 360) % 360;
  const MNorm = ((M % 360) + 360) % 360;
  const MpNorm = ((Mp % 360) + 360) % 360;
  
  // Convert to radians
  const toRad = Math.PI / 180;
  const MRad = MNorm * toRad;
  const MpRad = MpNorm * toRad;
  const DRad = DNorm * toRad;
  
  // Calculate phase angle (i) using Meeus formula 48.4
  // This accounts for perturbations from orbital eccentricities
  const iDeg = 180 - DNorm 
    - 6.289 * Math.sin(MpRad)
    + 2.1 * Math.sin(MRad)
    - 1.274 * Math.sin(2 * DRad - MpRad)
    - 0.658 * Math.sin(2 * DRad)
    - 0.214 * Math.sin(2 * MpRad)
    - 0.11 * Math.sin(DRad);
  
  const iNorm = ((iDeg % 360) + 360) % 360;
  const iRad = iNorm * toRad;
  
  // Calculate illuminated fraction using phase angle
  // Formula: k = (1 + cos(i)) / 2
  const illumination = (1 + Math.cos(iRad)) / 2;
  
  // Convert elongation to phase fraction (0-1) for phase naming
  const fraction = DNorm / 360;
  const age = fraction * LUNAR_MONTH;
  
  // Clamp to 0-1 range
  const clampedIllumination = Math.max(0, Math.min(1, illumination));

  return {
    fraction,
    name: getPhaseName(fraction),
    illumination: Math.round(clampedIllumination * 100),
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
