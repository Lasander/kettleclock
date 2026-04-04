import { getExerciseDef, getShortName } from '../exercises';
import { MUSCLE_COLORS_MUTED } from '../types';
import styles from './ExerciseCell.module.css';

interface Props {
  exerciseName: string;
  duplicateType?: 'set' | 'workout';
  setIdx: number;
  exIdx: number;
  onTap?: () => void;
  onClear?: () => void;
  editMode?: boolean;
  isSource?: boolean;
  isTarget?: boolean;
  size?: 'normal' | 'small';
}

function getCellStyle(exerciseName: string): React.CSSProperties {
  if (!exerciseName) return {};
  const def = getExerciseDef(exerciseName);
  if (!def) return { background: '#555' };
  const c1 = MUSCLE_COLORS_MUTED[def.primary];
  return { background: c1 };
}

export function ExerciseCell({
  exerciseName,
  duplicateType,
  setIdx,
  exIdx,
  onTap,
  onClear,
  editMode,
  isSource,
  isTarget,
  size,
}: Props) {
  const displayName = exerciseName ? getShortName(exerciseName) : '';
  const def = getExerciseDef(exerciseName);
  const hasSplit = !!(def?.secondary);

  const classNames = [
    styles.cell,
    size === 'small' && styles.cellSmall,
    !exerciseName && styles.empty,
    duplicateType === 'set' && styles.duplicateSet,
    duplicateType === 'workout' && styles.duplicateWorkout,
    editMode && styles.editMode,
    isSource && styles.source,
    isTarget && styles.target,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      style={getCellStyle(exerciseName)}
      data-cell=""
      data-set={setIdx}
      data-ex={exIdx}
      onClick={!editMode ? onTap : undefined}
    >
      {hasSplit && (
        <div
          className={styles.splitOverlay}
          style={{ background: MUSCLE_COLORS_MUTED[def!.secondary!] }}
        />
      )}
      {editMode && exerciseName && onClear && (
        <button
          className={styles.clearBtn}
          data-clear=""
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          aria-label="Clear exercise"
        >×</button>
      )}
      <span className={styles.cellText}>
        {exerciseName ? displayName : '+'}
      </span>
    </div>
  );
}

