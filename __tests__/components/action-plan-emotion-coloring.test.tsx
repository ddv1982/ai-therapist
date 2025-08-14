import React from 'react';
import { render, screen } from '@testing-library/react';
import { ActionPlan } from '@/features/therapy/cbt/chat-components/action-plan';
import type { EmotionData } from '@/features/therapy/cbt/chat-components/emotion-scale';

// Mock the draft utils to avoid file system dependencies in tests
jest.mock('@/lib/utils/cbt-draft-utils', () => ({
  loadCBTDraft: jest.fn(() => ({
    finalEmotions: { fear: 0, anger: 0, sadness: 0, joy: 0, anxiety: 0, shame: 0, guilt: 0 },
    originalThoughtCredibility: 5,
    newBehaviors: '',
    alternativeResponses: [{ response: '' }]
  })),
  useDraftSaver: jest.fn(() => ({ isDraftSaved: false })),
  CBT_DRAFT_KEYS: { ACTION_PLAN: 'action_plan' },
  clearCBTDraft: jest.fn()
}));

describe('ActionPlan Emotion Coloring Logic', () => {
  const mockOnComplete = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test the emotion coloring logic specifically
  describe('Emotion Change Coloring', () => {
    it('should show green for joy increases (positive emotion going up)', () => {
      const initialEmotions: EmotionData = {
        fear: 3, anger: 3, sadness: 3, joy: 2, anxiety: 3, shame: 3, guilt: 3
      };
      
      const finalEmotions: EmotionData = {
        fear: 3, anger: 3, sadness: 3, joy: 7, anxiety: 3, shame: 3, guilt: 3  // Joy increased by 5
      };

      render(
        <ActionPlan
          onComplete={mockOnComplete}
          initialEmotions={initialEmotions}
          initialData={{
            finalEmotions,
            originalThoughtCredibility: 5,
            newBehaviors: '',
            alternativeResponses: [{ response: '' }]
          }}
        />
      );

      // Look for the joy emotion change indicator
      const joyChangeElement = screen.getByText('↗ 5');
      expect(joyChangeElement).toHaveClass('text-green-500');
    });

    it('should show red for joy decreases (positive emotion going down)', () => {
      const initialEmotions: EmotionData = {
        fear: 3, anger: 3, sadness: 3, joy: 7, anxiety: 3, shame: 3, guilt: 3
      };
      
      const finalEmotions: EmotionData = {
        fear: 3, anger: 3, sadness: 3, joy: 2, anxiety: 3, shame: 3, guilt: 3  // Joy decreased by 5
      };

      render(
        <ActionPlan
          onComplete={mockOnComplete}
          initialEmotions={initialEmotions}
          initialData={{
            finalEmotions,
            originalThoughtCredibility: 5,
            newBehaviors: '',
            alternativeResponses: [{ response: '' }]
          }}
        />
      );

      // Look for the joy emotion change indicator
      const joyChangeElement = screen.getByText('↘ 5');
      expect(joyChangeElement).toHaveClass('text-red-500');
    });

    it('should show red for negative emotion increases (fear going up)', () => {
      const initialEmotions: EmotionData = {
        fear: 2, anger: 3, sadness: 3, joy: 3, anxiety: 3, shame: 3, guilt: 3
      };
      
      const finalEmotions: EmotionData = {
        fear: 7, anger: 3, sadness: 3, joy: 3, anxiety: 3, shame: 3, guilt: 3  // Fear increased by 5
      };

      render(
        <ActionPlan
          onComplete={mockOnComplete}
          initialEmotions={initialEmotions}
          initialData={{
            finalEmotions,
            originalThoughtCredibility: 5,
            newBehaviors: '',
            alternativeResponses: [{ response: '' }]
          }}
        />
      );

      // Look for the fear emotion change indicator
      const fearChangeElement = screen.getByText('↗ 5');
      expect(fearChangeElement).toHaveClass('text-red-500');
    });

    it('should show green for negative emotion decreases (anger going down)', () => {
      const initialEmotions: EmotionData = {
        fear: 3, anger: 7, sadness: 3, joy: 3, anxiety: 3, shame: 3, guilt: 3
      };
      
      const finalEmotions: EmotionData = {
        fear: 3, anger: 2, sadness: 3, joy: 3, anxiety: 3, shame: 3, guilt: 3  // Anger decreased by 5
      };

      render(
        <ActionPlan
          onComplete={mockOnComplete}
          initialEmotions={initialEmotions}
          initialData={{
            finalEmotions,
            originalThoughtCredibility: 5,
            newBehaviors: '',
            alternativeResponses: [{ response: '' }]
          }}
        />
      );

      // Look for the anger emotion change indicator
      const angerChangeElement = screen.getByText('↘ 5');
      expect(angerChangeElement).toHaveClass('text-green-500');
    });

    it('should show muted color for no change in emotions', () => {
      const initialEmotions: EmotionData = {
        fear: 3, anger: 3, sadness: 3, joy: 3, anxiety: 3, shame: 3, guilt: 3
      };
      
      const finalEmotions: EmotionData = {
        fear: 3, anger: 3, sadness: 3, joy: 3, anxiety: 3, shame: 3, guilt: 3  // No change
      };

      render(
        <ActionPlan
          onComplete={mockOnComplete}
          initialEmotions={initialEmotions}
          initialData={{
            finalEmotions,
            originalThoughtCredibility: 5,
            newBehaviors: '',
            alternativeResponses: [{ response: '' }]
          }}
        />
      );

      // Look for the no-change emotion indicators
      const noChangeElements = screen.getAllByText('→ 0');
      noChangeElements.forEach(element => {
        expect(element).toHaveClass('text-muted-foreground');
      });
    });
  });
});