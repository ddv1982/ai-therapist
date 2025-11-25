# Hook Dependency Analysis - Task 3.1

## Overview

This document maps the dependency graph of `useChatController` and its child hooks, identifies performance bottlenecks, and outlines the refactoring strategy.

## Current Structure

### useChatController (366 lines)

The main orchestration hook that composes the following hooks:

```
useChatController
├── useChatMessages (598 lines) - Message state, persistence, metadata
├── useScrollToBottom - Scroll behavior management
├── useChatTransport - Chat transport layer
├── useMemoryContext - Memory context for sessions
├── useChatSessions - Session CRUD operations
├── useChatViewport - Mobile/viewport detection
├── useChatUiState - UI state (input, loading, sidebar)
├── useChatStreaming - AI streaming logic
├── useSendMessage - Message send orchestration
└── useGenerateReport - Report generation
```

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          useChatController                               │
│                           (orchestration)                                │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌──────────────────┐
│useChatMessages│     │ useChatSessions │     │  useChatUiState  │
│   (598 loc)   │     │   (140 loc)     │     │    (48 loc)      │
│               │     │                 │     │                  │
│ • messages    │     │ • sessions      │     │ • input          │
│ • loadMessages│     │ • currentSession│     │ • isLoading      │
│ • addMessage  │     │ • loadSessions  │     │ • showSidebar    │
│ • updateMeta  │     │ • deleteSession │     │ • refs           │
└───────┬───────┘     └────────┬────────┘     └──────────────────┘
        │                      │
        │  ┌───────────────────┤
        │  │                   │
        ▼  ▼                   ▼
┌───────────────┐     ┌─────────────────┐     ┌──────────────────┐
│useChatStreaming│    │ useSendMessage  │     │ useGenerateReport│
│   (178 loc)    │    │   (90 loc)      │     │    (80 loc)      │
│                │    │                 │     │                  │
│ • startStream  │    │ • sendMessage   │     │ • generateReport │
│ • stopStream   │    │                 │     │                  │
└────────────────┘    └─────────────────┘     └──────────────────┘
        │
        ▼
┌───────────────┐     ┌─────────────────┐     ┌──────────────────┐
│useChatTransport│    │useScrollToBottom│     │ useChatViewport  │
│   (external)   │    │   (external)    │     │    (52 loc)      │
└────────────────┘    └─────────────────┘     └──────────────────┘
```

## Data Flow Analysis

### Message Flow

1. User types input → `useChatUiState.input`
2. User sends message → `useSendMessage.sendMessage()`
3. Session ensured → `useChatSessions.ensureActiveSession()`
4. Message added to UI → `useChatMessages.setMessages()`
5. AI stream started → `useChatStreaming.startStream()`
6. Stream updates → `useChatMessages.setMessages()`
7. Message persisted → `apiClient.postMessage()`

### Session Flow

1. App loads → `useChatSessions.loadSessions()`
2. User selects session → `useChatSessions.setCurrentSessionAndLoad()`
3. Messages loaded → `useChatMessages.loadMessages()`

## Identified Performance Bottlenecks

### 1. Large Dependency Arrays

`useChatMessages` has complex state management with multiple refs and effects that could trigger unnecessary re-renders.

### 2. Metadata Management Complexity

The pending metadata queue system adds complexity:

- `pendingMetadataRef` - Map of pending metadata updates
- `pendingFlushRef` - Set of in-flight flush operations
- Multiple effects to retry failed updates

### 3. Message Hydration on Every Update

`hydrateMessage` is called on every message update, which could be optimized.

### 4. No Virtual Scrolling

Large message histories render all messages, impacting performance.

## Responsibilities in useChatMessages (598 lines)

| Responsibility                            | Lines | Should Extract?      |
| ----------------------------------------- | ----- | -------------------- |
| Message state management                  | ~50   | Keep in hook         |
| Message persistence (API calls)           | ~150  | Yes → Service        |
| Metadata management (queue, flush, retry) | ~200  | Yes → Service        |
| Message hydration                         | ~30   | Keep (pure function) |
| Temporary message handling                | ~40   | Keep in hook         |
| Metadata derivation                       | ~30   | Extract to utility   |

## Refactoring Strategy

### Phase 1: Extract Services (Tasks 3.2, 3.3)

1. **MessagePersistenceService** (`src/lib/services/chat/message-persistence.service.ts`)
   - `saveMessage(sessionId, message)` - Save to API
   - `loadMessages(sessionId)` - Load from API
   - `deleteMessages(sessionIds)` - Delete messages (future)
   - Handles API communication, error handling, and response transformation

2. **MetadataManager** (`src/lib/services/chat/metadata-manager.service.ts`)
   - `updateMetadata(sessionId, messageId, metadata, options)` - Update metadata
   - `queueUpdate(messageId, metadata)` - Queue for pending messages
   - `flushPending(messageId)` - Flush queued updates
   - Handles retry logic, merge strategies, and optimistic updates

### Phase 2: Simplify useChatMessages (Task 3.4)

After extracting services, the hook should:

- Focus on state management only
- Delegate persistence to `MessagePersistenceService`
- Delegate metadata to `MetadataManager`
- Target: <200 lines

### Phase 3: Create Focused Hooks (Tasks 3.5, 3.6)

1. **useChatCore** - Core message state and actions
   - `messages`, `setMessages`
   - `addMessage`, `updateMessage`, `clearMessages`
   - Clean, minimal interface

2. **useChatUI** - UI-specific state (already exists as `useChatUiState`)
   - Expand to include scroll and viewport concerns
   - `input`, `isLoading`, `refs`
   - `scrollToBottom`, `isNearBottom`
   - `isMobile`, `viewportHeight`

### Phase 4: Simplify useChatController (Task 3.7)

Final controller should:

- Compose `useChatCore`, `useChatUI`, `useChatSessions`
- Expose clean public API
- Target: <150 lines
- No direct API calls or complex logic

## Service Interface Design

### MessagePersistenceService

```typescript
interface IMessagePersistenceService {
  saveMessage(sessionId: string, message: NewMessagePayload): Promise<Result<SavedMessage>>;
  loadMessages(sessionId: string): Promise<Result<Message[]>>;
}

type NewMessagePayload = {
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  metadata?: Record<string, unknown>;
};
```

### MetadataManager

```typescript
interface IMetadataManager {
  updateMetadata(
    sessionId: string,
    messageId: string,
    metadata: Record<string, unknown>,
    options?: { mergeStrategy?: 'merge' | 'replace' }
  ): Promise<Result<Message>>;

  queueUpdate(messageId: string, update: QueuedMetadataUpdate): void;
  flushPending(messageId: string): Promise<void>;
  hasPending(messageId: string): boolean;
  transferPending(fromId: string, toId: string, sessionId: string): void;
}
```

## Success Metrics

| Metric                     | Current   | Target     |
| -------------------------- | --------- | ---------- |
| `use-chat-messages.ts`     | 598 lines | <200 lines |
| `use-chat-controller.ts`   | 366 lines | <150 lines |
| Service test coverage      | N/A       | ≥95%       |
| Render time (100 messages) | TBD       | <16ms      |
