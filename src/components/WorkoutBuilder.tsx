import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Workout, ExerciseSlot } from '../types';
import { MUSCLE_COLORS, MUSCLE_LABELS, MUSCLE_ORDER } from '../types';
import { loadWorkouts, saveWorkout, deleteWorkout } from '../storage';
import { buildSegments } from '../segments';
import { generateId } from '../utils';
import { resumeAudio } from '../audio';
import { Logo } from './Logo';
import { ExerciseCell } from './ExerciseCell';
import { NumberControl } from './NumberControl';
import { SlotEditor } from './SlotEditor';
import { WorkoutDetails } from './WorkoutDetails';
import styles from './WorkoutBuilder.module.css';

interface Props {
  onStart: (workout: Workout) => void;
  onEditExercises: () => void;
  initialWorkout?: Workout;
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

/** Does the grid contain any assigned exercises? */
function gridHasExercises(grid: ExerciseSlot[][]): boolean {
  return grid.some((row) => row.some((s) => !!s.exerciseName));
}

function formatTotalTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

export function WorkoutBuilder({ onStart, onEditExercises, initialWorkout }: Props) {
  const [workout, setWorkout] = useState<Workout>(() => initialWorkout ?? newWorkout());
  const [saved, setSaved] = useState<Workout[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [showSavedPanel, setShowSavedPanel] = useState(false);

  // Track the last-saved version to detect unsaved changes
  const [lastSavedId, setLastSavedId] = useState<string | null>(() => initialWorkout?.id ?? null);
  const [lastSavedUpdatedAt, setLastSavedUpdatedAt] = useState<number | null>(() => initialWorkout?.updatedAt ?? null);

  // Hamburger menu
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // New workout flow
  const [newFlowStep, setNewFlowStep] = useState<'unsaved' | 'choose' | 'name' | null>(null);
  const [newWorkoutName, setNewWorkoutName] = useState('');

  // SlotEditor state
  const [slotEditor, setSlotEditor] = useState<{ setIdx: number; exIdx: number } | null>(null);

  // Edit mode (grid reorder)
  const [editMode, setEditMode] = useState(false);
  const dragSourceRef = useRef<{ s: number; e: number } | null>(null);
  const dragTargetRef = useRef<{ s: number; e: number } | null>(null);
  const [dragSource, setDragSource] = useState<{ s: number; e: number } | null>(null);
  const [dragTarget, setDragTarget] = useState<{ s: number; e: number } | null>(null);
  const [undoSnapshot, setUndoSnapshot] = useState<ExerciseSlot[][] | null>(null);

  // Long-press to enter edit mode
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStartPos = useRef<{ x: number; y: number } | null>(null);
  const LONG_PRESS_MS = 500;
  const LONG_PRESS_MOVE_TOLERANCE = 10;

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

  // Close hamburger menu on outside click/tap
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [menuOpen]);

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

  // Detect whether current workout has unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!gridHasExercises(workout.grid)) return false;
    if (lastSavedId === null) return true; // never saved
    return workout.updatedAt !== lastSavedUpdatedAt;
  }, [workout.grid, workout.updatedAt, lastSavedId, lastSavedUpdatedAt]);

  // ── Auto-save: save on every meaningful edit ─────────────────────────
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doAutoSave = useCallback(() => {
    setWorkout((w) => {
      // Determine name for auto-save
      let name = w.name;
      if (!name) {
        name = 'Untitled';
      }
      // If this workout was loaded from a saved one, append * if name doesn't already have it
      if (lastSavedId && w.id === lastSavedId && !name.endsWith('*')) {
        name = name + '*';
      }
      const toSave = { ...w, name };
      saveWorkout(toSave);
      setLastSavedId(toSave.id);
      setLastSavedUpdatedAt(toSave.updatedAt);
      return name !== w.name ? toSave : w;
    });
    refreshSaved();
  }, [lastSavedId]);

  // Trigger auto-save when grid changes (debounced)
  const prevGridRef = useRef(workout.grid);
  useEffect(() => {
    if (workout.grid === prevGridRef.current) return;
    prevGridRef.current = workout.grid;
    if (!gridHasExercises(workout.grid)) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(doAutoSave, 800);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [workout.grid, doAutoSave]);

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
  const saveUndo = useCallback(() => {
    setUndoSnapshot(workout.grid.map(row => row.map(slot => ({ ...slot }))));
  }, [workout.grid]);

  const clearCell = useCallback((s: number, e: number) => {
    saveUndo();
    updateWorkout((w) => {
      const grid = w.grid.map((row) => [...row]);
      grid[s][e] = { ...grid[s][e], exerciseName: '', duration: undefined, restAfter: undefined };
      return { ...w, grid };
    });
  }, [saveUndo, updateWorkout]);

  const handleUndo = useCallback(() => {
    if (!undoSnapshot) return;
    updateWorkout((w) => ({ ...w, grid: undoSnapshot }));
    setUndoSnapshot(null);
  }, [undoSnapshot, updateWorkout]);

  const swapCells = useCallback((src: { s: number; e: number }, dst: { s: number; e: number }) => {
    saveUndo();
    updateWorkout((w) => {
      const grid = w.grid.map((row) => [...row]);
      const tmp = grid[src.s][src.e];
      grid[src.s][src.e] = grid[dst.s][dst.e];
      grid[dst.s][dst.e] = tmp;
      return { ...w, grid };
    });
  }, [saveUndo, updateWorkout]);

  const handleGridPointerDown = useCallback((e: React.PointerEvent) => {
    // Skip if tapping clear button
    if ((e.target as Element).closest('[data-clear]')) return;

    const cell = (e.target as Element).closest('[data-cell]') as HTMLElement | null;
    if (!cell) return;

    if (editMode) {
      const pos = { s: Number(cell.dataset.set), e: Number(cell.dataset.ex) };
      dragSourceRef.current = pos;
      dragTargetRef.current = pos;
      setDragSource(pos);
      setDragTarget(pos);
    } else {
      // Long-press to enter edit mode
      longPressStartPos.current = { x: e.clientX, y: e.clientY };
      longPressTimerRef.current = setTimeout(() => {
        setEditMode(true);
        longPressTimerRef.current = null;
      }, LONG_PRESS_MS);
    }
  }, [editMode]);

  const handleGridPointerMove = useCallback((e: React.PointerEvent) => {
    if (!editMode) {
      if (longPressTimerRef.current && longPressStartPos.current) {
        const dx = e.clientX - longPressStartPos.current.x;
        const dy = e.clientY - longPressStartPos.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > LONG_PRESS_MOVE_TOLERANCE) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
      return;
    }
    if (!dragSourceRef.current) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cell = el?.closest('[data-cell]') as HTMLElement | null;
    if (cell) {
      const pos = { s: Number(cell.dataset.set), e: Number(cell.dataset.ex) };
      dragTargetRef.current = pos;
      setDragTarget(pos);
    }
  }, [editMode]);

  const handleGridPointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
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

  const handleSlotUpdate = useCallback((setIdx: number, exIdx: number, exerciseName: string) => {
    updateWorkout((w) => {
      const grid = w.grid.map((row) => [...row]);
      grid[setIdx][exIdx] = { ...grid[setIdx][exIdx], exerciseName };
      return { ...w, grid };
    });
  }, [updateWorkout]);

  const handleSave = () => {
    const toSave = { ...workout, updatedAt: Date.now() };
    // Strip trailing * from auto-save names
    if (toSave.name.endsWith('*')) {
      toSave.name = toSave.name.slice(0, -1);
    }
    saveWorkout(toSave);
    setWorkout(toSave);
    setLastSavedId(toSave.id);
    setLastSavedUpdatedAt(toSave.updatedAt);
    refreshSaved();
    setMenuOpen(false);
  };

  const handleLoad = (w: Workout) => {
    const loaded = migrateWorkout(w);
    setWorkout(loaded);
    setLastSavedId(loaded.id);
    setLastSavedUpdatedAt(loaded.updatedAt);
    setShowDetails(false);
    setEditMode(false);
    setUndoSnapshot(null);
  };

  const handleDelete = (id: string) => {
    deleteWorkout(id);
    refreshSaved();
  };

  // ── New workout flow ─────────────────────────────────────────────────
  const initiateNew = () => {
    setMenuOpen(false);
    if (hasUnsavedChanges) {
      setNewFlowStep('unsaved');
    } else {
      setNewFlowStep('choose');
    }
  };

  const proceedToChoose = () => {
    setNewFlowStep('choose');
  };

  const createEmpty = () => {
    setNewFlowStep('name');
    setNewWorkoutName('');
  };

  const confirmNewEmpty = () => {
    const w = newWorkout();
    w.name = newWorkoutName.trim() || '';
    setWorkout(w);
    setLastSavedId(null);
    setLastSavedUpdatedAt(null);
    setShowDetails(false);
    setEditMode(false);
    setUndoSnapshot(null);
    setNewFlowStep(null);
  };

  const duplicateFromSaved = (w: Workout) => {
    const dup = migrateWorkout(w);
    dup.id = generateId();
    dup.name = (dup.name || 'Untitled') + ' (copy)';
    dup.createdAt = Date.now();
    dup.updatedAt = Date.now();
    setWorkout(dup);
    setLastSavedId(null);
    setLastSavedUpdatedAt(null);
    setShowDetails(false);
    setEditMode(false);
    setUndoSnapshot(null);
    setNewFlowStep(null);
  };

  const canStart = workout.setsCount > 0 && workout.exercisesPerSet > 0;

  const totalTime = useMemo(() => {
    const segs = buildSegments(workout);
    return segs.reduce((sum, s) => sum + s.duration, 0);
  }, [workout]);

  const renderGridContent = () => (
    <>
      {workout.grid.map((row, s) => {
        const dupes = duplicatesMap.get(String(s));
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
                          onTap={() => setSlotEditor({ setIdx: s, exIdx: e })}
                          onClear={editMode ? () => clearCell(s, e) : undefined}
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
    </>
  );

  return (
    <div className={styles.container}>
      {/* Header with logo + hamburger */}
      <div className={styles.header}>
        <Logo size={48} />
        <h1 className={styles.title}>KettleClock</h1>
        <div className={styles.menuWrapper} ref={menuRef}>
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            <span className={styles.hamburgerBar} />
            <span className={styles.hamburgerBar} />
            <span className={styles.hamburgerBar} />
          </button>
          {menuOpen && (
            <div className={styles.menu}>
              <button className={styles.menuItem} onClick={handleSave}>
                💾 Save
              </button>
              <button className={styles.menuItem} onClick={initiateNew}>
                ✨ New Workout
              </button>
              <button className={styles.menuItem} onClick={() => { setShowSavedPanel(true); setMenuOpen(false); }}>
                📂 Saved Workouts{saved.length > 0 ? ` (${saved.length})` : ''}
              </button>
              <div className={styles.menuSep} />
              <button className={styles.menuItem} onClick={() => { setShowDetails(true); setMenuOpen(false); }}>
                ⏱ Workout Details
              </button>
              <button className={styles.menuItem} onClick={() => { onEditExercises(); setMenuOpen(false); }}>
                📋 Exercise Library
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Workout name */}
      <div className={styles.nameSection}>
        <input
          className={styles.nameInput}
          type="text"
          name="workout-name-xkcd"
          autoComplete="one-time-code"
          autoCorrect="off"
          autoCapitalize="sentences"
          spellCheck={false}
          enterKeyHint="done"
          value={workout.name}
          onChange={(e) => updateWorkout((w) => ({ ...w, name: e.target.value }))}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          placeholder="Workout name"
        />
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
          <div className={styles.gridActions}>
            <button
              className={styles.reorderBtn}
              onClick={() => setEditMode(true)}
            >
              ↕ Swap/Clear
            </button>
          </div>
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
          {renderGridContent()}
        </div>
      </div>

      {/* Start button — always visible at bottom */}
      <div className={styles.actions}>
        <button
          className={styles.startBtn}
          onClick={() => { resumeAudio(); onStart(workout); }}
          disabled={!canStart}
        >
          Start Workout · {formatTotalTime(totalTime)}
        </button>
      </div>

      {/* Edit mode full-screen overlay */}
      {editMode && (
        <div className={styles.editOverlay}>
          <div className={styles.editOverlayHeader}>
            <span className={styles.editOverlayTitle}>Swap / Clear</span>
            <div className={styles.editOverlayActions}>
              {undoSnapshot && (
                <button className={styles.undoBtn} onClick={handleUndo}>
                  ↩ Undo
                </button>
              )}
              <button
                className={`${styles.reorderBtn} ${styles.reorderBtnActive}`}
                onClick={() => { setEditMode(false); setUndoSnapshot(null); }}
              >
                ✓ Done
              </button>
            </div>
          </div>

          <div className={styles.legend} style={{ flexShrink: 0 }}>
            {MUSCLE_ORDER.map((m) => (
              <span key={m} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: MUSCLE_COLORS[m] }} />
                {MUSCLE_LABELS[m]}
              </span>
            ))}
          </div>

          <div
            className={styles.editOverlayGrid}
            onPointerDown={handleGridPointerDown}
            onPointerMove={handleGridPointerMove}
            onPointerUp={handleGridPointerUp}
            onPointerLeave={handleGridPointerUp}
          >
            <div className={styles.grid}>
              {renderGridContent()}
            </div>
          </div>
        </div>
      )}

      {/* Slot editor */}
      {slotEditor && (
        <SlotEditor
          grid={workout.grid}
          initialSetIdx={slotEditor.setIdx}
          initialExIdx={slotEditor.exIdx}
          onUpdateSlot={handleSlotUpdate}
          onClose={() => setSlotEditor(null)}
        />
      )}

      {/* Workout details overlay */}
      {showDetails && (
        <WorkoutDetails
          workout={workout}
          onOverride={handleCellOverride}
          onClose={() => setShowDetails(false)}
        />
      )}

      {/* Saved workouts panel */}
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

      {/* ── New workout flow dialogs ──────────────────────────────────── */}

      {/* Step 1: unsaved changes warning */}
      {newFlowStep === 'unsaved' && (
        <div className={styles.dialogOverlay} onClick={() => setNewFlowStep(null)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <p className={styles.dialogTitle}>Unsaved Changes</p>
            <p className={styles.dialogBody}>Your current workout has unsaved changes. Continue?</p>
            <div className={styles.dialogBtns}>
              <button className={styles.dialogCancel} onClick={() => setNewFlowStep(null)}>Cancel</button>
              <button className={styles.dialogConfirm} onClick={proceedToChoose}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: choose empty or duplicate */}
      {newFlowStep === 'choose' && (
        <div className={styles.dialogOverlay} onClick={() => setNewFlowStep(null)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <p className={styles.dialogTitle}>New Workout</p>
            <div className={styles.dialogChoices}>
              <button className={styles.dialogChoiceBtn} onClick={createEmpty}>
                🆕 Empty Workout
              </button>
              {saved.length > 0 && (
                <>
                  <div className={styles.dialogChoiceDivider}>or duplicate</div>
                  <div className={styles.dialogChoiceList}>
                    {saved.map((w) => (
                      <button
                        key={w.id}
                        className={styles.dialogChoiceItem}
                        onClick={() => duplicateFromSaved(w)}
                      >
                        {w.name || 'Untitled'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className={styles.dialogBtns}>
              <button className={styles.dialogCancel} onClick={() => setNewFlowStep(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: name prompt for empty workout */}
      {newFlowStep === 'name' && (
        <div className={styles.dialogOverlay} onClick={() => setNewFlowStep(null)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <p className={styles.dialogTitle}>Workout Name</p>
            <input
              className={styles.dialogInput}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={newWorkoutName}
              onChange={(e) => setNewWorkoutName(e.target.value)}
              placeholder="e.g. Morning Kettlebell"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') confirmNewEmpty(); }}
            />
            <div className={styles.dialogBtns}>
              <button className={styles.dialogCancel} onClick={() => setNewFlowStep('choose')}>Back</button>
              <button className={styles.dialogConfirm} onClick={confirmNewEmpty}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
