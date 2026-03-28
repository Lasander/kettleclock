import { EXERCISE_LIBRARY, getExerciseDef } from '../exercises';
import { MUSCLE_COLORS } from '../types';
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
  const def = getExerciseDef(exerciseName);
  const abbr = def?.abbr ?? '';

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
    <div
      className={classNames}
      style={getCellStyle(exerciseName)}
      data-cell=""
      data-set={setIdx}
      data-ex={exIdx}
    >
      {editMode ? (
        <>
          <span className={styles.dragHandle}>⠿</span>
          <span className={styles.abbrText}>{abbr || '+'}</span>
        </>
      ) : (
        <>
          {exerciseName ? abbr : '+'}
          <select
            className={styles.hiddenSelect}
            value={exerciseName}
            onChange={(e) => onChange(e.target.value)}
            aria-label={exerciseName || 'Select exercise'}
          >
            <option value="">— Empty —</option>
            {EXERCISE_LIBRARY.map((ex) => (
              <option key={ex.name} value={ex.name}>
                {ex.abbr} — {ex.name}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}

