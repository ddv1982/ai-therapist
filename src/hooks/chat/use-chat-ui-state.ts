import { useEffect, useRef, useState } from 'react';

export function useChatUiState() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const inputContainerRef = useRef<HTMLDivElement | null>(null);

  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleFocus = () => {
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    focusTimeoutRef.current = setTimeout(() => {
      focusTimeoutRef.current = null;
      textareaRef.current?.focus();
    }, 50);
  };

  useEffect(() => {
    scheduleFocus();
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
        focusTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      scheduleFocus();
    }
  }, [isLoading]);

  return {
    input,
    setInput,
    isLoading,
    setIsLoading,
    showSidebar,
    setShowSidebar,
    isGeneratingReport,
    setIsGeneratingReport,
    textareaRef,
    messagesContainerRef,
    inputContainerRef,
  };
}
