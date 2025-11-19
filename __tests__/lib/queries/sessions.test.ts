import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useSessionsQuery,
  useCreateSessionMutation,
  useDeleteSessionMutation,
  useSetCurrentSessionMutation,
  useCurrentSessionQuery,
  transformFetchSessionsResponse,
  transformCreateSessionResponse,
  transformDeleteSessionResponse,
  transformGetCurrentSessionResponse,
  transformSetCurrentSessionResponse,
  SessionData,
} from '@/lib/queries/sessions';
import { apiClient } from '@/lib/api/client';
import React from 'react';

// Mock apiClient
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    listSessions: jest.fn(),
    getCurrentSession: jest.fn(),
    createSession: jest.fn(),
    deleteSession: jest.fn(),
    setCurrentSession: jest.fn(),
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

describe('Sessions Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  describe('Transformers', () => {
    describe('transformFetchSessionsResponse', () => {
        it('should transform ApiResponse<SessionData[]> correctly', () => {
            const mockData: SessionData[] = [{ id: '1', title: 'Test', createdAt: '', updatedAt: '', messageCount: 0 }];
            const response = { success: true, data: mockData };
            expect(transformFetchSessionsResponse(response as any)).toEqual(mockData);
        });

        it('should transform raw SessionData[] correctly', () => {
            const mockData: SessionData[] = [{ id: '1', title: 'Test', createdAt: '', updatedAt: '', messageCount: 0 }];
            expect(transformFetchSessionsResponse(mockData)).toEqual(mockData);
        });

        it('should throw error on invalid response', () => {
            const response = { success: false, error: { message: 'Error' } };
            expect(() => transformFetchSessionsResponse(response as any)).toThrow('Error');
        });
        
        it('should throw default error if no message', () => {
           const response = { success: false };
           expect(() => transformFetchSessionsResponse(response as any)).toThrow('Failed to fetch sessions');
        });
    });

    describe('transformCreateSessionResponse', () => {
         it('should transform ApiResponse correctly', () => {
             const mockData = { id: '1', title: 'New', createdAt: '', updatedAt: '', messageCount: 0 };
             const response = { success: true, data: mockData };
             expect(transformCreateSessionResponse(response as any)).toEqual(mockData);
         });

         it('should transform raw response correctly', () => {
            const mockData = { id: '1', title: 'New', createdAt: '', updatedAt: '', messageCount: 0 };
            expect(transformCreateSessionResponse(mockData)).toEqual(mockData);
         });

         it('should throw error on invalid response', () => {
             expect(() => transformCreateSessionResponse({} as any)).toThrow('Failed to create session');
         });
    });

    describe('transformDeleteSessionResponse', () => {
        it('should transform ApiResponse correctly', () => {
            const response = { success: true, data: { success: true } };
            expect(transformDeleteSessionResponse(response as any)).toEqual({ success: true });
        });

        it('should transform raw response correctly', () => {
            const response = { success: true };
            expect(transformDeleteSessionResponse(response)).toEqual({ success: true });
        });

        it('should throw error on invalid response', () => {
             expect(() => transformDeleteSessionResponse({} as any)).toThrow('Failed to delete session');
        });
    });

    describe('transformGetCurrentSessionResponse', () => {
        it('should transform ApiResponse correctly', () => {
            const mockSession = { id: '1' };
            const response = { success: true, data: { currentSession: mockSession } };
            expect(transformGetCurrentSessionResponse(response as any)).toEqual(mockSession);
        });

        it('should transform raw response correctly', () => {
             const mockSession = { id: '1' };
             const response = { currentSession: mockSession };
             expect(transformGetCurrentSessionResponse(response as any)).toEqual(mockSession);
        });

        it('should return null if no session', () => {
             const response = { success: true, data: { currentSession: null } };
             expect(transformGetCurrentSessionResponse(response as any)).toBeNull();
        });

        it('should return null if empty object', () => {
             expect(transformGetCurrentSessionResponse({} as any)).toBeNull();
        });
    });

    describe('transformSetCurrentSessionResponse', () => {
        it('should return success true if response success', () => {
            expect(transformSetCurrentSessionResponse({ success: true } as any)).toEqual({ success: true });
        });
        
        it('should return success true if data has success', () => {
             expect(transformSetCurrentSessionResponse({ data: { success: true } } as any)).toEqual({ success: true });
        });

        it('should return success false otherwise', () => {
            expect(transformSetCurrentSessionResponse({} as any)).toEqual({ success: false });
        });
    });
  });

  describe('Hooks', () => {
    it('useSessionsQuery should fetch and transform sessions', async () => {
        const mockSessions = [{ id: '1', title: 'Session 1', createdAt: '2023-01-01', updatedAt: '2023-01-01', messageCount: 5 }];
        (apiClient.listSessions as jest.Mock).mockResolvedValue({ success: true, data: mockSessions });

        const { result } = renderHook(() => useSessionsQuery(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockSessions);
        expect(apiClient.listSessions).toHaveBeenCalled();
    });

    it('useCreateSessionMutation should create session', async () => {
        const newSession = { id: '2', title: 'New Session', createdAt: '', updatedAt: '', messageCount: 0 };
        (apiClient.createSession as jest.Mock).mockResolvedValue({ success: true, data: newSession });

        const { result } = renderHook(() => useCreateSessionMutation(), { wrapper });
        
        result.current.mutate({ title: 'New Session' });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(newSession);
        expect(apiClient.createSession).toHaveBeenCalledWith({ title: 'New Session' });
    });

    it('useDeleteSessionMutation should delete session', async () => {
        (apiClient.deleteSession as jest.Mock).mockResolvedValue({ success: true, data: { success: true } });

        const { result } = renderHook(() => useDeleteSessionMutation(), { wrapper });
        
        result.current.mutate('1');

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(apiClient.deleteSession).toHaveBeenCalledWith('1');
    });

     it('useCurrentSessionQuery should fetch current session', async () => {
        const mockSession = { id: '1' };
        (apiClient.getCurrentSession as jest.Mock).mockResolvedValue({ success: true, data: { currentSession: mockSession } });

        const { result } = renderHook(() => useCurrentSessionQuery(), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockSession);
    });

    it('useSetCurrentSessionMutation should set current session', async () => {
        (apiClient.setCurrentSession as jest.Mock).mockResolvedValue({ success: true });

        const { result } = renderHook(() => useSetCurrentSessionMutation(), { wrapper });

        result.current.mutate('1');

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(apiClient.setCurrentSession).toHaveBeenCalledWith('1');
    });
  });
});
