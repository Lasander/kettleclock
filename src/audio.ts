let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function resumeAudio(): void {
  const ctx = getCtx();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

function playTone(frequency: number, durationMs: number, volume = 0.3): void {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + durationMs / 1000);
}

export function playCountdownBeep(): void {
  playTone(880, 100);
}

export function playExerciseStart(): void {
  playTone(1320, 200, 0.4);
}

export function playHalfTime(): void {
  playTone(660, 150, 0.3);
}

export function playSetRest(): void {
  playTone(440, 300, 0.35);
}
