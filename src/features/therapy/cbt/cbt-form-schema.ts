import { z } from 'zod';
import { createInitialCBTFormData, type CBTFormData as ConsolidatedCBTFormData } from '@/types';

// Zod schema aligned with consolidated CBT types
export const cbtRHFSchema = z.object({
  date: z.string().min(4),
  situation: z.string().min(5, 'Please describe the situation (≥ 5 chars)'),
  initialEmotions: z.object({
    fear: z.number().min(0).max(10),
    anger: z.number().min(0).max(10),
    sadness: z.number().min(0).max(10),
    joy: z.number().min(0).max(10),
    anxiety: z.number().min(0).max(10),
    shame: z.number().min(0).max(10),
    guilt: z.number().min(0).max(10),
    other: z.string().optional(),
    otherIntensity: z.number().min(0).max(10).optional(),
  }),
  finalEmotions: z.object({
    fear: z.number().min(0).max(10),
    anger: z.number().min(0).max(10),
    sadness: z.number().min(0).max(10),
    joy: z.number().min(0).max(10),
    anxiety: z.number().min(0).max(10),
    shame: z.number().min(0).max(10),
    guilt: z.number().min(0).max(10),
    other: z.string().optional(),
    otherIntensity: z.number().min(0).max(10).optional(),
  }),
  automaticThoughts: z
    .array(
      z.object({
        thought: z.string().min(3),
        credibility: z.number().min(0).max(10),
      })
    )
    .min(1),
  coreBeliefText: z.string().min(0).optional().default(''),
  coreBeliefCredibility: z.number().min(0).max(10),
  challengeQuestions: z.array(z.object({ question: z.string().min(0), answer: z.string().min(0) })),
  rationalThoughts: z.array(
    z.object({ thought: z.string().min(0), confidence: z.number().min(0).max(10) })
  ),
  schemaModes: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      selected: z.boolean(),
      intensity: z.number().min(0).max(10).optional(),
    })
  ),
  newBehaviors: z.string().optional(),
  // alternativeResponses removed from current UX
  originalThoughtCredibility: z.number().min(0).max(10).optional(),
});

export type CBTFormInput = z.infer<typeof cbtRHFSchema>;

export function getDefaultCBTValues(): ConsolidatedCBTFormData {
  return createInitialCBTFormData();
}
