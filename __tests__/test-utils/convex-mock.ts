/**
 * Convex Mock Utilities
 *
 * Provides typed mocking utilities for Convex queries and mutations
 * to enable comprehensive testing of Convex-dependent code.
 *
 * @example
 * ```typescript
 * const { mockQuery, mockMutation, setupConvexMock, verifyMutations } = setupConvexMock();
 *
 * // Set up query responses
 * mockQuery.mockResolvedValueOnce({ _id: 'user123', email: 'test@test.com' });
 *
 * // Run your code
 * await myFunctionThatUsesConvex();
 *
 * // Verify mutations were called correctly
 * verifyMutations('sessions.create', { title: 'Test Session' });
 * ```
 */

/**
 * Mock query function type
 */
export type MockQueryFn = jest.Mock<Promise<unknown>, [string, unknown?]>;

/**
 * Mock mutation function type
 */
export type MockMutationFn = jest.Mock<Promise<unknown>, [string, unknown?]>;

/**
 * Tracked mutation call for assertions
 */
export interface TrackedMutation {
  api: string;
  args: unknown;
  timestamp: number;
}

/**
 * Tracked query call for assertions
 */
export interface TrackedQuery {
  api: string;
  args: unknown;
  timestamp: number;
}

/**
 * Mock Convex client configuration
 */
export interface ConvexMockOptions {
  /** Enable detailed logging of all calls */
  debug?: boolean;
  /** Default delay for query/mutation responses (ms) */
  defaultDelay?: number;
}

/**
 * Mock Convex client interface
 */
export interface MockConvexClient {
  query: MockQueryFn;
  mutation: MockMutationFn;
  setAuth: jest.Mock<void, [string]>;
}

/**
 * Convex mock setup result
 */
export interface ConvexMockSetup {
  /** Mock query function */
  mockQuery: MockQueryFn;
  /** Mock mutation function */
  mockMutation: MockMutationFn;
  /** Mock Convex HTTP client */
  mockClient: MockConvexClient;
  /** Clear all mocks and tracked calls */
  reset: () => void;
  /** Get tracked mutation calls */
  getTrackedMutations: () => TrackedMutation[];
  /** Get tracked query calls */
  getTrackedQueries: () => TrackedQuery[];
  /** Verify a specific mutation was called */
  verifyMutation: (api: string, expectedArgs?: unknown) => void;
  /** Verify a specific query was called */
  verifyQuery: (api: string, expectedArgs?: unknown) => void;
  /** Verify no mutations were called */
  verifyNoMutations: () => void;
  /** Verify mutation call count */
  verifyMutationCount: (count: number) => void;
}

/**
 * Creates a mock Convex client with tracking capabilities
 *
 * @param options - Configuration options
 * @returns Mock setup with query/mutation tracking
 *
 * @example
 * ```typescript
 * describe('MyConvexService', () => {
 *   let convexMock: ConvexMockSetup;
 *
 *   beforeEach(() => {
 *     convexMock = setupConvexMock();
 *   });
 *
 *   afterEach(() => {
 *     convexMock.reset();
 *   });
 *
 *   it('creates a session', async () => {
 *     convexMock.mockMutation.mockResolvedValueOnce('session-123');
 *
 *     await createSession(convexMock.mockClient);
 *
 *     convexMock.verifyMutation('sessions.create');
 *   });
 * });
 * ```
 */
export function setupConvexMock(options: ConvexMockOptions = {}): ConvexMockSetup {
  const { debug = false } = options;

  const trackedMutations: TrackedMutation[] = [];
  const trackedQueries: TrackedQuery[] = [];

  const mockQuery: MockQueryFn = jest.fn().mockImplementation((api: string, args?: unknown) => {
    const tracked: TrackedQuery = { api, args, timestamp: Date.now() };
    trackedQueries.push(tracked);

    if (debug) {
      console.log('[ConvexMock] Query:', api, args);
    }

    return Promise.resolve(null);
  });

  const mockMutation: MockMutationFn = jest
    .fn()
    .mockImplementation((api: string, args?: unknown) => {
      const tracked: TrackedMutation = { api, args, timestamp: Date.now() };
      trackedMutations.push(tracked);

      if (debug) {
        console.log('[ConvexMock] Mutation:', api, args);
      }

      return Promise.resolve(null);
    });

  const mockSetAuth = jest.fn<void, [string]>();

  const mockClient: MockConvexClient = {
    query: mockQuery,
    mutation: mockMutation,
    setAuth: mockSetAuth,
  };

  const reset = (): void => {
    mockQuery.mockClear();
    mockMutation.mockClear();
    mockSetAuth.mockClear();
    trackedMutations.length = 0;
    trackedQueries.length = 0;
  };

  const getTrackedMutations = (): TrackedMutation[] => [...trackedMutations];
  const getTrackedQueries = (): TrackedQuery[] => [...trackedQueries];

  const verifyMutation = (api: string, expectedArgs?: unknown): void => {
    const calls = trackedMutations.filter((m) => m.api === api);
    expect(calls.length).toBeGreaterThan(0);

    if (expectedArgs !== undefined) {
      const matchingCall = calls.find(
        (call) => JSON.stringify(call.args) === JSON.stringify(expectedArgs)
      );
      expect(matchingCall).toBeDefined();
    }
  };

  const verifyQuery = (api: string, expectedArgs?: unknown): void => {
    const calls = trackedQueries.filter((q) => q.api === api);
    expect(calls.length).toBeGreaterThan(0);

    if (expectedArgs !== undefined) {
      const matchingCall = calls.find(
        (call) => JSON.stringify(call.args) === JSON.stringify(expectedArgs)
      );
      expect(matchingCall).toBeDefined();
    }
  };

  const verifyNoMutations = (): void => {
    expect(trackedMutations.length).toBe(0);
  };

  const verifyMutationCount = (count: number): void => {
    expect(trackedMutations.length).toBe(count);
  };

  return {
    mockQuery,
    mockMutation,
    mockClient,
    reset,
    getTrackedMutations,
    getTrackedQueries,
    verifyMutation,
    verifyQuery,
    verifyNoMutations,
    verifyMutationCount,
  };
}

/**
 * Creates typed mock responses for common Convex queries
 */
export const createMockResponses = {
  /**
   * Create a mock user document
   */
  user: (overrides: Partial<MockUserDoc> = {}): MockUserDoc => ({
    _id: 'user-123' as unknown as string,
    _creationTime: Date.now(),
    clerkId: 'clerk-123',
    email: 'test@example.com',
    ...overrides,
  }),

  /**
   * Create a mock session document
   */
  session: (overrides: Partial<MockSessionDoc> = {}): MockSessionDoc => ({
    _id: 'session-123' as unknown as string,
    _creationTime: Date.now(),
    userId: 'user-123' as unknown as string,
    title: 'Test Session',
    startedAt: Date.now(),
    lastMessageAt: Date.now(),
    messageCount: 0,
    ...overrides,
  }),

  /**
   * Create a mock message document
   */
  message: (overrides: Partial<MockMessageDoc> = {}): MockMessageDoc => ({
    _id: 'msg-123' as unknown as string,
    _creationTime: Date.now(),
    sessionId: 'session-123' as unknown as string,
    role: 'user',
    content: 'Test message content',
    timestamp: Date.now(),
    ...overrides,
  }),

  /**
   * Create a mock session report document
   */
  report: (overrides: Partial<MockReportDoc> = {}): MockReportDoc => ({
    _id: 'report-123' as unknown as string,
    _creationTime: Date.now(),
    sessionId: 'session-123' as unknown as string,
    reportContent: 'Test report content',
    keyPoints: ['Key point 1'],
    therapeuticInsights: {},
    patternsIdentified: [],
    actionItems: [],
    ...overrides,
  }),

  /**
   * Create a mock session bundle (session + messages + reports)
   */
  sessionBundle: (overrides: Partial<MockSessionBundle> = {}): MockSessionBundle => ({
    session: createMockResponses.session(overrides.session),
    messages: overrides.messages ?? [createMockResponses.message()],
    reports: overrides.reports ?? [],
  }),
};

// Mock document types that mirror the Convex types
interface MockUserDoc {
  _id: string;
  _creationTime: number;
  clerkId: string;
  email: string;
  name?: string;
  imageUrl?: string;
}

interface MockSessionDoc {
  _id: string;
  _creationTime: number;
  userId: string;
  title: string;
  startedAt: number;
  lastMessageAt?: number;
  messageCount: number;
  status?: string;
}

interface MockMessageDoc {
  _id: string;
  _creationTime: number;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface MockReportDoc {
  _id: string;
  _creationTime: number;
  sessionId: string;
  reportContent: string;
  keyPoints: string[];
  therapeuticInsights: Record<string, unknown>;
  patternsIdentified: string[];
  actionItems: string[];
}

interface MockSessionBundle {
  session: MockSessionDoc;
  messages: MockMessageDoc[];
  reports: MockReportDoc[];
}
