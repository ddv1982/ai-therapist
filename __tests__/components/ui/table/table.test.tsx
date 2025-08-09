import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  CompleteTable,
  useTableResponsive,
} from '@/components/ui/table/table';

// Mock CSS imports
jest.mock('@/components/ui/table/table-styles.css', () => ({}));

describe('Table Components', () => {
  describe('TableContainer', () => {
    it('should render with default classes', () => {
      render(
        <TableContainer>
          <div>Test content</div>
        </TableContainer>
      );
      
      const container = screen.getByText('Test content').parentElement;
      expect(container).toHaveClass('table-container');
      expect(container).toHaveClass('table-system');
    });

    it('should accept custom className', () => {
      render(
        <TableContainer className="custom-container">
          <div>Test content</div>
        </TableContainer>
      );
      
      const container = screen.getByText('Test content').parentElement;
      expect(container).toHaveClass('table-container');
      expect(container).toHaveClass('table-system');
      expect(container).toHaveClass('custom-container');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <TableContainer ref={ref}>
          <div>Test content</div>
        </TableContainer>
      );
      
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('DIV');
    });

    it('should pass through HTML attributes', () => {
      render(
        <TableContainer data-testid="container" role="region" aria-label="Table region">
          <div>Test content</div>
        </TableContainer>
      );
      
      const container = screen.getByTestId('container');
      expect(container).toHaveAttribute('role', 'region');
      expect(container).toHaveAttribute('aria-label', 'Table region');
    });
  });

  describe('Table', () => {
    it('should render with default props', () => {
      render(
        <Table>
          <tbody>
            <tr><td>Test cell</td></tr>
          </tbody>
        </Table>
      );
      
      const table = screen.getByRole('table');
      expect(table).toHaveClass('therapeutic-table');
    });

    it('should apply variant classes correctly', () => {
      const variants = [
        { variant: 'default' as const, expectedClass: '' },
        { variant: 'cbt-report' as const, expectedClass: 'table-cbt-report' },
        { variant: 'progress' as const, expectedClass: 'table-progress' },
        { variant: 'comparison' as const, expectedClass: 'table-comparison' },
        { variant: 'dashboard' as const, expectedClass: 'table-dashboard' },
        { variant: 'compact' as const, expectedClass: 'table-compact' },
      ];

      variants.forEach(({ variant, expectedClass }) => {
        const { unmount } = render(
          <Table variant={variant}>
            <tbody>
              <tr><td>Test</td></tr>
            </tbody>
          </Table>
        );
        
        const table = screen.getByRole('table');
        expect(table).toHaveClass('therapeutic-table');
        if (expectedClass) {
          expect(table).toHaveClass(expectedClass);
        }
        
        unmount();
      });
    });

    it('should apply size classes correctly', () => {
      const sizes = [
        { size: 'sm' as const, expectedClass: 'table-sm' },
        { size: 'md' as const, expectedClass: '' },
        { size: 'lg' as const, expectedClass: 'table-lg' },
      ];

      sizes.forEach(({ size, expectedClass }) => {
        const { unmount } = render(
          <Table size={size}>
            <tbody>
              <tr><td>Test</td></tr>
            </tbody>
          </Table>
        );
        
        const table = screen.getByRole('table');
        expect(table).toHaveClass('therapeutic-table');
        if (expectedClass) {
          expect(table).toHaveClass(expectedClass);
        }
        
        unmount();
      });
    });

    it('should apply striped class when striped is true', () => {
      render(
        <Table striped>
          <tbody>
            <tr><td>Test cell</td></tr>
          </tbody>
        </Table>
      );
      
      const table = screen.getByRole('table');
      expect(table).toHaveClass('therapeutic-table');
      expect(table).toHaveClass('table-striped');
    });

    it('should accept custom className', () => {
      render(
        <Table className="custom-table">
          <tbody>
            <tr><td>Test cell</td></tr>
          </tbody>
        </Table>
      );
      
      const table = screen.getByRole('table');
      expect(table).toHaveClass('therapeutic-table');
      expect(table).toHaveClass('custom-table');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLTableElement>();
      render(
        <Table ref={ref}>
          <tbody>
            <tr><td>Test</td></tr>
          </tbody>
        </Table>
      );
      
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('TABLE');
    });
  });

  describe('TableHead', () => {
    it('should render thead element with children', () => {
      render(
        <table>
          <TableHead>
            <tr><th>Header</th></tr>
          </TableHead>
        </table>
      );
      
      const thead = screen.getByText('Header').closest('thead');
      expect(thead).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      render(
        <table>
          <TableHead className="custom-head">
            <tr><th>Header</th></tr>
          </TableHead>
        </table>
      );
      
      const thead = screen.getByText('Header').closest('thead');
      expect(thead).toHaveClass('custom-head');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLTableSectionElement>();
      render(
        <table>
          <TableHead ref={ref}>
            <tr><th>Header</th></tr>
          </TableHead>
        </table>
      );
      
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('THEAD');
    });
  });

  describe('TableBody', () => {
    it('should render tbody element with children', () => {
      render(
        <table>
          <TableBody>
            <tr><td>Cell</td></tr>
          </TableBody>
        </table>
      );
      
      const tbody = screen.getByText('Cell').closest('tbody');
      expect(tbody).toBeInTheDocument();
    });

    it('should accept custom className', () => {
      render(
        <table>
          <TableBody className="custom-body">
            <tr><td>Cell</td></tr>
          </TableBody>
        </table>
      );
      
      const tbody = screen.getByText('Cell').closest('tbody');
      expect(tbody).toHaveClass('custom-body');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLTableSectionElement>();
      render(
        <table>
          <TableBody ref={ref}>
            <tr><td>Cell</td></tr>
          </TableBody>
        </table>
      );
      
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('TBODY');
    });
  });

  describe('TableRow', () => {
    it('should render tr element with default variant', () => {
      render(
        <table>
          <tbody>
            <TableRow>
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>
      );
      
      const row = screen.getByText('Cell').closest('tr');
      expect(row).toBeInTheDocument();
    });

    it('should apply variant classes correctly', () => {
      const variants = [
        { variant: 'default' as const, expectedClass: '' },
        { variant: 'positive' as const, expectedClass: 'progress-positive' },
        { variant: 'negative' as const, expectedClass: 'progress-negative' },
        { variant: 'neutral' as const, expectedClass: '' },
      ];

      variants.forEach(({ variant, expectedClass }) => {
        const { unmount } = render(
          <table>
            <tbody>
              <TableRow variant={variant}>
                <td>Test {variant}</td>
              </TableRow>
            </tbody>
          </table>
        );
        
        const row = screen.getByText(`Test ${variant}`).closest('tr');
        if (expectedClass) {
          expect(row).toHaveClass(expectedClass);
        }
        
        unmount();
      });
    });

    it('should accept custom className', () => {
      render(
        <table>
          <tbody>
            <TableRow className="custom-row">
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>
      );
      
      const row = screen.getByText('Cell').closest('tr');
      expect(row).toHaveClass('custom-row');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLTableRowElement>();
      render(
        <table>
          <tbody>
            <TableRow ref={ref}>
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>
      );
      
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('TR');
    });
  });

  describe('TableHeader', () => {
    it('should render th element with default props', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHeader>Header Text</TableHeader>
            </tr>
          </thead>
        </table>
      );
      
      const header = screen.getByText('Header Text');
      expect(header.tagName).toBe('TH');
      expect(header).toHaveAttribute('data-type', 'default');
    });

    it('should apply column type classes and data attributes', () => {
      const columnTypes = [
        { type: 'priority' as const, expectedClass: 'column-priority' },
        { type: 'framework' as const, expectedClass: 'column-framework' },
        { type: 'content' as const, expectedClass: 'column-content' },
        { type: 'metric' as const, expectedClass: 'column-metric' },
        { type: 'label' as const, expectedClass: 'column-label' },
        { type: 'default' as const, expectedClass: '' },
      ];

      columnTypes.forEach(({ type, expectedClass }) => {
        const { unmount } = render(
          <table>
            <thead>
              <tr>
                <TableHeader columnType={type}>Header {type}</TableHeader>
              </tr>
            </thead>
          </table>
        );
        
        const header = screen.getByText(`Header ${type}`);
        expect(header).toHaveAttribute('data-type', type);
        if (expectedClass) {
          expect(header).toHaveClass(expectedClass);
        }
        
        unmount();
      });
    });

    it('should apply sortable class when sortable is true', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHeader sortable>Sortable Header</TableHeader>
            </tr>
          </thead>
        </table>
      );
      
      const header = screen.getByText('Sortable Header');
      expect(header).toHaveClass('sortable');
    });

    it('should accept custom className', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHeader className="custom-header">Header</TableHeader>
            </tr>
          </thead>
        </table>
      );
      
      const header = screen.getByText('Header');
      expect(header).toHaveClass('custom-header');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLTableHeaderCellElement>();
      render(
        <table>
          <thead>
            <tr>
              <TableHeader ref={ref}>Header</TableHeader>
            </tr>
          </thead>
        </table>
      );
      
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('TH');
    });
  });

  describe('TableCell', () => {
    it('should render td element with default props', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell>Cell Content</TableCell>
            </tr>
          </tbody>
        </table>
      );
      
      const cell = screen.getByText('Cell Content');
      expect(cell.tagName).toBe('TD');
      expect(cell).toHaveAttribute('data-type', 'default');
    });

    it('should apply column type classes and data attributes', () => {
      const columnTypes = [
        { type: 'priority' as const, expectedClass: 'column-priority' },
        { type: 'framework' as const, expectedClass: 'column-framework' },
        { type: 'content' as const, expectedClass: 'column-content' },
        { type: 'metric' as const, expectedClass: 'column-metric' },
        { type: 'label' as const, expectedClass: 'column-label' },
        { type: 'default' as const, expectedClass: '' },
      ];

      columnTypes.forEach(({ type, expectedClass }) => {
        const { unmount } = render(
          <table>
            <tbody>
              <tr>
                <TableCell columnType={type}>Cell {type}</TableCell>
              </tr>
            </tbody>
          </table>
        );
        
        const cell = screen.getByText(`Cell ${type}`);
        expect(cell).toHaveAttribute('data-type', type);
        if (expectedClass) {
          expect(cell).toHaveClass(expectedClass);
        }
        
        unmount();
      });
    });

    it('should set data-label attribute when label prop is provided', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell label="Name">John Doe</TableCell>
            </tr>
          </tbody>
        </table>
      );
      
      const cell = screen.getByText('John Doe');
      expect(cell).toHaveAttribute('data-label', 'Name');
    });

    it('should accept custom className', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell className="custom-cell">Cell</TableCell>
            </tr>
          </tbody>
        </table>
      );
      
      const cell = screen.getByText('Cell');
      expect(cell).toHaveClass('custom-cell');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLTableDataCellElement>();
      render(
        <table>
          <tbody>
            <tr>
              <TableCell ref={ref}>Cell</TableCell>
            </tr>
          </tbody>
        </table>
      );
      
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('TD');
    });
  });

  describe('CompleteTable', () => {
    it('should render table with container by default', () => {
      render(
        <CompleteTable>
          <thead>
            <tr><th>Header</th></tr>
          </thead>
          <tbody>
            <tr><td>Cell</td></tr>
          </tbody>
        </CompleteTable>
      );
      
      // Should find table inside container
      const table = screen.getByRole('table');
      expect(table).toHaveClass('therapeutic-table');
      
      const container = table.parentElement;
      expect(container).toHaveClass('table-container');
      expect(container).toHaveClass('table-system');
    });

    it('should render table without container when container=false', () => {
      render(
        <CompleteTable container={false}>
          <thead>
            <tr><th>Header</th></tr>
          </thead>
          <tbody>
            <tr><td>Cell</td></tr>
          </tbody>
        </CompleteTable>
      );
      
      const table = screen.getByRole('table');
      expect(table).toHaveClass('therapeutic-table');
      
      // Parent should not have container classes
      const parent = table.parentElement;
      expect(parent).not.toHaveClass('table-container');
    });

    it('should render caption when provided', () => {
      render(
        <CompleteTable caption="Test Table Caption">
          <thead>
            <tr><th>Header</th></tr>
          </thead>
          <tbody>
            <tr><td>Cell</td></tr>
          </tbody>
        </CompleteTable>
      );
      
      const caption = screen.getByText('Test Table Caption');
      expect(caption.tagName).toBe('CAPTION');
      expect(caption).toHaveClass('sr-only');
    });

    it('should pass through table props correctly', () => {
      render(
        <CompleteTable variant="cbt-report" size="lg" striped>
          <thead>
            <tr><th>Header</th></tr>
          </thead>
          <tbody>
            <tr><td>Cell</td></tr>
          </tbody>
        </CompleteTable>
      );
      
      const table = screen.getByRole('table');
      expect(table).toHaveClass('therapeutic-table');
      expect(table).toHaveClass('table-cbt-report');
      expect(table).toHaveClass('table-lg');
      expect(table).toHaveClass('table-striped');
    });

    it('should forward ref correctly', () => {
      const ref = React.createRef<HTMLTableElement>();
      render(
        <CompleteTable ref={ref}>
          <thead>
            <tr><th>Header</th></tr>
          </thead>
          <tbody>
            <tr><td>Cell</td></tr>
          </tbody>
        </CompleteTable>
      );
      
      expect(ref.current).toBeTruthy();
      expect(ref.current?.tagName).toBe('TABLE');
    });
  });

  describe('useTableResponsive Hook', () => {
    it('should return server-safe defaults', () => {
      function TestComponent() {
        const responsive = useTableResponsive();
        
        return (
          <div>
            <div data-testid="is-mobile">{responsive.isMobile.toString()}</div>
            <div data-testid="is-tablet">{responsive.isTablet.toString()}</div>
            <div data-testid="is-desktop">{responsive.isDesktop.toString()}</div>
          </div>
        );
      }
      
      render(<TestComponent />);
      
      // Should default to mobile-first for SSR safety
      expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('false');
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('false');
    });
  });

  describe('Integration Tests', () => {
    it('should render complete therapeutic table with all components', () => {
      render(
        <CompleteTable 
          variant="cbt-report" 
          size="md" 
          striped 
          caption="CBT Progress Table"
        >
          <TableHead>
            <TableRow>
              <TableHeader columnType="priority" sortable>Priority</TableHeader>
              <TableHeader columnType="content">Thought</TableHeader>
              <TableHeader columnType="metric">Rating</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow variant="positive">
              <TableCell columnType="priority" label="Priority">High</TableCell>
              <TableCell columnType="content" label="Thought">I can handle this</TableCell>
              <TableCell columnType="metric" label="Rating">8/10</TableCell>
            </TableRow>
            <TableRow variant="negative">
              <TableCell columnType="priority" label="Priority">Low</TableCell>
              <TableCell columnType="content" label="Thought">This is overwhelming</TableCell>
              <TableCell columnType="metric" label="Rating">3/10</TableCell>
            </TableRow>
          </TableBody>
        </CompleteTable>
      );
      
      // Check structure
      const table = screen.getByRole('table');
      expect(table).toHaveClass('therapeutic-table');
      expect(table).toHaveClass('table-cbt-report');
      expect(table).toHaveClass('table-striped');
      
      // Check caption
      expect(screen.getByText('CBT Progress Table')).toBeInTheDocument();
      
      // Check headers
      expect(screen.getByText('Priority')).toHaveClass('column-priority', 'sortable');
      expect(screen.getByText('Thought')).toHaveClass('column-content');
      expect(screen.getByText('Rating')).toHaveClass('column-metric');
      
      // Check cells with labels
      const highPriorityCell = screen.getByText('High');
      expect(highPriorityCell).toHaveAttribute('data-label', 'Priority');
      expect(highPriorityCell).toHaveClass('column-priority');
      
      const thoughtCell = screen.getByText('I can handle this');
      expect(thoughtCell).toHaveAttribute('data-label', 'Thought');
      expect(thoughtCell).toHaveClass('column-content');
      
      // Check row variants
      const positiveRow = screen.getByText('I can handle this').closest('tr');
      expect(positiveRow).toHaveClass('progress-positive');
      
      const negativeRow = screen.getByText('This is overwhelming').closest('tr');
      expect(negativeRow).toHaveClass('progress-negative');
    });
  });
});