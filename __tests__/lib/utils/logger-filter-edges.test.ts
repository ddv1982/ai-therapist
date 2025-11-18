import { logger } from '@/lib/utils/logger';

describe('logger filterSensitiveData edges', () => {
  it('filters therapeutic keys and long strings in context', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const longText = 'x'.repeat(150);
    logger.error('Test', {
      content: 'this includes therapy content and emotions',
      ip: '1.2.3.4',
      nested: { thoughts: 'I think this is sensitive' },
      long: longText,
    } as any);
    expect(spy).toHaveBeenCalled();
    const payload = (spy.mock.calls[0]?.[0] as string) || '';
    expect(payload).toContain('[FILTERED_SENSITIVE_DATA]');
    expect(payload).toContain('[FILTERED_LONG_TEXT]');
    spy.mockRestore();
  });
});
