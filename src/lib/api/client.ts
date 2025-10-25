import type { paths as SessionPaths, components as SessionComponents } from '@/types/api/sessions';
import type { paths as MessagePaths, components as MessageComponents } from '@/types/api/messages';
import type { paths as ReportPaths } from '@/types/api/reports';
import type { ApiResponse, PaginatedResponse } from '@/lib/api/api-response';

async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractApiErrorDetails(parsed: unknown): string | undefined {
  if (!isRecord(parsed)) return undefined;
  const maybeError = (parsed as { error?: unknown }).error;
  if (isRecord(maybeError)) {
    const details = typeof (maybeError as { details?: unknown }).details === 'string' ? (maybeError as { details: string }).details : undefined;
    const message = typeof (maybeError as { message?: unknown }).message === 'string' ? (maybeError as { message: string }).message : undefined;
    return details || message;
  }
  try {
    return JSON.stringify(parsed);
  } catch {
    return undefined;
  }
}

function getHeaderSafe(res: Response, key: string): string | undefined {
  try {
    const anyRes = res as unknown as { headers?: { get?: (k: string) => string | null } };
    const getter = anyRes.headers?.get;
    if (typeof getter === 'function') {
      const value = getter.call(anyRes.headers, key);
      return value === null ? undefined : value;
    }
    return undefined;
  } catch {
    return undefined;
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
    const method = (init.method || 'GET').toUpperCase();
    const hasBody = init.body !== undefined && init.body !== null;
    if (hasBody && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
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

    // If unauthorized or other non-OK status, throw with best-effort details
    // Auth is managed via DB-backed session cookie; no token refresh
    const contentType = getHeaderSafe(res, 'content-type') || '';
    const isJson = contentType.toLowerCase().includes('json');
    let payload: unknown = null;
    if (isJson) {
      payload = await parseJsonSafe(res);
    } else if (res.status === 204 || res.status === 205 || method === 'HEAD') {
      payload = null;
    } else {
      payload = null;
    }

    if (!res.ok) {
      let detail: string | undefined;
      if (isJson) {
        detail = extractApiErrorDetails(payload);
      } else {
        const textFn = (res as { text?: () => Promise<string> }).text;
        const text = typeof textFn === 'function' ? await textFn.call(res) : undefined;
        detail = typeof text === 'string' && text.length > 0 ? text : undefined;
      }
      const message = detail && detail.length > 0 ? detail : (res.statusText || 'Request failed');
      const error = new Error(message) as Error & { status?: number; body?: unknown };
      error.status = res.status;
      const bodyForError = isJson ? payload : detail;
      if (bodyForError !== undefined && bodyForError !== null && bodyForError !== '') {
        error.body = bodyForError;
      } else if (payload !== undefined && payload !== null && payload !== '') {
        error.body = payload;
      }
      throw error;
    }

    if (!isJson) {
      return null as unknown as T;
    }

    return payload as T;
  }

  // Token refresh removed; DB-backed session cookie handles auth.

  // Sessions
  async listSessions(): Promise<ApiResponse<PaginatedResponse<SessionComponents['schemas']['Session']>>> {
    return this.request<ApiResponse<PaginatedResponse<SessionComponents['schemas']['Session']>>>('/api/sessions');
  }

  async createSession(body: SessionPaths['/sessions']['post']['requestBody']['content']['application/json']): Promise<ApiResponse<SessionComponents['schemas']['Session']>> {
    return this.request<ApiResponse<SessionComponents['schemas']['Session']>>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async deleteSession(sessionId: string): Promise<ApiResponse<{ success: true }>> {
    return this.request<ApiResponse<{ success: true }>>(`/api/sessions/${sessionId}`, { method: 'DELETE' });
  }

  // Messages
  async listMessages(sessionId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<MessageComponents['schemas']['Message']>>> {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    const path = `/api/sessions/${sessionId}/messages${qs.toString() ? `?${qs.toString()}` : ''}`;
    return this.request<ApiResponse<PaginatedResponse<MessageComponents['schemas']['Message']>>>(path);
  }

  async postMessage(
    sessionId: string,
    body: MessagePaths['/sessions/{sessionId}/messages']['post']['requestBody']['content']['application/json'] & { metadata?: Record<string, unknown> }
  ): Promise<ApiResponse<MessageComponents['schemas']['Message']>> {
    return this.request<ApiResponse<MessageComponents['schemas']['Message']>>(`/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async patchMessageMetadata(
    sessionId: string,
    messageId: string,
    body: {
      metadata: Record<string, unknown>;
      mergeStrategy?: 'merge' | 'replace';
    }
  ): Promise<ApiResponse<MessageComponents['schemas']['Message']>> {
    return this.request<ApiResponse<MessageComponents['schemas']['Message']>>(`/api/sessions/${sessionId}/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  // Reports (legacy POST /api/reports removed)

  // Reports (detailed generate endpoint)
  async generateReportDetailed(body: ReportPaths['/reports/generate']['post']['requestBody']['content']['application/json']): Promise<ApiResponse<{ reportContent: string; modelUsed: string; modelDisplayName: string; cbtDataSource: string; cbtDataAvailable: boolean }>> {
    return this.request<ApiResponse<{ reportContent: string; modelUsed: string; modelDisplayName: string; cbtDataSource: string; cbtDataAvailable: boolean }>>('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Current session
  async getCurrentSession(): Promise<ApiResponse<{ currentSession: { id: string; title: string; startedAt: string; updatedAt: string; status: string; messageCount: number } | null }>> {
    return this.request<ApiResponse<{ currentSession: { id: string; title: string; startedAt: string; updatedAt: string; status: string; messageCount: number } | null }>>('/api/sessions/current');
  }

  async setCurrentSession(sessionId: string): Promise<ApiResponse<{ success: boolean; session: SessionComponents['schemas']['Session'] }>> {
    return this.request<ApiResponse<{ success: boolean; session: SessionComponents['schemas']['Session'] }>>('/api/sessions/current', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  // Single session
  async getSessionById(sessionId: string): Promise<ApiResponse<SessionComponents['schemas']['Session']>> {
    return this.request<ApiResponse<SessionComponents['schemas']['Session']>>(`/api/sessions/${sessionId}`);
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
