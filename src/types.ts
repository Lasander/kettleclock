export type MuscleGroup = 'legs' | 'core' | 'cardio' | 'fullBody' | 'arms' | 'chest' | 'shoulders' | 'back';

export interface ExerciseDefinition {
  name: string;
  abbr: string;
  primary: MuscleGroup;
  secondary?: MuscleGroup;
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

export type Screen = 'setup' | 'workout' | 'summary';

// Spectral order — adjacent groups share adjacent hues on the colour wheel
export const MUSCLE_ORDER: MuscleGroup[] = [
  'legs', 'core', 'cardio', 'fullBody', 'arms', 'chest', 'shoulders', 'back',
];

export const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  legs:      '#34d399', // green
  core:      '#c4f000', // lime
  cardio:    '#ffd43b', // amber
  fullBody:  '#ff8a65', // orange
  arms:      '#ff7eb3', // pink
  chest:     '#e879f9', // magenta
  shoulders: '#a78bfa', // violet
  back:      '#60b5ff', // blue
};

/** Muted/darker variants for grid cell backgrounds (better white text contrast) */
export const MUSCLE_COLORS_MUTED: Record<MuscleGroup, string> = {
  legs:      '#1a7a52',
  core:      '#6a8500',
  cardio:    '#8a7000',
  fullBody:  '#8a4a2a',
  arms:      '#8a3a5a',
  chest:     '#7a3a8a',
  shoulders: '#5a4580',
  back:      '#2a5a8a',
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
