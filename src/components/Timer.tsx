import { useState, useEffect, useRef, useCallback } from 'react';
import type { Workout, Segment } from '../types';
import { buildSegments } from '../segments';
import { resumeAudio, playCountdownBeep, playExerciseStart, playHalfTime, playExerciseEnding, playSetRest } from '../audio';
import { requestWakeLock, releaseWakeLock, reacquireOnVisibilityChange } from '../wakeLock';
import styles from './Timer.module.css';

interface Props {
  workout: Workout;
  onDone: (elapsed: number) => void;
  onAbort: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}:${s.toString().padStart(2, '0')}`;
  return `${s}`;
}

export function Timer({ workout, onDone, onAbort }: Props) {
  const [segments] = useState<Segment[]>(() => buildSegments(workout));
  const [segIndex, setSegIndex] = useState(0);
  const [remaining, setRemaining] = useState(() => buildSegments(workout)[0]?.duration ?? 0);
  const [paused, setPaused] = useState(false);
  const startTimeRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const playedBeepsRef = useRef<Set<string>>(new Set());

  const seg = segments[segIndex];

  const advance = useCallback(() => {
    const next = segIndex + 1;
    if (next >= segments.length) {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      onDone(elapsed);
      return;
    }
    setSegIndex(next);
    setRemaining(segments[next].duration);
    playedBeepsRef.current.clear();
    if (segments[next].type === 'exercise') {
      playExerciseStart();
    } else if (segments[next].type === 'setRest') {
      playSetRest();
    }
  }, [segIndex, segments, onDone]);

  const goBack = useCallback(() => {
    const prev = segIndex - 1;
    if (prev < 0) {
      // Restart current segment
      setRemaining(seg?.duration ?? 0);
      playedBeepsRef.current.clear();
      return;
    }
    setSegIndex(prev);
    setRemaining(segments[prev].duration);
    playedBeepsRef.current.clear();
  }, [segIndex, segments, seg]);

  // Countdown tick
  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          advance();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [paused, advance]);

  // Beep effects
  useEffect(() => {
    if (paused || !seg) return;
    const key = `${segIndex}-${remaining}`;
    if (playedBeepsRef.current.has(key)) return;

    // Countdown beeps at end of rest segments (next exercise is coming)
    if (seg.type === 'exerciseRest' || seg.type === 'setRest' || seg.type === 'initialCountdown') {
      if (remaining <= 3 && remaining >= 1) {
        playedBeepsRef.current.add(key);
        playCountdownBeep();
      }
    }

    // Exercise half-time beep
    if (seg.type === 'exercise') {
      const halfTime = Math.ceil(seg.duration / 2);
      if (remaining === halfTime && halfTime !== seg.duration) {
        playedBeepsRef.current.add(key);
        playHalfTime();
      }
      // Ending beeps at T-3, T-2, T-1 of exercise
      if (remaining <= 3 && remaining >= 1) {
        playedBeepsRef.current.add(key);
        playExerciseEnding();
      }
    }
  }, [remaining, paused, seg, segIndex]);

  // Wake lock
  useEffect(() => {
    resumeAudio();
    requestWakeLock();
    const cleanup = reacquireOnVisibilityChange(true);
    return () => {
      releaseWakeLock();
      cleanup();
    };
  }, []);

  const handleAbort = () => {
    if (confirm('Abort workout?')) {
      onAbort();
    }
  };

  if (!seg) return null;

  const phaseLabel =
    seg.type === 'exercise'
      ? 'Exercise'
      : seg.type === 'exerciseRest'
        ? 'Rest'
        : seg.type === 'setRest'
          ? 'Set Rest'
          : 'Get Ready';

  // Map initialCountdown → exerciseRest for colour styling (blue)
  const phaseData = seg.type === 'initialCountdown' ? 'exerciseRest' : seg.type;
  const isEndingSoon = seg.type === 'exercise' && remaining <= 3 && remaining >= 1;

  // "Up Next" info during rest phases
  const nextSeg = segIndex + 1 < segments.length ? segments[segIndex + 1] : null;
  let upNextText: string | null = null;
  let upNextList: string[] | null = null;
  if (seg.type === 'exerciseRest' || seg.type === 'initialCountdown') {
    if (nextSeg) {
      upNextText = nextSeg.label;
    }
  } else if (seg.type === 'setRest') {
    // Show all exercises from the upcoming set
    const nextSetIdx = seg.setIndex + 1;
    const nextRow = workout.grid[nextSetIdx];
    if (nextRow) {
      upNextText = `Set ${nextSetIdx + 1}`;
      upNextList = nextRow
        .map((slot) => slot.exerciseName || '(empty)')
        .filter(Boolean);
    }
  }

  return (
    <div
      className={styles.container}
      data-phase={phaseData}
      data-ending={isEndingSoon ? 'true' : undefined}
    >
      <div className={styles.info}>
        <div className={styles.phase}>{phaseLabel}</div>
        <div className={styles.label}>{seg.label}</div>
        <div className={styles.time} aria-live="polite" aria-atomic="true">
          {formatTime(remaining)}
        </div>
        <div className={styles.progress}>
          Set {seg.setIndex + 1}/{workout.setsCount} &middot; Exercise{' '}
          {seg.exerciseIndex + 1}/{workout.exercisesPerSet}
        </div>
        {upNextText && (
          <div className={styles.upNext}>
            Up next: <span className={styles.upNextLabel}>{upNextText}</span>
            {upNextList && (
              <div className={styles.upNextList}>
                {upNextList.map((name, i) => (
                  <span key={i} className={styles.upNextItem}>{name}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className={styles.controls}>
        <button className={styles.pauseBtn} onClick={() => setPaused((p) => !p)}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <div className={styles.navRow}>
          <button className={styles.prevBtn} onClick={goBack} aria-label="Previous segment">
            ◀ Prev
          </button>
          <button className={styles.skipBtn} onClick={advance}>
            Skip ▶
          </button>
        </div>
        <button className={styles.abortBtn} onClick={handleAbort}>
          Abort
        </button>
      </div>
    </div>
  );
}
