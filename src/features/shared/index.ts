// Shared feature utilities and components
// Common functionality used across multiple features

// Theme utilities
export { ThemeToggle } from '@/components/shared/theme-toggle';

// Error handling
export { ErrorBoundary as ChatErrorBoundary, withErrorBoundary } from '@/components/ui/error-boundary';
export { SuspenseChat, SuspenseChatConnection, SuspenseChatMessages } from '@/components/chat/suspense-chat';

// Layout components
export { ErrorBoundary } from '@/components/layout/error-boundary';
export { MobileDebugInfo } from '@/components/layout/mobile-debug-info';

// UI utilities
export { CommandPalette, useCommandPalette } from '@/components/ui/command-palette';
export { TherapeuticTable, useTherapeuticTableStyles } from '@/components/ui/therapeutic-table';
export { MobileCBTSheet } from '@/components/ui/mobile-cbt-sheet';

// Hook utilities
export { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';

// useCBTForm removed - replaced by useUnifiedCBT