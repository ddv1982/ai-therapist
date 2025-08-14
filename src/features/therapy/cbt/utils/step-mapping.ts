/**
 * Central step mapping utility for CBT flow numbering
 * Single source of truth for step numbers to avoid DRY violations
 */

import type { CBTStep } from '../hooks/use-cbt-chat-flow';

// The canonical CBT steps in order - matches use-cbt-chat-flow.ts
export const CBT_STEPS: CBTStep[] = [
  'situation', 
  'emotions', 
  'thoughts', 
  'core-belief', 
  'challenge-questions', 
  'rational-thoughts', 
  'schema-modes',
  'actions'
];

// Total number of steps (excluding 'complete' which is not a user-facing step)
export const TOTAL_CBT_STEPS = CBT_STEPS.length;

/**
 * Get the step number (1-based) for a given CBT step
 * @param step - The CBT step to get the number for
 * @returns The step number (1-based) or 1 if not found
 */
export function getStepNumber(step: CBTStep): number {
  const index = CBT_STEPS.indexOf(step);
  return index >= 0 ? index + 1 : 1;
}

/**
 * Get the total number of steps for any CBT step
 * @returns The total number of CBT steps
 */
export function getTotalSteps(): number {
  return TOTAL_CBT_STEPS;
}

/**
 * Get both step number and total steps for a given CBT step
 * @param step - The CBT step to get numbers for
 * @returns Object with stepNumber and totalSteps
 */
export function getStepInfo(step: CBTStep): { stepNumber: number; totalSteps: number } {
  return {
    stepNumber: getStepNumber(step),
    totalSteps: getTotalSteps()
  };
}

/**
 * Check if a step is valid
 * @param step - The step to validate
 * @returns True if the step is valid
 */
export function isValidStep(step: CBTStep): boolean {
  return CBT_STEPS.includes(step);
}