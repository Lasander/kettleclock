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
  { name: 'Kettlebell Swing',               abbr: 'SW',  primary: 'back',      secondary: 'legs',      equipment: 'kettlebell' },
  { name: 'Goblet Squat',                   abbr: 'GS',  primary: 'legs',                               equipment: 'kettlebell' },
  { name: 'Turkish Get-Up',                 abbr: 'TGU', primary: 'fullBody',                            equipment: 'kettlebell' },
  { name: 'Clean & Press',                  abbr: 'C&P', primary: 'fullBody',                            equipment: 'kettlebell' },
  { name: 'Snatch',                         abbr: 'SN',  primary: 'fullBody',                            equipment: 'kettlebell' },
  { name: 'Kettlebell Row',                 abbr: 'RW',  primary: 'back',                                equipment: 'kettlebell' },
  { name: 'Kettlebell Deadlift',            abbr: 'DL',  primary: 'back',      secondary: 'legs',      equipment: 'kettlebell' },
  { name: 'Kettlebell Halo',                abbr: 'HL',  primary: 'shoulders', secondary: 'core',      equipment: 'kettlebell' },
  { name: 'Figure 8',                       abbr: 'F8',  primary: 'core',      secondary: 'legs',      equipment: 'kettlebell' },
  { name: 'Kettlebell Windmill',            abbr: 'WM',  primary: 'core',      secondary: 'shoulders', equipment: 'kettlebell' },
  { name: 'Kettlebell Thruster',            abbr: 'TH',  primary: 'fullBody',                            equipment: 'kettlebell' },
  { name: 'Kettlebell Lunge',               abbr: 'LU',  primary: 'legs',                               equipment: 'kettlebell' },
  { name: 'Kettlebell Clean',               abbr: 'CL',  primary: 'fullBody',                            equipment: 'kettlebell' },
  { name: 'Kettlebell Press',               abbr: 'PR',  primary: 'shoulders',                           equipment: 'kettlebell' },
  { name: 'Kettlebell High Pull',           abbr: 'HP',  primary: 'back',      secondary: 'shoulders', equipment: 'kettlebell' },
  { name: 'Kettlebell Sumo Squat',          abbr: 'SS',  primary: 'legs',                               equipment: 'kettlebell' },
  { name: 'Kettlebell Front Squat',         abbr: 'FS',  primary: 'legs',                               equipment: 'kettlebell' },
  { name: 'Kettlebell Farmer Walk',         abbr: 'FW',  primary: 'core',      secondary: 'back',      equipment: 'kettlebell' },
  { name: 'Kettlebell Renegade Row',        abbr: 'RR',  primary: 'back',      secondary: 'core',      equipment: 'kettlebell' },
  { name: 'Kettlebell Around the World',    abbr: 'AW',  primary: 'core',      secondary: 'shoulders', equipment: 'kettlebell' },
  { name: 'Kettlebell Single-Leg Deadlift', abbr: 'SD',  primary: 'legs',      secondary: 'back',      equipment: 'kettlebell' },
  { name: 'Kettlebell Floor Press',         abbr: 'FP',  primary: 'chest',                              equipment: 'kettlebell' },
  { name: 'Kettlebell Crush Curl',          abbr: 'CC',  primary: 'arms',                               equipment: 'kettlebell' },
  { name: 'Kettlebell Bent Press',          abbr: 'BP',  primary: 'shoulders', secondary: 'core',      equipment: 'kettlebell' },
  { name: 'Kettlebell Overhead Carry',      abbr: 'OC',  primary: 'shoulders', secondary: 'core',      equipment: 'kettlebell' },
  { name: 'Kettlebell Bob & Weave',         abbr: 'BW',  primary: 'legs',      secondary: 'core',      equipment: 'kettlebell' },
  { name: 'Kettlebell Side Lunge',          abbr: 'SL',  primary: 'legs',                               equipment: 'kettlebell' },
  { name: 'Kettlebell Push Press',          abbr: 'PP',  primary: 'shoulders', secondary: 'legs',      equipment: 'kettlebell' },

  // -- Bodyweight exercises --
  { name: 'Plank',                          abbr: 'PL',  primary: 'core',                              equipment: 'bodyweight' },
  { name: 'Side Plank',                     abbr: 'SP',  primary: 'core',                              equipment: 'bodyweight' },
  { name: 'Push-Up',                        abbr: 'PU',  primary: 'chest',     secondary: 'arms',      equipment: 'bodyweight' },
  { name: 'Wide Push-Up',                   abbr: 'WP',  primary: 'chest',                              equipment: 'bodyweight' },
  { name: 'Diamond Push-Up',               abbr: 'DP',  primary: 'arms',      secondary: 'chest',     equipment: 'bodyweight' },
  { name: 'Pull-Up',                        abbr: 'PUL', primary: 'back',      secondary: 'arms',      equipment: 'bodyweight' },
  { name: 'Chin-Up',                        abbr: 'CU',  primary: 'arms',      secondary: 'back',      equipment: 'bodyweight' },
  { name: 'Dip',                            abbr: 'DI',  primary: 'chest',     secondary: 'arms',      equipment: 'bodyweight' },
  { name: 'Sit-Up',                         abbr: 'SIT', primary: 'core',                              equipment: 'bodyweight' },
  { name: 'Crunch',                         abbr: 'CR',  primary: 'core',                              equipment: 'bodyweight' },
  { name: 'Leg Raise',                      abbr: 'LR',  primary: 'core',                              equipment: 'bodyweight' },
  { name: 'Glute Bridge',                   abbr: 'GB',  primary: 'legs',      secondary: 'core',      equipment: 'bodyweight' },
  { name: 'Squat',                          abbr: 'SQ',  primary: 'legs',                              equipment: 'bodyweight' },
  { name: 'Lunge',                          abbr: 'LN',  primary: 'legs',                              equipment: 'bodyweight' },
  { name: 'Burpee',                         abbr: 'BRP', primary: 'cardio',    secondary: 'fullBody',  equipment: 'bodyweight' },
  { name: 'Mountain Climber',               abbr: 'MC',  primary: 'cardio',    secondary: 'core',      equipment: 'bodyweight' },
  { name: 'Jump Squat',                     abbr: 'JQ',  primary: 'cardio',    secondary: 'legs',      equipment: 'bodyweight' },
  { name: 'Jumping Jack',                   abbr: 'JJ',  primary: 'cardio',                             equipment: 'bodyweight' },
  { name: 'High Knees',                     abbr: 'HK',  primary: 'cardio',    secondary: 'legs',      equipment: 'bodyweight' },
  { name: 'Box Jump',                       abbr: 'BJ',  primary: 'cardio',    secondary: 'legs',      equipment: 'bodyweight' },
  { name: 'Bear Crawl',                     abbr: 'BC',  primary: 'fullBody',                           equipment: 'bodyweight' },
  { name: 'Superman',                       abbr: 'SM',  primary: 'back',      secondary: 'core',      equipment: 'bodyweight' },
];

// ── localStorage persistence ───────────────────────────────────────────

const LIBRARY_KEY = 'kettleclock_exercises';

function seedDefaults(): ExerciseDefinition[] {
  return DEFAULT_EXERCISES.map((e) => ({ ...e, builtin: true, enabled: true }));
}

/** Migrate old exercises that don't have equipment/builtin/enabled fields */
function migrateExercise(e: any): ExerciseDefinition {
  const defaultMatch = DEFAULT_EXERCISES.find((d) => d.name === e.name);
  return {
    name: e.name,
    abbr: e.abbr,
    primary: e.primary,
    secondary: e.secondary,
    equipment: e.equipment ?? defaultMatch?.equipment ?? (
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
    return arr.map(migrateExercise);
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

/** Auto-suggest an abbreviation from a name */
export function suggestAbbr(name: string): string {
  const words = name.replace(/^Kettlebell\s+/, '').split(/[\s-]+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join('').slice(0, 3).toUpperCase();
}

