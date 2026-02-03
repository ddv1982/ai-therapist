/**
 * Unified Test Utilities for Therapeutic AI Application
 * Provides consistent utilities, mocking, and fixtures across all test files
 *
 * This utility consolidates 23+ identified duplicate patterns:
 * - Mock setup/teardown patterns
 * - Therapeutic data fixtures
 * - Component rendering utilities
 * - Security testing scenarios
 * - Performance monitoring helpers
 */

import * as React from 'react';
import {
  render,
  renderHook,
  RenderOptions,
  RenderResult,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
// Extend Performance interface for Chrome's memory API
declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}
import type { AuthValidationResult } from '@/lib/api/api-auth';
import { ChatUIProvider, type ChatUIBridge } from '@/contexts/chat-ui-context';
import type { logger as AppLogger } from '@/lib/utils/logger';

// =============================================================================
// CONTEXT PROVIDER IMPORTS FOR TEST PROVIDERS
// =============================================================================

import { ToastProvider, useToast, type Toast } from '@/components/ui/toast';
import { ChatSettingsProvider } from '@/contexts/chat-settings-context';
import { CBTProvider } from '@/contexts/cbt-context';
import { SessionProvider } from '@/contexts/session-context';

// =============================================================================
// MOCK FACTORIES AND CONFIGURATIONS
// =============================================================================

/**
 * Unified mock configuration for commonly mocked modules
 * Eliminates duplicate mock setups across 41 test files
 */
export class MockFactory {
  /**
   * Standard Lucide React icon mocks - used in 12+ test files
   */
  static createLucideIconMocks() {
    return {
      X: ({ className, ...props }: any) =>
        React.createElement('div', { 'data-testid': 'x-icon', className, ...props }),
      Send: ({ className, ...props }: any) =>
        React.createElement('div', { 'data-testid': 'send-icon', className, ...props }),
      Menu: ({ className, ...props }: any) =>
        React.createElement('div', { 'data-testid': 'menu-icon', className, ...props }),
      FileText: ({ className, ...props }: any) =>
        React.createElement('div', { 'data-testid': 'filetext-icon', className, ...props }),
      Calendar: ({ className, ...props }: any) =>
        React.createElement('div', { 'data-testid': 'calendar-icon', className, ...props }),
      ArrowRight: ({ className, ...props }: any) =>
        React.createElement('div', { 'data-testid': 'arrow-right-icon', className, ...props }),
      Brain: ({ className, ...props }: any) =>
        React.createElement('div', { 'data-testid': 'brain-icon', className, ...props }),
      Sparkles: ({ className, ...props }: any) =>
        React.createElement('div', { 'data-testid': 'sparkles-icon', className, ...props }),
      CheckCircle: ({ className, ...props }: any) =>
        React.createElement('div', { 'data-testid': 'check-circle-icon', className, ...props }),
      AlertCircle: ({ className, ...props }: any) =>
        React.createElement('div', { 'data-testid': 'alert-circle-icon', className, ...props }),
      Info: ({ className, ...props }: any) =>
        React.createElement('div', { 'data-testid': 'info-icon', className, ...props }),
      AlertTriangle: ({ className, ...props }: any) =>
        React.createElement('div', { 'data-testid': 'alert-triangle-icon', className, ...props }),
      Heart: ({ className, ...props }: any) =>
        React.createElement('div', { 'data-testid': 'heart-icon', className, ...props }),
      User: ({ className, ...props }: any) =>
        React.createElement('div', { 'data-testid': 'user-icon', className, ...props }),
      Settings: ({ className, ...props }: any) =>
        React.createElement('div', { 'data-testid': 'settings-icon', className, ...props }),
      Download: ({ className, ...props }: any) =>
        React.createElement('div', { 'data-testid': 'download-icon', className, ...props }),
      Trash2: ({ className, ...props }: any) =>
        React.createElement('div', { 'data-testid': 'trash-icon', className, ...props }),
      Edit3: ({ className, ...props }: any) =>
        React.createElement('div', { 'data-testid': 'edit-icon', className, ...props }),
    };
  }

  /**
   * Standard utils mock - used in 8+ test files
   */
  static createUtilsMock() {
    return {
      ...(jest.requireActual('@/lib/utils/helpers') as Record<string, unknown>),
      generateSecureRandomString: jest.fn(
        (length: number) => 'mock-secure-' + 'x'.repeat(Math.max(0, length - 12))
      ),
      generateUUID: jest.fn(() => 'mock-uuid-1234-5678-9abc-def012345678'),
      cn: jest.fn((...classes) => classes.filter(Boolean).join(' ')),
    };
  }

  /**
   * Authentication service mocks - used in 10+ test files
   */
  static createAuthMocks() {
    return {
      totpService: {
        generateSecret: jest.fn().mockReturnValue('mock-totp-secret'),
        generateQRCode: jest.fn().mockReturnValue('data:image/png;base64,mock-qr-code'),
        generateBackupCodes: jest.fn().mockReturnValue(['code1', 'code2', 'code3']),
        verifyToken: jest.fn().mockReturnValue(true),
      },
      deviceFingerprint: {
        generateBasicDeviceFingerprint: jest.fn().mockReturnValue('mock-fingerprint-hash'),
        generateDeviceFingerprint: jest.fn().mockReturnValue('mock-enhanced-fingerprint'),
        generateDeviceName: jest.fn().mockReturnValue('Mock Device Browser'),
      },
      apiAuth: {
        validateApiAuth: jest.fn(() =>
          Promise.resolve<AuthValidationResult>({ isValid: true, userId: 'mock-user-id' })
        ),
        createAuthErrorResponse: jest
          .fn()
          .mockReturnValue({ status: 401, body: { error: 'Unauthorized' } }),
      },
    };
  }
}

// =============================================================================
// THERAPEUTIC DATA FIXTURES
// =============================================================================

/**
 * Comprehensive therapeutic test data factory
 * Provides realistic CBT, session, and therapeutic data for testing
 */
export class TherapeuticDataFactory {
  /**
   * Generate realistic CBT diary form data
   */
  static createCBTDiaryData(overrides: Partial<any> = {}) {
    return {
      date: '2024-01-15',
      situation: 'Had a difficult presentation at work today',
      initialEmotions: {
        fear: 6,
        anger: 2,
        sadness: 4,
        joy: 1,
        anxiety: 8,
        shame: 3,
        guilt: 2,
        other: '',
        otherIntensity: 0,
      },
      automaticThoughts: [
        { thought: "Everyone will think I'm incompetent", credibility: 7 },
        { thought: 'I should have prepared better', credibility: 8 },
      ],
      coreBeliefText: 'I am not good enough',
      coreBeliefCredibility: 6,
      confirmingBehaviors: 'Avoided eye contact, spoke quietly',
      avoidantBehaviors: 'Skipped the Q&A session',
      overridingBehaviors: 'Took deep breaths before speaking',
      schemaModes: [
        {
          id: 'vulnerable-child',
          name: 'The Vulnerable Child',
          description: 'scared, helpless',
          selected: true,
        },
        {
          id: 'punishing-parent',
          name: 'The Punishing Parent',
          description: 'critical, harsh',
          selected: false,
        },
      ],
      challengeQuestions: [
        {
          question: 'What evidence supports this thought?',
          answer: 'Limited evidence - mostly assumptions',
        },
        {
          question: 'What evidence contradicts this thought?',
          answer: 'Previous presentations went well',
        },
      ],
      rationalThoughts: [
        { thought: "One presentation doesn't define my competence", credibility: 6 },
        { thought: 'Everyone has difficult days', credibility: 8 },
      ],
      actionPlan: [
        { action: 'Practice presentation skills weekly', commitment: 7 },
        { action: 'Ask for feedback from trusted colleagues', commitment: 8 },
      ],
      finalEmotions: {
        fear: 3,
        anger: 1,
        sadness: 2,
        joy: 4,
        anxiety: 4,
        shame: 1,
        guilt: 1,
        other: '',
        otherIntensity: 0,
      },
      ...overrides,
    };
  }

  /**
   * Generate chat message data for testing
   */
  static createChatMessage(overrides: Partial<any> = {}) {
    return {
      id: 'msg-123',
      role: 'user',
      content: "I'm feeling anxious about an upcoming presentation",
      timestamp: new Date('2024-01-15T10:30:00Z'),
      sessionId: 'session-456',
      ...overrides,
    };
  }

  /**
   * Generate assistant message with therapeutic response
   */
  static createAssistantMessage(overrides: Partial<any> = {}) {
    return {
      id: 'msg-124',
      role: 'assistant',
      content: `I understand you're feeling anxious about your presentation. Let's work through this together.

**Common presentation anxiety triggers:**
- Fear of judgment
- Perfectionism 
- Past negative experiences

| Coping Strategy | Effectiveness | Time Required |
|----------------|---------------|---------------|
| Deep breathing | High | 2-3 minutes |
| Positive self-talk | Medium | 5 minutes |
| Practice visualization | High | 10-15 minutes |

Would you like to explore what specifically concerns you about this presentation?`,
      timestamp: new Date('2024-01-15T10:31:00Z'),
      sessionId: 'session-456',
      modelUsed: 'openai/gpt-oss-20b',
      ...overrides,
    };
  }

  /**
   * Generate session report data
   */
  static createSessionReport(overrides: Partial<any> = {}) {
    return {
      id: 'report-789',
      sessionId: 'session-456',
      userId: 'user-123',
      summary: 'Session focused on presentation anxiety and coping strategies',
      keyInsights: ['Client experiences performance anxiety', 'Responds well to CBT techniques'],
      recommendations: [
        'Continue practicing breathing exercises',
        'Work on challenging negative thoughts',
      ],
      mood: { before: 3, after: 6 },
      createdAt: new Date('2024-01-15T11:00:00Z'),
      ...overrides,
    };
  }

  /**
   * Generate user profile data
   */
  static createUserProfile(overrides: Partial<any> = {}) {
    return {
      id: 'user-123',
      email: 'test.user@example.com',
      name: 'Test User',
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en',
      },
      createdAt: new Date('2024-01-01T00:00:00Z'),
      lastActive: new Date('2024-01-15T10:30:00Z'),
      ...overrides,
    };
  }

  /**
   * Generate schema modes data for therapeutic testing
   */
  static createSchemaModes() {
    return [
      {
        id: 'vulnerable-child',
        name: 'The Vulnerable Child',
        description: 'scared, helpless, abandoned',
        selected: false,
      },
      {
        id: 'angry-child',
        name: 'The Angry Child',
        description: 'frustrated, enraged',
        selected: false,
      },
      {
        id: 'punishing-parent',
        name: 'The Punishing Parent',
        description: 'critical, harsh, demanding',
        selected: false,
      },
      {
        id: 'demanding-parent',
        name: 'The Demanding Parent',
        description: 'entitled, controlling',
        selected: false,
      },
      {
        id: 'healthy-adult',
        name: 'The Healthy Adult',
        description: 'balanced, rational, caring',
        selected: false,
      },
    ];
  }
}

// =============================================================================
// COMPONENT TESTING UTILITIES
// =============================================================================

/**
 * Enhanced React Testing Library utilities
 * Provides therapeutic-specific testing helpers
 */
export class ComponentTestUtils {
  /**
   * Enhanced render function with all required context providers.
   *
   * This method wraps the component with TestProviders which includes:
   * - ToastProvider
   * - ChatSettingsProvider
   * - CBTProvider
   * - SessionProvider
   *
   * Use this when testing components that depend on context hooks.
   *
   * @param ui - The React element to render
   * @param options - Optional render options
   * @returns The render result with all provider contexts available
   *
   * @example
   * import { ComponentTestUtils } from '@tests/utils/test-utilities';
   * import { CBTForm } from '@/features/therapy/cbt/cbt-form';
   *
   * const { getByTestId } = ComponentTestUtils.renderWithProviders(<CBTForm />);
   * expect(getByTestId('cbt-form')).toBeInTheDocument();
   *
   * @deprecated Consider using the standalone `renderWithProviders` function for new tests
   */
  static renderWithProviders(ui: ReactElement, options: RenderOptions = {}): RenderResult {
    return renderWithProviders(ui, options);
  }

  /**
   * Common form interaction utilities
   */
  static async fillFormField(fieldName: string, value: string) {
    const field =
      screen.getByLabelText(new RegExp(fieldName, 'i')) ||
      screen.getByRole('textbox', { name: new RegExp(fieldName, 'i') }) ||
      screen.getByTestId(fieldName);

    fireEvent.change(field, { target: { value } });
    await waitFor(() => {
      expect(field).toHaveValue(value);
    });
  }

  /**
   * Submit form and wait for completion
   */
  static async submitForm(formTestId = 'form') {
    const form = screen.getByTestId(formTestId);
    fireEvent.submit(form);

    await waitFor(() => {
      // Form should either show success or update state
      expect(form).toBeInTheDocument();
    });
  }

  /**
   * Check toast notification display
   */
  static expectToastMessage(
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'success'
  ) {
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(
      screen.getByTestId(`${type === 'success' ? 'check-circle' : 'alert-circle'}-icon`)
    ).toBeInTheDocument();
  }

  /**
   * Check modal dialog behavior
   */
  static expectModalDialog(title?: string, isOpen = true) {
    if (isOpen) {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      if (title) {
        expect(screen.getByText(title)).toBeInTheDocument();
      }
    } else {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    }
  }
}

type ToastInput = Omit<Toast, 'id'>;

interface ToastHarnessProps {
  includePersistent?: boolean;
  includeCustomDuration?: boolean;
  includeRemove?: boolean;
  onShow?: (toast: ToastInput) => void;
  onRemove?: (id: string) => void;
}

export function ToastTestHarness({
  includePersistent = true,
  includeCustomDuration = true,
  includeRemove = true,
  onShow,
  onRemove,
}: ToastHarnessProps) {
  const { showToast, removeToast, toasts } = useToast();

  const handleShow = (toast: ToastInput) => {
    onShow?.(toast);
    showToast(toast);
  };

  const handleRemove = () => {
    const targetId = toasts[0]?.id;
    if (!targetId) return;
    onRemove?.(targetId);
    removeToast(targetId);
  };

  return React.createElement(
    'div',
    null,
    React.createElement(
      'button',
      {
        'data-testid': 'show-success',
        onClick: () => handleShow({ type: 'success', message: 'Success message!' }),
      },
      'Show Success'
    ),
    React.createElement(
      'button',
      {
        'data-testid': 'show-error',
        onClick: () =>
          handleShow({ type: 'error', message: 'Error message!', title: 'Error Title' }),
      },
      'Show Error'
    ),
    React.createElement(
      'button',
      {
        'data-testid': 'show-warning',
        onClick: () => handleShow({ type: 'warning', message: 'Warning message!' }),
      },
      'Show Warning'
    ),
    React.createElement(
      'button',
      {
        'data-testid': 'show-info',
        onClick: () => handleShow({ type: 'info', message: 'Info message!' }),
      },
      'Show Info'
    ),
    includePersistent
      ? React.createElement(
          'button',
          {
            'data-testid': 'show-persistent',
            onClick: () =>
              handleShow({ type: 'info', message: 'Persistent message!', duration: 0 }),
          },
          'Show Persistent'
        )
      : null,
    includeCustomDuration
      ? React.createElement(
          'button',
          {
            'data-testid': 'show-custom-duration',
            onClick: () =>
              handleShow({ type: 'success', message: 'Custom duration!', duration: 1000 }),
          },
          'Show Custom Duration'
        )
      : null,
    includeRemove
      ? React.createElement(
          'button',
          { 'data-testid': 'remove-toast', onClick: handleRemove },
          'Remove First Toast'
        )
      : null,
    React.createElement('div', { 'data-testid': 'toast-count' }, toasts.length)
  );
}

// =============================================================================
// SECURITY TESTING UTILITIES
// =============================================================================

/**
 * Security-focused testing utilities
 * Provides reusable security test scenarios
 */
// =============================================================================
// TEST PROVIDERS WRAPPER
// =============================================================================

/**
 * Props for the TestProviders component
 */
interface TestProvidersProps {
  /** Child components to be wrapped by providers */
  children: ReactNode;
}

/**
 * Unified test providers wrapper component.
 *
 * Combines all required context providers for testing hooks and components that depend on:
 * - ToastProvider (useToast hook)
 * - ChatSettingsProvider (useChatSettings hook)
 * - CBTProvider (useCBT hook)
 * - SessionProvider (useSession hook)
 *
 * Provider nesting order (outer to inner):
 * 1. ToastProvider - no dependencies
 * 2. ChatSettingsProvider - no dependencies
 * 3. CBTProvider - no dependencies
 * 4. SessionProvider - depends on @ai-sdk/rsc (mocked in test environment)
 *
 * @example
 * // Using with renderHook
 * const { result } = renderHook(() => useCBT(), { wrapper: TestProviders });
 *
 * @example
 * // Using with render
 * const { getByTestId } = render(<CBTForm />, { wrapper: TestProviders });
 */
function TestProviders({ children }: TestProvidersProps) {
  // Using React.createElement instead of JSX because this is a .ts file
  return React.createElement(
    ToastProvider,
    null,
    React.createElement(
      ChatSettingsProvider,
      null,
      React.createElement(CBTProvider, null, React.createElement(SessionProvider, null, children))
    )
  );
}

// =============================================================================
// RENDER UTILITIES WITH PROVIDERS
// =============================================================================

/**
 * Render a hook with all context providers automatically wrapped.
 *
 * Convenience wrapper around React Testing Library's `renderHook` that automatically
 * uses the `TestProviders` wrapper. Use this when testing hooks that depend on
 * context providers like useToast, useChatSettings, useCBT, or useSession.
 *
 * @param hook - The hook function to test
 * @param options - Optional renderHook options (excluding 'wrapper')
 * @returns The renderHook result with all provider contexts available
 *
 * @example
 * import { renderHookWithProviders } from '@tests/utils/test-utilities';
 * import { useCBT } from '@/contexts/cbt-context';
 *
 * const { result } = renderHookWithProviders(() => useCBT());
 * expect(result.current.currentStep).toBe(1);
 */
export function renderHookWithProviders<T>(
  hook: () => T,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return renderHook(hook, {
    wrapper: TestProviders,
    ...options,
  });
}

/**
 * Render a React element with all context providers automatically wrapped.
 *
 * Convenience wrapper around React Testing Library's `render` that automatically
 * uses the `TestProviders` wrapper. Use this when testing components that depend on
 * context hooks like useToast, useChatSettings, useCBT, or useSession.
 *
 * @param ui - The React element to render
 * @param options - Optional render options (excluding 'wrapper')
 * @returns The render result with all provider contexts available
 *
 * @example
 * import { renderWithProviders } from '@tests/utils/test-utilities';
 * import { CBTForm } from '@/features/therapy/cbt/cbt-form';
 *
 * const { getByTestId } = renderWithProviders(<CBTForm />);
 * expect(getByTestId('cbt-form')).toBeInTheDocument();
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(ui, {
    wrapper: TestProviders,
    ...options,
  });
}

// =============================================================================
// TEST SETUP AND TEARDOWN UTILITIES
// =============================================================================

/**
 * Standardized test setup and teardown
 * Eliminates duplicate beforeEach/afterEach patterns
 */
export class TestSetupUtils {
  /**
   * Standard test environment setup
   */
  static setupTestEnvironment() {
    beforeEach(() => {
      // Clear all mocks
      jest.clearAllMocks();

      // Reset DOM state
      document.body.innerHTML = '';

      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();

      // Reset console methods - check if already spied
      try {
        if (!jest.isMockFunction(console.warn)) {
          jest.spyOn(console, 'warn').mockImplementation(() => {});
        } else {
          (console.warn as jest.Mock).mockImplementation(() => {});
        }

        if (!jest.isMockFunction(console.error)) {
          jest.spyOn(console, 'error').mockImplementation(() => {});
        } else {
          (console.error as jest.Mock).mockImplementation(() => {});
        }
      } catch {
        // Console methods already mocked, ignore
      }
    });

    afterEach(() => {
      // Restore console methods
      jest.restoreAllMocks();

      // Clear any pending timers
      jest.clearAllTimers();
    });
  }

  /**
   * Setup with specific mocks
   */
  static setupWithMocks(
    mocks: {
      utils?: boolean;
      database?: boolean;
      auth?: boolean;
      lucide?: boolean;
    } = {}
  ) {
    beforeEach(() => {
      this.setupTestEnvironment();

      if (mocks.utils) {
        jest.mock('@/lib/utils/helpers', () => MockFactory.createUtilsMock());
      }

      if (mocks.auth) {
        const authMocks = MockFactory.createAuthMocks();
        // Note: TOTP service removed, using Clerk for authentication instead
        jest.mock('@/lib/auth/device-fingerprint', () => authMocks.deviceFingerprint);
        jest.mock('@/lib/api/api-auth', () => authMocks.apiAuth);
      }

      if (mocks.lucide) {
        jest.mock('lucide-react', () => MockFactory.createLucideIconMocks());
      }
    });
  }

  /**
   * Create test timeout utility
   */
  static withTimeout(timeout = 10000) {
    beforeEach(() => {
      jest.setTimeout(timeout);
    });
  }
}

type LoggerLike = typeof AppLogger;

export function setupLoggerSpies(target: LoggerLike, options: { includeApiError?: boolean } = {}) {
  jest.spyOn(target, 'info').mockImplementation(() => {});
  jest.spyOn(target, 'warn').mockImplementation(() => {});
  jest.spyOn(target, 'error').mockImplementation(() => {});
  jest.spyOn(target, 'debug').mockImplementation(() => {});

  if (options.includeApiError) {
    jest.spyOn(target, 'apiError').mockImplementation(() => {});
  }
}

export function setTestNodeEnv(nodeEnv: string, reload?: () => void) {
  const mutableEnv = process.env as Record<string, string | undefined>;
  const original = mutableEnv.NODE_ENV;
  mutableEnv.NODE_ENV = nodeEnv;
  reload?.();

  return () => {
    mutableEnv.NODE_ENV = original;
    reload?.();
  };
}

/**
 * Render with CBT context (Redux removed, using ChatUIProvider only)
 */
export function renderWithCBT(ui: ReactElement, _options: { state?: any } = {}) {
  const bridge: ChatUIBridge = {
    addMessageToChat: async () => ({ success: true }),
    currentSessionId: 'test-session',
    isLoading: false,
  };

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(ChatUIProvider as any, { bridge }, children);

  return render(ui, { wrapper });
}
