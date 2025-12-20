'use client';

import { createContext, useContext, useMemo, useEffect } from 'react';
import { useChatController } from '@/hooks/use-chat-controller';
import { useChatState, type ChatState } from '@/features/chat/hooks/use-chat-state';
import { useChatActions, type ChatActions } from '@/features/chat/hooks/use-chat-actions';
import { useChatModals, type ChatModalsState, type ChatModalsActions } from '@/features/chat/hooks/use-chat-modals';
import { useChatSettings } from '@/contexts/chat-settings-context';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';
import { useApiKeys } from '@/hooks/use-api-keys';
import { DEFAULT_MODEL_ID, ANALYTICAL_MODEL_ID } from '@/features/chat/config';
import { getModelDisplayName, supportsWebSearch, MODEL_IDS } from '@/ai/model-metadata';

interface ChatContextValue {
  state: ChatState;
  actions: ChatActions;
  modals: ChatModalsState;
  modalActions: ChatModalsActions;
  controller: ReturnType<typeof useChatController>;
  modelLabel: string;
  byokActive: boolean;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { settings, updateSettings } = useChatSettings();
  const toastT = useTranslations('toast');
  const { showToast } = useToast();
  const { isActive: byokActive, setActive: setByokActive } = useApiKeys();

  // Reset system model selection when BYOK is activated
  useEffect(() => {
    if (byokActive) {
      updateSettings({
        model: DEFAULT_MODEL_ID,
        webSearchEnabled: false,
      });
    }
  }, [byokActive, updateSettings]);

  const effectiveModelId = byokActive
    ? MODEL_IDS.byok
    : settings.webSearchEnabled
      ? ANALYTICAL_MODEL_ID
      : settings.model;

  const modelLabel = useMemo(() => {
    if (byokActive) {
      return `${getModelDisplayName(MODEL_IDS.byok)} (Your Key)`;
    }
    const base = getModelDisplayName(effectiveModelId);
    return supportsWebSearch(effectiveModelId) ? `${base} (Deep Analysis)` : base;
  }, [effectiveModelId, byokActive]);

  const controller = useChatController({
    model: settings.model,
    webSearchEnabled: settings.webSearchEnabled,
  });

  const state = useChatState({
    messages: controller.messages,
    sessions: controller.sessions,
    currentSession: controller.currentSession,
    input: controller.input,
    isLoading: controller.isLoading,
    isMobile: controller.isMobile,
    viewportHeight: controller.viewportHeight,
    isGeneratingReport: controller.isGeneratingReport,
    memoryContext: controller.memoryContext,
    textareaRef: controller.textareaRef,
    messagesContainerRef: controller.messagesContainerRef,
    inputContainerRef: controller.inputContainerRef,
    isNearBottom: controller.isNearBottom,
    showSidebar: controller.showSidebar,
  });

  const actions = useChatActions({
    chatState: state,
    setInput: controller.setInput,
    sendMessage: controller.sendMessage,
    addMessageToChat: controller.addMessageToChat,
    createObsessionsCompulsionsTable: controller.createObsessionsCompulsionsTable,
    scrollToBottom: controller.scrollToBottom,
    updateSettings,
    settings,
    router,
    showToast,
    toastT,
    setByokActive,
    setShowSidebar: controller.setShowSidebar,
  });

  const { modals, actions: modalActions } = useChatModals();

  const value = useMemo(
    () => ({
      state,
      actions,
      modals,
      modalActions,
      controller,
      modelLabel,
      byokActive,
    }),
    [state, actions, modals, modalActions, controller, modelLabel, byokActive]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
