import { render } from '@testing-library/react';
import { SessionProvider, useSession } from '@/contexts/session-context';
import * as sessionsQueries from '@/lib/queries/sessions';

// Mock the queries
jest.mock('@/lib/queries/sessions', () => ({
  useCurrentSessionQuery: jest.fn(),
  useSetCurrentSessionMutation: jest.fn(),
}));

describe('SessionProvider', () => {
  it('maintains stable selectSession reference when mutation hook returns new object but stable mutateAsync', () => {
    const mutateAsync = jest.fn();
    const useSetCurrentSessionMutationMock = sessionsQueries.useSetCurrentSessionMutation as jest.Mock;

    // 1. Setup initial mock
    useSetCurrentSessionMutationMock.mockReturnValue({
      mutateAsync,
      status: 'idle',
    });

    (sessionsQueries.useCurrentSessionQuery as jest.Mock).mockReturnValue({
      data: null,
    });

    let capturedSelectSession1: any;
    let capturedSelectSession2: any;

    function TestComponent({ capture }: { capture: (val: any) => void }) {
      const { selectSession } = useSession();
      capture(selectSession);
      return null;
    }

    // 2. Initial Render
    const { rerender } = render(
      <SessionProvider>
        <TestComponent capture={(val) => (capturedSelectSession1 = val)} />
      </SessionProvider>
    );

    // 3. Change mock to return NEW object with STABLE mutateAsync
    // This simulates what happens when React Query state changes (e.g. isPending flips)
    // but the mutation function itself remains referentially stable.
    useSetCurrentSessionMutationMock.mockReturnValue({
      mutateAsync, // Same reference
      status: 'pending', // Different status implies a new object reference from the hook
    });

    // 4. Rerender SessionProvider
    // This forces SessionProvider to re-execute, calling the mock again
    rerender(
      <SessionProvider>
        <TestComponent capture={(val) => (capturedSelectSession2 = val)} />
      </SessionProvider>
    );

    // 5. Assertions
    expect(capturedSelectSession1).toBeDefined();
    expect(capturedSelectSession2).toBeDefined();
    
    // If selectSession is not memoized correctly or depends on the unstable hook result object
    // instead of just mutateAsync, this equality check will fail.
    expect(capturedSelectSession2).toBe(capturedSelectSession1);
  });
});
