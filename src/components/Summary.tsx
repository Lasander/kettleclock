import { useMemo } from 'react';
import type { Workout } from '../types';
import { buildSegments } from '../segments';
import styles from './Summary.module.css';

interface Props {
  workout: Workout;
  elapsed: number; // seconds
  onAgain: () => void;
  onBack: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function Summary({ workout, elapsed, onAgain, onBack }: Props) {
  const { exerciseTime, restTime } = useMemo(() => {
    const segs = buildSegments(workout);
    let exercise = 0;
    let rest = 0;
    for (const seg of segs) {
      if (seg.type === 'exercise') {
        exercise += seg.duration;
      } else {
        rest += seg.duration;
      }
    }
    return { exerciseTime: exercise, restTime: rest };
  }, [workout]);

  return (
    <div className={styles.container}>
      <div className={styles.trophy}>🏆</div>
      <h1 className={styles.heading}>Workout Complete!</h1>
      <div className={styles.stats}>
        <div>
          <strong>{formatDuration(elapsed)}</strong> total time
        </div>
        <div>
          <strong>{formatDuration(exerciseTime)}</strong> exercise &middot;{' '}
          <strong>{formatDuration(restTime)}</strong> rest
        </div>
        <div>
          <strong>{workout.setsCount}</strong> sets &times; <strong>{workout.exercisesPerSet}</strong>{' '}
          exercises
        </div>
        {workout.name && <div>{workout.name}</div>}
      </div>
      <div className={styles.actions}>
        <button className={styles.againBtn} onClick={onAgain}>
          Run Again
        </button>
        <button className={styles.backBtn} onClick={onBack}>
          Back to Builder
        </button>
      </div>
    </div>
  );
}
