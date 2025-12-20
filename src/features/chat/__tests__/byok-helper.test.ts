/**
 * Tests for BYOK Helper functions
 * 
 * Note: BYOK keys are now only extracted from headers for security.
 * Body extraction was removed to prevent API keys from being logged.
 */
import { extractBYOKKey } from '@/features/chat/lib/byok-helper';

describe('extractBYOKKey', () => {
  it('extracts key from X-BYOK-Key header', () => {
    const headers = new Headers();
    headers.set('X-BYOK-Key', 'header-key-456');

    const result = extractBYOKKey(headers);
    expect(result).toBe('header-key-456');
  });

  it('returns null when header not present', () => {
    const headers = new Headers();

    const result = extractBYOKKey(headers);
    expect(result).toBeNull();
  });

  it('returns null for empty header value', () => {
    const headers = new Headers();
    headers.set('X-BYOK-Key', '');

    const result = extractBYOKKey(headers);
    expect(result).toBeNull();
  });

  it('handles various header formats', () => {
    const headers = new Headers();
    headers.set('X-BYOK-Key', 'sk-proj-abc123xyz');

    const result = extractBYOKKey(headers);
    expect(result).toBe('sk-proj-abc123xyz');
  });
});
