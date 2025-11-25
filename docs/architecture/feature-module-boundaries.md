# Feature Module Boundaries Documentation

**Created:** 2024-11-25  
**Status:** Current State Analysis

---

## 1. Current Feature Module Structure

```
src/features/
├── auth/                    # Authentication UI (minimal)
│   └── components/
├── chat/                    # Core chat infrastructure
│   ├── components/          # UI: ChatComposer, ChatHeader, VirtualizedMessageList
│   │   └── dashboard/       # Dashboard-specific: ChatSidebar, ChatEmptyState
│   ├── context/             # ChatHeaderContext
│   ├── messages/            # Message components: Message, MessageActions, etc.
│   ├── config.ts            # Model configurations (DEFAULT_MODEL_ID, etc.)
│   └── index.ts             # Barrel exports
├── shared/                  # Shared utilities
│   ├── dev-error-trigger.tsx
│   └── index.ts
├── therapy/                 # Therapy-specific features
│   ├── cbt/                 # CBT diary and thought tracking
│   ├── components/          # Therapy UI components
│   ├── memory/              # Memory management and session reports
│   ├── obsessions-compulsions/  # O&C tracking
│   ├── shared/              # Shared therapy utilities
│   ├── ui/                  # Therapy UI primitives
│   └── index.ts             # Barrel exports
└── therapy-chat/            # Orchestration layer (OVERLAP CONCERN)
    ├── components/          # ChatContainer, ChatControls (thin wrappers)
    └── hooks/               # useChatState, useChatActions, useChatModals
```

---

## 2. Module Responsibilities

### 2.1 `features/chat/` - Chat Infrastructure

**Purpose:** Core chat UI components and message rendering

**Responsibilities:**

- Message list rendering (VirtualizedMessageList)
- Message components (Message, MessageActions, MessageAvatar, MessageContent, MessageTimestamp)
- Chat input (ChatComposer)
- Chat header and sidebar
- Session controls
- Model configuration constants

**Exports (via index.ts):**

- SessionControls, SessionSidebar, TypingIndicator, VirtualizedMessageList
- Message, MessageActions, MessageAvatar, MessageContent, MessageTimestamp

**Key Files:**
| File | Lines | Purpose |
|------|-------|---------|
| `components/virtualized-message-list.tsx` | 650+ | Message list with virtualization |
| `messages/message-actions.tsx` | 400+ | Message action buttons |
| `config.ts` | 15 | Model ID constants |

### 2.2 `features/therapy/` - Therapy Features

**Purpose:** Therapy-specific features and frameworks

**Responsibilities:**

- CBT diary functionality
- Memory and session management
- Session report generation and viewing
- Therapeutic frameworks (CBT, ERP)
- Therapy-specific UI components

**Exports (via index.ts):**

- CBTExportButton
- MemoryManagementModal, SessionReportDetailModal, SessionReportViewer
- ProgressIndicator, TherapyCard
- Shared therapy components

**Key Files:**
| File | Lines | Purpose |
|------|-------|---------|
| `cbt/hooks/use-cbt-diary-flow.ts` | 200+ | CBT diary state management |
| `memory/session-report-viewer.tsx` | 200+ | Report viewing |
| `components/cbt-step-wrapper.tsx` | 400+ | CBT step UI |

### 2.3 `features/therapy-chat/` - Orchestration Layer

**Purpose:** Thin orchestration layer combining chat and therapy concerns

**Responsibilities:**

- Consolidate chat state into single object (useChatState)
- Consolidate chat actions into single object (useChatActions)
- Modal state management (useChatModals)
- Thin wrapper components for chat container and controls

**NO barrel exports (missing index.ts)**

**Usage:** Only by `app/page.tsx`

**Key Files:**
| File | Lines | Purpose |
|------|-------|---------|
| `hooks/use-chat-state.ts` | 120 | State consolidation |
| `hooks/use-chat-actions.ts` | 210 | Action consolidation |
| `hooks/use-chat-modals.ts` | 80 | Modal state |
| `components/chat-container.tsx` | 115 | Message container wrapper |
| `components/chat-controls.tsx` | 45 | Input controls wrapper |

### 2.4 `features/auth/` - Authentication

**Purpose:** Authentication-related UI components

**Responsibilities:**

- Minimal auth UI (mostly handled by Clerk)

**Status:** Minimal, well-scoped

### 2.5 `features/shared/` - Shared Utilities

**Purpose:** Utilities shared across features

**Exports (via index.ts):**

- DevErrorTrigger (development only)

---

## 3. Import Dependencies Analysis

### 3.1 Dependency Graph

```
                    ┌──────────────────┐
                    │   app/page.tsx   │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
      ┌───────────┐  ┌─────────────┐  ┌──────────┐
      │   chat    │  │therapy-chat │  │ therapy  │
      └───────────┘  └──────┬──────┘  └────┬─────┘
                            │              │
                    imports │              │ imports
                            │              │
                            ▼              ▼
                      ┌───────────────────────┐
                      │        chat           │
                      │  (components, types)  │
                      └───────────────────────┘
```

### 3.2 therapy-chat → chat Imports

```typescript
// Components
import { ChatComposer } from '@/features/chat/components/chat-composer';
import { SystemBanner } from '@/features/chat/components/system-banner';
import { ChatEmptyState } from '@/features/chat/components/dashboard/chat-empty-state';
import { VirtualizedMessageList } from '@/features/chat/components/virtualized-message-list';

// Types
import type { MessageData } from '@/features/chat/messages/message';

// Config
import { DEFAULT_MODEL_ID, ANALYTICAL_MODEL_ID, LOCAL_MODEL_ID } from '@/features/chat/config';
```

### 3.3 therapy → chat Imports

```typescript
// Used in session-report-viewer.tsx
import { MessageContent } from '@/features/chat/messages/message-content';
import { MessageAvatar } from '@/features/chat/messages/message-avatar';
import { MessageTimestamp } from '@/features/chat/messages/message-timestamp';
```

### 3.4 Circular Dependencies

**None detected** - All imports flow in one direction:

- `therapy-chat` → `chat` (valid)
- `therapy` → `chat` (valid)
- No reverse imports

---

## 4. Overlap Analysis

### 4.1 therapy-chat Overlap with chat

| Concern           | chat                   | therapy-chat            | Overlap         |
| ----------------- | ---------------------- | ----------------------- | --------------- |
| Message rendering | VirtualizedMessageList | ChatContainer (wrapper) | Wrapper pattern |
| Input handling    | ChatComposer           | ChatControls (wrapper)  | Wrapper pattern |
| State management  | -                      | useChatState            | Consolidation   |
| Actions           | -                      | useChatActions          | Consolidation   |

**Assessment:** `therapy-chat` is a **pure orchestration layer** that:

1. Does NOT duplicate chat functionality
2. Wraps chat components with therapy-specific props
3. Consolidates state/actions for simpler prop passing

### 4.2 therapy-chat Overlap with therapy

| Concern      | therapy                 | therapy-chat               | Overlap    |
| ------------ | ----------------------- | -------------------------- | ---------- |
| Memory modal | MemoryManagementModal   | useChatModals (opens it)   | No overlap |
| O&C handling | obsessions-compulsions/ | useChatActions (calls it)  | No overlap |
| CBT diary    | cbt/                    | useChatActions (navigates) | No overlap |

**Assessment:** `therapy-chat` **orchestrates** therapy features but doesn't duplicate them.

---

## 5. Business Logic Locations

### 5.1 Core Chat Logic

| Logic               | Location                               | Notes                |
| ------------------- | -------------------------------------- | -------------------- |
| Message persistence | `src/hooks/use-chat-messages.ts`       | 598 lines, complex   |
| Chat orchestration  | `src/hooks/use-chat-controller.ts`     | 366 lines, 15+ hooks |
| Message streaming   | `src/hooks/chat/use-chat-streaming.ts` | AI response handling |
| Send message        | `src/hooks/chat/use-send-message.ts`   | Message sending      |
| Sessions            | `src/hooks/use-chat-sessions.ts`       | Session management   |

### 5.2 Model Configuration

| Config          | Location                         | Notes                |
| --------------- | -------------------------------- | -------------------- |
| Model IDs       | `src/features/chat/config.ts`    | Constants only       |
| Model metadata  | `src/ai/model-metadata.ts`       | Labels, capabilities |
| Model selection | `src/lib/chat/model-selector.ts` | Selection logic      |

### 5.3 Therapy Logic

| Logic             | Location                          | Notes             |
| ----------------- | --------------------------------- | ----------------- |
| CBT diary flow    | `src/features/therapy/cbt/hooks/` | Diary state       |
| Memory management | `src/features/therapy/memory/`    | Reports, context  |
| Session reports   | `src/lib/therapy/`                | Report generation |

---

## 6. Issues Identified

### 6.1 Missing Barrel Export

- `therapy-chat/` has no `index.ts`
- Imports are verbose: `@/features/therapy-chat/hooks/use-chat-state`

### 6.2 Unclear Module Purpose

- `therapy-chat` name suggests therapy-specific chat
- Actually it's a page-level orchestration layer
- Could be renamed to `chat-orchestration` or merged

### 6.3 Tight Coupling to Page

- `therapy-chat` is only used by `app/page.tsx`
- Hooks consolidate state that could be done at page level
- Components are thin wrappers adding minimal value

### 6.4 Hook Complexity (Outside this module)

- Main chat logic in `src/hooks/` not in features
- 15+ hook orchestration in use-chat-controller

---

## 7. Recommendations

### Option A: Absorb therapy-chat into chat (Recommended)

```
src/features/chat/
├── components/          # All UI components
├── context/             # Contexts
├── hooks/               # Add useChatState, useChatActions, useChatModals
├── messages/            # Message components
├── config.ts
└── index.ts             # Updated exports
```

**Rationale:**

- therapy-chat is pure orchestration, not therapy-specific
- Reduces confusion about module boundaries
- Single source for chat-related code

### Option B: Rename and Keep Separate

```
src/features/chat-page/  # Renamed from therapy-chat
├── components/
├── hooks/
└── index.ts             # Add barrel export
```

**Rationale:**

- Makes purpose clear (page-level orchestration)
- Keeps page concerns separate from reusable chat components

### Option C: Move to Page Directory

```
src/app/
├── page.tsx
├── _components/         # Page-specific components
├── _hooks/              # Page-specific hooks
```

**Rationale:**

- Co-locates page with its orchestration
- Next.js convention for page-specific code

---

## 8. Component Directory Status

The `src/components/ui/` directory (48 files) already has partial organization:

### Already Organized

- `therapeutic-cards/` → base/, compound/, specialized/
- `therapeutic-forms/` → base/, inputs/, specialized/
- `therapeutic-layouts/` → base/, specialized/
- `therapeutic-modals/` → base/, compound/, hooks/, specialized/

### Flat Files Needing Organization

**Primitives (shadcn/ui base):**

- button.tsx, input.tsx, label.tsx, textarea.tsx
- progress.tsx, slider.tsx, switch.tsx
- select.tsx, popover.tsx, separator.tsx
- scroll-area.tsx, tabs.tsx, table.tsx

**Composed Components:**

- command-palette.tsx, command.tsx
- dialog.tsx, drawer.tsx, sheet.tsx
- dropdown-menu.tsx, form.tsx
- error-boundary.tsx, markdown.tsx
- calendar.tsx, date-picker.tsx

**Therapeutic (flat):**

- therapeutic-button.tsx
- therapeutic-card.tsx
- therapeutic-card-grid.tsx
- therapeutic-table.tsx
- therapeutic-text.tsx

**Other:**

- alert.tsx, badge.tsx, skeleton.tsx
- card.tsx, card-field-display.tsx
- sonner.tsx, toast.tsx
- draggable-item.tsx, loading-fallback.tsx
- language-switcher.tsx, message-table.tsx
- motion.tsx

---

## Appendix: File Counts

| Module                | Files | Has index.ts |
| --------------------- | ----- | ------------ |
| features/chat         | 18    | ✅           |
| features/therapy      | 25+   | ✅           |
| features/therapy-chat | 5     | ❌           |
| features/shared       | 2     | ✅           |
| features/auth         | 2     | ❌           |
| components/ui         | 48+   | ❌           |
