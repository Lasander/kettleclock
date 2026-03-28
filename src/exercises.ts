/**
 * ★ EXERCISE LIBRARY ★
 *
 * This is the single source of truth for all exercises in KettleClock.
 * Add, remove, or edit entries here to customise the library.
 *
 * Each entry needs:
 *   name     — full display name (must be unique)
 *   abbr     — 2–3 letter abbreviation shown in the grid cell
 *   primary  — main muscle group (determines cell colour)
 *   secondary — optional second muscle group (produces a diagonal colour split)
 *
 * Available muscle groups:
 *   'legs' | 'core' | 'cardio' | 'fullBody' | 'arms' | 'chest' | 'shoulders' | 'back'
 */

import type { ExerciseDefinition, MuscleGroup } from './types';

export const EXERCISE_LIBRARY: ExerciseDefinition[] = [
  // -- Kettlebell exercises --
  { name: 'Kettlebell Swing',               abbr: 'SW',  primary: 'back',      secondary: 'legs' },
  { name: 'Goblet Squat',                   abbr: 'GS',  primary: 'legs' },
  { name: 'Turkish Get-Up',                 abbr: 'TGU', primary: 'fullBody' },
  { name: 'Clean & Press',                  abbr: 'C&P', primary: 'fullBody' },
  { name: 'Snatch',                         abbr: 'SN',  primary: 'fullBody' },
  { name: 'Kettlebell Row',                 abbr: 'RW',  primary: 'back' },
  { name: 'Kettlebell Deadlift',            abbr: 'DL',  primary: 'back',      secondary: 'legs' },
  { name: 'Kettlebell Halo',                abbr: 'HL',  primary: 'shoulders', secondary: 'core' },
  { name: 'Figure 8',                       abbr: 'F8',  primary: 'core',      secondary: 'legs' },
  { name: 'Kettlebell Windmill',            abbr: 'WM',  primary: 'core',      secondary: 'shoulders' },
  { name: 'Kettlebell Thruster',            abbr: 'TH',  primary: 'fullBody' },
  { name: 'Kettlebell Lunge',               abbr: 'LU',  primary: 'legs' },
  { name: 'Kettlebell Clean',               abbr: 'CL',  primary: 'fullBody' },
  { name: 'Kettlebell Press',               abbr: 'PR',  primary: 'shoulders' },
  { name: 'Kettlebell High Pull',           abbr: 'HP',  primary: 'back',      secondary: 'shoulders' },
  { name: 'Kettlebell Sumo Squat',          abbr: 'SS',  primary: 'legs' },
  { name: 'Kettlebell Front Squat',         abbr: 'FS',  primary: 'legs' },
  { name: 'Kettlebell Farmer Walk',         abbr: 'FW',  primary: 'core',      secondary: 'back' },
  { name: 'Kettlebell Renegade Row',        abbr: 'RR',  primary: 'back',      secondary: 'core' },
  { name: 'Kettlebell Around the World',    abbr: 'AW',  primary: 'core',      secondary: 'shoulders' },
  { name: 'Kettlebell Single-Leg Deadlift', abbr: 'SD',  primary: 'legs',      secondary: 'back' },
  { name: 'Kettlebell Floor Press',         abbr: 'FP',  primary: 'chest' },
  { name: 'Kettlebell Crush Curl',          abbr: 'CC',  primary: 'arms' },
  { name: 'Kettlebell Bent Press',          abbr: 'BP',  primary: 'shoulders', secondary: 'core' },
  { name: 'Kettlebell Overhead Carry',      abbr: 'OC',  primary: 'shoulders', secondary: 'core' },
  { name: 'Kettlebell Bob & Weave',         abbr: 'BW',  primary: 'legs',      secondary: 'core' },
  { name: 'Kettlebell Side Lunge',          abbr: 'SL',  primary: 'legs' },
  { name: 'Kettlebell Push Press',          abbr: 'PP',  primary: 'shoulders', secondary: 'legs' },

  // -- Bodyweight exercises --
  { name: 'Plank',                          abbr: 'PL',  primary: 'core' },
  { name: 'Side Plank',                     abbr: 'SP',  primary: 'core' },
  { name: 'Push-Up',                        abbr: 'PU',  primary: 'chest',     secondary: 'arms' },
  { name: 'Wide Push-Up',                   abbr: 'WP',  primary: 'chest' },
  { name: 'Diamond Push-Up',               abbr: 'DP',  primary: 'arms',      secondary: 'chest' },
  { name: 'Pull-Up',                        abbr: 'PUL', primary: 'back',      secondary: 'arms' },
  { name: 'Chin-Up',                        abbr: 'CU',  primary: 'arms',      secondary: 'back' },
  { name: 'Dip',                            abbr: 'DI',  primary: 'chest',     secondary: 'arms' },
  { name: 'Sit-Up',                         abbr: 'SIT', primary: 'core' },
  { name: 'Crunch',                         abbr: 'CR',  primary: 'core' },
  { name: 'Leg Raise',                      abbr: 'LR',  primary: 'core' },
  { name: 'Glute Bridge',                   abbr: 'GB',  primary: 'legs',      secondary: 'core' },
  { name: 'Squat',                          abbr: 'SQ',  primary: 'legs' },
  { name: 'Lunge',                          abbr: 'LN',  primary: 'legs' },
  { name: 'Burpee',                         abbr: 'BRP', primary: 'cardio',    secondary: 'fullBody' },
  { name: 'Mountain Climber',               abbr: 'MC',  primary: 'cardio',    secondary: 'core' },
  { name: 'Jump Squat',                     abbr: 'JQ',  primary: 'cardio',    secondary: 'legs' },
  { name: 'Jumping Jack',                   abbr: 'JJ',  primary: 'cardio' },
  { name: 'High Knees',                     abbr: 'HK',  primary: 'cardio',    secondary: 'legs' },
  { name: 'Box Jump',                       abbr: 'BJ',  primary: 'cardio',    secondary: 'legs' },
  { name: 'Bear Crawl',                     abbr: 'BC',  primary: 'fullBody' },
  { name: 'Superman',                       abbr: 'SM',  primary: 'back',      secondary: 'core' },
];

const exerciseMap = new Map(EXERCISE_LIBRARY.map((e) => [e.name, e]));

export function getExerciseDef(name: string): ExerciseDefinition | undefined {
  return exerciseMap.get(name);
}

export function getExercisesByMuscle(muscle: MuscleGroup): ExerciseDefinition[] {
  return EXERCISE_LIBRARY.filter((e) => e.primary === muscle || e.secondary === muscle);
}

