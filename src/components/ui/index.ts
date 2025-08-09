/**
 * UI Components Domain - Master Exports
 * Centralized exports for all UI components
 */

// Re-export all UI categories
export * as primitives from './primitives';
export * as enhanced from './enhanced';
export * as layout from './layout';

// Direct exports for commonly used components
export * from './primitives';
export * from './enhanced';
export * from './layout';

// Backward compatible exports for easier migration
// These allow imports like '@/components/ui/button' to still work
export { Button } from './primitives/button';
export { Card, CardContent, CardDescription, CardHeader, CardTitle } from './primitives/card';
export { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './primitives/dialog';
export { Input } from './primitives/input';
export { ScrollArea } from './primitives/scroll-area';
export { Skeleton } from './primitives/skeleton';
export { Textarea } from './primitives/textarea';
export type { Toast } from './primitives/toast';
export { ToastProvider, useToast } from './primitives/toast';

// Enhanced components
export { ShimmerButton } from './enhanced/shimmer-button';
export { ThemeToggle } from './enhanced/theme-toggle';

// Layout components  
export { ErrorBoundary } from './layout/error-boundary';
export { MobileDebugInfo } from './layout/mobile-debug-info';