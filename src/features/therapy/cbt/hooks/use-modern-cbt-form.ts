import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { cbtFormSchema, type CBTFormData, validateSection } from '../schemas/cbt-form-schema';
import { getInitialCBTFormData } from '@/types/therapy';

interface UseModernCBTFormOptions {
  autoSaveDelay?: number;
  onAutoSave?: (data: CBTFormData) => void;
}

interface UseModernCBTFormReturn {
  form: UseFormReturn<CBTFormData>;
  currentSection: string;
  setCurrentSection: (section: string) => void;
  progress: {
    overall: number;
    bySection: Record<string, number>;
  };
  navigation: {
    canGoNext: boolean;
    canGoPrevious: boolean;
    goNext: () => void;
    goPrevious: () => void;
  };
  validation: {
    isFormValid: boolean;
    isSectionValid: (sectionId: string) => boolean;
    getSectionErrors: (sectionId: string) => Record<string, string>;
  };
  actions: {
    handleSubmit: (onSubmit: (data: CBTFormData) => void) => (e?: React.BaseSyntheticEvent) => Promise<void>;
    reset: () => void;
    exportData: () => string;
  };
  state: {
    isDirty: boolean;
    isSubmitting: boolean;
    lastSaved?: Date;
  };
}

const SECTIONS = [
  { id: 'situation', name: 'Situation', required: true },
  { id: 'emotions', name: 'Emotions', required: true },
  { id: 'thoughts', name: 'Thoughts', required: true },
  { id: 'schema', name: 'Schema', required: true },
  { id: 'challenge', name: 'Challenge', required: true },
  { id: 'reflection', name: 'Reflection', required: false },
  { id: 'results', name: 'Results', required: false },
] as const;

export function useModernCBTForm(options: UseModernCBTFormOptions = {}): UseModernCBTFormReturn {
  const { autoSaveDelay = 2000, onAutoSave } = options;
  
  // Initialize react-hook-form with zod validation
  const form = useForm<CBTFormData>({
    resolver: zodResolver(cbtFormSchema),
    defaultValues: getInitialCBTFormData(),
    mode: 'onChange', // Real-time validation
  });

  // Current section state
  const [currentSection, setCurrentSection] = useState<string>('situation');
  
  // Auto-save functionality
  const autoSaveTimeout = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<Date>();

  // Watch form data for auto-save
  const formData = form.watch();
  
  useEffect(() => {
    if (!form.formState.isDirty || !onAutoSave) return;
    
    // Clear existing timeout
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    
    // Set new timeout for auto-save
    autoSaveTimeout.current = setTimeout(() => {
      const currentData = form.getValues();
      onAutoSave(currentData);
      lastSavedRef.current = new Date();
    }, autoSaveDelay);
    
    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
  }, [formData, form, form.formState.isDirty, onAutoSave, autoSaveDelay]);

  // Progress calculation
  const progress = useMemo(() => {
    const values = form.getValues();
    
    const sectionProgress: Record<string, number> = {};
    let completedSections = 0;
    
    SECTIONS.forEach((section) => {
      const { isValid } = validateSection(section.id, values);
      const completion = isValid ? 100 : getPartialCompletion(section.id, values);
      
      sectionProgress[section.id] = completion;
      if (completion === 100) completedSections++;
    });
    
    const overall = Math.round((completedSections / SECTIONS.length) * 100);
    
    return {
      overall,
      bySection: sectionProgress,
    };
  }, [form]); // Reactive to form changes

  // Navigation helpers
  const currentSectionIndex = SECTIONS.findIndex(s => s.id === currentSection);
  
  const navigation = useMemo(() => ({
    canGoNext: currentSectionIndex < SECTIONS.length - 1,
    canGoPrevious: currentSectionIndex > 0,
    goNext: () => {
      if (currentSectionIndex < SECTIONS.length - 1) {
        setCurrentSection(SECTIONS[currentSectionIndex + 1].id);
      }
    },
    goPrevious: () => {
      if (currentSectionIndex > 0) {
        setCurrentSection(SECTIONS[currentSectionIndex - 1].id);
      }
    },
  }), [currentSectionIndex]);

  // Validation helpers
  const validation = useMemo(() => ({
    isFormValid: form.formState.isValid,
    isSectionValid: (sectionId: string) => {
      const values = form.getValues();
      const { isValid } = validateSection(sectionId, values);
      return isValid;
    },
    getSectionErrors: (sectionId: string) => {
      const values = form.getValues();
      const { errors } = validateSection(sectionId, values);
      return errors;
    },
  }), [form]);

  // Action handlers
  const handleSubmit = useCallback((onSubmit: (data: CBTFormData) => void) => {
    return form.handleSubmit(async (data) => {
      try {
        await onSubmit(data);
        // Reset form dirty state after successful submission
        form.reset(data, { keepValues: true });
      } catch (error) {
        console.error('Form submission error:', error);
        // Handle submission errors here
      }
    });
  }, [form]);

  const reset = useCallback(() => {
    form.reset(getInitialCBTFormData());
    setCurrentSection('situation');
    lastSavedRef.current = undefined;
  }, [form]);

  const exportData = useCallback(() => {
    const data = form.getValues();
    return generateFormattedOutput(data);
  }, [form]);

  return {
    form,
    currentSection,
    setCurrentSection,
    progress,
    navigation,
    validation,
    actions: {
      handleSubmit,
      reset,
      exportData,
    },
    state: {
      isDirty: form.formState.isDirty,
      isSubmitting: form.formState.isSubmitting,
      lastSaved: lastSavedRef.current,
    },
  };
}

// Helper function to calculate partial completion for sections
function getPartialCompletion(sectionId: string, data: Partial<CBTFormData>): number {
  switch (sectionId) {
    case 'situation':
      let situationScore = 0;
      if (data.date) situationScore += 20;
      if (data.situation && data.situation.length >= 10) situationScore += 80;
      return situationScore;
      
    case 'emotions':
      const emotions = data.initialEmotions;
      if (!emotions) return 0;
      
      const hasNumericEmotion = Object.entries(emotions)
        .filter(([key]) => key !== 'other' && key !== 'otherIntensity')
        .some(([, value]) => typeof value === 'number' && value > 0);
      const hasOtherEmotion = emotions.other && emotions.otherIntensity && emotions.otherIntensity > 0;
      
      return hasNumericEmotion || hasOtherEmotion ? 100 : 0;
      
    case 'thoughts':
      const thoughts = data.automaticThoughts || [];
      return thoughts.some(t => t.thought.trim()) ? 100 : 0;
      
    case 'schema':
      let schemaScore = 0;
      if (data.coreBeliefText && data.coreBeliefText.length >= 5) schemaScore += 80;
      if (data.coreBeliefCredibility !== undefined) schemaScore += 20;
      return schemaScore;
      
    case 'challenge':
      const challenges = data.challengeQuestions || [];
      return challenges.some(q => q.answer.trim()) ? 100 : 0;
      
    case 'results':
      const finalEmotions = data.finalEmotions;
      if (!finalEmotions) return 0;
      
      const hasFinalEmotion = Object.entries(finalEmotions)
        .filter(([key]) => key !== 'other' && key !== 'otherIntensity')
        .some(([, value]) => typeof value === 'number' && value > 0);
      const hasFinalOtherEmotion = finalEmotions.other && finalEmotions.otherIntensity && finalEmotions.otherIntensity > 0;
      
      return hasFinalEmotion || hasFinalOtherEmotion ? 60 : 0;
      
    default:
      return 0;
  }
}

// Helper function to generate formatted output (similar to existing functionality)
function generateFormattedOutput(data: CBTFormData): string {
  const sections = [
    `**CBT Diary Entry - ${data.date}**\n`,
    
    `**SITUATION:**\n${data.situation}\n`,
    
    `**INITIAL EMOTIONS:**`,
    ...Object.entries(data.initialEmotions)
      .filter(([key, value]) => key !== 'other' && key !== 'otherIntensity' && typeof value === 'number' && value > 0)
      .map(([emotion, intensity]) => `- ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}: ${intensity}/10`),
    ...(data.initialEmotions.other && data.initialEmotions.otherIntensity ? 
      [`- ${data.initialEmotions.other}: ${data.initialEmotions.otherIntensity}/10`] : []),
    '',
    
    `**AUTOMATIC THOUGHTS:**`,
    ...data.automaticThoughts
      .filter(t => t.thought.trim())
      .map((thought, i) => `${i + 1}. ${thought.thought} (Credibility: ${thought.credibility}/10)`),
    '',
    
    `**CORE BELIEF:**\n${data.coreBeliefText} (Credibility: ${data.coreBeliefCredibility}/10)\n`,
    
    ...(data.challengeQuestions.some(q => q.answer.trim()) ? [
      `**CHALLENGE RESPONSES:**`,
      ...data.challengeQuestions
        .filter(q => q.answer.trim())
        .map(q => `Q: ${q.question}\nA: ${q.answer}`),
      '',
    ] : []),
    
    ...(data.rationalThoughts.some(t => t.thought.trim()) ? [
      `**RATIONAL THOUGHTS:**`,
      ...data.rationalThoughts
        .filter(t => t.thought.trim())
        .map((thought, i) => `${i + 1}. ${thought.thought} (Confidence: ${thought.confidence}/10)`),
      '',
    ] : []),
    
    `**FINAL EMOTIONS:**`,
    ...Object.entries(data.finalEmotions)
      .filter(([key, value]) => key !== 'other' && key !== 'otherIntensity' && typeof value === 'number' && value > 0)
      .map(([emotion, intensity]) => `- ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}: ${intensity}/10`),
    ...(data.finalEmotions.other && data.finalEmotions.otherIntensity ? 
      [`- ${data.finalEmotions.other}: ${data.finalEmotions.otherIntensity}/10`] : []),
  ];
  
  return sections.join('\n');
}