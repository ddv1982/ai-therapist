import { selectModelAndTools } from '@/lib/chat/model-selector';
import { DEFAULT_MODEL_ID, ANALYTICAL_MODEL_ID } from '@/features/chat/config';

describe('model-selector', () => {
  describe('selectModelAndTools', () => {
    it('returns default model for simple message', () => {
      const result = selectModelAndTools({ message: 'Hello, how are you?' });

      expect(result.model).toBe(DEFAULT_MODEL_ID);
      expect(result.tools).toEqual([]);
    });

    it('uses preferred model when available', () => {
      const result = selectModelAndTools({
        message: 'Hello',
        preferredModel: DEFAULT_MODEL_ID,
      });

      expect(result.model).toBe(DEFAULT_MODEL_ID);
    });

    it('falls back to default for unknown preferred model', () => {
      const result = selectModelAndTools({
        message: 'Hello',
        preferredModel: 'non-existent-model-xyz',
      });

      expect(result.model).toBe(DEFAULT_MODEL_ID);
    });

    it('enables web search and switches to analytical model', () => {
      const result = selectModelAndTools({
        message: 'What is the weather?',
        webSearchEnabled: true,
      });

      expect(result.model).toBe(ANALYTICAL_MODEL_ID);
      expect(result.tools).toContain('web-search');
    });

    it('uses analytical model for analysis keywords', () => {
      const testCases = [
        'Can you analyze this situation?',
        'I need a CBT assessment',
        'Help me with schema therapy',
        'Create a treatment plan',
        'Generate a report',
      ];

      testCases.forEach((message) => {
        const result = selectModelAndTools({ message });
        expect(result.model).toBe(ANALYTICAL_MODEL_ID);
      });
    });

    it('handles British spelling of analyze', () => {
      const result = selectModelAndTools({ message: 'Please analyse this' });

      expect(result.model).toBe(ANALYTICAL_MODEL_ID);
    });

    it('is case-insensitive for keywords', () => {
      const testCases = [
        'ANALYZE this',
        'Please CBT',
        'Schema mode',
        'PLAN treatment',
        'REPORT generation',
      ];

      testCases.forEach((message) => {
        const result = selectModelAndTools({ message });
        expect(result.model).toBe(ANALYTICAL_MODEL_ID);
      });
    });

    it('returns empty tools array when no special features', () => {
      const result = selectModelAndTools({ message: 'Just a regular message' });

      expect(result.tools).toEqual([]);
    });

    it('prioritizes web search over analysis keywords', () => {
      const result = selectModelAndTools({
        message: 'Analyze this with web search',
        webSearchEnabled: true,
      });

      expect(result.model).toBe(ANALYTICAL_MODEL_ID);
      expect(result.tools).toContain('web-search');
    });

    it('handles empty message', () => {
      const result = selectModelAndTools({ message: '' });

      expect(result.model).toBe(DEFAULT_MODEL_ID);
      expect(result.tools).toEqual([]);
    });

    it('handles message with only whitespace', () => {
      const result = selectModelAndTools({ message: '   ' });

      expect(result.model).toBe(DEFAULT_MODEL_ID);
    });

    it('combines preferred model with web search', () => {
      const result = selectModelAndTools({
        message: 'Search query',
        preferredModel: DEFAULT_MODEL_ID,
        webSearchEnabled: true,
      });

      // Web search forces ANALYTICAL_MODEL_ID
      expect(result.model).toBe(ANALYTICAL_MODEL_ID);
      expect(result.tools).toContain('web-search');
    });

    it('falls back to default when unknown preferred model requested', () => {
      const warnSpy = jest.spyOn(require('@/lib/utils/logger').logger, 'warn').mockImplementation();

      const result = selectModelAndTools({
        message: 'Hello',
        preferredModel: 'totally-unknown-model',
      });

      expect(result.model).toBe(DEFAULT_MODEL_ID);
      expect(warnSpy).toHaveBeenCalledWith(
        'Unknown preferred chat model requested, falling back to default',
        expect.objectContaining({
          preferredModel: 'totally-unknown-model',
        })
      );

      warnSpy.mockRestore();
    });
  });
});
