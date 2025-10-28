import { selectModelAndTools } from '@/lib/chat/model-selector';

describe('model-selector', () => {
  it('uses preferred model when available', () => {
    const res = selectModelAndTools({ message: 'hi', preferredModel: 'gpt-4o-mini' });
    expect(typeof res.model).toBe('string');
  });

  it('falls back when preferred model unknown', () => {
    const res = selectModelAndTools({ message: 'hi', preferredModel: 'non-existent-model' });
    expect(typeof res.model).toBe('string');
  });

  it('enables web-search tool and analytical model when webSearchEnabled', () => {
    const res = selectModelAndTools({ message: 'hi', webSearchEnabled: true });
    expect(res.tools).toContain('web-search');
  });

  it('switches to analytical model when message hints analysis', () => {
    const res = selectModelAndTools({ message: 'Please analyze and create a plan' });
    expect(typeof res.model).toBe('string');
  });
});
