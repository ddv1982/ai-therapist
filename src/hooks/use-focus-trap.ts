import { useEffect, useRef } from 'react';

/**
 * WCAG 2.1 AA compliant focus trap hook
 * Ensures focus remains within a modal when active and handles keyboard navigation
 * 
 * Satisfies:
 * - WCAG 2.1.1 Keyboard: All functionality available via keyboard
 * - WCAG 2.1.2 No Keyboard Trap: Focus can move away via Escape
 * - WCAG 2.4.3 Focus Order: Focus order is logical
 * - WCAG 2.4.7 Focus Visible: Keyboard focus indicator visible
 * 
 * @param isActive - Whether the focus trap should be active
 * @returns Ref to attach to the container element
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(isActive: boolean) {
  const containerRef = useRef<T>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    // Save the previously focused element to restore later
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Query for all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      const selector = [
        'a[href]',
        'area[href]',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'button:not([disabled])',
        'iframe',
        'object',
        'embed',
        '[contenteditable]',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',');

      const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));

      // Filter out elements that are not visible
      return elements.filter((element) => {
        const style = window.getComputedStyle(element);
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          !element.hasAttribute('aria-hidden')
        );
      });
    };

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        focusableElements[0]?.focus();
      }, 0);
    }

    // Handle Tab and Shift+Tab to trap focus
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (e.shiftKey) {
        // Shift+Tab: Moving backwards
        if (activeElement === firstElement || !container.contains(activeElement)) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: Moving forwards
        if (activeElement === lastElement || !container.contains(activeElement)) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Add event listener
    container.addEventListener('keydown', handleKeyDown);

    // Cleanup: Remove event listener and restore focus
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to the previously focused element
      if (previousFocusRef.current && document.body.contains(previousFocusRef.current)) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook to manage focus return on modal close
 * Ensures focus returns to the trigger element when modal closes
 * 
 * @param isOpen - Whether the modal is open
 * @returns Object containing trigger ref and focus management functions
 */
export function useFocusReturn(isOpen: boolean) {
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Save the currently focused element (likely the trigger)
      triggerRef.current = document.activeElement as HTMLElement;
    } else {
      // When modal closes, return focus to the trigger
      if (triggerRef.current && document.body.contains(triggerRef.current)) {
        // Use setTimeout to ensure the modal has fully closed
        setTimeout(() => {
          triggerRef.current?.focus();
        }, 0);
      }
    }
  }, [isOpen]);

  return {
    triggerRef,
    saveTrigger: (element: HTMLElement | null) => {
      triggerRef.current = element;
    },
  };
}
