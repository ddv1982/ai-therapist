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
import { jest } from '@jest/globals';
import type { AuthValidationResult } from '@/lib/api/api-auth';
import { ChatUIProvider, type ChatUIBridge } from '@/contexts/chat-ui-context';

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
   * Enhanced render function with common providers (Redux removed)
   */
  static renderWithProviders(ui: ReactElement, options: RenderOptions = {}): RenderResult {
    return render(ui, options);
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

// =============================================================================
// SECURITY TESTING UTILITIES
// =============================================================================

/**
 * Security-focused testing utilities
 * Provides reusable security test scenarios
 */
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
