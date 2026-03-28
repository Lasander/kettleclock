import { EXERCISE_LIBRARY, getExerciseDef } from '../exercises';
import { MUSCLE_COLORS } from '../types';
import styles from './ExerciseCell.module.css';

interface Props {
  exerciseName: string;
  isDuplicate: boolean;
  onChange: (name: string) => void;
  onDragStart?: () => void;
  onDragOver?: () => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
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
  onChange,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isDragOver,
}: Props) {
  const def = getExerciseDef(exerciseName);
  const abbr = def?.abbr ?? '';
  const classNames = [
    styles.cell,
    !exerciseName && styles.empty,
    isDuplicate && styles.duplicate,
    isDragging && styles.dragging,
    isDragOver && styles.dragOver,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      style={getCellStyle(exerciseName)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDragEnd?.();
      }}
      onTouchStart={() => {
        // Touch drag is handled by parent for reorder
      }}
    >
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
    </div>
  );
}
