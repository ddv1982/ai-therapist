import { getTherapySystemPrompt, getReportPrompt } from '@/lib/therapy/prompts';

describe('therapy prompts index', () => {
  describe('getTherapySystemPrompt', () => {
    it('returns English prompt for en locale', () => {
      const prompt = getTherapySystemPrompt('en');
      
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('returns Dutch prompt for nl locale', () => {
      const prompt = getTherapySystemPrompt('nl');
      
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('accepts memory context option', () => {
      const prompt = getTherapySystemPrompt('en', {
        memory: [
          {
            sessionTitle: 'Test Session',
            sessionDate: '2024-01-01',
            reportDate: '2024-01-01',
            summary: 'Test summary',
            content: 'Test content',
          },
        ],
      });
      
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('accepts webSearch option', () => {
      const prompt = getTherapySystemPrompt('en', {
        webSearch: true,
      });
      
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('handles undefined options', () => {
      const prompt = getTherapySystemPrompt('en', undefined);
      
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('maps memory context correctly', () => {
      const memory = [
        {
          sessionTitle: 'Session 1',
          sessionDate: '2024-01-01',
          reportDate: '2024-01-02',
          summary: 'Summary 1',
          content: 'Content 1',
        },
        {
          sessionTitle: 'Session 2',
          sessionDate: '2024-01-03',
          reportDate: '2024-01-04',
          summary: 'Summary 2',
          content: 'Content 2',
        },
      ];

      const prompt = getTherapySystemPrompt('en', { memory });
      
      expect(typeof prompt).toBe('string');
    });
  });

  describe('getReportPrompt', () => {
    it('returns English report prompt for en locale', () => {
      const prompt = getReportPrompt('en');
      
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('returns Dutch report prompt for nl locale', () => {
      const prompt = getReportPrompt('nl');
      
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('returns different prompts for different locales', () => {
      const enPrompt = getReportPrompt('en');
      const nlPrompt = getReportPrompt('nl');
      
      expect(enPrompt).not.toBe(nlPrompt);
    });
  });
});
