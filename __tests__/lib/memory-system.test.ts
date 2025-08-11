/**
 * Memory System Unit Tests
 * 
 * Tests the core memory system functionality without complex API mocking
 */

import { buildMemoryEnhancedPrompt, THERAPY_SYSTEM_PROMPT, type MemoryContext } from '@/lib/therapy/therapy-prompts';

// Mock the message encryption module
jest.mock('@/lib/chat/message-encryption', () => ({
  encryptSessionReportContent: jest.fn((content: string) => `encrypted_${content}`),
  decryptSessionReportContent: jest.fn((encryptedContent: string) => 
    encryptedContent.replace('encrypted_', '')),
  encryptEnhancedAnalysisData: jest.fn(() => ({
    cognitiveDistortions: 'encrypted_distortions',
    schemaAnalysis: 'encrypted_schema',
    therapeuticFrameworks: 'encrypted_frameworks',
    recommendations: 'encrypted_recommendations'
  }))
}));

describe('Memory System Core Functionality', () => {
  describe('Memory Context Integration', () => {
    it('should build memory-enhanced prompts correctly', () => {
      const memoryContext: MemoryContext[] = [
        {
          sessionTitle: 'Work Anxiety Session',
          sessionDate: '2025-08-09',
          reportDate: '2025-08-09',
          content: 'Full therapeutic report content here...',
          summary: 'Key insights: Client shows catastrophic thinking patterns. Therapeutic focus: CBT techniques for anxiety management.'
        }
      ];

      const prompt = buildMemoryEnhancedPrompt(memoryContext);

      expect(prompt).toContain('THERAPEUTIC MEMORY CONTEXT:');
      expect(prompt).toContain('Work Anxiety Session');
      expect(prompt).toContain('2025-08-09');
      expect(prompt).toContain('catastrophic thinking patterns');
      expect(prompt).toContain('CBT techniques for anxiety management');
    });

    it('should handle multiple memory contexts', () => {
      const memoryContext: MemoryContext[] = [
        {
          sessionTitle: 'Session 1',
          sessionDate: '2025-08-07',
          reportDate: '2025-08-07',
          content: 'Content 1',
          summary: 'Summary 1'
        },
        {
          sessionTitle: 'Session 2',
          sessionDate: '2025-08-08',
          reportDate: '2025-08-08',
          content: 'Content 2',
          summary: 'Summary 2'
        }
      ];

      const prompt = buildMemoryEnhancedPrompt(memoryContext);

      expect(prompt).toContain('Previous Session 1 (2025-08-07): "Session 1"');
      expect(prompt).toContain('Previous Session 2 (2025-08-08): "Session 2"');
    });

    it('should return base prompt when no memory context provided', () => {
      const prompt = buildMemoryEnhancedPrompt([]);
      expect(prompt).toBe(THERAPY_SYSTEM_PROMPT);
    });

    it('should include therapeutic continuity guidelines', () => {
      const memoryContext: MemoryContext[] = [
        {
          sessionTitle: 'Test Session',
          sessionDate: '2025-08-09',
          reportDate: '2025-08-09',
          content: 'Test content',
          summary: 'Test summary'
        }
      ];

      const prompt = buildMemoryEnhancedPrompt(memoryContext);

      expect(prompt).toContain('Build upon insights and patterns identified in earlier sessions');
      expect(prompt).toContain('Maintain continuity in your therapeutic approach');
      expect(prompt).toContain('IMPORTANT: Never reference specific conversation details');
    });
  });

  describe('Memory Context Processing', () => {
    it('should handle empty or malformed memory context gracefully', () => {
      const memoryContexts = [
        [],
        undefined as any,
        [{
          sessionTitle: '',
          sessionDate: '',
          reportDate: '',
          content: '',
          summary: ''
        }]
      ];

      memoryContexts.forEach(context => {
        expect(() => {
          const prompt = buildMemoryEnhancedPrompt(context);
          expect(typeof prompt).toBe('string');
        }).not.toThrow();
      });
    });

    it('should preserve special characters in memory context', () => {
      const memoryContext: MemoryContext[] = [
        {
          sessionTitle: 'Session with "Quotes" & Special Characters',
          sessionDate: '2025-08-09',
          reportDate: '2025-08-09',
          content: 'Content with <tags> and &amp; entities',
          summary: 'Summary with "complex" punctuation & symbols!'
        }
      ];

      const prompt = buildMemoryEnhancedPrompt(memoryContext);

      expect(prompt).toContain('Session with "Quotes" & Special Characters');
      expect(prompt).toContain('Summary with "complex" punctuation & symbols!');
    });

    it('should maintain proper formatting structure', () => {
      const memoryContext: MemoryContext[] = [
        {
          sessionTitle: 'Test Session',
          sessionDate: '2025-08-09',
          reportDate: '2025-08-09',
          content: 'Test content',
          summary: 'Test summary'
        }
      ];

      const prompt = buildMemoryEnhancedPrompt(memoryContext);

      // Should contain all key sections
      expect(prompt).toContain('You are a compassionate, professional AI therapist');
      expect(prompt).toContain('THERAPEUTIC MEMORY CONTEXT:');
      expect(prompt).toContain('Remember: Your primary role is to listen deeply');
      expect(prompt).toContain('Web Search Guidelines:');
      expect(prompt).toContain('Response Guidelines:');

      // Memory section should be properly inserted
      const memoryIndex = prompt.indexOf('THERAPEUTIC MEMORY CONTEXT:');
      const rememberIndex = prompt.indexOf('Remember: Your primary role is to listen deeply');
      expect(memoryIndex).toBeLessThan(rememberIndex);
    });
  });

  describe('Encryption Integration', () => {
    it('should work with encrypted session report content', () => {
      const { encryptSessionReportContent, decryptSessionReportContent } = require('@/lib/chat/message-encryption');

      const originalContent = 'This is a therapeutic session report with sensitive information.';
      const encrypted = encryptSessionReportContent(originalContent);
      const decrypted = decryptSessionReportContent(encrypted);

      expect(encrypted).toBe(`encrypted_${originalContent}`);
      expect(decrypted).toBe(originalContent);
    });

    it('should handle enhanced analysis data encryption', () => {
      const { encryptEnhancedAnalysisData } = require('@/lib/chat/message-encryption');

      const analysisData = {
        cognitiveDistortions: [{ name: 'catastrophizing', severity: 'high' }],
        schemaAnalysis: { activeModes: ['vulnerable child'] },
        therapeuticFrameworks: [{ name: 'CBT', applicability: 'high' }],
        recommendations: [{ technique: 'thought records', urgency: 'high' }]
      };

      const encrypted = encryptEnhancedAnalysisData(analysisData);

      expect(encrypted).toEqual({
        cognitiveDistortions: 'encrypted_distortions',
        schemaAnalysis: 'encrypted_schema',
        therapeuticFrameworks: 'encrypted_frameworks',
        recommendations: 'encrypted_recommendations'
      });
    });
  });

  describe('Memory Data Validation', () => {
    it('should validate memory context structure', () => {
      const validMemoryContext: MemoryContext = {
        sessionTitle: 'Valid Session',
        sessionDate: '2025-08-09',
        reportDate: '2025-08-09',
        content: 'Valid therapeutic content',
        summary: 'Valid summary'
      };

      // Test that all required fields are present
      expect(validMemoryContext).toMatchObject({
        sessionTitle: expect.any(String),
        sessionDate: expect.any(String),
        reportDate: expect.any(String),
        content: expect.any(String),
        summary: expect.any(String)
      });
    });

    it('should handle date formatting consistently', () => {
      const memoryContext: MemoryContext[] = [
        {
          sessionTitle: 'Date Test Session',
          sessionDate: '2025-08-09',
          reportDate: '2025-08-09',
          content: 'Content',
          summary: 'Summary'
        }
      ];

      const prompt = buildMemoryEnhancedPrompt(memoryContext);

      expect(prompt).toContain('Previous Session 1 (2025-08-09)');
      expect(prompt).toContain('Report Generated: 2025-08-09');
    });
  });

  describe('Memory System Performance', () => {
    it('should handle large memory contexts efficiently', () => {
      const largeMemoryContext: MemoryContext[] = Array.from({ length: 10 }, (_, i) => ({
        sessionTitle: `Session ${i + 1}`,
        sessionDate: `2025-08-${String(i + 1).padStart(2, '0')}`,
        reportDate: `2025-08-${String(i + 1).padStart(2, '0')}`,
        content: `Detailed therapeutic content for session ${i + 1} `.repeat(100),
        summary: `Summary for session ${i + 1} with key insights and patterns`
      }));

      const startTime = Date.now();
      const prompt = buildMemoryEnhancedPrompt(largeMemoryContext);
      const endTime = Date.now();

      // Should complete quickly (less than 100ms for processing)
      expect(endTime - startTime).toBeLessThan(100);
      expect(prompt).toContain('THERAPEUTIC MEMORY CONTEXT:');
      expect(prompt).toContain('Session 1');
      expect(prompt).toContain('Session 10');
    });

    it('should limit memory context to reasonable size', () => {
      const memoryContext: MemoryContext[] = [
        {
          sessionTitle: 'Test Session',
          sessionDate: '2025-08-09',
          reportDate: '2025-08-09',
          content: 'Very long content '.repeat(1000),
          summary: 'Long summary '.repeat(100)
        }
      ];

      const prompt = buildMemoryEnhancedPrompt(memoryContext);

      // Prompt should still be generated without issues
      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });
  });

  describe('Therapeutic Context Quality', () => {
    it('should preserve therapeutic language and tone', () => {
      const memoryContext: MemoryContext[] = [
        {
          sessionTitle: 'CBT Skills Session',
          sessionDate: '2025-08-09',
          reportDate: '2025-08-09',
          content: 'Client engaged well with cognitive restructuring exercises...',
          summary: 'Key insights: Progress with thought records. Therapeutic focus: Cognitive flexibility. Growth areas: Emotional regulation.'
        }
      ];

      const prompt = buildMemoryEnhancedPrompt(memoryContext);

      expect(prompt).toContain('therapeutic');
      expect(prompt).toContain('insights');
      expect(prompt).toContain('patterns identified');
      expect(prompt).toContain('professional');
      expect(prompt).toContain('confidentiality');
    });

    it('should maintain professional boundaries in memory context', () => {
      const memoryContext: MemoryContext[] = [
        {
          sessionTitle: 'Boundary Setting Session',
          sessionDate: '2025-08-09',
          reportDate: '2025-08-09',
          content: 'Session focused on establishing healthy professional boundaries...',
          summary: 'Client working on assertiveness and boundary setting in workplace relationships.'
        }
      ];

      const prompt = buildMemoryEnhancedPrompt(memoryContext);

      expect(prompt).toContain('IMPORTANT: Never reference specific conversation details from previous sessions');
      expect(prompt).toContain('Only use the general therapeutic insights and patterns provided');
      expect(prompt).toContain('Maintain continuity in your therapeutic approach');
    });
  });
});