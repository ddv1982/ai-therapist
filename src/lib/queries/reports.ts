'use client';

import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';

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

// Generate report mutation
export function useGenerateReportMutation() {
  return useMutation({
    mutationFn: async (request: GenerateReportRequest) => {
      const response = await apiClient.generateReportDetailed(request);
      return response as GenerateReportResponse;
    },
  });
}
