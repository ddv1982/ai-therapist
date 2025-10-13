import { readJsonBody } from '@/lib/api/request';

describe('readJsonBody', () => {
  it('parses JSON bodies via json() method and reports byte size', async () => {
    const payload = { message: 'hello', count: 3 };
    const req = {
      json: jest.fn(async () => payload),
    } as unknown as Request;

    const result = await readJsonBody(req);

    expect(result.body).toEqual(payload);
    expect(result.size).toBe(Buffer.byteLength(JSON.stringify(payload), 'utf8'));
    expect((req as any).json).toHaveBeenCalledTimes(1);
  });

  it('parses text bodies via text() method with safe parsing fallback', async () => {
    const jsonString = '{"ok":true,"value":42}';
    const req = {
      text: jest.fn(async () => jsonString),
    } as unknown as Request;

    const result = await readJsonBody(req);

    expect(result.body).toEqual({ ok: true, value: 42 });
    expect(result.size).toBe(Buffer.byteLength(jsonString, 'utf8'));
    expect((req as any).text).toHaveBeenCalledTimes(1);
  });

  it('returns empty object when text parsing fails gracefully', async () => {
    const invalid = 'not-json';
    const req = {
      text: jest.fn(async () => invalid),
    } as unknown as Request;

    const result = await readJsonBody(req);

    expect(result.body).toEqual({});
    expect(result.size).toBe(Buffer.byteLength(invalid, 'utf8'));
  });

  it('throws when no supported body readers are available', async () => {
    const req = {} as Request;

    await expect(readJsonBody(req)).rejects.toThrow('Unsupported request body');
  });
});
