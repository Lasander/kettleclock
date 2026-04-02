# KettleClock — Project Guidelines

## Architecture

- **React 19 + TypeScript 6 + Vite 8** — single-page app, no router
- **State machine** screen switching: `setup | exerciseLibrary | workout | summary`
- **CSS Modules** (plain CSS, no preprocessor) — `.module.css` per component
- **localStorage** persistence — no backend, no auth
- **Web Audio API** for timer sounds; **Screen Wake Lock API** during workouts
- State lives in `App.tsx`, passed down via props — no external state library

## Code Style

- Functional React components with hooks; no class components
- `useCallback` / `useMemo` for expensive computations and stable references
- Types defined in `src/types.ts`; import with `import type` when possible
- CSS variable tokens in `src/styles/global.css` — use `var(--color-*)` not raw hex
- Touch targets ≥ 48 px; respect `env(safe-area-inset-*)` for notched phones
- Avoid APIs requiring secure context (no `crypto.randomUUID`, no HTTPS-only features)

## Build & Test

```bash
npm run dev      # Vite dev server
npm run build    # tsc && vite build
npx tsc --noEmit # Type-check only
npx vitest       # Unit tests (when configured)
```

## Key Files

| File | Purpose |
|------|---------|
| `specs.md` | Product specs — what the app does |
| `design.md` | Technical design — how it's built |
| `src/types.ts` | All shared types, colour maps, constants |
| `src/exercises.ts` | Exercise library — unified model, localStorage CRUD |
| `src/storage.ts` | Workout persistence helpers |
| `src/segments.ts` | Workout grid → flat timer segment list |
| `src/App.tsx` | Root component + screen state machine |

## Conventions

- IDs via `generateId()` from `src/utils.ts` (Date.now + random, no crypto)
- Exercise library: combined built-in + user exercises, single localStorage key
- Grid model: `ExerciseSlot[][]` — `grid[setIndex][exerciseIndex]`
- Muscle group colours follow a spectral order (see `MUSCLE_ORDER` in types.ts)
- Mobile-first: design for ≥ 320 px, test on iOS Safari
