/**
 * Tests for SessionReportViewer component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SessionReportViewer } from '@/features/therapy/memory/session-report-viewer';
import type { SessionReportDetail } from '@/lib/chat/memory-utils';

// Mock the message components
jest.mock('@/features/chat/messages/message-content', () => ({
  MessageContent: ({ content, role }: any) => (
    <div data-testid="message-content" data-role={role}>
      {content}
    </div>
  ),
}));

jest.mock('@/features/chat/messages/message-avatar', () => ({
  MessageAvatar: ({ role }: any) => (
    <div data-testid="message-avatar" data-role={role}>
      Avatar for {role}
    </div>
  ),
}));

jest.mock('@/features/chat/messages/message-timestamp', () => ({
  MessageTimestamp: ({ timestamp, role }: any) => (
    <div data-testid="message-timestamp" data-role={role}>
      {timestamp.toDateString()}
    </div>
  ),
}));

jest.mock('@/lib/design-system/message', () => ({
  buildMessageClasses: jest.fn((role: string, type: string) => `mock-${role}-${type}-class`),
}));

// Mock lucide-react icons 
jest.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="calendar-icon">📅</div>,
  FileText: () => <div data-testid="file-icon">📄</div>,
  CheckCircle: () => <div data-testid="check-icon">✅</div>,
  Brain: () => <div data-testid="brain-icon">🧠</div>,
  Heart: () => <div data-testid="heart-icon">❤️</div>,
  Target: () => <div data-testid="target-icon">🎯</div>,
  Users: () => <div data-testid="users-icon">👥</div>,
  Activity: () => <div data-testid="activity-icon">📊</div>,
}));

const mockReportDetail: SessionReportDetail = {
  id: 'report-1',
  sessionId: 'session-1',
  sessionTitle: 'Anxiety Management Session',
  sessionDate: '2024-01-15',
  reportDate: '2024-01-15',
  fullContent: '# Therapeutic Session Summary\n\nThis session focused on **cognitive behavioral techniques** for managing anxiety. The client showed significant progress in:\n\n- Understanding thought patterns\n- Implementing breathing exercises\n- Developing coping strategies\n\n## Key Takeaways\n\n1. Practice daily mindfulness\n2. Challenge negative thoughts\n3. Use grounding techniques\n\nThe client expressed feeling more confident about managing anxiety symptoms.',
  keyInsights: [
    'Significant progress in CBT techniques',
    'Improved understanding of thought patterns',
    'Increased confidence in anxiety management',
    'Successfully implementing breathing exercises'
  ],
  reportSize: 2048,
};

describe('SessionReportViewer', () => {
  describe('Component rendering', () => {
    it('should render session report header with metadata', () => {
      render(<SessionReportViewer reportDetail={mockReportDetail} />);

      // Session title
      expect(screen.getByText('Anxiety Management Session')).toBeInTheDocument();
      
      // Session dates
      expect(screen.getByText('Session: 2024-01-15')).toBeInTheDocument();
      expect(screen.getByText('Report: 2024-01-15')).toBeInTheDocument();
      
      // File size
      expect(screen.getByText('2.0 KB')).toBeInTheDocument();
      
      // Encryption status
      expect(screen.getByText('Encrypted Content')).toBeInTheDocument();
    });

    it('should render key insights section', () => {
      render(<SessionReportViewer reportDetail={mockReportDetail} />);

      expect(screen.getByText('Key Therapeutic Insights')).toBeInTheDocument();
      // Check if insights are rendered as badge elements (they may be truncated at 40 chars)
      const cbtInsights = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('Significant progress in CBT');
      });
      expect(cbtInsights.length).toBeGreaterThan(0);
      
      const thoughtInsights = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('Improved understanding of thought');
      });
      expect(thoughtInsights.length).toBeGreaterThan(0);
    });

    it('should render session content with message components', () => {
      render(<SessionReportViewer reportDetail={mockReportDetail} />);

      // Should use MessageContent component
      const messageContent = screen.getByTestId('message-content');
      expect(messageContent).toBeInTheDocument();
      expect(messageContent).toHaveAttribute('data-role', 'assistant');
      // Check content with normalized whitespace
      expect(messageContent.textContent?.replace(/\s+/g, ' ').trim()).toBe(
        mockReportDetail.fullContent.replace(/\s+/g, ' ').trim()
      );

      // Should use MessageAvatar component
      const messageAvatar = screen.getByTestId('message-avatar');
      expect(messageAvatar).toBeInTheDocument();
      expect(messageAvatar).toHaveAttribute('data-role', 'assistant');

      // Should use MessageTimestamp component
      const messageTimestamp = screen.getByTestId('message-timestamp');
      expect(messageTimestamp).toBeInTheDocument();
      expect(messageTimestamp).toHaveAttribute('data-role', 'assistant');
    });

    it('should handle long insights with truncation', () => {
      const longInsightReport = {
        ...mockReportDetail,
        keyInsights: [
          'This is a very long therapeutic insight that should be truncated when it exceeds forty characters in length',
          'Short insight',
        ],
      };

      render(<SessionReportViewer reportDetail={longInsightReport} />);

      // Long insight should be truncated - check for truncated text with ellipsis
      const truncatedInsights = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('This is a very long therapeutic insight') && 
               element?.textContent?.includes('...');
      });
      expect(truncatedInsights.length).toBeGreaterThan(0);
      // Short insight should not be truncated
      const shortInsights = screen.getAllByText((content, element) => {
        return element?.textContent === 'Short insight';
      });
      expect(shortInsights.length).toBeGreaterThan(0);
    });

    it('should not render key insights section when empty', () => {
      const noInsightsReport = {
        ...mockReportDetail,
        keyInsights: [],
      };

      render(<SessionReportViewer reportDetail={noInsightsReport} />);

      expect(screen.queryByText('Key Therapeutic Insights')).not.toBeInTheDocument();
    });
  });

  describe('File size formatting', () => {
    it('should format bytes correctly', () => {
      const smallReport = { ...mockReportDetail, reportSize: 512 };
      render(<SessionReportViewer reportDetail={smallReport} />);
      
      expect(screen.getByText('512 B')).toBeInTheDocument();
    });

    it('should format kilobytes correctly', () => {
      const kbReport = { ...mockReportDetail, reportSize: 1536 }; // 1.5 KB
      render(<SessionReportViewer reportDetail={kbReport} />);
      
      expect(screen.getByText('1.5 KB')).toBeInTheDocument();
    });

    it('should format megabytes correctly', () => {
      const mbReport = { ...mockReportDetail, reportSize: 1572864 }; // 1.5 MB
      render(<SessionReportViewer reportDetail={mbReport} />);
      
      expect(screen.getByText('1.5 MB')).toBeInTheDocument();
    });
  });

  describe('Styling and theming', () => {
    it('should apply consistent therapeutic styling classes', () => {
      const { container } = render(<SessionReportViewer reportDetail={mockReportDetail} />);

      // Should have therapeutic typography classes (updated for new design system)
      expect(container.querySelector('.text-xl')).toBeInTheDocument();
      expect(container.querySelector('.text-sm')).toBeInTheDocument();
      
      // Should have proper spacing classes
      expect(container.querySelector('.spacing-md')).toBeInTheDocument();
      expect(container.querySelector('.spacing-sm')).toBeInTheDocument();
    });

    it('should use card styling for sections', () => {
      const { container } = render(<SessionReportViewer reportDetail={mockReportDetail} />);

      const cards = container.querySelectorAll('.bg-card');
      expect(cards.length).toBeGreaterThan(0);
      
      // Should have border styling
      const borderedElements = container.querySelectorAll('.border-border');
      expect(borderedElements.length).toBeGreaterThan(0);
    });

    it('should apply custom className when provided', () => {
      const { container } = render(
        <SessionReportViewer reportDetail={mockReportDetail} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Content structure', () => {
    it('should have proper semantic HTML structure', () => {
      render(<SessionReportViewer reportDetail={mockReportDetail} />);

      // Should have article element for content
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
      expect(article).toHaveAttribute('aria-label', 'Therapeutic session report content');

      // Should have proper headings hierarchy
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('Anxiety Management Session');

      const subHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(subHeadings.length).toBeGreaterThan(0);
    });

    it('should display metadata in organized sections', () => {
      render(<SessionReportViewer reportDetail={mockReportDetail} />);

      // Session info should be in a grid layout
      const sessionDate = screen.getByText('Session: 2024-01-15');
      const reportDate = screen.getByText('Report: 2024-01-15');
      
      expect(sessionDate.closest('.grid')).toBeInTheDocument();
      expect(reportDate.closest('.grid')).toBeInTheDocument();
    });
  });

  describe('Integration with message system', () => {
    it('should pass correct props to MessageContent', () => {
      render(<SessionReportViewer reportDetail={mockReportDetail} />);

      const messageContent = screen.getByTestId('message-content');
      expect(messageContent).toHaveAttribute('data-role', 'assistant');
      // Check if content contains the main therapeutic content (whitespace normalization)
      expect(messageContent.textContent?.replace(/\s+/g, ' ').trim()).toBe(
        mockReportDetail.fullContent.replace(/\s+/g, ' ').trim()
      );
    });

    it('should pass correct props to MessageAvatar', () => {
      render(<SessionReportViewer reportDetail={mockReportDetail} />);

      const messageAvatar = screen.getByTestId('message-avatar');
      expect(messageAvatar).toHaveAttribute('data-role', 'assistant');
    });

    it('should pass correct props to MessageTimestamp', () => {
      render(<SessionReportViewer reportDetail={mockReportDetail} />);

      const messageTimestamp = screen.getByTestId('message-timestamp');
      expect(messageTimestamp).toHaveAttribute('data-role', 'assistant');
      // Should convert date string to Date object
      expect(messageTimestamp).toHaveTextContent('Mon Jan 15 2024');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<SessionReportViewer reportDetail={mockReportDetail} />);

      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-label', 'Therapeutic session report content');
    });

    it('should have descriptive text for screen readers', () => {
      render(<SessionReportViewer reportDetail={mockReportDetail} />);

      expect(screen.getByText('Session Report Content')).toBeInTheDocument();
      expect(screen.getByText('Key Therapeutic Insights')).toBeInTheDocument();
    });
  });
});