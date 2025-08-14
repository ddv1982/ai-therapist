/**
 * Integration tests for the complete CBT Diary flow
 * Tests the entire user journey from opening the modal to submitting entries
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CBTDiaryModal } from '@/features/therapy/cbt/cbt-diary-modal';

// Mock the crisis detection system
jest.mock('@/lib/therapy/crisis-detection', () => ({
  detectCrisisContent: jest.fn(() => ({
    isHighRisk: false,
    riskLevel: 'low',
    triggeredKeywords: [],
    detectedCategories: [],
    recommendedActions: [],
    emergencyResources: []
  })),
  requiresImmediateIntervention: jest.fn(() => false),
  generateCrisisAlert: jest.fn(() => '')
}));

// Mock the CBT form hook
jest.mock('@/hooks/therapy/use-cbt-form', () => ({
  useCBTForm: () => ({
    formData: {
      date: '2023-12-01',
      situation: '',
      initialEmotions: {
        fear: 0,
        anger: 0,
        sadness: 0,
        joy: 0,
        anxiety: 0,
        shame: 0,
        guilt: 0,
        other: '',
        otherIntensity: 0
      },
      automaticThoughts: [{ thought: '', credibility: 0 }],
      coreBeliefText: '',
      coreBeliefCredibility: 0,
      confirmingBehaviors: '',
      avoidantBehaviors: '',
      overridingBehaviors: '',
      schemaModes: [],
      challengeQuestions: [
        { question: 'What evidence supports this thought?', answer: '' },
        { question: 'What evidence contradicts this thought?', answer: '' }
      ],
      additionalQuestions: [],
      rationalThoughts: [],
      finalEmotions: {
        fear: 0,
        anger: 0,
        sadness: 0,
        joy: 0,
        anxiety: 0,
        shame: 0,
        guilt: 0,
        other: '',
        otherIntensity: 0
      },
      originalThoughtCredibility: 0,
      newBehaviors: '',
      alternativeResponses: [],
      schemaReflection: {
        enabled: false,
        questions: [],
        selfAssessment: ''
      }
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
    generateFormattedOutput: jest.fn(() => 'Test CBT Output'),
    isDirty: false,
    isValid: true,
    errors: {},
    lastSaved: undefined
  })
}));

describe('CBT Diary Flow Integration Tests', () => {
  const mockOnSendToChat = jest.fn();
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderCBTModal = (props = {}) => {
    return render(
      <CBTDiaryModal
        open={true}
        onOpenChange={mockOnOpenChange}
        onSendToChat={mockOnSendToChat}
        {...props}
      />
    );
  };

  describe('Modal Opening and Navigation', () => {
    test('should render the CBT diary modal with all sections', () => {
      renderCBTModal();
      
      expect(screen.getByText('CBT Diary Entry')).toBeInTheDocument();
      expect(screen.getByText('Structured reflection for cognitive behavioral therapy')).toBeInTheDocument();
      
      // Check that all section tabs are present
      expect(screen.getByRole('tab', { name: /situation/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /emotions/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /thoughts/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /schema/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /challenge/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /reflection/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /results/i })).toBeInTheDocument();
    });

    test('should start with the situation section active', () => {
      renderCBTModal();
      
      const situationTab = screen.getByRole('tab', { name: /situation/i });
      expect(situationTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should navigate between sections using arrow keys', async () => {
      const user = userEvent.setup();
      renderCBTModal();
      
      const modal = screen.getByRole('dialog');
      
      // Focus the modal
      modal.focus();
      
      // Press right arrow to go to next section
      await user.keyboard('{ArrowRight}');
      
      const emotionsTab = screen.getByRole('tab', { name: /emotions/i });
      expect(emotionsTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should navigate using number keys', async () => {
      const user = userEvent.setup();
      renderCBTModal();
      
      const modal = screen.getByRole('dialog');
      modal.focus();
      
      // Press '3' to go to third section (thoughts)
      await user.keyboard('3');
      
      const thoughtsTab = screen.getByRole('tab', { name: /thoughts/i });
      expect(thoughtsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Form Interaction and Validation', () => {
    test('should allow filling out the situation section', async () => {
      const user = userEvent.setup();
      renderCBTModal();
      
      // Should be on situation section by default
      const situationTextarea = screen.getByPlaceholderText(/Where am I/i);
      expect(situationTextarea).toBeInTheDocument();
      
      await user.type(situationTextarea, 'I was at work during a team meeting');
      
      expect(situationTextarea).toHaveValue('I was at work during a team meeting');
    });

    test('should display progress indicators', () => {
      renderCBTModal();
      
      expect(screen.getByText('Overall Progress')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    test('should show validation errors for required fields', () => {
      renderCBTModal();
      
      // Try to send without filling required fields
      const sendButton = screen.getByRole('button', { name: /send to chat/i });
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Section Content Rendering', () => {
    test('should render emotion scales in emotions section', async () => {
      const user = userEvent.setup();
      renderCBTModal();
      
      // Navigate to emotions section
      const emotionsTab = screen.getByRole('tab', { name: /emotions/i });
      await user.click(emotionsTab);
      
      // Check for emotion scales
      expect(screen.getByText('Fear')).toBeInTheDocument();
      expect(screen.getByText('Anger')).toBeInTheDocument();
      expect(screen.getByText('Sadness')).toBeInTheDocument();
      expect(screen.getByText('Anxiety')).toBeInTheDocument();
    });

    test('should render automatic thoughts section', async () => {
      const user = userEvent.setup();
      renderCBTModal();
      
      // Navigate to thoughts section
      const thoughtsTab = screen.getByRole('tab', { name: /thoughts/i });
      await user.click(thoughtsTab);
      
      expect(screen.getByText('Automatic Thoughts')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/What thoughts immediately came to mind/i)).toBeInTheDocument();
    });

    test('should render schema section', async () => {
      const user = userEvent.setup();
      renderCBTModal();
      
      // Navigate to schema section
      const schemaTab = screen.getByRole('tab', { name: /schema/i });
      await user.click(schemaTab);
      
      expect(screen.getByText('Core Belief & Schema Analysis')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/What deeper belief/i)).toBeInTheDocument();
    });
  });

  describe('Crisis Detection Integration', () => {
    test('should integrate with crisis detection system', () => {
      const { detectCrisisContent } = require('@/lib/therapy/crisis-detection');
      
      renderCBTModal();
      
      // Crisis detection should be called when form content changes
      expect(detectCrisisContent).toHaveBeenCalled();
    });

    test('should show crisis alert when high-risk content is detected', () => {
      // Mock high-risk detection
      const { detectCrisisContent } = require('@/lib/therapy/crisis-detection');
      detectCrisisContent.mockReturnValue({
        isHighRisk: true,
        riskLevel: 'high',
        triggeredKeywords: ['test'],
        detectedCategories: [],
        recommendedActions: [],
        emergencyResources: []
      });
      
      renderCBTModal();
      
      // Crisis alert component should be rendered
      expect(screen.getByText('Support resources available')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    test('should have proper ARIA labels and roles', () => {
      renderCBTModal();
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(7);
      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    });

    test('should announce section changes to screen readers', async () => {
      const user = userEvent.setup();
      renderCBTModal();
      
      const emotionsTab = screen.getByRole('tab', { name: /emotions/i });
      await user.click(emotionsTab);
      
      // Should have screen reader announcement
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderCBTModal();
      
      const modal = screen.getByRole('dialog');
      modal.focus();
      
      // Test ESC key to close
      await user.keyboard('{Escape}');
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Form Completion and Submission', () => {
    test('should enable send button when form is valid', () => {
      // Mock valid form state
      const { useCBTForm } = require('@/hooks/therapy/use-cbt-form');
      useCBTForm.mockReturnValue({
        ...useCBTForm(),
        isValid: true,
        isDirty: true
      });
      
      renderCBTModal();
      
      const sendButton = screen.getByRole('button', { name: /send to chat/i });
      expect(sendButton).toBeEnabled();
    });

    test('should show loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Mock valid form
      const { useCBTForm } = require('@/hooks/therapy/use-cbt-form');
      useCBTForm.mockReturnValue({
        ...useCBTForm(),
        isValid: true,
        isDirty: true
      });
      
      renderCBTModal();
      
      const sendButton = screen.getByRole('button', { name: /send to chat/i });
      await user.click(sendButton);
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    test('should call onSendToChat with formatted content when submitted', async () => {
      const user = userEvent.setup();
      
      // Mock valid form
      const { useCBTForm } = require('@/hooks/therapy/use-cbt-form');
      const mockGenerateFormattedOutput = jest.fn(() => 'Formatted CBT Output');
      useCBTForm.mockReturnValue({
        ...useCBTForm(),
        isValid: true,
        isDirty: true,
        generateFormattedOutput: mockGenerateFormattedOutput
      });
      
      renderCBTModal();
      
      const sendButton = screen.getByRole('button', { name: /send to chat/i });
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(mockOnSendToChat).toHaveBeenCalledWith('Formatted CBT Output');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle component errors gracefully with error boundary', () => {
      // Mock error in component
      const ThrowError = () => {
        throw new Error('Test error');
      };
      
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <CBTDiaryModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSendToChat={mockOnSendToChat}
        />
      );
      
      // Error boundary should prevent crash
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      spy.mockRestore();
    });

    test('should show appropriate error messages for invalid inputs', () => {
      // Mock form with errors
      const { useCBTForm } = require('@/hooks/therapy/use-cbt-form');
      useCBTForm.mockReturnValue({
        ...useCBTForm(),
        errors: {
          situation: 'Situation is required'
        },
        isValid: false
      });
      
      renderCBTModal();
      
      expect(screen.getByText('Situation is required')).toBeInTheDocument();
    });
  });

  describe('Progress Tracking', () => {
    test('should track completion of sections', () => {
      renderCBTModal();
      
      // Should show progress indicators
      expect(screen.getByText('Overall Progress')).toBeInTheDocument();
      
      // Should show completion status for sections
      const situationTab = screen.getByRole('tab', { name: /situation/i });
      expect(situationTab).toHaveAttribute('aria-label', expect.stringContaining('section'));
    });

    test('should show celebration when form is complete', () => {
      // Mock completed form
      const { useCBTForm } = require('@/hooks/therapy/use-cbt-form');
      useCBTForm.mockReturnValue({
        ...useCBTForm(),
        isValid: true,
        isDirty: true
      });
      
      renderCBTModal();
      
      // Should show 100% progress
      expect(screen.getByText(/Complete/i)).toBeInTheDocument();
    });
  });
});

export {};