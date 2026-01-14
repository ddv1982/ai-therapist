# Raw Idea: AI SDK 6 Migration

**Date**: 2026-01-13
**Status**: Draft
**Author**: AI Therapist Team

## Summary

Migrate the AI Therapist application from AI SDK 5 to AI SDK 6, which is a major version upgrade with significant new features, breaking changes, and architectural improvements.

## Current Package Versions

| Package | Current | Target |
|---------|---------|--------|
| `ai` | 5.0.115 | 6.0.33 |
| `@ai-sdk/groq` | 2.0.33 | 3.0.6 |
| `@ai-sdk/openai` | 2.0.88 | 3.0.9 |
| `@ai-sdk/react` | 2.0.117 | 3.0.35 |
| `@ai-sdk/rsc` | 1.0.117 | 2.0.33 |

## AI SDK 6 New Features

1. **Agent abstraction** - `ToolLoopAgent` class for building agent workflows
2. **Tool Execution Approval** - `needsApproval` flag for human-in-the-loop
3. **Full MCP Support** - OAuth, resources, prompts for Model Context Protocol
4. **DevTools** - Built-in debugging capabilities
5. **Reranking support** - For search result reranking
6. **Image Editing capabilities** - New image generation/editing features
7. **Strict Mode per Tool** - Fine-grained control over tool schema validation
8. **Input Examples for tools** - Better tool documentation
9. **toModelOutput** - Custom tool outputs transformation

## Breaking Changes to Address

Based on the official migration guide:

### Core Changes
1. `CoreMessage` → `ModelMessage` type rename
2. `convertToCoreMessages` → `convertToModelMessages` (now async)
3. `generateObject` / `streamObject` deprecated → use `generateText` / `streamText` with `output` setting
4. `ToolCallOptions` → `ToolExecutionOptions` rename
5. `toModelOutput` receives `{ output }` object instead of direct value
6. Mock classes renamed from V2 to V3 in `ai/test`

### Provider-Specific Changes
- OpenAI: `strictJsonSchema` now defaults to `true`
- Per-tool `strict` mode replaces global `strictJsonSchema`

## Current Usage in Codebase

### Files Using AI SDK

| File | Usage |
|------|-------|
| `src/features/chat/lib/streaming.ts` | `streamText`, `LanguageModel`, `ModelMessage`, `ToolChoice`, `ToolSet` |
| `src/features/chat/lib/title-generator.ts` | `generateText` |
| `src/lib/api/groq-client.ts` | `generateText`, `generateObject`, `convertToModelMessages`, `streamText`, `UIMessage`, `LanguageModel` |
| `src/hooks/use-chat-transport.ts` | `DefaultChatTransport`, `UIMessage` |
| `src/hooks/chat/use-chat-streaming.ts` | `UIMessage`, `useChat` from `@ai-sdk/react` |
| `src/ai/providers.ts` | `groq` from `@ai-sdk/groq`, `LanguageModel` |
| `src/features/therapy/lib/report-generation-service.ts` | `LanguageModel` |
| `src/app/ai/session-ai.tsx` | `createAI`, `createStreamableValue`, `getMutableAIState` from `@ai-sdk/rsc` |
| `src/app/api/reports/generate/route.ts` | `createOpenAI` from `@ai-sdk/openai` |
| `src/app/api/chat/route.ts` | `convertToModelMessages`, `UIMessage`, `groq`, `createOpenAI` |
| `src/contexts/session-context.tsx` | `readStreamableValue`, `useActions`, `useSyncUIState`, `useUIState` from `@ai-sdk/rsc` |
| `src/lib/observability/telemetry.ts` | `TelemetrySettings` |
| `src/features/chat/__tests__/streaming.test.ts` | `LanguageModel`, `ToolSet`, `tool` from `@ai-sdk/provider-utils` |

## Motivation

1. **Stay current** - AI SDK 6 is the latest major version with active development
2. **New features** - Agent abstraction and DevTools could improve development experience
3. **Performance** - Potential improvements in the streaming and tool execution
4. **Future-proofing** - Avoid accumulating technical debt on deprecated APIs
5. **Type safety** - Better TypeScript support and async patterns

## Risks

1. **Breaking changes** - Multiple API changes require careful migration
2. **`@ai-sdk/rsc` changes** - The RSC integration is central to session management
3. **Test suite updates** - Mock classes renamed, tests need updating
4. **`generateObject` deprecation** - Used in report generation, needs migration to `generateText` with `Output.object()`

## Open Questions

See `clarifying-questions.md` for detailed questions to address before implementation.
