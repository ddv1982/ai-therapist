/**
 * Memory system utility tests
 */

import { buildMemoryEnhancedPrompt, THERAPY_SYSTEM_PROMPT, type MemoryContext } from '@/lib/therapy-prompts';

describe('Memory Utils', () => {
  describe('buildMemoryEnhancedPrompt', () => {
    it('should return base prompt when no memory context provided', () => {
      const prompt = buildMemoryEnhancedPrompt([]);
      expect(prompt).toBe(THERAPY_SYSTEM_PROMPT);
    });

    it('should return base prompt when empty array provided', () => {
      const prompt = buildMemoryEnhancedPrompt();
      expect(prompt).toBe(THERAPY_SYSTEM_PROMPT);
    });

    it('should integrate memory context into system prompt', () => {
      const memoryContext: MemoryContext[] = [
        {
          sessionTitle: 'Work Anxiety Session',
          sessionDate: '2025-08-09',
          reportDate: '2025-08-09',
          content: 'Full therapeutic report content here...',
          summary: 'Key insights: Client shows catastrophic thinking patterns. Therapeutic focus: CBT techniques for anxiety management. Growth areas: Emotion regulation, cognitive flexibility.'
        }
      ];

      const prompt = buildMemoryEnhancedPrompt(memoryContext);

      expect(prompt).toContain('THERAPEUTIC MEMORY CONTEXT:');
      expect(prompt).toContain('Work Anxiety Session');
      expect(prompt).toContain('2025-08-09');
      expect(prompt).toContain('catastrophic thinking patterns');
      expect(prompt).toContain('CBT techniques for anxiety management');
      expect(prompt).toContain('Use this context to:');
      expect(prompt).toContain('Build upon insights and patterns identified');
    });

    it('should handle multiple memory contexts', () => {
      const memoryContext: MemoryContext[] = [
        {
          sessionTitle: 'Initial Assessment',
          sessionDate: '2025-08-01',
          reportDate: '2025-08-01',
          content: 'Initial session content...',
          summary: 'First session insights about anxiety patterns'
        },
        {
          sessionTitle: 'CBT Session',
          sessionDate: '2025-08-05',
          reportDate: '2025-08-05',
          content: 'CBT session content...',
          summary: 'Progress with cognitive restructuring techniques'
        },
        {
          sessionTitle: 'Follow-up',
          sessionDate: '2025-08-08',
          reportDate: '2025-08-08',
          content: 'Follow-up content...',
          summary: 'Continued work on thought records and behavioral experiments'
        }
      ];

      const prompt = buildMemoryEnhancedPrompt(memoryContext);

      expect(prompt).toContain('Previous Session 1 (2025-08-01): "Initial Assessment"');
      expect(prompt).toContain('Previous Session 2 (2025-08-05): "CBT Session"');
      expect(prompt).toContain('Previous Session 3 (2025-08-08): "Follow-up"');
      expect(prompt).toContain('First session insights about anxiety patterns');
      expect(prompt).toContain('Progress with cognitive restructuring techniques');
      expect(prompt).toContain('Continued work on thought records');
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

      expect(prompt).toContain('Acknowledge previous therapeutic work and progress made');
      expect(prompt).toContain('Reference therapeutic goals and areas of focus previously established');
      expect(prompt).toContain('Maintain continuity in your therapeutic approach');
      expect(prompt).toContain('Track progress over time and celebrate growth');
    });

    it('should include confidentiality reminder', () => {
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

      expect(prompt).toContain('IMPORTANT: Never reference specific conversation details from previous sessions');
      expect(prompt).toContain('Only use the general therapeutic insights and patterns provided');
    });

    it('should properly format dates and session information', () => {
      const memoryContext: MemoryContext[] = [
        {
          sessionTitle: 'Session with "Quotes" & Special Characters',
          sessionDate: '2025-12-25',
          reportDate: '2025-12-26',
          content: 'Content with special characters & symbols',
          summary: 'Summary with "quotes" and other punctuation!'
        }
      ];

      const prompt = buildMemoryEnhancedPrompt(memoryContext);

      expect(prompt).toContain('Previous Session 1 (2025-12-25): "Session with "Quotes" & Special Characters"');
      expect(prompt).toContain('Report Generated: 2025-12-26');
      expect(prompt).toContain('Summary with "quotes" and other punctuation!');
    });

    it('should maintain original prompt structure with memory insertion', () => {
      const memoryContext: MemoryContext[] = [
        {
          sessionTitle: 'Test',
          sessionDate: '2025-08-09',
          reportDate: '2025-08-09',
          content: 'Content',
          summary: 'Summary'
        }
      ];

      const prompt = buildMemoryEnhancedPrompt(memoryContext);

      // Should contain original therapeutic principles
      expect(prompt).toContain('You are a compassionate, professional AI therapist');
      expect(prompt).toContain('Core Principles:');
      expect(prompt).toContain('Respond with empathy, compassion, and without judgment');
      
      // Memory section should be inserted before the "Remember" section
      expect(prompt).toContain('THERAPEUTIC MEMORY CONTEXT:');
      expect(prompt).toContain('Remember: Your primary role is to listen deeply');
      
      // Should maintain web search guidelines
      expect(prompt).toContain('Web Search Guidelines:');
      expect(prompt).toContain('Response Guidelines:');
    });

    it('should handle empty or undefined summary gracefully', () => {
      const memoryContext: MemoryContext[] = [
        {
          sessionTitle: 'Session with Empty Summary',
          sessionDate: '2025-08-09',
          reportDate: '2025-08-09',
          content: 'Some content here',
          summary: ''
        },
        {
          sessionTitle: 'Session with Undefined Summary',
          sessionDate: '2025-08-10',
          reportDate: '2025-08-10',
          content: 'More content',
          summary: undefined as any
        }
      ];

      const prompt = buildMemoryEnhancedPrompt(memoryContext);

      expect(prompt).toContain('Session with Empty Summary');
      expect(prompt).toContain('Session with Undefined Summary');
      expect(prompt).toContain('Therapeutic Insights:'); // Should still contain the label
    });

    it('should preserve therapeutic memory context formatting', () => {
      const memoryContext: MemoryContext[] = [
        {
          sessionTitle: 'Anxiety Management',
          sessionDate: '2025-08-09',
          reportDate: '2025-08-09',
          content: 'Full report content',
          summary: 'Key insights: Catastrophic thinking identified. Therapeutic focus: CBT techniques. Growth areas: Emotion regulation. Patterns identified: Anxiety spirals when facing new projects.'
        }
      ];

      const prompt = buildMemoryEnhancedPrompt(memoryContext);

      // Check that the therapeutic memory section is properly structured
      const memorySection = prompt.match(/THERAPEUTIC MEMORY CONTEXT:.*?(?=\n\nRemember:)/s)?.[0];
      expect(memorySection).toBeTruthy();
      expect(memorySection).toContain('Previous Session 1 (2025-08-09): "Anxiety Management"');
      expect(memorySection).toContain('Report Generated: 2025-08-09');
      expect(memorySection).toContain('Therapeutic Insights: Key insights: Catastrophic thinking identified');
    });
  });
});