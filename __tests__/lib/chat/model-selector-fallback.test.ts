describe('model-selector fallback logic', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('dynamically adds model to available set if in languageModels', () => {
    // Mock config to use standard IDs
    jest.doMock('@/features/chat/config', () => ({
      DEFAULT_MODEL_ID: 'default-model',
      ANALYTICAL_MODEL_ID: 'analytical-model',
    }));

    // Mock providers: REGISTERED matches only default, but languageModels has analytical
    // This forces AVAILABLE_MODELS to start with only ['default-model']
    jest.doMock('@/ai/providers', () => ({
      MODELS: ['default-model'],
      languageModels: {
        'default-model': {},
        'analytical-model': {},
      },
    }));

    jest.doMock('@/lib/utils/logger', () => ({
      logger: { warn: jest.fn() },
    }));

    const { selectModelAndTools } = require('@/lib/chat/model-selector');

    // Trigger analytical model via web search
    const result = selectModelAndTools({
      message: 'test',
      webSearchEnabled: true,
    });

    expect(result.model).toBe('analytical-model');
  });

  it('falls back to default if analytical model is missing everywhere', () => {
    // Mock config to use a ghost model for analytical
    jest.doMock('@/features/chat/config', () => ({
      DEFAULT_MODEL_ID: 'default-model',
      ANALYTICAL_MODEL_ID: 'ghost-model',
    }));

    // Mock providers: No ghost model anywhere
    jest.doMock('@/ai/providers', () => ({
      MODELS: ['default-model'],
      languageModels: {
        'default-model': {},
      },
    }));

    // Mock logger to verify warning
    const warnSpy = jest.fn();
    jest.doMock('@/lib/utils/logger', () => ({
      logger: { warn: warnSpy },
    }));

    const { selectModelAndTools } = require('@/lib/chat/model-selector');

    // Trigger analytical model via web search (which asks for ghost-model)
    const result = selectModelAndTools({
      message: 'test',
      webSearchEnabled: true,
    });

    expect(result.model).toBe('default-model');
    expect(warnSpy).toHaveBeenCalledWith(
      'Selected chat model not available, reverting to default',
      expect.objectContaining({
        selectedModel: 'ghost-model',
        fallbackModel: 'default-model',
      })
    );
  });
});
