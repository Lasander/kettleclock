import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { ExerciseSlot, MuscleGroup, Equipment } from '../types';
import { MUSCLE_COLORS, MUSCLE_COLORS_MUTED, MUSCLE_LABELS, MUSCLE_ORDER } from '../types';
import { getEnabledExercises, getExerciseDef, getShortName } from '../exercises';
import styles from './SlotEditor.module.css';

interface SlotEditorProps {
  grid: ExerciseSlot[][];
  initialSetIdx: number;
  initialExIdx: number;
  onUpdateSlot: (setIdx: number, exIdx: number, exerciseName: string) => void;
  onClose: () => void;
}

export function SlotEditor({ grid, initialSetIdx, initialExIdx, onUpdateSlot, onClose }: SlotEditorProps) {
  const [overwriteMode, setOverwriteMode] = useState(false);
  const [activeSetIdx, setActiveSetIdx] = useState(initialSetIdx);
  const [activeExIdx, setActiveExIdx] = useState(initialExIdx);
  const [equipmentFilter, setEquipmentFilter] = useState<Set<Equipment>>(new Set());
  const [muscleFilter, setMuscleFilter] = useState<Set<MuscleGroup>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Local mirror of exercise names for immediate strip updates
  const [localNames, setLocalNames] = useState<string[][]>(() =>
    grid.map((row) => row.map((slot) => slot.exerciseName))
  );

  // Sync localNames when grid prop changes from parent
  useEffect(() => {
    setLocalNames(grid.map((row) => row.map((slot) => slot.exerciseName)));
  }, [grid]);

  const enabledExercises = useMemo(() => getEnabledExercises(), []);

  // Flatten grid for linear indexing
  const flatSlots = useMemo(() => {
    const result: { s: number; e: number }[] = [];
    for (let s = 0; s < grid.length; s++) {
      for (let e = 0; e < grid[s].length; e++) {
        result.push({ s, e });
      }
    }
    return result;
  }, [grid]);

  const totalSlots = flatSlots.length;

  const activeFlatIndex = useMemo(() => {
    return flatSlots.findIndex((f) => f.s === activeSetIdx && f.e === activeExIdx);
  }, [flatSlots, activeSetIdx, activeExIdx]);

  // Block body scrolling while open
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
      const target = e.target as HTMLElement;
      if (!target.closest('[data-slot-list]') && !target.closest('[data-slot-strip]')) {
        e.preventDefault();
      }
    };
    el.addEventListener('touchmove', block, { passive: false });
    return () => el.removeEventListener('touchmove', block);
  }, []);

  // Scroll active cell into view
  const scrollToActive = useCallback((flatIdx: number) => {
    requestAnimationFrame(() => {
      const el = stripRef.current?.querySelector(`[data-slot-idx="${flatIdx}"]`) as HTMLElement | null;
      el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  }, []);

  // Scroll on mount
  useEffect(() => {
    scrollToActive(activeFlatIndex);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close menu on outside click
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

  // Computed: names used anywhere in grid, and names used in current set
  const filledNames = useMemo(() => {
    const names = new Set<string>();
    localNames.forEach((row) => row.forEach((name) => { if (name) names.add(name); }));
    return names;
  }, [localNames]);

  const inSetNames = useMemo(() => {
    const names = new Set<string>();
    if (localNames[activeSetIdx]) {
      localNames[activeSetIdx].forEach((name) => { if (name) names.add(name); });
    }
    return names;
  }, [localNames, activeSetIdx]);

  const currentSlotName = localNames[activeSetIdx]?.[activeExIdx] ?? '';

  // Filter logic
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
    return enabledExercises.filter((ex) => {
      if (equipmentFilter.size > 0 && !equipmentFilter.has(ex.equipment) && ex.equipment !== 'either') return false;
      if (muscleFilter.size > 0 && !muscleFilter.has(ex.primary) && !(ex.secondary && muscleFilter.has(ex.secondary))) return false;
      return true;
    });
  }, [enabledExercises, equipmentFilter, muscleFilter]);

  // Handle exercise selection
  const handleSelect = useCallback((name: string) => {
    onUpdateSlot(activeSetIdx, activeExIdx, name);

    // Update local mirror immediately
    setLocalNames((prev) => {
      const next = prev.map((row) => [...row]);
      next[activeSetIdx][activeExIdx] = name;
      return next;
    });

    // Compute next slot
    const currentFlat = activeFlatIndex;
    let nextFlat: number | null = null;

    if (overwriteMode) {
      nextFlat = (currentFlat + 1) % totalSlots;
    } else {
      // fillEmpty: find next empty slot, wrapping around
      // Need to check against updated local names
      setLocalNames((prev) => {
        const updated = prev.map((row) => [...row]);
        updated[activeSetIdx][activeExIdx] = name;

        let found: number | null = null;
        for (let i = 1; i < totalSlots; i++) {
          const idx = (currentFlat + i) % totalSlots;
          const { s, e } = flatSlots[idx];
          if (!updated[s][e]) {
            found = idx;
            break;
          }
        }

        if (found === null) {
          // No more empty slots — stay on current slot
        } else {
          const next = flatSlots[found];
          requestAnimationFrame(() => {
            setActiveSetIdx(next.s);
            setActiveExIdx(next.e);
            scrollToActive(found!);
          });
        }

        return updated;
      });
      return; // early return — state is set inside setLocalNames
    }

    if (nextFlat !== null) {
      const next = flatSlots[nextFlat];
      setActiveSetIdx(next.s);
      setActiveExIdx(next.e);
      scrollToActive(nextFlat);
    }
  }, [activeSetIdx, activeExIdx, activeFlatIndex, flatSlots, totalSlots, overwriteMode, onUpdateSlot, scrollToActive]);

  // Handle tap on slot strip cell
  const handleSlotTap = useCallback((s: number, e: number, flatIdx: number) => {
    setActiveSetIdx(s);
    setActiveExIdx(e);
    scrollToActive(flatIdx);
  }, [scrollToActive]);

  // Clear all slots
  const handleClearAll = useCallback(() => {
    for (let s = 0; s < grid.length; s++) {
      for (let e = 0; e < grid[s].length; e++) {
        onUpdateSlot(s, e, '');
      }
    }
    setLocalNames(grid.map((row) => row.map(() => '')));
  }, [grid, onUpdateSlot]);

  // Get cell style for strip
  const getCellStyle = (name: string): React.CSSProperties => {
    if (!name) return {};
    const def = getExerciseDef(name);
    if (!def) return { background: '#555' };
    return { background: MUSCLE_COLORS_MUTED[def.primary] };
  };

  // Build set groups for the strip
  const setGroups = useMemo(() => {
    let flatIdx = 0;
    return grid.map((row, s) => {
      const cells = row.map((_, e) => {
        const idx = flatIdx++;
        return { s, e, flatIdx: idx };
      });
      return { s, cells };
    });
  }, [grid]);

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.title}>Select Exercise</span>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.menuWrapper} ref={menuRef}>
              <button className={styles.menuBtn} onClick={() => setMenuOpen(o => !o)} aria-label="Options">
                ⋯
              </button>
              {menuOpen && (
                <div className={styles.pickerMenu}>
                  <label className={styles.pickerMenuItem}>
                    <input
                      type="checkbox"
                      checked={overwriteMode}
                      onChange={(e) => setOverwriteMode(e.target.checked)}
                    />
                    <span>Overwrite filled</span>
                  </label>
                  <div className={styles.pickerMenuSep} />
                  <div className={styles.pickerMenuLabel}>Equipment</div>
                  <div className={styles.pickerMenuFilters}>
                    <button
                      className={`${styles.filterBtn}${equipmentFilter.size === 0 ? ` ${styles.filterBtnActive}` : ''}`}
                      onClick={() => setEquipmentFilter(new Set())}
                    >All</button>
                    <button
                      className={`${styles.filterBtn}${equipmentFilter.has('kettlebell') ? ` ${styles.filterBtnActive}` : ''}`}
                      onClick={() => toggleEquipment('kettlebell')}
                    >🔔 Kettlebell</button>
                    <button
                      className={`${styles.filterBtn}${equipmentFilter.has('bodyweight') ? ` ${styles.filterBtnActive}` : ''}`}
                      onClick={() => toggleEquipment('bodyweight')}
                    >🤸 Bodyweight</button>
                  </div>
                  <div className={styles.pickerMenuSep} />
                  <button className={styles.pickerMenuDanger} onClick={() => { handleClearAll(); setMenuOpen(false); }}>
                    Clear All
                  </button>
                </div>
              )}
            </div>
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Slot strip */}
        <div className={styles.stripContainer} data-slot-strip>
          <div className={styles.stripInner} ref={stripRef}>
            {setGroups.map((group, gi) => (
              <div key={group.s} style={{ display: 'contents' }}>
                {gi > 0 && <div className={styles.setDivider} />}
                <div className={styles.setGroup}>
                  <div className={styles.setLabel}>S{group.s + 1}</div>
                  <div className={styles.setCells}>
                    {group.cells.map(({ s, e, flatIdx: fi }) => {
                      const name = localNames[s]?.[e] ?? '';
                      const isActive = s === activeSetIdx && e === activeExIdx;
                      const cellClass = [
                        styles.slotCell,
                        isActive && styles.slotCellActive,
                        !name && styles.slotCellEmpty,
                      ].filter(Boolean).join(' ');
                      return (
                        <div
                          key={fi}
                          className={cellClass}
                          style={getCellStyle(name)}
                          data-slot-idx={fi}
                          onClick={() => handleSlotTap(s, e, fi)}
                        >
                          {name ? getShortName(name) : '+'}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
        <div className={styles.list} data-slot-list>
          <button
            className={`${styles.item}${currentSlotName === '' ? ` ${styles.itemSelected}` : ''}`}
            onClick={() => handleSelect('')}
          >
            <span className={styles.itemName}>— Empty —</span>
          </button>
          {filtered.map((ex) => (
            <button
              key={ex.name}
              className={`${styles.item}${currentSlotName === ex.name ? ` ${styles.itemSelected}` : ''}`}
              onClick={() => handleSelect(ex.name)}
            >
              <span className={styles.itemDots}>
                <span className={styles.dot} style={{ background: MUSCLE_COLORS[ex.primary] }} />
                {ex.secondary && (
                  <span className={styles.dot} style={{ background: MUSCLE_COLORS[ex.secondary] }} />
                )}
              </span>
              <span className={styles.itemName}>{ex.name}</span>
              <span className={styles.itemAbbr}>{getShortName(ex.name)}</span>
              {inSetNames.has(ex.name)
                ? <span className={styles.inSetDot} />
                : filledNames.has(ex.name) && <span className={styles.filledDot} />}
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
