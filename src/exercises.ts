/**
 * ★ EXERCISE LIBRARY ★
 *
 * Unified exercise library: built-in defaults + user-created exercises.
 * All exercises follow the same ExerciseDefinition model and are persisted
 * in localStorage. On first launch the library is seeded from DEFAULT_EXERCISES.
 */

import type { ExerciseDefinition, MuscleGroup } from './types';

// ── Built-in default exercises (used to seed localStorage on first launch) ──

const DEFAULT_EXERCISES: Omit<ExerciseDefinition, 'builtin' | 'enabled'>[] = [
  // -- Kettlebell exercises --
  { name: 'Swing',               primary: 'back',      secondary: 'legs',      equipment: 'kettlebell' },
  { name: 'Goblet Squat',        primary: 'legs',                               equipment: 'kettlebell' },
  { name: 'Turkish Get-Up',      primary: 'fullBody',                            equipment: 'kettlebell' },
  { name: 'Clean & Press',       primary: 'fullBody',                            equipment: 'kettlebell' },
  { name: 'Snatch',              primary: 'fullBody',                            equipment: 'kettlebell' },
  { name: 'Row',                 primary: 'back',                                equipment: 'kettlebell' },
  { name: 'Deadlift',            primary: 'back',      secondary: 'legs',      equipment: 'kettlebell' },
  { name: 'Halo',                primary: 'shoulders', secondary: 'core',      equipment: 'kettlebell' },
  { name: 'Figure 8',            primary: 'core',      secondary: 'legs',      equipment: 'kettlebell' },
  { name: 'Windmill',            primary: 'core',      secondary: 'shoulders', equipment: 'kettlebell' },
  { name: 'Thruster',            primary: 'fullBody',                            equipment: 'kettlebell' },
  { name: 'Clean',               primary: 'fullBody',                            equipment: 'kettlebell' },
  { name: 'Press',               primary: 'shoulders',                           equipment: 'kettlebell' },
  { name: 'High Pull',           primary: 'back',      secondary: 'shoulders', equipment: 'kettlebell' },
  { name: 'Sumo Squat',          primary: 'legs',                               equipment: 'kettlebell' },
  { name: 'Front Squat',         primary: 'legs',                               equipment: 'kettlebell' },
  { name: 'Farmer Walk',         primary: 'core',      secondary: 'back',      equipment: 'kettlebell' },
  { name: 'Renegade Row',        primary: 'back',      secondary: 'core',      equipment: 'kettlebell' },
  { name: 'Around the World',    primary: 'core',      secondary: 'shoulders', equipment: 'kettlebell' },
  { name: 'Single-Leg Deadlift', primary: 'legs',      secondary: 'back',      equipment: 'kettlebell' },
  { name: 'Floor Press',         primary: 'chest',                              equipment: 'kettlebell' },
  { name: 'Crush Curl',          primary: 'arms',                               equipment: 'kettlebell' },
  { name: 'Bent Press',          primary: 'shoulders', secondary: 'core',      equipment: 'kettlebell' },
  { name: 'Overhead Carry',      primary: 'shoulders', secondary: 'core',      equipment: 'kettlebell' },
  { name: 'Bob & Weave',         primary: 'legs',      secondary: 'core',      equipment: 'kettlebell' },
  { name: 'Side Lunge',          primary: 'legs',                               equipment: 'kettlebell' },
  { name: 'Push Press',          primary: 'shoulders', secondary: 'legs',      equipment: 'kettlebell' },

  // -- Bodyweight exercises --
  { name: 'Plank',                          primary: 'core',                              equipment: 'bodyweight' },
  { name: 'Side Plank',                     primary: 'core',                              equipment: 'bodyweight' },
  { name: 'Push-Up',                        primary: 'chest',     secondary: 'arms',      equipment: 'bodyweight' },
  { name: 'Wide Push-Up',                   primary: 'chest',                              equipment: 'bodyweight' },
  { name: 'Diamond Push-Up',               primary: 'arms',      secondary: 'chest',     equipment: 'bodyweight' },
  { name: 'Pull-Up',                        primary: 'back',      secondary: 'arms',      equipment: 'bodyweight' },
  { name: 'Chin-Up',                        primary: 'arms',      secondary: 'back',      equipment: 'bodyweight' },
  { name: 'Dip',                            primary: 'chest',     secondary: 'arms',      equipment: 'bodyweight' },
  { name: 'Sit-Up',                         primary: 'core',                              equipment: 'either' },
  { name: 'Crunch',                         primary: 'core',                              equipment: 'bodyweight' },
  { name: 'Leg Raise',                      primary: 'core',                              equipment: 'bodyweight' },
  { name: 'Glute Bridge',                   primary: 'legs',      secondary: 'core',      equipment: 'either' },
  { name: 'Squat',                          primary: 'legs',                              equipment: 'either' },
  { name: 'Lunge',                          primary: 'legs',                              equipment: 'either' },
  { name: 'Burpee',                         primary: 'cardio',    secondary: 'fullBody',  equipment: 'either' },
  { name: 'Mountain Climber',               primary: 'cardio',    secondary: 'core',      equipment: 'bodyweight' },
  { name: 'Jump Squat',                     primary: 'cardio',    secondary: 'legs',      equipment: 'bodyweight' },
  { name: 'Jumping Jack',                   primary: 'cardio',                             equipment: 'bodyweight' },
  { name: 'High Knees',                     primary: 'cardio',    secondary: 'legs',      equipment: 'bodyweight' },
  { name: 'Box Jump',                       primary: 'cardio',    secondary: 'legs',      equipment: 'bodyweight' },
  { name: 'Bear Crawl',                     primary: 'fullBody',                           equipment: 'bodyweight' },
  { name: 'Superman',                       primary: 'back',      secondary: 'core',      equipment: 'bodyweight' },
];

/** Maps old exercise names → new names for localStorage migration */
export const NAME_MIGRATION: Record<string, string> = {
  'Kettlebell Swing': 'Swing',
  'Kettlebell Row': 'Row',
  'Kettlebell Deadlift': 'Deadlift',
  'Kettlebell Halo': 'Halo',
  'Kettlebell Windmill': 'Windmill',
  'Kettlebell Thruster': 'Thruster',
  'Kettlebell Lunge': 'Lunge',  // merged with bodyweight Lunge
  'Kettlebell Clean': 'Clean',
  'Kettlebell Press': 'Press',
  'Kettlebell High Pull': 'High Pull',
  'Kettlebell Sumo Squat': 'Sumo Squat',
  'Kettlebell Front Squat': 'Front Squat',
  'Kettlebell Farmer Walk': 'Farmer Walk',
  'Kettlebell Renegade Row': 'Renegade Row',
  'Kettlebell Around the World': 'Around the World',
  'Kettlebell Single-Leg Deadlift': 'Single-Leg Deadlift',
  'Kettlebell Floor Press': 'Floor Press',
  'Kettlebell Crush Curl': 'Crush Curl',
  'Kettlebell Bent Press': 'Bent Press',
  'Kettlebell Overhead Carry': 'Overhead Carry',
  'Kettlebell Bob & Weave': 'Bob & Weave',
  'Kettlebell Side Lunge': 'Side Lunge',
  'Kettlebell Push Press': 'Push Press',
};

// ── localStorage persistence ───────────────────────────────────────────

const LIBRARY_KEY = 'kettleclock_exercises';

function seedDefaults(): ExerciseDefinition[] {
  return DEFAULT_EXERCISES.map((e) => ({ ...e, builtin: true, enabled: true }));
}

/** Migrate old exercises that don't have equipment/builtin/enabled fields */
function migrateExercise(e: any): ExerciseDefinition {
  const migratedName = NAME_MIGRATION[e.name] ?? e.name;
  const defaultMatch = DEFAULT_EXERCISES.find((d) => d.name === migratedName)
    ?? DEFAULT_EXERCISES.find((d) => d.name === e.name);
  return {
    name: migratedName,
    primary: e.primary,
    secondary: e.secondary,
    equipment: (e.equipment === 'kettlebell' || e.equipment === 'bodyweight' || e.equipment === 'either')
      ? e.equipment
      : defaultMatch?.equipment ?? (
          NAME_MIGRATION[e.name] !== undefined ||
          e.name.startsWith('Kettlebell ') ||
          ['Goblet Squat', 'Turkish Get-Up', 'Clean & Press', 'Snatch', 'Figure 8'].includes(e.name)
            ? 'kettlebell' : 'bodyweight'
        ),
    builtin: e.builtin ?? !!defaultMatch,
    enabled: e.enabled ?? true,
  };
}

function loadFromStorage(): ExerciseDefinition[] | null {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return null;
    const migrated = arr.map(migrateExercise);
    // Deduplicate by name (migration may create duplicates)
    const seen = new Set<string>();
    const deduped = migrated.filter((e) => {
      if (seen.has(e.name)) return false;
      seen.add(e.name);
      return true;
    });
    return deduped;
  } catch {
    return null;
  }
}

function saveToStorage(library: ExerciseDefinition[]): void {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
}

// ── Runtime library (mutable singleton) ────────────────────────────────

let _library: ExerciseDefinition[] = loadFromStorage() ?? seedDefaults();
// Ensure any new defaults added in code updates are merged in
(() => {
  const existing = new Set(_library.map((e) => e.name));
  let added = false;
  for (const d of DEFAULT_EXERCISES) {
    if (!existing.has(d.name)) {
      _library.push({ ...d, builtin: true, enabled: true });
      added = true;
    }
  }
  if (added) saveToStorage(_library);
})();

let _map = new Map(_library.map((e) => [e.name, e]));

function rebuildMap() {
  _map = new Map(_library.map((e) => [e.name, e]));
}

// ── Public API ─────────────────────────────────────────────────────────

/** All exercises (defaults + custom, enabled and disabled). */
export function getExerciseLibrary(): ExerciseDefinition[] {
  return _library;
}

/** Only exercises with enabled === true. */
export function getEnabledExercises(): ExerciseDefinition[] {
  return _library.filter((e) => e.enabled);
}

export function getExerciseDef(name: string): ExerciseDefinition | undefined {
  return _map.get(name);
}

export function getExercisesByMuscle(muscle: MuscleGroup): ExerciseDefinition[] {
  return _library.filter((e) => e.enabled && (e.primary === muscle || e.secondary === muscle));
}

/** Save or update an exercise in the library. */
export function saveExercise(exercise: ExerciseDefinition): void {
  const idx = _library.findIndex((e) => e.name === exercise.name);
  if (idx >= 0) {
    _library[idx] = exercise;
  } else {
    _library.push(exercise);
  }
  rebuildMap();
  saveToStorage(_library);
}

/** Update an exercise, matching by old name (to support renames). */
export function updateExercise(oldName: string, exercise: ExerciseDefinition): void {
  const idx = _library.findIndex((e) => e.name === oldName);
  if (idx >= 0) {
    _library[idx] = exercise;
  } else {
    _library.push(exercise);
  }
  rebuildMap();
  saveToStorage(_library);
}

/** Delete a custom exercise. Built-in exercises cannot be deleted. */
export function deleteExercise(name: string): boolean {
  const idx = _library.findIndex((e) => e.name === name);
  if (idx < 0) return false;
  if (_library[idx].builtin) return false;
  _library.splice(idx, 1);
  rebuildMap();
  saveToStorage(_library);
  return true;
}

/** Toggle enabled state for an exercise. */
export function toggleExerciseEnabled(name: string): void {
  const ex = _map.get(name);
  if (!ex) return;
  ex.enabled = !ex.enabled;
  saveToStorage(_library);
}

/** Check if a name is already taken (case-insensitive). */
export function isNameTaken(name: string, excludeName?: string): boolean {
  const lower = name.toLowerCase();
  return _library.some((e) => e.name.toLowerCase() === lower && e.name !== excludeName);
}

/** Strip redundant prefix (e.g. "Kettlebell ") for display in lists */
export function getDisplayName(name: string): string {
  return name.replace(/^Kettlebell\s+/, '').replace(/^KB\s+/, '');
}

/** Derive a short display name (≤10 chars) for grid cells */
export function getShortName(name: string): string {
  let short = name
    .replace(/^Kettlebell\s+/, '')
    .replace(/^KB\s+/, '');
  if (short.length <= 10) return short;
  const words = short.split(/[\s-]+/);
  if (words.length === 1) return short.slice(0, 10);
  const abbr = words.map((w, i) => i === 0 ? w : w.slice(0, 3)).join(' ');
  if (abbr.length <= 10) return abbr;
  return words[0].slice(0, 10);
}

/** Compute per-set and cross-set duplicate exercise names */
export function computeDuplicates(grid: { exerciseName: string }[][]): {
  setDupes: Map<string, Set<string>>;
  workoutDupes: Set<string>;
} {
  const setDupes = new Map<string, Set<string>>();
  const workoutCounts: Record<string, number> = {};
  for (let s = 0; s < grid.length; s++) {
    const counts: Record<string, number> = {};
    for (const slot of grid[s]) {
      if (slot.exerciseName) {
        counts[slot.exerciseName] = (counts[slot.exerciseName] || 0) + 1;
        workoutCounts[slot.exerciseName] = (workoutCounts[slot.exerciseName] || 0) + 1;
      }
    }
    setDupes.set(String(s), new Set(Object.entries(counts).filter(([, c]) => c > 1).map(([n]) => n)));
  }
  const workoutDupes = new Set(Object.entries(workoutCounts).filter(([, c]) => c > 1).map(([n]) => n));
  return { setDupes, workoutDupes };
}



