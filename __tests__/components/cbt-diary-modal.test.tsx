import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CBTDiaryModal } from '@/components/cbt/cbt-diary-modal';

// Mock the hook
jest.mock('@/hooks/use-cbt-form', () => ({
  useCBTForm: () => ({
    formData: {
      date: '2025-01-01',
      situation: 'Test situation',
      initialEmotions: {
        fear: 5,
        anger: 3,
        sadness: 2,
        joy: 1,
        anxiety: 7,
        shame: 0,
        guilt: 4,
        other: '',
        otherIntensity: 0
      },
      automaticThoughts: [
        { thought: 'Test thought', credibility: 6 }
      ],
      coreBeliefText: 'Test core belief',
      coreBeliefCredibility: 5,
      confirmingBehaviors: 'Test confirming',
      avoidantBehaviors: 'Test avoiding',
      overridingBehaviors: 'Test overriding',
      schemaModes: [
        { id: 'vulnerable-child', name: 'Vulnerable Child', description: 'scared, helpless', selected: false }
      ],
      challengeQuestions: [
        { question: 'Test question?', answer: 'Test answer' }
      ],
      additionalQuestions: [
        { question: '', answer: '' }
      ],
      rationalThoughts: [
        { thought: 'Rational thought', confidence: 7 }
      ],
      finalEmotions: {
        fear: 2,
        anger: 1,
        sadness: 1,
        joy: 6,
        anxiety: 3,
        shame: 0,
        guilt: 1,
        other: '',
        otherIntensity: 0
      },
      originalThoughtCredibility: 3,
      newBehaviors: 'New behaviors',
      alternativeResponses: [
        { response: 'Alternative response' }
      ]
    },
    formState: {
      data: {} as any,
      isDirty: false,
      isValid: true,
      errors: {}
    },
    updateField: jest.fn(),
    updateNestedField: jest.fn(),
    addAutomaticThought: jest.fn(),
    removeAutomaticThought: jest.fn(),
    addRationalThought: jest.fn(),
    removeRationalThought: jest.fn(),
    addAdditionalQuestion: jest.fn(),
    removeAdditionalQuestion: jest.fn(),
    addAlternativeResponse: jest.fn(),
    removeAlternativeResponse: jest.fn(),
    updateSchemaMode: jest.fn(),
    validateForm: jest.fn(() => []),
    resetForm: jest.fn(),
    generateFormattedOutput: jest.fn(() => 'Formatted CBT output'),
    isDirty: false,
    isValid: true,
    errors: {},
    lastSaved: undefined
  })
}));

describe('CBTDiaryModal', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnSendToChat = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal when open', () => {
    render(
      <CBTDiaryModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSendToChat={mockOnSendToChat}
      />
    );

    expect(screen.getByText('CBT Diary Entry')).toBeInTheDocument();
    expect(screen.getByText('Structured reflection for cognitive behavioral therapy')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <CBTDiaryModal
        open={false}
        onOpenChange={mockOnOpenChange}
        onSendToChat={mockOnSendToChat}
      />
    );

    expect(screen.queryByText('CBT Diary Entry')).not.toBeInTheDocument();
  });

  it('displays section navigation buttons', () => {
    render(
      <CBTDiaryModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSendToChat={mockOnSendToChat}
      />
    );

    // Check that section buttons exist (there will be multiple "Situation" elements)
    expect(screen.getAllByText('Situation')).toHaveLength(2); // Button and label
    expect(screen.getByText('Emotions')).toBeInTheDocument();
    expect(screen.getByText('Thoughts')).toBeInTheDocument();
    expect(screen.getByText('Schema')).toBeInTheDocument();
    expect(screen.getByText('Challenge')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
  });

  it('shows form fields in the situation section by default', () => {
    render(
      <CBTDiaryModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSendToChat={mockOnSendToChat}
      />
    );

    // Look for input fields instead of labels which might have accessibility issues
    expect(screen.getByDisplayValue('2025-01-01')).toBeInTheDocument(); // Date field
    expect(screen.getByDisplayValue('Test situation')).toBeInTheDocument(); // Situation textarea
  });

  it('can navigate between sections', async () => {
    render(
      <CBTDiaryModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSendToChat={mockOnSendToChat}
      />
    );

    // Click on Emotions section
    fireEvent.click(screen.getByText('Emotions'));
    
    await waitFor(() => {
      expect(screen.getByText('Initial Emotions')).toBeInTheDocument();
    });
  });

  it('displays Send to Chat button', () => {
    render(
      <CBTDiaryModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSendToChat={mockOnSendToChat}
      />
    );

    expect(screen.getByText('Send to Chat')).toBeInTheDocument();
  });

  it('calls onSendToChat when Send to Chat is clicked', async () => {
    render(
      <CBTDiaryModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSendToChat={mockOnSendToChat}
      />
    );

    fireEvent.click(screen.getByText('Send to Chat'));

    await waitFor(() => {
      expect(mockOnSendToChat).toHaveBeenCalledWith('Formatted CBT output');
    });
  });

  it('shows navigation buttons', () => {
    render(
      <CBTDiaryModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSendToChat={mockOnSendToChat}
      />
    );

    expect(screen.getByText('← Previous')).toBeInTheDocument();
    expect(screen.getByText('Next →')).toBeInTheDocument();
    expect(screen.getByText('1 of 6')).toBeInTheDocument();
  });

  it('can cancel and close the modal', () => {
    render(
      <CBTDiaryModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSendToChat={mockOnSendToChat}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});