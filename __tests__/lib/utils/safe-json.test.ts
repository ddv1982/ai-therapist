import { safeParse, safeParseFromMatch } from '@/lib/utils/helpers';

describe('utils/safe-json', () => {
  it('safeParse returns ok=false on invalid JSON and ok=true on valid', () => {
    expect(safeParse('not-json').ok).toBe(false);
    const res = safeParse('{"a":1}') as any;
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.a).toBe(1);
  });

  it('safeParseFromMatch handles undefined and delegates to safeParse', () => {
    expect(safeParseFromMatch(undefined).ok).toBe(false);
    const res = safeParseFromMatch('{"b":"x"}') as any;
    expect(res.ok).toBe(true);
  });
});
