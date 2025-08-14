/**
 * Components Domain - Master Exports
 * Updated for feature-based organization
 */

// Feature-based exports (new structure)
export * as features from '@/features';

// Core component exports
export * as ui from './ui';
export * as providers from './providers';
export * as layout from './layout';
export * as shared from './shared';

// Direct UI exports for convenience
export * from './ui';
export * from './layout';

// Shared components (selective exports to avoid conflicts)
export { ShimmerButton } from './shared/shimmer-button';
export { ThemeToggle } from './shared/theme-toggle';

// Provider components
export * from './providers';

// Backward compatibility aliases - redirect to new feature locations
// NOTE: Use direct feature imports for new code
export { AuthGuard } from '@/features/auth/components/auth-guard';
export { SecuritySettings } from '@/features/auth/components/security-settings';
export { ChatInterface } from '@/features/chat/components/chat-interface';
export { SessionControls } from '@/features/chat/components/session-controls';
export { SessionSidebar } from '@/features/chat/components/session-sidebar';
export { CBTDiaryModal } from '@/features/therapy/cbt/cbt-diary-modal';
export { MemoryManagementModal } from '@/features/therapy/memory/memory-management-modal';