// Sessions feature barrel exports
// Provides clean imports for all session management functionality

// Note: Session components are currently integrated into chat feature
// This file provides a dedicated namespace for future session-specific components

// Types
export type { SessionData } from '@/store/slices/sessionsSlice';

// Redux exports for session management
export {
  setSessions,
  addSession,
  updateSession,
  deleteSession,
  setCurrentSession,
  setCreatingSession,
  setDeletingSession,
} from '@/store/slices/sessionsSlice';

// API hooks for session management
export {
  useGetSessionsQuery,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  useDeleteSessionMutation,
  useGetSessionMessagesQuery,
} from '@/store/api/apiSlice';