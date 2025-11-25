# Implementation: Task Group 6 - Render Optimization

## Task Assignment

### Task 6.1: Profile Chat Component Renders
- **Description**: Use React DevTools Profiler to identify unnecessary re-renders.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] Profile data collected for message list
  - [ ] Re-render causes identified
  - [ ] Baseline render times documented
  - [ ] Optimization targets identified
- **Complexity**: Small

### Task 6.2: Implement Virtual Scrolling for Messages
- **Description**: Add TanStack Virtual for message list to handle large histories.
- **Dependencies**: Task 6.1
- **Acceptance Criteria**:
  - [ ] `@tanstack/react-virtual` integrated
  - [ ] Message list virtualized
  - [ ] Performance verified with 100+ messages
  - [ ] Scroll position maintained correctly
  - [ ] Auto-scroll to bottom working
- **Complexity**: Large

### Task 6.3: Optimize Message Item Rendering
- **Description**: Memoize message components to prevent unnecessary re-renders.
- **Dependencies**: Task 6.1
- **Acceptance Criteria**:
  - [ ] `MessageItem` properly memoized
  - [ ] Comparison function optimized
  - [ ] Render time < 16ms per update
  - [ ] Tests for memo behavior
- **Complexity**: Medium

### Task 6.4: Add Render Performance Monitoring
- **Description**: Implement development-only slow render warnings.
- **Dependencies**: None
- **Acceptance Criteria**:
  - [ ] React Profiler callback in dev mode
  - [ ] Warnings for renders > 16ms
  - [ ] Component identification in warnings
  - [ ] Toggle via environment variable
- **Complexity**: Small

### Task 6.5: Memory Profiling for Long Sessions
- **Description**: Verify memory stability during extended usage.
- **Dependencies**: Task 6.2
- **Acceptance Criteria**:
  - [ ] Memory profiling script created
  - [ ] No memory leaks with 1000+ messages
  - [ ] Cleanup verified on session switch
  - [ ] Performance baseline documented
- **Complexity**: Medium

## Context Files

Read these for requirements and patterns:
- spec: `droidz/specs/022-codebase-improvement-plan/spec.md`
- requirements: `droidz/specs/022-codebase-improvement-plan/planning/requirements.md`
- tasks: `droidz/specs/022-codebase-improvement-plan/tasks.md`

Key files to study:
- `src/features/chat/messages/` - Message components
- `src/features/therapy-chat/components/` - Chat container
- `src/hooks/use-scroll-to-bottom.ts` - Scroll handling
- `package.json` - Check if @tanstack/react-virtual needed

## Instructions

1. Read spec and requirements for performance context
2. Profile current implementation to establish baseline
3. Install @tanstack/react-virtual if not present
4. Implement virtual scrolling incrementally
5. Preserve existing scroll behavior (auto-scroll to bottom)
6. Run tests: `npm run test`
7. Test manually with large message histories
8. Mark tasks complete with [x] in `droidz/specs/022-codebase-improvement-plan/tasks.md`

## Standards

- Use @tanstack/react-virtual for virtualization
- Keep existing scroll-to-bottom behavior
- Memoize with React.memo and proper comparison
- Development-only profiling (no production overhead)
- Document performance benchmarks
