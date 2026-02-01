/**
 * Mock for @ai-sdk/rsc package
 * Provides hooks required by SessionProvider and other AI SDK RSC components
 */

/**
 * Async generator that yields streamable values
 * @param {any} stream - The stream value to yield
 * @yields {any} The stream value(s)
 */
async function* readStreamableValue(stream) {
  if (Array.isArray(stream)) {
    yield* stream;
  } else {
    yield stream;
  }
}

/**
 * Mock hook that returns AI actions
 * Returns an object with selectSession action that returns a StreamableValue
 * @returns {{ selectSession: (sessionId: string | null) => Promise<any> }} Actions object
 */
function useActions() {
  return {
    /**
     * Mock selectSession action that returns a streamable value
     * @param {string | null} _sessionId - The session ID to select (unused in mock)
     * @returns {Promise<any>} Promise resolving to a mock streamable value
     */
    selectSession: async (_sessionId) => {
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
 * @returns {() => Promise<void>} Function that syncs UI state
 */
function useSyncUIState() {
  return async () => {};
}

/**
 * Mock hook that returns UI state tuple
 * @returns {[any, (state: any) => void]} Tuple with state and setter function
 */
function useUIState() {
  return [{}, () => {}];
}

/**
 * Creates a streamable value from a regular value
 * @param {any} value - The value to make streamable
 * @returns {any} The streamable value
 */
function createStreamableValue(value) {
  return value;
}

module.exports = {
  readStreamableValue,
  useActions,
  useSyncUIState,
  useUIState,
  createStreamableValue,
};