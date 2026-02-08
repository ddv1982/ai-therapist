import '@testing-library/jest-dom';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithCBT } from '@tests/utils/test-utilities';

const translationCatalog: Record<string, Record<string, string | string[]>> = {
  cbt: {
    'thoughts.prompts': ['Prompt A', 'Prompt B'],
    'thoughts.credibility': 'How much do you believe this thought? (Credibility)',
    'thoughts.entryLabel': 'Automatic Thought',
    'thoughts.next': 'Continue to Core Beliefs',
    'thoughts.placeholder': 'Placeholder',
    'thoughts.addAnother': 'Add another',
    'thoughts.help': 'Help text',
    'thoughts.title': 'Capture automatic thoughts',
    'thoughts.subtitle': 'Completed.',
    'thoughts.promptLabel': 'Common thoughts',
    'slider.credLeft': '0',
    'slider.credCenter': '5',
    'slider.credRight': '10',
  },
};

const translator = ((key: string) => {
  const value = translationCatalog.cbt[key];
  if (Array.isArray(value)) return value;
  return value ?? `cbt.${key}`;
}) as ((key: string) => string | string[]) & { raw: (key: string) => string[] };
translator.raw = (key: string) => {
  const value = translationCatalog.cbt[key];
  return Array.isArray(value) ? value : [];
};

jest.mock('next-intl', () => ({
  __esModule: true,
  useTranslations: () => translator,
  useLocale: () => 'en',
}));

jest.mock('@/features/therapy/components/cbt-step-wrapper', () => ({
  __esModule: true,
  CBTStepWrapper: ({ children, onNext }: { children: React.ReactNode; onNext?: () => void }) => (
    <div>
      <div data-testid="mock-cbt-step-wrapper">{children}</div>
      <button type="button" onClick={onNext}>
        Next
      </button>
    </div>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  __esModule: true,
  Button: ({ children, ...props }: { children: React.ReactNode }) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/textarea', () => ({
  __esModule: true,
  Textarea: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  }) => <textarea value={value} onChange={onChange} />,
}));

jest.mock('@/features/therapy/components/ui/therapy-slider', () => ({
  __esModule: true,
  TherapySlider: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (next: number) => void;
  }) => (
    <input
      type="range"
      aria-label={label}
      min={0}
      max={10}
      step={1}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      data-testid="mock-therapy-slider"
    />
  ),
}));

jest.mock('@/components/ui/card', () => ({
  __esModule: true,
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('lucide-react', () => ({
  __esModule: true,
  Brain: () => <div data-testid="brain-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
  Lightbulb: () => <div data-testid="lightbulb-icon" />,
}));

const sessionDataMock = {
  thoughts: [{ thought: 'Ik kan niemand vertrouwen', credibility: 5 }],
};

const mockUpdateThoughts = jest.fn();

jest.mock('@/hooks/therapy/use-cbt-data-manager', () => ({
  __esModule: true,
  useCBTDataManager: () => ({
    sessionData: sessionDataMock,
    thoughtActions: {
      updateThoughts: mockUpdateThoughts,
    },
    navigation: {
      currentStep: 3,
      canGoNext: true,
      canGoPrevious: false,
      goNext: jest.fn(),
      goPrevious: jest.fn(),
    },
    status: {
      progress: { completedSteps: 3, totalSteps: 9, percentage: 33 },
      isSubmitting: false,
      isDraftSaved: true,
      lastAutoSave: null,
    },
    validation: {
      errors: [],
      clearErrors: jest.fn(),
      setErrors: jest.fn(),
    },
  }),
}));

import { ThoughtRecord } from '@/features/therapy/cbt/chat-components/thought-record';

describe('ThoughtRecord credibility slider', () => {
  it('keeps user-selected value instead of snapping back to defaults', async () => {
    renderWithCBT(
      <ThoughtRecord
        onComplete={jest.fn()}
        initialData={[{ thought: 'Ik kan niemand vertrouwen', credibility: 5 }]}
      />
    );

    const slider = screen.getByTestId('mock-therapy-slider');
    expect(slider).toHaveValue('5');

    fireEvent.change(slider, { target: { value: '7' } });

    await waitFor(() => expect(slider).toHaveValue('7'));
  });

  it('applies prompt chips deterministically and clears selection when typing custom text', async () => {
    renderWithCBT(
      <ThoughtRecord onComplete={jest.fn()} initialData={[{ thought: '', credibility: 5 }]} />
    );

    const promptAButton = screen.getByRole('button', { name: 'Prompt A' });
    const textarea = screen.getAllByRole('textbox')[0];

    fireEvent.click(promptAButton);

    await waitFor(() => {
      expect(textarea).toHaveValue('Prompt A');
      expect(promptAButton).toHaveAttribute('variant', 'default');
    });

    fireEvent.change(textarea, { target: { value: 'Custom thought' } });

    await waitFor(() => {
      expect(promptAButton).toHaveAttribute('variant', 'outline');
      expect(textarea).toHaveValue('Custom thought');
    });
  });

  it('keeps prompt-selection index mapping stable after add and remove', async () => {
    renderWithCBT(
      <ThoughtRecord onComplete={jest.fn()} initialData={[{ thought: '', credibility: 5 }]} />
    );

    const firstTextareaBefore = screen.getAllByRole('textbox')[0];
    const originalFirstValue = (firstTextareaBefore as HTMLTextAreaElement).value;

    fireEvent.click(screen.getByRole('button', { name: 'Add another' }));

    await waitFor(() => expect(screen.getAllByRole('textbox')).toHaveLength(2));

    fireEvent.click(screen.getByRole('button', { name: 'Prompt B' }));

    await waitFor(() => {
      const textareas = screen.getAllByRole('textbox');
      expect(textareas[0]).toHaveValue(originalFirstValue);
      expect(textareas[1]).toHaveValue('Prompt B');
    });

    const removeButtons = screen.getAllByTestId('minus-icon');
    const removeButton = removeButtons[removeButtons.length - 1]?.closest('button');
    expect(removeButton).not.toBeNull();
    fireEvent.click(removeButton as HTMLButtonElement);

    await waitFor(() => expect(screen.getAllByRole('textbox')).toHaveLength(1));
  });
});
