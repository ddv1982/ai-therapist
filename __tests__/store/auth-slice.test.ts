import reducer, { clearSetupData, clearAuthError, checkSessionStatus, loadSetupData, completeSetup, verifyLogin, waitForAuthentication } from '@/store/slices/authSlice';

describe('authSlice reducer and thunks', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (global as any).fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial state', () => {
    const state = reducer(undefined, { type: '@@INIT' } as any);
    expect(state).toMatchObject({
      isAuthenticated: false,
      needsSetup: false,
      needsVerification: false,
      isLoading: false,
      error: null,
      setupData: null,
      isSetupLoading: false,
      isVerifying: false,
      lastCheckedAt: null,
    });
  });

  it('clearSetupData and clearAuthError should reset fields', () => {
    const pre = reducer(undefined, clearAuthError());
    expect(pre.error).toBeNull();
    const state = reducer({ ...(reducer(undefined, { type: '@@INIT' }) as any), setupData: { qrCodeUrl: 'x', manualEntryKey: 'y', backupCodes: [], secret: 'z' } }, clearSetupData());
    expect(state.setupData).toBeNull();
  });

  it('checkSessionStatus success should set auth flags and lastCheckedAt', async () => {
    (global as any).fetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: { isAuthenticated: true, needsSetup: false, needsVerification: false } }),
    });
    const state = reducer(undefined, { type: checkSessionStatus.fulfilled.type, payload: { isAuthenticated: true, needsSetup: false, needsVerification: false } });
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.lastCheckedAt).toEqual(expect.any(Number));
  });

  it('checkSessionStatus rejected should set error', () => {
    const state = reducer(undefined, { type: checkSessionStatus.rejected.type, error: { message: 'fail' } });
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('fail');
  });

  it('loadSetupData fulfilled sets setupData; rejected sets error', async () => {
    // fulfilled
    (global as any).fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: { qrCodeUrl: 'u', manualEntryKey: 'k', backupCodes: ['a'], secret: 's' } }) });
    const payload = { qrCodeUrl: 'u', manualEntryKey: 'k', backupCodes: ['a'], secret: 's' } as any;
    const state = reducer(undefined, { type: loadSetupData.fulfilled.type, payload });
    expect(state.setupData).toMatchObject({ qrCodeUrl: 'u', manualEntryKey: 'k' });

    // rejected
    const errState = reducer(undefined, { type: loadSetupData.rejected.type, error: { message: 'bad' } });
    expect(errState.error).toBe('bad');
  });

  it('completeSetup fulfilled updates auth flags; rejected sets error', async () => {
    let state = reducer(undefined, { type: completeSetup.fulfilled.type });
    expect(state.isAuthenticated).toBe(true);
    expect(state.needsSetup).toBe(false);
    expect(state.needsVerification).toBe(false);

    state = reducer(undefined, { type: completeSetup.rejected.type, error: { message: 'nope' } });
    expect(state.error).toBe('nope');
    expect(state.isVerifying).toBe(false);
  });

  it('verifyLogin fulfilled updates auth; rejected sets error', () => {
    let state = reducer(undefined, { type: verifyLogin.fulfilled.type });
    expect(state.isAuthenticated).toBe(true);
    state = reducer(undefined, { type: verifyLogin.rejected.type, error: { message: 'denied' } });
    expect(state.error).toBe('denied');
  });

  it('waitForAuthentication fulfilled true sets auth flags', () => {
    const state = reducer(undefined, { type: waitForAuthentication.fulfilled.type, payload: true });
    expect(state.isAuthenticated).toBe(true);
    expect(state.needsVerification).toBe(false);
    expect(state.needsSetup).toBe(false);
  });
});


