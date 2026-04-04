import { describe, it, expect, beforeEach } from 'vitest';
import { loadWorkouts, saveWorkout, deleteWorkout } from '../storage';
import type { Workout } from '../types';

function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 'w-1',
    name: 'Test Workout',
    setsCount: 3,
    exercisesPerSet: 2,
    defaultExerciseDuration: 30,
    defaultExerciseRest: 15,
    defaultSetRest: 60,
    grid: [],
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadWorkouts', () => {
    it('returns empty array when localStorage is empty', () => {
      expect(loadWorkouts()).toEqual([]);
    });

    it('returns empty array when localStorage contains invalid JSON', () => {
      localStorage.setItem('kettleclock_workouts', '{broken');
      expect(loadWorkouts()).toEqual([]);
    });

    it('returns stored workouts', () => {
      const w = makeWorkout();
      localStorage.setItem('kettleclock_workouts', JSON.stringify({ version: 1, workouts: [w] }));
      const loaded = loadWorkouts();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe('w-1');
    });

    it('discards old format (plain array) and returns empty', () => {
      const w = makeWorkout();
      localStorage.setItem('kettleclock_workouts', JSON.stringify([w]));
      expect(loadWorkouts()).toEqual([]);
      // localStorage should also be cleaned up
      expect(localStorage.getItem('kettleclock_workouts')).toBeNull();
    });
  });

  describe('saveWorkout', () => {
    it('creates a new workout entry', () => {
      const w = makeWorkout();
      saveWorkout(w);
      const loaded = loadWorkouts();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('Test Workout');
    });

    it('updates an existing workout by id', () => {
      saveWorkout(makeWorkout());
      saveWorkout(makeWorkout({ name: 'Updated' }));
      const loaded = loadWorkouts();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe('Updated');
    });

    it('appends a workout with a different id', () => {
      saveWorkout(makeWorkout({ id: 'w-1' }));
      saveWorkout(makeWorkout({ id: 'w-2', name: 'Second' }));
      const loaded = loadWorkouts();
      expect(loaded).toHaveLength(2);
    });
  });

  describe('deleteWorkout', () => {
    it('removes a workout by id', () => {
      saveWorkout(makeWorkout({ id: 'w-1' }));
      saveWorkout(makeWorkout({ id: 'w-2' }));
      deleteWorkout('w-1');
      const loaded = loadWorkouts();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe('w-2');
    });

    it('does nothing when id is not found', () => {
      saveWorkout(makeWorkout({ id: 'w-1' }));
      deleteWorkout('nonexistent');
      expect(loadWorkouts()).toHaveLength(1);
    });
  });
});
