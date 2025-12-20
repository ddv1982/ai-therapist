import { render, screen, fireEvent, act } from '@testing-library/react';
import { ComponentTestUtils } from '@tests/utils/test-utilities';
import { useCbtDiaryFlow } from '@/features/therapy/cbt/hooks/use-cbt-diary-flow';

const flush = () => new Promise<void>((r) => setTimeout(r, 0));
const flushTwo = async () => {
  await flush();
  await flush();
};

function TestHarness() {
  const { messages, startCBTFlow, handleCBTSituationComplete, handleCBTEmotionComplete } =
    useCbtDiaryFlow();

  return (
    <div>
      <div data-testid="messages-count">{messages.length}</div>
      <div data-testid="last-step">{messages[messages.length - 1]?.metadata?.step || ''}</div>
      <button onClick={() => startCBTFlow()} data-testid="start" />
      <button
        onClick={() => handleCBTSituationComplete({ situation: 'x', date: '2025-01-01' } as any)}
        data-testid="complete-situation"
      />
      <button
        onClick={() =>
          handleCBTEmotionComplete({
            fear: 1,
            anger: 0,
            sadness: 0,
            joy: 0,
            anxiety: 0,
            shame: 0,
            guilt: 0,
          } as any)
        }
        data-testid="complete-emotions"
      />
    </div>
  );
}

describe('useCbtDiaryFlow', () => {
  ComponentTestUtils.setupComponentTest();

  it('inserts next step component deterministically after completing Situation', async () => {
    render(<TestHarness />);

    fireEvent.click(screen.getByTestId('start'));
    fireEvent.click(screen.getByTestId('complete-situation'));

    await act(async () => {
      await flushTwo();
    });

    expect(screen.getByTestId('last-step').textContent).toBe('emotions');
  });

  it('progresses to Thoughts after completing Emotions', async () => {
    render(<TestHarness />);

    fireEvent.click(screen.getByTestId('start'));
    fireEvent.click(screen.getByTestId('complete-situation'));
    await act(async () => {
      await flushTwo();
    });

    fireEvent.click(screen.getByTestId('complete-emotions'));
    await act(async () => {
      await flushTwo();
    });

    expect(screen.getByTestId('last-step').textContent).toBe('thoughts');
  });
});
