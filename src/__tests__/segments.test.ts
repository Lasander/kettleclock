import { describe, it, expect } from 'vitest';
import { buildSegments } from '../segments';
import type { Workout, ExerciseSlot } from '../types';

function makeSlot(name: string, overrides: Partial<ExerciseSlot> = {}): ExerciseSlot {
  return { id: `s-${name}`, exerciseName: name, ...overrides };
}

function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 'w-test',
    name: 'Test',
    setsCount: 2,
    exercisesPerSet: 2,
    defaultExerciseDuration: 30,
    defaultExerciseRest: 15,
    defaultSetRest: 60,
    grid: [
      [makeSlot('Swing'), makeSlot('Squat')],
      [makeSlot('Press'), makeSlot('Row')],
    ],
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

describe('buildSegments', () => {
  it('starts with an initialCountdown segment', () => {
    const segs = buildSegments(makeWorkout());
    expect(segs[0].type).toBe('initialCountdown');
  });

  it('initial countdown uses defaultExerciseRest as duration', () => {
    const segs = buildSegments(makeWorkout({ defaultExerciseRest: 20 }));
    expect(segs[0].duration).toBe(20);
  });

  it('produces correct number of segments for 2 sets × 2 exercises', () => {
    // Expected: 1 countdown + (2 exercises + 1 rest) × 2 sets + 1 set rest = 1 + 3 + 3 + 1 = 8
    // Set 1: exercise, exerciseRest, exercise → 3
    // Set rest → 1
    // Set 2: exercise, exerciseRest, exercise → 3
    // Total: 1 + 3 + 1 + 3 = 8
    const segs = buildSegments(makeWorkout());
    expect(segs).toHaveLength(8);
  });

  it('exercise segments have correct labels from slot names', () => {
    const segs = buildSegments(makeWorkout());
    const exercises = segs.filter((s) => s.type === 'exercise');
    expect(exercises.map((e) => e.label)).toEqual(['Swing', 'Squat', 'Press', 'Row']);
  });

  it('exercise segments use default duration', () => {
    const segs = buildSegments(makeWorkout({ defaultExerciseDuration: 45 }));
    const exercises = segs.filter((s) => s.type === 'exercise');
    for (const ex of exercises) {
      expect(ex.duration).toBe(45);
    }
  });

  it('exercise slot duration override takes precedence', () => {
    const w = makeWorkout();
    w.grid[0][0] = makeSlot('Swing', { duration: 60 });
    const segs = buildSegments(w);
    const first = segs.find((s) => s.type === 'exercise' && s.label === 'Swing')!;
    expect(first.duration).toBe(60);
  });

  it('exercise slot restAfter override takes precedence', () => {
    const w = makeWorkout();
    w.grid[0][0] = makeSlot('Swing', { restAfter: 5 });
    const segs = buildSegments(w);
    const rests = segs.filter((s) => s.type === 'exerciseRest');
    // First rest (after first exercise in set 1) should use override
    expect(rests[0].duration).toBe(5);
  });

  it('exerciseRest segments appear between exercises, not after last', () => {
    const segs = buildSegments(makeWorkout());
    // In each set of 2 exercises, there should be exactly 1 exerciseRest
    const set1Rests = segs.filter((s) => s.type === 'exerciseRest' && s.setIndex === 0);
    const set2Rests = segs.filter((s) => s.type === 'exerciseRest' && s.setIndex === 1);
    expect(set1Rests).toHaveLength(1);
    expect(set2Rests).toHaveLength(1);
  });

  it('setRest appears between sets, not after last set', () => {
    const segs = buildSegments(makeWorkout());
    const setRests = segs.filter((s) => s.type === 'setRest');
    expect(setRests).toHaveLength(1); // 2 sets → 1 set rest
    expect(setRests[0].duration).toBe(60);
  });

  it('no setRest for a single-set workout', () => {
    const w = makeWorkout({
      setsCount: 1,
      grid: [[makeSlot('Swing'), makeSlot('Squat')]],
    });
    const segs = buildSegments(w);
    expect(segs.filter((s) => s.type === 'setRest')).toHaveLength(0);
  });

  it('handles 3 sets × 3 exercises correctly', () => {
    const w = makeWorkout({
      setsCount: 3,
      exercisesPerSet: 3,
      grid: [
        [makeSlot('A'), makeSlot('B'), makeSlot('C')],
        [makeSlot('D'), makeSlot('E'), makeSlot('F')],
        [makeSlot('G'), makeSlot('H'), makeSlot('I')],
      ],
    });
    const segs = buildSegments(w);
    // 1 countdown + 3×(3 exercises + 2 rests) + 2 set rests = 1 + 15 + 2 = 18
    expect(segs).toHaveLength(18);
    expect(segs.filter((s) => s.type === 'exercise')).toHaveLength(9);
    expect(segs.filter((s) => s.type === 'exerciseRest')).toHaveLength(6);
    expect(segs.filter((s) => s.type === 'setRest')).toHaveLength(2);
  });

  it('handles empty exercise names gracefully', () => {
    const w = makeWorkout({
      setsCount: 1,
      exercisesPerSet: 1,
      grid: [[makeSlot('')]],
    });
    const segs = buildSegments(w);
    // Should still produce segments (countdown + 1 exercise)
    expect(segs).toHaveLength(2);
    const ex = segs.find((s) => s.type === 'exercise')!;
    expect(ex.label).toBe('Exercise 1'); // fallback label
  });

  it('setIndex and exerciseIndex are correctly assigned', () => {
    const segs = buildSegments(makeWorkout());
    const exercises = segs.filter((s) => s.type === 'exercise');
    expect(exercises[0]).toMatchObject({ setIndex: 0, exerciseIndex: 0 });
    expect(exercises[1]).toMatchObject({ setIndex: 0, exerciseIndex: 1 });
    expect(exercises[2]).toMatchObject({ setIndex: 1, exerciseIndex: 0 });
    expect(exercises[3]).toMatchObject({ setIndex: 1, exerciseIndex: 1 });
  });
});
