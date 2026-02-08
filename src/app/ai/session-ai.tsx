import { ReactNode } from 'react';
import { createAI, createStreamableValue, getMutableAIState } from '@ai-sdk/rsc';
import type { SessionId } from '@/types/database';
import { validateApiAuth } from '@/lib/api/api-auth';
import { api, getAuthenticatedConvexClient } from '@/lib/convex/http-client';

type SessionPointerState = {
  currentSessionId: string | null;
};

export type SessionSelectionStatus = {
  phase: 'idle' | 'validating' | 'persisting' | 'complete';
  sessionId: string | null;
  message?: string;
};

async function getServerSessionState(): Promise<SessionPointerState> {
  try {
    const { user } = await requireConvexContext();
    return { currentSessionId: user.currentSessionId ?? null };
  } catch {
    return { currentSessionId: null };
  }
}

async function selectSessionAction(sessionId: string | null) {
  'use server';

  const statusStream = createStreamableValue<SessionSelectionStatus>({
    phase: 'validating',
    sessionId,
    message: sessionId ? 'Validating session ownership' : 'Clearing active session',
  });

  try {
    const { convex } = await requireConvexContext();

    if (sessionId) {
      const convexSessionId = assertSessionId(sessionId);
      await convex.query(api.sessions.get, { sessionId: convexSessionId });
      statusStream.update({
        phase: 'persisting',
        sessionId,
        message: 'Persisting session pointer securely',
      });
    } else {
      statusStream.update({
        phase: 'persisting',
        sessionId: null,
        message: 'Removing active session pointer',
      });
    }

    const nextState: SessionPointerState = { currentSessionId: sessionId };
    const aiState = getMutableAIState<typeof SessionAI>();
    aiState.done(nextState);
    statusStream.done({
      phase: 'complete',
      sessionId,
      message: 'Session ready',
    });

    return statusStream.value;
  } catch (error) {
    statusStream.error(error);
    throw error;
  }
}

async function requireConvexContext() {
  const authResult = await validateApiAuth();

  const clerkId = authResult.clerkId ?? authResult.userId;
  if (!authResult.isValid || !authResult.jwtToken || !clerkId) {
    throw new Error(authResult.error ?? 'Unauthorized');
  }

  const convex = getAuthenticatedConvexClient(authResult.jwtToken);
  const user = await convex.query(api.users.getByClerkId, { clerkId });

  if (!user) {
    throw new Error('User record not found');
  }

  return { convex, user };
}

export const SessionAI = createAI<SessionPointerState, SessionPointerState>({
  initialAIState: { currentSessionId: null },
  initialUIState: { currentSessionId: null },
  actions: {
    selectSession: selectSessionAction,
  },
  onSetAIState: async ({ state }) => {
    'use server';

    if (!state) return;

    const { convex } = await requireConvexContext();
    await convex.mutation(api.users.setCurrentSession, {
      sessionId: state.currentSessionId ? assertSessionId(state.currentSessionId) : null,
    });
  },
  onGetUIState: async () => {
    'use server';
    return await getServerSessionState();
  },
});

export type SessionAIType = typeof SessionAI;

function assertSessionId(value: string): SessionId {
  if (!value || typeof value !== 'string') {
    throw new Error('Invalid session identifier');
  }
  return value as SessionId;
}

export async function SessionAIProvider({ children }: { children: ReactNode }) {
  const initialState = await getServerSessionState();

  return (
    <SessionAI initialAIState={initialState} initialUIState={initialState}>
      {children}
    </SessionAI>
  );
}
