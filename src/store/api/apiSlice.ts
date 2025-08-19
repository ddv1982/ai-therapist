import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { MessageData } from '@/features/chat/messages';
import type { SessionData } from '../slices/sessionsSlice';

// API slice for RTK Query - handles all server communication
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      // Add any auth headers here if needed
      return headers;
    },
  }),
  tagTypes: ['Session', 'Message', 'CBTEntry'],
  endpoints: (builder) => ({
    // Sessions endpoints
    getSessions: builder.query<SessionData[], void>({
      query: () => 'sessions',
      providesTags: ['Session'],
    }),
    createSession: builder.mutation<SessionData, { title?: string }>({
      query: (body) => ({
        url: 'sessions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Session'],
    }),
    updateSession: builder.mutation<SessionData, { id: string; updates: Partial<SessionData> }>({
      query: ({ id, updates }) => ({
        url: `sessions/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Session'],
    }),
    deleteSession: builder.mutation<void, string>({
      query: (id) => ({
        url: `sessions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Session'],
    }),
    
    // Messages endpoints
    getSessionMessages: builder.query<MessageData[], string>({
      query: (sessionId) => `sessions/${sessionId}/messages`,
      providesTags: ['Message'],
    }),
    
    // CBT endpoints
    saveCBTEntry: builder.mutation<void, { sessionId: string; entry: Record<string, unknown> }>({
      query: ({ sessionId, entry }) => ({
        url: `sessions/${sessionId}/cbt`,
        method: 'POST',
        body: entry,
      }),
      invalidatesTags: ['CBTEntry'],
    }),
    
    // Chat streaming endpoint - handled separately due to streaming nature
    sendMessage: builder.mutation<void, { sessionId: string; message: string; settings: Record<string, unknown> }>({
      queryFn: async () => {
        // This will be handled by our existing streaming chat logic
        // RTK Query doesn't handle streaming well, so we'll use it for metadata only
        return { data: undefined };
      },
      invalidatesTags: ['Message', 'Session'],
    }),
  }),
});

export const {
  useGetSessionsQuery,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  useDeleteSessionMutation,
  useGetSessionMessagesQuery,
  useSaveCBTEntryMutation,
  useSendMessageMutation,
} = apiSlice;