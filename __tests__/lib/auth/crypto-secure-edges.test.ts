import {
  generateSecureUUID,
  generateSecureRandomString,
  generateSecureHex,
  generateSessionToken,
  generateRequestId,
  isCryptoAvailable,
  getCryptoCapabilities,
} from '@/lib/auth/crypto-secure';

describe('crypto-secure edges', () => {
  beforeAll(() => {
    // Ensure crypto exists with minimal getRandomValues
    (global as any).crypto = (global as any).crypto || {};
    if (!(global as any).crypto.getRandomValues) {
      (global as any).crypto.getRandomValues = (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = (i * 13 + 7) % 256;
        return arr;
      };
    }
  });

  it('generates UUID and hex with expected shapes', () => {
    const uuid = generateSecureUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(generateSecureHex(8)).toMatch(/^[0-9a-f]{16}$/);
  });

  it('generates session and request tokens with prefixes', () => {
    expect(generateSessionToken()).toMatch(/^st_[0-9a-f]+$/);
    expect(generateRequestId()).toMatch(/^req_[0-9a-f]+$/);
  });

  it('reports crypto capabilities', () => {
    expect(isCryptoAvailable()).toBe(true);
    const caps = getCryptoCapabilities();
    expect(caps.hasGetRandomValues || caps.hasRandomUUID).toBe(true);
  });

  it('generates random string with given length', () => {
    expect(generateSecureRandomString(12)).toHaveLength(12);
  });
});
