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

    const res = await fetch(this.withBase(path), {
      credentials: 'include',
      ...init,
      headers,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    return (await parseJsonSafe(res)) as T;
  }

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
  async generateReportDetailed(body: { sessionId: string; messages: Array<{ role: string; content: string; timestamp?: string }>; model?: string }) {
    return this.request('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Current session
  async getCurrentSession(): Promise<{ success?: boolean; data?: { currentSession?: { id: string; messageCount?: number } }; currentSession?: { id: string; messageCount?: number } } | null> {
    return this.request('/api/sessions/current');
  }

  async setCurrentSession(sessionId: string): Promise<{ success?: boolean } | null> {
    return this.request('/api/sessions/current', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  // Single session
  async getSessionById(sessionId: string): Promise<ApiResponse<components['schemas']['Session']>> {
    return this.request<ApiResponse<components['schemas']['Session']>>(`/api/sessions/${sessionId}`);
  }
}

export const apiClient = new ApiClient('');
