import { handleThunkError } from '@/store/middleware/async-error-handler';

describe('async-error-handler', () => {
  it('dispatches sessions error with message from Error', () => {
    const dispatch = jest.fn();
    handleThunkError(dispatch as any, new Error('boom'), 'sessions');
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: expect.stringContaining('sessions/setError') }));
  });

  it('dispatches chat error with string error', () => {
    const dispatch = jest.fn();
    handleThunkError(dispatch as any, 'network fail', 'chat');
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: expect.stringContaining('chat/setError') }));
  });
});


