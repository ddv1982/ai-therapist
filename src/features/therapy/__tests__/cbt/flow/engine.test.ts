import {
  createInitialState,
  transition,
  type CBTFlowEvent,
  selectContext,
  selectCurrentStep,
  selectCompletedSteps,
  selectTimelineMessages,
  CBT_STEP_ORDER,
} from '@/features/therapy/cbt/flow';
import { buildStepCard, buildSessionSummaryCard } from '@/features/therapy/cbt/flow';

const baseEvent = (event: CBTFlowEvent) => event;

describe('CBT flow engine', () => {
  it('initialises with idle state', () => {
    const state = createInitialState();
    expect(state.status).toBe('idle');
    expect(state.currentStepId).toBe('situation');
    expect(selectContext(state)).toEqual({});
    expect(selectCompletedSteps(state)).toEqual([]);
  });

  it('starts a session and records id/timestamps', () => {
    const initial = createInitialState();
    const started = transition(
      initial,
      baseEvent({
        type: 'SESSION_START',
        sessionId: 'session-123',
      })
    );

    expect(started.status).toBe('active');
    expect(started.sessionId).toBe('session-123');
    expect(started.currentStepId).toBe('situation');
    expect(started.startedAt).toBeTruthy();
  });

  it('completes steps sequentially and updates context', () => {
    let state = transition(
      createInitialState(),
      baseEvent({ type: 'SESSION_START', sessionId: 'session-abc' })
    );

    state = transition(
      state,
      baseEvent({
        type: 'COMPLETE_STEP',
        stepId: 'situation',
        payload: { situation: 'Test', date: '2025-01-01' },
      })
    );

    expect(selectContext(state).situation?.situation).toBe('Test');
    expect(selectCompletedSteps(state)).toEqual(['situation']);
    expect(selectCurrentStep(state)).toBe('emotions');

    state = transition(
      state,
      baseEvent({
        type: 'COMPLETE_STEP',
        stepId: 'emotions',
        payload: {
          fear: 4,
          anger: 0,
          sadness: 1,
          joy: 2,
          anxiety: 1,
          shame: 0,
          guilt: 0,
          other: '',
          otherIntensity: 0,
        },
      })
    );

    expect(selectCompletedSteps(state)).toEqual(['situation', 'emotions']);
    expect(selectCurrentStep(state)).toBe('thoughts');
  });

  it('returns timeline messages matching current progress', () => {
    let state = transition(createInitialState(), baseEvent({ type: 'SESSION_START' }));
    const initialTimeline = selectTimelineMessages(state);
    expect(initialTimeline[0].type).toBe('cbt-component');
    expect(initialTimeline[0].stepId).toBe('situation');

    state = transition(
      state,
      baseEvent({
        type: 'COMPLETE_STEP',
        stepId: 'situation',
        payload: { situation: 'context', date: '2025-01-01' },
      })
    );

    const timeline = selectTimelineMessages(state);
    expect(timeline.find((msg) => msg.type === 'ai-response')?.stepId).toBe('situation');
    expect(timeline.some((msg) => msg.stepId === 'emotions')).toBe(true);
  });
});

describe('CBT cards', () => {
  const seededState = (): ReturnType<typeof createInitialState> => {
    let state = transition(createInitialState(), { type: 'SESSION_START', sessionId: 'cbt-1' });
    state = transition(state, {
      type: 'COMPLETE_STEP',
      stepId: 'situation',
      payload: { situation: 'Scenario', date: '2025-01-01' },
    });
    state = transition(state, {
      type: 'COMPLETE_STEP',
      stepId: 'emotions',
      payload: {
        fear: 3,
        anger: 0,
        sadness: 2,
        joy: 4,
        anxiety: 1,
        shame: 0,
        guilt: 0,
        other: '',
        otherIntensity: 0,
      },
    });
    return state;
  };

  it('builds per-step cards for completed steps', () => {
    const state = seededState();
    const context = selectContext(state);
    const cards = CBT_STEP_ORDER.map((step) => buildStepCard(step, context)).filter(Boolean);

    expect(cards).toHaveLength(2);
    expect(cards[0]).toContain('Scenario');
    expect(cards[1]).toContain('Emotion Assessment');
  });

  it('builds a summary card with situation and emotions', () => {
    const state = seededState();
    const card = buildSessionSummaryCard(state);
    expect(card).toContain('CBT_SUMMARY_CARD');
    expect(card).toContain('Scenario');
    expect(card).toContain('Fear');
  });
});
