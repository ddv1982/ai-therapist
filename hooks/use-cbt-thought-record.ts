import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  CBTThoughtRecord, 
  CBTFormState, 
  CBTFormValidationError,
  CBTEmotion,
  getInitialCBTThoughtRecord
} from '@/types/cbt';

interface UseCBTThoughtRecordOptions {
  autoSaveDelay?: number;
  validateOnChange?: boolean;
}

interface UseCBTThoughtRecordReturn {
  formData: CBTThoughtRecord;
  formState: CBTFormState;
  updateField: <K extends keyof CBTThoughtRecord>(field: K, value: CBTThoughtRecord[K]) => void;
  addEmotion: (isNewEmotion?: boolean) => void;
  removeEmotion: (index: number, isNewEmotion?: boolean) => void;
  updateEmotion: (index: number, field: keyof CBTEmotion, value: string | number, isNewEmotion?: boolean) => void;
  validateForm: () => CBTFormValidationError[];
  resetForm: () => void;
  generateFormattedOutput: () => string;
  isDirty: boolean;
  isValid: boolean;
  errors: Record<string, string>;
  lastSaved?: Date;
}

export function useCBTThoughtRecord(
  options: UseCBTThoughtRecordOptions = {}
): UseCBTThoughtRecordReturn {
  const { autoSaveDelay = 1000, validateOnChange = true } = options;
  
  const [formData, setFormData] = useState<CBTThoughtRecord>(getInitialCBTThoughtRecord);
  const [formState, setFormState] = useState<CBTFormState>({
    data: formData,
    isDirty: false,
    isValid: false,
    errors: {}
  });
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const initialDataRef = useRef<CBTThoughtRecord>(getInitialCBTThoughtRecord());

  // Validation function
  const validateForm = useCallback((): CBTFormValidationError[] => {
    const errors: CBTFormValidationError[] = [];

    // Required fields
    if (!formData.situation.trim()) {
      errors.push({ field: 'situation', message: 'Situation description is required' });
    }
    
    if (!formData.automaticThoughts.trim()) {
      errors.push({ field: 'automaticThoughts', message: 'Automatic thoughts are required' });
    }

    // At least one emotion with name and intensity > 0
    const hasValidEmotions = formData.emotions.some(emotion => 
      emotion.name.trim() && emotion.intensity > 0
    );
    if (!hasValidEmotions) {
      errors.push({ field: 'emotions', message: 'Please add at least one emotion with intensity > 0' });
    }

    if (!formData.evidenceFor.trim()) {
      errors.push({ field: 'evidenceFor', message: 'Evidence for the thought is required' });
    }

    if (!formData.evidenceAgainst.trim()) {
      errors.push({ field: 'evidenceAgainst', message: 'Evidence against the thought is required' });
    }

    if (!formData.balancedThought.trim()) {
      errors.push({ field: 'balancedThought', message: 'Balanced thought is required' });
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

    // Auto-save functionality
    if (isDirty && autoSaveDelay > 0) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        localStorage.setItem('cbt-thought-record-draft', JSON.stringify(formData));
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
  const updateField = useCallback(<K extends keyof CBTThoughtRecord>(
    field: K, 
    value: CBTThoughtRecord[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Emotion management
  const addEmotion = useCallback((isNewEmotion = false) => {
    const field = isNewEmotion ? 'newEmotions' : 'emotions';
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], { name: '', intensity: 0 }]
    }));
  }, []);

  const removeEmotion = useCallback((index: number, isNewEmotion = false) => {
    const field = isNewEmotion ? 'newEmotions' : 'emotions';
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  }, []);

  const updateEmotion = useCallback((
    index: number, 
    field: keyof CBTEmotion, 
    value: string | number, 
    isNewEmotion = false
  ) => {
    const emotionField = isNewEmotion ? 'newEmotions' : 'emotions';
    setFormData(prev => ({
      ...prev,
      [emotionField]: prev[emotionField].map((emotion, i) => 
        i === index ? { ...emotion, [field]: value } : emotion
      )
    }));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    const newData = getInitialCBTThoughtRecord();
    setFormData(newData);
    initialDataRef.current = newData;
    localStorage.removeItem('cbt-thought-record-draft');
  }, []);

  // Generate formatted output
  const generateFormattedOutput = useCallback((): string => {
    const formatEmotions = (emotions: CBTEmotion[]) => {
      return emotions
        .filter(emotion => emotion.name.trim() && emotion.intensity > 0)
        .map(emotion => `• ${emotion.name}: ${emotion.intensity}/100`)
        .join('\n');
    };

    return `# 🧠 CBT Thought Record

**Date:** ${formData.date}

---

## 1️⃣ Situation
*When, where, who was involved?*

${formData.situation || '[No situation described]'}

---

## 2️⃣ Automatic Thoughts
*What thoughts immediately came to mind?*

${formData.automaticThoughts || '[No automatic thoughts recorded]'}

---

## 3️⃣ Emotions & Intensity (0-100)
*What did you feel and how strongly?*

${formatEmotions(formData.emotions) || '[No emotions recorded]'}

---

## 4️⃣ Evidence FOR the Thought
*What supports this thought being true?*

${formData.evidenceFor || '[No evidence for recorded]'}

---

## 5️⃣ Evidence AGAINST the Thought
*What contradicts this thought?*

${formData.evidenceAgainst || '[No evidence against recorded]'}

---

## 6️⃣ Balanced/Alternative Thought
*What's a more balanced way to think about this?*

${formData.balancedThought || '[No balanced thought developed]'}

---

## 7️⃣ New Emotions (After Reframing)
*How do you feel now with the balanced thought?*

${formatEmotions(formData.newEmotions) || '[No new emotions recorded]'}

---

*This thought record helps identify and challenge unhelpful thinking patterns for better emotional regulation.*`;
  }, [formData]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('cbt-thought-record-draft');
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setFormData(parsedDraft);
        setFormState(prev => ({ ...prev, lastSaved: new Date() }));
      } catch (error) {
        console.error('Failed to load CBT thought record draft:', error);
        localStorage.removeItem('cbt-thought-record-draft');
      }
    }
  }, []);

  return {
    formData,
    formState,
    updateField,
    addEmotion,
    removeEmotion,
    updateEmotion,
    validateForm,
    resetForm,
    generateFormattedOutput,
    isDirty: formState.isDirty,
    isValid: formState.isValid,
    errors: formState.errors,
    lastSaved: formState.lastSaved
  };
}