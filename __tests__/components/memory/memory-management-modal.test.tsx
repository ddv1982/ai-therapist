/**
 * Tests for MemoryManagementModal component
 */

import { render, screen } from '@testing-library/react';
import { MemoryManagementModal } from '@/features/therapy/memory/memory-management-modal';
import * as memoryUtils from '@/lib/chat/memory-utils';

// Mock the dependencies
jest.mock('@/lib/chat/memory-utils', () => ({
  getMemoryManagementData: jest.fn(),
  deleteMemory: jest.fn(),
  refreshMemoryContext: jest.fn(),
  getSessionReportDetail: jest.fn(),
}));

jest.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

// Mock Dialog components
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
}));

// Mock Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="button">
      {children}
    </button>
  ),
}));

// Mock Card component
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
}));

// Mock session report detail modal
jest.mock('@/features/therapy/memory/session-report-detail-modal', () => ({
  SessionReportDetailModal: ({ open, reportInfo, onOpenChange }: any) =>
    open ? (
      <div data-testid="session-report-detail-modal">
        <h2>{reportInfo?.sessionTitle || 'Detail Modal'}</h2>
        <button onClick={() => onOpenChange(false)}>Close Detail</button>
      </div>
    ) : null,
}));

// Mock lucide icons
jest.mock('lucide-react', () => ({
  Trash2: () => <div data-testid="trash-icon">🗑️</div>,
  AlertTriangle: () => <div data-testid="alert-icon">⚠️</div>,
  Calendar: () => <div data-testid="calendar-icon">📅</div>,
  FileText: () => <div data-testid="file-icon">📄</div>,
  CheckCircle: () => <div data-testid="check-icon">✓</div>,
  Loader2: () => <div data-testid="loader-icon">⏳</div>,
  Brain: () => <div data-testid="brain-icon">🧠</div>,
  RefreshCw: () => <div data-testid="refresh-icon">🔄</div>,
  Eye: () => <div data-testid="eye-icon">👁️</div>,
}));

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
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

    // Component renders successfully with mocked UI
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
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
