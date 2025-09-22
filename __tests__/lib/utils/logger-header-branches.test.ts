import { createRequestLogger } from '@/lib/utils/logger';

describe('logger.createRequestLogger header branches', () => {
  it('handles plain object headers and x-forwarded-for', () => {
    const ctx = createRequestLogger({
      headers: { 'x-request-id': 'rid-1', 'user-agent': 'jest', 'x-forwarded-for': '1.2.3.4' },
      method: 'GET',
      url: 'http://localhost/test'
    } as any);
    expect(ctx.requestId).toBe('rid-1');
    expect(ctx.userAgent).toBe('jest');
    expect(ctx.ip).toBe('1.2.3.4');
  });

  it('falls back to connection.remoteAddress and generates request id', () => {
    const ctx = createRequestLogger({
      headers: {},
      method: 'POST',
      url: 'http://localhost/x',
      connection: { remoteAddress: '5.6.7.8' }
    } as any);
    expect(ctx.requestId).toBeTruthy();
    expect(ctx.ip).toBe('5.6.7.8');
  });
});


