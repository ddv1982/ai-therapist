# Implementation: Task Group 3 - Hook Complexity Reduction

## Task Assignment

### Task 3.1: Analyze Hook Dependencies
- **Description**: Map the dependency graph of `useChatController` and its 15+ child hooks.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Dependency diagram created
  - [ ] Data flow between hooks documented
  - [ ] Performance bottlenecks identified
  - [ ] Refactoring strategy documented
- **Complexity**: Medium

### Task 3.2: Extract Message Persistence Service
- **Description**: Create a service class for message persistence logic extracted from `use-chat-messages.ts`.
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - [ ] `MessagePersistenceService` class created
  - [ ] `saveMessage`, `loadMessages`, `deleteMessages` methods
  - [ ] Service injectable/testable
  - [ ] Original hook updated to use service
  - [ ] All message tests pass
- **Complexity**: Large

### Task 3.3: Extract Metadata Manager Service
- **Description**: Create dedicated service for message metadata management.
- **Dependencies**: Task 3.2
- **Acceptance Criteria**:
  - [ ] `MetadataManager` class created
  - [ ] `updateMessageMetadata`, `getMetadata` methods
  - [ ] Proper typing with `MessageMetadata` type
  - [ ] Unit tests for metadata operations
- **Complexity**: Medium

### Task 3.4: Simplify useChatMessages Hook
- **Description**: Refactor `use-chat-messages.ts` to use extracted services, reducing from 598 to <200 lines.
- **Dependencies**: Tasks 3.2, 3.3
- **Acceptance Criteria**:
  - [ ] Hook file under 200 lines
  - [ ] Single responsibility: orchestrating message state
  - [ ] Services handle business logic
  - [ ] All existing tests pass
  - [ ] Performance maintained or improved
- **Complexity**: Large

### Task 3.5: Create useChatCore Hook
- **Description**: Extract core message state management into focused hook.
- **Dependencies**: Task 3.4
- **Acceptance Criteria**:
  - [ ] `useChatCore` handles message state
  - [ ] Clean interface for messages and actions
  - [ ] Dependency array minimized
  - [ ] Proper memoization
- **Complexity**: Medium

### Task 3.6: Create useChatUI Hook
- **Description**: Extract UI-specific concerns (viewport, scroll, input state) from controller.
- **Dependencies**: Task 3.1
- **Acceptance Criteria**:
  - [ ] `useChatUI` created with UI state
  - [ ] Handles scroll, viewport, input focus
  - [ ] Independent of message data
  - [ ] Tests for UI state management
- **Complexity**: Medium

### Task 3.7: Simplify useChatController Hook
- **Description**: Refactor main controller to compose simplified hooks, reducing from 366 lines.
- **Dependencies**: Tasks 3.5, 3.6
- **Acceptance Criteria**:
  - [ ] Controller under 150 lines
  - [ ] Clear composition of `useChatCore`, `useChatUI`, `useChatSessionManager`
  - [ ] Public API unchanged
  - [ ] All integration tests pass
- **Complexity**: Large

### Task 3.8: Add Hook Performance Benchmarks
- **Description**: Create performance benchmarks for hook operations.
- **Dependencies**: Task 3.7
- **Acceptance Criteria**:
  - [ ] Render time benchmarks established
  - [ ] Memory usage tracked
  - [ ] Regression detection possible
  - [ ] Documentation of acceptable thresholds
- **Complexity**: Medium

## Context Files

Read these for requirements and patterns:
- spec: `droidz/specs/022-codebase-improvement-plan/spec.md`
- requirements: `droidz/specs/022-codebase-improvement-plan/planning/requirements.md`
- tasks: `droidz/specs/022-codebase-improvement-plan/tasks.md`

Key files to study:
- `src/hooks/use-chat-controller.ts` (366 lines)
- `src/hooks/use-chat-messages.ts` (598 lines)
- `src/hooks/chat/` - Related hooks
- `src/lib/services/` - Existing service patterns

## Instructions

1. Read spec and requirements for architecture context
2. Start with Task 3.1 - thoroughly analyze current hook structure
3. Create services in `src/lib/services/chat/`
4. Refactor incrementally, running tests after each change
5. Ensure public API of `useChatController` remains unchanged
6. Run tests: `npm run test`
7. Run type check: `npx tsc --noEmit`
8. Mark tasks complete with [x] in `droidz/specs/022-codebase-improvement-plan/tasks.md`

## Standards

- Follow existing service patterns in `src/lib/services/`
- Services should be testable (injectable dependencies)
- Keep hooks focused on single responsibility
- Preserve all existing functionality
- No breaking changes to public API
- Add unit tests for new services
