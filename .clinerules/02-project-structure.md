# Project Structure (Source of Truth)

- **Layouts**
  - Root layout: `src/app/layout.tsx`
  - Dashboard layout: `src/app/(dashboard)/layout.tsx`

- **API routes**
  - Base: `src/app/api`
  - Core chat route: `src/app/api/sessions/[sessionId]/messages/route.ts`

- **Redux**
  - Provider: `src/providers/redux-provider.tsx`
  - Store and slices:
    - `src/store/index.ts`
    - `src/store/slices/chatSlice.ts`
    - `src/store/slices/sessionsSlice.ts`

- **API layer utilities and wrappers**
  - `src/lib/api/api-middleware.ts`
  - `src/lib/api/api-auth.ts`
  - `src/lib/api/rate-limiter.ts`
  - `src/lib/api/api-response.ts`
  - `src/lib/api/client.ts`

- **OpenAPI and typing**
  - Generated types: `src/types/api.generated.ts`
  - API helpers: `src/types/api.ts`
  - API documentation (single source of truth): `docs/api.yaml`

- **Key conventions**
  - Use `ApiResponse<T>` and `getApiData` consistently.
  - Include `X-Request-Id` in requests/responses and reflect in `docs/api.yaml`.
  - Prefer the provided API wrappers for new/refactored routes.
  - Use the typed API client on the client side with OpenAPI types.
