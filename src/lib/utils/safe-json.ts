export type SafeParseResult<T> = { ok: true; data: T } | { ok: false };

export function safeParse<T = unknown>(text: string): SafeParseResult<T> {
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false };
  }
}

export function safeParseFromMatch<T = unknown>(match: string | undefined | null): SafeParseResult<T> {
  if (!match || typeof match !== 'string') return { ok: false };
  return safeParse<T>(match);
}
