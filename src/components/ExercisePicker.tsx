import { useState, useMemo } from 'react';
import { EXERCISE_LIBRARY, EQUIPMENT_MAP, getShortName } from '../exercises';
import { MUSCLE_COLORS, MUSCLE_LABELS, MUSCLE_ORDER } from '../types';
import type { MuscleGroup } from '../types';
import styles from './ExercisePicker.module.css';

interface Props {
  value: string;
  onSelect: (name: string) => void;
  onClose: () => void;
}

type EquipmentFilter = 'all' | 'kettlebell' | 'bodyweight';

export function ExercisePicker({ value, onSelect, onClose }: Props) {
  const [equipment, setEquipment] = useState<EquipmentFilter>('all');
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | null>(null);

  const filtered = useMemo(() => {
    return EXERCISE_LIBRARY.filter((ex) => {
      if (equipment !== 'all' && EQUIPMENT_MAP.get(ex.name) !== equipment) return false;
      if (muscleFilter && ex.primary !== muscleFilter && ex.secondary !== muscleFilter) return false;
      return true;
    });
  }, [equipment, muscleFilter]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Select Exercise</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Equipment filter */}
        <div className={styles.filterRow}>
          {(['all', 'kettlebell', 'bodyweight'] as const).map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn}${equipment === f ? ` ${styles.filterBtnActive}` : ''}`}
              onClick={() => setEquipment(f)}
            >
              {f === 'all' ? '🏋️ All' : f === 'kettlebell' ? '🔔 Kettlebell' : '🤸 Bodyweight'}
            </button>
          ))}
        </div>

        {/* Muscle group filter */}
        <div className={styles.muscleRow}>
          <button
            className={`${styles.muscleBtn}${muscleFilter === null ? ` ${styles.muscleBtnActive}` : ''}`}
            onClick={() => setMuscleFilter(null)}
          >
            All
          </button>
          {MUSCLE_ORDER.map((m) => (
            <button
              key={m}
              className={`${styles.muscleBtn}${muscleFilter === m ? ` ${styles.muscleBtnActive}` : ''}`}
              onClick={() => setMuscleFilter(muscleFilter === m ? null : m)}
            >
              <span className={styles.muscleDot} style={{ background: MUSCLE_COLORS[m] }} />
              {MUSCLE_LABELS[m]}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        <div className={styles.list}>
          <button
            className={`${styles.item}${value === '' ? ` ${styles.itemSelected}` : ''}`}
            onClick={() => { onSelect(''); onClose(); }}
          >
            <span className={styles.itemName}>— Empty —</span>
          </button>
          {filtered.map((ex) => (
            <button
              key={ex.name}
              className={`${styles.item}${value === ex.name ? ` ${styles.itemSelected}` : ''}`}
              onClick={() => { onSelect(ex.name); onClose(); }}
            >
              <span className={styles.itemDots}>
                <span className={styles.dot} style={{ background: MUSCLE_COLORS[ex.primary] }} />
                {ex.secondary && (
                  <span className={styles.dot} style={{ background: MUSCLE_COLORS[ex.secondary] }} />
                )}
              </span>
              <span className={styles.itemName}>{ex.name}</span>
              <span className={styles.itemAbbr}>{getShortName(ex.name)}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className={styles.empty}>No exercises match filters</div>
          )}
        </div>
      </div>
    </div>
  );
}
