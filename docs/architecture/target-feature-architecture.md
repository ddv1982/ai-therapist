# Target Feature Architecture

**Created:** 2024-11-25  
**Status:** Implementation Plan

---

## 1. Decision: Consolidate therapy-chat into chat

**Decision:** Merge `therapy-chat` module into `chat` feature

**Rationale:**

1. `therapy-chat` is a pure orchestration layer with no therapy-specific logic
2. It only imports from `chat` (components, types, config)
3. It's only used by one page (`app/page.tsx`)
4. The hooks (useChatState, useChatActions, useChatModals) are generic chat orchestration
5. Consolidation reduces confusion about module boundaries
6. Single source for all chat-related code

**Alternative Considered:**

- Rename to `chat-page` and keep separate
- Rejected because the hooks/components are reusable for any chat page

---

## 2. Target Feature Module Structure

```
src/features/
├── auth/                        # Authentication UI (unchanged)
│   └── components/
│
├── chat/                        # Chat infrastructure (EXPANDED)
│   ├── components/              # UI components
│   │   ├── chat-composer.tsx
│   │   ├── chat-container.tsx   # ← Moved from therapy-chat
│   │   ├── chat-controls.tsx    # ← Moved from therapy-chat
│   │   ├── chat-header.tsx
│   │   ├── session-controls.tsx
│   │   ├── session-sidebar.tsx
│   │   ├── session-sidebar-container.tsx
│   │   ├── system-banner.tsx
│   │   ├── typing-indicator.tsx
│   │   ├── user-menu.tsx
│   │   ├── virtualized-message-list.tsx
│   │   ├── dashboard/
│   │   │   ├── chat-empty-state.tsx
│   │   │   └── chat-sidebar.tsx
│   │   └── index.ts             # Component barrel
│   │
│   ├── context/
│   │   └── chat-header-context.tsx
│   │
│   ├── hooks/                   # ← NEW: Moved from therapy-chat
│   │   ├── use-chat-state.ts
│   │   ├── use-chat-actions.ts
│   │   ├── use-chat-modals.ts
│   │   └── index.ts             # Hooks barrel
│   │
│   ├── messages/
│   │   ├── message.tsx
│   │   ├── message-actions.tsx
│   │   ├── message-avatar.tsx
│   │   ├── message-content.tsx
│   │   ├── message-timestamp.tsx
│   │   └── index.ts             # Messages barrel
│   │
│   ├── config.ts
│   └── index.ts                 # Main barrel (updated)
│
├── shared/                      # Shared utilities (unchanged)
│   ├── dev-error-trigger.tsx
│   └── index.ts
│
└── therapy/                     # Therapy features (unchanged)
    ├── cbt/
    ├── components/
    ├── memory/
    ├── obsessions-compulsions/
    ├── shared/
    ├── ui/
    └── index.ts
```

**Removed:**

```
src/features/therapy-chat/       # ← DELETED (merged into chat)
```

---

## 3. Target Component Directory Structure

```
src/components/ui/
├── primitives/                  # Base shadcn/ui components
│   ├── alert.tsx
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── drawer.tsx
│   ├── dropdown-menu.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── popover.tsx
│   ├── progress.tsx
│   ├── scroll-area.tsx
│   ├── select.tsx
│   ├── separator.tsx
│   ├── sheet.tsx
│   ├── skeleton.tsx
│   ├── slider.tsx
│   ├── switch.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   ├── textarea.tsx
│   └── index.ts                 # Barrel export
│
├── composed/                    # Compound/composite components
│   ├── calendar.tsx
│   ├── card-field-display.tsx
│   ├── command-palette.tsx
│   ├── command.tsx
│   ├── date-picker.tsx
│   ├── draggable-item.tsx
│   ├── error-boundary.tsx
│   ├── language-switcher.tsx
│   ├── loading-fallback.tsx
│   ├── markdown.tsx
│   ├── message-table.tsx
│   ├── motion.tsx
│   ├── sonner.tsx
│   ├── toast.tsx
│   └── index.ts                 # Barrel export
│
├── therapeutic/                 # Therapy-specific components
│   ├── buttons/
│   │   ├── therapeutic-button.tsx
│   │   └── index.ts
│   ├── cards/                   # Existing therapeutic-cards/ content
│   │   ├── base/
│   │   ├── compound/
│   │   ├── specialized/
│   │   ├── therapeutic-card.tsx
│   │   ├── therapeutic-card-grid.tsx
│   │   └── index.ts
│   ├── forms/                   # Existing therapeutic-forms/ content
│   │   ├── base/
│   │   ├── inputs/
│   │   ├── specialized/
│   │   └── index.ts
│   ├── layouts/                 # Existing therapeutic-layouts/ content
│   │   ├── base/
│   │   ├── specialized/
│   │   └── index.ts
│   ├── modals/                  # Existing therapeutic-modals/ content
│   │   ├── base/
│   │   ├── compound/
│   │   ├── hooks/
│   │   ├── specialized/
│   │   └── index.ts
│   ├── text/
│   │   ├── therapeutic-text.tsx
│   │   └── index.ts
│   ├── tables/
│   │   ├── therapeutic-table.tsx
│   │   └── index.ts
│   └── index.ts                 # Main therapeutic barrel
│
├── markdown-styles.css          # Global styles (unchanged)
└── index.ts                     # Main UI barrel (re-exports all)
```

---

## 4. Module Responsibilities (Target State)

### 4.1 features/chat/

**Responsibility:** All chat-related UI, state, and orchestration

**Public API (via index.ts):**

```typescript
// Components
export { ChatComposer } from './components/chat-composer';
export { ChatContainer } from './components/chat-container';
export { ChatControls } from './components/chat-controls';
export { ChatHeader } from './components/chat-header';
export { SessionControls } from './components/session-controls';
export { SessionSidebar } from './components/session-sidebar';
export { VirtualizedMessageList } from './components/virtualized-message-list';

// Messages
export { Message } from './messages/message';
export { MessageActions } from './messages/message-actions';
export { MessageAvatar } from './messages/message-avatar';
export { MessageContent } from './messages/message-content';
export { MessageTimestamp } from './messages/message-timestamp';
export type { MessageData } from './messages/message';

// Hooks
export { useChatState, type ChatState } from './hooks/use-chat-state';
export { useChatActions, type ChatActions } from './hooks/use-chat-actions';
export { useChatModals } from './hooks/use-chat-modals';

// Context
export { ChatHeaderProvider, useChatHeader } from './context/chat-header-context';

// Config
export { DEFAULT_MODEL_ID, ANALYTICAL_MODEL_ID, LOCAL_MODEL_ID, REPORT_MODEL_ID } from './config';
```

### 4.2 features/therapy/

**Responsibility:** Therapy-specific features (unchanged)

**Public API (via index.ts):**

```typescript
export { CBTExportButton } from './cbt/cbt-export-button';
export { MemoryManagementModal } from './memory/memory-management-modal';
export { SessionReportDetailModal } from './memory/session-report-detail-modal';
export { SessionReportViewer } from './memory/session-report-viewer';
export { ProgressIndicator } from './ui/progress-indicator';
export { TherapyCard } from './ui/therapy-card';
export * from './shared';
```

### 4.3 components/ui/

**Responsibility:** Reusable UI components

**Public API (via index.ts):**

```typescript
// Re-export all primitives
export * from './primitives';

// Re-export all composed
export * from './composed';

// Re-export all therapeutic
export * from './therapeutic';
```

---

## 5. Migration Path

### Phase 1: Move therapy-chat hooks to chat

1. Create `src/features/chat/hooks/` directory
2. Move `use-chat-state.ts`, `use-chat-actions.ts`, `use-chat-modals.ts`
3. Update internal imports within moved files
4. Update `chat/index.ts` to export hooks

### Phase 2: Move therapy-chat components to chat

1. Move `chat-container.tsx` and `chat-controls.tsx` to `chat/components/`
2. Update imports in moved files

### Phase 3: Update external imports

1. Update `app/page.tsx` to import from `@/features/chat`
2. Search for any other imports from `therapy-chat`
3. Update all found imports

### Phase 4: Remove therapy-chat module

1. Delete `src/features/therapy-chat/` directory
2. Verify no broken imports

### Phase 5: Reorganize components/ui

1. Create `primitives/`, `composed/`, `therapeutic/` directories
2. Move files according to target structure
3. Create barrel exports for each directory
4. Update all imports throughout codebase

### Phase 6: Verification

1. Run TypeScript check: `npx tsc --noEmit`
2. Run tests: `npm run test`
3. Run lint: `npm run lint`
4. Run build: `npm run build`

---

## 6. Import Path Changes

### Features

| Old Import                                          | New Import                                                       |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| `@/features/therapy-chat/hooks/use-chat-state`      | `@/features/chat/hooks/use-chat-state` or `@/features/chat`      |
| `@/features/therapy-chat/hooks/use-chat-actions`    | `@/features/chat/hooks/use-chat-actions` or `@/features/chat`    |
| `@/features/therapy-chat/hooks/use-chat-modals`     | `@/features/chat/hooks/use-chat-modals` or `@/features/chat`     |
| `@/features/therapy-chat/components/chat-container` | `@/features/chat/components/chat-container` or `@/features/chat` |
| `@/features/therapy-chat/components/chat-controls`  | `@/features/chat/components/chat-controls` or `@/features/chat`  |

### Components (after reorganization)

| Old Import                           | New Import                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| `@/components/ui/button`             | `@/components/ui/primitives/button` or `@/components/ui`                      |
| `@/components/ui/therapeutic-button` | `@/components/ui/therapeutic/buttons/therapeutic-button` or `@/components/ui` |
| `@/components/ui/error-boundary`     | `@/components/ui/composed/error-boundary` or `@/components/ui`                |

---

## 7. Barrel Export Strategy

### Principle: Public API via index.ts

Each module exposes a public API through its `index.ts`:

- External code imports from the barrel (e.g., `@/features/chat`)
- Internal code can import directly (e.g., `./components/chat-composer`)

### Example: features/chat/index.ts

```typescript
// Public API - what external code should use
export * from './components';
export * from './messages';
export * from './hooks';
export * from './context/chat-header-context';
export * from './config';
```

### Example: components/ui/index.ts

```typescript
// Re-export all subdirectories
export * from './primitives';
export * from './composed';
export * from './therapeutic';
```

---

## 8. Success Criteria

- [ ] `src/features/therapy-chat/` directory deleted
- [ ] All therapy-chat code moved to `src/features/chat/`
- [ ] All imports updated throughout codebase
- [ ] `features/chat/index.ts` exports all public API
- [ ] `components/ui/` organized into primitives/, composed/, therapeutic/
- [ ] Each subdirectory has barrel exports
- [ ] No circular dependencies between features
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run test` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
