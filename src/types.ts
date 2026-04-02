export type MuscleGroup = 'legs' | 'core' | 'cardio' | 'fullBody' | 'arms' | 'chest' | 'shoulders' | 'back';

export type Equipment = 'kettlebell' | 'bodyweight';

export interface ExerciseDefinition {
  name: string;
  primary: MuscleGroup;
  secondary?: MuscleGroup;
  equipment: Equipment;
  builtin: boolean;
  enabled: boolean;
}

export interface ExerciseSlot {
  id: string;
  exerciseName: string; // '' = empty/unassigned
  duration?: number;
  restAfter?: number;
}

export interface Workout {
  id: string;
  name: string;
  setsCount: number;
  exercisesPerSet: number;
  defaultExerciseDuration: number;
  defaultExerciseRest: number;
  defaultSetRest: number;
  grid: ExerciseSlot[][]; // grid[setIndex][exerciseIndex]
  createdAt: number;
  updatedAt: number;
}

export type SegmentType = 'initialCountdown' | 'exercise' | 'exerciseRest' | 'setRest';

export interface Segment {
  type: SegmentType;
  label: string;
  duration: number;
  setIndex: number;
  exerciseIndex: number;
}

export type Screen = 'setup' | 'exerciseLibrary' | 'workout' | 'summary';

// Spectral order — adjacent groups share adjacent hues on the colour wheel
export const MUSCLE_ORDER: MuscleGroup[] = [
  'legs', 'core', 'cardio', 'fullBody', 'arms', 'chest', 'shoulders', 'back',
];

export const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  legs:      '#2dd4a0', // emerald green
  core:      '#a3e635', // lime
  cardio:    '#fbbf24', // amber
  fullBody:  '#f97316', // orange
  arms:      '#f43f5e', // crimson rose
  chest:     '#d946ef', // fuchsia
  shoulders: '#6366f1', // indigo
  back:      '#38bdf8', // sky blue
};

/** Medium-brightness variants for grid cell backgrounds (readable white text, clear hue) */
export const MUSCLE_COLORS_MUTED: Record<MuscleGroup, string> = {
  legs:      '#1a7a52', // forest green
  core:      '#507714', // olive
  cardio:    '#856d13', // dark gold
  fullBody:  '#984018', // burnt sienna
  arms:      '#8f2a3e', // deep cranberry
  chest:     '#7f2d90', // purple
  shoulders: '#3a3e94', // indigo
  back:      '#1d5f87', // ocean
};

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  legs:      'Leg',
  core:      'Core',
  cardio:    'Cardio',
  fullBody:  'Full',
  arms:      'Arm',
  chest:     'Chest',
  shoulders: 'Shoulder',
  back:      'Back',
};
