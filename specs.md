# KettleClock — Product Specifications

## Overview

KettleClock is a mobile-friendly web app for timing kettlebell (and bodyweight) workouts. Users plan workouts on a visual grid in the **Setup** phase, then run a guided timer in the **Workout** phase that counts through each exercise, rest, and set break automatically.

## Phases / Screens

| Phase | Description |
|---|---|
| **Setup** | Configure and save workouts; the main planning grid |
| **Exercise Library** | Manage all exercises: add, edit, duplicate, toggle visibility |
| **Workout** | Active timer screen counting through segments |
| **Summary** | Post-workout results; option to repeat or return to Setup |

## Core Concepts

### Workout Structure

A workout is a **grid** of `S` sets × `E` exercises per set. Each cell is an exercise slot that can be assigned independently — different sets can have entirely different exercises.

- **Sets** (5–8 typical): rows in the grid
- **Exercises per set** (4–5 typical): columns in the grid
- **Exercise rest**: short pause between exercises within a set
- **Set rest**: longer pause between sets
- **Initial countdown**: a get-ready countdown before the first exercise

### Exercise Library

A unified library of **kettlebell and bodyweight exercises**, combining built-in defaults with user-created entries. Each exercise has:
- Full name and **abbreviation** (2–3 letters)
- **Primary muscle group** (and optional secondary)
- **Equipment type**: `kettlebell` or `bodyweight`
- **Built-in flag**: whether the exercise ships with the app or was user-created
- **Enabled flag**: whether it appears in the exercise picker during workout setup

Both default and custom exercises follow the same data model. Default exercises are seeded on first launch and stored in `localStorage` alongside user-created ones. Users can hide defaults they don't need and add exercises tailored to their routine.

### Muscle Groups

Eight groups arranged on a colour spectrum so adjacent groups share adjacent hues, making muscle balance visible at a glance:

| Group | Colour |
|---|---|
| Legs | Green |
| Core | Lime |
| Cardio | Amber |
| Full Body | Orange |
| Arms | Pink |
| Chest | Magenta |
| Shoulders | Violet |
| Back | Blue |

### Visual Grid

Each exercise cell is a **coloured rectangle** showing its abbreviation:
- Background colour from primary muscle group
- **Diagonal split** for exercises with a secondary muscle group
- **Grey** for empty/unassigned slots
- The legend is shown in spectrum order so muscle balance is visible at a glance

### Default Timing

| Segment | Default |
|---|---|
| Exercise | 30 s |
| Exercise rest | 15 s |
| Set rest | 60 s |

All defaults are editable per-workout.

### Per-Exercise Overrides (Advanced)

Hidden behind a toggle. Each exercise slot can optionally override its own duration and rest-after.

## Features

### 1. Setup Phase

- Name the workout
- Set **number of sets** and **exercises per set** (sizes the grid)
- **Number controls**: show a large readable number; tap to edit
- **Visual exercise grid** (coloured rectangles):
  - Tap a cell → pick exercise from library via native picker
  - Duplicate assignments flagged visually
  - **Long press any cell → enter reorder mode**; in reorder mode, drag any cell to any other position across the whole grid to swap
  - Tap a "Done" button or long-press again to exit reorder mode
- **Quick Fill** menu:
  - Fill manually (walk through empty slots one by one)
  - Random
  - Muscle group per set (each set targets one group)
  - Alternate muscles (rotate groups within each set)
  - Clear all
- Default timing controls (exercise, rest, set rest)
- Optional "Advanced timing" toggle for per-exercise overrides
- Save / load / delete workouts (local storage)
- **"Edit Exercises" button** navigates to the Exercise Library Editor

### 2. Exercise Library Editor

Accessible from the Setup phase via a dedicated button. Manages the full list of exercises available for workout building.

#### Viewing
- Shows all exercises (defaults + custom) in a scrollable list
- Each row shows: colour dot(s) for muscle groups, name, abbreviation, equipment icon, and an enable/disable toggle
- Filterable by equipment type (Kettlebell / Bodyweight) and muscle group, same as the exercise picker

#### Adding Exercises
- **"Add Exercise" button** opens an edit form to create from scratch
- **Duplicate button** on any existing exercise creates a copy with "(copy)" appended, ready for editing
- New exercise form fields:
  - Name (required, must be unique)
  - Abbreviation (2–3 characters, auto-suggested from name)
  - Primary muscle group (required, select from the eight groups)
  - Secondary muscle group (optional)
  - Equipment type (kettlebell or bodyweight)

#### Editing Exercises
- Tap any exercise row to open it for editing
- All fields are editable for both default and custom exercises
- Changes take effect immediately (auto-saved)

#### Enabling / Disabling
- Each exercise has a toggle switch to control whether it appears in the exercise picker
- Disabled exercises are visually dimmed but remain in the library
- Exercises already assigned to a workout grid continue to work even if later disabled

#### Deleting
- Custom exercises show a delete option
- Built-in default exercises cannot be deleted but can be disabled
- Deletion requires confirmation

#### Persistence
- The full exercise library (defaults + custom, with enabled state) is stored in `localStorage` under a dedicated key
- On first launch, the library is seeded from the built-in defaults with all exercises enabled
- The stored library is the single source of truth at runtime

### 3. Workout Phase

- **Initial countdown** before the first exercise
- Full-screen display optimised for glanceability
- Shows: segment label, time remaining (large), set/exercise progress
- **Ending-soon indicator**: visual flash + audio when ≤ 3 s remain in an exercise
- Colour-coded phases: Green (exercise) · Blue (rest) · Orange (set rest)
- Audio cues:
  - 3-2-1 countdown beeps before each exercise starts (during rest)
  - 3-2-1 ending beeps near the end of each exercise
  - Half-time beep at the midpoint of each exercise
  - Distinct sound when set rest starts
- Controls: **Pause/Resume · ◀ Previous · Skip ▶ · Abort**
  - Previous returns to the start of the previous segment (useful if a segment was accidentally skipped)
- Abort requires confirmation

### 4. Summary Phase

- Total elapsed time
- Sets × exercises completed
- Option to re-run or return to Setup

## Non-Functional Requirements

- **Mobile-first**: fully usable on phones ≥ 320 px wide
- **Touch-optimised**: large tap targets (≥ 48 px), native pickers, pointer-event drag
- **Offline-capable**: no server; all data in `localStorage`
- **No account / auth**: single-user, local-only
- **Portable**: static site, any HTTP server or `file://`
- **Wake lock**: prevent phone sleep during active Workout phase
- **Audio**: works on iOS Safari via `webkitAudioContext` fallback; AudioContext resumed from user gesture
- **Cross-browser**: iOS Safari (non-HTTPS) + Chrome; no APIs requiring secure context