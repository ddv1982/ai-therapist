'use client';

import { useMutation } from '@tanstack/react-query';

interface GenerateReportRequest {
  sessionId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
  model: string;
}

interface GenerateReportResponse {
  success: boolean;
  data?: {
    reportContent: string;
  };
  reportContent?: string;
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

// Generate report mutation
export function useGenerateReportMutation() {
  return useMutation({
    mutationFn: async (request: GenerateReportRequest) => {
      const response = await fetchWithHeaders('/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      return response as GenerateReportResponse;
    },
  });
}
