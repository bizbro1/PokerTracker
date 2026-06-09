import { useEffect } from 'react';

/** Keeps the screen awake while `enabled` (e.g. the host's live session view). */
export function useWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;

    let lock: WakeLockSentinel | null = null;

    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        // Denied (battery saver, etc.) — not critical
      }
    };

    // The lock is auto-released when the tab is hidden; re-acquire on return
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      void lock?.release().catch(() => {});
    };
  }, [enabled]);
}
