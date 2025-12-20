'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, PaginatedResponse } from '@/lib/api/api-response';
import { isApiResponse } from '@/lib/api/api-response';
import type { Session } from '@/types';
import { apiClient } from '@/lib/api/client';
import { createSessionAction, deleteSessionAction } from '@/features/chat/actions/session-actions';

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
  } else {
    throw new Error('Invalid response format: expected ApiResponse');
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

// Query keys factory
export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: () => [...sessionKeys.lists()] as const,
  detail: (id: string) => [...sessionKeys.all, 'detail', id] as const,
};

// Fetch all sessions
type QueryOptions = {
  enabled?: boolean;
};

export function useSessionsQuery(options?: QueryOptions) {
  return useQuery({
    queryKey: sessionKeys.list(),
    queryFn: async () => {
      const response = await apiClient.listSessions();
      return transformFetchSessionsResponse(response);
    },
    enabled: options?.enabled ?? true,
  });
}

// Create session mutation
export function useCreateSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateSessionRequest) => {
      const result = await createSessionAction(body);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to create session');
      }
      return result.data as CreateSessionResponse;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
    },
  });
}

// Delete session mutation
export function useDeleteSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const result = await deleteSessionAction(sessionId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete session');
      }
      return { success: true };
    },
    onSuccess: (_result, sessionId) => {
      void queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
      void queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
    },
  });
}

