/**
 * Types for Therapy Chat Hooks
 *
 * Shared type definitions for the therapy chat system.
 * Extracted from use-therapy-chat.ts for better organization.
 *
 * @module hooks/chat/types
 */

import type { UIMessage } from 'ai';
import type { MessageData } from '@/features/chat/messages/message';

/**
 * Options for the useTherapyChat hook.
 */
export interface UseTherapyChatOptions {
  /** Current session ID, null for new sessions */
  sessionId: string | null;
  /** AI model ID to use (e.g., 'llama-3.3-70b-versatile') */
  model?: string;
  /** Whether web search is enabled for the model */
  webSearchEnabled?: boolean;
  /** BYOK API key if user provided their own */
  byokKey?: string | null;
  /** Callback when message generation completes */
  onFinish?: (message: UIMessage) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

/**
 * Options for handleSubmit method.
 */
export interface HandleSubmitOptions {
  /** Optional attachments for the message */
  experimental_attachments?: FileList | undefined;
  /** Override session ID for this submission (used when session is created mid-send) */
  sessionId?: string;
  /** Called to create a session if none exists - enables atomic session creation + message send */
  ensureSession?: () => Promise<string>;
}

/**
 * Return type for the useTherapyChat hook.
 */
export interface UseTherapyChatReturn {
  /** Array of all messages in the current session */
  messages: MessageData[];
  /** Current value of the input field */
  input: string;
  /** Whether a message is currently being streamed */
  isLoading: boolean;
  /** Any error that occurred during the last operation */
  error: Error | undefined;
  /** Handle input value change */
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  /** Handle form submission */
  handleSubmit: (
    e?: React.FormEvent<HTMLFormElement>,
    options?: HandleSubmitOptions
  ) => void;
  /** Set the input value directly */
  setInput: React.Dispatch<React.SetStateAction<string>>;
  /** Set messages directly (supports functional updates) */
  setMessages: (messages: MessageData[] | ((prev: MessageData[]) => MessageData[])) => void;
  /** Reload the last message by resending the last user message */
  reload: () => Promise<void>;
  /** Stop the current stream */
  stop: () => void;
  /** Clear the session (messages and input) */
  clearSession: () => void;
  /** Load messages from the server for the current session */
  loadSessionMessages: () => Promise<void>;
  /** Append a message to the chat */
  append: (message: { role: 'user' | 'assistant'; content: string }) => Promise<void>;
}
