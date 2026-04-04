let audioCtx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (!audioCtx) {
    try {
      const Cls = (window as any).AudioContext ?? (window as any).webkitAudioContext;
      if (Cls) audioCtx = new Cls() as AudioContext;
    } catch (_) {
      // audio not available
    }
  }
  return audioCtx;
}

/**
 * Must be called from a user-gesture handler (tap / click).
 * Creates the AudioContext, resumes it, and plays a silent buffer
 * to permanently unlock audio playback on iOS Safari.
 */
export function resumeAudio(): void {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  // Play a silent buffer to fully unlock iOS audio
  if (!unlocked) {
    try {
      const buf = ctx.createBuffer(1, 1, ctx.sampleRate);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      unlocked = true;
    } catch (_) {
      // ignore
    }
  }
}

function playTone(frequency: number, durationMs: number, volume = 0.3): void {
  const ctx = getCtx();
  if (!ctx || ctx.state === 'suspended') return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (_) {
    // ignore audio errors
  }
}

/** Beep played at T-3, T-2, T-1 during rest segments (next exercise is coming). */
export function playCountdownBeep(): void {
  playTone(880, 100);
}

/** Played when an exercise segment begins. */
export function playExerciseStart(): void {
  playTone(1320, 200, 0.4);
}

/** Played at the midpoint of an exercise segment. */
export function playHalfTime(): void {
  playTone(660, 150, 0.3);
}

/** Played at T-3, T-2, T-1 during exercise segments (exercise is ending). */
export function playExerciseEnding(): void {
  playTone(550, 80, 0.25);
}

/** Played when a set rest segment begins. */
export function playSetRest(): void {
  playTone(440, 300, 0.35);
}

/** Re-resume AudioContext if iOS suspended it. Call periodically during workouts. */
export function ensureAudioActive(): void {
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

