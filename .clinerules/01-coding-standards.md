# Coding Standards

- **Language/Runtime**
  - Use TypeScript with strict types; prefer inference over `any`.
  - Next.js App Router conventions apply (Server Components by default, opt-into Client Components sparingly).

- **State Management**
  - Use **Redux** for app state. Prefer typed selectors and memoized derived state.
  - Avoid heavy cross-cutting React Contexts; centralize global state in the Redux store.

- **Composition and Components**
  - Prefer composition over inheritance.
  - Keep components pure and UI-focused; move business logic to hooks or the Redux layer.
  - Co-locate component styles with components; keep tailwind classes readable and consistent.

- **APIs and Types**
  - Use standardized `ApiResponse<T>` and `getApiData` for server and client responses.
  - Use generated OpenAPI types and the typed client for client-side calls.
  - Validation belongs at the boundary (request/response) with shared types.

- **Naming and Files**
  - Use kebab-case for files, PascalCase for React components, camelCase for functions/variables.
  - Keep module boundaries small and descriptive; avoid dumping utilities into grab-bag files.

- **Errors and Resilience**
  - Fail fast at boundaries; convert errors to typed `ApiResponse` failures.
  - Avoid swallowing errors; include `X-Request-Id` for correlation where available.

- **Performance & DX**
  - Avoid unnecessary re-renders; memoize where beneficial.
  - Prefer simple, maintainable solutions over cleverness; keep the codebase clean and robust.


