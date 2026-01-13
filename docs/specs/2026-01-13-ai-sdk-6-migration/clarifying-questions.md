# Clarifying Questions: AI SDK 6 Migration

**Spec**: AI SDK 6 Migration
**Date**: 2026-01-13
**Status**: Awaiting Answers

---

## Feature Adoption Questions

### 1. Agent Abstraction (`ToolLoopAgent`)
AI SDK 6 introduces a new `ToolLoopAgent` class for building agent workflows with built-in loop control.

**Question**: Do you want to adopt the new agent abstraction for any current or planned features?
- [ ] Yes, refactor existing tool usage to use `ToolLoopAgent`
- [ ] Yes, but only for new features going forward
- [ ] No, keep current direct `streamText`/`generateText` patterns
- [ ] Evaluate later after initial migration

**Current state**: The app uses direct `streamText` calls with browser search tools. No explicit agent patterns currently.

---

### 2. Tool Execution Approval (`needsApproval`)
The new `needsApproval` flag enables human-in-the-loop patterns for tool execution.

**Question**: Are there any tools that should require user approval before execution?
- [ ] Yes, implement approval for sensitive actions (specify which)
- [ ] No, automatic tool execution is preferred for therapy chat flow
- [ ] Defer for future consideration

**Consideration**: This could be useful for actions like generating reports or external data access.

---

### 3. DevTools Integration
AI SDK 6 includes built-in DevTools for debugging AI interactions.

**Question**: Should we enable DevTools in development?
- [ ] Yes, enable in development environment only
- [ ] Yes, enable with configurable flag for production debugging
- [ ] No, current logging/observability is sufficient

---

### 4. MCP (Model Context Protocol) Support
Full MCP support with OAuth, resources, and prompts is now available.

**Question**: Are there plans to integrate with MCP servers or tools?
- [ ] Yes, specify use case: _______________
- [ ] Not currently, but want the infrastructure ready
- [ ] No, not relevant for this application

---

### 5. Strict Mode Per Tool
AI SDK 6 moves from global `strictJsonSchema` to per-tool `strict` settings.

**Question**: Should all tools use strict mode, or should it be selective?
- [ ] Enable strict mode on all tools (recommended for type safety)
- [ ] Selective strict mode (specify which tools)
- [ ] Disable strict mode (for schema flexibility)

---

## Migration Approach Questions

### 6. Migration Strategy
**Question**: What migration approach do you prefer?

- [ ] **Big Bang**: Single PR migrating all files at once
  - Pros: Consistent state, one-time breaking change
  - Cons: Large PR, harder to review, higher risk

- [ ] **Incremental**: Multiple PRs, feature by feature
  - Pros: Easier review, gradual risk, can pause if issues arise
  - Cons: Temporary mixed versions, longer overall timeline

- [ ] **Parallel Development**: Branch with full migration, run both versions in testing
  - Pros: Full testing before merge, easy rollback
  - Cons: More complex setup, potential merge conflicts

**Recommendation**: Given the breaking changes in `@ai-sdk/rsc` which is central to session management, an incremental approach with `@ai-sdk/rsc` migration as a separate focused PR may be safest.

---

### 7. Use of Codemods
AI SDK provides official codemods for automated migration.

**Question**: Should we use the official codemods?
- [ ] Yes, run `npx @ai-sdk/codemod v6` and review results
- [ ] Yes, but run individual codemods selectively
- [ ] No, manual migration preferred for better control

**Available codemods**:
- `rename-text-embedding-to-embedding`
- `rename-mock-v2-to-v3`
- `rename-tool-call-options-to-tool-execution-options`
- `rename-core-message-to-model-message`
- `rename-converttocoremessages-to-converttomodelmessages`
- `wrap-tomodeloutput-parameter`
- `add-await-converttomodelmessages` (important - `convertToModelMessages` is now async)

---

### 8. `generateObject` Migration Priority
`generateObject` is deprecated in SDK 6 in favor of `generateText` with `Output.object()`.

**Question**: Should we migrate `generateObject` usage immediately or defer?
- [ ] Migrate immediately (eliminates deprecation warnings)
- [ ] Defer until required (SDK 6 still supports it, just deprecated)
- [ ] Evaluate case by case based on complexity

**Current usage**: `extractStructuredAnalysis` in `groq-client.ts` uses `generateObject` for CBT analysis extraction.

---

## Testing Strategy Questions

### 9. Test Coverage Requirements
**Question**: What level of test coverage is required before merging?

- [ ] All existing tests pass with updated mocks (V2 → V3)
- [ ] Add new tests for migration-specific changes
- [ ] Full E2E coverage of chat and therapy flows
- [ ] Manual QA sign-off required

---

### 10. Rollback Plan
**Question**: What is the acceptable rollback strategy?

- [ ] Git revert to previous commit
- [ ] Feature flag to switch between SDK versions (complex)
- [ ] Deployment freeze during migration window
- [ ] Other: _______________

---

## Related Package Questions

### 11. Other Package Updates
The initial scope mentioned other packages that could be updated:

**Question**: Should we update these packages in the same PR or separately?

| Package | Current | Latest | Include? |
|---------|---------|--------|----------|
| `streamdown` | 1.6.10 | ? | [ ] Yes [ ] No [ ] Separate PR |
| `uuid` | 12.0.0 | ? | [ ] Yes [ ] No [ ] Separate PR |
| Other deps | - | - | [ ] Yes [ ] No [ ] Separate PR |

---

### 12. Provider-Specific Changes
**Question**: Are there any provider-specific options we need to preserve or change?

Current providers in use:
- **Groq** (`@ai-sdk/groq`) - Primary chat provider
- **OpenAI** (`@ai-sdk/openai`) - BYOK support

Considerations:
- OpenAI's `strictJsonSchema` now defaults to `true`
- Need to verify Groq provider compatibility with SDK 6

---

## Timeline Questions

### 13. Timeline and Priority
**Question**: What is the expected timeline for this migration?

- [ ] Urgent - Complete within 1-2 days
- [ ] Standard - Complete within 1-2 weeks
- [ ] Low priority - Complete when convenient
- [ ] Blocked by: _______________

---

### 14. Acceptance Criteria
**Question**: What defines "done" for this migration?

- [ ] All packages updated to SDK 6 versions
- [ ] All deprecation warnings resolved
- [ ] All tests passing
- [ ] No runtime errors in chat/therapy flows
- [ ] DevTools integration working (if selected)
- [ ] Documentation updated
- [ ] Other: _______________

---

## Next Steps

Once these questions are answered:
1. Create detailed technical specification
2. Break down into implementation tasks
3. Estimate effort and create timeline
4. Begin implementation according to chosen strategy
