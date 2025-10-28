import { z } from 'zod';
import { validateRequest } from '@/lib/utils/validation';

describe('utils/validation.validateRequest', () => {
  it('returns success with parsed data on valid input', () => {
    const schema = z.object({ a: z.string() });
    const res = validateRequest(schema, { a: 'ok' });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data).toEqual({ a: 'ok' });
  });

  it('returns formatted error on Zod validation failure', () => {
    const schema = z.object({ a: z.string().min(2) });
    const res = validateRequest(schema, { a: 'x' });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error).toContain('a:');
  });

  it('returns generic error message when schema throws non-Zod error', () => {
    const fakeSchema: any = { parse: () => { throw new Error('boom'); } };
    const res = validateRequest(fakeSchema, { a: 'ok' });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error).toBe('boom');
  });
});
