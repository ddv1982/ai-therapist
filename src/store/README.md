# Store Overview

This app uses Redux Toolkit for a small amount of UI/application state and RTK Query for data fetching. Persistence is configured via redux-persist with safe fallbacks for SSR and restricted storage environments.

## Slices

- `chatSlice.ts`: Ephemeral chat UI state (input, streaming flag, settings). No message storage here.
- `sessionsSlice.ts`: Current session selection and busy flags (creating/deleting). Session data itself comes from APIs/RTK Query.
- RTK Query: `sessionsApi` handles server data for sessions/messages.

## Selectors

Prefer typed selectors from `src/store/selectors.ts` over inlining:

- `selectIsStreaming(state)`
- `selectCurrentInput(state)`
- `selectChatSettings(state)`
- `selectCurrentSessionId(state)`
- `selectIsCreatingSession(state)`
- `selectDeletingSessionId(state)`

## Persistence

Configured in `src/store/index.ts`:

- Whitelist: `cbt`, `sessions`
- Blacklist: `chat` (ephemeral)
- Storage uses a safe wrapper for SSR and restricted environments.

## Guidelines

- Keep slices minimal and UI-focused; use server actions/RTK Query for data.
- Avoid duplicating server state in Redux.
- Use `useAppSelector` and `useAppDispatch` from `src/store/hooks.ts`.
- Align with chat behavior rules: only create sessions on first send; never auto-switch sessions.
