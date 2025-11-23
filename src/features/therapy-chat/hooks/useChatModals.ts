/**
 * Chat Modals Hook
 *
 * Manages modal state for the chat interface.
 * Extracts modal management from ChatPageContent to reduce complexity.
 */

'use client';

import { useState, useCallback } from 'react';

export interface ChatModalsState {
  showMemoryModal: boolean;
}

export interface ChatModalsActions {
  openMemoryModal: () => void;
  closeMemoryModal: () => void;
  setShowMemoryModal: (show: boolean) => void;
}

export interface UseChatModalsReturn {
  modals: ChatModalsState;
  actions: ChatModalsActions;
}

/**
 * Hook to manage all modal state for the chat interface.
 * Consolidates modal open/close handlers.
 */
export function useChatModals(): UseChatModalsReturn {
  const [showMemoryModal, setShowMemoryModal] = useState(false);

  const openMemoryModal = useCallback(() => {
    setShowMemoryModal(true);
  }, []);

  const closeMemoryModal = useCallback(() => {
    setShowMemoryModal(false);
  }, []);

  return {
    modals: {
      showMemoryModal,
    },
    actions: {
      openMemoryModal,
      closeMemoryModal,
      setShowMemoryModal,
    },
  };
}
