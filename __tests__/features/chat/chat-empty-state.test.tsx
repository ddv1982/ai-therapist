import { render, screen } from '@testing-library/react';
import { ChatEmptyState } from '@/features/chat/components/dashboard/chat-empty-state';

describe('ChatEmptyState', () => {
  const mockTranslate = (key: string) => {
    const translations: Record<string, string> = {
      'empty.welcome': 'Welcome to Your Therapeutic Space',
      'empty.tagline': 'A safe space for healing and growth',
      'moon.phase.new': 'New Moon',
      'moon.illumination': 'Illum.',
    };
    return translations[key] || key;
  };

  beforeEach(() => {
    // Freeze time to a specific date (e.g., New Moon Jan 6 2000)
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2000-01-06T12:24:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('exposes a React component', () => {
    expect(ChatEmptyState).toBeDefined();
  });

  it('renders welcome text', () => {
    render(<ChatEmptyState isMobile={false} translate={mockTranslate} />);
    expect(screen.getByText('Welcome to Your Therapeutic Space')).toBeInTheDocument();
    // Subtitle text moved to i18n translation system
  });

  it('renders realistic moon illustration', () => {
    const { container } = render(<ChatEmptyState isMobile={false} translate={mockTranslate} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 200 200');
  });

  it('renders moon phase info', () => {
     render(<ChatEmptyState isMobile={false} translate={mockTranslate} />);
     expect(screen.getByText(/Illum\./)).toBeInTheDocument();
     expect(screen.getByText(/New Moon/)).toBeInTheDocument();
  });

  it('applies mobile layout when isMobile prop is true', () => {
    const { container } = render(<ChatEmptyState isMobile={true} translate={mockTranslate} />);
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('py-8');
  });

  it('applies desktop layout when isMobile prop is false', () => {
    const { container } = render(<ChatEmptyState isMobile={false} translate={mockTranslate} />);
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('py-16');
  });

  it('scales illustration size based on isMobile prop', () => {
    const { container: mobileContainer } = render(
      <ChatEmptyState isMobile={true} translate={mockTranslate} />
    );
    const mobileSvg = mobileContainer.querySelector('svg');
    expect(mobileSvg).toHaveAttribute('width', '180');

    const { container: desktopContainer } = render(
      <ChatEmptyState isMobile={false} translate={mockTranslate} />
    );
    const desktopSvg = desktopContainer.querySelector('svg');
    expect(desktopSvg).toHaveAttribute('width', '240');
  });

  it('matches snapshot for desktop', () => {
    const { container } = render(<ChatEmptyState isMobile={false} translate={mockTranslate} />);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot for mobile', () => {
    const { container } = render(<ChatEmptyState isMobile={true} translate={mockTranslate} />);
    expect(container).toMatchSnapshot();
  });
});
