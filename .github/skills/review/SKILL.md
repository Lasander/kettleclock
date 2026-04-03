---
name: review
description: "Review code changes in KettleClock for correctness, quality, and architectural fit. Use when: implementation is complete and needs verification before committing, after bug fixes to check for regressions, or when the orchestrator needs a quality gate between implementation and commit."
---

# Code Review

Verify that code changes are correct, maintain quality standards, and fit the project's architecture and design.

## When to Use

- After the implementer finishes code changes (before committing)
- After the tester adds tests (verify test quality)
- As a quality gate in the orchestrator workflow
- When the user asks for a review of existing code

## Procedure

### 1. Gather the Diff

Identify what changed:
```bash
git diff --stat
git diff
```

If changes are already committed (reviewing after the fact):
```bash
git log --oneline -5
git diff HEAD~1
```

### 2. Correctness Check

For each modified file, verify:

**Logic:**
- Does the code do what the requirement asks?
- Are edge cases handled? (empty arrays, null/undefined, zero values, boundary conditions)
- Are there off-by-one errors in loops or array indexing?
- Do conditional branches cover all cases?
- Is state updated correctly? (immutable patterns where React expects them)

**Types:**
- Are types accurate and specific? (no unnecessary `any`)
- Are optional fields handled with proper narrowing?
- Do new interfaces fit the existing type taxonomy in `types.ts`?

**Data flow:**
- Does data flow down via props and events flow up via callbacks?
- Are new props added to parent component call sites?
- Are localStorage reads/writes properly wrapped in try/catch?

### 3. Quality Check

**React patterns:**
- `useCallback` for functions passed as props or in dependency arrays?
- `useMemo` for expensive derived computations?
- No stale closures in effect cleanup or timers?
- Keys use stable IDs, not array indices?
- No unnecessary re-renders from inline object/function creation in JSX?

**TypeScript:**
- `import type` used for type-only imports?
- No unused imports or variables (strict mode will catch these, but flag them)?
- Naming follows conventions: `handleXxx` internal, `onXxx` props?

**CSS Modules:**
- Classes use camelCase?
- CSS variables from `global.css` used instead of raw hex values?
- Touch targets ≥ 48px?
- `env(safe-area-inset-*)` used for edge-positioned elements?

**Accessibility:**
- Interactive elements have accessible names (aria-label if no visible text)?
- Keyboard navigable where applicable?

### 4. Architecture Fit

Compare changes against the established patterns:

**State management:**
- State lives in the right place? (App.tsx for screen routing, component for local UI state)
- No external state libraries introduced?
- No context providers added (project uses prop drilling by design)?

**Module boundaries:**
- Types in `types.ts`, not scattered across components?
- localStorage access through `storage.ts` or `exercises.ts`, not directly in components?
- Segment generation in `segments.ts`, not in Timer?

**File structure:**
- One component per file with co-located `.module.css`?
- New components in `src/components/`?
- New utilities in `src/` root?

**Consistency:**
- Does the new code match existing patterns in similar modules?
- Are naming conventions followed? (file names, export names, CSS classes)
- Is the code complexity proportional to the problem? (no over-engineering)

### 5. Design Alignment

Cross-check against project documentation:
- Read the relevant sections of `specs.md` — does the implementation match the spec?
- Read the relevant sections of `design.md` — does it follow the documented architecture?
- If the change diverges from docs, flag it (the docs may need updating, or the code may be wrong)

### 6. Produce the Review

Structure the output as:

```markdown
## Review Summary
✅ Approved / ⚠️ Approved with notes / ❌ Changes requested

## Correctness
- [list findings, or "No issues found"]

## Quality
- [list findings, or "No issues found"]

## Architecture
- [list findings, or "Consistent with existing patterns"]

## Suggestions (optional)
- Non-blocking improvements that could be made later

## Blocking Issues (if any)
- Issues that must be fixed before committing
```

### 7. Rules

- **Be specific** — cite file names, line ranges, and exact code when flagging issues
- **Distinguish blocking from non-blocking** — not everything needs fixing now
- **Don't nitpick style** — if it compiles and matches existing patterns, it's fine
- **Don't request refactors** — review the change as-is, don't expand scope
- **Check the tests** — if tests were added, verify they test meaningful behaviour (not implementation details)
- **Verify the build** — if not already verified, run `npx tsc --noEmit` and `npx vitest run`
