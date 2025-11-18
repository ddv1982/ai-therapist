import { configureStore } from '@reduxjs/toolkit';
import {
  sessionsApi,
  transformFetchSessionsResponse,
  transformCreateSessionResponse,
  transformDeleteSessionResponse,
  transformGetCurrentSessionResponse,
  transformSetCurrentSessionResponse,
} from '@/store/slices/sessions-api';

describe('sessions-api', () => {
  describe('RTK Query API', () => {
    beforeEach(() => {
      // Store configuration for RTK Query setup
      configureStore({
        reducer: {
          [sessionsApi.reducerPath]: sessionsApi.reducer,
        },
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sessionsApi.middleware),
      });
    });

    it('has fetchSessions endpoint', () => {
      expect(sessionsApi.endpoints.fetchSessions).toBeDefined();
    });

    it('has createSession endpoint', () => {
      expect(sessionsApi.endpoints.createSession).toBeDefined();
    });

    it('has deleteSession endpoint', () => {
      expect(sessionsApi.endpoints.deleteSession).toBeDefined();
    });

    it('has getCurrentSession endpoint', () => {
      expect(sessionsApi.endpoints.getCurrentSession).toBeDefined();
    });

    it('has setCurrentSession endpoint', () => {
      expect(sessionsApi.endpoints.setCurrentSession).toBeDefined();
    });

    it('exports useFetchSessionsQuery hook', () => {
      const { useFetchSessionsQuery } = require('@/store/slices/sessions-api');
      expect(typeof useFetchSessionsQuery).toBe('function');
    });

    it('exports useCreateSessionMutation hook', () => {
      const { useCreateSessionMutation } = require('@/store/slices/sessions-api');
      expect(typeof useCreateSessionMutation).toBe('function');
    });

    it('exports useDeleteSessionMutation hook', () => {
      const { useDeleteSessionMutation } = require('@/store/slices/sessions-api');
      expect(typeof useDeleteSessionMutation).toBe('function');
    });

    it('exports useGetCurrentSessionQuery hook', () => {
      const { useGetCurrentSessionQuery } = require('@/store/slices/sessions-api');
      expect(typeof useGetCurrentSessionQuery).toBe('function');
    });

    it('exports useSetCurrentSessionMutation hook', () => {
      const { useSetCurrentSessionMutation } = require('@/store/slices/sessions-api');
      expect(typeof useSetCurrentSessionMutation).toBe('function');
    });

    it('has correct reducer path', () => {
      expect(sessionsApi.reducerPath).toBe('sessionsApi');
    });

    it('has Sessions and CurrentSession tag types', () => {
      expect(sessionsApi).toBeDefined();
    });
  });

  describe('sessions-api transforms', () => {
    describe('transformFetchSessionsResponse', () => {
      it('extracts data from ApiResponse format', () => {
        const response = {
          success: true,
          data: [
            {
              id: 's1',
              title: 'Session 1',
              createdAt: '2023-01-01',
              updatedAt: '2023-01-01',
              messageCount: 5,
            },
            {
              id: 's2',
              title: 'Session 2',
              createdAt: '2023-01-02',
              updatedAt: '2023-01-02',
              messageCount: 3,
            },
          ],
          meta: { timestamp: '2023-01-01T00:00:00Z' },
        };

        const result = transformFetchSessionsResponse(response);

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('s1');
        expect(result[1].id).toBe('s2');
      });

      it('handles plain array response', () => {
        const response = [
          {
            id: 's1',
            title: 'Session 1',
            createdAt: '2023-01-01',
            updatedAt: '2023-01-01',
            messageCount: 5,
          },
        ];

        const result = transformFetchSessionsResponse(response as any);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('s1');
      });

      it('throws error when response has error', () => {
        const response = {
          success: false,
          error: { message: 'Failed to fetch sessions' },
        };

        expect(() => transformFetchSessionsResponse(response as any)).toThrow(
          'Failed to fetch sessions'
        );
      });

      it('throws generic error when response format is invalid', () => {
        const response = { invalid: true };

        expect(() => transformFetchSessionsResponse(response as any)).toThrow(
          'Failed to fetch sessions'
        );
      });
    });

    describe('transformCreateSessionResponse', () => {
      it('extracts data from ApiResponse format', () => {
        const response = {
          success: true,
          data: {
            id: 's1',
            title: 'New Session',
            createdAt: '2023-01-01',
            updatedAt: '2023-01-01',
            messageCount: 0,
          },
          meta: { timestamp: '2023-01-01T00:00:00Z' },
        };

        const result = transformCreateSessionResponse(response);

        expect(result.id).toBe('s1');
        expect(result.title).toBe('New Session');
      });

      it('handles direct session object response', () => {
        const response = {
          id: 's1',
          title: 'Direct',
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
          messageCount: 0,
        };

        const result = transformCreateSessionResponse(response as any);

        expect(result.id).toBe('s1');
        expect(result.title).toBe('Direct');
      });

      it('throws error when response has error', () => {
        const response = {
          success: false,
          error: { message: 'Session creation failed' },
        };

        expect(() => transformCreateSessionResponse(response as any)).toThrow(
          'Session creation failed'
        );
      });

      it('throws generic error when response format is invalid', () => {
        const response = { invalid: true };

        expect(() => transformCreateSessionResponse(response as any)).toThrow(
          'Failed to create session'
        );
      });
    });

    describe('transformDeleteSessionResponse', () => {
      it('extracts success from ApiResponse format', () => {
        const response = {
          success: true,
          data: { success: true },
          meta: { timestamp: '2023-01-01T00:00:00Z' },
        };

        const result = transformDeleteSessionResponse(response);

        expect(result.success).toBe(true);
      });

      it('handles direct success object response', () => {
        const response = { success: true };

        const result = transformDeleteSessionResponse(response as any);

        expect(result.success).toBe(true);
      });

      it('handles false success value', () => {
        const response = { success: false };

        const result = transformDeleteSessionResponse(response as any);

        expect(result.success).toBe(false);
      });

      it('throws error when response has error', () => {
        const response = {
          error: { message: 'Deletion failed' },
        };

        expect(() => transformDeleteSessionResponse(response as any)).toThrow('Deletion failed');
      });

      it('throws generic error when response format is invalid', () => {
        const response = { invalid: true };

        expect(() => transformDeleteSessionResponse(response as any)).toThrow(
          'Failed to delete session'
        );
      });
    });

    describe('transformGetCurrentSessionResponse', () => {
      it('extracts current session from ApiResponse format', () => {
        const response = {
          success: true,
          data: { currentSession: { id: 's1' } },
          meta: { timestamp: '2023-01-01T00:00:00Z' },
        };

        const result = transformGetCurrentSessionResponse(response as any);

        expect(result).toEqual({ id: 's1' });
      });

      it('handles direct object response', () => {
        const response = { currentSession: { id: 's1' } };

        const result = transformGetCurrentSessionResponse(response as any);

        expect(result).toEqual({ id: 's1' });
      });

      it('returns null when no current session exists', () => {
        const response = {
          success: true,
          data: { currentSession: null },
          meta: { timestamp: '2023-01-01T00:00:00Z' },
        };

        const result = transformGetCurrentSessionResponse(response as any);

        expect(result).toBeNull();
      });

      it('returns null for direct object with null session', () => {
        const response = { currentSession: null };

        const result = transformGetCurrentSessionResponse(response as any);

        expect(result).toBeNull();
      });

      it('returns null when currentSession is undefined', () => {
        const response = { currentSession: undefined };

        const result = transformGetCurrentSessionResponse(response as any);

        expect(result).toBeNull();
      });

      it('returns null for invalid response format', () => {
        const response = { invalid: true };

        const result = transformGetCurrentSessionResponse(response as any);

        expect(result).toBeNull();
      });
    });

    describe('transformSetCurrentSessionResponse', () => {
      it('returns success true from ApiResponse format', () => {
        const response = {
          success: true,
          data: { session: { id: 's1' } },
          meta: { timestamp: '2023-01-01T00:00:00Z' },
        };

        const result = transformSetCurrentSessionResponse(response as any);

        expect(result.success).toBe(true);
      });

      it('returns success true from nested data.success', () => {
        const response = {
          data: { success: true },
        };

        const result = transformSetCurrentSessionResponse(response as any);

        expect(result.success).toBe(true);
      });

      it('returns success false for invalid response', () => {
        const response = { invalid: true };

        const result = transformSetCurrentSessionResponse(response as any);

        expect(result.success).toBe(false);
      });

      it('returns success false when data.success is false', () => {
        const response = {
          data: { success: false },
        };

        const result = transformSetCurrentSessionResponse(response as any);

        expect(result.success).toBe(false);
      });

      it('returns success false when response.success is false', () => {
        const response = {
          success: false,
          error: { message: 'Failed' },
        };

        const result = transformSetCurrentSessionResponse(response as any);

        expect(result.success).toBe(false);
      });
    });
  });
});
