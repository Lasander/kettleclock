import { useState, useRef, useEffect } from 'react';
import type { ExerciseSlot } from '../types';
import { MUSCLE_ORDER } from '../types';
import { EXERCISE_LIBRARY, getExercisesByMuscle } from '../exercises';
import { generateId } from '../utils';
import styles from './QuickFill.module.css';

/** Build a shuffled pool for sequential picking: unused exercises first, recycled after. */
function makePool(
  pool: { name: string }[],
  used: Set<string>
): { name: string }[] {
  const unused = pool.filter((ex) => !used.has(ex.name)).sort(() => Math.random() - 0.5);
  const recycled = pool.filter((ex) => used.has(ex.name)).sort(() => Math.random() - 0.5);
  return [...unused, ...recycled];
}

/** Pick next unique-first item from pool in order, tracking used globally. */
function nextPick(pool: { name: string }[], usedGlobal: Set<string>): string {
  for (const ex of pool) {
    if (!usedGlobal.has(ex.name)) {
      usedGlobal.add(ex.name);
      return ex.name;
    }
  }
  // all used — recycle from pool
  return pool[0]?.name ?? '';
}

interface Props {
  setsCount: number;
  exercisesPerSet: number;
  grid: ExerciseSlot[][];
  onFill: (grid: ExerciseSlot[][]) => void;
  onFillManual: () => void;
}

export function QuickFill({ setsCount, exercisesPerSet, grid, onFill, onFillManual }: Props) {
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
    const usedGlobal = new Set(grid.flat().filter((s) => s.exerciseName).map((s) => s.exerciseName));
    const pool = makePool(EXERCISE_LIBRARY, usedGlobal);
    const newGrid = grid.map((row) =>
      row.map((slot) => {
        if (slot.exerciseName) return slot;
        return { ...slot, exerciseName: nextPick(pool, usedGlobal) };
      })
    );
    onFill(newGrid);
    setOpen(false);
  };

  const fillMusclePerSet = () => {
    const usedGlobal = new Set(grid.flat().filter((s) => s.exerciseName).map((s) => s.exerciseName));
    const newGrid = grid.map((row, s) => {
      const muscle = MUSCLE_ORDER[s % MUSCLE_ORDER.length];
      const available = getExercisesByMuscle(muscle);
      const basePool = available.length > 0 ? available : EXERCISE_LIBRARY;
      const pool = makePool(basePool, usedGlobal);
      return row.map((slot) => {
        if (slot.exerciseName) return slot;
        return { ...slot, exerciseName: nextPick(pool, usedGlobal) };
      });
    });
    onFill(newGrid);
    setOpen(false);
  };

  const fillAlternateMuscles = () => {
    const usedGlobal = new Set(grid.flat().filter((s) => s.exerciseName).map((s) => s.exerciseName));
    const newGrid = grid.map((row) =>
      row.map((slot, e) => {
        if (slot.exerciseName) return slot;
        const muscle = MUSCLE_ORDER[e % MUSCLE_ORDER.length];
        const available = getExercisesByMuscle(muscle);
        const basePool = available.length > 0 ? available : EXERCISE_LIBRARY;
        const pool = makePool(basePool, usedGlobal);
        return { ...slot, exerciseName: nextPick(pool, usedGlobal) };
      })
    );
    onFill(newGrid);
    setOpen(false);
  };

  const clearAll = () => {
    onFill(makeEmptyGrid());
    setOpen(false);
  };

  return (
    <div className={styles.wrapper} ref={ref}>
      <button className={styles.trigger} onClick={() => setOpen((o) => !o)}>
        ⚡ Fill Empty
      </button>
      {open && (
        <div className={styles.menu}>
          <button className={styles.menuItem} onClick={() => { setOpen(false); onFillManual(); }}>
            ✏️ Fill manually
          </button>
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

