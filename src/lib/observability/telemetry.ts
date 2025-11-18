import type { TelemetrySettings } from 'ai';
import { env } from '@/config/env';
import { publicEnv } from '@/config/env.public';

export interface TelemetryToggle {
  enabled?: boolean;
  recordInputs?: boolean;
  recordOutputs?: boolean;
  metadata?: Record<string, unknown>;
  functionId?: string;
}

const telemetryEnv = {
  enabled: env.AI_TELEMETRY_ENABLED,
  recordInputs: env.AI_TELEMETRY_RECORD_INPUTS,
  recordOutputs: env.AI_TELEMETRY_RECORD_OUTPUTS,
  functionId: sanitizeString(env.AI_TELEMETRY_FUNCTION_ID),
  application: sanitizeString(env.AI_TELEMETRY_APPLICATION),
};

export function getTelemetrySettings(
  toggle?: TelemetryToggle | boolean
): TelemetrySettings | undefined {
  const resolvedToggle: TelemetryToggle | undefined =
    typeof toggle === 'boolean' ? { enabled: toggle } : toggle;

  const enabled = resolvedToggle?.enabled ?? telemetryEnv.enabled;
  if (!enabled) {
    return undefined;
  }

  const recordInputs = resolvedToggle?.recordInputs ?? telemetryEnv.recordInputs;
  const recordOutputs = resolvedToggle?.recordOutputs ?? telemetryEnv.recordOutputs;
  const functionId = resolvedToggle?.functionId ?? telemetryEnv.functionId;

  const metadata = buildTelemetryMetadata(resolvedToggle?.metadata);

  return {
    isEnabled: true,
    ...(functionId ? { functionId } : {}),
    ...(recordInputs !== undefined ? { recordInputs } : {}),
    ...(recordOutputs !== undefined ? { recordOutputs } : {}),
    ...(metadata ? { metadata } : {}),
  } satisfies TelemetrySettings;
}

function buildTelemetryMetadata(
  metadata?: Record<string, unknown>
): Record<string, string> | undefined {
  const base: Record<string, string> = {};

  if (telemetryEnv.application) {
    base.application = telemetryEnv.application;
  }

  const nodeEnv = sanitizeString(publicEnv.NODE_ENV);
  if (nodeEnv) {
    base.environment = nodeEnv;
  }

  const extra = metadata ? sanitizeRecord(metadata) : undefined;

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value !== undefined) {
        base[key] = value;
      }
    }
  }

  return Object.keys(base).length > 0 ? base : undefined;
}

function sanitizeRecord(input: Record<string, unknown>): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(input)
      .filter(([key]) => typeof key === 'string' && key.length > 0)
      .map(([key, value]) => [key, coerceToString(value)])
  );
}

function coerceToString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

function sanitizeString(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
