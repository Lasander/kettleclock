import { useState, useRef, useEffect } from 'react';
import type { ExerciseSlot, MuscleGroup } from '../types';
import { EXERCISE_LIBRARY, getExercisesByMuscle } from '../exercises';
import { generateId } from '../utils';
import styles from './QuickFill.module.css';

const MUSCLE_GROUPS: MuscleGroup[] = ['legs', 'back', 'shoulders', 'core', 'fullBody'];

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

interface Props {
  setsCount: number;
  exercisesPerSet: number;
  onFill: (grid: ExerciseSlot[][]) => void;
}

export function QuickFill({ setsCount, exercisesPerSet, onFill }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const makeSlot = (name: string): ExerciseSlot => ({
    id: generateId(),
    exerciseName: name,
  });

  const makeEmptyGrid = (): ExerciseSlot[][] =>
    Array.from({ length: setsCount }, () =>
      Array.from({ length: exercisesPerSet }, () => makeSlot(''))
    );

  const fillRandom = () => {
    const grid = Array.from({ length: setsCount }, () => {
      const picked = pickRandom(EXERCISE_LIBRARY, exercisesPerSet);
      return picked.map((ex) => makeSlot(ex.name));
    });
    onFill(grid);
    setOpen(false);
  };

  const fillMusclePerSet = () => {
    const grid = Array.from({ length: setsCount }, (_, s) => {
      const muscle = MUSCLE_GROUPS[s % MUSCLE_GROUPS.length];
      const available = getExercisesByMuscle(muscle);
      const picked = pickRandom(available.length >= exercisesPerSet ? available : EXERCISE_LIBRARY, exercisesPerSet);
      return picked.map((ex) => makeSlot(ex.name));
    });
    onFill(grid);
    setOpen(false);
  };

  const fillAlternateMuscles = () => {
    const grid = Array.from({ length: setsCount }, () => {
      return Array.from({ length: exercisesPerSet }, (_, e) => {
        const muscle = MUSCLE_GROUPS[e % MUSCLE_GROUPS.length];
        const available = getExercisesByMuscle(muscle);
        const picked = pickRandom(available.length > 0 ? available : EXERCISE_LIBRARY, 1);
        return makeSlot(picked[0]?.name ?? '');
      });
    });
    onFill(grid);
    setOpen(false);
  };

  const clearAll = () => {
    onFill(makeEmptyGrid());
    setOpen(false);
  };

  return (
    <div className={styles.wrapper} ref={ref}>
      <button className={styles.trigger} onClick={() => setOpen((o) => !o)}>
        ⚡ Quick Fill
      </button>
      {open && (
        <div className={styles.menu}>
          <button className={styles.menuItem} onClick={fillRandom}>
            🎲 Random
          </button>
          <button className={styles.menuItem} onClick={fillMusclePerSet}>
            💪 Muscle group per set
          </button>
          <button className={styles.menuItem} onClick={fillAlternateMuscles}>
            🔄 Alternate muscles in set
          </button>
          <button className={`${styles.menuItem} ${styles.danger}`} onClick={clearAll}>
            🗑 Clear all
          </button>
        </div>
      )}
    </div>
  );
}
