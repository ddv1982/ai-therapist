/**
 * Mock for @ai-sdk/rsc package
 * Provides hooks required by SessionProvider and other AI SDK RSC components
 */

/**
 * Async generator that yields streamable values
 * @param stream - The stream value to yield
 * @yields The stream value(s)
 */
export async function* readStreamableValue(stream: unknown) {
  if (Array.isArray(stream)) {
    yield* stream;
  } else {
    yield stream;
  }
}

/**
 * Mock hook that returns AI actions
 * Returns an object with selectSession action that returns a StreamableValue
 */
export function useActions() {
  return {
    /**
     * Mock selectSession action that returns a streamable value
     * @param _sessionId - The session ID to select (unused in mock)
     */
    selectSession: async (_sessionId: string | null) => {
      // Return a mock streamable value that yields a success status
      return {
        [Symbol.asyncIterator]: async function* () {
          yield { phase: 'idle', sessionId: _sessionId };
        },
      };
    },
  };
}

/**
 * Mock hook that returns a function to sync UI state
 */
export function useSyncUIState() {
  return async () => {};
}

/**
 * Mock hook that returns UI state tuple
 */
export function useUIState(): [Record<string, unknown>, (state: unknown) => void] {
  return [{}, () => {}];
}

/**
 * Creates a streamable value from a regular value
 */
export function createStreamableValue<T>(value: T): T {
  return value;
}

export default {
  readStreamableValue,
  useActions,
  useSyncUIState,
  useUIState,
  createStreamableValue,
};
