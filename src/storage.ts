import type { Workout } from './types';

const STORAGE_KEY = 'kettleclock_workouts';
const STORAGE_VERSION = 1;

interface StoredWorkouts {
  version: number;
  workouts: Workout[];
}

export function loadWorkouts(): Workout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (data && data.version === STORAGE_VERSION && Array.isArray(data.workouts)) {
      return data.workouts;
    }
    // Old or incompatible format — discard
    localStorage.removeItem(STORAGE_KEY);
    return [];
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function saveWorkout(workout: Workout): void {
  const workouts = loadWorkouts();
  const idx = workouts.findIndex((w) => w.id === workout.id);
  if (idx >= 0) {
    workouts[idx] = workout;
  } else {
    workouts.push(workout);
  }
  const data: StoredWorkouts = { version: STORAGE_VERSION, workouts };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function deleteWorkout(id: string): void {
  const workouts = loadWorkouts().filter((w) => w.id !== id);
  const data: StoredWorkouts = { version: STORAGE_VERSION, workouts };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
