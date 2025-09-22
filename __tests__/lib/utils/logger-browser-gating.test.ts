import { logger } from '@/lib/utils/logger';

describe('logger browser gating', () => {
  it('suppresses non-error logs with apiEndpoint in browser-like environment', () => {
    const origWindow = (global as any).window;
    (global as any).window = {};
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('should be suppressed', { apiEndpoint: '/api/x' });
    expect(infoSpy).not.toHaveBeenCalled();
    logger.error('surface error', { apiEndpoint: '/api/y' }, new Error('e'));
    // In browser gating, any apiEndpoint logs are suppressed entirely
    expect(errSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
    errSpy.mockRestore(); infoSpy.mockRestore(); logSpy.mockRestore();
    (global as any).window = origWindow;
  });
});


