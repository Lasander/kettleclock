import { useState, useRef, useEffect } from 'react';
import styles from './NumberControl.module.css';

interface Props {
  label: string;
  value: number;
  min?: number;
  max?: number;
  suffix?: string;
  onChange: (value: number) => void;
}

export function NumberControl({ label, value, min = 0, max = 999, suffix, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const num = parseInt(draft, 10);
    if (!isNaN(num)) {
      onChange(Math.max(min, Math.min(max, num)));
    }
    setDraft(String(value));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') {
      setEditing(false);
      setDraft(String(value));
    }
  };

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>{label}</span>
      {editing ? (
        <input
          ref={inputRef}
          className={styles.input}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <button
          className={styles.display}
          onClick={() => {
            setDraft(String(value));
            setEditing(true);
          }}
          aria-label={`${label}: ${value}. Tap to edit`}
        >
          {value}
          {suffix && <span className={styles.suffix}>{suffix}</span>}
        </button>
      )}
    </div>
  );
}
