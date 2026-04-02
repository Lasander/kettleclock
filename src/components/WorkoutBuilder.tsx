import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Workout, ExerciseSlot } from '../types';
import { MUSCLE_COLORS, MUSCLE_LABELS, MUSCLE_ORDER } from '../types';
import { getExerciseDef } from '../exercises';
import { loadWorkouts, saveWorkout, deleteWorkout } from '../storage';
import { generateId } from '../utils';
import { resumeAudio } from '../audio';
import { Logo } from './Logo';
import { ExerciseCell } from './ExerciseCell';
import { ExercisePicker } from './ExercisePicker';
import { NumberControl } from './NumberControl';
import { QuickFill } from './QuickFill';
import styles from './WorkoutBuilder.module.css';

interface Props {
  onStart: (workout: Workout) => void;
  onEditExercises: () => void;
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

function resizeGrid(grid: ExerciseSlot[][], newSets: number, newPerSet: number): ExerciseSlot[][] {
  return Array.from({ length: newSets }, (_, s) => {
    const row = grid[s] ?? [];
    return Array.from({ length: newPerSet }, (_, e) => row[e] ?? makeSlot());
  });
}

function migrateWorkout(w: any): Workout {
  if (w.grid) {
    return { ...w, setsCount: w.setsCount ?? w.sets ?? 5 };
  }
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

export function WorkoutBuilder({ onStart, onEditExercises }: Props) {
  const [workout, setWorkout] = useState<Workout>(newWorkout);
  const [saved, setSaved] = useState<Workout[]>([]);
  const [showOverrides, setShowOverrides] = useState(false);
  const [showSavedPanel, setShowSavedPanel] = useState(false);

  // Set-fill mode: when tapping a cell, fill the set starting from that cell, wrapping around
  const [setFill, setSetFill] = useState<{ setIdx: number; order: number[]; pos: number } | null>(null);

  const startSetFill = useCallback((setIdx: number, exIdx: number, perSet: number) => {
    const order: number[] = [];
    for (let i = 0; i < perSet; i++) order.push((exIdx + i) % perSet);
    setSetFill({ setIdx, order, pos: 0 });
  }, []);

  const handleSetFillSelect = useCallback((name: string) => {
    if (!setFill) return;
    const { setIdx, order, pos } = setFill;
    const exIdx = order[pos];
    setWorkout((w) => {
      const grid = w.grid.map((row) => [...row]);
      grid[setIdx][exIdx] = { ...grid[setIdx][exIdx], exerciseName: name };
      return { ...w, grid, updatedAt: Date.now() };
    });
    const nextPos = pos + 1;
    if (nextPos >= order.length) {
      setSetFill(null); // all slots in set filled
    } else {
      setSetFill({ setIdx, order, pos: nextPos });
    }
  }, [setFill]);

  const setFillRemaining = setFill ? setFill.order.length - setFill.pos : 0;

  // Manual fill mode: fill all empty cells across sets
  const [manualFillSlot, setManualFillSlot] = useState<{ s: number; e: number } | null>(null);

  const findNextEmptySlot = useCallback((grid: ExerciseSlot[][]): { s: number; e: number } | null => {
    for (let s = 0; s < grid.length; s++) {
      for (let e = 0; e < grid[s].length; e++) {
        if (!grid[s][e].exerciseName) return { s, e };
      }
    }
    return null;
  }, []);

  const handleStartManualFill = useCallback(() => {
    setManualFillSlot(findNextEmptySlot(workout.grid));
  }, [workout.grid, findNextEmptySlot]);

  const handleManualFillSelect = useCallback((name: string) => {
    if (!manualFillSlot) return;
    const { s, e } = manualFillSlot;
    setWorkout((w) => {
      const grid = w.grid.map((row) => [...row]);
      grid[s][e] = { ...grid[s][e], exerciseName: name };
      const next = findNextEmptySlot(grid);
      setManualFillSlot(next);
      return { ...w, grid, updatedAt: Date.now() };
    });
  }, [manualFillSlot, findNextEmptySlot]);

  const emptySlotCount = useMemo(() => {
    let count = 0;
    for (const row of workout.grid) for (const slot of row) if (!slot.exerciseName) count++;
    return count;
  }, [workout.grid]);

  // Edit mode (grid reorder)
  const [editMode, setEditMode] = useState(false);
  const dragSourceRef = useRef<{ s: number; e: number } | null>(null);
  const dragTargetRef = useRef<{ s: number; e: number } | null>(null);
  const [dragSource, setDragSource] = useState<{ s: number; e: number } | null>(null);
  const [dragTarget, setDragTarget] = useState<{ s: number; e: number } | null>(null);

  // Measure grid to determine how many cells fit per row
  const gridRef = useRef<HTMLDivElement>(null);
  const [maxPerRow, setMaxPerRow] = useState(4);
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const CELL_W = 64;
    const GAP = 6;
    const INDICATOR_W = 30; // 22px min-width + 8px gap
    const update = () => {
      const avail = el.clientWidth - INDICATOR_W;
      setMaxPerRow(Math.max(1, Math.floor((avail + GAP) / (CELL_W + GAP))));
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setSaved(loadWorkouts());
  }, []);

  const refreshSaved = () => setSaved(loadWorkouts());

  const duplicatesMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
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

  const filledNames = useMemo(() => {
    const names = new Set<string>();
    workout.grid.forEach(row => row.forEach(slot => { if (slot.exerciseName) names.add(slot.exerciseName); }));
    return names;
  }, [workout.grid]);

  const updateWorkout = useCallback((updater: (w: Workout) => Workout) => {
    setWorkout((w) => ({ ...updater(w), updatedAt: Date.now() }));
  }, []);

  const handleSetsChange = useCallback((val: number) => {
    updateWorkout((w) => ({ ...w, setsCount: val, grid: resizeGrid(w.grid, val, w.exercisesPerSet) }));
  }, [updateWorkout]);

  const handleExercisesPerSetChange = useCallback((val: number) => {
    updateWorkout((w) => ({ ...w, exercisesPerSet: val, grid: resizeGrid(w.grid, w.setsCount, val) }));
  }, [updateWorkout]);

  const handleCellOverride = useCallback(
    (setIdx: number, exIdx: number, field: 'duration' | 'restAfter', value: number | undefined) => {
      updateWorkout((w) => {
        const grid = w.grid.map((row) => [...row]);
        grid[setIdx][exIdx] = { ...grid[setIdx][exIdx], [field]: value };
        return { ...w, grid };
      });
    },
    [updateWorkout]
  );

  // ── Edit mode grid drag ──────────────────────────────────────────────
  const swapCells = useCallback((src: { s: number; e: number }, dst: { s: number; e: number }) => {
    updateWorkout((w) => {
      const grid = w.grid.map((row) => [...row]);
      const tmp = grid[src.s][src.e];
      grid[src.s][src.e] = grid[dst.s][dst.e];
      grid[dst.s][dst.e] = tmp;
      return { ...w, grid };
    });
  }, [updateWorkout]);

  const handleGridPointerDown = useCallback((e: React.PointerEvent) => {
    if (!editMode) return;
    const cell = (e.target as Element).closest('[data-cell]') as HTMLElement | null;
    if (!cell) return;
    const pos = { s: Number(cell.dataset.set), e: Number(cell.dataset.ex) };
    dragSourceRef.current = pos;
    dragTargetRef.current = pos;
    setDragSource(pos);
    setDragTarget(pos);
  }, [editMode]);

  const handleGridPointerMove = useCallback((e: React.PointerEvent) => {
    if (!editMode || !dragSourceRef.current) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cell = el?.closest('[data-cell]') as HTMLElement | null;
    if (cell) {
      const pos = { s: Number(cell.dataset.set), e: Number(cell.dataset.ex) };
      dragTargetRef.current = pos;
      setDragTarget(pos);
    }
  }, [editMode]);

  const handleGridPointerUp = useCallback(() => {
    const src = dragSourceRef.current;
    const tgt = dragTargetRef.current;
    if (src && tgt && (src.s !== tgt.s || src.e !== tgt.e)) {
      swapCells(src, tgt);
    }
    dragSourceRef.current = null;
    dragTargetRef.current = null;
    setDragSource(null);
    setDragTarget(null);
  }, [swapCells]);

  const handleQuickFill = useCallback((grid: ExerciseSlot[][]) => {
    updateWorkout((w) => ({ ...w, grid }));
  }, [updateWorkout]);

  const handleSave = () => {
    saveWorkout(workout);
    refreshSaved();
  };

  const handleLoad = (w: Workout) => {
    setWorkout(migrateWorkout(w));
    setShowOverrides(false);
    setEditMode(false);
  };

  const handleDelete = (id: string) => {
    deleteWorkout(id);
    refreshSaved();
  };

  const handleNew = () => {
    setWorkout(newWorkout());
    setShowOverrides(false);
    setEditMode(false);
  };

  const canStart = workout.setsCount > 0 && workout.exercisesPerSet > 0;

  return (
    <div className={styles.container}>
      {/* Header / logo */}
      <div className={styles.header}>
        <Logo size={48} />
        <h1 className={styles.title}>KettleClock</h1>
      </div>

      {/* Saved panel trigger is in the name row below */}

      <div className={styles.nameSection}>
        <div className={styles.nameRow}>
          <input
            className={styles.nameInput}
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            value={workout.name}
            onChange={(e) => updateWorkout((w) => ({ ...w, name: e.target.value }))}
            placeholder="Workout name"
          />
          <button className={styles.savedBtn} onClick={() => setShowSavedPanel(true)}>
            Saved{saved.length > 0 ? ` (${saved.length})` : ''}
          </button>
        </div>
      </div>

      <div className={styles.controlsGroup}>
        <div className={styles.controlsRow}>
          <NumberControl label="Sets" value={workout.setsCount} min={1} max={20} onChange={handleSetsChange} />
          <NumberControl label="Ex / Set" value={workout.exercisesPerSet} min={1} max={12} onChange={handleExercisesPerSetChange} />
        </div>
        <div className={styles.controlsRow}>
          <NumberControl label="Exercise" value={workout.defaultExerciseDuration} min={1} max={999} suffix="s" onChange={(v) => updateWorkout((w) => ({ ...w, defaultExerciseDuration: v }))} />
          <NumberControl label="Rest" value={workout.defaultExerciseRest} min={0} max={999} suffix="s" onChange={(v) => updateWorkout((w) => ({ ...w, defaultExerciseRest: v }))} />
          <NumberControl label="Set Rest" value={workout.defaultSetRest} min={0} max={999} suffix="s" onChange={(v) => updateWorkout((w) => ({ ...w, defaultSetRest: v }))} />
        </div>
      </div>

      <div className={styles.gridSection}>
        <div className={styles.gridHeader}>
          <span className={styles.gridLabel}>Exercise Grid</span>
          <QuickFill setsCount={workout.setsCount} exercisesPerSet={workout.exercisesPerSet} grid={workout.grid} onFill={handleQuickFill} onFillManual={handleStartManualFill} />
        </div>

        <div className={styles.legend}>
          {MUSCLE_ORDER.map((m) => (
            <span key={m} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: MUSCLE_COLORS[m] }} />
              {MUSCLE_LABELS[m]}
            </span>
          ))}
        </div>

        <div
          ref={gridRef}
          className={styles.grid}
          onPointerDown={handleGridPointerDown}
          onPointerMove={handleGridPointerMove}
          onPointerUp={handleGridPointerUp}
          onPointerLeave={handleGridPointerUp}
        >
          {workout.grid.map((row, s) => {
            const dupes = duplicatesMap.get(String(s));
            // Balanced row splitting: determine rows needed, then distribute evenly
            const numRows = Math.ceil(row.length / maxPerRow);
            const base = Math.floor(row.length / numRows);
            const extra = row.length % numRows;
            const subRows: typeof row[] = [];
            let offset = 0;
            for (let r = 0; r < numRows; r++) {
              const count = base + (r < extra ? 1 : 0);
              subRows.push(row.slice(offset, offset + count));
              offset += count;
            }
            let cellOffset = 0;
            return (
              <div key={s} className={styles.setGroup}>
                <div className={styles.setIndicator}>
                  <span className={styles.setLabel}>{s + 1}</span>
                </div>
                <div className={styles.setContent}>
                  {subRows.map((subRow, ri) => {
                    const startIdx = cellOffset;
                    cellOffset += subRow.length;
                    return (
                      <div key={ri} className={styles.setCells}>
                        {subRow.map((slot, localE) => {
                          const e = startIdx + localE;
                          return (
                            <ExerciseCell
                              key={slot.id}
                              exerciseName={slot.exerciseName}
                              isDuplicate={!!(slot.exerciseName && dupes?.has(slot.exerciseName))}
                              setIdx={s}
                              exIdx={e}
                              onTap={() => startSetFill(s, e, workout.exercisesPerSet)}
                              editMode={editMode}
                              isSource={!!(dragSource && dragSource.s === s && dragSource.e === e)}
                              isTarget={!!(dragTarget && dragTarget.s === s && dragTarget.e === e && dragSource && (dragSource.s !== s || dragSource.e !== e))}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.toolbar}>
        <button
          className={`${styles.toggleBtn}${editMode ? ` ${styles.toggleBtnActive}` : ''}`}
          onClick={() => setEditMode((m) => !m)}
        >
          {editMode ? '✓ Done Reordering' : '↕ Reorder'}
        </button>
        <button className={styles.toggleBtn} onClick={() => setShowOverrides((s) => !s)}>
          {showOverrides ? 'Hide overrides ▴' : 'Per-exercise timing ▾'}
        </button>
        <button className={styles.toggleBtn} onClick={onEditExercises}>
          📋 Exercises
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
        <button className={styles.saveBtn} onClick={handleSave}>Save</button>
        <button className={styles.saveBtn} onClick={handleNew}>New</button>
        <button
          className={styles.startBtn}
          onClick={() => { resumeAudio(); onStart(workout); }}
          disabled={!canStart}
        >
          Start Workout
        </button>
      </div>

      {setFill !== null && (
        <ExercisePicker
          value={workout.grid[setFill.setIdx]?.[setFill.order[setFill.pos]]?.exerciseName ?? ''}
          title={`Exercises for set ${setFill.setIdx + 1} — ${setFillRemaining} remaining`}
          filledNames={filledNames}
          inSetNames={new Set(workout.grid[setFill.setIdx].map((s) => s.exerciseName).filter(Boolean) as string[])}
          keepOpen
          onSelect={handleSetFillSelect}
          onClose={() => setSetFill(null)}
        />
      )}

      {manualFillSlot !== null && setFill === null && (
        <ExercisePicker
          value=""
          title={`Exercises for workout — ${emptySlotCount} remaining`}
          filledNames={filledNames}
          keepOpen
          onSelect={handleManualFillSelect}
          onClose={() => setManualFillSlot(null)}
        />
      )}

      {showSavedPanel && (
        <div className={styles.savedOverlay} onClick={() => setShowSavedPanel(false)}>
          <div className={styles.savedPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.savedPanelHeader}>
              <span className={styles.savedPanelTitle}>Saved Workouts</span>
              <button className={styles.savedPanelClose} onClick={() => setShowSavedPanel(false)}>✕</button>
            </div>
            {saved.length === 0 ? (
              <div className={styles.savedEmpty}>No saved workouts yet</div>
            ) : (
              saved.map((w) => (
                <div key={w.id} className={styles.savedItem}>
                  <span onClick={() => { handleLoad(w); setShowSavedPanel(false); }}>{w.name || 'Untitled'}</span>
                  <div className={styles.savedActions}>
                    <button onClick={() => { handleLoad(w); setShowSavedPanel(false); }}>Load</button>
                    <button onClick={() => handleDelete(w.id)} style={{ color: 'var(--color-danger)' }}>✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
