import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  CBTDiaryFormData, 
  CBTDiaryFormState, 
  CBTFormValidationError,
  getInitialCBTFormData 
} from '@/types/cbt';

interface UseCBTFormOptions {
  autoSaveDelay?: number; // milliseconds
  validateOnChange?: boolean;
}

interface UseCBTFormReturn {
  formData: CBTDiaryFormData;
  formState: CBTDiaryFormState;
  updateField: <K extends keyof CBTDiaryFormData>(field: K, value: CBTDiaryFormData[K]) => void;
  updateNestedField: (path: string, value: any) => void;
  addAutomaticThought: () => void;
  removeAutomaticThought: (index: number) => void;
  addRationalThought: () => void;
  removeRationalThought: (index: number) => void;
  addAdditionalQuestion: () => void;
  removeAdditionalQuestion: (index: number) => void;
  addAlternativeResponse: () => void;
  removeAlternativeResponse: (index: number) => void;
  updateSchemaMode: (modeId: string, selected: boolean) => void;
  validateForm: () => CBTFormValidationError[];
  resetForm: () => void;
  generateFormattedOutput: () => string;
  isDirty: boolean;
  isValid: boolean;
  errors: Record<string, string>;
  lastSaved?: Date;
}

export function useCBTForm(options: UseCBTFormOptions = {}): UseCBTFormReturn {
  const { autoSaveDelay = 1000, validateOnChange = true } = options;
  
  const [formData, setFormData] = useState<CBTDiaryFormData>(getInitialCBTFormData);
  const [formState, setFormState] = useState<CBTDiaryFormState>({
    data: formData,
    isDirty: false,
    isValid: false,
    errors: {}
  });
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const initialDataRef = useRef<CBTDiaryFormData>(getInitialCBTFormData());

  // Validation function
  const validateForm = useCallback((): CBTFormValidationError[] => {
    const errors: CBTFormValidationError[] = [];

    // Required field validation
    if (!formData.situation.trim()) {
      errors.push({ field: 'situation', message: 'Situation description is required' });
    }

    // At least one emotion with intensity > 0
    const hasEmotions = Object.entries(formData.initialEmotions).some(([key, value]) => {
      if (key === 'other' || key === 'otherIntensity') return false;
      return typeof value === 'number' && value > 0;
    });
    
    if (!hasEmotions && formData.initialEmotions.otherIntensity === 0) {
      errors.push({ field: 'initialEmotions', message: 'Please rate at least one emotion' });
    }

    // At least one automatic thought
    const hasValidThoughts = formData.automaticThoughts.some(t => t.thought.trim().length > 0);
    if (!hasValidThoughts) {
      errors.push({ field: 'automaticThoughts', message: 'Please enter at least one automatic thought' });
    }

    // Core belief
    if (!formData.coreBeliefText.trim()) {
      errors.push({ field: 'coreBeliefText', message: 'Core belief is required' });
    }

    return errors;
  }, [formData]);

  // Update form state when data changes
  useEffect(() => {
    const errors = validateOnChange ? validateForm() : [];
    const errorMap = errors.reduce((acc, error) => {
      acc[error.field] = error.message;
      return acc;
    }, {} as Record<string, string>);

    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialDataRef.current);
    const isValid = errors.length === 0;

    setFormState({
      data: formData,
      isDirty,
      isValid,
      errors: errorMap,
      lastSaved: formState.lastSaved
    });

    // Auto-save functionality (could be extended to save to localStorage)
    if (isDirty && autoSaveDelay > 0) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        // Here you could save to localStorage or send to API
        localStorage.setItem('cbt-form-draft', JSON.stringify(formData));
        setFormState(prev => ({ ...prev, lastSaved: new Date() }));
      }, autoSaveDelay);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, validateOnChange, validateForm, autoSaveDelay, formState.lastSaved]);

  // Generic field update
  const updateField = useCallback(<K extends keyof CBTDiaryFormData>(
    field: K, 
    value: CBTDiaryFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Nested field update for complex objects
  const updateNestedField = useCallback((path: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  }, []);

  // Automatic thoughts management
  const addAutomaticThought = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      automaticThoughts: [...prev.automaticThoughts, { thought: '', credibility: 0 }]
    }));
  }, []);

  const removeAutomaticThought = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      automaticThoughts: prev.automaticThoughts.filter((_, i) => i !== index)
    }));
  }, []);

  // Rational thoughts management
  const addRationalThought = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      rationalThoughts: [...prev.rationalThoughts, { thought: '', confidence: 0 }]
    }));
  }, []);

  const removeRationalThought = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      rationalThoughts: prev.rationalThoughts.filter((_, i) => i !== index)
    }));
  }, []);

  // Additional questions management
  const addAdditionalQuestion = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      additionalQuestions: [...prev.additionalQuestions, { question: '', answer: '' }]
    }));
  }, []);

  const removeAdditionalQuestion = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalQuestions: prev.additionalQuestions.filter((_, i) => i !== index)
    }));
  }, []);

  // Alternative responses management
  const addAlternativeResponse = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      alternativeResponses: [...prev.alternativeResponses, { response: '' }]
    }));
  }, []);

  const removeAlternativeResponse = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      alternativeResponses: prev.alternativeResponses.filter((_, i) => i !== index)
    }));
  }, []);

  // Schema mode management
  const updateSchemaMode = useCallback((modeId: string, selected: boolean) => {
    setFormData(prev => ({
      ...prev,
      schemaModes: prev.schemaModes.map(mode => 
        mode.id === modeId ? { ...mode, selected } : mode
      )
    }));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    const newData = getInitialCBTFormData();
    setFormData(newData);
    initialDataRef.current = newData;
    localStorage.removeItem('cbt-form-draft');
  }, []);

  // Generate formatted output for sending to chat
  const generateFormattedOutput = useCallback((): string => {
    const formatEmotions = (emotions: typeof formData.initialEmotions) => {
      const formatted = Object.entries(emotions)
        .filter(([key, value]) => key !== 'other' && key !== 'otherIntensity' && typeof value === 'number' && value > 0)
        .map(([key, value]) => `- ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}/10`)
        .join('\n');
      
      if (emotions.other && emotions.otherIntensity && emotions.otherIntensity > 0) {
        return formatted + `\n- ${emotions.other}: ${emotions.otherIntensity}/10`;
      }
      
      return formatted;
    };

    const formatThoughts = (thoughts: { thought: string; credibility?: number; confidence?: number }[]) => {
      return thoughts
        .filter(t => t.thought.trim())
        .map(t => {
          const rating = t.credibility ?? t.confidence ?? 0;
          return `- "${t.thought}" *(${rating}/10)*`;
        })
        .join('\n');
    };

    const formatQuestions = (questions: { question: string; answer: string }[]) => {
      return questions
        .filter(q => q.question.trim() || q.answer.trim())
        .map(q => `| ${q.question} | ${q.answer} |`)
        .join('\n');
    };

    const selectedModes = formData.schemaModes
      .filter(mode => mode.selected)
      .map(mode => `- [x] ${mode.name} *(${mode.description})*`)
      .join('\n');

    return `📝 **CBT Diary Entry**

**Date:** ${formData.date}

---

## **Situation**
${formData.situation || '[No situation described]'}

---

## **Feelings** 
*(Initial emotion ratings from 1-10)*

${formatEmotions(formData.initialEmotions) || '[No emotions rated]'}

---

## **Automatic Thoughts** 
*(Credibility ratings from 1-10)*

${formatThoughts(formData.automaticThoughts) || '[No thoughts entered]'}

---

## **Schema** 
*(Core belief and credibility)*

**Core Belief:** *(Credibility: ${formData.coreBeliefCredibility}/10)*
${formData.coreBeliefText || '[No core belief identified]'}

---

## **Schema-Behavior** 

**Confirming behaviors:** ${formData.confirmingBehaviors || '[Not specified]'}
**Avoidant behaviors:** ${formData.avoidantBehaviors || '[Not specified]'}
**Overriding behaviors:** ${formData.overridingBehaviors || '[Not specified]'}

---

## **Schema-Modes** 
*(Emotional states experienced)*

${selectedModes || '[No schema modes selected]'}

---

## **Challenge**

| **Question** | **Answer** |
|--------------|------------|
${formatQuestions(formData.challengeQuestions)}

${formData.additionalQuestions.some(q => q.question.trim() || q.answer.trim()) ? `
**Additional Questions:**

| **Question** | **Answer** |
|--------------|------------|
${formatQuestions(formData.additionalQuestions)}
` : ''}

---

## **Rational Thoughts** 
*(Confidence ratings from 1-10)*

${formatThoughts(formData.rationalThoughts) || '[No rational thoughts developed]'}

---

## **Effect on Feelings**
*(Updated emotion ratings after reflection)*

${formatEmotions(formData.finalEmotions) || '[No final emotions rated]'}

**Credibility of Original Thoughts:** ${formData.originalThoughtCredibility}/10

---

## **Result**

### **New Behaviors**
${formData.newBehaviors || '[No new behaviors identified]'}

### **Possible Alternative Responses** 
*(For future reference)*

${formData.alternativeResponses
  .filter(r => r.response.trim())
  .map(r => `- ${r.response}`)
  .join('\n') || '[No alternative responses identified]'}

---

*Remember: This is a tool for self-reflection and growth. Be patient and compassionate with yourself throughout this process.*`;
  }, [formData]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('cbt-form-draft');
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setFormData(parsedDraft);
        setFormState(prev => ({ ...prev, lastSaved: new Date() }));
      } catch (error) {
        console.error('Failed to load CBT form draft:', error);
        localStorage.removeItem('cbt-form-draft');
      }
    }
  }, []);

  return {
    formData,
    formState,
    updateField,
    updateNestedField,
    addAutomaticThought,
    removeAutomaticThought,
    addRationalThought,
    removeRationalThought,
    addAdditionalQuestion,
    removeAdditionalQuestion,
    addAlternativeResponse,
    removeAlternativeResponse,
    updateSchemaMode,
    validateForm,
    resetForm,
    generateFormattedOutput,
    isDirty: formState.isDirty,
    isValid: formState.isValid,
    errors: formState.errors,
    lastSaved: formState.lastSaved
  };
}