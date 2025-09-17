# AI Therapist Refactor Plan

## Objectives
- Remove systemic DRY violations in the CBT diary/chat stack so behaviour lives in one configurable engine instead of being reimplemented per hook, reducer, and UI component.
- Simplify the architecture around CBT state, messaging, and chat export so we can extend the flow without regression risk.
- Improve code quality by leaning on configuration-driven patterns, shared utilities, and clearer separation between presentation and orchestration.
- Raise confidence with targeted automation (unit + integration coverage) around the refactored surface area.

## Current Pain Points
1. **Duplicated flow orchestration** – `useCBTChatExperience`, `useCbtDiaryFlow`, Redux `cbtSlice`, and `useCBTChatBridge` each hard-code step transitions, AI copy, and persistence side effects. Keeping them aligned is error-prone.
2. **String/constants drift** – AI follow-up copy, step titles, and step metadata are scattered across files (hard-coded literals & `next-intl` defaults). Translations and behaviour can diverge silently.
3. **Reducer boilerplate** – `cbtSlice` exposes ~20 actions that differ only by payload type, leading to repetitive JSON string comparisons and complex selectors.
4. **Chat summary formatting** – `cbt-data-manager` serialises many flavours of CBT data into identical HTML comment wrappers with copypasted logic.
5. **UI wrappers & components** – `CBTStepWrapper` exports nine near-identical wrappers, and components like `EmotionScale` embed sizeable constant tables and effectful state wiring inline.
6. **Testing gaps** – Feature tests stub the flow superficially; we lack assurance around the full cross-layer behaviour once pieces are consolidated.

## Guiding Principles
- Model CBT steps as declarative configuration (step id → copy, validation, summary builders, completion side-effects).
- Share that configuration between the store, hooks, and UI through a single engine module.
- Keep UI components focused on rendering and invoking callbacks; remove persistence/state duplication.

## Refactor Initiatives

### 1. Build a Shared CBT Flow Engine
- Create `src/features/therapy/cbt/flow/engine.ts` exposing a pure state machine (`transition(state, event)` + selectors) driven by a `CBT_STEP_CONFIG` map.
- Move step order, AI responses, summary metadata, and follow-up step ids into this config.
- Reimplement `useCBTChatExperience` and `useCbtDiaryFlow` on top of the engine so they consume the same transition result & message descriptors.
- Expose typed events (e.g. `COMPLETE_STEP` with payload) so Redux and the chat bridge dispatch identical domain actions.

### 2. Collapse CBT Redux Slice Boilerplate
- Replace per-field reducers (`updateEmotions`, `updateThoughts`, …) with a generic `applyEvent` reducer that forwards to the flow engine.
- Store session data as an engine state snapshot (`{ context, history, status }`) to avoid ad-hoc JSON comparisons and manual timestamps.
- Provide memoised selectors for current step, completed steps, summary DTOs, and autosave metadata.
- Update `useCBTDataManager` to use the new `applyEvent` API and remove redundant derived state (e.g. `navigation` logic can come from the engine selectors).

### 3. Centralise AI Copy & Summary Formatting
- Derive AI follow-up messages and step titles from `next-intl` using step config keys, falling back to defaults in one place.
- Refactor `cbt-data-manager` into composable formatters that operate on typed engine context; eliminate repeated `JSON.stringify` glue.
- Replace the many `sendXYZData` bridge methods with a single `sendStepToChat(stepId)` that looks up the formatter from the config, plus a `sendSessionSummary` helper.
- Update tests to mock the config rather than each function individually.

### 4. Slim UI Components & Wrappers
- Convert `CBTStepWrapper` into a single component that takes a `stepId` and uses config-driven metadata for icon/title/subtitle/help text.
- Extract emotion definitions (emoji, labels, ranges) into a shared constant; inject via props to `EmotionScale` to reduce inline noise.
- Introduce small, pure presentational components for repeated UI patterns (badge lists, progress bars) to shorten feature files.

### 5. Strengthen Automated Coverage
- Add unit tests for the flow engine (transition table, summary builders, AI copy lookups).
- Add integration tests that run the full diary flow using the public hooks to ensure message ordering and step insertion stay deterministic.
- Extend API route tests to cover streaming persistence edge cases via fixtures shared with the engine (ensures future concurrency changes respect limits).

### 6. Migration & Cleanup
- Provide codemods or scripted updates for components/hooks consuming retired action creators.
- Update documentation/readmes to reflect the new architecture and extension workflow.
- Remove deprecated exports (`useCBTChatFlow` alias, redundant formatters) once migration is complete.

## Execution Roadmap
1. **Spike (1-2 days)** – Prototype the engine + config, validate parity with current flow in storybook or isolated tests.
2. **Phase 1: Engine Integration** – Land engine, migrate `useCBTChatExperience`, adapt Redux slice to wrap engine state, keep old bridge temporarily.
3. **Phase 2: Hook/UI Cleanup** – Port `useCbtDiaryFlow`, `CBTStepWrapper`, and emotion components to the new APIs; address translation wiring.
4. **Phase 3: Chat Bridge & Formatter Unification** – Replace `useCBTChatBridge` & `cbt-data-manager` duplications with config-driven helpers; update chat API usage/tests.
5. **Phase 4: Deletions & Polish** – Remove legacy reducers/helpers, run i18n sweep, tighten types, and ensure lint/test pipelines are green.

## Success Criteria
- Single source of truth for CBT steps (order, copy, validation, follow-ups).
- Hooks, Redux, and chat bridge rely on shared engine APIs rather than bespoke logic.
- CBT-related files shrink significantly with clearer separation of concerns.
- Automated suite covers step transitions, AI message generation, and chat export flows.
