import { renderHook } from '@testing-library/react';
import { useFocusTrap, useFocusReturn } from '@/hooks/use-focus-trap';
import '@testing-library/jest-dom';

/**
 * Note: These tests verify the useFocusTrap and useFocusReturn hooks.
 * The actual Dialog component uses Radix UI Dialog which has built-in
 * WCAG 2.1 AA compliant focus management. These hooks are available for
 * custom implementations if needed.
 */

describe('useFocusTrap', () => {
  it('should return a ref object', () => {
    const { result } = renderHook(() => useFocusTrap(true));
    expect(result.current).toHaveProperty('current');
  });

  it('should update ref when isActive changes', () => {
    const { result, rerender } = renderHook(({ isActive }) => useFocusTrap(isActive), {
      initialProps: { isActive: false },
    });

    expect(result.current).toHaveProperty('current');

    rerender({ isActive: true });
    expect(result.current).toHaveProperty('current');
  });

  it('should handle when container is not set', () => {
    const { result } = renderHook(() => useFocusTrap(true));

    // Should not throw error when container is null
    expect(result.current.current).toBeNull();
  });
});

describe('useFocusReturn', () => {
  it('should save trigger element when modal opens', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Open Modal';
    document.body.appendChild(trigger);
    trigger.focus();

    expect(document.activeElement).toBe(trigger);

    // Render hook with isOpen = true
    const { result } = renderHook(({ isOpen }) => useFocusReturn(isOpen), {
      initialProps: { isOpen: true },
    });

    // Trigger should be saved
    expect(result.current.triggerRef.current).toBe(trigger);

    document.body.removeChild(trigger);
  });

  it('should restore focus when modal closes', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Open Modal';
    document.body.appendChild(trigger);
    trigger.focus();

    // Render hook with isOpen = true
    const { rerender } = renderHook(({ isOpen }) => useFocusReturn(isOpen), {
      initialProps: { isOpen: true },
    });

    // Simulate focus moving away
    const modalContent = document.createElement('div');
    modalContent.innerHTML = '<button>Close</button>';
    document.body.appendChild(modalContent);
    const closeButton = modalContent.querySelector('button');
    closeButton?.focus();

    expect(document.activeElement).toBe(closeButton);

    // Close modal
    rerender({ isOpen: false });

    // Wait for setTimeout
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Focus should return to trigger
    expect(document.activeElement).toBe(trigger);

    document.body.removeChild(trigger);
    document.body.removeChild(modalContent);
  });

  it('should handle trigger element being removed from DOM', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Open Modal';
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = renderHook(({ isOpen }) => useFocusReturn(isOpen), {
      initialProps: { isOpen: true },
    });

    // Remove trigger from DOM
    document.body.removeChild(trigger);

    // Close modal
    rerender({ isOpen: false });

    await new Promise((resolve) => setTimeout(resolve, 10));

    // Should not throw error
    // Focus will remain on body or last focused element
    expect(document.activeElement).toBeTruthy();
  });

  it('should allow manual trigger saving', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Manual Trigger';
    document.body.appendChild(trigger);

    const { result } = renderHook(() => useFocusReturn(false));

    // Manually save trigger
    result.current.saveTrigger(trigger);

    expect(result.current.triggerRef.current).toBe(trigger);

    document.body.removeChild(trigger);
  });
});
