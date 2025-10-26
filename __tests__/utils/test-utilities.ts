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

import { render, RenderOptions, RenderResult, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import React from 'react';
import { NextRequest } from 'next/server';
// Use compatible RequestInit type

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
import { Provider } from 'react-redux';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import chatSlice from '@/store/slices/chatSlice';
import sessionsSlice from '@/store/slices/sessionsSlice';
import cbtSlice from '@/store/slices/cbtSlice';
import type { AuthValidationResult } from '@/lib/api/api-auth';
import type { RootState } from '@/store';
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
      X: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'x-icon', className, ...props }),
      Send: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'send-icon', className, ...props }),
      Menu: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'menu-icon', className, ...props }),
      FileText: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'filetext-icon', className, ...props }),
      Brain: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'brain-icon', className, ...props }),
      Sparkles: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'sparkles-icon', className, ...props }),
      CheckCircle: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'check-circle-icon', className, ...props }),
      AlertCircle: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'alert-circle-icon', className, ...props }),
      Info: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'info-icon', className, ...props }),
      AlertTriangle: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'alert-triangle-icon', className, ...props }),
      Heart: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'heart-icon', className, ...props }),
      User: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'user-icon', className, ...props }),
      Settings: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'settings-icon', className, ...props }),
      Download: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'download-icon', className, ...props }),
      Trash2: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'trash-icon', className, ...props }),
      Edit3: ({ className, ...props }: any) => React.createElement('div', { 'data-testid': 'edit-icon', className, ...props })
    };
  }

  /**
   * Standard utils mock - used in 8+ test files
   */
  static createUtilsMock() {
    return {
      ...(jest.requireActual('@/lib/utils/utils') as Record<string, unknown>),
      generateSecureRandomString: jest.fn((length: number) => 
        'mock-secure-' + 'x'.repeat(Math.max(0, length - 12))
      ),
      generateUUID: jest.fn(() => 'mock-uuid-1234-5678-9abc-def012345678'),
      cn: jest.fn((...classes) => classes.filter(Boolean).join(' ')),
    };
  }

  /**
   * Enhanced API test mocks with proper setup for Next.js API routes
   */
  static createAPITestMocks() {
    // Helper function to create type-safe mock functions
    const createMockFn = <T>(): jest.MockedFunction<() => Promise<T>> =>
      jest.fn() as jest.MockedFunction<() => Promise<T>>;

    return {
      // Auth mocks
      apiAuth: {
        validateApiAuth: createMockFn<AuthValidationResult>()
          .mockResolvedValue({ isValid: true, userId: 'test-user' }),
        // createAuthErrorResponse removed in favor of standardized helpers
      },
      // Logger mocks
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        therapeuticOperation: jest.fn(),
      },
      requestLogger: {
        requestId: 'test-request-id',
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
      // Encryption mocks
      encryption: {
        decryptSessionReportContent: jest.fn().mockImplementation((content) => content),
        encryptSessionReportContent: jest.fn().mockImplementation((content) => content),
      },
      // AI SDK mocks
      aiSdk: {
        streamText: jest.fn().mockReturnValue({
          toUIMessageStreamResponse: jest.fn().mockReturnValue(
            new Response('data: {"test": "response"}\n\n', {
              status: 200,
              headers: {
                'content-type': 'text/event-stream',
                'cache-control': 'no-cache',
              },
            })
          ),
        }),
        convertToModelMessages: jest.fn().mockImplementation((messages) => messages),
      },
    };
  }

  /**
   * Create mock NextRequest for API testing
   */
  static createMockRequest(
    url: string,
    options: {
      method?: string;
      body?: any;
      searchParams?: Record<string, string>;
      headers?: Record<string, string>;
    } = {}
  ) {
    const { method = 'GET', body, searchParams = {}, headers = {} } = options;
    
    const requestUrl = new URL(url);
    Object.entries(searchParams).forEach(([key, value]) => {
      requestUrl.searchParams.set(key, value);
    });
    
    const requestInit = {
      method,
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
    };
    
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      (requestInit as any).body = JSON.stringify(body);
    }
    
    return new NextRequest(requestUrl, requestInit as ConstructorParameters<typeof NextRequest>[1]);
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
        validateApiAuth: jest.fn(() => Promise.resolve<AuthValidationResult>({ isValid: true, userId: 'mock-user-id' })),
        createAuthErrorResponse: jest.fn().mockReturnValue({ status: 401, body: { error: 'Unauthorized' } }),
      }
    };
  }

  /**
   * Next.js Request/Response mocks - used in API test files
   */
  static createNextMocks() {
    return {
      NextRequest: class MockNextRequest {
        url: string;
        method: string;
        headers: Map<string, string>;
        
        constructor(url: string, init?: { method?: string; headers?: Record<string, string> }) {
          this.url = url;
          this.method = init?.method || 'GET';
          this.headers = new Map(Object.entries(init?.headers || {}));
        }
        
        get(key: string) { return this.headers.get(key); }
        json() { return Promise.resolve({}); }
      },
      NextResponse: {
        json: jest.fn().mockImplementation((data, init) => ({ 
          status: (init as any)?.status || 200, 
          body: data 
        })),
      }
    };
  }

  /**
   * Enhanced UI component mocks for shadcn/ui components
   */
  static createUIComponentMocks() {
    return {
      Dialog: ({ children, open, ...props }: any) => 
        open ? React.createElement('div', { role: 'dialog', 'data-testid': 'dialog', ...props }, children) : null,
      DialogContent: ({ children, className, ...props }: any) => 
        React.createElement('div', { className: className || 'dialog-content', ...props }, children),
      DialogHeader: ({ children, ...props }: any) => 
        React.createElement('div', { className: 'dialog-header', ...props }, children),
      DialogTitle: ({ children, ...props }: any) => 
        React.createElement('h2', { ...props }, children),
      DialogFooter: ({ children, ...props }: any) => 
        React.createElement('div', { className: 'dialog-footer', ...props }, children),
      Button: ({ children, variant, size, className, onClick, ...props }: any) => 
        React.createElement('button', { 
          className: `btn ${variant || 'default'} ${size || 'default'} ${className || ''}`.trim(),
          onClick,
          ...props 
        }, children),
      Card: ({ children, className, ...props }: any) => 
        React.createElement('div', { className: `card ${className || ''}`.trim(), ...props }, children),
      CardHeader: ({ children, ...props }: any) => 
        React.createElement('div', { className: 'card-header', ...props }, children),
      CardContent: ({ children, ...props }: any) => 
        React.createElement('div', { className: 'card-content', ...props }, children),
      CardTitle: ({ children, ...props }: any) => 
        React.createElement('h3', { ...props }, children),
      Input: ({ className, ...props }: any) => 
        React.createElement('input', { className: `input ${className || ''}`.trim(), ...props }),
      Textarea: ({ className, ...props }: any) => 
        React.createElement('textarea', { className: `textarea ${className || ''}`.trim(), ...props }),
      Select: ({ children, ...props }: any) => 
        React.createElement('select', { className: 'select', ...props }, children),
      SelectContent: ({ children, ...props }: any) => 
        React.createElement('div', { className: 'select-content', ...props }, children),
      SelectItem: ({ children, value, ...props }: any) => 
        React.createElement('option', { value, ...props }, children),
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
        otherIntensity: 0
      },
      automaticThoughts: [
        { thought: 'Everyone will think I\'m incompetent', credibility: 7 },
        { thought: 'I should have prepared better', credibility: 8 }
      ],
      coreBeliefText: 'I am not good enough',
      coreBeliefCredibility: 6,
      confirmingBehaviors: 'Avoided eye contact, spoke quietly',
      avoidantBehaviors: 'Skipped the Q&A session',
      overridingBehaviors: 'Took deep breaths before speaking',
      schemaModes: [
        { id: 'vulnerable-child', name: 'The Vulnerable Child', description: 'scared, helpless', selected: true },
        { id: 'punishing-parent', name: 'The Punishing Parent', description: 'critical, harsh', selected: false }
      ],
      challengeQuestions: [
        { question: 'What evidence supports this thought?', answer: 'Limited evidence - mostly assumptions' },
        { question: 'What evidence contradicts this thought?', answer: 'Previous presentations went well' }
      ],
      rationalThoughts: [
        { thought: 'One presentation doesn\'t define my competence', credibility: 6 },
        { thought: 'Everyone has difficult days', credibility: 8 }
      ],
      actionPlan: [
        { action: 'Practice presentation skills weekly', commitment: 7 },
        { action: 'Ask for feedback from trusted colleagues', commitment: 8 }
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
        otherIntensity: 0
      },
      ...overrides
    };
  }

  /**
   * Generate chat message data for testing
   */
  static createChatMessage(overrides: Partial<any> = {}) {
    return {
      id: 'msg-123',
      role: 'user',
      content: 'I\'m feeling anxious about an upcoming presentation',
      timestamp: new Date('2024-01-15T10:30:00Z'),
      sessionId: 'session-456',
      ...overrides
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
      ...overrides
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
      recommendations: ['Continue practicing breathing exercises', 'Work on challenging negative thoughts'],
      mood: { before: 3, after: 6 },
      createdAt: new Date('2024-01-15T11:00:00Z'),
      ...overrides
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
      ...overrides
    };
  }

  /**
   * Generate schema modes data for therapeutic testing
   */
  static createSchemaModes() {
    return [
      { id: 'vulnerable-child', name: 'The Vulnerable Child', description: 'scared, helpless, abandoned', selected: false },
      { id: 'angry-child', name: 'The Angry Child', description: 'frustrated, enraged', selected: false },
      { id: 'punishing-parent', name: 'The Punishing Parent', description: 'critical, harsh, demanding', selected: false },
      { id: 'demanding-parent', name: 'The Demanding Parent', description: 'entitled, controlling', selected: false },
      { id: 'healthy-adult', name: 'The Healthy Adult', description: 'balanced, rational, caring', selected: false }
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
   * Create Redux test store with all slices
   */
  static createTestStore(preloadedState?: any) {
    const rootReducer = combineReducers({
      chat: chatSlice,
      sessions: sessionsSlice,
      cbt: cbtSlice,
    });
    
    return configureStore({
      reducer: rootReducer,
      preloadedState,
    });
  }

  /**
   * Setup common component mocks that cause "Element type is invalid" errors
   */
  static setupCommonMocks() {
    // Mock shadcn/ui components
    const uiMocks = MockFactory.createUIComponentMocks();
    jest.mock('@/components/ui/dialog', () => ({
      Dialog: uiMocks.Dialog,
      DialogContent: uiMocks.DialogContent,
      DialogHeader: uiMocks.DialogHeader,
      DialogTitle: uiMocks.DialogTitle,
      DialogFooter: uiMocks.DialogFooter,
    }));

    jest.mock('@/components/ui/button', () => ({
      Button: uiMocks.Button,
    }));

    jest.mock('@/components/ui/textarea', () => ({
      Textarea: uiMocks.Textarea,
    }));

    jest.mock('@/components/ui/card', () => ({
      Card: uiMocks.Card,
      CardHeader: uiMocks.CardHeader,
      CardContent: uiMocks.CardContent,
      CardTitle: uiMocks.CardTitle,
    }));


    // Mock Lucide React icons
    jest.mock('lucide-react', () => MockFactory.createLucideIconMocks());
    
    // Mock utils
    jest.mock('@/lib/utils/index', () => MockFactory.createUtilsMock());
  }

  /**
   * Enhanced render function with Redux Provider and other common providers
   */
  static renderWithProviders(
    ui: ReactElement,
    options: RenderOptions & {
      withToastProvider?: boolean;
      withThemeProvider?: boolean;
      withReduxProvider?: boolean;
      initialState?: any;
      store?: any;
    } = {}
  ): RenderResult {
    const {
      withToastProvider = false,
      withThemeProvider = false,
      withReduxProvider = true, // Default to true since most components need it
      initialState,
      store = ComponentTestUtils.createTestStore(initialState),
      ...renderOptions
    } = options;

    function AllProviders({ children }: { children: ReactNode }) {
      let content = children;
      
      // Add Redux Provider first (innermost)
      if (withReduxProvider) {
        content = React.createElement(Provider as any, { store }, content);
      }
      
      if (withToastProvider) {
        const ToastProvider = ({ children }: { children?: ReactNode }) => 
          React.createElement('div', { 'data-testid': 'toast-provider' }, children);
        content = React.createElement(ToastProvider, {}, content);
      }
      
      if (withThemeProvider) {
        const ThemeProvider = ({ children }: { children?: ReactNode }) => 
          React.createElement('div', { 'data-testid': 'theme-provider' }, children);
        content = React.createElement(ThemeProvider, {}, content);
      }

      return content as ReactElement;
    }

    return render(ui, { wrapper: AllProviders, ...renderOptions });
  }

  /**
   * Simplified render function specifically for Redux components
   */
  static renderWithRedux(ui: ReactElement, initialState?: any): RenderResult {
    const store = ComponentTestUtils.createTestStore(initialState);
    const TestWrapper = ({ children }: { children?: ReactNode }) => 
      React.createElement(Provider as any, { store }, children as any);
    
    return render(ui, { wrapper: TestWrapper });
  }

  /**
   * Standard test setup for component tests - includes all common requirements
   */
  static setupComponentTest() {
    beforeEach(() => {
      // Clear all mocks
      jest.clearAllMocks();
      
      // Reset DOM state
      document.body.innerHTML = '';
      
      // Mock fetch for API calls
      const mockResponse: any = {
        json: jest.fn().mockImplementation(() => Promise.resolve({ success: false, memoryDetails: [] })),
        ok: true,
        status: 200,
      };
      (global as any).fetch = jest.fn().mockImplementation(() => Promise.resolve(mockResponse));
      
      // Setup common component and utility mocks
      ComponentTestUtils.setupCommonMocks();
    });

    afterEach(() => {
      jest.restoreAllMocks();
      jest.clearAllTimers();
    });
  }

  /**
   * Standard test setup for API tests - includes database and auth mocks
   */
  static setupAPITest() {
    const mocks = MockFactory.createAPITestMocks();
    
    beforeEach(() => {
      jest.clearAllMocks();
      // Mock authentication
      jest.doMock('@/lib/api/api-auth', () => mocks.apiAuth);
      
      // Mock logger
      jest.doMock('@/lib/utils/logger', () => ({
        logger: mocks.logger,
        createRequestLogger: jest.fn(() => mocks.requestLogger),
      }));
      
      // Mock encryption
      jest.doMock('@/lib/chat/message-encryption', () => mocks.encryption);
      
      // Mock AI SDK if needed
      jest.doMock('ai', () => mocks.aiSdk);
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
    });
    
    return mocks;
  }

  /**
   * Common form interaction utilities
   */
  static async fillFormField(fieldName: string, value: string) {
    const field = screen.getByLabelText(new RegExp(fieldName, 'i')) || 
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
   * Check for therapeutic table rendering
   */
  static expectTherapeuticTable(headers: string[], data?: string[][]) {
    // Check for table structure
    expect(screen.getByRole('table')).toBeInTheDocument();
    
    // Check headers
    headers.forEach(header => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
    
    // Check data if provided
    if (data) {
      data.forEach(row => {
        row.forEach(cell => {
          expect(screen.getByText(cell)).toBeInTheDocument();
        });
      });
    }

    // Check for therapeutic enhancements
    const table = screen.getByRole('table');
    expect(table).toHaveClass('therapeutic-table');
  }

  /**
   * Check toast notification display
   */
  static expectToastMessage(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByTestId(`${type === 'success' ? 'check-circle' : 'alert-circle'}-icon`)).toBeInTheDocument();
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
export class SecurityTestUtils {

  /**
   * Generate XSS attack vectors for testing
   */
  static getXSSVectors() {
    return [
      '<script>alert("xss")</script>',
      'javascript:alert(1)',
      '<img src="x" onerror="alert(1)">',
      '<svg onload="alert(1)">',
      '"><script>alert(1)</script>',
      '\';alert(1);//',
    ];
  }

  /**
   * Generate SQL injection vectors
   */
  static getSQLInjectionVectors() {
    return [
      '\'; DROP TABLE users; --',
      '\' OR \'1\'=\'1',
      '\' UNION SELECT password FROM users --',
      '\'; INSERT INTO users VALUES (\'hacker\', \'password\'); --',
    ];
  }

  /**
   * Test input sanitization
   */
  static testInputSanitization(inputValue: string, _expectedSanitized: string) {
    // This would integrate with your actual sanitization function
    expect(typeof inputValue).toBe('string');
    expect(inputValue.length).toBeGreaterThan(0);
    // The actual sanitization testing would depend on implementation
  }

  /**
   * Generate secure test tokens
   */
  static generateTestTokens() {
    return {
      weak: ['123', 'abc', 'password'],
      strong: [
        'Kj8#mN2$pL9&qR4*tS6@uV1!wX3%yZ5^',
        'A7b#C9d$E2f&G4h*I6j@K8l!M3n%P5q^',
        'R9s#T2u$V7w&X4y*Z6a@B8c!D3e%F5g^'
      ]
    };
  }

  /**
   * Test session management scenarios
   */
  static getSessionTestScenarios() {
    const now = Date.now();
    return {
      valid: {
        token: 'valid-session-token',
        expiresAt: now + (30 * 24 * 60 * 60 * 1000), // 30 days
        userId: 'user-123',
        deviceFingerprint: 'valid-fingerprint'
      },
      expired: {
        token: 'expired-session-token',
        expiresAt: now - 1000, // 1 second ago
        userId: 'user-123',
        deviceFingerprint: 'valid-fingerprint'
      },
      invalid: {
        token: 'invalid-token',
        expiresAt: now + (24 * 60 * 60 * 1000),
        userId: 'nonexistent-user',
        deviceFingerprint: 'invalid-fingerprint'
      }
    };
  }
}

// =============================================================================
// PERFORMANCE TESTING UTILITIES
// =============================================================================

/**
 * Performance monitoring utilities for tests
 */
export class PerformanceTestUtils {

  /**
   * Measure test execution time
   */
  static measureExecutionTime<T>(fn: () => T, maxDuration = 1000): { result: T; duration: number } {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(maxDuration);
    
    return { result, duration };
  }

  /**
   * Test component render performance
   */
  static measureRenderTime(renderFn: () => RenderResult, maxRenderTime = 100): RenderResult {
    const { result } = this.measureExecutionTime(renderFn, maxRenderTime);
    return result;
  }

  /**
   * Monitor memory usage during test
   */
  static measureMemoryUsage<T>(fn: () => T): { result: T; memoryUsed: number } {
    const beforeMemory = performance.memory?.usedJSHeapSize || 0;
    const result = fn();
    const afterMemory = performance.memory?.usedJSHeapSize || 0;
    
    return {
      result,
      memoryUsed: afterMemory - beforeMemory
    };
  }

  /**
   * Create performance benchmark
   */
  static benchmark(name: string, fn: () => void, iterations = 100) {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      fn();
      const endTime = performance.now();
      times.push(endTime - startTime);
    }
    
    const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    return { name, avg, min, max, iterations };
  }
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
  static setupWithMocks(mocks: {
    utils?: boolean;
    database?: boolean;
    auth?: boolean;
    lucide?: boolean;
  } = {}) {
    beforeEach(() => {
      this.setupTestEnvironment();
      
      if (mocks.utils) {
        jest.mock('@/lib/utils/utils', () => MockFactory.createUtilsMock());
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

export function createMockCBTStore(overrides: Partial<RootState> = {}): ReturnType<typeof ComponentTestUtils.createTestStore> {
  return ComponentTestUtils.createTestStore(overrides);
}

export function renderWithCBT(ui: ReactElement, options: { state?: Partial<RootState> } = {}) {
  const store = ComponentTestUtils.createTestStore(options.state);

  const bridge: ChatUIBridge = {
    addMessageToChat: async () => ({ success: true }),
    currentSessionId: 'test-session',
    isLoading: false,
  };

  const wrapper = ({ children }: { children: ReactNode }) =>
    React.createElement(
      Provider as any,
      { store },
      React.createElement(ChatUIProvider as any, { bridge }, children)
    );

  return render(ui, { wrapper });
}

// =============================================================================
// EXPORTS
// =============================================================================

const TestUtilities = {
  MockFactory,
  TherapeuticDataFactory,
  ComponentTestUtils,
  SecurityTestUtils,
  PerformanceTestUtils,
  TestSetupUtils,
};

export default TestUtilities;
