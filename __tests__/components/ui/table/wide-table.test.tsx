import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import {
  WideTable,
  ColumnManager,
  PriorityPlusIndicator,
  useWideTableContext,
} from '@/components/ui/table/wide-table';
import {
  WideColumnDefinition,
  ColumnVisibilityState,
} from '@/components/ui/table/table-types';

// Mock CSS imports
jest.mock('@/components/ui/table/table-styles.css', () => ({}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Wide Table Components', () => {
  // Test data setup
  const mockColumns: WideColumnDefinition[] = [
    {
      id: 'patient',
      header: 'Patient Name',
      type: 'content',
      priority: 'high',
      alwaysVisible: true,
    },
    {
      id: 'session',
      header: 'Session #',
      type: 'priority',
      priority: 'high',
    },
    {
      id: 'date',
      header: 'Date',
      type: 'default',
      priority: 'medium',
    },
    {
      id: 'mood',
      header: 'Mood Score',
      type: 'metric',
      priority: 'medium',
    },
    {
      id: 'notes',
      header: 'Notes',
      type: 'content',
      priority: 'low',
    },
    {
      id: 'followup',
      header: 'Follow-up',
      type: 'label',
      priority: 'low',
      hiddenByDefault: true,
    },
  ];

  const mockVisibilityState: ColumnVisibilityState = {
    patient: { visible: true, order: 0 },
    session: { visible: true, order: 1 },
    date: { visible: true, order: 2 },
    mood: { visible: false, order: 3 },
    notes: { visible: false, order: 4 },
    followup: { visible: false, order: 5 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('ColumnManager', () => {
    const mockProps = {
      columns: mockColumns,
      visibilityState: mockVisibilityState,
      onVisibilityChange: jest.fn(),
      onOrderChange: jest.fn(),
      onReset: jest.fn(),
    };

    it('should render with correct visible column count', () => {
      render(<ColumnManager {...mockProps} />);
      
      const button = screen.getByLabelText('Manage table columns');
      expect(button).toHaveTextContent('Columns (3/6)');
    });

    it('should show dropdown when toggle button is clicked', async () => {
      const user = userEvent.setup();
      render(<ColumnManager {...mockProps} />);
      
      const button = screen.getByLabelText('Manage table columns');
      await user.click(button);
      
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByText('Reset to default')).toBeInTheDocument();
    });

    it('should display all columns with correct visibility state', async () => {
      const user = userEvent.setup();
      render(<ColumnManager {...mockProps} />);
      
      const button = screen.getByLabelText('Manage table columns');
      await user.click(button);
      
      // Check each column is displayed
      expect(screen.getByText('Patient Name')).toBeInTheDocument();
      expect(screen.getByText('Session #')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Mood Score')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Follow-up')).toBeInTheDocument();
      
      // Check checkboxes reflect visibility state
      const patientCheckbox = screen.getByLabelText(/Patient Name/);
      const sessionCheckbox = screen.getByLabelText(/Session #/);
      const moodCheckbox = screen.getByLabelText(/Mood Score/);
      
      expect(patientCheckbox).toBeChecked();
      expect(sessionCheckbox).toBeChecked();
      expect(moodCheckbox).not.toBeChecked();
    });

    it('should show priority labels for columns', async () => {
      const user = userEvent.setup();
      render(<ColumnManager {...mockProps} />);
      
      const button = screen.getByLabelText('Manage table columns');
      await user.click(button);
      
      expect(screen.getAllByText('(high)')).toHaveLength(2); // Two columns have high priority
      expect(screen.getAllByText('(medium)')).toHaveLength(2); // Two columns have medium priority
      expect(screen.getAllByText('(low)')).toHaveLength(2); // Two columns have low priority
    });

    it('should prevent toggling of alwaysVisible columns', async () => {
      const user = userEvent.setup();
      render(<ColumnManager {...mockProps} />);
      
      const button = screen.getByLabelText('Manage table columns');
      await user.click(button);
      
      // Patient column has alwaysVisible: true
      const patientOption = screen.getByText('Patient Name').closest('label');
      expect(patientOption).toHaveClass('opacity-50', 'cursor-not-allowed');
      
      const patientCheckbox = screen.getByLabelText(/Patient Name/);
      expect(patientCheckbox).toBeDisabled();
    });

    it('should call onVisibilityChange when toggling column', async () => {
      const user = userEvent.setup();
      render(<ColumnManager {...mockProps} />);
      
      const button = screen.getByLabelText('Manage table columns');
      await user.click(button);
      
      const moodCheckbox = screen.getByLabelText(/Mood Score/);
      await user.click(moodCheckbox);
      
      expect(mockProps.onVisibilityChange).toHaveBeenCalledWith('mood', true);
    });

    it('should call onReset when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<ColumnManager {...mockProps} />);
      
      const button = screen.getByLabelText('Manage table columns');
      await user.click(button);
      
      const resetButton = screen.getByText('Reset to default');
      await user.click(resetButton);
      
      expect(mockProps.onReset).toHaveBeenCalled();
    });

    it('should accept custom className', () => {
      render(<ColumnManager {...mockProps} className="custom-manager" />);
      
      const container = screen.getByLabelText('Manage table columns').parentElement;
      expect(container).toHaveClass('column-manager');
      expect(container).toHaveClass('custom-manager');
    });
  });

  describe('PriorityPlusIndicator', () => {
    const hiddenColumns: WideColumnDefinition[] = [
      mockColumns[4], // notes
      mockColumns[5], // followup
    ];

    const mockProps = {
      hiddenCount: 2,
      hiddenColumns,
      onShowHidden: jest.fn(),
    };

    it('should render hidden column count', () => {
      render(<PriorityPlusIndicator {...mockProps} />);
      
      const button = screen.getByText('+2 more');
      expect(button).toBeInTheDocument();
    });

    it('should not render when hiddenCount is 0', () => {
      render(<PriorityPlusIndicator {...mockProps} hiddenCount={0} />);
      
      expect(screen.queryByText('+2 more')).not.toBeInTheDocument();
    });

    it('should have proper aria-label with hidden column names', () => {
      render(<PriorityPlusIndicator {...mockProps} />);
      
      const button = screen.getByText('+2 more');
      expect(button).toHaveAttribute(
        'aria-label',
        'Show 2 hidden columns: Notes, Follow-up'
      );
    });

    it('should call onShowHidden when clicked', async () => {
      const user = userEvent.setup();
      render(<PriorityPlusIndicator {...mockProps} />);
      
      const button = screen.getByText('+2 more');
      await user.click(button);
      
      expect(mockProps.onShowHidden).toHaveBeenCalled();
    });

    it('should accept custom className', () => {
      render(<PriorityPlusIndicator {...mockProps} className="custom-indicator" />);
      
      const button = screen.getByText('+2 more');
      expect(button).toHaveClass('priority-plus-indicator');
      expect(button).toHaveClass('custom-indicator');
    });
  });

  describe('WideTable', () => {
    const defaultProps = {
      columns: mockColumns.slice(0, 5), // Use 5 columns for wide table
    };

    it('should render with default props', () => {
      render(<WideTable {...defaultProps} />);
      
      const table = screen.getByRole('table');
      expect(table).toHaveClass('therapeutic-table');
      expect(table).toHaveClass('table-priority-plus');
    });

    it('should render column manager by default', () => {
      render(<WideTable {...defaultProps} />);
      
      expect(screen.getByLabelText('Manage table columns')).toBeInTheDocument();
    });

    it('should not render column manager when showColumnManager is false', () => {
      render(<WideTable {...defaultProps} showColumnManager={false} />);
      
      expect(screen.queryByLabelText('Manage table columns')).not.toBeInTheDocument();
    });

    it('should generate headers from column definitions', () => {
      render(<WideTable {...defaultProps} />);
      
      expect(screen.getByText('Patient Name')).toBeInTheDocument();
      expect(screen.getByText('Session #')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Mood Score')).toBeInTheDocument();
    });

    it('should apply data-priority attributes to headers', () => {
      render(<WideTable {...defaultProps} />);
      
      const patientHeader = screen.getByText('Patient Name');
      expect(patientHeader).toHaveAttribute('data-priority', 'high');
      
      const sessionHeader = screen.getByText('Session #');
      expect(sessionHeader).toHaveAttribute('data-priority', 'high');
    });

    it('should apply column type classes to headers', () => {
      render(<WideTable {...defaultProps} />);
      
      const patientHeader = screen.getByText('Patient Name');
      expect(patientHeader).toHaveClass('column-content');
      
      const sessionHeader = screen.getByText('Session #');
      expect(sessionHeader).toHaveClass('column-priority');
      
      const moodHeader = screen.getByText('Mood Score');
      expect(moodHeader).toHaveClass('column-metric');
    });

    it('should handle different strategies', () => {
      const strategies = [
        { strategy: 'priority-plus' as const, expectedClass: 'table-priority-plus' },
        { strategy: 'adaptive-cards' as const, expectedClass: 'table-adaptive-cards' },
        { strategy: 'column-toggle' as const, expectedClass: 'table-column-toggle' },
      ];

      strategies.forEach(({ strategy, expectedClass }) => {
        const { unmount } = render(
          <WideTable {...defaultProps} strategy={strategy} />
        );
        
        const table = screen.getByRole('table');
        expect(table).toHaveClass(expectedClass);
        
        unmount();
      });
    });

    it('should auto-detect strategy when strategy is "auto"', () => {
      render(<WideTable {...defaultProps} strategy="auto" />);
      
      const table = screen.getByRole('table');
      // With 5 columns, should default to priority-plus
      expect(table).toHaveClass('table-priority-plus');
    });

    it('should limit visible columns based on maxVisibleColumns', () => {
      render(<WideTable {...defaultProps} maxVisibleColumns={3} />);
      
      // Should show first 3 high priority columns
      expect(screen.getByText('Patient Name')).toBeInTheDocument();
      expect(screen.getByText('Session #')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      
      // Lower priority column should be hidden initially
      expect(screen.queryByText('Notes')).not.toBeInTheDocument();
    });

    it('should handle column visibility changes', async () => {
      const user = userEvent.setup();
      const onColumnVisibilityChange = jest.fn();
      
      render(
        <WideTable 
          {...defaultProps} 
          onColumnVisibilityChange={onColumnVisibilityChange}
        />
      );
      
      // Open column manager
      const managerButton = screen.getByLabelText('Manage table columns');
      await user.click(managerButton);
      
      // Toggle a column
      const notesCheckbox = screen.getByLabelText(/Notes/);
      await user.click(notesCheckbox);
      
      expect(onColumnVisibilityChange).toHaveBeenCalledWith('notes', true);
    });

    it('should persist column preferences when enabled', async () => {
      const user = userEvent.setup();
      
      render(
        <WideTable 
          {...defaultProps} 
          persistColumnPreferences={true}
        />
      );
      
      // Open column manager
      const managerButton = screen.getByLabelText('Manage table columns');
      await user.click(managerButton);
      
      // Toggle a column
      const notesCheckbox = screen.getByLabelText(/Notes/);
      await user.click(notesCheckbox);
      
      // Should call localStorage.setItem
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'table-columns-patient', // Based on first column ID
        expect.any(String)
      );
    });

    it('should apply wide table container classes', () => {
      render(<WideTable {...defaultProps} />);
      
      const container = screen.getByRole('table').closest('.table-container');
      expect(container).toHaveClass('table-container');
      expect(container).toHaveClass('table-system');
      expect(container).toHaveClass('wide-table-container');
    });

    it('should handle initial column visibility state', () => {
      const initialVisibility: ColumnVisibilityState = {
        patient: { visible: true, order: 0 },
        session: { visible: false, order: 1 },
        date: { visible: true, order: 2 },
        mood: { visible: true, order: 3 },
        notes: { visible: false, order: 4 },
      };
      
      render(
        <WideTable 
          {...defaultProps} 
          initialColumnVisibility={initialVisibility}
        />
      );
      
      // Should respect initial visibility
      expect(screen.getByText('Patient Name')).toBeInTheDocument();
      expect(screen.queryByText('Session #')).not.toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Mood Score')).toBeInTheDocument();
    });

    it('should render custom children when provided', () => {
      render(
        <WideTable {...defaultProps}>
          <thead>
            <tr>
              <th>Custom Header</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Custom Cell</td>
            </tr>
          </tbody>
        </WideTable>
      );
      
      expect(screen.getByText('Custom Header')).toBeInTheDocument();
      expect(screen.getByText('Custom Cell')).toBeInTheDocument();
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLTableElement>();
      
      render(<WideTable {...defaultProps} ref={ref} />);
      
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('TABLE');
    });

    it('should handle accessibility attributes', () => {
      render(
        <WideTable 
          {...defaultProps} 
          columnNavigationLabel="Custom navigation label"
          hiddenColumnsAnnouncement="2 columns are hidden"
        />
      );
      
      const container = screen.getByLabelText('Custom navigation label');
      expect(container).toBeInTheDocument();
      
      const announcement = screen.getByText('2 columns are hidden');
      expect(announcement).toHaveClass('sr-only');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('useWideTableContext Hook', () => {
    it('should throw error when used outside WideTable', () => {
      function TestComponent() {
        useWideTableContext();
        return <div>Test</div>;
      }
      
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // The error boundary should catch the error
      const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
        try {
          return <>{children}</>;
        } catch (error) {
          return <div>Error: {(error as Error).message}</div>;
        }
      };
      
      render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );
      
      // The error should be thrown during rendering
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should provide context values when used within WideTable', () => {
      function TestComponent() {
        const context = useWideTableContext();
        
        return (
          <div>
            <div data-testid="strategy">{context.strategy}</div>
            <div data-testid="column-count">{context.columnCount}</div>
            <div data-testid="visible-count">{context.visibleColumnCount}</div>
            <div data-testid="is-wide">{context.isWide.toString()}</div>
          </div>
        );
      }
      
      render(
        <WideTable columns={mockColumns.slice(0, 5)} strategy="priority-plus">
          <TestComponent />
        </WideTable>
      );
      
      expect(screen.getByTestId('strategy')).toHaveTextContent('priority-plus');
      expect(screen.getByTestId('column-count')).toHaveTextContent('5');
      expect(screen.getByTestId('visible-count')).toHaveTextContent('4'); // Based on default max visible
      expect(screen.getByTestId('is-wide')).toHaveTextContent('true');
    });
  });

  describe('Priority Calculation', () => {
    it('should auto-calculate priorities for columns without explicit priority', () => {
      const columnsWithoutPriority: WideColumnDefinition[] = [
        { id: 'col1', header: 'Column 1', type: 'priority' },
        { id: 'col2', header: 'Column 2', type: 'content' },
        { id: 'col3', header: 'Column 3', type: 'metric' },
        { id: 'col4', header: 'Column 4', type: 'label' },
        { id: 'col5', header: 'Column 5', type: 'default' },
      ];
      
      render(<WideTable columns={columnsWithoutPriority} />);
      
      // First columns should get higher priority due to position
      const col1Header = screen.getByText('Column 1');
      const col5Header = screen.getByText('Column 5');
      
      // These should have data-priority attributes calculated based on type and position
      expect(col1Header).toHaveAttribute('data-priority');
      expect(col5Header).toHaveAttribute('data-priority');
    });
  });

  describe('Column Ordering', () => {
    it('should sort visible columns by order property', () => {
      const customVisibility: ColumnVisibilityState = {
        patient: { visible: true, order: 2 },
        session: { visible: true, order: 0 },
        date: { visible: true, order: 1 },
        mood: { visible: false, order: 3 },
        notes: { visible: false, order: 4 },
      };
      
      render(
        <WideTable 
          columns={mockColumns.slice(0, 5)} 
          initialColumnVisibility={customVisibility}
        />
      );
      
      const headers = screen.getAllByRole('columnheader');
      expect(headers[0]).toHaveTextContent('Session #'); // order: 0
      expect(headers[1]).toHaveTextContent('Date'); // order: 1
      expect(headers[2]).toHaveTextContent('Patient Name'); // order: 2
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty columns array', () => {
      render(<WideTable columns={[]} />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should handle columns with missing properties', () => {
      const minimalColumns: WideColumnDefinition[] = [
        { id: 'col1', header: 'Column 1', type: 'default' },
        { id: 'col2', header: 'Column 2', type: 'content' },
      ];
      
      render(<WideTable columns={minimalColumns} />);
      
      expect(screen.getByText('Column 1')).toBeInTheDocument();
      expect(screen.getByText('Column 2')).toBeInTheDocument();
    });

    it('should handle very large maxVisibleColumns', () => {
      render(
        <WideTable 
          columns={mockColumns.slice(0, 3)} 
          maxVisibleColumns={100}
        />
      );
      
      // Should show all columns when maxVisible > total columns
      expect(screen.getByText('Patient Name')).toBeInTheDocument();
      expect(screen.getByText('Session #')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
    });
  });
});