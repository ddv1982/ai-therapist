import { cn, formatDuration, isLocalhost, isPrivateNetworkAccess } from '@/lib/utils/utils';

describe('utils edges', () => {
  it('cn merges classes with tailwind-merge', () => {
    expect(cn('px-2', 'px-4')).toContain('px-4');
  });

  it('formatDuration pads seconds', () => {
    expect(formatDuration(65)).toBe('1:05');
  });

  it('isLocalhost and isPrivateNetworkAccess detect hosts', () => {
    expect(isLocalhost('localhost:3000')).toBe(true);
    expect(isLocalhost('192.168.0.1')).toBe(false);
    expect(isPrivateNetworkAccess('192.168.1.7')).toBe(true);
    expect(isPrivateNetworkAccess('8.8.8.8')).toBe(false);
  });
});


