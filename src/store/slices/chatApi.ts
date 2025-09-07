import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { MessageData } from '@/features/chat/messages';
import type { ApiResponse } from '@/lib/api/api-response';

interface SendMessageRequest {
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
}

interface SendMessageResponse {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  timestamp: string;
  createdAt: string;
  messageCount: number;
}

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Messages'],
  endpoints: (builder) => ({
    fetchMessages: builder.query<MessageData[], string>({
      query: (sessionId) => `sessions/${sessionId}/messages`,
      transformResponse: (response: ApiResponse<{ items: MessageData[] }>) => {
        if (response.success && response.data) {
          return response.data.items;
        }
        throw new Error(response.error?.message || 'Failed to fetch messages');
      },
      providesTags: (result, _error, sessionId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Messages' as const, id })),
              { type: 'Messages', id: `LIST-${sessionId}` },
            ]
          : [{ type: 'Messages', id: `LIST-${sessionId}` }],
    }),
    sendMessage: builder.mutation<SendMessageResponse, SendMessageRequest>({
      query: ({ sessionId, ...body }) => ({
        url: `sessions/${sessionId}/messages`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<SendMessageResponse>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error?.message || 'Failed to send message');
      },
      invalidatesTags: (_result, _error, { sessionId }) => [
        { type: 'Messages', id: `LIST-${sessionId}` },
      ],
    }),
  }),
});

export const { useFetchMessagesQuery, useSendMessageMutation } = chatApi;
