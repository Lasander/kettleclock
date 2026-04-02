import { useState, useMemo, useEffect, useRef } from 'react';
import { EXERCISE_LIBRARY, EQUIPMENT_MAP, getShortName } from '../exercises';
import { MUSCLE_COLORS, MUSCLE_LABELS, MUSCLE_ORDER } from '../types';
import type { MuscleGroup } from '../types';
import styles from './ExercisePicker.module.css';

interface Props {
  value: string;
  onSelect: (name: string) => void;
  onClose: () => void;
  title?: string;
  filledNames?: Set<string>;
}

type Equipment = 'kettlebell' | 'bodyweight';

export function ExercisePicker({ value, onSelect, onClose, title = 'Select Exercise', filledNames }: Props) {
  const [equipmentFilter, setEquipmentFilter] = useState<Set<Equipment>>(new Set());
  const [muscleFilter, setMuscleFilter] = useState<Set<MuscleGroup>>(new Set());
  const overlayRef = useRef<HTMLDivElement>(null);

  // Block body scrolling while picker is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Prevent touch events on overlay from reaching behind
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const block = (e: TouchEvent) => {
      // Allow scrolling inside .list, block everything else from leaking
      const target = e.target as HTMLElement;
      if (!target.closest('[data-picker-list]')) {
        e.preventDefault();
      }
    };
    el.addEventListener('touchmove', block, { passive: false });
    return () => el.removeEventListener('touchmove', block);
  }, []);

  const toggleEquipment = (eq: Equipment) => {
    setEquipmentFilter((prev) => {
      const next = new Set(prev);
      if (next.has(eq)) next.delete(eq);
      else next.add(eq);
      return next;
    });
  };

  const toggleMuscle = (m: MuscleGroup) => {
    setMuscleFilter((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return EXERCISE_LIBRARY.filter((ex) => {
      if (equipmentFilter.size > 0 && !equipmentFilter.has(EQUIPMENT_MAP.get(ex.name)!)) return false;
      if (muscleFilter.size > 0 && !muscleFilter.has(ex.primary) && !(ex.secondary && muscleFilter.has(ex.secondary))) return false;
      return true;
    });
  }, [equipmentFilter, muscleFilter]);

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Equipment filter */}
        <div className={styles.filterRow}>
          <button
            className={`${styles.filterBtn}${equipmentFilter.size === 0 ? ` ${styles.filterBtnActive}` : ''}`}
            onClick={() => setEquipmentFilter(new Set())}
          >
            All
          </button>
          <button
            className={`${styles.filterBtn}${equipmentFilter.has('kettlebell') ? ` ${styles.filterBtnActive}` : ''}`}
            onClick={() => toggleEquipment('kettlebell')}
          >
            🔔 Kettlebell
          </button>
          <button
            className={`${styles.filterBtn}${equipmentFilter.has('bodyweight') ? ` ${styles.filterBtnActive}` : ''}`}
            onClick={() => toggleEquipment('bodyweight')}
          >
            🤸 Bodyweight
          </button>
        </div>

        {/* Muscle group filter */}
        <div className={styles.muscleRow}>
          <button
            className={`${styles.muscleBtn}${muscleFilter.size === 0 ? ` ${styles.muscleBtnActive}` : ''}`}
            onClick={() => setMuscleFilter(new Set())}
          >
            All
          </button>
          {MUSCLE_ORDER.map((m) => (
            <button
              key={m}
              className={`${styles.muscleBtn}${muscleFilter.has(m) ? ` ${styles.muscleBtnSelected}` : ''}`}
              style={{ background: MUSCLE_COLORS[m] + '30', color: MUSCLE_COLORS[m], borderColor: muscleFilter.has(m) ? MUSCLE_COLORS[m] : 'transparent' }}
              onClick={() => toggleMuscle(m)}
            >
              {MUSCLE_LABELS[m]}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        <div className={styles.list} data-picker-list>
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
              {filledNames?.has(ex.name) && <span className={styles.filledDot} />}
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
