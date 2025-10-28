import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ApiResponse } from '@/lib/api/api-response';
import { isApiResponse } from '@/lib/api/api-response';

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

// Exported pure transform helpers for testing and reuse
export function transformFetchSessionsResponse(response: ApiResponse<SessionData[]> | SessionData[]): SessionData[] {
  if (isApiResponse<SessionData[]>(response) && Array.isArray(response.data)) {
    return (response as { data: SessionData[] }).data;
  }
  if (Array.isArray(response as unknown as SessionData[])) {
    return response as unknown as SessionData[];
  }
  throw new Error((response as { error?: { message?: string } })?.error?.message || 'Failed to fetch sessions');
}

export function transformCreateSessionResponse(response: ApiResponse<CreateSessionResponse> | CreateSessionResponse): CreateSessionResponse {
  if (isApiResponse<CreateSessionResponse>(response) && response.data) {
    return response.data;
  }
  if ((response as unknown as CreateSessionResponse)?.id) {
    return response as unknown as CreateSessionResponse;
  }
  throw new Error((response as { error?: { message?: string } })?.error?.message || 'Failed to create session');
}

export function transformDeleteSessionResponse(response: ApiResponse<{ success: boolean }> | { success?: boolean }): { success: boolean } {
  if (isApiResponse<{ success: boolean }>(response) && response.data) {
    return response.data;
  }
  if (typeof (response as { success?: boolean })?.success === 'boolean') {
    return { success: Boolean((response as { success?: boolean }).success) };
  }
  throw new Error((response as { error?: { message?: string } })?.error?.message || 'Failed to delete session');
}

export function transformGetCurrentSessionResponse(
  response: ApiResponse<{ currentSession: { id: string } | null } | { currentSession?: { id: string } | null }>
): { id: string } | null {
  if (isApiResponse<{ currentSession: { id: string } | null }>(response) && (response.data as { currentSession?: { id: string } | null } | undefined)) {
    return ((response.data as { currentSession?: { id: string } | null }).currentSession) ?? null;
  }
  if ((response as { currentSession?: { id: string } | null })?.currentSession !== undefined) {
    return ((response as { currentSession?: { id: string } | null }).currentSession) ?? null;
  }
  return null;
}

export function transformSetCurrentSessionResponse(
  response: ApiResponse<{ success: boolean } | { session?: unknown } | { data?: { success?: boolean } }>
): { success: boolean } {
  if (isApiResponse(response) && response.success) {
    return { success: true };
  }
  if ((response as { data?: { success?: boolean } }).data?.success) {
    return { success: true };
  }
  return { success: false };
}

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
      transformResponse: (response: ApiResponse<SessionData[]>) => transformFetchSessionsResponse(response),
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
      transformResponse: (response: ApiResponse<CreateSessionResponse>) => transformCreateSessionResponse(response),
      invalidatesTags: [{ type: 'Sessions', id: 'LIST' }],
    }),
    deleteSession: builder.mutation<{ success: boolean }, string>({
      query: (sessionId) => ({
        url: `sessions/${sessionId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiResponse<{ success: boolean }>) => transformDeleteSessionResponse(response),
      invalidatesTags: (_result, _error, id) => [{ type: 'Sessions', id }],
    }),
    getCurrentSession: builder.query<{ id: string } | null, void>({
      query: () => 'sessions/current',
      transformResponse: (response: ApiResponse<{ currentSession: { id: string } | null } | { currentSession?: { id: string } }>) => transformGetCurrentSessionResponse(response),
      providesTags: [{ type: 'CurrentSession', id: 'SINGLE' }],
    }),
    setCurrentSession: builder.mutation<{ success: boolean }, string>({
      query: (sessionId) => ({
        url: 'sessions/current',
        method: 'POST',
        body: { sessionId },
      }),
      transformResponse: (response: ApiResponse<{ success: boolean } | { session?: unknown } | { data?: { success?: boolean } }>) => transformSetCurrentSessionResponse(response),
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
