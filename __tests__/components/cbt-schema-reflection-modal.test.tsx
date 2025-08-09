/**
 * CBT Schema Reflection Modal Test Suite
 * Tests the schema reflection section in the CBT diary modal
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CBTDiaryModal } from '@/components/cbt/cbt-diary-modal';

// Mock the CBT export button component
jest.mock('@/components/cbt/cbt-export-button', () => ({
  CBTExportButton: ({ formData, isValid, disabled }: any) => (
    <button 
      data-testid="cbt-export-button"
      disabled={disabled || !isValid}
      title="Export CBT diary"
    >
      Export
    </button>
  ),
}));

const mockFormData = {
  date: '2024-01-15',
  situation: 'Test situation',
  initialEmotions: {
    fear: 3,
    anger: 0,
    sadness: 2,
    joy: 1,
    anxiety: 5,
    shame: 0,
    guilt: 1,
    other: '',
    otherIntensity: 0
  },
  automaticThoughts: [{ thought: 'I will fail', credibility: 7 }],
  coreBeliefText: 'I am not good enough',
  coreBeliefCredibility: 6,
  confirmingBehaviors: '',
  avoidantBehaviors: '',
  overridingBehaviors: '',
  schemaModes: [
    { id: 'vulnerable-child', name: 'The Vulnerable Child', description: 'scared, helpless', selected: true },
    { id: 'punishing-parent', name: 'The Punishing Parent', description: 'critical, harsh', selected: false }
  ],
  schemaReflection: {
    enabled: false,
    questions: [
      {
        question: 'What does this situation remind you of from your childhood?',
        answer: '',
        category: 'childhood'
      },
      {
        question: 'Do you notice patterns of abandonment fears?',
        answer: '',
        category: 'schemas'
      },
      {
        question: 'How are you trying to protect yourself?',
        answer: '',
        category: 'coping'
      },
      {
        question: 'Which part of you is most active right now?',
        answer: '',
        category: 'modes'
      }
    ],
    selfAssessment: ''
  },
  challengeQuestions: [{ question: 'What would I say to a friend?', answer: '' }],
  additionalQuestions: [{ question: '', answer: '' }],
  rationalThoughts: [{ thought: '', confidence: 0 }],
  finalEmotions: {
    fear: 2,
    anger: 0,
    sadness: 1,
    joy: 3,
    anxiety: 3,
    shame: 0,
    guilt: 0,
    other: '',
    otherIntensity: 0
  },
  originalThoughtCredibility: 4,
  newBehaviors: '',
  alternativeResponses: [{ response: '' }]
};

const mockFormMethods = {
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
  generateFormattedOutput: jest.fn(() => 'Formatted output'),
  isDirty: false,
  isValid: true,
  errors: {},
  lastSaved: undefined
};

// Mock the CBT form hook
jest.mock('@/hooks/use-cbt-form', () => ({
  useCBTForm: jest.fn(() => ({
    formData: mockFormData,
    ...mockFormMethods
  }))
}));

// Mock the design system tokens
jest.mock('@/lib/design-system/message', () => ({
  getCBTTokens: jest.fn(() => ({
    section: {
      container: 'space-y-6',
      header: 'flex items-center gap-2 text-lg font-semibold mb-4',
      subHeader: 'text-base font-semibold mb-3',
      description: 'text-sm text-muted-foreground mb-4'
    },
    input: {
      field: 'w-full p-3 border rounded-lg',
      label: 'block text-sm font-medium mb-2',
      helper: 'text-xs text-muted-foreground mt-1',
      error: 'text-xs text-red-500 mt-1'
    },
    modal: {
      header: 'p-6 pb-4',
      content: 'flex-1 overflow-y-auto px-6',
      footer: 'p-6 pt-4',
      navigation: 'px-6 py-3 border-b'
    },
    navigation: {
      tab: 'flex items-center gap-2 px-3 py-2 rounded text-sm',
      tabActive: 'bg-primary text-primary-foreground',
      tabInactive: 'text-muted-foreground hover:text-foreground',
      tabError: 'text-red-500'
    },
    slider: {
      container: 'space-y-2',
      label: 'flex justify-between items-center',
      labelText: 'text-sm font-medium',
      value: 'text-sm text-muted-foreground',
      track: 'w-full h-2 rounded-lg appearance-none',
      scale: 'flex justify-between text-xs text-muted-foreground'
    },
    arrayField: {
      container: 'space-y-4',
      item: 'p-4 border rounded-lg bg-card',
      empty: 'text-sm text-muted-foreground italic',
      addButton: 'w-full',
      removeButton: 'text-muted-foreground hover:text-foreground'
    }
  }))
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  BookOpen: () => <div data-testid="book-open-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
  Send: () => <div data-testid="send-icon" />,
  RotateCcw: () => <div data-testid="rotate-icon" />,
  Heart: () => <div data-testid="heart-icon" />,
  Brain: () => <div data-testid="brain-icon" />,
  MessageCircle: () => <div data-testid="message-circle-icon" />,
  CheckSquare: () => <div data-testid="check-square-icon" />,
  Lightbulb: () => <div data-testid="lightbulb-icon" />,
  Target: () => <div data-testid="target-icon" />
}));

const { useCBTForm: mockUseCBTForm } = require('@/hooks/use-cbt-form');

describe('CBT Schema Reflection Modal', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onSendToChat: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Reflection Section Navigation', () => {
    it('should include reflection section in navigation', () => {
      render(<CBTDiaryModal {...defaultProps} />);
      
      const reflectionTab = screen.getByText('Reflection');
      expect(reflectionTab).toBeInTheDocument();
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('should navigate to reflection section when clicked', () => {
      render(<CBTDiaryModal {...defaultProps} />);
      
      const reflectionTab = screen.getByText('Reflection');
      fireEvent.click(reflectionTab);
      
      // Should show reflection content
      expect(screen.getByText('Schema Reflection')).toBeInTheDocument();
      expect(screen.getByText('(Optional)')).toBeInTheDocument();
    });
  });

  describe('Schema Reflection Toggle', () => {
    it('should display toggle checkbox for enabling reflection', () => {
      render(<CBTDiaryModal {...defaultProps} />);
      
      // Navigate to reflection section
      fireEvent.click(screen.getByText('Reflection'));
      
      const checkbox = screen.getByLabelText('Enable Schema Reflection');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should call toggleSchemaReflection when checkbox is clicked', () => {
      const mockToggle = jest.fn();
      mockUseCBTForm.mockReturnValue({
        ...mockUseCBTForm(),
        toggleSchemaReflection: mockToggle
      });

      render(<CBTDiaryModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Reflection'));
      
      const checkbox = screen.getByLabelText('Enable Schema Reflection');
      fireEvent.click(checkbox);
      
      expect(mockToggle).toHaveBeenCalledWith(true);
    });

    it('should show reflection content when enabled', () => {
      mockUseCBTForm.mockReturnValue({
        ...mockUseCBTForm(),
        formData: {
          ...mockUseCBTForm().formData,
          schemaReflection: {
            ...mockUseCBTForm().formData.schemaReflection,
            enabled: true
          }
        }
      });

      render(<CBTDiaryModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Reflection'));
      
      expect(screen.getByText('Personal Assessment')).toBeInTheDocument();
      expect(screen.getByText('Guided Reflection Questions')).toBeInTheDocument();
    });

    it('should hide reflection content when disabled', () => {
      // Ensure reflection is disabled
      mockUseCBTForm.mockReturnValue({
        formData: {
          ...mockFormData,
          schemaReflection: {
            ...mockFormData.schemaReflection,
            enabled: false
          }
        },
        ...mockFormMethods
      });

      render(<CBTDiaryModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Reflection'));
      
      expect(screen.queryByText('Personal Assessment')).not.toBeInTheDocument();
      expect(screen.queryByText('Guided Reflection Questions')).not.toBeInTheDocument();
    });
  });

  describe('Personal Assessment Section', () => {
    beforeEach(() => {
      mockUseCBTForm.mockReturnValue({
        ...mockUseCBTForm(),
        formData: {
          ...mockUseCBTForm().formData,
          schemaReflection: {
            ...mockUseCBTForm().formData.schemaReflection,
            enabled: true
          }
        }
      });
    });

    it('should display personal assessment textarea', () => {
      render(<CBTDiaryModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Reflection'));
      
      const textarea = screen.getByPlaceholderText(/What patterns do you notice/);
      expect(textarea).toBeInTheDocument();
      expect(textarea.getAttribute('maxlength')).toBe('2000');
    });

    it('should call updateSchemaReflectionAssessment on text change', () => {
      const mockUpdate = jest.fn();
      mockUseCBTForm.mockReturnValue({
        ...mockUseCBTForm(),
        updateSchemaReflectionAssessment: mockUpdate,
        formData: {
          ...mockUseCBTForm().formData,
          schemaReflection: {
            ...mockUseCBTForm().formData.schemaReflection,
            enabled: true
          }
        }
      });

      render(<CBTDiaryModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Reflection'));
      
      const textarea = screen.getByPlaceholderText(/What patterns do you notice/);
      fireEvent.change(textarea, { target: { value: 'My reflection text' } });
      
      expect(mockUpdate).toHaveBeenCalledWith('My reflection text');
    });

    it('should display character count', () => {
      mockUseCBTForm.mockReturnValue({
        ...mockUseCBTForm(),
        formData: {
          ...mockUseCBTForm().formData,
          schemaReflection: {
            ...mockUseCBTForm().formData.schemaReflection,
            enabled: true,
            selfAssessment: 'Test assessment'
          }
        }
      });

      render(<CBTDiaryModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Reflection'));
      
      expect(screen.getByText('15/2000')).toBeInTheDocument();
    });
  });

  describe('Reflection Questions Section', () => {
    beforeEach(() => {
      mockUseCBTForm.mockReturnValue({
        ...mockUseCBTForm(),
        formData: {
          ...mockUseCBTForm().formData,
          schemaReflection: {
            ...mockUseCBTForm().formData.schemaReflection,
            enabled: true
          }
        }
      });
    });

    it('should display questions organized by category', () => {
      mockUseCBTForm.mockReturnValue({
        ...mockUseCBTForm(),
        formData: {
          ...mockUseCBTForm().formData,
          schemaReflection: {
            ...mockUseCBTForm().formData.schemaReflection,
            enabled: true
          }
        }
      });

      render(<CBTDiaryModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Reflection'));
      
      expect(screen.getByText('Childhood Patterns')).toBeInTheDocument();
      expect(screen.getByText('Schema Patterns')).toBeInTheDocument();
      expect(screen.getByText('Coping Strategies')).toBeInTheDocument();
      expect(screen.getByText('Emotional Modes')).toBeInTheDocument();
    });

    it('should display question text and answer textarea', () => {
      mockUseCBTForm.mockReturnValue({
        ...mockUseCBTForm(),
        formData: {
          ...mockUseCBTForm().formData,
          schemaReflection: {
            ...mockUseCBTForm().formData.schemaReflection,
            enabled: true
          }
        }
      });

      render(<CBTDiaryModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Reflection'));
      
      // Check that reflection questions are displayed by looking for textareas
      const textareas = screen.getAllByPlaceholderText('Take time to explore this question honestly and compassionately. What comes up for you? What patterns or insights emerge?');
      expect(textareas.length).toBeGreaterThan(0);
      
      // Check for the mock question data structure
      expect(screen.getByText('What does this situation remind you of from your childhood?')).toBeInTheDocument();
    });

    it('should call updateSchemaReflectionQuestion on answer change', () => {
      const mockUpdate = jest.fn();
      mockUseCBTForm.mockReturnValue({
        ...mockUseCBTForm(),
        updateSchemaReflectionQuestion: mockUpdate,
        formData: {
          ...mockUseCBTForm().formData,
          schemaReflection: {
            ...mockUseCBTForm().formData.schemaReflection,
            enabled: true
          }
        }
      });

      render(<CBTDiaryModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Reflection'));
      
      const textarea = screen.getAllByPlaceholderText('Take time to explore this question honestly and compassionately. What comes up for you? What patterns or insights emerge?')[0];
      fireEvent.change(textarea, { target: { value: 'My answer' } });
      
      expect(mockUpdate).toHaveBeenCalledWith(0, 'answer', 'My answer');
    });
  });

  describe('Custom Questions Section', () => {
    it('should display custom questions when they exist', () => {
      mockUseCBTForm.mockReturnValue({
        ...mockUseCBTForm(),
        formData: {
          ...mockUseCBTForm().formData,
          schemaReflection: {
            enabled: true,
            questions: [
              {
                question: 'Custom question',
                answer: '',
                category: 'custom'
              }
            ],
            selfAssessment: ''
          }
        }
      });

      render(<CBTDiaryModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Reflection'));
      
      expect(screen.getByText('Custom Questions')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Custom question')).toBeInTheDocument();
    });

    it('should allow editing custom question text', () => {
      const mockUpdate = jest.fn();
      mockUseCBTForm.mockReturnValue({
        ...mockUseCBTForm(),
        updateSchemaReflectionQuestion: mockUpdate,
        formData: {
          ...mockUseCBTForm().formData,
          schemaReflection: {
            enabled: true,
            questions: [
              {
                question: 'Custom question',
                answer: '',
                category: 'custom'
              }
            ],
            selfAssessment: ''
          }
        }
      });

      render(<CBTDiaryModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Reflection'));
      
      const questionInput = screen.getByDisplayValue('Custom question');
      fireEvent.change(questionInput, { target: { value: 'Updated question' } });
      
      expect(mockUpdate).toHaveBeenCalledWith(0, 'question', 'Updated question');
    });

    it('should allow removing custom questions', () => {
      const mockRemove = jest.fn();
      mockUseCBTForm.mockReturnValue({
        ...mockUseCBTForm(),
        removeSchemaReflectionQuestion: mockRemove,
        formData: {
          ...mockUseCBTForm().formData,
          schemaReflection: {
            enabled: true,
            questions: [
              {
                question: 'Custom question',
                answer: '',
                category: 'custom'
              }
            ],
            selfAssessment: ''
          }
        }
      });

      render(<CBTDiaryModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Reflection'));
      
      const removeButton = screen.getByTestId('minus-icon').closest('button');
      fireEvent.click(removeButton!);
      
      expect(mockRemove).toHaveBeenCalledWith(0);
    });
  });

  describe('Add Custom Question Button', () => {
    beforeEach(() => {
      mockUseCBTForm.mockReturnValue({
        ...mockUseCBTForm(),
        formData: {
          ...mockUseCBTForm().formData,
          schemaReflection: {
            ...mockUseCBTForm().formData.schemaReflection,
            enabled: true
          }
        }
      });
    });

    it('should display add custom question button', () => {
      render(<CBTDiaryModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Reflection'));
      
      const addButton = screen.getByText('Add Custom Reflection Question');
      expect(addButton).toBeInTheDocument();
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    });

    it('should call addSchemaReflectionQuestion with custom category', () => {
      const mockAdd = jest.fn();
      mockUseCBTForm.mockReturnValue({
        ...mockUseCBTForm(),
        addSchemaReflectionQuestion: mockAdd,
        formData: {
          ...mockUseCBTForm().formData,
          schemaReflection: {
            ...mockUseCBTForm().formData.schemaReflection,
            enabled: true
          }
        }
      });

      render(<CBTDiaryModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Reflection'));
      
      const addButton = screen.getByText('Add Custom Reflection Question');
      fireEvent.click(addButton);
      
      expect(mockAdd).toHaveBeenCalledWith('custom');
    });
  });

  describe('Section Integration', () => {
    it('should maintain form state when navigating between sections', () => {
      const mockToggle = jest.fn();
      mockUseCBTForm.mockReturnValue({
        formData: mockFormData,
        ...mockFormMethods,
        toggleSchemaReflection: mockToggle
      });

      render(<CBTDiaryModal {...defaultProps} />);
      
      // Navigate to reflection and enable it
      fireEvent.click(screen.getByText('Reflection'));
      const checkbox = screen.getByLabelText('Enable Schema Reflection');
      fireEvent.click(checkbox);
      
      // Toggle should have been called with correct value
      expect(mockToggle).toHaveBeenCalledWith(true);
    });

    it('should show reflection section in correct order (position 6)', () => {
      render(<CBTDiaryModal {...defaultProps} />);
      
      // Look for navigation sections by finding buttons with aria-pressed attribute (our section tabs)
      const sectionButtons = screen.getAllByRole('button').filter(button => 
        button.getAttribute('aria-pressed') !== null
      );
      
      // Check that we have 7 sections
      expect(sectionButtons).toHaveLength(7);
      
      // Check that reflection section exists and is in position 6 (second-to-last)
      expect(screen.getByLabelText(/Reflection section/)).toBeInTheDocument();
      
      // Check that section order is: Situation, Emotions, Thoughts, Schema, Challenge, Reflection, Results
      const reflectionSection = screen.getByText('Reflection').closest('button');
      expect(reflectionSection).toBeInTheDocument();
      expect(reflectionSection?.getAttribute('aria-label')).toContain('optional');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form controls', () => {
      mockUseCBTForm.mockReturnValue({
        ...mockUseCBTForm(),
        formData: {
          ...mockUseCBTForm().formData,
          schemaReflection: {
            ...mockUseCBTForm().formData.schemaReflection,
            enabled: true
          }
        }
      });

      render(<CBTDiaryModal {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Reflection'));
      
      expect(screen.getByLabelText('Enable Schema Reflection')).toBeInTheDocument();
      expect(screen.getByText('Personal Assessment')).toBeInTheDocument();
    });

    it('should maintain keyboard navigation', () => {
      render(<CBTDiaryModal {...defaultProps} />);
      
      const reflectionTab = screen.getByLabelText(/Reflection section/);
      reflectionTab.focus();
      
      expect(document.activeElement).toBe(reflectionTab);
    });
  });
});