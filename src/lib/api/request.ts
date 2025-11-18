import type { NextRequest } from 'next/server';
import { safeParse } from '@/lib/utils/helpers';

export async function readJsonBody(
  req: NextRequest | Request
): Promise<{ body: unknown; size: number }> {
  const parser = req as unknown as { json?: () => Promise<unknown>; text?: () => Promise<string> };
  if (typeof parser.json === 'function') {
    const data = await parser.json();
    return { body: data, size: Buffer.byteLength(JSON.stringify(data), 'utf8') };
  }
  if (typeof parser.text === 'function') {
    const text = await parser.text();
    const parsed = safeParse(text);
    return { body: parsed.ok ? parsed.data : {}, size: Buffer.byteLength(text, 'utf8') };
  }
  throw new Error('Unsupported request body');
}
