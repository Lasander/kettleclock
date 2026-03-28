import type { Workout } from '../types';
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
  return (
    <div className={styles.container}>
      <div className={styles.trophy}>🏆</div>
      <h1 className={styles.heading}>Workout Complete!</h1>
      <div className={styles.stats}>
        <div>
          <strong>{formatDuration(elapsed)}</strong> total time
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
