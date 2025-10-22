import type { TelemetrySettings } from 'ai';

export interface TelemetryToggle {
  enabled?: boolean;
  recordInputs?: boolean;
  recordOutputs?: boolean;
  metadata?: Record<string, unknown>;
  functionId?: string;
}

const env = {
  enabled: readBoolean(process.env.AI_TELEMETRY_ENABLED, false),
  recordInputs: readBoolean(process.env.AI_TELEMETRY_RECORD_INPUTS, true),
  recordOutputs: readBoolean(process.env.AI_TELEMETRY_RECORD_OUTPUTS, true),
  functionId: sanitizeString(process.env.AI_TELEMETRY_FUNCTION_ID),
  application: sanitizeString(process.env.AI_TELEMETRY_APPLICATION),
};

export function getTelemetrySettings(toggle?: TelemetryToggle | boolean): TelemetrySettings | undefined {
  const resolvedToggle: TelemetryToggle | undefined =
    typeof toggle === 'boolean'
      ? { enabled: toggle }
      : toggle;

  const enabled = resolvedToggle?.enabled ?? env.enabled;
  if (!enabled) {
    return undefined;
  }

  const recordInputs = resolvedToggle?.recordInputs ?? env.recordInputs;
  const recordOutputs = resolvedToggle?.recordOutputs ?? env.recordOutputs;
  const functionId = resolvedToggle?.functionId ?? env.functionId;

  const metadata = buildTelemetryMetadata(resolvedToggle?.metadata);

  return {
    isEnabled: true,
    ...(functionId ? { functionId } : {}),
    ...(recordInputs !== undefined ? { recordInputs } : {}),
    ...(recordOutputs !== undefined ? { recordOutputs } : {}),
    ...(metadata ? { metadata } : {}),
  } satisfies TelemetrySettings;
}

function buildTelemetryMetadata(metadata?: Record<string, unknown>): Record<string, string> | undefined {
  const base: Record<string, string> = {};

  if (env.application) {
    base.application = env.application;
  }

  const nodeEnv = sanitizeString(process.env.NODE_ENV);
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

function readBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (!raw) return fallback;
  const normalised = raw.trim().toLowerCase();
  if (normalised === 'true' || normalised === '1' || normalised === 'yes' || normalised === 'on') {
    return true;
  }
  if (normalised === 'false' || normalised === '0' || normalised === 'no' || normalised === 'off') {
    return false;
  }
  return fallback;
}

function sanitizeString(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}


