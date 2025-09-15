# Active Context

## Current Focus
- Implement `useChatController` to consolidate chat logic and refactor `src/app/(dashboard)/page.tsx` to consume it; then run a build and fix issues.
- Stabilize UI: fix height bounce on "Start New Session" and "Begin CBT" buttons; remove unwanted shimmer when clicking chats.
- Refactor DatePicker to shadcn-style with design tokens: selected uses primary (blue), today shows subtle ring if not selected; desktop popover overflow visible, mobile overflow auto.

## Recent Changes
- `/api/auth/verify` uses general middleware to allow verification without prior session over LAN/mobile in development.
- Standardized `ApiResponse<T>` and typed client usage across API routes.
- Nested chat route lives at `src/app/api/sessions/[sessionId]/messages/route.ts`.

## Next Steps
- Complete `useChatController` implementation and export from `src/hooks/index.ts`; refactor dashboard page accordingly; run build/tests.
- Ensure memory banner appears in new chat context via global memory fetch even when `currentSession` is null; exclude none.
- Ensure typed API client is used consistently for generation endpoints.

## Important Preferences & Patterns
- No IP address logging; include `X-Request-Id` on requests/responses when applicable.
- Final reflection precedes sending to chat; chats remain in the current conversation until explicitly sent.
- Prefer API wrappers and typed client; delete old routes rather than deprecating.
- Consistent font usage across chat; hide scrollbars by default.

## Learnings & Insights
- Button and shimmer regressions surfaced after design system refactor; prioritize stable layout metrics and reduce skeleton animations during interactive transitions.
- Verification flows over LAN require unauthenticated access only for the verify step in development; avoid framework-level experimental origin tweaks.
