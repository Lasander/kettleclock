---
name: testing
description: "Add or update unit tests for KettleClock using Vitest. Use when: writing tests for utilities, data logic, segment generation, exercise library, storage helpers, or React component behaviour. Covers test setup, patterns, and what to test."
---

# Unit Testing

Write and maintain unit tests using Vitest for KettleClock's logic and components.

## When to Use

- After implementing a new module or utility function
- After fixing a bug (add regression test)
- When the orchestrator agent delegates test creation
- When user explicitly requests test coverage

## Setup

### First-Time Installation

If Vitest is not yet installed:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Add to `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

Create `src/test-setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

Update `tsconfig.json` to include test types if needed:
```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  }
}
```

### Running Tests

```bash
npx vitest          # Watch mode
npx vitest run      # Single run (CI)
npx vitest run --reporter=verbose   # Detailed output
```

## Test File Conventions

| Source File | Test File |
|-------------|-----------|
| `src/utils.ts` | `src/__tests__/utils.test.ts` |
| `src/segments.ts` | `src/__tests__/segments.test.ts` |
| `src/exercises.ts` | `src/__tests__/exercises.test.ts` |
| `src/storage.ts` | `src/__tests__/storage.test.ts` |
| `src/components/Timer.tsx` | `src/components/__tests__/Timer.test.tsx` |

Use `__tests__/` directories co-located with the code they test.

## What to Test

### Priority 1: Pure Logic (no React, no DOM)

These are the highest-value, easiest-to-write tests:

**`src/segments.ts`** — Workout grid → Segment list:
- Correct number of segments for a given grid
- Exercise segments have correct duration (default vs override)
- Rest segments placed correctly between exercises
- Set rest segments placed between sets (not after last set)
- Initial countdown segment present
- Empty slots handled gracefully

**`src/utils.ts`** — ID generation:
- `generateId()` returns unique values
- Returns string type

**`src/exercises.ts`** — Exercise library logic:
- `seedDefaults()` populates library on first call
- `getExerciseDef()` returns correct exercise or undefined
- `getEnabledExercises()` filters disabled exercises
- `getExercisesByMuscle()` filters by muscle group
- `saveExercise()` persists to localStorage
- `isNameTaken()` detects conflicts
- `suggestAbbr()` generates reasonable abbreviations
- Migration logic preserves existing data

**`src/storage.ts`** — Workout persistence:
- `saveWorkout()` creates new entry
- `saveWorkout()` updates existing entry by ID
- `loadWorkouts()` returns empty array on empty/corrupt storage
- `deleteWorkout()` removes by ID

### Priority 2: Component Logic (React + DOM)

Test user-visible behaviour, not implementation details:

**Components to test:**
- `NumberControl` — increment/decrement, min/max bounds, display
- `ExerciseCell` — renders correct abbreviation, colour, duplicate indicator
- `QuickFill` — fill strategies produce correct grids

**Avoid testing:**
- Internal state shape
- CSS class names
- Exact DOM structure

### Priority 3: Integration

- Full workout flow: build grid → generate segments → verify timer sequence
- Exercise library round-trip: add → persist → reload → verify

## Test Patterns

### Pure Function Test

```typescript
import { describe, it, expect } from 'vitest';
import { generateId } from '../utils';

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});
```

### localStorage Mock

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadWorkouts, saveWorkout } from '../storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array when no data', () => {
    expect(loadWorkouts()).toEqual([]);
  });

  it('round-trips a workout', () => {
    const workout = { id: 'test-1', name: 'Test', /* ... */ };
    saveWorkout(workout as any);
    const loaded = loadWorkouts();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('test-1');
  });
});
```

### React Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NumberControl } from '../NumberControl';

describe('NumberControl', () => {
  it('displays the current value', () => {
    render(<NumberControl label="Sets" value={5} min={1} max={20} onChange={() => {}} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
```

## Rules

- **No snapshot tests** — they break on every CSS change and provide low signal
- **No testing implementation details** — test behaviour, not internal state
- **Mock at boundaries** — mock localStorage, not internal functions
- **One concept per test** — each `it()` tests one thing
- **Descriptive names** — `it('returns empty array when localStorage is empty')` not `it('works')`
- **Arrange-Act-Assert** pattern in every test
- **Clean state** — use `beforeEach` to reset localStorage or other shared state
