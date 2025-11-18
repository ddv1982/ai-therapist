import { logger, LogLevel, createRequestLogger } from '@/lib/utils/logger';

describe('logger', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  it('filters sensitive keys and strings from context', () => {
    logger.error(
      'Test',
      {
        situation: 'I feel bad about this situation',
        email: 'user@example.com',
        ip: '127.0.0.1',
        nested: { thoughts: ['I think this will fail'] },
      } as any,
      new Error('boom')
    );
    expect(console.log).toHaveBeenCalled();
    const msg = (console.log as jest.Mock).mock.calls[0][0] as string;
    expect(msg).toContain('[FILTERED_SENSITIVE_DATA]');
    expect(msg).not.toContain('user@example.com');
    expect(msg).not.toContain('127.0.0.1');
    expect(msg).toContain('Test');
  });

  it('createRequestLogger produces context and error logging includes requestId while redacting IP', () => {
    const headers = new Headers({
      'user-agent': 'jest',
      'x-request-id': 'rid-1',
      'x-forwarded-for': '2.2.2.2',
    });
    const ctx = createRequestLogger({ headers, method: 'GET', url: 'http://t' } as any);
    logger.error('Endpoint failed', ctx, new Error('oops'));
    expect(console.log).toHaveBeenCalled();
    const msg = (console.log as jest.Mock).mock.calls[0][0] as string;
    expect(msg).toContain('Endpoint failed');
    expect(msg).toContain('rid-1');
    expect(msg).not.toContain('2.2.2.2');
  });

  it('drops info logs in browser environment and respects log level', () => {
    (process as any).env.LOG_LEVEL = LogLevel.INFO;
    logger.debug('Hidden debug');
    expect(console.debug).not.toHaveBeenCalled();
    logger.info('visible-info');
    expect(console.log).not.toHaveBeenCalled();
  });
});
