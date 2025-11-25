import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGenerateReportMutation } from '@/lib/queries/reports';
import { apiClient } from '@/lib/api/client';
import React from 'react';

// Mock apiClient
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    generateReportDetailed: jest.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(QueryClientProvider, { client: queryClient }, children);

describe('Reports Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('useGenerateReportMutation should call generateReportDetailed', async () => {
    const mockResponse = { success: true, data: { reportContent: 'Report content' } };
    (apiClient.generateReportDetailed as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useGenerateReportMutation(), { wrapper });

    const request = {
      sessionId: '1',
      messages: [{ role: 'user', content: 'Hello' } as any],
      model: 'gpt-4',
    };

    result.current.mutate(request);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
    expect(apiClient.generateReportDetailed).toHaveBeenCalledWith(request);
  });
});
