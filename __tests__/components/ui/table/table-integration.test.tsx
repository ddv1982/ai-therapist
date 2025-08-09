import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import {
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  CompleteTable,
  WideTable,
  ColumnManager,
  AlternativeViewWrapper,
} from '@/components/ui/table';
import {
  WideColumnDefinition,
  ColumnVisibilityState,
} from '@/components/ui/table/table-types';
import { processMarkdown } from '@/lib/markdown-processor';

// Mock CSS imports
jest.mock('@/components/ui/table/table-styles.css', () => ({}));

describe('Table System Integration Tests', () => {
  describe('5-Column Rule Workflow', () => {
    it('should handle 4-column table as standard responsive table', () => {
      const fourColumns: WideColumnDefinition[] = [
        { id: 'name', header: 'Patient Name', type: 'content', priority: 'high' },
        { id: 'session', header: 'Session #', type: 'priority', priority: 'high' },
        { id: 'date', header: 'Date', type: 'default', priority: 'medium' },
        { id: 'score', header: 'Score', type: 'metric', priority: 'medium' },
      ];

      render(
        <WideTable columns={fourColumns} strategy="auto">
          <TableHead>
            <TableRow>
              {fourColumns.map(col => (
                <TableHeader key={col.id} columnType={col.type}>
                  {col.header}
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell label="Patient Name">John Doe</TableCell>
              <TableCell label="Session #">3</TableCell>
              <TableCell label="Date">2025-08-09</TableCell>
              <TableCell label="Score">7/10</TableCell>
            </TableRow>
          </TableBody>
        </WideTable>
      );

      // Should render all columns (under 5-column limit)
      expect(screen.getByText('Patient Name')).toBeInTheDocument();
      expect(screen.getByText('Session #')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();

      // Should use priority-plus strategy for 4 columns
      const table = screen.getByRole('table');
      expect(table).toHaveClass('table-priority-plus');
    });

    it('should handle 5-column table with optimization', () => {
      const fiveColumns: WideColumnDefinition[] = [
        { id: 'name', header: 'Patient Name', type: 'content', priority: 'high' },
        { id: 'session', header: 'Session #', type: 'priority', priority: 'high' },
        { id: 'date', header: 'Date', type: 'default', priority: 'medium' },
        { id: 'score', header: 'Score', type: 'metric', priority: 'medium' },
        { id: 'notes', header: 'Notes', type: 'content', priority: 'low' },
      ];

      render(
        <WideTable columns={fiveColumns} strategy="priority-plus" maxVisibleColumns={4}>
          <TableHead>
            <TableRow>
              {fiveColumns.map(col => (
                <TableHeader key={col.id} columnType={col.type}>
                  {col.header}
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>
        </WideTable>
      );

      // Should show 4 high-priority columns by default
      expect(screen.getByText('Patient Name')).toBeInTheDocument();
      expect(screen.getByText('Session #')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
      
      // Low priority column should be hidden initially
      expect(screen.queryByText('Notes')).not.toBeInTheDocument();
    });

    it('should provide column management for wide tables', async () => {
      const user = userEvent.setup();
      const columns: WideColumnDefinition[] = [
        { id: 'name', header: 'Patient', type: 'content', priority: 'high' },
        { id: 'date', header: 'Date', type: 'default', priority: 'medium' },
        { id: 'mood', header: 'Mood', type: 'metric', priority: 'medium' },
        { id: 'notes', header: 'Notes', type: 'content', priority: 'low' },
        { id: 'followup', header: 'Follow-up', type: 'label', priority: 'low' },
      ];

      render(<WideTable columns={columns} maxVisibleColumns={3} />);

      // Should show column manager
      const managerButton = screen.getByLabelText('Manage table columns');
      expect(managerButton).toBeInTheDocument();

      // Open column manager
      await user.click(managerButton);

      // Should show all columns in manager
      expect(screen.getByText('Patient')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Mood')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Follow-up')).toBeInTheDocument();

      // Should be able to toggle hidden columns
      const notesCheckbox = screen.getByLabelText(/Notes/);
      await user.click(notesCheckbox);

      // Column should become visible
      await waitFor(() => {
        expect(screen.getAllByText('Notes')).toHaveLength(2); // Once in manager, once in table
      });
    });
  });

  describe('Therapeutic Data Scenarios', () => {
    it('should render CBT progress table with proper styling', () => {
      render(
        <CompleteTable 
          variant="cbt-report" 
          size="md" 
          striped 
          caption="CBT Progress Tracking"
        >
          <TableHead>
            <TableRow>
              <TableHeader columnType="framework">Technique</TableHeader>
              <TableHeader columnType="metric">Before (1-10)</TableHeader>
              <TableHeader columnType="metric">After (1-10)</TableHeader>
              <TableHeader columnType="priority">Progress</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow variant="positive">
              <TableCell columnType="framework" label="Technique">Thought Record</TableCell>
              <TableCell columnType="metric" label="Before">3</TableCell>
              <TableCell columnType="metric" label="After">7</TableCell>
              <TableCell columnType="priority" label="Progress">Improved</TableCell>
            </TableRow>
            <TableRow variant="neutral">
              <TableCell columnType="framework" label="Technique">Behavioral Activation</TableCell>
              <TableCell columnType="metric" label="Before">4</TableCell>
              <TableCell columnType="metric" label="After">5</TableCell>
              <TableCell columnType="priority" label="Progress">Slight</TableCell>
            </TableRow>
          </TableBody>
        </CompleteTable>
      );

      // Check therapeutic styling
      const table = screen.getByRole('table');
      expect(table).toHaveClass('therapeutic-table');
      expect(table).toHaveClass('table-cbt-report');
      expect(table).toHaveClass('table-striped');

      // Check column types are applied
      expect(screen.getByText('Thought Record')).toHaveClass('column-framework');
      expect(screen.getByText('3')).toHaveClass('column-metric');
      expect(screen.getByText('Improved')).toHaveClass('column-priority');

      // Check row variants
      const improvementRow = screen.getByText('Thought Record').closest('tr');
      expect(improvementRow).toHaveClass('progress-positive');

      const neutralRow = screen.getByText('Behavioral Activation').closest('tr');
      expect(neutralRow).toHaveClass('progress-neutral');

      // Check mobile labels
      expect(screen.getByText('Thought Record')).toHaveAttribute('data-label', 'Technique');
      expect(screen.getByText('3')).toHaveAttribute('data-label', 'Before');
    });

    it('should handle session comparison table', () => {
      const sessionColumns: WideColumnDefinition[] = [
        { id: 'session', header: 'Session', type: 'priority', priority: 'high' },
        { id: 'anxiety', header: 'Anxiety Level', type: 'metric', priority: 'high' },
        { id: 'depression', header: 'Depression Level', type: 'metric', priority: 'high' },
        { id: 'intervention', header: 'Primary Intervention', type: 'framework', priority: 'medium' },
        { id: 'homework', header: 'Homework Completed', type: 'label', priority: 'medium' },
        { id: 'notes', header: 'Therapist Notes', type: 'content', priority: 'low' },
      ];

      render(
        <WideTable 
          columns={sessionColumns} 
          strategy="priority-plus"
          maxVisibleColumns={4}
        >
          <TableHead>
            <TableRow>
              {sessionColumns.map(col => (
                <TableHeader key={col.id} columnType={col.type}>
                  {col.header}
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell label="Session">Session 1</TableCell>
              <TableCell label="Anxiety Level">8/10</TableCell>
              <TableCell label="Depression Level">7/10</TableCell>
              <TableCell label="Primary Intervention">CBT</TableCell>
              <TableCell label="Homework Completed">Yes</TableCell>
              <TableCell label="Therapist Notes">Initial assessment</TableCell>
            </TableRow>
            <TableRow>
              <TableCell label="Session">Session 5</TableCell>
              <TableCell label="Anxiety Level">4/10</TableCell>
              <TableCell label="Depression Level">3/10</TableCell>
              <TableCell label="Primary Intervention">DBT</TableCell>
              <TableCell label="Homework Completed">Partial</TableCell>
              <TableCell label="Therapist Notes">Significant progress</TableCell>
            </TableRow>
          </TableBody>
        </WideTable>
      );

      // Should show high and medium priority columns
      expect(screen.getByText('Session')).toBeInTheDocument();
      expect(screen.getByText('Anxiety Level')).toBeInTheDocument();
      expect(screen.getByText('Depression Level')).toBeInTheDocument();
      expect(screen.getByText('Primary Intervention')).toBeInTheDocument();

      // Should hide low priority notes initially
      expect(screen.queryByText('Therapist Notes')).not.toBeInTheDocument();

      // Should apply correct column types
      expect(screen.getByText('Session 1')).toHaveClass('column-priority');
      expect(screen.getByText('8/10')).toHaveClass('column-metric');
      expect(screen.getByText('CBT')).toHaveClass('column-framework');
    });
  });

  describe('Alternative View Integration', () => {
    it('should integrate with markdown processor for 6+ column tables', () => {
      // This simulates how markdown processor generates alternative views
      const complexTableMarkdown = `| Patient | Date | Session | Mood | Anxiety | Intervention | Progress | Notes |
|---------|------|---------|------|---------|-------------|----------|-------|
| John D  | 2025-08-09 | 3 | 6/10 | High | CBT | Good | Making progress |
| Jane S  | 2025-08-08 | 1 | 4/10 | Medium | DBT | Fair | Initial session |`;

      const result = processMarkdown(complexTableMarkdown, false);
      
      // Should transform to alternative view due to 8 columns
      expect(result).toContain('alternative-view-container');
      expect(result).toContain('structured-cards-container');
      expect(result).not.toContain('<table');
      
      // Should contain the data
      expect(result).toContain('John D');
      expect(result).toContain('Jane S');
      expect(result).toContain('CBT');
      expect(result).toContain('DBT');
    });

    it('should handle alternative view wrapper with expandable content', () => {
      const expandableContent = `
        <div class="expandable-rows-container">
          <div class="expandable-row">
            <div class="row-summary">
              <span class="summary-field">Patient: John Doe</span>
              <span class="summary-field">Date: 2025-08-09</span>
              <button class="expand-button" aria-expanded="false">Show Details</button>
            </div>
            <div class="row-details" hidden>
              <div class="detail-field">
                <span class="field-label">Mood:</span>
                <span class="field-value">6/10</span>
              </div>
              <div class="detail-field">
                <span class="field-label">Intervention:</span>
                <span class="field-value">CBT - Thought Records</span>
              </div>
            </div>
          </div>
        </div>
      `;

      render(
        <AlternativeViewWrapper>
          {expandableContent}
        </AlternativeViewWrapper>
      );

      // Should render the summary
      expect(screen.getByText('Patient: John Doe')).toBeInTheDocument();
      expect(screen.getByText('Date: 2025-08-09')).toBeInTheDocument();
      
      // Should have expand button
      const expandButton = screen.getByText('Show Details');
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');

      // Should expand when clicked
      fireEvent.click(expandButton);
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
      
      // Details should become visible
      expect(screen.getByText('6/10')).toBeVisible();
      expect(screen.getByText('CBT - Thought Records')).toBeVisible();
    });
  });

  describe('Responsive Behavior Integration', () => {
    it('should apply mobile-first responsive classes', () => {
      render(
        <TableContainer>
          <Table variant="dashboard" size="lg">
            <TableHead>
              <TableRow>
                <TableHeader columnType="priority">Priority</TableHeader>
                <TableHeader columnType="content">Description</TableHeader>
                <TableHeader columnType="metric">Value</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow variant="positive">
                <TableCell columnType="priority" label="Priority">High</TableCell>
                <TableCell columnType="content" label="Description">Anxiety Management</TableCell>
                <TableCell columnType="metric" label="Value">Improved</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      );

      // Should have responsive container
      const container = screen.getByRole('table').parentElement;
      expect(container).toHaveClass('table-container');
      expect(container).toHaveClass('table-system');

      // Should have therapeutic table classes
      const table = screen.getByRole('table');
      expect(table).toHaveClass('therapeutic-table');
      expect(table).toHaveClass('table-dashboard');
      expect(table).toHaveClass('table-lg');

      // Should have mobile labels
      expect(screen.getByText('High')).toHaveAttribute('data-label', 'Priority');
      expect(screen.getByText('Anxiety Management')).toHaveAttribute('data-label', 'Description');
      expect(screen.getByText('Improved')).toHaveAttribute('data-label', 'Value');
    });

    it('should handle wide table responsive behavior', () => {
      const columns: WideColumnDefinition[] = [
        { id: 'id', header: 'ID', type: 'priority', priority: 'high', alwaysVisible: true },
        { id: 'name', header: 'Patient Name', type: 'content', priority: 'high' },
        { id: 'session', header: 'Session', type: 'metric', priority: 'medium' },
        { id: 'date', header: 'Date', type: 'default', priority: 'medium' },
        { id: 'notes', header: 'Notes', type: 'content', priority: 'low' },
      ];

      render(
        <WideTable 
          columns={columns} 
          strategy="priority-plus"
          maxVisibleColumns={3}
        />
      );

      // Should apply wide table classes
      const container = screen.getByRole('table').closest('.table-container');
      expect(container).toHaveClass('wide-table-container');

      const table = screen.getByRole('table');
      expect(table).toHaveClass('table-priority-plus');

      // Should show column management
      expect(screen.getByLabelText('Manage table columns')).toBeInTheDocument();

      // Should respect always visible constraint
      expect(screen.getByText('ID')).toBeInTheDocument(); // Always visible
      expect(screen.getByText('Patient Name')).toBeInTheDocument(); // High priority
    });
  });

  describe('Accessibility Integration', () => {
    it('should provide comprehensive accessibility features', async () => {
      const user = userEvent.setup();
      const columns: WideColumnDefinition[] = [
        { id: 'patient', header: 'Patient', type: 'content', priority: 'high' },
        { id: 'score', header: 'Score', type: 'metric', priority: 'high' },
        { id: 'notes', header: 'Notes', type: 'content', priority: 'low' },
      ];

      render(
        <WideTable 
          columns={columns}
          columnNavigationLabel="Patient data table navigation"
          hiddenColumnsAnnouncement="1 column is currently hidden"
        />
      );

      // Should have navigation label
      const container = screen.getByLabelText('Patient data table navigation');
      expect(container).toBeInTheDocument();

      // Should have hidden columns announcement
      expect(screen.getByText('1 column is currently hidden')).toHaveClass('sr-only');
      expect(screen.getByText('1 column is currently hidden')).toHaveAttribute('aria-live', 'polite');

      // Column manager should be accessible
      const managerButton = screen.getByLabelText('Manage table columns');
      await user.click(managerButton);

      // Should have proper ARIA attributes
      expect(managerButton).toHaveAttribute('aria-expanded', 'true');
      
      const dropdown = screen.getByRole('menu');
      expect(dropdown).toBeInTheDocument();

      // Checkboxes should have proper labels and descriptions
      const notesCheckbox = screen.getByLabelText(/Notes/);
      expect(notesCheckbox).toHaveAttribute('aria-describedby', 'column-notes-priority');
    });

    it('should support keyboard navigation in alternative views', () => {
      const cardContent = `
        <div class="structured-cards-container">
          <div class="structured-card" tabindex="0">Card 1</div>
          <div class="structured-card" tabindex="0">Card 2</div>
          <div class="structured-card" tabindex="0">Card 3</div>
        </div>
      `;

      render(
        <AlternativeViewWrapper>
          {cardContent}
        </AlternativeViewWrapper>
      );

      // Cards should have proper accessibility attributes
      const cards = screen.getAllByText(/Card \d/);
      cards.forEach(card => {
        expect(card).toHaveAttribute('tabindex', '0');
        expect(card).toHaveAttribute('role', 'article');
      });

      // Should support keyboard navigation
      const card1 = screen.getByText('Card 1');
      card1.focus();

      // Arrow down should move to next card
      fireEvent.keyDown(card1, { key: 'ArrowDown' });
      expect(screen.getByText('Card 2')).toHaveFocus();

      // Home should move to first card
      fireEvent.keyDown(screen.getByText('Card 2'), { key: 'Home' });
      expect(screen.getByText('Card 1')).toHaveFocus();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty data gracefully', () => {
      render(
        <WideTable columns={[]} />
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveClass('therapeutic-table');
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

    it('should handle malformed alternative view content', () => {
      const malformedContent = `
        <div class="incomplete-structure">
          <div class="missing-required-attributes">Content</div>
        </div>
      `;

      // Should not throw error
      expect(() => {
        render(
          <AlternativeViewWrapper>
            {malformedContent}
          </AlternativeViewWrapper>
        );
      }).not.toThrow();

      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });
});