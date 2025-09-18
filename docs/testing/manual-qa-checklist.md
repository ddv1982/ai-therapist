# Manual QA Checklist

Run after smoke tests pass. Use a clean profile or incognito.

## Environments
- Local dev: `make setup` (ensures DB/Redis/encryption).
- Browsers: Desktop Chrome, Firefox, Safari.
- Viewports: 1440×900 and iPhone 12 emulation.

## Theming & Layout
- Toggle light/dark; verify no FOUC; fonts consistent across chat.
- Sidebar open/close persists within session; scrollbar hidden by default.

## Authentication
- Login with TOTP; verify device trust flow and logout.
- Verify TOTP from mobile over LAN does not 401 (`/api/auth/verify`).

## Chat
- New session creation; message streaming visible and stable.
- Memory banner shows when context exists; no shimmer on chat click.
- Model selection uses shared config; no hardcoded IDs.

## CBT Diary
- Complete full flow; draft persists in Redux; final reflection before send.
- Report export to PDF works.

## Error Handling
- Trigger dev error via dashboard dev tool; fallback UI appears.
- Error reporter sends beacon without blocking UI.

## Offline/Online
- Toggle offline; inputs disabled appropriately; recovery on reconnect.

## Accessibility
- Keyboard navigation through chat composer and controls.
- Focus ring visible; aria labels present for interactive elements.

## Regression Checks
- `/api/sessions/:id/messages` headers include `X-Request-Id`.
- Standardized `ApiResponse<T>` envelopes for non-chat routes.
