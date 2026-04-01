import { useState } from 'react';
import { getExerciseDef, getShortName } from '../exercises';
import { MUSCLE_COLORS } from '../types';
import { ExercisePicker } from './ExercisePicker';
import styles from './ExerciseCell.module.css';

interface Props {
  exerciseName: string;
  isDuplicate: boolean;
  setIdx: number;
  exIdx: number;
  onChange: (name: string) => void;
  editMode?: boolean;
  isSource?: boolean;
  isTarget?: boolean;
}

function getCellStyle(exerciseName: string): React.CSSProperties {
  if (!exerciseName) return {};
  const def = getExerciseDef(exerciseName);
  if (!def) return { background: '#555' };
  const c1 = MUSCLE_COLORS[def.primary];
  if (def.secondary) {
    const c2 = MUSCLE_COLORS[def.secondary];
    return { background: `linear-gradient(135deg, ${c1} 50%, ${c2} 50%)` };
  }
  return { background: c1 };
}

export function ExerciseCell({
  exerciseName,
  isDuplicate,
  setIdx,
  exIdx,
  onChange,
  editMode,
  isSource,
  isTarget,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const displayName = exerciseName ? getShortName(exerciseName) : '';

  const classNames = [
    styles.cell,
    !exerciseName && styles.empty,
    isDuplicate && styles.duplicate,
    editMode && styles.editMode,
    isSource && styles.source,
    isTarget && styles.target,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div
        className={classNames}
        style={getCellStyle(exerciseName)}
        data-cell=""
        data-set={setIdx}
        data-ex={exIdx}
        onClick={!editMode ? () => setPickerOpen(true) : undefined}
      >
        {editMode ? (
          <>
            <span className={styles.dragHandle}>⠿</span>
            <span className={styles.abbrText}>{displayName || '+'}</span>
          </>
        ) : (
          exerciseName ? displayName : '+'
        )}
      </div>
      {pickerOpen && (
        <ExercisePicker
          value={exerciseName}
          onSelect={onChange}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}

