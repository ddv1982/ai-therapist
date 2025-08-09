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
      ],
      schemaReflection: {
        enabled: false,
        questions: [],
        selfAssessment: ''
      }
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
    toggleSchemaReflection: jest.fn(),
    updateSchemaReflectionQuestion: jest.fn(),
    addSchemaReflectionQuestion: jest.fn(),
    removeSchemaReflectionQuestion: jest.fn(),
    updateSchemaReflectionAssessment: jest.fn(),
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

    // Check that section buttons exist using aria-labels (which are unique)
    expect(screen.getByLabelText(/Situation section/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Emotions section/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Thoughts section/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Schema section/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Reflection section/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Challenge section/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Results section/)).toBeInTheDocument();
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
    fireEvent.click(screen.getByLabelText(/Emotions section/));
    
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

  it('shows navigation buttons with correct section count', () => {
    render(
      <CBTDiaryModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSendToChat={mockOnSendToChat}
      />
    );

    expect(screen.getByText('← Previous')).toBeInTheDocument();
    expect(screen.getByText('Next →')).toBeInTheDocument();
    
    // Check that there are multiple instances of "1 of 7" (section navigation and footer)
    const sectionCountElements = screen.getAllByText('1 of 7');
    expect(sectionCountElements.length).toBeGreaterThan(0);
  });

  it('shows required and optional section indicators', () => {
    render(
      <CBTDiaryModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSendToChat={mockOnSendToChat}
      />
    );

    // Check that required sections (first 5) show "Required" label
    expect(screen.getByLabelText(/Situation.*required/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Emotions.*required/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Thoughts.*required/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Schema.*required/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Challenge.*required/)).toBeInTheDocument();
    
    // Check that optional sections show "Optional" label
    expect(screen.getByLabelText(/Reflection.*optional/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Results.*optional/)).toBeInTheDocument();
  });

  it('displays sections in correct order with Reflection as position 6', () => {
    render(
      <CBTDiaryModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSendToChat={mockOnSendToChat}
      />
    );

    // Get all section navigation buttons
    const sectionButtons = screen.getAllByRole('button').filter(button => 
      button.getAttribute('aria-pressed') !== null
    );
    
    // Should have 7 sections total
    expect(sectionButtons).toHaveLength(7);
    
    // Verify Reflection is in position 6 (index 5) - before Results
    const reflectionButton = screen.getByLabelText(/Reflection.*optional/);
    expect(reflectionButton).toBeInTheDocument();
    expect(reflectionButton.textContent).toContain('6 of 7');
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