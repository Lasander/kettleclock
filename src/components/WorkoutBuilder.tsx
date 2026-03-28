import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Workout, ExerciseSlot } from '../types';
import { MUSCLE_COLORS, MUSCLE_LABELS } from '../types';
import type { MuscleGroup } from '../types';
import { getExerciseDef } from '../exercises';
import { loadWorkouts, saveWorkout, deleteWorkout } from '../storage';
import { generateId } from '../utils';
import { ExerciseCell } from './ExerciseCell';
import { NumberControl } from './NumberControl';
import { QuickFill } from './QuickFill';
import styles from './WorkoutBuilder.module.css';

interface Props {
  onStart: (workout: Workout) => void;
}

function makeSlot(name = ''): ExerciseSlot {
  return { id: generateId(), exerciseName: name };
}

function makeGrid(sets: number, perSet: number): ExerciseSlot[][] {
  return Array.from({ length: sets }, () =>
    Array.from({ length: perSet }, () => makeSlot())
  );
}

function newWorkout(): Workout {
  return {
    id: generateId(),
    name: '',
    setsCount: 5,
    exercisesPerSet: 4,
    defaultExerciseDuration: 30,
    defaultExerciseRest: 15,
    defaultSetRest: 60,
    grid: makeGrid(5, 4),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/** Resize a grid preserving existing slots where possible. */
function resizeGrid(
  grid: ExerciseSlot[][],
  newSets: number,
  newPerSet: number
): ExerciseSlot[][] {
  return Array.from({ length: newSets }, (_, s) => {
    const existingRow = grid[s] ?? [];
    return Array.from({ length: newPerSet }, (_, e) => existingRow[e] ?? makeSlot());
  });
}

/** Migrate old workout format (exercises array) to new grid format. */
function migrateWorkout(w: any): Workout {
  if (w.grid) {
    return {
      ...w,
      setsCount: w.setsCount ?? w.sets ?? 5,
    };
  }
  // Old format: flat exercises array, sets count
  const exercises: any[] = w.exercises ?? [];
  const sets = w.sets ?? w.setsCount ?? 5;
  const perSet = w.exercisesPerSet ?? exercises.length;
  const grid = Array.from({ length: sets }, () =>
    exercises.map((ex: any) => makeSlot(ex.name ?? ''))
  );
  return {
    id: w.id,
    name: w.name ?? '',
    setsCount: sets,
    exercisesPerSet: perSet,
    defaultExerciseDuration: w.defaultExerciseDuration ?? 30,
    defaultExerciseRest: w.defaultExerciseRest ?? 15,
    defaultSetRest: w.defaultSetRest ?? 60,
    grid,
    createdAt: w.createdAt ?? Date.now(),
    updatedAt: w.updatedAt ?? Date.now(),
  };
}

const MUSCLE_KEYS = Object.keys(MUSCLE_COLORS) as MuscleGroup[];

export function WorkoutBuilder({ onStart }: Props) {
  const [workout, setWorkout] = useState<Workout>(newWorkout);
  const [saved, setSaved] = useState<Workout[]>([]);
  const [showOverrides, setShowOverrides] = useState(false);

  // Drag state for reorder within a set row
  const dragRef = useRef<{ setIdx: number; exIdx: number } | null>(null);
  const [dragOver, setDragOver] = useState<{ setIdx: number; exIdx: number } | null>(null);

  useEffect(() => {
    setSaved(loadWorkouts());
  }, []);

  const refreshSaved = () => setSaved(loadWorkouts());

  // Compute duplicates per set row
  const duplicatesMap = useMemo(() => {
    const map = new Map<string, Set<string>>(); // key: "s" -> set of duplicate names
    for (let s = 0; s < workout.grid.length; s++) {
      const counts: Record<string, number> = {};
      for (const slot of workout.grid[s]) {
        if (slot.exerciseName) counts[slot.exerciseName] = (counts[slot.exerciseName] || 0) + 1;
      }
      const dupes = new Set(Object.entries(counts).filter(([, c]) => c > 1).map(([n]) => n));
      map.set(String(s), dupes);
    }
    return map;
  }, [workout.grid]);

  const updateWorkout = useCallback((updater: (w: Workout) => Workout) => {
    setWorkout((w) => ({ ...updater(w), updatedAt: Date.now() }));
  }, []);

  const handleSetsChange = useCallback((val: number) => {
    updateWorkout((w) => ({
      ...w,
      setsCount: val,
      grid: resizeGrid(w.grid, val, w.exercisesPerSet),
    }));
  }, [updateWorkout]);

  const handleExercisesPerSetChange = useCallback((val: number) => {
    updateWorkout((w) => ({
      ...w,
      exercisesPerSet: val,
      grid: resizeGrid(w.grid, w.setsCount, val),
    }));
  }, [updateWorkout]);

  const handleCellChange = useCallback((setIdx: number, exIdx: number, name: string) => {
    updateWorkout((w) => {
      const grid = w.grid.map((row) => [...row]);
      grid[setIdx] = [...grid[setIdx]];
      grid[setIdx][exIdx] = { ...grid[setIdx][exIdx], exerciseName: name };
      return { ...w, grid };
    });
  }, [updateWorkout]);

  const handleCellOverride = useCallback(
    (setIdx: number, exIdx: number, field: 'duration' | 'restAfter', value: number | undefined) => {
      updateWorkout((w) => {
        const grid = w.grid.map((row) => [...row]);
        grid[setIdx] = [...grid[setIdx]];
        grid[setIdx][exIdx] = { ...grid[setIdx][exIdx], [field]: value };
        return { ...w, grid };
      });
    },
    [updateWorkout]
  );

  // Drag-and-drop reorder within a set
  const handleDragStart = (setIdx: number, exIdx: number) => {
    dragRef.current = { setIdx, exIdx };
  };

  const handleDragOver = (setIdx: number, exIdx: number) => {
    setDragOver({ setIdx, exIdx });
  };

  const handleDragEnd = (setIdx: number, exIdx: number) => {
    const src = dragRef.current;
    if (!src || src.setIdx !== setIdx) {
      dragRef.current = null;
      setDragOver(null);
      return;
    }
    if (src.exIdx !== exIdx) {
      updateWorkout((w) => {
        const row = [...w.grid[setIdx]];
        const [moved] = row.splice(src.exIdx, 1);
        row.splice(exIdx, 0, moved);
        const grid = w.grid.map((r, i) => (i === setIdx ? row : r));
        return { ...w, grid };
      });
    }
    dragRef.current = null;
    setDragOver(null);
  };

  const handleQuickFill = useCallback((grid: ExerciseSlot[][]) => {
    updateWorkout((w) => ({ ...w, grid }));
  }, [updateWorkout]);

  const handleSave = () => {
    if (!workout.name.trim()) {
      const name = prompt('Workout name:');
      if (!name) return;
      updateWorkout((w) => ({ ...w, name: name.trim() }));
    }
    saveWorkout(workout);
    refreshSaved();
  };

  const handleLoad = (w: Workout) => {
    setWorkout(migrateWorkout(w));
    setShowOverrides(false);
  };

  const handleDelete = (id: string) => {
    deleteWorkout(id);
    refreshSaved();
  };

  const handleNew = () => {
    setWorkout(newWorkout());
    setShowOverrides(false);
  };

  const canStart = workout.setsCount > 0 && workout.exercisesPerSet > 0;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🔔 KettleClock</h1>

      {saved.length > 0 && (
        <div className={styles.savedList}>
          <div className={styles.savedListLabel}>Saved Workouts</div>
          {saved.map((w) => (
            <div key={w.id} className={styles.savedItem}>
              <span onClick={() => handleLoad(w)}>{w.name || 'Untitled'}</span>
              <div className={styles.savedActions}>
                <button onClick={() => handleLoad(w)}>Load</button>
                <button onClick={() => handleDelete(w.id)} style={{ color: 'var(--color-danger)' }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.nameSection}>
        <input
          className={styles.nameInput}
          type="text"
          value={workout.name}
          onChange={(e) => updateWorkout((w) => ({ ...w, name: e.target.value }))}
          placeholder="Workout name"
        />
      </div>

      <div className={styles.controlsRow}>
        <NumberControl label="Sets" value={workout.setsCount} min={1} max={20} onChange={handleSetsChange} />
        <NumberControl label="Ex / Set" value={workout.exercisesPerSet} min={1} max={12} onChange={handleExercisesPerSetChange} />
        <NumberControl label="Exercise" value={workout.defaultExerciseDuration} min={1} max={300} suffix="s" onChange={(v) => updateWorkout((w) => ({ ...w, defaultExerciseDuration: v }))} />
        <NumberControl label="Rest" value={workout.defaultExerciseRest} min={0} max={300} suffix="s" onChange={(v) => updateWorkout((w) => ({ ...w, defaultExerciseRest: v }))} />
        <NumberControl label="Set Rest" value={workout.defaultSetRest} min={0} max={600} suffix="s" onChange={(v) => updateWorkout((w) => ({ ...w, defaultSetRest: v }))} />
      </div>

      <div className={styles.gridSection}>
        <div className={styles.gridHeader}>
          <span className={styles.gridLabel}>Exercise Grid</span>
          <QuickFill
            setsCount={workout.setsCount}
            exercisesPerSet={workout.exercisesPerSet}
            onFill={handleQuickFill}
          />
        </div>

        <div className={styles.legend}>
          {MUSCLE_KEYS.map((m) => (
            <span key={m} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: MUSCLE_COLORS[m] }} />
              {MUSCLE_LABELS[m]}
            </span>
          ))}
        </div>

        <div className={styles.grid}>
          {workout.grid.map((row, s) => (
            <div key={s} className={styles.setRow}>
              <span className={styles.setLabel}>{s + 1}</span>
              <div className={styles.setCells}>
                {row.map((slot, e) => {
                  const dupes = duplicatesMap.get(String(s));
                  return (
                    <ExerciseCell
                      key={slot.id}
                      exerciseName={slot.exerciseName}
                      isDuplicate={!!(slot.exerciseName && dupes?.has(slot.exerciseName))}
                      onChange={(name) => handleCellChange(s, e, name)}
                      onDragStart={() => handleDragStart(s, e)}
                      onDragOver={() => handleDragOver(s, e)}
                      onDragEnd={() => handleDragEnd(s, e)}
                      isDragging={dragRef.current?.setIdx === s && dragRef.current?.exIdx === e}
                      isDragOver={dragOver?.setIdx === s && dragOver?.exIdx === e}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.toolbar}>
        <button
          className={styles.toggleBtn}
          onClick={() => setShowOverrides((s) => !s)}
        >
          {showOverrides ? 'Hide overrides ▴' : 'Per-exercise timing ▾'}
        </button>
      </div>

      {showOverrides && (
        <div className={styles.overridesSection}>
          <div className={styles.overridesTitle}>Per-Exercise Overrides</div>
          {workout.grid.map((row, s) =>
            row.map((slot, eIdx) => {
              const label = slot.exerciseName
                ? `S${s + 1} E${eIdx + 1}: ${getExerciseDef(slot.exerciseName)?.abbr ?? slot.exerciseName}`
                : `S${s + 1} E${eIdx + 1}: (empty)`;
              return (
                <div key={slot.id} className={styles.overrideRow}>
                  <span className={styles.overrideLabel}>{label}</span>
                  <input
                    className={styles.overrideInput}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    placeholder={String(workout.defaultExerciseDuration)}
                    value={slot.duration ?? ''}
                    onChange={(ev) => {
                      const v = ev.target.value === '' ? undefined : Math.max(1, Number(ev.target.value));
                      handleCellOverride(s, eIdx, 'duration', v);
                    }}
                  />
                  <span className={styles.overrideUnit}>s</span>
                  <input
                    className={styles.overrideInput}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder={String(workout.defaultExerciseRest)}
                    value={slot.restAfter ?? ''}
                    onChange={(ev) => {
                      const v = ev.target.value === '' ? undefined : Math.max(0, Number(ev.target.value));
                      handleCellOverride(s, eIdx, 'restAfter', v);
                    }}
                  />
                  <span className={styles.overrideUnit}>s rest</span>
                </div>
              );
            })
          )}
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.saveBtn} onClick={handleSave}>
          Save
        </button>
        <button className={styles.saveBtn} onClick={handleNew}>
          New
        </button>
        <button className={styles.startBtn} onClick={() => onStart(workout)} disabled={!canStart}>
          Start Workout
        </button>
      </div>
    </div>
  );
}
