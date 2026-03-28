export type MuscleGroup = 'legs' | 'back' | 'shoulders' | 'core' | 'fullBody';

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

export type Screen = 'builder' | 'timer' | 'summary';

export const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  legs: '#2ecc71',
  back: '#3498db',
  shoulders: '#f39c12',
  core: '#e67e22',
  fullBody: '#e74c3c',
};

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  legs: 'Legs',
  back: 'Back',
  shoulders: 'Shoulders',
  core: 'Core',
  fullBody: 'Full Body',
};
