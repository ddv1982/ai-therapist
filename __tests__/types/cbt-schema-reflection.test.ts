/**
 * CBT Schema Reflection Types Test Suite
 * Tests the new schema reflection types and default data
 */

import {
  SchemaReflectionCategory,
  SchemaReflectionQuestion,
  SchemaReflectionData,
  DEFAULT_SCHEMA_REFLECTION_QUESTIONS,
  getInitialCBTFormData
} from '@/types/therapy';

describe('Schema Reflection Types', () => {
  describe('SchemaReflectionCategory', () => {
    it('should include all expected category types', () => {
      const categories: SchemaReflectionCategory[] = ['childhood', 'schemas', 'coping', 'modes', 'custom'];
      
      // Test each category can be assigned
      categories.forEach(category => {
        expect(typeof category).toBe('string');
        expect(['childhood', 'schemas', 'coping', 'modes', 'custom']).toContain(category);
      });
    });
  });

  describe('SchemaReflectionQuestion', () => {
    it('should have correct structure', () => {
      const question: SchemaReflectionQuestion = {
        question: 'Test question',
        answer: 'Test answer',
        category: 'childhood',
        isRequired: false
      };

      expect(question).toHaveProperty('question');
      expect(question).toHaveProperty('answer');
      expect(question).toHaveProperty('category');
      expect(question).toHaveProperty('isRequired');
      expect(typeof question.question).toBe('string');
      expect(typeof question.answer).toBe('string');
      expect(typeof question.isRequired).toBe('boolean');
    });

    it('should allow optional isRequired field', () => {
      const question: SchemaReflectionQuestion = {
        question: 'Test question',
        answer: 'Test answer',
        category: 'modes'
      };

      expect(question.isRequired).toBeUndefined();
    });
  });

  describe('SchemaReflectionData', () => {
    it('should have correct structure', () => {
      const reflectionData: SchemaReflectionData = {
        enabled: true,
        questions: [{
          question: 'Test',
          answer: 'Answer',
          category: 'coping'
        }],
        selfAssessment: 'My reflection'
      };

      expect(reflectionData).toHaveProperty('enabled');
      expect(reflectionData).toHaveProperty('questions');
      expect(reflectionData).toHaveProperty('selfAssessment');
      expect(typeof reflectionData.enabled).toBe('boolean');
      expect(Array.isArray(reflectionData.questions)).toBe(true);
      expect(typeof reflectionData.selfAssessment).toBe('string');
    });
  });
});

describe('DEFAULT_SCHEMA_REFLECTION_QUESTIONS', () => {
  it('should contain questions for all categories', () => {
    const categories = ['childhood', 'schemas', 'coping', 'modes'];
    
    categories.forEach(category => {
      const categoryQuestions = DEFAULT_SCHEMA_REFLECTION_QUESTIONS.filter(q => q.category === category);
      expect(categoryQuestions.length).toBeGreaterThan(0);
    });
  });

  it('should have proper question structure', () => {
    DEFAULT_SCHEMA_REFLECTION_QUESTIONS.forEach(question => {
      expect(question).toHaveProperty('question');
      expect(question).toHaveProperty('answer');
      expect(question).toHaveProperty('category');
      
      expect(typeof question.question).toBe('string');
      expect(typeof question.answer).toBe('string');
      expect(question.question.length).toBeGreaterThan(0);
      expect(question.answer).toBe(''); // Default empty answers
      expect(['childhood', 'schemas', 'coping', 'modes']).toContain(question.category);
    });
  });

  it('should contain expected number of questions per category', () => {
    const questionCounts = {
      childhood: DEFAULT_SCHEMA_REFLECTION_QUESTIONS.filter(q => q.category === 'childhood').length,
      schemas: DEFAULT_SCHEMA_REFLECTION_QUESTIONS.filter(q => q.category === 'schemas').length,
      coping: DEFAULT_SCHEMA_REFLECTION_QUESTIONS.filter(q => q.category === 'coping').length,
      modes: DEFAULT_SCHEMA_REFLECTION_QUESTIONS.filter(q => q.category === 'modes').length
    };

    // Verify we have the refined question set per category
    expect(questionCounts.childhood).toBe(2);
    expect(questionCounts.schemas).toBe(2);
    expect(questionCounts.coping).toBe(1);
    expect(questionCounts.modes).toBe(1);
    
    // Total should be 6 refined questions (quality over quantity)
    expect(DEFAULT_SCHEMA_REFLECTION_QUESTIONS.length).toBe(6);
  });

  describe('Question Content Quality', () => {
    it('should have meaningful childhood pattern questions', () => {
      const childhoodQuestions = DEFAULT_SCHEMA_REFLECTION_QUESTIONS.filter(q => q.category === 'childhood');
      
      expect(childhoodQuestions.some(q => q.question.toLowerCase().includes('childhood'))).toBe(true);
      expect(childhoodQuestions.some(q => q.question.toLowerCase().includes('past'))).toBe(true);
    });

    it('should have relevant schema domain questions', () => {
      const schemaQuestions = DEFAULT_SCHEMA_REFLECTION_QUESTIONS.filter(q => q.category === 'schemas');
      
      expect(schemaQuestions.some(q => 
        q.question.toLowerCase().includes('abandonment') || 
        q.question.toLowerCase().includes('perfectionism') ||
        q.question.toLowerCase().includes('people-pleasing')
      )).toBe(true);
    });

    it('should have practical coping strategy questions', () => {
      const copingQuestions = DEFAULT_SCHEMA_REFLECTION_QUESTIONS.filter(q => q.category === 'coping');
      
      // Should focus on protection mechanisms (refined from original question set)
      expect(copingQuestions.some(q => q.question.toLowerCase().includes('protect'))).toBe(true);
      expect(copingQuestions.length).toBe(1); // Streamlined to one high-quality question
    });

    it('should have insightful mode awareness questions', () => {
      const modeQuestions = DEFAULT_SCHEMA_REFLECTION_QUESTIONS.filter(q => q.category === 'modes');
      
      expect(modeQuestions.some(q => 
        q.question.toLowerCase().includes('part') || 
        q.question.toLowerCase().includes('child') ||
        q.question.toLowerCase().includes('parent')
      )).toBe(true);
    });
  });
});

describe('CBTDiaryFormData Integration', () => {
  it('should include schemaReflection in form data type', () => {
    const formData = getInitialCBTFormData();
    
    expect(formData).toHaveProperty('schemaReflection');
    expect(formData.schemaReflection).toHaveProperty('enabled');
    expect(formData.schemaReflection).toHaveProperty('questions');
    expect(formData.schemaReflection).toHaveProperty('selfAssessment');
  });

  it('should initialize with reflection disabled by default', () => {
    const formData = getInitialCBTFormData();
    
    expect(formData.schemaReflection.enabled).toBe(false);
    expect(formData.schemaReflection.selfAssessment).toBe('');
  });

  it('should initialize with all default reflection questions', () => {
    const formData = getInitialCBTFormData();
    
    expect(formData.schemaReflection.questions.length).toBe(DEFAULT_SCHEMA_REFLECTION_QUESTIONS.length);
    expect(formData.schemaReflection.questions).toEqual(DEFAULT_SCHEMA_REFLECTION_QUESTIONS);
  });

  it('should maintain question immutability in initial data', () => {
    const formData1 = getInitialCBTFormData();
    const formData2 = getInitialCBTFormData();
    
    // Modify one instance
    formData1.schemaReflection.questions[0].answer = 'Modified answer';
    
    // Other instance should not be affected
    expect(formData2.schemaReflection.questions[0].answer).toBe('');
  });
});

describe('Type Safety', () => {
  it('should enforce category type constraints', () => {
    // This test verifies TypeScript compilation - invalid categories should cause compile errors
    const validQuestion: SchemaReflectionQuestion = {
      question: 'Valid question',
      answer: 'Valid answer',
      category: 'childhood' // Valid category
    };
    
    expect(validQuestion.category).toBe('childhood');
  });

  it('should allow all valid categories', () => {
    const categories: SchemaReflectionCategory[] = ['childhood', 'schemas', 'coping', 'modes', 'custom'];
    
    categories.forEach(category => {
      const question: SchemaReflectionQuestion = {
        question: 'Test',
        answer: 'Test',
        category
      };
      
      expect(question.category).toBe(category);
    });
  });
});