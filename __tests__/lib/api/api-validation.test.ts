import { z } from 'zod';
import { validateWithSchema } from '@/lib/api/validation';

describe('validateWithSchema', () => {
  it('returns validated data on success', () => {
    const schema = z.object({ message: z.string() });
    const result = validateWithSchema(schema, { message: 'hello' });
    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error(`Expected validation success, received error: ${result.error}`);
    }
    expect(result.data).toEqual({ message: 'hello' });
  });

  it('returns error details on validation failure', () => {
    const schema = z.object({ message: z.string().min(2) });
    const result = validateWithSchema(schema, { message: 'x' });
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error('Expected validation failure');
    }
    expect(result.error).toContain('message');
  });
});
