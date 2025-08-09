import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import {
  useAlternativeViews,
  AlternativeViewWrapper,
} from '@/components/ui/table/use-alternative-views';

describe('useAlternativeViews Hook', () => {
  // Mock requestAnimationFrame for testing animations
  beforeEach(() => {
    global.requestAnimationFrame = jest.fn((cb) => {
      cb();
      return 1;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Expand/Collapse Functionality', () => {
    function TestExpandComponent() {
      const { containerRef } = useAlternativeViews();
      
      return (
        <div ref={containerRef}>
          <div className="expandable-row">
            <button className="expand-button" aria-expanded="false">
              Show Details
            </button>
            <div className="row-details" hidden>
              <p>Hidden content that should expand</p>
            </div>
          </div>
        </div>
      );
    }

    it('should initialize expand buttons with event listeners', () => {
      render(<TestExpandComponent />);
      
      const button = screen.getByText('Show Details');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByText('Hidden content that should expand').parentElement).toHaveAttribute('hidden');
    });

    it('should expand details when expand button is clicked', async () => {
      render(<TestExpandComponent />);
      
      const button = screen.getByText('Show Details');
      const details = screen.getByText('Hidden content that should expand').parentElement as HTMLElement;
      
      // Click to expand
      fireEvent.click(button);
      
      // Should update button state
      expect(button).toHaveAttribute('aria-expanded', 'true');
      
      // Should remove hidden attribute and show content
      expect(details).not.toHaveAttribute('hidden');
      expect(details.style.display).toBe('block');
    });

    it('should collapse details when expanded button is clicked', async () => {
      render(<TestExpandComponent />);
      
      const button = screen.getByText('Show Details');
      const details = screen.getByText('Hidden content that should expand').parentElement as HTMLElement;
      
      // First expand
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      
      // Then collapse
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      // Should start collapse animation
      expect(details.style.transition).toContain('opacity 0.3s ease');
      expect(details.style.opacity).toBe('0');
    });

    it('should apply smooth animations during expand', async () => {
      render(<TestExpandComponent />);
      
      const button = screen.getByText('Show Details');
      const details = screen.getByText('Hidden content that should expand').parentElement as HTMLElement;
      
      // Click to expand
      fireEvent.click(button);
      
      // Animation should be applied (the exact state depends on timing)
      expect(details.style.transition).toContain('opacity 0.3s ease');
      expect(details.style.transition).toContain('transform 0.3s ease');
      
      // requestAnimationFrame should be called for smooth animation
      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });

    it('should handle multiple expandable rows independently', () => {
      function MultipleRowsComponent() {
        const { containerRef } = useAlternativeViews();
        
        return (
          <div ref={containerRef}>
            <div className="expandable-row">
              <button className="expand-button" aria-expanded="false">
                Row 1 Details
              </button>
              <div className="row-details" hidden>
                <p>Row 1 content</p>
              </div>
            </div>
            <div className="expandable-row">
              <button className="expand-button" aria-expanded="false">
                Row 2 Details
              </button>
              <div className="row-details" hidden>
                <p>Row 2 content</p>
              </div>
            </div>
          </div>
        );
      }

      render(<MultipleRowsComponent />);
      
      const row1Button = screen.getByText('Row 1 Details');
      const row2Button = screen.getByText('Row 2 Details');
      
      // Expand row 1
      fireEvent.click(row1Button);
      expect(row1Button).toHaveAttribute('aria-expanded', 'true');
      expect(row2Button).toHaveAttribute('aria-expanded', 'false');
      
      // Expand row 2
      fireEvent.click(row2Button);
      expect(row1Button).toHaveAttribute('aria-expanded', 'true');
      expect(row2Button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should gracefully handle missing row-details element', () => {
      function MissingDetailsComponent() {
        const { containerRef } = useAlternativeViews();
        
        return (
          <div ref={containerRef}>
            <div className="expandable-row">
              <button className="expand-button" aria-expanded="false">
                No Details
              </button>
              {/* Missing row-details div */}
            </div>
          </div>
        );
      }

      render(<MissingDetailsComponent />);
      
      const button = screen.getByText('No Details');
      
      // Should not throw error when clicked
      expect(() => {
        fireEvent.click(button);
      }).not.toThrow();
      
      // Button state should remain unchanged
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Keyboard Navigation', () => {
    function KeyboardTestComponent() {
      const { containerRef } = useAlternativeViews();
      
      return (
        <div ref={containerRef}>
          <div className="structured-card" tabIndex={0}>Card 1</div>
          <button className="expand-button">Button 1</button>
          <div className="structured-card" tabIndex={0}>Card 2</div>
          <dl className="therapeutic-definition-list" tabIndex={0}>
            <dt>Definition Term</dt>
            <dd>Definition Description</dd>
          </dl>
        </div>
      );
    }

    it('should initialize focusable elements with proper attributes', () => {
      render(<KeyboardTestComponent />);
      
      const cards = screen.getAllByText(/Card \d/);
      cards.forEach(card => {
        expect(card).toHaveAttribute('tabindex', '0');
        expect(card).toHaveAttribute('role', 'article');
      });
    });

    it('should handle ArrowDown navigation', () => {
      render(<KeyboardTestComponent />);
      
      const card1 = screen.getByText('Card 1');
      card1.focus();
      
      // Press ArrowDown
      fireEvent.keyDown(card1, { key: 'ArrowDown' });
      
      // Should move to next focusable element
      expect(screen.getByText('Button 1')).toHaveFocus();
    });

    it('should handle ArrowUp navigation', () => {
      render(<KeyboardTestComponent />);
      
      const button = screen.getByText('Button 1');
      button.focus();
      
      // Press ArrowUp
      fireEvent.keyDown(button, { key: 'ArrowUp' });
      
      // Should move to previous focusable element
      expect(screen.getByText('Card 1')).toHaveFocus();
    });

    it('should handle ArrowRight navigation', () => {
      render(<KeyboardTestComponent />);
      
      const card1 = screen.getByText('Card 1');
      card1.focus();
      
      // Press ArrowRight
      fireEvent.keyDown(card1, { key: 'ArrowRight' });
      
      // Should move to next focusable element
      expect(screen.getByText('Button 1')).toHaveFocus();
    });

    it('should handle ArrowLeft navigation', () => {
      render(<KeyboardTestComponent />);
      
      const button = screen.getByText('Button 1');
      button.focus();
      
      // Press ArrowLeft
      fireEvent.keyDown(button, { key: 'ArrowLeft' });
      
      // Should move to previous focusable element
      expect(screen.getByText('Card 1')).toHaveFocus();
    });

    it('should handle Home key navigation', () => {
      render(<KeyboardTestComponent />);
      
      const card2 = screen.getByText('Card 2');
      card2.focus();
      
      // Press Home
      fireEvent.keyDown(card2, { key: 'Home' });
      
      // Should move to first focusable element
      expect(screen.getByText('Card 1')).toHaveFocus();
    });

    it('should handle End key navigation', () => {
      render(<KeyboardTestComponent />);
      
      const card1 = screen.getByText('Card 1');
      card1.focus();
      
      // Press End
      fireEvent.keyDown(card1, { key: 'End' });
      
      // Should move to last focusable element
      expect(screen.getByText('Definition Term').parentElement).toHaveFocus();
    });

    it('should wrap around at boundaries with arrow keys', () => {
      render(<KeyboardTestComponent />);
      
      const definitionList = screen.getByText('Definition Term').parentElement as HTMLElement;
      definitionList.focus();
      
      // Press ArrowDown from last element
      fireEvent.keyDown(definitionList, { key: 'ArrowDown' });
      
      // Should wrap to first element
      expect(screen.getByText('Card 1')).toHaveFocus();
      
      // Now press ArrowUp from first element
      fireEvent.keyDown(screen.getByText('Card 1'), { key: 'ArrowUp' });
      
      // Should wrap to last element
      expect(definitionList).toHaveFocus();
    });

    it('should prevent default behavior for handled keys', () => {
      render(<KeyboardTestComponent />);
      
      const card1 = screen.getByText('Card 1');
      card1.focus();
      
      // Create a real KeyboardEvent to test preventDefault behavior
      const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      const preventDefaultSpy = jest.spyOn(keyEvent, 'preventDefault');
      
      // Dispatch the actual event to the element
      card1.dispatchEvent(keyEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should ignore unhandled keys', () => {
      render(<KeyboardTestComponent />);
      
      const card1 = screen.getByText('Card 1');
      card1.focus();
      
      // Press unhandled key
      fireEvent.keyDown(card1, { key: 'Enter' });
      
      // Focus should remain on same element
      expect(card1).toHaveFocus();
    });

    it('should handle keyboard navigation with no focusable elements', () => {
      function NoFocusableComponent() {
        const { containerRef } = useAlternativeViews();
        
        return (
          <div ref={containerRef}>
            <div>No focusable content</div>
          </div>
        );
      }

      render(<NoFocusableComponent />);
      
      const container = screen.getByText('No focusable content').parentElement;
      
      // Should not throw error when navigating in empty container
      expect(() => {
        fireEvent.keyDown(container!, { key: 'ArrowDown' });
      }).not.toThrow();
    });
  });

  describe('Event Cleanup', () => {
    it('should clean up event listeners when component unmounts', () => {
      const removeEventListenerSpy = jest.spyOn(Element.prototype, 'removeEventListener');
      
      const { unmount } = render(
        <div>
          <TestExpandComponent />
        </div>
      );
      
      // Unmount component
      unmount();
      
      // Should call removeEventListener for cleanup
      expect(removeEventListenerSpy).toHaveBeenCalled();
      
      removeEventListenerSpy.mockRestore();
    });

    function TestExpandComponent() {
      const { containerRef } = useAlternativeViews();
      
      return (
        <div ref={containerRef}>
          <div className="expandable-row">
            <button className="expand-button" aria-expanded="false">
              Test Button
            </button>
            <div className="row-details" hidden>Content</div>
          </div>
        </div>
      );
    }
  });

  describe('Edge Cases', () => {
    it('should handle container ref being null', () => {
      function NullRefComponent() {
        const { containerRef } = useAlternativeViews();
        // Simulate ref being null
        (containerRef as any).current = null;
        
        return <div>No ref</div>;
      }

      // Should not throw error
      expect(() => {
        render(<NullRefComponent />);
      }).not.toThrow();
    });

    it('should handle keyboard navigation when target is not in focusable elements', () => {
      function TestComponent() {
        const { containerRef } = useAlternativeViews();
        
        return (
          <div ref={containerRef}>
            <div className="structured-card" tabIndex={0}>Card</div>
            <div className="non-focusable">Non-focusable</div>
          </div>
        );
      }

      render(<TestComponent />);
      
      const nonFocusable = screen.getByText('Non-focusable');
      
      // Should not throw error when navigating from non-focusable element
      expect(() => {
        fireEvent.keyDown(nonFocusable, { key: 'ArrowDown' });
      }).not.toThrow();
    });
  });
});

describe('AlternativeViewWrapper Component', () => {
  it('should render children when children is React node', () => {
    render(
      <AlternativeViewWrapper>
        <div>React Node Content</div>
      </AlternativeViewWrapper>
    );
    
    expect(screen.getByText('React Node Content')).toBeInTheDocument();
  });

  it('should render HTML string using dangerouslySetInnerHTML', () => {
    const htmlString = '<div>HTML <strong>String</strong> Content</div>';
    
    render(
      <AlternativeViewWrapper>
        {htmlString}
      </AlternativeViewWrapper>
    );
    
    // Check that the content is rendered correctly
    expect(screen.getByText('String')).toBeInTheDocument();
    // Check that the full text content is available
    const wrapper = screen.getByText('String').closest('.alternative-view-wrapper');
    expect(wrapper).toHaveTextContent('HTML String Content');
    
    // Should have the HTML structure
    const strongElement = screen.getByText('String');
    expect(strongElement.tagName).toBe('STRONG');
  });

  it('should apply default className', () => {
    render(
      <AlternativeViewWrapper>
        <div>Content</div>
      </AlternativeViewWrapper>
    );
    
    const wrapper = screen.getByText('Content').parentElement;
    expect(wrapper).toHaveClass('alternative-view-wrapper');
  });

  it('should apply custom className', () => {
    render(
      <AlternativeViewWrapper className="custom-wrapper">
        <div>Content</div>
      </AlternativeViewWrapper>
    );
    
    const wrapper = screen.getByText('Content').parentElement;
    expect(wrapper).toHaveClass('alternative-view-wrapper');
    expect(wrapper).toHaveClass('custom-wrapper');
  });

  it('should initialize alternative views functionality', () => {
    render(
      <AlternativeViewWrapper>
        <div className="expandable-row">
          <button className="expand-button" aria-expanded="false">
            Expand
          </button>
          <div className="row-details" hidden>Details</div>
        </div>
      </AlternativeViewWrapper>
    );
    
    const button = screen.getByText('Expand');
    
    // Should initialize with expand functionality
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('should handle keyboard navigation in wrapped content', () => {
    render(
      <AlternativeViewWrapper>
        <div className="structured-card" tabIndex={0}>Card 1</div>
        <div className="structured-card" tabIndex={0}>Card 2</div>
      </AlternativeViewWrapper>
    );
    
    const card1 = screen.getByText('Card 1');
    card1.focus();
    
    // Should handle keyboard navigation
    fireEvent.keyDown(card1, { key: 'ArrowDown' });
    expect(screen.getByText('Card 2')).toHaveFocus();
  });

  it('should handle mixed string and React node content', () => {
    // This tests the conditional rendering logic
    render(
      <AlternativeViewWrapper>
        <div>Mixed Content</div>
      </AlternativeViewWrapper>
    );
    
    const wrapper = screen.getByText('Mixed Content').parentElement;
    expect(wrapper).not.toHaveAttribute('dangerouslySetInnerHTML');
  });

  describe('HTML String Handling', () => {
    it('should safely render complex HTML structures', () => {
      const complexHtml = `
        <div class="complex-structure">
          <h3>Header</h3>
          <p>Paragraph with <em>emphasis</em></p>
          <ul>
            <li>List item 1</li>
            <li>List item 2</li>
          </ul>
        </div>
      `;
      
      render(
        <AlternativeViewWrapper>
          {complexHtml}
        </AlternativeViewWrapper>
      );
      
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Paragraph with')).toBeInTheDocument();
      expect(screen.getByText('emphasis')).toBeInTheDocument();
      expect(screen.getByText('List item 1')).toBeInTheDocument();
      expect(screen.getByText('List item 2')).toBeInTheDocument();
    });

    it('should handle HTML with event attributes safely', () => {
      // Mock window.alert to prevent jsdom errors
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      // This tests that HTML string rendering doesn't execute scripts
      const htmlWithEvents = '<div onclick="alert(\'xss\')">Safe Content</div>';
      
      render(
        <AlternativeViewWrapper>
          {htmlWithEvents}
        </AlternativeViewWrapper>
      );
      
      const element = screen.getByText('Safe Content');
      expect(element).toBeInTheDocument();
      
      // Click should not execute the onclick due to sanitization
      fireEvent.click(element);
      
      // Alert should not have been called due to HTML sanitization
      expect(alertSpy).not.toHaveBeenCalled();
      
      alertSpy.mockRestore();
    });
  });

  describe('Integration with useAlternativeViews', () => {
    it('should provide working expand/collapse functionality for HTML strings', () => {
      const htmlWithExpandable = `
        <div class="expandable-row">
          <button class="expand-button" aria-expanded="false">Expand HTML</button>
          <div class="row-details" hidden>
            <p>HTML Details Content</p>
          </div>
        </div>
      `;
      
      render(
        <AlternativeViewWrapper>
          {htmlWithExpandable}
        </AlternativeViewWrapper>
      );
      
      const button = screen.getByText('Expand HTML');
      fireEvent.click(button);
      
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('HTML Details Content')).toBeVisible();
    });

    it('should provide working keyboard navigation for HTML strings', () => {
      const htmlWithCards = `
        <div class="structured-card">HTML Card 1</div>
        <div class="structured-card">HTML Card 2</div>
      `;
      
      render(
        <AlternativeViewWrapper>
          {htmlWithCards}
        </AlternativeViewWrapper>
      );
      
      const card1 = screen.getByText('HTML Card 1');
      
      // Should auto-add tabindex and role attributes
      expect(card1).toHaveAttribute('tabindex', '0');
      expect(card1).toHaveAttribute('role', 'article');
      
      card1.focus();
      fireEvent.keyDown(card1, { key: 'ArrowDown' });
      
      expect(screen.getByText('HTML Card 2')).toHaveFocus();
    });
  });
});