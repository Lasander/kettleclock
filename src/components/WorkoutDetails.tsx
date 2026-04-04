import { useState, useMemo } from 'react';
import type { Workout } from '../types';
import { getDisplayName } from '../exercises';
import { ExerciseCell } from './ExerciseCell';
import { NumberControl } from './NumberControl';
import styles from './WorkoutDetails.module.css';

interface WorkoutDetailsProps {
  workout: Workout;
  onOverride: (setIdx: number, exIdx: number, field: 'duration' | 'restAfter', value: number | undefined) => void;
  onClose: () => void;
}

export function WorkoutDetails({ workout, onOverride, onClose }: WorkoutDetailsProps) {
  const [editing, setEditing] = useState<{ setIdx: number; exIdx: number } | null>(null);

  const { setDupes, workoutDupes } = useMemo(() => {
    const setDupes = new Map<string, Set<string>>();
    const workoutCounts: Record<string, number> = {};
    for (let s = 0; s < workout.grid.length; s++) {
      const counts: Record<string, number> = {};
      for (const slot of workout.grid[s]) {
        if (slot.exerciseName) {
          counts[slot.exerciseName] = (counts[slot.exerciseName] || 0) + 1;
          workoutCounts[slot.exerciseName] = (workoutCounts[slot.exerciseName] || 0) + 1;
        }
      }
      setDupes.set(String(s), new Set(Object.entries(counts).filter(([, c]) => c > 1).map(([n]) => n)));
    }
    return { setDupes, workoutDupes: new Set(Object.entries(workoutCounts).filter(([, c]) => c > 1).map(([n]) => n)) };
  }, [workout.grid]);

  if (editing !== null) {
    const slot = workout.grid[editing.setIdx][editing.exIdx];
    const isDefaultDuration = slot.duration === undefined;
    const isDefaultRest = slot.restAfter === undefined;
    const effectiveDuration = slot.duration ?? workout.defaultExerciseDuration;
    const effectiveRest = slot.restAfter ?? workout.defaultExerciseRest;
    const slotLabel = `S${editing.setIdx + 1} E${editing.exIdx + 1}: ${slot.exerciseName ? getDisplayName(slot.exerciseName) : '(empty)'}`;

    return (
      <div className={styles.overlay}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => setEditing(null)}>← Back</button>
          <span className={styles.headerSlotLabel}>{slotLabel}</span>
          <div style={{ width: 36 }} />
        </div>
        <div className={styles.editContent}>
          <div className={styles.editGroup}>
            <div className={styles.editGroupHeader}>
              <span className={styles.editGroupLabel}>Exercise Time</span>
              <button
                className={`${styles.defaultBtn}${isDefaultDuration ? ` ${styles.defaultBtnActive}` : ''}`}
                onClick={() => {
                  if (!isDefaultDuration) {
                    onOverride(editing.setIdx, editing.exIdx, 'duration', undefined);
                  }
                }}
              >
                Default
              </button>
            </div>
            <div className={styles.editControlWrapper}>
              <NumberControl
                label="Exercise"
                value={effectiveDuration}
                min={1}
                max={999}
                suffix="s"
                muted={isDefaultDuration}
                onChange={(v) => onOverride(editing.setIdx, editing.exIdx, 'duration', v)}
              />
            </div>
          </div>
          <div className={styles.editGroup}>
            <div className={styles.editGroupHeader}>
              <span className={styles.editGroupLabel}>Rest After</span>
              <button
                className={`${styles.defaultBtn}${isDefaultRest ? ` ${styles.defaultBtnActive}` : ''}`}
                onClick={() => {
                  if (!isDefaultRest) {
                    onOverride(editing.setIdx, editing.exIdx, 'restAfter', undefined);
                  }
                }}
              >
                Default
              </button>
            </div>
            <div className={styles.editControlWrapper}>
              <NumberControl
                label="Rest"
                value={effectiveRest}
                min={0}
                max={999}
                suffix="s"
                muted={isDefaultRest}
                onChange={(v) => onOverride(editing.setIdx, editing.exIdx, 'restAfter', v)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onClose}>← Back</button>
        <span className={styles.headerTitle}>Workout Details</span>
        <div style={{ width: 60 }} />
      </div>
      <div className={styles.list}>
        {workout.grid.map((row, s) => (
          <div key={s}>
            <div className={styles.setDivider}>Set {s + 1}</div>
            {row.map((slot, e) => {
              const effectiveDuration = slot.duration ?? workout.defaultExerciseDuration;
              const effectiveRest = slot.restAfter ?? workout.defaultExerciseRest;
              return (
                <div key={slot.id} className={styles.row} onClick={() => setEditing({ setIdx: s, exIdx: e })}>
                  <ExerciseCell
                    exerciseName={slot.exerciseName}
                    duplicateType={slot.exerciseName ? (setDupes.get(String(s))?.has(slot.exerciseName) ? 'set' : workoutDupes.has(slot.exerciseName) ? 'workout' : undefined) : undefined}
                    setIdx={s}
                    exIdx={e}
                    size="small"
                  />
                  <span className={styles.rowName}>
                    {slot.exerciseName ? getDisplayName(slot.exerciseName) : '(empty)'}
                  </span>
                  <div className={styles.rowTimes}>
                    <span className={`${styles.rowTime}${slot.duration === undefined ? ` ${styles.rowTimeMuted}` : ''}`}>
                      {effectiveDuration}<span className={styles.rowTimeLabel}>s</span>
                    </span>
                    <span className={`${styles.rowTime}${slot.restAfter === undefined ? ` ${styles.rowTimeMuted}` : ''}`}>
                      {effectiveRest}<span className={styles.rowTimeLabel}>s rest</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
