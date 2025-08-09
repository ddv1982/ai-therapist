/**
 * CBT Form Hook Schema Reflection Test Suite
 * Tests the schema reflection functionality in useCBTForm hook
 */

import { renderHook, act } from '@testing-library/react';
import { useCBTForm } from '@/hooks/use-cbt-form';
import { 
  SchemaReflectionCategory,
  DEFAULT_SCHEMA_REFLECTION_QUESTIONS 
} from '@/types/cbt';

describe('useCBTForm - Schema Reflection', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should initialize with schema reflection disabled', () => {
      const { result } = renderHook(() => useCBTForm());
      
      expect(result.current.formData.schemaReflection.enabled).toBe(false);
      expect(result.current.formData.schemaReflection.selfAssessment).toBe('');
      expect(result.current.formData.schemaReflection.questions).toHaveLength(DEFAULT_SCHEMA_REFLECTION_QUESTIONS.length);
    });

    it('should initialize with all default questions', () => {
      const { result } = renderHook(() => useCBTForm());
      
      expect(result.current.formData.schemaReflection.questions).toEqual(DEFAULT_SCHEMA_REFLECTION_QUESTIONS);
    });
  });

  describe('toggleSchemaReflection', () => {
    it('should enable schema reflection', () => {
      const { result } = renderHook(() => useCBTForm());
      
      act(() => {
        result.current.toggleSchemaReflection(true);
      });
      
      expect(result.current.formData.schemaReflection.enabled).toBe(true);
      expect(result.current.isDirty).toBe(true);
    });

    it('should disable schema reflection', () => {
      const { result } = renderHook(() => useCBTForm());
      
      // First enable it
      act(() => {
        result.current.toggleSchemaReflection(true);
      });
      
      // Then disable it
      act(() => {
        result.current.toggleSchemaReflection(false);
      });
      
      expect(result.current.formData.schemaReflection.enabled).toBe(false);
    });

    it('should mark form as dirty when toggled', () => {
      const { result } = renderHook(() => useCBTForm());
      
      expect(result.current.isDirty).toBe(false);
      
      act(() => {
        result.current.toggleSchemaReflection(true);
      });
      
      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('updateSchemaReflectionQuestion', () => {
    it('should update question text', () => {
      const { result } = renderHook(() => useCBTForm());
      const newQuestion = 'What new patterns do I notice?';
      
      act(() => {
        result.current.updateSchemaReflectionQuestion(0, 'question', newQuestion);
      });
      
      expect(result.current.formData.schemaReflection.questions[0].question).toBe(newQuestion);
      expect(result.current.isDirty).toBe(true);
    });

    it('should update answer text', () => {
      const { result } = renderHook(() => useCBTForm());
      const newAnswer = 'I notice I always seek approval from others';
      
      act(() => {
        result.current.updateSchemaReflectionQuestion(0, 'answer', newAnswer);
      });
      
      expect(result.current.formData.schemaReflection.questions[0].answer).toBe(newAnswer);
      expect(result.current.isDirty).toBe(true);
    });

    it('should handle invalid index gracefully', () => {
      const { result } = renderHook(() => useCBTForm());
      const originalQuestions = result.current.formData.schemaReflection.questions;
      
      act(() => {
        result.current.updateSchemaReflectionQuestion(999, 'answer', 'Invalid index test');
      });
      
      // Questions should remain unchanged
      expect(result.current.formData.schemaReflection.questions).toEqual(originalQuestions);
    });

    it('should only update the specified question', () => {
      const { result } = renderHook(() => useCBTForm());
      const originalFirstQuestion = result.current.formData.schemaReflection.questions[0].question;
      const originalSecondQuestion = result.current.formData.schemaReflection.questions[1].question;
      
      act(() => {
        result.current.updateSchemaReflectionQuestion(0, 'answer', 'New answer for first question');
      });
      
      expect(result.current.formData.schemaReflection.questions[0].question).toBe(originalFirstQuestion);
      expect(result.current.formData.schemaReflection.questions[0].answer).toBe('New answer for first question');
      expect(result.current.formData.schemaReflection.questions[1].question).toBe(originalSecondQuestion);
      expect(result.current.formData.schemaReflection.questions[1].answer).toBe('');
    });
  });

  describe('addSchemaReflectionQuestion', () => {
    it('should add custom question by default', () => {
      const { result } = renderHook(() => useCBTForm());
      const initialLength = result.current.formData.schemaReflection.questions.length;
      
      act(() => {
        result.current.addSchemaReflectionQuestion();
      });
      
      expect(result.current.formData.schemaReflection.questions).toHaveLength(initialLength + 1);
      expect(result.current.formData.schemaReflection.questions[initialLength]).toEqual({
        question: '',
        answer: '',
        category: 'custom'
      });
      expect(result.current.isDirty).toBe(true);
    });

    it('should add question with specified category', () => {
      const { result } = renderHook(() => useCBTForm());
      const initialLength = result.current.formData.schemaReflection.questions.length;
      const category: SchemaReflectionCategory = 'childhood';
      
      act(() => {
        result.current.addSchemaReflectionQuestion(category);
      });
      
      expect(result.current.formData.schemaReflection.questions).toHaveLength(initialLength + 1);
      expect(result.current.formData.schemaReflection.questions[initialLength].category).toBe(category);
    });

    it('should work with all valid categories', () => {
      const { result } = renderHook(() => useCBTForm());
      const categories: SchemaReflectionCategory[] = ['childhood', 'schemas', 'coping', 'modes', 'custom'];
      const initialLength = result.current.formData.schemaReflection.questions.length;
      
      categories.forEach((category, index) => {
        act(() => {
          result.current.addSchemaReflectionQuestion(category);
        });
        
        expect(result.current.formData.schemaReflection.questions[initialLength + index].category).toBe(category);
      });
      
      expect(result.current.formData.schemaReflection.questions).toHaveLength(initialLength + categories.length);
    });
  });

  describe('removeSchemaReflectionQuestion', () => {
    it('should remove question at specified index', () => {
      const { result } = renderHook(() => useCBTForm());
      const initialLength = result.current.formData.schemaReflection.questions.length;
      const questionToRemove = result.current.formData.schemaReflection.questions[1];
      
      act(() => {
        result.current.removeSchemaReflectionQuestion(1);
      });
      
      expect(result.current.formData.schemaReflection.questions).toHaveLength(initialLength - 1);
      expect(result.current.formData.schemaReflection.questions).not.toContain(questionToRemove);
      expect(result.current.isDirty).toBe(true);
    });

    it('should handle invalid index gracefully', () => {
      const { result } = renderHook(() => useCBTForm());
      const originalQuestions = [...result.current.formData.schemaReflection.questions];
      
      act(() => {
        result.current.removeSchemaReflectionQuestion(999);
      });
      
      expect(result.current.formData.schemaReflection.questions).toEqual(originalQuestions);
    });

    it('should handle negative index gracefully', () => {
      const { result } = renderHook(() => useCBTForm());
      const originalQuestions = [...result.current.formData.schemaReflection.questions];
      
      act(() => {
        result.current.removeSchemaReflectionQuestion(-1);
      });
      
      expect(result.current.formData.schemaReflection.questions).toEqual(originalQuestions);
    });

    it('should work with custom questions', () => {
      const { result } = renderHook(() => useCBTForm());
      
      // Add custom question first
      act(() => {
        result.current.addSchemaReflectionQuestion('custom');
      });
      
      const lengthAfterAdd = result.current.formData.schemaReflection.questions.length;
      
      // Remove the custom question
      act(() => {
        result.current.removeSchemaReflectionQuestion(lengthAfterAdd - 1);
      });
      
      expect(result.current.formData.schemaReflection.questions).toHaveLength(lengthAfterAdd - 1);
    });
  });

  describe('updateSchemaReflectionAssessment', () => {
    it('should update self-assessment text', () => {
      const { result } = renderHook(() => useCBTForm());
      const assessment = 'I notice patterns of seeking approval and avoiding conflict. This reminds me of my childhood need to keep everyone happy.';
      
      act(() => {
        result.current.updateSchemaReflectionAssessment(assessment);
      });
      
      expect(result.current.formData.schemaReflection.selfAssessment).toBe(assessment);
      expect(result.current.isDirty).toBe(true);
    });

    it('should handle empty string', () => {
      const { result } = renderHook(() => useCBTForm());
      
      // First set some text
      act(() => {
        result.current.updateSchemaReflectionAssessment('Some text');
      });
      
      // Then clear it
      act(() => {
        result.current.updateSchemaReflectionAssessment('');
      });
      
      expect(result.current.formData.schemaReflection.selfAssessment).toBe('');
    });

    it('should handle long text', () => {
      const { result } = renderHook(() => useCBTForm());
      const longText = 'This is a very long self-assessment text that explores deep patterns and insights about my behavioral responses, emotional triggers, and the ways I protect myself in challenging situations. '.repeat(10);
      
      act(() => {
        result.current.updateSchemaReflectionAssessment(longText);
      });
      
      expect(result.current.formData.schemaReflection.selfAssessment).toBe(longText);
    });
  });

  describe('Form Validation Integration', () => {
    it('should not affect form validity when schema reflection is disabled', () => {
      const { result } = renderHook(() => useCBTForm({ validateOnChange: true }));
      
      // Fill required fields
      act(() => {
        result.current.updateField('situation', 'Test situation');
        result.current.updateNestedField('initialEmotions.anxiety', 5);
        result.current.updateField('coreBeliefText', 'Test core belief');
      });
      
      const errors = result.current.validateForm();
      expect(errors).toHaveLength(2); // Missing automatic thought and challenge questions
    });

    it('should not add validation errors for empty schema reflection when disabled', () => {
      const { result } = renderHook(() => useCBTForm({ validateOnChange: true }));
      
      expect(result.current.formData.schemaReflection.enabled).toBe(false);
      expect(result.current.formData.schemaReflection.selfAssessment).toBe('');
      
      // Should not have schema reflection related errors
      const errors = result.current.validateForm();
      expect(errors.some(e => e.field.includes('schemaReflection'))).toBe(false);
    });
  });

  describe('Reset Form Integration', () => {
    it('should reset schema reflection to initial state', () => {
      const { result } = renderHook(() => useCBTForm());
      
      // Modify schema reflection
      act(() => {
        result.current.toggleSchemaReflection(true);
        result.current.updateSchemaReflectionAssessment('Modified assessment');
        result.current.updateSchemaReflectionQuestion(0, 'answer', 'Modified answer');
        result.current.addSchemaReflectionQuestion('custom');
      });
      
      expect(result.current.formData.schemaReflection.enabled).toBe(true);
      expect(result.current.formData.schemaReflection.selfAssessment).toBe('Modified assessment');
      expect(result.current.formData.schemaReflection.questions).toHaveLength(DEFAULT_SCHEMA_REFLECTION_QUESTIONS.length + 1);
      
      // Reset form
      act(() => {
        result.current.resetForm();
      });
      
      // Should be back to initial state
      expect(result.current.formData.schemaReflection.enabled).toBe(false);
      expect(result.current.formData.schemaReflection.selfAssessment).toBe('');
      expect(result.current.formData.schemaReflection.questions).toHaveLength(DEFAULT_SCHEMA_REFLECTION_QUESTIONS.length);
      expect(result.current.formData.schemaReflection.questions).toEqual(DEFAULT_SCHEMA_REFLECTION_QUESTIONS);
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('Formatted Output Integration', () => {
    it('should include schema reflection in output when enabled', () => {
      const { result } = renderHook(() => useCBTForm());
      
      // Fill required fields
      act(() => {
        result.current.updateField('situation', 'Test situation');
        result.current.updateNestedField('initialEmotions.anxiety', 5);
        result.current.updateField('coreBeliefText', 'Test core belief');
        
        // Enable and fill schema reflection
        result.current.toggleSchemaReflection(true);
        result.current.updateSchemaReflectionAssessment('Personal insight about my patterns');
        result.current.updateSchemaReflectionQuestion(0, 'answer', 'This reminds me of my childhood');
      });
      
      const output = result.current.generateFormattedOutput();
      
      expect(output).toContain('SCHEMA REFLECTION - THERAPEUTIC INSIGHTS');
      expect(output).toContain('Personal Self-Assessment');
      expect(output).toContain('Personal insight about my patterns');
      expect(output).toContain('This reminds me of my childhood');
    });

    it('should not include schema reflection in output when disabled', () => {
      const { result } = renderHook(() => useCBTForm());
      
      // Fill required fields but keep schema reflection disabled
      act(() => {
        result.current.updateField('situation', 'Test situation');
        result.current.updateNestedField('initialEmotions.anxiety', 5);
        result.current.updateField('coreBeliefText', 'Test core belief');
      });
      
      const output = result.current.generateFormattedOutput();
      
      expect(output).not.toContain('Schema Reflection');
      expect(output).not.toContain('Personal Assessment');
    });

    it('should organize reflection questions by category in output', () => {
      const { result } = renderHook(() => useCBTForm());
      
      // Fill required fields
      act(() => {
        result.current.updateField('situation', 'Test situation');
        result.current.updateNestedField('initialEmotions.anxiety', 5);
        result.current.updateField('coreBeliefText', 'Test core belief');
        
        // Enable schema reflection and answer questions from different categories
        result.current.toggleSchemaReflection(true);
        result.current.updateSchemaReflectionQuestion(0, 'answer', 'Childhood pattern answer'); // childhood category
        result.current.updateSchemaReflectionQuestion(2, 'answer', 'Schema pattern answer'); // schemas category
      });
      
      const output = result.current.generateFormattedOutput();
      
      expect(output).toContain('Childhood');
      expect(output).toContain('Schemas');
      expect(output).toContain('Childhood pattern answer');
      expect(output).toContain('Schema pattern answer');
    });
  });

  describe('Auto-save Integration', () => {
    it('should trigger auto-save when schema reflection is modified', async () => {
      const { result } = renderHook(() => useCBTForm({ autoSaveDelay: 50 }));
      
      act(() => {
        result.current.toggleSchemaReflection(true);
      });
      
      expect(result.current.isDirty).toBe(true);
      
      // Wait for auto-save
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check localStorage was updated
      const savedData = localStorage.getItem('cbt-form-draft');
      expect(savedData).toBeTruthy();
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        expect(parsedData.schemaReflection.enabled).toBe(true);
      }
    });
  });
});