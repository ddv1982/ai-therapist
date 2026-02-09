import { sendToChat } from '@/features/therapy/cbt/utils/send-to-chat';
import type { CBTFlowState } from '@/features/therapy/cbt/flow/types';

jest.mock('@/lib/api/client', () => ({
  apiClient: {
    createSession: jest.fn(),
    generateReportFromContext: jest.fn(),
    postMessage: jest.fn(),
    deleteSession: jest.fn(),
  },
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const { apiClient } = require('@/lib/api/client');

const sampleFlowState = (): CBTFlowState => ({
  sessionId: 'cbt-1',
  startedAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  status: 'complete',
  currentStepId: 'complete',
  completedSteps: [
    'situation',
    'emotions',
    'thoughts',
    'core-belief',
    'challenge-questions',
    'rational-thoughts',
    'schema-modes',
    'actions',
    'final-emotions',
  ],
  context: {
    situation: { situation: 'Test situation', date: '2025-01-01' },
    emotions: {
      fear: 5,
      anger: 0,
      sadness: 0,
      joy: 2,
      anxiety: 1,
      shame: 0,
      guilt: 0,
      other: '',
      otherIntensity: 0,
    },
    thoughts: [{ thought: 'Automatic thought sample', credibility: 4 }],
    coreBelief: { coreBeliefText: 'I am not enough', coreBeliefCredibility: 7 },
    challengeQuestions: {
      challengeQuestions: [
        {
          question: 'What evidence supports this thought?',
          answer: 'Very little; it is mostly an assumption.',
        },
      ],
    },
    rationalThoughts: {
      rationalThoughts: [
        { thought: 'I often do my best with the resources I have.', confidence: 8 },
      ],
    },
    schemaModes: {
      selectedModes: [
        {
          id: 'healthy-adult',
          name: 'Healthy Adult',
          description: 'Balanced perspective',
          selected: true,
          intensity: 7,
        },
      ],
    },
    actionPlan: {
      newBehaviors: 'Reach out to a friend for support.',
      originalThoughtCredibility: 4,
      finalEmotions: {
        fear: 2,
        anger: 0,
        sadness: 1,
        joy: 5,
        anxiety: 1,
        shame: 0,
        guilt: 0,
        other: '',
        otherIntensity: 0,
      },
    },
    finalEmotions: undefined,
  },
});

describe('sendToChat', () => {
  const mockedNow = 1_700_000_000_000;
  let nowSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    jest.clearAllMocks();
    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(mockedNow);
    (apiClient.createSession as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: 'session-123' },
    });
    (apiClient.generateReportFromContext as jest.Mock).mockResolvedValue({
      success: true,
      data: { reportContent: 'analysis' },
    });
    (apiClient.postMessage as jest.Mock).mockResolvedValue({ success: true });
    (apiClient.deleteSession as jest.Mock).mockResolvedValue({ success: true });
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  it('creates a session, posts summary and step cards, and stores analysis', async () => {
    const result = await sendToChat({
      title: 'CBT Summary',
      flowState: sampleFlowState(),
      contextualMessages: [
        {
          role: 'assistant',
          content: 'context reply',
          timestamp: new Date(mockedNow + 500).toISOString(),
        },
      ],
    });

    expect(result).toEqual({ sessionId: 'session-123' });
    expect(apiClient.createSession).toHaveBeenCalledWith({ title: 'CBT Summary' });

    expect(apiClient.generateReportFromContext).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 'session-123', model: 'openai/gpt-oss-120b' }),
      expect.objectContaining({ headers: undefined })
    );

    const messagesArg = (apiClient.generateReportFromContext as jest.Mock).mock.calls[0][0]
      .contextualMessages;
    expect(messagesArg[0].content).toContain('CBT_SUMMARY_CARD');
    expect(messagesArg).toHaveLength(2);

    const postCalls = (apiClient.postMessage as jest.Mock).mock.calls;
    expect(postCalls).toHaveLength(2);
    expect(postCalls[0][1].role).toBe('user');
    expect(postCalls[0][1].content).toContain('CBT_SUMMARY_CARD');
    expect(postCalls[1][1].role).toBe('assistant');
    expect(postCalls[1][1].content).toContain('analysis');
  });

  it('throws when report generation fails', async () => {
    (apiClient.generateReportFromContext as jest.Mock).mockResolvedValue({ success: false });

    await expect(
      sendToChat({
        title: 'Failure',
        flowState: sampleFlowState(),
        contextualMessages: [],
      })
    ).rejects.toThrow('Failed to generate session report');

    expect(apiClient.deleteSession).toHaveBeenCalledWith('session-123');
  });

  it('always sends at least the generated summary context to report generation', async () => {
    await sendToChat({
      title: 'Summary only',
      flowState: sampleFlowState(),
      contextualMessages: [],
    });

    const payload = (apiClient.generateReportFromContext as jest.Mock).mock.calls[0][0];
    expect(payload.sessionId).toBe('session-123');
    expect(payload.contextualMessages).toHaveLength(1);
    expect(payload.contextualMessages[0].content).toContain('CBT_SUMMARY_CARD');
  });
});
