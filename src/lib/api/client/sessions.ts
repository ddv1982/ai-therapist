import { apiClient } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/api-response';
import type { components } from '@/types/api.generated';

export async function listSessions() {
  return apiClient.listSessions();
}

export async function createSession(body: { title: string }) {
  return apiClient.createSession(body);
}

export async function deleteSession(sessionId: string) {
  return apiClient.deleteSession(sessionId);
}

export async function getCurrentSession(): Promise<ApiResponse<{ currentSession: { id: string } | null }>> {
  return apiClient.getCurrentSession();
}

export async function setCurrentSession(sessionId: string): Promise<ApiResponse<{ success: boolean; session: components['schemas']['Session'] }>> {
  return apiClient.setCurrentSession(sessionId);
}


