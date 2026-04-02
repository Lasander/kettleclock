import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { ExerciseDefinition, MuscleGroup, Equipment } from '../types';
import { MUSCLE_COLORS, MUSCLE_LABELS, MUSCLE_ORDER } from '../types';
import {
  getExerciseLibrary,
  saveExercise,
  updateExercise,
  deleteExercise,
  toggleExerciseEnabled,
  isNameTaken,
} from '../exercises';
import styles from './ExerciseLibrary.module.css';

interface Props {
  onBack: () => void;
}

interface EditState {
  mode: 'add' | 'edit';
  originalName: string;
  name: string;
  primary: MuscleGroup;
  secondary: MuscleGroup | '';
  equipment: Equipment;
  builtin: boolean;
}

function newEditState(): EditState {
  return {
    mode: 'add',
    originalName: '',
    name: '',
    primary: 'fullBody',
    secondary: '',
    equipment: 'kettlebell',
    builtin: false,
  };
}

function editStateFromDef(def: ExerciseDefinition): EditState {
  return {
    mode: 'edit',
    originalName: def.name,
    name: def.name,
    primary: def.primary,
    secondary: def.secondary ?? '',
    equipment: def.equipment,
    builtin: def.builtin,
  };
}

export function ExerciseLibrary({ onBack }: Props) {
  const [library, setLibrary] = useState<ExerciseDefinition[]>(() => getExerciseLibrary());
  const [editing, setEditing] = useState<EditState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [equipmentFilter, setEquipmentFilter] = useState<Set<Equipment>>(new Set());
  const [muscleFilter, setMuscleFilter] = useState<Set<MuscleGroup>>(new Set());
  const overlayRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => setLibrary([...getExerciseLibrary()]), []);

  const filtered = useMemo(() => {
    return library.filter((ex) => {
      if (equipmentFilter.size > 0 && !equipmentFilter.has(ex.equipment)) return false;
      if (muscleFilter.size > 0 && !muscleFilter.has(ex.primary) && !(ex.secondary && muscleFilter.has(ex.secondary))) return false;
      return true;
    });
  }, [library, equipmentFilter, muscleFilter]);

  const toggleEquipment = (eq: Equipment) => {
    setEquipmentFilter((prev) => {
      const next = new Set(prev);
      if (next.has(eq)) next.delete(eq); else next.add(eq);
      return next;
    });
  };

  const toggleMuscle = (m: MuscleGroup) => {
    setMuscleFilter((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      return next;
    });
  };

  const handleToggle = (name: string) => {
    toggleExerciseEnabled(name);
    refresh();
  };

  const handleEdit = (def: ExerciseDefinition) => {
    setEditing(editStateFromDef(def));
  };

  const handleDuplicate = (def: ExerciseDefinition) => {
    let copyName = `${def.name} (copy)`;
    let n = 2;
    while (isNameTaken(copyName)) {
      copyName = `${def.name} (copy ${n++})`;
    }
    const newDef: ExerciseDefinition = {
      ...def,
      name: copyName,
      builtin: false,
      enabled: true,
    };
    saveExercise(newDef);
    refresh();
    setEditing(editStateFromDef(newDef));
  };

  const handleAdd = () => {
    setEditing(newEditState());
  };

  const handleDelete = (name: string) => {
    deleteExercise(name);
    refresh();
    setDeleteConfirm(null);
    if (editing?.originalName === name) setEditing(null);
  };

  // Update name when editing
  const handleNameChange = (name: string) => {
    if (!editing) return;
    setEditing({ ...editing, name });
  };

  const nameError = useMemo(() => {
    if (!editing) return '';
    if (!editing.name.trim()) return 'Name is required';
    if (isNameTaken(editing.name, editing.mode === 'edit' ? editing.originalName : undefined)) return 'Name already exists';
    return '';
  }, [editing]);

  const canSave = editing && !nameError && editing.name.trim();

  const handleSave = () => {
    if (!editing || !canSave) return;
    const def: ExerciseDefinition = {
      name: editing.name.trim(),
      primary: editing.primary,
      secondary: editing.secondary || undefined,
      equipment: editing.equipment,
      builtin: editing.builtin,
      enabled: true,
    };
    if (editing.mode === 'edit') {
      updateExercise(editing.originalName, def);
    } else {
      saveExercise(def);
    }
    refresh();
    setEditing(null);
  };

  // Block body scrolling while editor overlay is open
  useEffect(() => {
    if (!editing) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [editing]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <h1 className={styles.title}>Exercise Library</h1>
        <button className={styles.addBtn} onClick={handleAdd}>+ Add</button>
      </div>

      {/* Filters */}
      <div className={styles.filterRow}>
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

      <div className={styles.muscleRow}>
        <button
          className={`${styles.muscleBtn}${muscleFilter.size === 0 ? ` ${styles.muscleBtnActive}` : ''}`}
          onClick={() => setMuscleFilter(new Set())}
        >All</button>
        {MUSCLE_ORDER.map((m) => (
          <button
            key={m}
            className={`${styles.muscleBtn}${muscleFilter.has(m) ? ` ${styles.muscleBtnSelected}` : ''}`}
            style={{ background: MUSCLE_COLORS[m] + '30', color: MUSCLE_COLORS[m], borderColor: muscleFilter.has(m) ? MUSCLE_COLORS[m] : 'transparent' }}
            onClick={() => toggleMuscle(m)}
          >{MUSCLE_LABELS[m]}</button>
        ))}
      </div>

      {/* Exercise list */}
      <div className={styles.list}>
        {filtered.map((ex) => (
          <div key={ex.name} className={`${styles.item}${!ex.enabled ? ` ${styles.itemDisabled}` : ''}`}>
            <div className={styles.itemMain} onClick={() => handleEdit(ex)}>
              <span className={styles.itemDots}>
                <span className={styles.dot} style={{ background: MUSCLE_COLORS[ex.primary] }} />
                {ex.secondary && <span className={styles.dot} style={{ background: MUSCLE_COLORS[ex.secondary] }} />}
              </span>
              <span className={styles.itemName}>{ex.name}</span>
              <span className={styles.itemEquip}>{ex.equipment === 'kettlebell' ? '🔔' : '🤸'}</span>
            </div>
            <div className={styles.itemActions}>
              <button
                className={styles.duplicateBtn}
                onClick={(e) => { e.stopPropagation(); handleDuplicate(ex); }}
                title="Duplicate"
              >⧉</button>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={ex.enabled}
                  onChange={() => handleToggle(ex.name)}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className={styles.empty}>No exercises match filters</div>
        )}
      </div>

      {/* Edit / Add overlay */}
      {editing && (
        <div className={styles.editOverlay} ref={overlayRef} onClick={() => setEditing(null)}>
          <div className={styles.editPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.editHeader}>
              <span className={styles.editTitle}>
                {editing.mode === 'add' ? 'New Exercise' : 'Edit Exercise'}
              </span>
              <button className={styles.editClose} onClick={() => setEditing(null)}>✕</button>
            </div>

            <div className={styles.editBody}>
              {/* Name */}
              <label className={styles.fieldLabel}>Name</label>
              <input
                className={`${styles.fieldInput}${nameError ? ` ${styles.fieldError}` : ''}`}
                type="text"
                value={editing.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Exercise name"
                autoFocus
              />
              {nameError && <span className={styles.errorText}>{nameError}</span>}

              {/* Equipment */}
              <label className={styles.fieldLabel}>Equipment</label>
              <div className={styles.segmentRow}>
                <button
                  className={`${styles.segmentBtn}${editing.equipment === 'kettlebell' ? ` ${styles.segmentBtnActive}` : ''}`}
                  onClick={() => setEditing({ ...editing, equipment: 'kettlebell' })}
                >🔔 Kettlebell</button>
                <button
                  className={`${styles.segmentBtn}${editing.equipment === 'bodyweight' ? ` ${styles.segmentBtnActive}` : ''}`}
                  onClick={() => setEditing({ ...editing, equipment: 'bodyweight' })}
                >🤸 Bodyweight</button>
              </div>

              {/* Primary muscle */}
              <label className={styles.fieldLabel}>Primary Muscle Group</label>
              <div className={styles.muscleGrid}>
                {MUSCLE_ORDER.map((m) => (
                  <button
                    key={m}
                    className={`${styles.musclePick}${editing.primary === m ? ` ${styles.musclePickActive}` : ''}`}
                    style={{ background: MUSCLE_COLORS[m] + (editing.primary === m ? '' : '30'), color: editing.primary === m ? '#fff' : MUSCLE_COLORS[m] }}
                    onClick={() => setEditing({ ...editing, primary: m, secondary: editing.secondary === m ? '' : editing.secondary })}
                  >{MUSCLE_LABELS[m]}</button>
                ))}
              </div>

              {/* Secondary muscle */}
              <label className={styles.fieldLabel}>Secondary Muscle Group (optional)</label>
              <div className={styles.muscleGrid}>
                <button
                  className={`${styles.musclePick}${editing.secondary === '' ? ` ${styles.musclePickActive}` : ''}`}
                  style={{ background: editing.secondary === '' ? 'var(--color-surface-elevated)' : 'transparent' }}
                  onClick={() => setEditing({ ...editing, secondary: '' })}
                >None</button>
                {MUSCLE_ORDER.filter((m) => m !== editing.primary).map((m) => (
                  <button
                    key={m}
                    className={`${styles.musclePick}${editing.secondary === m ? ` ${styles.musclePickActive}` : ''}`}
                    style={{ background: MUSCLE_COLORS[m] + (editing.secondary === m ? '' : '30'), color: editing.secondary === m ? '#fff' : MUSCLE_COLORS[m] }}
                    onClick={() => setEditing({ ...editing, secondary: m })}
                  >{MUSCLE_LABELS[m]}</button>
                ))}
              </div>

              {/* Actions */}
              <div className={styles.editActions}>
                {editing.mode === 'edit' && !editing.builtin && (
                  <button
                    className={styles.deleteBtn}
                    onClick={() => setDeleteConfirm(editing.originalName)}
                  >Delete</button>
                )}
                <button className={styles.cancelBtn} onClick={() => setEditing(null)}>Cancel</button>
                <button
                  className={styles.saveBtn}
                  onClick={handleSave}
                  disabled={!canSave}
                >Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className={styles.editOverlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <p className={styles.confirmText}>Delete "{deleteConfirm}"?</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className={styles.deleteBtn} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
