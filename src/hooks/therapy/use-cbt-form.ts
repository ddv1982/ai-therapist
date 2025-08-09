import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  CBTDiaryFormData, 
  CBTDiaryFormState, 
  CBTFormValidationError,
  SchemaReflectionCategory,
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
  updateNestedField: (path: string, value: string | number | boolean | unknown[]) => void;
  addAutomaticThought: () => void;
  removeAutomaticThought: (index: number) => void;
  addRationalThought: () => void;
  removeRationalThought: (index: number) => void;
  addAdditionalQuestion: () => void;
  removeAdditionalQuestion: (index: number) => void;
  addAlternativeResponse: () => void;
  removeAlternativeResponse: (index: number) => void;
  updateSchemaMode: (modeId: string, selected: boolean) => void;
  // Schema Reflection methods
  toggleSchemaReflection: (enabled: boolean) => void;
  updateSchemaReflectionQuestion: (index: number, field: 'question' | 'answer', value: string) => void;
  addSchemaReflectionQuestion: (category?: SchemaReflectionCategory) => void;
  removeSchemaReflectionQuestion: (index: number) => void;
  updateSchemaReflectionAssessment: (value: string) => void;
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

    // Challenge questions - at least one question should be answered
    const hasChallengeAnswers = formData.challengeQuestions.some(q => q.answer.trim()) ||
                               formData.additionalQuestions.some(q => q.answer.trim());
    if (!hasChallengeAnswers) {
      errors.push({ field: 'challengeQuestions', message: 'At least one challenge question must be answered' });
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
  const updateNestedField = useCallback((path: string, value: string | number | boolean | unknown[]) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: Record<string, unknown> = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) current[keys[i]] = {};
        current = current[keys[i]] as Record<string, unknown>;
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

  // Schema reflection management
  const toggleSchemaReflection = useCallback((enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      schemaReflection: {
        ...prev.schemaReflection,
        enabled
      }
    }));
  }, []);

  const updateSchemaReflectionQuestion = useCallback((index: number, field: 'question' | 'answer', value: string) => {
    setFormData(prev => ({
      ...prev,
      schemaReflection: {
        ...prev.schemaReflection,
        questions: prev.schemaReflection.questions.map((q, i) => 
          i === index ? { ...q, [field]: value } : q
        )
      }
    }));
  }, []);

  const addSchemaReflectionQuestion = useCallback((category: SchemaReflectionCategory = 'custom') => {
    setFormData(prev => ({
      ...prev,
      schemaReflection: {
        ...prev.schemaReflection,
        questions: [...prev.schemaReflection.questions, {
          question: '',
          answer: '',
          category
        }]
      }
    }));
  }, []);

  const removeSchemaReflectionQuestion = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      schemaReflection: {
        ...prev.schemaReflection,
        questions: prev.schemaReflection.questions.filter((_, i) => i !== index)
      }
    }));
  }, []);

  const updateSchemaReflectionAssessment = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      schemaReflection: {
        ...prev.schemaReflection,
        selfAssessment: value
      }
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
        .map(q => {
          // Ensure empty cells display properly with placeholder or empty space
          const question = q.question.trim() || ' ';
          const answer = q.answer.trim() || ' ';
          return `| ${question} | ${answer} |`;
        })
        .join('\n');
    };

    const selectedModes = formData.schemaModes
      .filter(mode => mode.selected)
      .map(mode => `- [x] ${mode.name} *(${mode.description})*`)
      .join('\n');

    // Check if reflection is enabled and has content for AI guidance
    const hasReflectionContent = formData.schemaReflection.enabled && (
      formData.schemaReflection.selfAssessment.trim() ||
      formData.schemaReflection.questions.some(q => q.answer.trim())
    );

    const reflectionInsights = hasReflectionContent 
      ? formData.schemaReflection.questions
          .filter(q => q.answer.trim())
          .map(q => ({ category: q.category, question: q.question, answer: q.answer }))
      : [];

    return `# 🌟 CBT Diary Entry with ${hasReflectionContent ? 'Deep ' : ''}Reflection

**Date:** ${formData.date}
${hasReflectionContent ? `
> 💡 **AI Therapist Note:** This entry includes profound schema reflection insights. Please provide therapeutic feedback that acknowledges these deeper patterns and offers compassionate guidance for healing and growth.

` : ''}---

## 📍 Situation Context
${formData.situation || '[No situation described]'}

---

## 💭 Emotional Landscape
*Initial emotional state (1-10 intensity)*

${formatEmotions(formData.initialEmotions) || '[No emotions rated]'}

---

## 🧠 Automatic Thoughts
*Cognitive patterns and credibility ratings (1-10)*

${formatThoughts(formData.automaticThoughts) || '[No thoughts entered]'}

---

## 🎯 Core Schema Analysis
*Credibility: ${formData.coreBeliefCredibility}/10*

**Core Belief:** ${formData.coreBeliefText || '[No core belief identified]'}

### Behavioral Patterns
- **Confirming behaviors:** ${formData.confirmingBehaviors || '[Not specified]'}
- **Avoidant behaviors:** ${formData.avoidantBehaviors || '[Not specified]'}  
- **Overriding behaviors:** ${formData.overridingBehaviors || '[Not specified]'}

### Active Schema Modes
*Emotional states experienced*

${selectedModes || '[No schema modes selected]'}

${formData.schemaReflection.enabled ? `
---

## 🔍 SCHEMA REFLECTION - THERAPEUTIC INSIGHTS

> **For AI Therapist:** The following reflection represents deep self-exploration. Please respond with therapeutic empathy, validate insights, and offer gentle guidance for continued healing and self-compassion.

${formData.schemaReflection.selfAssessment ? `### 🌱 Personal Self-Assessment

**Client's Inner Wisdom:**
"${formData.schemaReflection.selfAssessment}"

*This personal assessment reveals important self-awareness that deserves therapeutic acknowledgment and gentle exploration.*

` : ''}${reflectionInsights.length > 0 ? `### 🧭 Guided Reflection Insights

${reflectionInsights
  .reduce((acc, insight) => {
    const categoryEmojis = {
      childhood: '👶',
      schemas: '🧠', 
      coping: '🛡️',
      modes: '💭'
    };
    const categoryName = insight.category.charAt(0).toUpperCase() + insight.category.slice(1);
    const emoji = categoryEmojis[insight.category as keyof typeof categoryEmojis] || '💡';
    
    acc.push(`**${emoji} ${categoryName} Pattern:**`);
    acc.push(`*Question:* "${insight.question}"`);
    acc.push(`*Insight:* "${insight.answer}"`);
    acc.push('');
    return acc;
  }, [] as string[])
  .join('\n')}

> **Therapeutic Note:** These insights reveal important connections between past experiences, current patterns, and healing opportunities. Please acknowledge the courage it takes to explore these depths and offer supportive guidance.

` : ''}` : ''}

---

## Challenge Questions

| Question | Answer |
|----------|---------|
${formatQuestions(formData.challengeQuestions)}

${formData.additionalQuestions.some(q => q.question.trim() || q.answer.trim()) ? `
### Additional Questions

| Question | Answer |
|----------|---------|
${formatQuestions(formData.additionalQuestions)}
` : ''}

---

## Rational Thoughts
*Confidence ratings from 1-10*

${formatThoughts(formData.rationalThoughts) || '[No rational thoughts developed]'}

---

## Final Reflection

### Updated Feelings
*After completing this reflection*

${formatEmotions(formData.finalEmotions) || '[No final emotions rated]'}

**Credibility of Original Thoughts:** ${formData.originalThoughtCredibility}/10

### New Behaviors
${formData.newBehaviors || '[No new behaviors identified]'}

### Alternative Responses
*For future situations*

${formData.alternativeResponses
  .filter(r => r.response.trim())
  .map(r => `- ${r.response}`)
  .join('\n') || '[No alternative responses identified]'}

---

*This reflection is a tool for self-awareness and growth. Be patient and compassionate with yourself throughout this process.*`;
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
    // Schema Reflection methods
    toggleSchemaReflection,
    updateSchemaReflectionQuestion,
    addSchemaReflectionQuestion,
    removeSchemaReflectionQuestion,
    updateSchemaReflectionAssessment,
    validateForm,
    resetForm,
    generateFormattedOutput,
    isDirty: formState.isDirty,
    isValid: formState.isValid,
    errors: formState.errors,
    lastSaved: formState.lastSaved
  };
}