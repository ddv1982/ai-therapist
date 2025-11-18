import { AnyAction, MiddlewareAPI } from '@reduxjs/toolkit';
let sessionHeartbeatMiddleware: (
  api: MiddlewareAPI
) => (next: (action: AnyAction) => AnyAction) => (action: AnyAction) => AnyAction;
let cleanupHeartbeat: () => void;

// Mock sessionsApi with minimal surface used by middleware
jest.mock('@/store/slices/sessions-api', () => {
  const initiate = jest.fn((_arg?: unknown, _opts?: unknown) => ({
    type: 'sessionsApi/executeQuery/pending',
  }));
  return {
    sessionsApi: {
      endpoints: {
        getCurrentSession: { initiate },
      },
    },
  };
});

const { sessionsApi } = require('@/store/slices/sessions-api');

describe('sessionHeartbeatMiddleware', () => {
  beforeEach(() => {
    const mod = require('@/store/middleware/session-heartbeat-middleware');
    sessionHeartbeatMiddleware = mod.sessionHeartbeatMiddleware;
    cleanupHeartbeat = mod.cleanupHeartbeat;
    jest.useFakeTimers();
    (sessionsApi.endpoints.getCurrentSession.initiate as jest.Mock).mockClear();
  });

  afterEach(() => {
    cleanupHeartbeat();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const setCurrent = (payload: unknown): AnyAction => ({
    type: 'sessions/setCurrentSession',
    payload,
  });
  const next = jest.fn((a: AnyAction) => a);
  const makeApi = () =>
    ({ dispatch: jest.fn(), getState: jest.fn(() => ({})) }) as unknown as MiddlewareAPI;

  it('triggers initial heartbeat and schedules interval when session set', () => {
    const api = makeApi();
    const run = sessionHeartbeatMiddleware(api)(next);
    run(setCurrent('s1'));
    expect(sessionsApi.endpoints.getCurrentSession.initiate).toHaveBeenCalledWith(undefined, {
      subscribe: false,
      forceRefetch: true,
    });
    expect(api.dispatch).toHaveBeenCalled();
    const callsBefore = (api.dispatch as jest.Mock).mock.calls.length;
    jest.advanceTimersByTime(10 * 60 * 1000);
    expect((api.dispatch as jest.Mock).mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('does not create duplicate intervals when setting session repeatedly', () => {
    const api = makeApi();
    const run = sessionHeartbeatMiddleware(api)(next);
    run(setCurrent('s1'));
    const callsAfterFirst = (api.dispatch as jest.Mock).mock.calls.length;
    run(setCurrent('s1'));
    run(setCurrent('s1'));
    jest.advanceTimersByTime(10 * 60 * 1000);
    const afterAdvance = (api.dispatch as jest.Mock).mock.calls.length;
    expect(afterAdvance - callsAfterFirst).toBe(1);
  });

  it('clears interval when session cleared', () => {
    const api = makeApi();
    const run = sessionHeartbeatMiddleware(api)(next);
    run(setCurrent('s1'));
    run(setCurrent(null));
    const callsBefore = (api.dispatch as jest.Mock).mock.calls.length;
    jest.advanceTimersByTime(10 * 60 * 1000);
    const callsAfter = (api.dispatch as jest.Mock).mock.calls.length;
    expect(callsAfter).toBe(callsBefore);
  });

  it('cleanupHeartbeat clears interval if active', () => {
    const api = makeApi();
    const run = sessionHeartbeatMiddleware(api)(next);
    run(setCurrent('s1'));
    cleanupHeartbeat();
    const callsBefore = (api.dispatch as jest.Mock).mock.calls.length;
    jest.advanceTimersByTime(10 * 60 * 1000);
    const callsAfter = (api.dispatch as jest.Mock).mock.calls.length;
    expect(callsAfter).toBe(callsBefore);
  });
});
