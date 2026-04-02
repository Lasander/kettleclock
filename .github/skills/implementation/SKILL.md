---
name: implementation
description: "Implement code changes in KettleClock — new features, bug fixes, refactors. Use when: adding UI components, modifying state logic, changing data model, adding localStorage features, or making any source code edits. Covers architecture, coding patterns, and incremental consistency."
---

# Implementation

Make consistent, incremental code changes that follow KettleClock's established architecture and patterns.

## When to Use

- Adding a new feature (component, screen, data flow)
- Fixing a bug in existing code
- Refactoring code while preserving behaviour
- Modifying the data model or persistence layer
- When the orchestrator agent delegates code work

## Architecture Reference

### Screen State Machine

All screens are in `App.tsx` via a `Screen` union type (`'setup' | 'exerciseLibrary' | 'workout' | 'summary'`). Adding a new screen:
1. Add the literal to the `Screen` type in `src/types.ts`
2. Add a handler + `setScreen(...)` call in `App.tsx`
3. Add the conditional render block in `App.tsx`'s return

### Data Flow

```
App.tsx (state owner)
  ├── WorkoutBuilder (setup screen — complex, manages workout grid)
  ├── ExerciseLibrary (exercise editor)
  ├── Timer (workout runner — receives Workout, emits done/abort)
  └── Summary (results — receives Workout + elapsed)
```

- State flows **down** via props; events flow **up** via callbacks
- No context providers, no external state library
- Each component manages its own UI state (modals, menus, edit modes)

### Module Responsibilities

| Module | Owns |
|--------|------|
| `types.ts` | All shared types, colour maps, constants |
| `exercises.ts` | Exercise library singleton, localStorage CRUD, seed logic |
| `storage.ts` | Workout localStorage CRUD |
| `segments.ts` | `Workout` grid → flat `Segment[]` for timer |
| `audio.ts` | Web Audio beep generation |
| `wakeLock.ts` | Screen Wake Lock lifecycle |
| `utils.ts` | `generateId()` and shared helpers |

### Component Patterns

Each component follows:
```
ComponentName.tsx       — Logic + JSX
ComponentName.module.css — Scoped styles
```

## Procedure

### 1. Read Before Writing

- Read the files you plan to modify — understand current structure
- Read `src/types.ts` to see the current data model
- Read related components to understand prop interfaces

### 2. Types First

When changing data structures:
1. Update `src/types.ts` with new/modified interfaces
2. Update `src/exercises.ts` if exercise model changes (includes migration logic)
3. Update `src/storage.ts` if workout model changes
4. Then update components that consume the types

### 3. Component Implementation

**New component:**
1. Create `src/components/ComponentName.tsx`
2. Create `src/components/ComponentName.module.css`
3. Wire into parent (usually `App.tsx` or `WorkoutBuilder.tsx`)

**Modifying existing component:**
1. Read the full component first
2. Make targeted edits — don't rewrite unless necessary
3. Match existing patterns (hooks usage, callback naming, CSS class naming)

### 4. Coding Rules

**TypeScript:**
- Use `import type` for type-only imports
- Prefer `useCallback` for functions passed as props or used in deps arrays
- Prefer `useMemo` for derived data recalculated on render
- Use `useRef` for mutable values that shouldn't trigger re-renders
- No `any` types except in migration/legacy compat code

**React:**
- Functional components only — no class components
- Destructure props in function signature
- Keep component files focused — extract sub-components when a file exceeds ~400 lines
- Event handlers: `handleXxx` for internal, `onXxx` for callback props

**CSS Modules:**
- Use camelCase class names: `.gridHeader`, `.menuItem`
- Reference CSS variables from `global.css`: `var(--color-surface)`, `var(--color-primary)`
- Mobile-first: base styles for small screens, no media queries unless needed
- Touch targets ≥ 48px (`min-height: 48px` or equivalent)
- Use `env(safe-area-inset-*)` for elements near screen edges

**IDs and Keys:**
- Use `generateId()` from utils.ts — never `crypto.randomUUID()`
- React keys: use stable IDs from data, not array indices

**localStorage:**
- All keys prefixed with `kettleclock_`
- Always wrap `localStorage.getItem` / `JSON.parse` in try/catch
- Include migration logic when changing persisted data shapes

### 5. Incremental Additions

When adding a feature that touches multiple files:
1. Types first (`types.ts`)
2. Data layer (`exercises.ts`, `storage.ts`)
3. Logic layer (`segments.ts` if relevant)
4. UI layer (components)
5. Integration (`App.tsx` routing, parent component wiring)

### 6. Verify

After making changes:
```bash
npx tsc --noEmit        # Must pass with zero errors
npx vite build          # Must produce clean build
```

Fix any TypeScript errors before considering the task complete. Common issues:
- Unused imports (strict mode requires removing them)
- Missing props after interface changes
- Type narrowing needed for optional fields
