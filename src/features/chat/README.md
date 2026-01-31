# Chat Feature Ownership

This feature keeps orchestration in context, with UI components focused on a single surface area.

Core owners

- `src/features/chat/context/chat-context.tsx`: App-level orchestration and public chat API.
- `src/features/chat/components/chat-container.tsx`: Message area container, banner, empty state, scroll affordance.
- `src/features/chat/components/chat-message-list/chat-message-list.tsx`: Message rendering, virtualization, and per-message UI.
- `src/features/chat/components/chat-header.tsx`: Model label, report entry, session header content.
- `src/features/chat/components/chat-sidebar.tsx`: Session list + session actions.

Hook responsibilities

- `src/features/chat/hooks/use-chat-modals.ts`: Memory/API key modal state.
- `src/features/chat/hooks/use-chat-persistence.ts`: Load/save chat messages.
