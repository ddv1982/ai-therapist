# Implementation: Phase 2 - Manual Package Analysis

## Task Assignment

This phase involves analyzing all 92 packages in package.json to determine which can be safely removed.

### Task 2.1: Analyze UI Component Packages

- [ ] Check each @radix-ui/\* package usage
- [ ] Check framer-motion usage
- [ ] Check lucide-react usage
- [ ] Document findings

### Task 2.2: Analyze Data & State Management

- [ ] Check React Query usage
- [ ] Check React Query Devtools usage
- [ ] Check React Table usage
- [ ] Document findings

### Task 2.3: Analyze Forms & Validation

- [ ] Check react-hook-form usage
- [ ] Check Zod usage
- [ ] Check @hookform/resolvers usage
- [ ] Document findings

### Task 2.4: Analyze Utility Packages

- [ ] Check clsx usage
- [ ] Check cmdk usage
- [ ] Check class-variance-authority usage
- [ ] Check tailwind-merge usage
- [ ] Check uuid usage
- [ ] Document findings

### Task 2.5: Analyze Charts, Markdown & Content

- [ ] Check recharts usage
- [ ] Check markdown-it usage
- [ ] Check streamdown usage
- [ ] Document findings

### Task 2.6: Analyze Date & Time Packages

- [ ] Check date-fns usage
- [ ] Check react-day-picker usage
- [ ] Document findings

### Task 2.7: Verify Critical Infrastructure (DO NOT REMOVE)

- [ ] Verify authentication packages
- [ ] Verify AI packages
- [ ] Verify backend (convex)
- [ ] Verify core framework
- [ ] Verify styling
- [ ] Verify testing
- [ ] Verify TypeScript & linting
- [ ] Mark ALL as KEEP

### Task 2.8: Analyze Security Packages (HIGH CAUTION)

- [ ] Check speakeasy (TOTP) usage
- [ ] Check qrcode usage
- [ ] Check jose (JWT) usage
- [ ] Document with CAUTION flags

### Task 2.9: Check Configuration Files

- [ ] Review next.config.js
- [ ] Review tailwind.config.js
- [ ] Review postcss.config.js
- [ ] Review jest.config.js
- [ ] Review playwright.config.ts
- [ ] Review eslint.config.js
- [ ] Document config-loaded packages

### Task 2.10: Analyze Type Definitions

- [ ] List all @types/\* packages
- [ ] Verify runtime package exists for each
- [ ] Document which can be removed

### Task 2.11: Check Scripts for Tool Usage

- [ ] Review all package.json scripts
- [ ] Identify CLI tools used
- [ ] Document findings

---

## Context Files

Read these for requirements and patterns:

- spec: droidz/specs/020-package-json-cleanup/spec.md
- requirements: droidz/specs/020-package-json-cleanup/planning/requirements.md
- tasks: droidz/specs/020-package-json-cleanup/tasks.md
- Analysis outputs from Phase 1: depcheck-report.json, imports.txt, dependency-tree.json

## Instructions

1. Read spec and analysis outputs from Phase 1
2. For EACH package category, use grep/ripgrep to find usage in codebase
3. Document findings in a structured report
4. Be CONSERVATIVE - when in doubt, mark as KEEP
5. Flag security-critical packages with HIGH CAUTION
6. Review all configuration files for implicit dependencies
7. Create dependency-cleanup-report.md with detailed analysis
8. Mark tasks complete with [x] in droidz/specs/020-package-json-cleanup/tasks.md

## Standards

Follow all standards in:

- /Users/vriesd/projects/ai-therapist/AGENTS.md

## Important Notes

- DO NOT remove any packages in this phase - only analyze
- Be thorough - check src/, convex/, scripts/, **tests**/, e2e/
- Document WHY each package should be kept or removed
- Security packages require extra scrutiny
- Configuration-loaded packages are easy to miss
