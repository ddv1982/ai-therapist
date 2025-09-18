import type { paths, components } from '@/types/api.generated';
import type { ApiResponse, PaginatedResponse } from '@/lib/api/api-response';

// Legacy alias no longer used; keeping for reference only
// type ApiResult<T> = SuccessResponse<T> | ErrorResponse;

async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export class ApiClient {
  constructor(private readonly baseUrl: string = '') {}

  private withBase(path: string) {
    return `${this.baseUrl}${path}`;
  }

  private generateRequestId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private async request<T>(path: string, init: RequestInit = {}, timeoutMs: number = 20000): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const headers = new Headers(init.headers || {});
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (!headers.has('X-Request-Id')) headers.set('X-Request-Id', this.generateRequestId());

    let res: Response;
    try {
      res = await fetch(this.withBase(path), {
        credentials: 'include',
        ...init,
        headers,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    // If unauthorized, surface the 401 response to the caller without retry
    // Auth is managed via DB-backed session cookie; no token refresh

    return (await parseJsonSafe(res)) as T;
  }

  // Token refresh removed; DB-backed session cookie handles auth.

  // Sessions
  async listSessions(): Promise<ApiResponse<components['schemas']['Session'][]>> {
    return this.request<ApiResponse<components['schemas']['Session'][]>>('/api/sessions');
  }

  async createSession(body: paths['/sessions']['post']['requestBody']['content']['application/json']): Promise<ApiResponse<components['schemas']['Session']>> {
    return this.request<ApiResponse<components['schemas']['Session']>>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async deleteSession(sessionId: string): Promise<ApiResponse<{ success: true }>> {
    return this.request<ApiResponse<{ success: true }>>(`/api/sessions/${sessionId}`, { method: 'DELETE' });
  }

  // Messages
  async listMessages(sessionId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<components['schemas']['Message']>>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const url = this.withBase(`/api/sessions/${sessionId}/messages${qs.toString() ? `?${qs.toString()}` : ''}`);
    return this.request<ApiResponse<PaginatedResponse<components['schemas']['Message']>>>(url);
  }

  async postMessage(sessionId: string, body: paths['/sessions/{sessionId}/messages']['post']['requestBody']['content']['application/json']): Promise<ApiResponse<components['schemas']['Message']>> {
    return this.request<ApiResponse<components['schemas']['Message']>>(`/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Reports (legacy POST /api/reports removed)

  // Reports (detailed generate endpoint)
  async generateReportDetailed(body: paths['/reports/generate']['post']['requestBody']['content']['application/json']): Promise<ApiResponse<{ reportContent: string; modelUsed: string; modelDisplayName: string; cbtDataSource: string; cbtDataAvailable: boolean }>> {
    return this.request<ApiResponse<{ reportContent: string; modelUsed: string; modelDisplayName: string; cbtDataSource: string; cbtDataAvailable: boolean }>>('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Current session
  async getCurrentSession(): Promise<ApiResponse<{ currentSession: { id: string; title: string; startedAt: string; updatedAt: string; status: string; messageCount: number } | null }>> {
    return this.request<ApiResponse<{ currentSession: { id: string; title: string; startedAt: string; updatedAt: string; status: string; messageCount: number } | null }>>('/api/sessions/current');
  }

  async setCurrentSession(sessionId: string): Promise<ApiResponse<{ success: boolean; session: components['schemas']['Session'] }>> {
    return this.request<ApiResponse<{ success: boolean; session: components['schemas']['Session'] }>>('/api/sessions/current', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  // Single session
  async getSessionById(sessionId: string): Promise<ApiResponse<components['schemas']['Session']>> {
    return this.request<ApiResponse<components['schemas']['Session']>>(`/api/sessions/${sessionId}`);
  }

  // Auth/session status
  async getSessionStatus(): Promise<ApiResponse<{ isAuthenticated: boolean; needsSetup: boolean; needsVerification: boolean; device?: { name: string; deviceId: string } }>> {
    return this.request<ApiResponse<{ isAuthenticated: boolean; needsSetup: boolean; needsVerification: boolean; device?: { name: string; deviceId: string } }>>('/api/auth/session');
  }

  async revokeCurrentSession(): Promise<ApiResponse<{ success: true }>> {
    return this.request<ApiResponse<{ success: true }>>('/api/auth/session', { method: 'DELETE' });
  }

  async logout(): Promise<ApiResponse<{ success: true }>> {
    return this.request<ApiResponse<{ success: true }>>('/api/auth/logout', { method: 'POST' });
  }

  // Devices
  async listDevices(): Promise<ApiResponse<{ devices: unknown[]; backupCodesCount: number }>> {
    return this.request<ApiResponse<{ devices: unknown[]; backupCodesCount: number }>>('/api/auth/devices');
  }

  async revokeDevice(deviceId: string): Promise<ApiResponse<{ success: true }>> {
    return this.request<ApiResponse<{ success: true }>>('/api/auth/devices', {
      method: 'DELETE',
      body: JSON.stringify({ deviceId }),
    });
  }
}

export const apiClient = new ApiClient('');
