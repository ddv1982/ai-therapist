// Shared feature utilities and components
// Common functionality used across multiple features

// Error handling
export {
  ErrorBoundary as ChatErrorBoundary,
  withErrorBoundary,
} from '@/components/ui/error-boundary';
export {
  SuspenseChat,
  SuspenseChatConnection,
  SuspenseChatMessages,
} from '@/components/chat/suspense-chat';

// Layout components
export { ErrorBoundary } from '@/components/ui/error-boundary';
export { MobileDebugInfo } from '@/components/layout/mobile-debug-info';

// UI utilities
export { CommandPalette, useCommandPalette } from '@/components/ui/command-palette';
export { TherapeuticTable, useTherapeuticTableStyles } from '@/components/ui/therapeutic-table';
export { MobileCBTSheet } from '@/features/therapy/components/mobile-cbt-sheet';

// Hook utilities
export { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';

// useCBTForm removed - replaced by useUnifiedCBT
