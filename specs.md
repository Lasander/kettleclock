# KettleClock — Product Specifications

## Overview

KettleClock is a mobile-friendly web app for timing kettlebell workouts. Users plan workouts on a visual grid (sets × exercises), then run a guided timer that counts through each exercise, rest, and set break automatically.

## Core Concepts

### Workout Structure

A workout is a **grid** of `S` sets × `E` exercises per set. Each cell in the grid is an exercise slot that can be assigned independently — different sets can have entirely different exercises.

- **Sets** (5–8 typical): rows in the grid
- **Exercises per set** (4–5 typical): columns in the grid
- **Exercise rest**: short pause between exercises within a set
- **Set rest**: longer pause between sets
- **Initial countdown**: a get-ready countdown before the first exercise (equal to the exercise rest duration)

### Exercise Library

A built-in list of common kettlebell exercises is provided, each with:
- Full name and **abbreviation** (2–3 letters for compact display)
- **Primary muscle group** (and optional secondary)

Muscle groups: Legs, Back, Shoulders, Core, Full Body — each with a distinct colour.

### Visual Grid

Each exercise is shown as a **coloured rectangle** displaying its abbreviation:
- Colour encodes the primary muscle group
- Dual-muscle exercises show a **diagonal split** of both colours
- Empty/unassigned slots are **grey**
- Users see the workout structure at a glance — muscle balance is immediately visible

### Default Timing

| Segment | Default Duration |
|---|---|
| Exercise | 30 s |
| Exercise rest | 15 s |
| Set rest | 60 s |

All defaults are editable at the workout level.

### Per-Exercise Overrides (Advanced)

Hidden behind an "Advanced timing" toggle. When enabled, each exercise slot can optionally override its own duration and the rest after it.

## Features

### 1. Workout Builder

- Name the workout
- Set **number of sets** and **number of exercises per set** — this sizes the grid
- **Number controls** show a large readable value; editing controls appear on tap
- **Visual grid** of exercise cells (coloured rectangles with abbreviations)
  - Tap a cell → pick an exercise from the library via native picker
  - Duplicate exercises across the grid are visually flagged
  - **Touch drag** to reorder exercises within a set
- **Quick Fill** menu to populate the grid automatically:
  - Random — fill empty slots with random exercises
  - By muscle per set — each set targets one muscle group
  - Alternate muscles — rotate muscle groups within each set
  - Clear all — reset grid to empty
- Set default exercise duration, exercise rest, and set rest
- Optional "Advanced timing" toggle reveals per-exercise duration & rest overrides
- Save workouts to local storage (browser)
- Load / edit / delete saved workouts

### 2. Timer

- **Initial countdown** before the first exercise (duration = exercise rest default)
- Full-screen timer display optimised for glanceability at arm's length
- Shows: current segment name, time remaining (large), set/exercise progress
- Colour-coded phases:
  - **Green** — exercise active
  - **Blue** — exercise rest / initial countdown
  - **Orange** — set rest
- Audio cues:
  - 3-2-1 countdown beeps before each exercise starts
  - Distinct sound for set rest start
  - **Half-time beep** at the midpoint of each exercise
- Pause / resume / skip to next segment controls
- Abort workout (with confirmation)

### 3. Workout Summary (post-workout)

- Total elapsed time
- Sets and exercises completed
- Option to re-run workout or return to builder

## Non-Functional Requirements

- **Mobile-first responsive**: must be fully usable on phone screens (≥ 320 px)
- **Touch-optimised**: large tap targets, native pickers, drag-to-reorder
- **Offline-capable**: no server dependency; all data in `localStorage`
- **No account / auth**: single-user, local-only
- **Portable**: runs as a static site — serveable via any HTTP server or `file://`
- **Wake lock**: request screen wake lock during active timer so phone doesn't sleep
- **Accessible**: sufficient contrast, large touch targets (≥ 48 px), ARIA labels on controls
- **Cross-browser mobile**: works on iOS Safari (non-HTTPS) and Chrome; avoids APIs requiring secure context