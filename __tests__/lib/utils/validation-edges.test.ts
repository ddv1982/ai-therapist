import { z } from 'zod';
import { validateRequest, sanitizeInput } from '@/lib/utils/validation';

describe('validation edges', () => {
  it('returns detailed error message from ZodError', () => {
    const schema = z.object({ a: z.string().min(2) });
    const result = validateRequest(schema, { a: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.toLowerCase()).toContain('a');
  });

  it('handles non-zod errors gracefully', () => {
    const schema = { parse: () => { throw new Error('boom'); } } as unknown as z.ZodSchema<any>;
    const result = validateRequest(schema, {});
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.toLowerCase()).toContain('boom');
  });

  it('sanitizes text and html inputs', () => {
    const dirty = '  a\x07\x1F  b  ';
    expect(sanitizeInput.text(dirty)).toBe('a b');
    expect(sanitizeInput.html('<div>"x"</div>')).toContain('&lt;div&gt;&quot;x&quot;&lt;&#x2F;div&gt;');
  });
});


