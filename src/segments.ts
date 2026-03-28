import type { Workout, Segment } from './types';

export function buildSegments(workout: Workout): Segment[] {
  const segments: Segment[] = [];

  // Initial countdown (get ready)
  segments.push({
    type: 'initialCountdown',
    label: 'Get Ready',
    duration: workout.defaultExerciseRest,
    setIndex: 0,
    exerciseIndex: 0,
  });

  for (let s = 0; s < workout.setsCount; s++) {
    const row = workout.grid[s] ?? [];
    const exerciseCount = row.length || workout.exercisesPerSet;
    for (let e = 0; e < exerciseCount; e++) {
      const slot = row[e];
      const name = slot?.exerciseName || `Exercise ${e + 1}`;
      segments.push({
        type: 'exercise',
        label: name,
        duration: slot?.duration ?? workout.defaultExerciseDuration,
        setIndex: s,
        exerciseIndex: e,
      });
      if (e < exerciseCount - 1) {
        segments.push({
          type: 'exerciseRest',
          label: 'Rest',
          duration: slot?.restAfter ?? workout.defaultExerciseRest,
          setIndex: s,
          exerciseIndex: e,
        });
      }
    }
    if (s < workout.setsCount - 1) {
      segments.push({
        type: 'setRest',
        label: 'Set Rest',
        duration: workout.defaultSetRest,
        setIndex: s,
        exerciseIndex: exerciseCount - 1,
      });
    }
  }
  return segments;
}
