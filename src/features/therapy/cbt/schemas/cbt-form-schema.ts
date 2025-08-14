import { z } from 'zod';

// Emotion validation schema (0-10 scale)
const emotionSchema = z.number().min(0).max(10);

// Emotions object schema
const emotionsSchema = z.object({
  fear: emotionSchema,
  anger: emotionSchema,
  sadness: emotionSchema,
  joy: emotionSchema,
  anxiety: emotionSchema,
  shame: emotionSchema,
  guilt: emotionSchema,
  other: z.string().optional(),
  otherIntensity: z.number().min(0).max(10).optional(),
});

// Export emotion type for use in components
export type EmotionsData = z.infer<typeof emotionsSchema>;

// Automatic thought schema
const automaticThoughtSchema = z.object({
  thought: z.string().min(1, "Thought cannot be empty"),
  credibility: z.number().min(0).max(10),
});

// Schema mode schema
const schemaModeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  selected: z.boolean(),
});

// Challenge question schema
const challengeQuestionSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

// Rational thought schema
const rationalThoughtSchema = z.object({
  thought: z.string().min(1, "Rational thought cannot be empty"),
  confidence: z.number().min(0).max(10),
});

// Alternative response schema
const alternativeResponseSchema = z.object({
  response: z.string().min(1, "Response cannot be empty"),
});

// Schema reflection question schema
const schemaReflectionQuestionSchema = z.object({
  question: z.string(),
  answer: z.string(),
  category: z.enum(['childhood', 'schemas', 'coping', 'modes', 'custom']),
  isRequired: z.boolean().optional(),
});

// Schema reflection data schema
const schemaReflectionSchema = z.object({
  enabled: z.boolean(),
  questions: z.array(schemaReflectionQuestionSchema),
  selfAssessment: z.string(),
});

// Main CBT form schema
export const cbtFormSchema = z.object({
  // Basic Information
  date: z.string().min(1, "Date is required"),
  situation: z.string().min(10, "Please describe the situation in detail (at least 10 characters)"),
  
  // Initial Emotions
  initialEmotions: emotionsSchema.refine(
    (emotions) => {
      // At least one emotion must be > 0 or other emotion must be specified
      const hasNumericEmotion = Object.entries(emotions)
        .filter(([key]) => key !== 'other' && key !== 'otherIntensity')
        .some(([, value]) => typeof value === 'number' && value > 0);
      
      const hasOtherEmotion = emotions.other && emotions.otherIntensity && emotions.otherIntensity > 0;
      
      return hasNumericEmotion || hasOtherEmotion;
    },
    {
      message: "Please rate at least one emotion or specify a custom emotion",
    }
  ),
  
  // Automatic Thoughts
  automaticThoughts: z.array(automaticThoughtSchema).min(1, "At least one automatic thought is required"),
  
  // Schema Information
  coreBeliefText: z.string().min(5, "Please describe your core belief"),
  coreBeliefCredibility: z.number().min(0).max(10),
  confirmingBehaviors: z.string().optional(),
  avoidantBehaviors: z.string().optional(),
  overridingBehaviors: z.string().optional(),
  schemaModes: z.array(schemaModeSchema),
  
  // Challenge Questions
  challengeQuestions: z.array(challengeQuestionSchema),
  additionalQuestions: z.array(challengeQuestionSchema),
  rationalThoughts: z.array(rationalThoughtSchema),
  
  // Schema Reflection (optional)
  schemaReflection: schemaReflectionSchema,
  
  // Final Results
  finalEmotions: emotionsSchema,
  originalThoughtCredibility: z.number().min(0).max(10),
  newBehaviors: z.string().optional(),
  alternativeResponses: z.array(alternativeResponseSchema),
});

// Type inference from schema
export type CBTFormData = z.infer<typeof cbtFormSchema>;

// Form field validation functions
export const validateSection = (sectionId: string, data: Partial<CBTFormData>) => {
  try {
    switch (sectionId) {
      case 'situation':
        cbtFormSchema.pick({ date: true, situation: true }).parse(data);
        return { isValid: true, errors: {} };
      
      case 'emotions':
        cbtFormSchema.pick({ initialEmotions: true }).parse(data);
        return { isValid: true, errors: {} };
      
      case 'thoughts':
        cbtFormSchema.pick({ automaticThoughts: true }).parse(data);
        return { isValid: true, errors: {} };
      
      case 'schema':
        cbtFormSchema.pick({ 
          coreBeliefText: true, 
          coreBeliefCredibility: true,
          schemaModes: true 
        }).parse(data);
        return { isValid: true, errors: {} };
      
      case 'challenge':
        cbtFormSchema.pick({ challengeQuestions: true }).parse(data);
        return { isValid: true, errors: {} };
      
      case 'results':
        cbtFormSchema.pick({ finalEmotions: true }).parse(data);
        return { isValid: true, errors: {} };
      
      default:
        return { isValid: true, errors: {} };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path.join('.')] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Validation error' } };
  }
};

// Helper to check if form is ready for submission
export const isFormReadyForSubmission = (data: Partial<CBTFormData>) => {
  try {
    // Check required sections
    const requiredFields = cbtFormSchema.pick({
      date: true,
      situation: true,
      initialEmotions: true,
      automaticThoughts: true,
      coreBeliefText: true,
      coreBeliefCredibility: true,
    });
    
    requiredFields.parse(data);
    return true;
  } catch {
    return false;
  }
};