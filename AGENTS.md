# AGENTS.md - Project Standards & Rules

## Project Overview
Therapist AI App is a Next.js application designed to provide AI-driven therapy sessions. It uses React 19, Next.js 16 (App Router), Tailwind CSS v4, and Convex for the backend.

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide React, Framer Motion.
- **Backend**: Convex (Serverless Backend).
- **Auth**: Clerk (Next.js integration).
- **State Management**: React Context, TanStack Query (React Query).
- **Forms**: React Hook Form, Zod.
- **Testing**: Jest, React Testing Library, Playwright.

## Core Commands
- `bun install`: Install dependencies.
- `bun run dev`: Start development server.
- `bun run build`: Build for production.
- `bun run lint`: Run ESLint.
- `bun run test`: Run Jest tests.
- `bun run test:e2e`: Run Playwright tests.
- `npx convex dev`: Start Convex development server.

## Project Layout & Feature-First Architecture
- `src/app`: Next.js App Router routes.
- `src/features`: Feature-based logic. Each feature folder should contain its own components, hooks, services, types, and utils.
- `src/components/ui`: Shared UI components (standardized with CVA).
- `src/lib`: Strictly shared, non-feature-specific utilities.
- `convex`: Backend schema and functions.

## Development Patterns & Constraints
### React & Next.js
- Use **Server Components** by default. Use `'use client'` only when necessary.
- **Async APIs**: Always await `params` and `searchParams` in routes (Next.js 15+ requirement).
- **Metadata**: Define metadata in `layout.tsx` or `page.tsx` using the Metadata API.
- **Loading States**: Standardize with `loading.tsx` using `ModalSkeleton` where applicable.

### Tailwind CSS v4
- Use **CSS-first configuration**. Define design tokens in `src/app/globals.css` using the `@theme` directive.
- Avoid using `tailwind.config.js` unless absolutely necessary for compatibility.
- Use `class-variance-authority` (CVA) for component variants.

### Convex Backend
- **Strict Awaiting**: All Convex calls must be awaited.
- **Performance**: Use `.withIndex()` instead of `.filter()` for database queries whenever possible.
- **Pagination**: Use `usePaginatedQuery` for lists that can grow large.

## Evidence Required for Every PR
- Linting must pass (`bun run lint`).
- Tests must pass (`bun run test`).
- Type checking must pass (`tsc --noEmit`).
- No floating promises in Convex calls.
- New features must follow the feature-first directory structure.
