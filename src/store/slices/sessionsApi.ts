import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ApiResponse } from '@/lib/api/api-response';

export interface SessionData {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage?: string;
}

interface CreateSessionRequest {
  title: string;
}

type CreateSessionResponse = SessionData;

export const sessionsApi = createApi({
  reducerPath: 'sessionsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      if (!headers.has('X-Request-Id')) {
        const rid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        headers.set('X-Request-Id', rid);
      }
      return headers;
    },
  }),
  tagTypes: ['Sessions', 'CurrentSession'],
  endpoints: (builder) => ({
    fetchSessions: builder.query<SessionData[], void>({
      query: () => 'sessions',
      transformResponse: (response: ApiResponse<SessionData[]>) => {
        if ((response as { success?: boolean }).success && Array.isArray((response as { data?: SessionData[] }).data)) {
          return (response as { data: SessionData[] }).data;
        }
        // If server returns plain array, accept for now; prefer canonical wrapper
        if (Array.isArray(response as unknown as SessionData[])) {
          return response as unknown as SessionData[];
        }
        throw new Error((response as { error?: { message?: string } })?.error?.message || 'Failed to fetch sessions');
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Sessions' as const, id })),
              { type: 'Sessions', id: 'LIST' },
            ]
          : [{ type: 'Sessions', id: 'LIST' }],
    }),
    createSession: builder.mutation<CreateSessionResponse, CreateSessionRequest>({
      query: (body) => ({
        url: 'sessions',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<CreateSessionResponse>) => {
        if ((response as { success?: boolean }).success && (response as { data?: CreateSessionResponse }).data) {
          return (response as { data: CreateSessionResponse }).data;
        }
        // Some endpoints may return plain object
        if ((response as unknown as CreateSessionResponse)?.id) {
          return response as unknown as CreateSessionResponse;
        }
        throw new Error((response as { error?: { message?: string } })?.error?.message || 'Failed to create session');
      },
      invalidatesTags: [{ type: 'Sessions', id: 'LIST' }],
    }),
    deleteSession: builder.mutation<{ success: boolean }, string>({
      query: (sessionId) => ({
        url: `sessions/${sessionId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<{ success: boolean }>) => {
        if ((response as { success?: boolean }).success && (response as { data?: { success: boolean } }).data) {
          return (response as { data: { success: boolean } }).data;
        }
        // Some endpoints may return plain success
        if (typeof (response as unknown as { success?: boolean })?.success === 'boolean') {
          return { success: Boolean((response as unknown as { success?: boolean }).success) };
        }
        throw new Error((response as { error?: { message?: string } })?.error?.message || 'Failed to delete session');
      },
      invalidatesTags: (_result, _error, id) => [{ type: 'Sessions', id }],
    }),
    getCurrentSession: builder.query<{ id: string } | null, void>({
      query: () => 'sessions/current',
      transformResponse: (response: ApiResponse<{ currentSession: { id: string } | null } | { currentSession?: { id: string } }>) => {
        // Standardized wrapper
        if ((response as { success?: boolean }).success && (response as { data?: { currentSession?: { id: string } | null } }).data) {
          return ((response as { data: { currentSession?: { id: string } | null } }).data.currentSession) ?? null;
        }
        // Legacy direct shape
        if ((response as { currentSession?: { id: string } | null })?.currentSession !== undefined) {
          return ((response as { currentSession?: { id: string } | null }).currentSession) ?? null;
        }
        return null;
      },
      providesTags: [{ type: 'CurrentSession', id: 'SINGLE' }],
    }),
    setCurrentSession: builder.mutation<{ success: boolean }, string>({
      query: (sessionId) => ({
        url: 'sessions/current',
        method: 'POST',
        body: { sessionId },
      }),
      transformResponse: (response: ApiResponse<{ success: boolean } | { session?: unknown }>) => {
        if ((response as { success?: boolean }).success) {
          return { success: true };
        }
        if ((response as { data?: { success?: boolean } }).data?.success) {
          return { success: true };
        }
        return { success: false };
      },
      invalidatesTags: [{ type: 'CurrentSession', id: 'SINGLE' }],
    }),
  }),
});

export const {
  useFetchSessionsQuery,
  useCreateSessionMutation,
  useDeleteSessionMutation,
  useGetCurrentSessionQuery,
  useSetCurrentSessionMutation,
} = sessionsApi;
