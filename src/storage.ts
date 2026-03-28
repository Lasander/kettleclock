import type { Workout } from './types';

const STORAGE_KEY = 'kettleclock_workouts';

export function loadWorkouts(): Workout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

export function deleteWorkout(id: string): void {
  const workouts = loadWorkouts().filter((w) => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}
