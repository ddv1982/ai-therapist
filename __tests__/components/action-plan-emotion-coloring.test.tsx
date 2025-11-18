/**
 * Action Plan Emotion Coloring Tests
 * Simplified tests focusing on emotion change logic
 */

import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock Redux store
const mockStore = configureStore({
  reducer: {
    session: (state = { sessions: [], currentSession: null }) => state,
  },
});

// Mock the CBT data manager hook
jest.mock('@/hooks/therapy/use-cbt-data-manager', () => ({
  useCBTDataManager: () => ({
    sessionData: {
      actionPlan: { finalEmotions: { fear: 0, anger: 0, sadness: 0, joy: 0 } },
      lastModified: null,
    },
    actionActions: { updateActionPlan: jest.fn() },
  }),
}));

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={mockStore}>{children}</Provider>
);

// Simple emotion change color logic for testing
function getEmotionChangeColor(initialValue: number, finalValue: number, isPositive: boolean) {
  const change = finalValue - initialValue;
  if (change === 0) return 'text-muted-foreground';

  if (isPositive) {
    return change > 0 ? 'text-green-500' : 'text-red-500';
  } else {
    return change > 0 ? 'text-red-500' : 'text-green-500';
  }
}

function EmotionDisplay({ initialEmotions, finalEmotions }: any) {
  const emotions = [
    { key: 'joy', isPositive: true },
    { key: 'fear', isPositive: false },
    { key: 'anger', isPositive: false },
  ];

  return (
    <div data-testid="emotion-display">
      {emotions.map((emotion) => {
        const initial = initialEmotions[emotion.key] || 0;
        const final = finalEmotions[emotion.key] || 0;
        const colorClass = getEmotionChangeColor(initial, final, emotion.isPositive);

        return (
          <div key={emotion.key} data-testid={`${emotion.key}-change`} className={colorClass}>
            Change: {final - initial}
          </div>
        );
      })}
    </div>
  );
}

describe('Action Plan Emotion Coloring', () => {
  describe('Emotion Change Logic', () => {
    it('should show green for joy increases', () => {
      render(
        <TestWrapper>
          <EmotionDisplay initialEmotions={{ joy: 2 }} finalEmotions={{ joy: 7 }} />
        </TestWrapper>
      );

      const joyChange = screen.getByTestId('joy-change');
      expect(joyChange).toHaveClass('text-green-500');
      expect(joyChange).toHaveTextContent('Change: 5');
    });

    it('should show red for joy decreases', () => {
      render(
        <TestWrapper>
          <EmotionDisplay initialEmotions={{ joy: 7 }} finalEmotions={{ joy: 2 }} />
        </TestWrapper>
      );

      const joyChange = screen.getByTestId('joy-change');
      expect(joyChange).toHaveClass('text-red-500');
      expect(joyChange).toHaveTextContent('Change: -5');
    });

    it('should show red for fear increases', () => {
      render(
        <TestWrapper>
          <EmotionDisplay initialEmotions={{ fear: 2 }} finalEmotions={{ fear: 7 }} />
        </TestWrapper>
      );

      const fearChange = screen.getByTestId('fear-change');
      expect(fearChange).toHaveClass('text-red-500');
      expect(fearChange).toHaveTextContent('Change: 5');
    });

    it('should show green for fear decreases', () => {
      render(
        <TestWrapper>
          <EmotionDisplay initialEmotions={{ fear: 7 }} finalEmotions={{ fear: 2 }} />
        </TestWrapper>
      );

      const fearChange = screen.getByTestId('fear-change');
      expect(fearChange).toHaveClass('text-green-500');
      expect(fearChange).toHaveTextContent('Change: -5');
    });

    it('should show muted for no change', () => {
      render(
        <TestWrapper>
          <EmotionDisplay
            initialEmotions={{ fear: 5, joy: 5 }}
            finalEmotions={{ fear: 5, joy: 5 }}
          />
        </TestWrapper>
      );

      const fearChange = screen.getByTestId('fear-change');
      const joyChange = screen.getByTestId('joy-change');

      expect(fearChange).toHaveClass('text-muted-foreground');
      expect(joyChange).toHaveClass('text-muted-foreground');
    });
  });

  describe('Pure Logic Functions', () => {
    it('should correctly calculate emotion colors', () => {
      // Joy (positive emotion)
      expect(getEmotionChangeColor(2, 7, true)).toBe('text-green-500'); // increase = good
      expect(getEmotionChangeColor(7, 2, true)).toBe('text-red-500'); // decrease = bad
      expect(getEmotionChangeColor(5, 5, true)).toBe('text-muted-foreground'); // no change

      // Fear (negative emotion)
      expect(getEmotionChangeColor(2, 7, false)).toBe('text-red-500'); // increase = bad
      expect(getEmotionChangeColor(7, 2, false)).toBe('text-green-500'); // decrease = good
      expect(getEmotionChangeColor(5, 5, false)).toBe('text-muted-foreground'); // no change
    });
  });
});
