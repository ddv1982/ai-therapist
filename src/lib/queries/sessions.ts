'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
export function transformFetchSessionsResponse(
  response: ApiResponse<SessionData[]> | SessionData[]
): SessionData[] {
  if (isApiResponse<SessionData[]>(response) && Array.isArray(response.data)) {
    return (response as { data: SessionData[] }).data;
  }
  if (Array.isArray(response as unknown as SessionData[])) {
    return response as unknown as SessionData[];
  }
  throw new Error(
    (response as { error?: { message?: string } })?.error?.message || 'Failed to fetch sessions'
  );
}

export function transformCreateSessionResponse(
  response: ApiResponse<CreateSessionResponse> | CreateSessionResponse
): CreateSessionResponse {
  if (isApiResponse<CreateSessionResponse>(response) && response.data) {
    return response.data;
  }
  if ((response as unknown as CreateSessionResponse)?.id) {
    return response as unknown as CreateSessionResponse;
  }
  throw new Error(
    (response as { error?: { message?: string } })?.error?.message || 'Failed to create session'
  );
}

export function transformDeleteSessionResponse(
  response: ApiResponse<{ success: boolean }> | { success?: boolean }
): { success: boolean } {
  if (isApiResponse<{ success: boolean }>(response) && response.data) {
    return response.data;
  }
  if (typeof (response as { success?: boolean })?.success === 'boolean') {
    return { success: Boolean((response as { success?: boolean }).success) };
  }
  throw new Error(
    (response as { error?: { message?: string } })?.error?.message || 'Failed to delete session'
  );
}

export function transformGetCurrentSessionResponse(
  response: ApiResponse<
    { currentSession: { id: string } | null } | { currentSession?: { id: string } | null }
  >
): { id: string } | null {
  if (
    isApiResponse<{ currentSession: { id: string } | null }>(response) &&
    (response.data as { currentSession?: { id: string } | null } | undefined)
  ) {
    return (response.data as { currentSession?: { id: string } | null }).currentSession ?? null;
  }
  if ((response as { currentSession?: { id: string } | null })?.currentSession !== undefined) {
    return (response as { currentSession?: { id: string } | null }).currentSession ?? null;
  }
  return null;
}

export function transformSetCurrentSessionResponse(
  response: ApiResponse<
    { success: boolean } | { session?: unknown } | { data?: { success?: boolean } }
  >
): { success: boolean } {
  if (isApiResponse(response) && response.success) {
    return { success: true };
  }
  if ((response as { data?: { success?: boolean } }).data?.success) {
    return { success: true };
  }
  return { success: false };
}

// Helper to add X-Request-Id header
const fetchWithHeaders = async (url: string, options?: RequestInit) => {
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');
  if (!headers.has('X-Request-Id')) {
    const rid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    headers.set('X-Request-Id', rid);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Query keys factory
export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: () => [...sessionKeys.lists()] as const,
  current: () => [...sessionKeys.all, 'current'] as const,
  detail: (id: string) => [...sessionKeys.all, 'detail', id] as const,
};

// Fetch all sessions
export function useSessionsQuery() {
  return useQuery({
    queryKey: sessionKeys.list(),
    queryFn: async () => {
      const response = await fetchWithHeaders('/api/sessions');
      return transformFetchSessionsResponse(response);
    },
  });
}

// Get current session
export function useCurrentSessionQuery() {
  return useQuery({
    queryKey: sessionKeys.current(),
    queryFn: async () => {
      const response = await fetchWithHeaders('/api/sessions/current');
      return transformGetCurrentSessionResponse(response);
    },
  });
}

// Create session mutation
export function useCreateSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateSessionRequest) => {
      const response = await fetchWithHeaders('/api/sessions', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      return transformCreateSessionResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
    },
  });
}

// Delete session mutation
export function useDeleteSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetchWithHeaders(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      return transformDeleteSessionResponse(response);
    },
    onSuccess: (_result, sessionId) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
    },
  });
}

// Set current session mutation
export function useSetCurrentSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetchWithHeaders('/api/sessions/current', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      });
      return transformSetCurrentSessionResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.current() });
    },
  });
}
