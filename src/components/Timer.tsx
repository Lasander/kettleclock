import { useState, useEffect, useRef, useCallback } from 'react';
import type { Workout, Segment } from '../types';
import { buildSegments } from '../segments';
import { resumeAudio, playCountdownBeep, playExerciseStart, playHalfTime, playSetRest } from '../audio';
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
    // Audio cue for next segment
    if (segments[next].type === 'exercise') {
      playExerciseStart();
    } else if (segments[next].type === 'setRest') {
      playSetRest();
    }
  }, [segIndex, segments, onDone]);

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

  // Countdown beeps before exercises & half-time beep
  useEffect(() => {
    if (paused || !seg) return;
    const key = `${segIndex}-${remaining}`;
    if (playedBeepsRef.current.has(key)) return;

    // Countdown beeps during rest/countdown segments: beep at 3, 2, 1
    if (seg.type === 'exerciseRest' || seg.type === 'setRest' || seg.type === 'initialCountdown') {
      if (remaining <= 3 && remaining >= 1) {
        playedBeepsRef.current.add(key);
        playCountdownBeep();
      }
    }

    // Half-time beep during exercise
    if (seg.type === 'exercise') {
      const halfTime = Math.ceil(seg.duration / 2);
      if (remaining === halfTime && halfTime !== seg.duration) {
        playedBeepsRef.current.add(key);
        playHalfTime();
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

  // Map initialCountdown to exerciseRest for styling (blue)
  const phaseData = seg.type === 'initialCountdown' ? 'exerciseRest' : seg.type;

  return (
    <div className={styles.container} data-phase={phaseData}>
      <div className={styles.phase}>{phaseLabel}</div>
      <div className={styles.label}>{seg.label}</div>
      <div className={styles.time} aria-live="polite" aria-atomic="true">
        {formatTime(remaining)}
      </div>
      <div className={styles.progress}>
        Set {seg.setIndex + 1}/{workout.setsCount} &middot; Exercise{' '}
        {seg.exerciseIndex + 1}/{workout.exercisesPerSet}
      </div>
      <div className={styles.controls}>
        <button className={styles.pauseBtn} onClick={() => setPaused((p) => !p)}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button className={styles.skipBtn} onClick={advance}>
          Skip ⏭
        </button>
        <button className={styles.abortBtn} onClick={handleAbort}>
          Abort
        </button>
      </div>
    </div>
  );
}
