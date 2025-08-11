/**
 * Tests for MemoryManagementModal component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryManagementModal } from '@/components/memory/memory-management-modal';
import * as memoryUtils from '@/lib/chat/memory-utils';

// Mock the dependencies
jest.mock('@/lib/chat/memory-utils', () => ({
  getMemoryManagementData: jest.fn(),
  deleteMemory: jest.fn(),
  refreshMemoryContext: jest.fn(),
  getSessionReportDetail: jest.fn(),
}));

jest.mock('@/components/ui/primitives/toast', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

jest.mock('@/components/memory/session-report-detail-modal', () => ({
  SessionReportDetailModal: ({ open, reportInfo, onOpenChange }: any) => 
    open ? (
      <div data-testid="session-report-detail-modal">
        <h2>{reportInfo?.sessionTitle || 'Detail Modal'}</h2>
        <button onClick={() => onOpenChange(false)}>Close Detail</button>
      </div>
    ) : null
}));

const mockMemoryUtils = memoryUtils as jest.Mocked<typeof memoryUtils>;

const mockMemoryData = {
  success: true,
  memoryDetails: [
    {
      id: 'report-1',
      sessionId: 'session-1',
      sessionTitle: 'Test Session 1',
      sessionDate: '2024-01-01',
      reportDate: '2024-01-01',
      contentPreview: 'This is a preview of therapeutic insights from session 1...',
      keyInsights: ['Insight 1', 'Insight 2', 'Pattern identified'],
      hasEncryptedContent: true,
      reportSize: 1024,
    },
    {
      id: 'report-2',
      sessionId: 'session-2',
      sessionTitle: 'Test Session 2',
      sessionDate: '2024-01-02',
      reportDate: '2024-01-02',
      contentPreview: 'Another therapeutic session with different insights...',
      keyInsights: ['Growth area', 'Behavioral pattern'],
      hasEncryptedContent: true,
      reportSize: 2048,
    },
  ],
  reportCount: 2,
  stats: {
    totalReportsFound: 2,
    successfullyProcessed: 2,
    failedDecryptions: 0,
    hasMemory: true,
  },
};

const defaultProps = {
  open: true,
  onOpenChange: jest.fn(),
  currentSessionId: 'current-session',
  onMemoryUpdated: jest.fn(),
};

describe('MemoryManagementModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMemoryUtils.getMemoryManagementData.mockResolvedValue(mockMemoryData);
    mockMemoryUtils.getSessionReportDetail.mockResolvedValue(null);
    mockMemoryUtils.deleteMemory.mockResolvedValue({
      success: true,
      deletedCount: 1,
      message: 'Successfully deleted memory',
      deletionType: 'all',
    });
    mockMemoryUtils.refreshMemoryContext.mockResolvedValue({
      hasMemory: false,
      reportCount: 0,
    });
  });

  it('should render modal with memory data', async () => {
    render(<MemoryManagementModal {...defaultProps} />);

    expect(screen.getByText('Therapeutic Memory Management')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Test Session 1')).toBeInTheDocument();
      expect(screen.getByText('Test Session 2')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    mockMemoryUtils.getMemoryManagementData.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<MemoryManagementModal {...defaultProps} />);

    expect(screen.getByText('Loading memory data...')).toBeInTheDocument();
  });

  it('should not call memory data when modal is closed', () => {
    render(<MemoryManagementModal {...defaultProps} open={false} />);

    expect(mockMemoryUtils.getMemoryManagementData).not.toHaveBeenCalled();
  });

});