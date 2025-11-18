import {
  transformFetchSessionsResponse,
  transformCreateSessionResponse,
  transformDeleteSessionResponse,
  transformGetCurrentSessionResponse,
  transformSetCurrentSessionResponse,
} from '@/store/slices/sessions-api';

describe('sessionsApi transforms', () => {
  it('fetchSessions accepts wrapped and plain arrays', () => {
    const wrapped = transformFetchSessionsResponse({ success: true, data: [{ id: 'a' }] } as any);
    expect(wrapped).toEqual([{ id: 'a' }]);
    const plain = transformFetchSessionsResponse([{ id: 'b' }] as any);
    expect(plain).toEqual([{ id: 'b' }]);
  });

  it('createSession accepts wrapped and plain objects and throws otherwise', () => {
    const wrapped = transformCreateSessionResponse({
      success: true,
      data: { id: 'x', title: 't', createdAt: '', updatedAt: '', messageCount: 0 },
    } as any);
    expect(wrapped.id).toBe('x');
    const plain = transformCreateSessionResponse({
      id: 'y',
      title: 't2',
      createdAt: '',
      updatedAt: '',
      messageCount: 1,
    } as any);
    expect(plain.id).toBe('y');
    expect(() => transformCreateSessionResponse({ error: { message: 'nope' } } as any)).toThrow();
  });

  it('deleteSession accepts various success shapes', () => {
    expect(transformDeleteSessionResponse({ success: true } as any)).toEqual({ success: true });
    expect(transformDeleteSessionResponse({ success: false } as any)).toEqual({ success: false });
    expect(
      transformDeleteSessionResponse({ success: true, data: { success: true } } as any)
    ).toEqual({ success: true });
  });

  it('getCurrentSession returns null for missing, supports wrapped and legacy shapes', () => {
    expect(
      transformGetCurrentSessionResponse({
        success: true,
        data: { currentSession: { id: 's1' } },
      } as any)
    ).toEqual({ id: 's1' });
    expect(transformGetCurrentSessionResponse({ currentSession: { id: 's2' } } as any)).toEqual({
      id: 's2',
    });
    expect(
      transformGetCurrentSessionResponse({ success: true, data: { currentSession: null } } as any)
    ).toBeNull();
    expect(transformGetCurrentSessionResponse({} as any)).toBeNull();
  });

  it('setCurrentSession normalizes success flags', () => {
    expect(transformSetCurrentSessionResponse({ success: true } as any)).toEqual({ success: true });
    expect(transformSetCurrentSessionResponse({ data: { success: true } } as any)).toEqual({
      success: true,
    });
    expect(transformSetCurrentSessionResponse({} as any)).toEqual({ success: false });
  });
});
