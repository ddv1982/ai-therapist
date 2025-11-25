# Data Flow Architecture

This document describes how data flows through the AI Therapist application.

## State Management Overview

```mermaid
flowchart LR
    subgraph Sources["Data Sources"]
        Convex["Convex<br/>(Server State)"]
        Local["Local State<br/>(UI State)"]
        URL["URL State<br/>(Route Params)"]
    end

    subgraph Managers["State Managers"]
        TQ["TanStack Query<br/>(Server Cache)"]
        React["React State<br/>(useState/useReducer)"]
        Router["Next.js Router<br/>(URL State)"]
    end

    subgraph Consumers["Consumers"]
        Components["React Components"]
        Hooks["Custom Hooks"]
    end

    Convex --> TQ
    Local --> React
    URL --> Router

    TQ --> Components
    React --> Components
    Router --> Components

    TQ --> Hooks
    React --> Hooks
    Hooks --> Components
```

## Chat Message Flow

### Sending a Message

```mermaid
sequenceDiagram
    participant UI as Chat UI
    participant Hook as useChatController
    participant TQ as TanStack Query
    participant API as /api/chat
    participant AI as AI SDK
    participant Enc as Encryption
    participant Conv as Convex

    UI->>Hook: sendMessage(content)
    Hook->>TQ: Optimistic update
    Note over TQ: Show message immediately

    Hook->>API: POST /api/chat
    API->>Enc: Encrypt message
    Enc->>API: Encrypted content
    API->>Conv: Store user message
    Conv->>API: Message ID

    API->>AI: streamText(prompt)

    loop Streaming Response
        AI->>API: Token chunk
        API->>Hook: Stream chunk
        Hook->>UI: Update display
    end

    AI->>API: Complete response
    API->>Enc: Encrypt AI response
    Enc->>API: Encrypted content
    API->>Conv: Store AI message
    Conv->>API: Message ID

    API->>Hook: Stream complete
    Hook->>TQ: Invalidate cache
    TQ->>Conv: Refetch messages
    Conv->>TQ: Updated list
    TQ->>UI: Final state
```

### Loading Messages

```mermaid
sequenceDiagram
    participant UI as Chat Page
    participant Hook as useChatMessages
    participant TQ as TanStack Query
    participant API as /api/messages
    participant Enc as Encryption
    participant Conv as Convex

    UI->>Hook: Load session messages
    Hook->>TQ: useQuery(['messages', sessionId])

    alt Cache Hit
        TQ->>Hook: Cached messages
        Hook->>UI: Render immediately
    else Cache Miss
        TQ->>API: GET /api/messages
        API->>Conv: Query messages
        Conv->>API: Encrypted messages
        API->>Enc: Decrypt messages
        Enc->>API: Plain messages
        API->>TQ: Response
        TQ->>Hook: Fresh messages
        Hook->>UI: Render messages
    end
```

## Session Management Flow

```mermaid
flowchart TD
    subgraph UserAction["User Action"]
        NewSession["Create Session"]
        SwitchSession["Switch Session"]
        DeleteSession["Delete Session"]
    end

    subgraph Validation["Validation Layer"]
        AuthCheck["Auth Check"]
        RateLimit["Rate Limit Check"]
        InputVal["Input Validation"]
    end

    subgraph Processing["Processing"]
        SessionCreate["Create in Convex"]
        SessionUpdate["Update Current"]
        SessionDelete["Delete + Cleanup"]
        MessageDelete["Delete Messages"]
    end

    subgraph State["State Updates"]
        ConvexState["Convex DB"]
        QueryCache["Query Cache"]
        UIState["UI State"]
    end

    NewSession --> AuthCheck
    SwitchSession --> AuthCheck
    DeleteSession --> AuthCheck

    AuthCheck --> RateLimit
    RateLimit --> InputVal

    InputVal --> SessionCreate
    InputVal --> SessionUpdate
    InputVal --> SessionDelete

    SessionCreate --> ConvexState
    SessionUpdate --> ConvexState
    SessionDelete --> MessageDelete
    MessageDelete --> ConvexState

    ConvexState --> QueryCache
    QueryCache --> UIState
```

## Authentication Data Flow

```mermaid
flowchart LR
    subgraph Browser
        Cookie["Session Cookie"]
        LocalUI["UI State"]
    end

    subgraph Middleware
        ClerkMW["Clerk Middleware"]
        JWT["JWT Token"]
    end

    subgraph Server
        APIRoute["API Route"]
        ConvexAuth["Convex Auth"]
    end

    Cookie --> ClerkMW
    ClerkMW --> JWT
    JWT --> APIRoute
    APIRoute --> ConvexAuth
    ConvexAuth --> APIRoute
    APIRoute --> LocalUI
```

## Cache Invalidation Strategy

### Invalidation Map

| Mutation         | Invalidated Queries                    |
| ---------------- | -------------------------------------- |
| `message.send`   | `messages`, `sessions` (message count) |
| `session.create` | `sessions`                             |
| `session.delete` | `sessions`, `messages`                 |
| `session.update` | `sessions`                             |
| `user.update`    | `user`                                 |

### Implementation

```typescript
// Cache invalidation pattern
const invalidationMap = {
  'message.send': ['messages', 'sessions'],
  'session.create': ['sessions'],
  'session.delete': ['sessions', 'messages'],
  'session.update': ['sessions'],
} as const;

// After mutation
queryClient.invalidateQueries({
  queryKey: invalidationMap[mutationType],
});
```

## Real-Time Updates

### Convex Reactive Queries

```mermaid
sequenceDiagram
    participant C1 as Client 1
    participant C2 as Client 2
    participant Conv as Convex

    Note over C1,Conv: Both clients subscribed

    C1->>Conv: Send message
    Conv->>Conv: Update database

    par Parallel Updates
        Conv->>C1: Push update
        Conv->>C2: Push update
    end

    C1->>C1: Re-render
    C2->>C2: Re-render
```

### Update Flow

```typescript
// Convex reactive query subscription
const messages = useQuery(
  api.messages.list,
  { sessionId },
  {
    // Automatically re-runs when data changes
    suspense: false,
  }
);
```

## Error Recovery Flow

```mermaid
flowchart TD
    Request["API Request"]

    Request --> Success{Success?}

    Success -->|Yes| UpdateUI["Update UI"]
    Success -->|No| RetryCheck{Retryable?}

    RetryCheck -->|Yes| Retry["Exponential Backoff"]
    RetryCheck -->|No| ErrorState["Show Error"]

    Retry --> RetryCount{Max Retries?}
    RetryCount -->|No| Request
    RetryCount -->|Yes| ErrorState

    ErrorState --> RecoverOpt["Recovery Options"]
    RecoverOpt --> ManualRetry["Manual Retry"]
    RecoverOpt --> Rollback["Rollback Optimistic"]

    ManualRetry --> Request
    Rollback --> PreviousState["Restore Previous State"]
```

## Form Data Flow

```mermaid
flowchart LR
    subgraph Input
        UserInput["User Input"]
        Validation["Zod Validation"]
    end

    subgraph Transform
        Sanitize["Sanitize"]
        Transform["Transform"]
    end

    subgraph Persist
        API["API Route"]
        Convex["Convex"]
    end

    subgraph Feedback
        Success["Success Toast"]
        Error["Error Display"]
    end

    UserInput --> Validation
    Validation -->|Valid| Sanitize
    Validation -->|Invalid| Error

    Sanitize --> Transform
    Transform --> API
    API --> Convex

    Convex -->|Success| Success
    Convex -->|Error| Error
```

## Performance Optimizations

### Query Deduplication

```typescript
// Same query key = deduplicated request
const { data: session1 } = useQuery(['session', id]); // Request 1
const { data: session2 } = useQuery(['session', id]); // Deduped
```

### Optimistic Updates

```typescript
// Optimistic update pattern
const mutation = useMutation({
  mutationFn: sendMessage,
  onMutate: async (newMessage) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['messages']);

    // Snapshot previous value
    const previous = queryClient.getQueryData(['messages']);

    // Optimistically update
    queryClient.setQueryData(['messages'], (old) => [...old, newMessage]);

    return { previous };
  },
  onError: (err, newMessage, context) => {
    // Rollback on error
    queryClient.setQueryData(['messages'], context.previous);
  },
});
```

### Prefetching

```typescript
// Prefetch on hover/focus
const prefetchSession = (sessionId: string) => {
  queryClient.prefetchQuery({
    queryKey: ['session', sessionId],
    queryFn: () => fetchSession(sessionId),
    staleTime: 30_000, // Consider fresh for 30s
  });
};
```

## Data Privacy Flow

```mermaid
flowchart TD
    subgraph Collection
        Input["User Input"]
        Meta["Metadata"]
    end

    subgraph Processing
        Encrypt["Encrypt Content"]
        Sanitize["Sanitize Metadata"]
    end

    subgraph Storage
        EncryptedDB["Encrypted in Convex"]
        Logs["Sanitized Logs"]
    end

    subgraph Access
        AuthZ["Authorization Check"]
        Decrypt["Decrypt on Read"]
    end

    Input --> Encrypt
    Meta --> Sanitize

    Encrypt --> EncryptedDB
    Sanitize --> Logs

    EncryptedDB --> AuthZ
    AuthZ --> Decrypt
    Decrypt --> Output["Decrypted for User"]
```

## Related Documentation

- [System Overview](./OVERVIEW.md)
- [Component Hierarchy](./COMPONENT-HIERARCHY.md)
- [Data Model](/docs/DATA_MODEL.md)
