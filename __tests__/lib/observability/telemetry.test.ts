import { reloadServerEnvForTesting } from '@/config/env';
import { reloadPublicEnvForTesting } from '@/config/env.public';

describe('observability/telemetry', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns undefined when disabled', async () => {
    process.env.AI_TELEMETRY_ENABLED = 'false';
    reloadServerEnvForTesting();
    const { getTelemetrySettings } = await import('@/lib/observability/telemetry');
    const settings = getTelemetrySettings();
    expect(settings).toBeUndefined();
  });

  it('builds settings with metadata when enabled and extra provided', async () => {
    process.env.AI_TELEMETRY_ENABLED = 'true';
    process.env.AI_TELEMETRY_RECORD_INPUTS = 'true';
    process.env.AI_TELEMETRY_RECORD_OUTPUTS = 'false';
    process.env.AI_TELEMETRY_FUNCTION_ID = ' fn-123 ';
    process.env.AI_TELEMETRY_APPLICATION = ' therapist ';
    process.env.NEXT_PUBLIC_CONVEX_URL =
      process.env.NEXT_PUBLIC_CONVEX_URL || 'http://127.0.0.1:3210';
    reloadServerEnvForTesting();
    reloadPublicEnvForTesting();
    const { getTelemetrySettings } = await import('@/lib/observability/telemetry');
    const settings = getTelemetrySettings({ metadata: { foo: 'bar', n: 5, obj: { a: 1 } } });
    expect(settings?.isEnabled).toBe(true);
    expect(settings?.functionId).toBe('fn-123');
    expect(settings?.recordInputs).toBe(true);
    expect(settings?.recordOutputs).toBe(false);
    expect(settings?.metadata && typeof settings.metadata).toBe('object');
  });
});
