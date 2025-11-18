import { getTherapySystemPrompt, getReportPrompt } from '@/lib/therapy/therapy-prompts';

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

    it('works with Dutch locale and memory', () => {
      const memory = [
        {
          sessionTitle: 'Sessie 1',
          sessionDate: '2024-01-01',
          reportDate: '2024-01-02',
          summary: 'Samenvatting',
          content: 'Inhoud',
        },
      ];

      const prompt = getTherapySystemPrompt('nl', { memory });

      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('works with both memory and webSearch', () => {
      const memory = [
        {
          sessionTitle: 'Test',
          sessionDate: '2024-01-01',
          reportDate: '2024-01-02',
          summary: 'Summary',
          content: 'Content',
        },
      ];

      const prompt = getTherapySystemPrompt('en', { memory, webSearch: true });

      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('handles empty memory array', () => {
      const prompt = getTherapySystemPrompt('en', { memory: [] });

      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
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
