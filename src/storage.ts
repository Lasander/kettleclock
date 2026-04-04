import type { Workout } from './types';
import { NAME_MIGRATION } from './exercises';

const STORAGE_KEY = 'kettleclock_workouts';

export function loadWorkouts(): Workout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const workouts: Workout[] = JSON.parse(raw);
    let changed = false;
    for (const w of workouts) {
      if (!w.grid) continue;
      for (const row of w.grid) {
        for (const slot of row) {
          const newName = NAME_MIGRATION[slot.exerciseName];
          if (newName) {
            slot.exerciseName = newName;
            changed = true;
          }
        }
      }
    }
    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
    }
    return workouts;
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
