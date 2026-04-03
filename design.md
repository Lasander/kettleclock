# KettleClock — Technical Design

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| UI framework | React 19 | Component model fits timer + builder; large ecosystem |
| Build tool | Vite | Fast dev server, zero-config for React |
| Language | TypeScript | Catch timing/state bugs at compile time |
| Styling | CSS Modules (plain CSS) | No runtime cost, simple, mobile-friendly |
| State management | React `useState` + lifting | Sufficient for single-screen app; no extra deps |
| Persistence | `localStorage` | Offline-first, no backend |
| Audio | Web Audio API | Low-latency beeps without loading audio files |
| Wake lock | Screen Wake Lock API | Prevent phone sleep during timer |

## Project Structure

```
kettleclock/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx                    # React entry point
│   ├── App.tsx                     # Root: routes between Builder, Timer, Summary
│   ├── types.ts                    # Shared TypeScript types
│   ├── exercises.ts                # Exercise library with muscle groups
│   ├── segments.ts                 # Workout grid → flat segment list
│   ├── storage.ts                  # localStorage helpers
│   ├── audio.ts                    # Web Audio beep/sound helpers
│   ├── wakeLock.ts                 # Screen Wake Lock wrapper
│   ├── utils.ts                    # Shared utilities (ID gen, etc.)
│   ├── components/
│   │   ├── WorkoutBuilder.tsx      # Workout builder (grid + controls)
│   │   ├── WorkoutBuilder.module.css
│   │   ├── ExerciseCell.tsx        # Single coloured rectangle in grid
│   │   ├── ExerciseCell.module.css
│   │   ├── ExerciseLibrary.tsx     # Exercise library editor screen
│   │   ├── ExerciseLibrary.module.css
│   │   ├── ExercisePicker.tsx      # (unused, superseded by SlotEditor)
│   │   ├── ExercisePicker.module.css
│   │   ├── Logo.tsx                # App logo component
│   │   ├── NumberControl.tsx       # Tap-to-edit number display
│   │   ├── NumberControl.module.css
│   │   ├── QuickFill.tsx           # (unused, superseded by SlotEditor)
│   │   ├── QuickFill.module.css
│   │   ├── SlotEditor.tsx          # Full-screen slot editor overlay
│   │   ├── SlotEditor.module.css
│   │   ├── WorkoutDetails.tsx      # Per-exercise timing overlay
│   │   ├── WorkoutDetails.module.css
│   │   ├── Timer.tsx               # Active workout timer screen
│   │   ├── Timer.module.css
│   │   ├── Summary.tsx             # Post-workout summary
│   │   └── Summary.module.css
│   └── styles/
│       └── global.css              # Reset, CSS variables, typography
```

## Data Model

```typescript
type MuscleGroup = 'legs' | 'core' | 'cardio' | 'fullBody' | 'arms' | 'chest' | 'shoulders' | 'back';

type Equipment = 'kettlebell' | 'bodyweight' | 'either';

interface ExerciseDefinition {
  name: string;
  primary: MuscleGroup;
  secondary?: MuscleGroup;
  equipment: Equipment;
  builtin: boolean;
  enabled: boolean;
}

interface ExerciseSlot {
  id: string;
  exerciseName: string;   // references library name; '' = empty
  duration?: number;      // seconds — override workout default
  restAfter?: number;     // seconds — override workout default
}

interface Workout {
  id: string;
  name: string;
  setsCount: number;
  exercisesPerSet: number;
  defaultExerciseDuration: number;
  defaultExerciseRest: number;
  defaultSetRest: number;
  grid: ExerciseSlot[][];  // grid[setIndex][exerciseIndex]
  createdAt: number;
  updatedAt: number;
}
```

## Visual Grid

Each exercise cell is a ~50–60 px square showing:
- **Short name** in white text (auto-derived from exercise name via `getShortName()`)
- **Background colour** from primary muscle group
- **Diagonal split** (45° linear-gradient) when exercise has two muscle groups
- **Grey** (#555) for empty/unassigned slots

Muscle group colour map (vibrant / muted):
| Group | Colour | Vibrant | Muted |
|---|---|---|---|
| Legs | Emerald green | #2dd4a0 | #1a7a52 |
| Core | Lime | #a3e635 | #507714 |
| Cardio | Amber | #fbbf24 | #856d13 |
| Full Body | Orange | #f97316 | #984018 |
| Arms | Crimson rose | #f43f5e | #8f2a3e |
| Chest | Fuchsia | #d946ef | #7f2d90 |
| Shoulders | Indigo | #6366f1 | #3a3e94 |
| Back | Sky blue | #38bdf8 | #1d5f87 |
| Empty | Grey | #555555 | — |

## Timer Engine

The timer converts a `Workout` grid into a flat list of **segments**:

```typescript
type SegmentType = 'initialCountdown' | 'exercise' | 'exerciseRest' | 'setRest';

interface Segment {
  type: SegmentType;
  label: string;
  duration: number;
  setIndex: number;
  exerciseIndex: number;
}
```

Generation logic (pseudo):
```
push initialCountdown segment (duration = defaultExerciseRest)
for each set s in 0..setsCount-1:
  for each exercise e in grid[s]:
    push exercise segment (duration from slot override or default)
    if not last exercise in set:
      push exerciseRest segment (restAfter from slot override or default)
  if not last set:
    push setRest segment
```

At runtime the timer:
1. Walks segments sequentially via 1 s `setInterval`
2. Fires countdown beeps at T-3, T-2, T-1 before each exercise segment
3. Fires half-time beep at midpoint of each exercise segment
4. On segment end → advance to next; on last segment end → show Summary

## Screens & Navigation

Simple state machine (no router library needed):

```
┌──────────┐   start   ┌───────┐   done   ┌─────────┐
│  Builder  │ ───────> │ Timer │ ───────> │ Summary │
└──────────┘           └───────┘           └─────────┘
     ^                      │ abort             │
     └──────────────────────┘ (keeps workout)    │
     └────────────────────────────────────────────┘
```

When aborting, the workout object is passed back to the Builder via `initialWorkout` prop, preserving the grid and timing configuration.

## Responsive / Mobile Strategy

- Base font size 16 px; timer digits scale with `clamp()` (minimum ~72 px)
- Single-column layout; no horizontal scrolling
- Touch targets ≥ 48 × 48 px with adequate spacing
- Timer screen goes near-fullscreen (hides builder chrome)
- CSS `env(safe-area-inset-*)` for notched phones — all full-screen views (WorkoutDetails, ExerciseLibrary, Summary, Timer, Swap/Clear overlay) respect `safe-area-inset-top`
- **Setup screen**: uses `100dvh` for full viewport height; exercise grid scrolls vertically; "Start Workout" button pinned at bottom
- **Swap/Clear mode**: full-screen overlay with animated entry; cells show × to clear, drag to swap, undo for last action
- **Number controls**: show large value by default; tap to reveal edit input; pending digit indicator uses green (`#4ade80`)
- **Grid cells**: tap to open Slot Editor, long-press to enter Swap/Clear mode
- **WorkoutDetails**: uses "← Back" button (not ✕) for navigation

## Audio Strategy

Generate tones programmatically via `OscillatorNode`:
- **Countdown beep**: 880 Hz, 100 ms, at T-3, T-2, T-1
- **Exercise start**: 1320 Hz, 200 ms
- **Half-time beep**: 660 Hz, 150 ms, at midpoint of each exercise
- **Set rest start**: 440 Hz, 300 ms

No audio files to load → works offline and keeps bundle tiny.

## Wake Lock

```typescript
async function requestWakeLock() {
  if ('wakeLock' in navigator) {
    return navigator.wakeLock.request('screen');
  }
}
```

Acquired when timer starts, released on pause/abort/completion. Re-acquired on `visibilitychange` if timer is active (required by spec).

## Persistence

All workouts serialised as JSON array in `localStorage` under key `kettleclock_workouts`. Helpers:
- `loadWorkouts(): Workout[]`
- `saveWorkout(w: Workout): void`
- `deleteWorkout(id: string): void`

IDs generated via a simple `Date.now() + Math.random()` function (avoids `crypto.randomUUID()` which requires secure context on some mobile browsers).