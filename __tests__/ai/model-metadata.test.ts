import {
  MODEL_IDS,
  SYSTEM_MODEL_KEYS,
  isBYOKModel,
  getProviderForModel,
  getModelDisplayName,
  supportsWebSearch,
} from '@/ai/model-metadata';

describe('model-metadata', () => {
  describe('MODEL_IDS', () => {
    it('should have system models defined', () => {
      expect(MODEL_IDS.default).toBeDefined();
      expect(MODEL_IDS.analytical).toBeDefined();
      expect(MODEL_IDS.local).toBeDefined();
    });

    it('should have provider/model format', () => {
      expect(MODEL_IDS.default).toMatch(/^[a-z]+\/.+$/);
      expect(MODEL_IDS.analytical).toMatch(/^[a-z]+\/.+$/);
      expect(MODEL_IDS.local).toMatch(/^[a-z]+\/.+$/);
    });
  });

  describe('SYSTEM_MODEL_KEYS', () => {
    it('should contain all system model keys', () => {
      expect(SYSTEM_MODEL_KEYS).toEqual(['default', 'analytical', 'local']);
    });
  });

  describe('isBYOKModel', () => {
    it('should return true for the BYOK model', () => {
      expect(isBYOKModel(MODEL_IDS.byok)).toBe(true);
      expect(isBYOKModel('openai/gpt-5-mini')).toBe(true);
    });

    it('should return false for system models', () => {
      expect(isBYOKModel(MODEL_IDS.default)).toBe(false);
      expect(isBYOKModel(MODEL_IDS.analytical)).toBe(false);
      expect(isBYOKModel(MODEL_IDS.local)).toBe(false);
    });

    it('should return false for other OpenAI models', () => {
      expect(isBYOKModel('openai/gpt-4o')).toBe(false);
      expect(isBYOKModel('openai/gpt-4o-mini')).toBe(false);
    });

    it('should return false for unknown model IDs', () => {
      expect(isBYOKModel('unknown-model')).toBe(false);
      expect(isBYOKModel('')).toBe(false);
    });
  });

  describe('getProviderForModel', () => {
    it('should return "openai" for OpenAI models', () => {
      expect(getProviderForModel('openai/gpt-4o')).toBe('openai');
      expect(getProviderForModel(MODEL_IDS.default)).toBe('openai');
    });

    it('should return "ollama" for Ollama models', () => {
      expect(getProviderForModel(MODEL_IDS.local)).toBe('ollama');
    });

    it('should return null for unknown providers', () => {
      expect(getProviderForModel('unknown-model')).toBe(null);
      expect(getProviderForModel('')).toBe(null);
    });
  });

  describe('getModelDisplayName', () => {
    it('should return display names for system models', () => {
      expect(getModelDisplayName(MODEL_IDS.default)).not.toBe(MODEL_IDS.default);
      expect(getModelDisplayName(MODEL_IDS.analytical)).not.toBe(MODEL_IDS.analytical);
      expect(getModelDisplayName(MODEL_IDS.local)).not.toBe(MODEL_IDS.local);
    });

    it('should return model name from path for unknown models', () => {
      expect(getModelDisplayName('openai/gpt-4o')).toBe('gpt-4o');
      expect(getModelDisplayName('unknown/model-name')).toBe('model-name');
    });

    it('should return raw model ID if no slash', () => {
      expect(getModelDisplayName('some-model')).toBe('some-model');
    });
  });

  describe('supportsWebSearch', () => {
    it('should return true for analytical model', () => {
      expect(supportsWebSearch(MODEL_IDS.analytical)).toBe(true);
    });

    it('should return false for default model', () => {
      expect(supportsWebSearch(MODEL_IDS.default)).toBe(false);
    });

    it('should return false for local model', () => {
      expect(supportsWebSearch(MODEL_IDS.local)).toBe(false);
    });

    it('should return false for BYOK models', () => {
      expect(supportsWebSearch('openai/gpt-4o')).toBe(false);
    });
  });
});
