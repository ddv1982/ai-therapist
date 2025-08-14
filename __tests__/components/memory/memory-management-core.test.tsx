/**
 * Core functionality tests for MemoryManagementModal component
 * Tests the essential business logic without complex UI interactions
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryManagementModal } from '@/features/therapy/memory/memory-management-modal';
import * as memoryUtils from '@/lib/chat/memory-utils';

// Mock the dependencies
jest.mock('@/lib/chat/memory-utils', () => ({
  getMemoryManagementData: jest.fn(),
  deleteMemory: jest.fn(),
  refreshMemoryContext: jest.fn(),
}));

jest.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
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
  ],
  reportCount: 1,
  stats: {
    totalReportsFound: 1,
    successfullyProcessed: 1,
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

describe('MemoryManagementModal Core', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMemoryUtils.getMemoryManagementData.mockResolvedValue(mockMemoryData);
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

  it('should render modal with correct title', async () => {
    render(<MemoryManagementModal {...defaultProps} />);

    expect(screen.getByText('Therapeutic Memory Management')).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    mockMemoryUtils.getMemoryManagementData.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<MemoryManagementModal {...defaultProps} />);

    expect(screen.getByText('Loading memory data...')).toBeInTheDocument();
  });

  it('should call getMemoryManagementData with correct parameters', async () => {
    render(<MemoryManagementModal {...defaultProps} />);

    await waitFor(() => {
      expect(mockMemoryUtils.getMemoryManagementData).toHaveBeenCalledWith('current-session');
    });
  });

  it('should display session data when loaded', async () => {
    render(<MemoryManagementModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Test Session 1')).toBeInTheDocument();
    });

    expect(screen.getByText(/This is a preview of therapeutic insights/)).toBeInTheDocument();
  });

  it('should show no memory state when no data exists', async () => {
    mockMemoryUtils.getMemoryManagementData.mockResolvedValue({
      success: true,
      memoryDetails: [],
      reportCount: 0,
      stats: {
        totalReportsFound: 0,
        successfullyProcessed: 0,
        failedDecryptions: 0,
        hasMemory: false,
      },
    });

    render(<MemoryManagementModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No Memory Data')).toBeInTheDocument();
    });

    expect(screen.getByText(/You don't have any therapeutic session reports/)).toBeInTheDocument();
  });

  it('should not call memory data when modal is closed', () => {
    render(<MemoryManagementModal {...defaultProps} open={false} />);

    expect(mockMemoryUtils.getMemoryManagementData).not.toHaveBeenCalled();
  });

  it('should show correct report count in description', async () => {
    render(<MemoryManagementModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Currently storing 1 session reports/)).toBeInTheDocument();
    });
  });

  it('should display report details correctly', async () => {
    render(<MemoryManagementModal {...defaultProps} />);

    await waitFor(() => {
      // Check session title
      expect(screen.getByText('Test Session 1')).toBeInTheDocument();

      // Check content preview
      expect(screen.getByText(/This is a preview of therapeutic insights/)).toBeInTheDocument();

      // Check key insights
      expect(screen.getByText('Insight 1')).toBeInTheDocument();

      // Check file size
      expect(screen.getByText('1.0 KB')).toBeInTheDocument();

      // Check encryption status
      expect(screen.getByText('Encrypted')).toBeInTheDocument();
    });
  });

  it('should show quick action buttons when memory exists', async () => {
    render(<MemoryManagementModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Test Session 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Clear All Memory')).toBeInTheDocument();
    expect(screen.getByText('Clear Recent (3)')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('should handle error loading memory data', async () => {
    mockMemoryUtils.getMemoryManagementData.mockRejectedValue(new Error('Load failed'));

    render(<MemoryManagementModal {...defaultProps} />);

    // Should show loading state while failing to load
    expect(screen.getByText('Loading memory data...')).toBeInTheDocument();
    
    // Should handle the error gracefully - the component should show an error state or fail gracefully
    await waitFor(() => {
      // The component should handle the error and not crash
      expect(mockMemoryUtils.getMemoryManagementData).toHaveBeenCalled();
    });
  });
});