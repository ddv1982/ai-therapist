# API and OpenAPI Standards

- **Wrappers**
  - Default to `withApiMiddleware` for new endpoints.
  - Use `withAuthAndRateLimit` only when auth/rate limiting is required.

- **Response Model**
  - All handlers must return `ApiResponse<T>`.
  - Use `getApiData` on the client to unwrap data and surface errors consistently.

- **Request Correlation**
  - Every request/response should propagate `X-Request-Id`.
  - Ensure logs and errors include `X-Request-Id` for traceability.

- **Client Calls**
  - Use `src/lib/api/client.ts` with types from `src/types/api.generated.ts`.
  - Do not use untyped `fetch` from client components; prefer the typed client.

- **OpenAPI**
  - Keep `docs/api.yaml` in sync with route changes, including headers like `X-Request-Id`.
  - Regenerate types when the spec changes; keep `src/types/api.generated.ts` current.

- **Auth Note**
  - `/api/auth/verify` uses `withApiMiddleware` so TOTP verification can occur without an existing session from mobile/LAN access.
