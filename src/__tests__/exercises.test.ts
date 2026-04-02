import { describe, it, expect, afterEach } from 'vitest';
import {
  getExerciseLibrary,
  getEnabledExercises,
  getExerciseDef,
  getExercisesByMuscle,
  saveExercise,
  updateExercise,
  deleteExercise,
  toggleExerciseEnabled,
  isNameTaken,
  getShortName,
} from '../exercises';
import type { ExerciseDefinition } from '../types';

// The exercises module maintains a mutable singleton seeded from DEFAULT_EXERCISES
// on first import. We test against that live state.

describe('exercises', () => {
  describe('getExerciseLibrary', () => {
    it('returns a non-empty array of exercises', () => {
      const lib = getExerciseLibrary();
      expect(lib.length).toBeGreaterThan(0);
    });

    it('all exercises have required fields', () => {
      for (const ex of getExerciseLibrary()) {
        expect(ex.name).toBeTruthy();
        expect(ex.primary).toBeTruthy();
        expect(typeof ex.builtin).toBe('boolean');
        expect(typeof ex.enabled).toBe('boolean');
        expect(['kettlebell', 'bodyweight']).toContain(ex.equipment);
      }
    });
  });

  describe('getEnabledExercises', () => {
    it('returns only enabled exercises', () => {
      const enabled = getEnabledExercises();
      expect(enabled.length).toBeGreaterThan(0);
      for (const ex of enabled) {
        expect(ex.enabled).toBe(true);
      }
    });

    it('returns a subset of the full library', () => {
      expect(getEnabledExercises().length).toBeLessThanOrEqual(getExerciseLibrary().length);
    });
  });

  describe('getExerciseDef', () => {
    it('returns a known exercise by name', () => {
      const ex = getExerciseDef('Kettlebell Swing');
      expect(ex).toBeDefined();
      expect(ex!.primary).toBe('back');
    });

    it('returns undefined for unknown name', () => {
      expect(getExerciseDef('Nonexistent Exercise')).toBeUndefined();
    });
  });

  describe('getExercisesByMuscle', () => {
    it('returns exercises matching primary muscle group', () => {
      const legs = getExercisesByMuscle('legs');
      expect(legs.length).toBeGreaterThan(0);
      for (const ex of legs) {
        expect(ex.primary === 'legs' || ex.secondary === 'legs').toBe(true);
      }
    });

    it('returns exercises matching secondary muscle group', () => {
      // Kettlebell Swing has secondary: 'legs'
      const legs = getExercisesByMuscle('legs');
      const swing = legs.find((e) => e.name === 'Kettlebell Swing');
      expect(swing).toBeDefined();
      expect(swing!.secondary).toBe('legs');
    });

    it('returns empty array for unused muscle group if all disabled', () => {
      // Just verify it returns an array (muscle group exists in exercises)
      const result = getExercisesByMuscle('cardio');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('saveExercise / updateExercise / deleteExercise', () => {
    const customName = '__test_custom_exercise__';

    // Clean up after tests that add custom exercises
    afterEach(() => {
      deleteExercise(customName);
      deleteExercise(customName + '_renamed');
    });

    it('saves a new custom exercise and retrieves it', () => {
      const ex: ExerciseDefinition = {
        name: customName,
        primary: 'core',
        equipment: 'bodyweight',
        builtin: false,
        enabled: true,
      };
      saveExercise(ex);
      const found = getExerciseDef(customName);
      expect(found).toBeDefined();
    });

    it('updates an existing exercise by old name', () => {
      const ex: ExerciseDefinition = {
        name: customName,
        primary: 'core',
        equipment: 'bodyweight',
        builtin: false,
        enabled: true,
      };
      saveExercise(ex);

      const renamed: ExerciseDefinition = { ...ex, name: customName + '_renamed' };
      updateExercise(customName, renamed);
      expect(getExerciseDef(customName)).toBeUndefined();
      expect(getExerciseDef(customName + '_renamed')).toBeDefined();
    });

    it('deletes a custom exercise', () => {
      const ex: ExerciseDefinition = {
        name: customName,
        primary: 'core',
        equipment: 'bodyweight',
        builtin: false,
        enabled: true,
      };
      saveExercise(ex);
      const deleted = deleteExercise(customName);
      expect(deleted).toBe(true);
      expect(getExerciseDef(customName)).toBeUndefined();
    });

    it('refuses to delete a built-in exercise', () => {
      const deleted = deleteExercise('Kettlebell Swing');
      expect(deleted).toBe(false);
      expect(getExerciseDef('Kettlebell Swing')).toBeDefined();
    });

    it('returns false when deleting nonexistent exercise', () => {
      expect(deleteExercise('No Such Exercise')).toBe(false);
    });
  });

  describe('toggleExerciseEnabled', () => {
    it('toggles enabled state', () => {
      const before = getExerciseDef('Kettlebell Swing')!.enabled;
      toggleExerciseEnabled('Kettlebell Swing');
      expect(getExerciseDef('Kettlebell Swing')!.enabled).toBe(!before);
      // Toggle back to restore
      toggleExerciseEnabled('Kettlebell Swing');
      expect(getExerciseDef('Kettlebell Swing')!.enabled).toBe(before);
    });

    it('does nothing for unknown name', () => {
      // Should not throw
      toggleExerciseEnabled('No Such Exercise');
    });
  });

  describe('isNameTaken', () => {
    it('returns true for an existing name', () => {
      expect(isNameTaken('Kettlebell Swing')).toBe(true);
    });

    it('is case-insensitive', () => {
      expect(isNameTaken('kettlebell swing')).toBe(true);
    });

    it('returns false for a new name', () => {
      expect(isNameTaken('Totally New Exercise')).toBe(false);
    });

    it('excludes a given name from the check', () => {
      expect(isNameTaken('Kettlebell Swing', 'Kettlebell Swing')).toBe(false);
    });
  });

  describe('getShortName', () => {
    it('strips "Kettlebell " prefix', () => {
      expect(getShortName('Kettlebell Swing')).toBe('Swing');
    });

    it('returns short names unchanged', () => {
      expect(getShortName('Plank')).toBe('Plank');
    });

    it('truncates long single-word names to 10 chars', () => {
      expect(getShortName('Superlongexercisename').length).toBeLessThanOrEqual(10);
    });

    it('shortens multi-word names that exceed 10 chars', () => {
      const result = getShortName('Some Really Long Exercise Name');
      expect(result.length).toBeLessThanOrEqual(10);
    });
  });
});
