/**
 * Tests for useChatModals hook
 */

import { renderHook, act } from '@testing-library/react';
import { useChatModals } from '@/features/chat/hooks/use-chat-modals';

describe('useChatModals', () => {
  it('should initialize with memory modal closed', () => {
    const { result } = renderHook(() => useChatModals());

    expect(result.current.modals.showMemoryModal).toBe(false);
  });

  it('should open memory modal', () => {
    const { result } = renderHook(() => useChatModals());

    act(() => {
      result.current.actions.openMemoryModal();
    });

    expect(result.current.modals.showMemoryModal).toBe(true);
  });

  it('should close memory modal', () => {
    const { result } = renderHook(() => useChatModals());

    act(() => {
      result.current.actions.openMemoryModal();
    });

    expect(result.current.modals.showMemoryModal).toBe(true);

    act(() => {
      result.current.actions.closeMemoryModal();
    });

    expect(result.current.modals.showMemoryModal).toBe(false);
  });

  it('should set memory modal state directly', () => {
    const { result } = renderHook(() => useChatModals());

    act(() => {
      result.current.actions.setShowMemoryModal(true);
    });

    expect(result.current.modals.showMemoryModal).toBe(true);

    act(() => {
      result.current.actions.setShowMemoryModal(false);
    });

    expect(result.current.modals.showMemoryModal).toBe(false);
  });

  it('should handle multiple toggles', () => {
    const { result } = renderHook(() => useChatModals());

    act(() => {
      result.current.actions.openMemoryModal();
    });
    expect(result.current.modals.showMemoryModal).toBe(true);

    act(() => {
      result.current.actions.closeMemoryModal();
    });
    expect(result.current.modals.showMemoryModal).toBe(false);

    act(() => {
      result.current.actions.openMemoryModal();
    });
    expect(result.current.modals.showMemoryModal).toBe(true);
  });
});
