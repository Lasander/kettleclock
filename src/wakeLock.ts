let wakeLock: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<void> {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch {
    // Wake lock request failed (e.g. low battery)
  }
}

export async function releaseWakeLock(): Promise<void> {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
  }
}

export function reacquireOnVisibilityChange(active: boolean): () => void {
  const handler = async () => {
    if (active && document.visibilityState === 'visible') {
      await requestWakeLock();
    }
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}
