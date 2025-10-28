import { isLocalhost, isPrivateNetworkAccess } from '@/lib/utils/utils';

describe('utils/utils branch coverage', () => {
  it('isLocalhost handles empty and special hosts', () => {
    expect(isLocalhost('')).toBe(false);
    expect(isLocalhost('0.0.0.0')).toBe(true);
    expect(isLocalhost('localhost:3000')).toBe(true);
  });

  it('isPrivateNetworkAccess detects private ranges and rejects public', () => {
    expect(isPrivateNetworkAccess('192.168.1.5')).toBe(true);
    expect(isPrivateNetworkAccess('10.0.0.1')).toBe(true);
    expect(isPrivateNetworkAccess('172.16.0.10')).toBe(true);
    expect(isPrivateNetworkAccess('8.8.8.8')).toBe(false);
  });
});
