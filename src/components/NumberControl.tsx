import { useState, useRef } from 'react';
import styles from './NumberControl.module.css';

interface Props {
  label: string;
  value: number;
  min?: number;
  max?: number;
  suffix?: string;
  muted?: boolean;
  onChange: (value: number) => void;
}

function Numpad({ label, value, min, max, suffix, onChange, onClose }: {
  label: string; value: number; min: number; max: number;
  suffix?: string; onChange: (v: number) => void; onClose: () => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const [pending, setPending] = useState(false);
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef(String(value));    // sync mirror of draft for reads inside callbacks
  const inPendingRef = useRef(false);        // mirrors pending state for sync reads

  const setDraftSync = (val: string) => { draftRef.current = val; setDraft(val); };

  const clearPending = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    inPendingRef.current = false;
    setPending(false);
  };

  const pressDigit = (d: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const next = inPendingRef.current
      ? (draftRef.current === '0' ? d : draftRef.current + d)
      : (d === '0' ? '0' : d);
    const num = parseInt(next, 10);
    if (num <= max) setDraftSync(next);
    inPendingRef.current = true;
    setPending(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      inPendingRef.current = false;
      setPending(false);
    }, 1000);
  };

  const step = (delta: number) => {
    clearPending();
    const base = parseInt(draftRef.current, 10);
    const next = clamp((isNaN(base) ? value : base) + delta);
    setDraftSync(String(next));
  };

  const commit = () => {
    clearPending();
    const num = parseInt(draftRef.current, 10);
    if (!isNaN(num)) onChange(clamp(num));
    onClose();
  };

  const cancel = () => {
    clearPending();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={commit}>
      <div className={styles.numpad} onClick={(e) => e.stopPropagation()}>
        <div className={styles.numpadHandle} />
        <div className={styles.numpadLabel}>{label} · {min}–{max}{suffix ? ` ${suffix}` : ''}</div>
        <div className={`${styles.numpadValue}${pending ? ` ${styles.numpadValuePending}` : ''}`}>
          {draft}
          {suffix && <span className={styles.numpadSuffix}>{suffix}</span>}
        </div>
        <div className={styles.stepRow}>
          <button className={styles.stepBtn} onClick={() => step(-1)}>▼</button>
          <button className={styles.stepBtn} onClick={() => step(1)}>▲</button>
        </div>
        <div className={styles.digitGrid}>
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <button key={d} className={styles.digitBtn} onClick={() => pressDigit(d)}>{d}</button>
          ))}
          <button className={`${styles.digitBtn} ${styles.cancelBtn}`} onClick={cancel}>✕</button>
          <button className={styles.digitBtn} onClick={() => pressDigit('0')}>0</button>
          <button className={`${styles.digitBtn} ${styles.confirmBtn}`} onClick={commit}>✓</button>
        </div>
      </div>
    </div>
  );
}

export function NumberControl({ label, value, min = 0, max = 999, suffix, muted, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={styles.wrapper}>
        <span className={styles.label}>{label}</span>
        <button
          className={`${styles.display}${open ? ` ${styles.displayActive}` : ''}${muted ? ` ${styles.displayMuted}` : ''}`}
          onClick={() => setOpen(true)}
          aria-label={`${label}: ${value}. Tap to edit`}
        >
          {value}
          {suffix && <span className={styles.suffix}>{suffix}</span>}
        </button>
      </div>
      {open && (
        <Numpad
          label={label}
          value={value}
          min={min}
          max={max}
          suffix={suffix}
          onChange={onChange}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}



