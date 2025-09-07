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
      return headers;
    },
  }),
  tagTypes: ['Sessions'],
  endpoints: (builder) => ({
    fetchSessions: builder.query<SessionData[], void>({
      query: () => 'sessions',
      transformResponse: (response: ApiResponse<{ items: SessionData[] }>) => {
        if (response.success && response.data) {
          return response.data.items;
        }
        throw new Error(response.error?.message || 'Failed to fetch sessions');
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
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error?.message || 'Failed to create session');
      },
      invalidatesTags: [{ type: 'Sessions', id: 'LIST' }],
    }),
    deleteSession: builder.mutation<{ success: boolean }, string>({
      query: (sessionId) => ({
        url: `sessions/${sessionId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<{ success: boolean }>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error?.message || 'Failed to delete session');
      },
      invalidatesTags: (_result, _error, id) => [{ type: 'Sessions', id }],
    }),
    recoverSession: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: 'sessions/recover',
        method: 'POST',
      }),
      transformResponse: (response: ApiResponse<{ success: boolean }>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error?.message || 'Failed to recover session');
      },
    }),
  }),
});

export const {
  useFetchSessionsQuery,
  useCreateSessionMutation,
  useDeleteSessionMutation,
  useRecoverSessionMutation,
} = sessionsApi;
