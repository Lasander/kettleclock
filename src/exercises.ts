import type { ExerciseDefinition, MuscleGroup } from './types';

export const EXERCISE_LIBRARY: ExerciseDefinition[] = [
  { name: 'Kettlebell Swing',              abbr: 'SW',  primary: 'back',      secondary: 'legs' },
  { name: 'Goblet Squat',                  abbr: 'GS',  primary: 'legs' },
  { name: 'Turkish Get-Up',                abbr: 'TGU', primary: 'fullBody' },
  { name: 'Clean & Press',                 abbr: 'C&P', primary: 'fullBody' },
  { name: 'Snatch',                        abbr: 'SN',  primary: 'fullBody' },
  { name: 'Kettlebell Row',                abbr: 'RW',  primary: 'back' },
  { name: 'Kettlebell Deadlift',           abbr: 'DL',  primary: 'back',      secondary: 'legs' },
  { name: 'Kettlebell Halo',               abbr: 'HL',  primary: 'shoulders', secondary: 'core' },
  { name: 'Figure 8',                      abbr: 'F8',  primary: 'core',      secondary: 'legs' },
  { name: 'Kettlebell Windmill',           abbr: 'WM',  primary: 'core',      secondary: 'shoulders' },
  { name: 'Kettlebell Thruster',           abbr: 'TH',  primary: 'fullBody' },
  { name: 'Kettlebell Lunge',              abbr: 'LU',  primary: 'legs' },
  { name: 'Kettlebell Clean',              abbr: 'CL',  primary: 'fullBody' },
  { name: 'Kettlebell Press',              abbr: 'PR',  primary: 'shoulders' },
  { name: 'Kettlebell High Pull',          abbr: 'HP',  primary: 'back',      secondary: 'shoulders' },
  { name: 'Kettlebell Sumo Squat',         abbr: 'SS',  primary: 'legs' },
  { name: 'Kettlebell Front Squat',        abbr: 'FS',  primary: 'legs' },
  { name: 'Kettlebell Farmer Walk',        abbr: 'FW',  primary: 'core',      secondary: 'back' },
  { name: 'Kettlebell Renegade Row',       abbr: 'RR',  primary: 'back',      secondary: 'core' },
  { name: 'Kettlebell Around the World',   abbr: 'AW',  primary: 'core',      secondary: 'shoulders' },
  { name: 'Kettlebell Single-Leg Deadlift',abbr: 'SD',  primary: 'legs',      secondary: 'back' },
  { name: 'Kettlebell Floor Press',        abbr: 'FP',  primary: 'shoulders' },
  { name: 'Kettlebell Crush Curl',         abbr: 'CC',  primary: 'shoulders' },
  { name: 'Kettlebell Bent Press',         abbr: 'BP',  primary: 'shoulders', secondary: 'core' },
  { name: 'Kettlebell Overhead Carry',     abbr: 'OC',  primary: 'shoulders', secondary: 'core' },
  { name: 'Kettlebell Bob & Weave',        abbr: 'BW',  primary: 'legs',      secondary: 'core' },
  { name: 'Kettlebell Side Lunge',         abbr: 'SL',  primary: 'legs' },
  { name: 'Kettlebell Push Press',         abbr: 'PP',  primary: 'shoulders', secondary: 'legs' },
];

const exerciseMap = new Map(EXERCISE_LIBRARY.map((e) => [e.name, e]));

export function getExerciseDef(name: string): ExerciseDefinition | undefined {
  return exerciseMap.get(name);
}

export function getExercisesByMuscle(muscle: MuscleGroup): ExerciseDefinition[] {
  return EXERCISE_LIBRARY.filter((e) => e.primary === muscle || e.secondary === muscle);
}

