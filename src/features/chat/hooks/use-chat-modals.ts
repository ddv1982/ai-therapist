/**
 * Chat Modals Hook
 *
 * Manages modal visibility state for the therapy chat interface.
 * Provides memoized open/close handlers for memory management modal.
 *
 * @module useChatModals
 */

'use client';

import { useState, useCallback, useMemo } from 'react';

/**
 * State interface for chat modal visibility.
 * @interface ChatModalsState
 */
export interface ChatModalsState {
  /** Whether the memory management modal is currently visible */
  showMemoryModal: boolean;
  /** Whether the API keys panel is currently visible */
  showApiKeysPanel: boolean;
}

/**
 * Action handlers for managing modal visibility.
 * All handlers are memoized for performance.
 * @interface ChatModalsActions
 */
export interface ChatModalsActions {
  /** Opens the memory management modal */
  openMemoryModal: () => void;
  /** Closes the memory management modal */
  closeMemoryModal: () => void;
  /** Directly sets memory modal visibility state */
  setShowMemoryModal: (show: boolean) => void;
  /** Opens the API keys panel */
  openApiKeysPanel: () => void;
  /** Closes the API keys panel */
  closeApiKeysPanel: () => void;
  /** Directly sets API keys panel visibility state */
  setShowApiKeysPanel: (show: boolean) => void;
}

/**
 * Return type for useChatModals hook.
 * @interface UseChatModalsReturn
 */
export interface UseChatModalsReturn {
  /** Current modal visibility state */
  modals: ChatModalsState;
  /** Actions to control modal visibility */
  actions: ChatModalsActions;
}

/**
 * Manages modal visibility state for the therapy chat interface.
 *
 * Provides a centralized way to control modal dialogs with optimized,
 * memoized callbacks to prevent unnecessary re-renders. Currently manages
 * the memory management modal, with extensibility for additional modals.
 *
 * @returns {UseChatModalsReturn} Modal state and action handlers
 *
 * @example
 * ```tsx
 * function ChatPage() {
 *   const { modals, actions } = useChatModals();
 *
 *   return (
 *     <>
 *       <button onClick={actions.openMemoryModal}>
 *         Manage Memory
 *       </button>
 *       <MemoryModal
 *         open={modals.showMemoryModal}
 *         onClose={actions.closeMemoryModal}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function useChatModals(): UseChatModalsReturn {
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [showApiKeysPanel, setShowApiKeysPanel] = useState(false);

  const openMemoryModal = useCallback(() => {
    setShowMemoryModal(true);
  }, []);

  const closeMemoryModal = useCallback(() => {
    setShowMemoryModal(false);
  }, []);

  const openApiKeysPanel = useCallback(() => {
    setShowApiKeysPanel(true);
  }, []);

  const closeApiKeysPanel = useCallback(() => {
    setShowApiKeysPanel(false);
  }, []);

  // Memoize the modals state object
  const modals = useMemo(
    () => ({
      showMemoryModal,
      showApiKeysPanel,
    }),
    [showMemoryModal, showApiKeysPanel]
  );

  // Memoize the actions object (callbacks are already stable)
  const actions = useMemo(
    () => ({
      openMemoryModal,
      closeMemoryModal,
      setShowMemoryModal,
      openApiKeysPanel,
      closeApiKeysPanel,
      setShowApiKeysPanel,
    }),
    [
      openMemoryModal,
      closeMemoryModal,
      openApiKeysPanel,
      closeApiKeysPanel,
    ]
  );

  return { modals, actions };
}
