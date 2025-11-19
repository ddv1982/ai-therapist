'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, PaginatedResponse } from '@/lib/api/api-response';
import { isApiResponse } from '@/lib/api/api-response';
import type { Session } from '@/types';

import { apiClient } from '@/lib/api/client';

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
  response: ApiResponse<PaginatedResponse<Session>>
): SessionData[] {
  let sessions: Session[] = [];

  if (isApiResponse(response)) {
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch sessions');
    }
    if (response.data && 'items' in response.data && Array.isArray(response.data.items)) {
      sessions = response.data.items;
    } else if (Array.isArray(response.data)) {
      sessions = response.data as Session[];
    }
  }

  return sessions.map((session) => ({
    id: session.id,
    title: session.title,
    createdAt: session.createdAt ?? new Date().toISOString(),
    updatedAt: session.updatedAt ?? new Date().toISOString(),
    messageCount: session._count?.messages ?? 0,
  }));
}

export function transformCreateSessionResponse(
  response: ApiResponse<Session>
): CreateSessionResponse {
  if (isApiResponse(response)) {
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to create session');
    }
    if (response.data) {
      const session = response.data;
      return {
        id: session.id,
        title: session.title,
        createdAt: session.createdAt ?? new Date().toISOString(),
        updatedAt: session.updatedAt ?? new Date().toISOString(),
        messageCount: session._count?.messages ?? 0,
      };
    }
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
      const response = await apiClient.listSessions();
      return transformFetchSessionsResponse(response);
    },
  });
}

// Get current session
export function useCurrentSessionQuery() {
  return useQuery({
    queryKey: sessionKeys.current(),
    queryFn: async () => {
      const response = await apiClient.getCurrentSession();
      return transformGetCurrentSessionResponse(response);
    },
  });
}

// Create session mutation
export function useCreateSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateSessionRequest) => {
      const response = await apiClient.createSession(body);
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
      const response = await apiClient.deleteSession(sessionId);
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
      const response = await apiClient.setCurrentSession(sessionId);
      return transformSetCurrentSessionResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.current() });
    },
  });
}
