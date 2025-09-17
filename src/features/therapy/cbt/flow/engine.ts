import { TOTAL_CBT_STEPS, CBT_STEP_CONFIG } from './config';
import type { ActionPlanData } from '@/types/therapy';
import {
  CBT_STEP_ORDER,
  type CBTFlowContext,
  type CBTFlowMessageDescriptor,
  type CBTFlowState,
  type CBTStepId,
  type CBTStepPayloadMap,
} from './types';

type CompleteStepEvent<K extends CBTStepId = CBTStepId> = {
  type: 'COMPLETE_STEP';
  stepId: K;
  payload: CBTStepPayloadMap[K];
  timestamp?: string;
};

type UpdateStepEvent<K extends CBTStepId = CBTStepId> = {
  type: 'UPDATE_STEP';
  stepId: K;
  payload: CBTStepPayloadMap[K];
  timestamp?: string;
};

type ClearStepEvent = {
  type: 'CLEAR_STEP';
  stepId: CBTStepId;
  timestamp?: string;
};

type GoToStepEvent = {
  type: 'GO_TO_STEP';
  stepId: CBTStepId | 'complete';
  timestamp?: string;
};

export type CBTFlowEvent =
  | { type: 'SESSION_START'; sessionId?: string | null; timestamp?: string }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; state: CBTFlowState }
  | CompleteStepEvent
  | UpdateStepEvent
  | ClearStepEvent
  | GoToStepEvent;

const STEP_INDEX: Record<CBTStepId, number> = CBT_STEP_ORDER.reduce(
  (acc, step, index) => {
    acc[step] = index;
    return acc;
  },
  {} as Record<CBTStepId, number>,
);

export function createInitialContext(): CBTFlowContext {
  return {};
}

export function createInitialState(): CBTFlowState {
  return {
    sessionId: null,
    startedAt: null,
    updatedAt: null,
    status: 'idle',
    currentStepId: 'situation',
    completedSteps: [],
    context: createInitialContext(),
  };
}

export function getStepIndex(stepId: CBTStepId): number {
  return STEP_INDEX[stepId] ?? -1;
}

export function getStepNumber(stepId: CBTStepId): number {
  const index = getStepIndex(stepId);
  return index >= 0 ? index + 1 : 1;
}

export function getNextStepId(stepId: CBTStepId): CBTStepId | undefined {
  const index = getStepIndex(stepId);
  if (index < 0) return undefined;
  return CBT_STEP_ORDER[index + 1];
}

function ensureCompletedSteps(previous: CBTStepId[], next: CBTStepId): CBTStepId[] {
  if (previous.includes(next)) return previous;
  const nextIndex = getStepIndex(next);
  const isSequential =
    previous.length === 0 || getStepIndex(previous[previous.length - 1]) === nextIndex - 1;
  return isSequential ? [...previous, next] : previous;
}

function applyStepPayload<K extends CBTStepId>(
  context: CBTFlowContext,
  stepId: K,
  payload: CBTStepPayloadMap[K],
): CBTFlowContext {
  const config = CBT_STEP_CONFIG[stepId];
  return config.persist(context, payload);
}

function clearStepPayload(context: CBTFlowContext, stepId: CBTStepId): CBTFlowContext {
  switch (stepId) {
    case 'situation':
      return { ...context, situation: undefined };
    case 'emotions':
      return { ...context, emotions: undefined };
    case 'thoughts':
      return { ...context, thoughts: undefined };
    case 'core-belief':
      return { ...context, coreBelief: undefined };
    case 'challenge-questions':
      return { ...context, challengeQuestions: undefined };
    case 'rational-thoughts':
      return { ...context, rationalThoughts: undefined };
    case 'schema-modes':
      return { ...context, schemaModes: undefined };
    case 'actions':
      return { ...context, actionPlan: undefined };
    case 'final-emotions': {
      const nextActionPlan = context.actionPlan ? { ...context.actionPlan } : undefined;
      if (nextActionPlan) {
        delete (nextActionPlan as Partial<ActionPlanData>).finalEmotions;
      }
      return { ...context, finalEmotions: undefined, actionPlan: nextActionPlan };
    }
    default:
      return context;
  }
}

export function transition(state: CBTFlowState, event: CBTFlowEvent): CBTFlowState {
  switch (event.type) {
    case 'RESET':
      return createInitialState();
    case 'HYDRATE':
      return event.state;
    case 'SESSION_START': {
      const timestamp = event.timestamp ?? new Date().toISOString();
      return {
        sessionId: event.sessionId ?? state.sessionId ?? null,
        startedAt: timestamp,
        updatedAt: timestamp,
        status: 'active',
        currentStepId: 'situation',
        completedSteps: [],
        context: createInitialContext(),
      };
    }
    case 'COMPLETE_STEP': {
      if (state.status === 'idle') return state;
      if (state.currentStepId === 'complete') return state;
      if (event.stepId !== state.currentStepId) return state;

      const updatedContext = applyStepPayload(state.context, event.stepId, event.payload);
      const completedSteps = ensureCompletedSteps(state.completedSteps, event.stepId);
      const nextStep = getNextStepId(event.stepId);
      const timestamp = event.timestamp ?? new Date().toISOString();

      return {
        sessionId: state.sessionId,
        startedAt: state.startedAt ?? timestamp,
        updatedAt: timestamp,
        status: nextStep ? 'active' : 'complete',
        currentStepId: nextStep ?? 'complete',
        completedSteps,
        context: updatedContext,
      };
    }
    case 'UPDATE_STEP': {
      if (state.status === 'idle') return state;
      const updatedContext = applyStepPayload(state.context, event.stepId, event.payload);
      const timestamp = event.timestamp ?? new Date().toISOString();
      return {
        ...state,
        context: updatedContext,
        updatedAt: timestamp,
      };
    }
    case 'CLEAR_STEP': {
      if (state.status === 'idle') return state;
      const updatedContext = clearStepPayload(state.context, event.stepId);
      const timestamp = event.timestamp ?? new Date().toISOString();
      const filteredCompleted = state.completedSteps.filter((step) => step !== event.stepId);
      return {
        ...state,
        context: updatedContext,
        updatedAt: timestamp,
        completedSteps: filteredCompleted,
        currentStepId: state.currentStepId === 'complete' ? event.stepId : state.currentStepId,
        status: state.currentStepId === 'complete' ? 'active' : state.status,
      };
    }
    case 'GO_TO_STEP': {
      if (event.stepId === 'complete') {
        return {
          ...state,
          currentStepId: 'complete',
          status: 'complete',
          updatedAt: event.timestamp ?? new Date().toISOString(),
        };
      }
      if (!CBT_STEP_ORDER.includes(event.stepId)) return state;
      return {
        ...state,
        currentStepId: event.stepId,
        status: 'active',
        updatedAt: event.timestamp ?? new Date().toISOString(),
      };
    }
    default:
      return state;
  }
}

function buildComponentMessage(stepId: CBTStepId): CBTFlowMessageDescriptor {
  const config = CBT_STEP_CONFIG[stepId];
  const stepNumber = getStepNumber(stepId);
  return {
    id: `component:${stepId}`,
    stepId,
    type: 'cbt-component',
    translationKey: config.messages.component.translationKey,
    defaultText: config.messages.component.defaultText,
    stepNumber,
    totalSteps: TOTAL_CBT_STEPS,
  };
}

function buildAiMessage(stepId: CBTStepId): CBTFlowMessageDescriptor | null {
  const config = CBT_STEP_CONFIG[stepId];
  if (!config.messages.aiResponse) return null;
  const stepNumber = getStepNumber(stepId);
  return {
    id: `ai:${stepId}`,
    stepId,
    type: 'ai-response',
    translationKey: config.messages.aiResponse.translationKey,
    defaultText: config.messages.aiResponse.defaultText,
    stepNumber,
    totalSteps: TOTAL_CBT_STEPS,
  };
}

export function selectTimelineMessages(state: CBTFlowState): CBTFlowMessageDescriptor[] {
  if (state.status === 'idle') return [];
  const messages: CBTFlowMessageDescriptor[] = [];
  const firstStep = CBT_STEP_ORDER[0];
  messages.push(buildComponentMessage(firstStep));

  for (const stepId of state.completedSteps) {
    const aiMessage = buildAiMessage(stepId);
    if (aiMessage) {
      messages.push(aiMessage);
    }
    const nextStep = getNextStepId(stepId);
    if (nextStep) {
      const alreadyQueued = messages.some((msg) => msg.id === `component:${nextStep}`);
      if (!alreadyQueued) {
        messages.push(buildComponentMessage(nextStep));
      }
    }
  }

  return messages;
}

export function selectIsComplete(state: CBTFlowState): boolean {
  return state.status === 'complete';
}

export function selectCurrentStep(state: CBTFlowState): CBTStepId | 'complete' {
  return state.currentStepId;
}

export function selectContext(state: CBTFlowState): CBTFlowContext {
  return state.context;
}

export function selectCompletedSteps(state: CBTFlowState): CBTStepId[] {
  return state.completedSteps;
}
