// Screen Wake Lock API manager
// Keeps mobile screen alive when on the floor during push-up sets

let wakeLockSentinel: any = null;

export async function requestScreenWakeLock(): Promise<boolean> {
  try {
    if ('wakeLock' in navigator && (navigator as any).wakeLock) {
      if (wakeLockSentinel && !wakeLockSentinel.released) {
        return true;
      }
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    }
  } catch {
    // Wake lock might be rejected if low battery or tab hidden
  }
  return false;
}

export async function releaseScreenWakeLock(): Promise<void> {
  try {
    if (wakeLockSentinel && !wakeLockSentinel.released) {
      await wakeLockSentinel.release();
    }
    wakeLockSentinel = null;
  } catch {
    // Ignore
  }
}

export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}
