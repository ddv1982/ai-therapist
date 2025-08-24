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

  // Sessions
  async listSessions(): Promise<ApiResponse<components['schemas']['Session'][]>> {
    type Resp = ApiResponse<components['schemas']['Session'][]>;
    const res = await fetch(this.withBase('/api/sessions'));
    const json = await parseJsonSafe(res);
    return json as Resp;
  }

  async createSession(body: paths['/sessions']['post']['requestBody']['content']['application/json']): Promise<ApiResponse<components['schemas']['Session']>> {
    type Resp = ApiResponse<components['schemas']['Session']>;
    const res = await fetch(this.withBase('/api/sessions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    const json = await parseJsonSafe(res);
    return json as Resp;
  }

  async deleteSession(sessionId: string): Promise<ApiResponse<{ success: true }>> {
    type Resp = ApiResponse<{ success: true }>;
    const res = await fetch(this.withBase(`/api/sessions/${sessionId}`), { method: 'DELETE', credentials: 'include' });
    const json = await parseJsonSafe(res);
    return json as Resp;
  }

  // Messages
  async listMessages(sessionId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<components['schemas']['Message']>>> {
    type Resp = ApiResponse<PaginatedResponse<components['schemas']['Message']>>;
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const url = this.withBase(`/api/sessions/${sessionId}/messages${qs.toString() ? `?${qs.toString()}` : ''}`);
    const res = await fetch(url, { credentials: 'include' });
    const json = await parseJsonSafe(res);
    return json as Resp;
  }

  async postMessage(sessionId: string, body: paths['/sessions/{sessionId}/messages']['post']['requestBody']['content']['application/json']): Promise<ApiResponse<components['schemas']['Message']>> {
    type Resp = ApiResponse<components['schemas']['Message']>;
    const res = await fetch(this.withBase(`/api/sessions/${sessionId}/messages`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    const json = await parseJsonSafe(res);
    return json as Resp;
  }

  // Reports
  async generateReport(body: paths['/reports']['post']['requestBody']['content']['application/json']): Promise<ApiResponse<unknown>> {
    type Resp = ApiResponse<unknown>;
    const res = await fetch(this.withBase('/api/reports'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    const json = await parseJsonSafe(res);
    return json as Resp;
  }

  // Reports (detailed generate endpoint)
  async generateReportDetailed(body: { sessionId: string; messages: Array<{ role: string; content: string; timestamp?: string }>; model?: string }) {
    const res = await fetch(this.withBase('/api/reports/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    return await parseJsonSafe(res);
  }
}

export const apiClient = new ApiClient('');

