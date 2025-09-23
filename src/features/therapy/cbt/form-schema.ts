import { z } from 'zod';

export const cbtFormSchema = z.object({
  situation: z.string().min(10, 'Please describe the situation in at least 10 characters'),
  emotions: z.array(z.object({
    emotion: z.string().min(1, 'Emotion name is required'),
    intensity: z.number().min(0, 'Intensity must be 0-10').max(10, 'Intensity must be 0-10'),
  })).min(1, 'Please rate at least one emotion'),
  thoughts: z
    .array(z.string().min(5, 'Each thought must be at least 5 characters'))
    .min(1, 'Please record at least one thought'),
  coreBeliefs: z.array(z.string().min(5, 'Core belief must be at least 5 characters')).optional(),
  challengeQuestions: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string().min(10, 'Please provide a thoughtful answer'),
      }),
    )
    .optional(),
  rationalThoughts: z
    .array(z.string().min(10, 'Rational thoughts must be at least 10 characters'))
    .optional(),
  schemaModes: z
    .array(
      z.object({
        mode: z.string(),
        description: z.string(),
        intensity: z.number().min(0).max(10),
      }),
    )
    .optional(),
  actionPlan: z
    .object({
      actions: z.array(z.string().min(5, 'Action must be at least 5 characters')),
      timeframe: z.string().optional(),
      resources: z.array(z.string()).optional(),
    })
    .optional(),
});

export type CBTFormData = z.infer<typeof cbtFormSchema>;


