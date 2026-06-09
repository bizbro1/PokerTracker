import { useEffect, useRef, useState } from 'react';
import type { PokerSession, SessionEvent } from '../types';
import { playStackUpdateSound } from '../utils/sound';

/**
 * Watches the session activity log and surfaces the latest event as a toast
 * while playing the stack-update sound. Works across devices via realtime sync.
 */
export function useSessionEventAlerts(session: PokerSession | null): SessionEvent | null {
  const [toast, setToast] = useState<SessionEvent | null>(null);
  const prevLenRef = useRef<number | null>(null);

  useEffect(() => {
    const events = session?.events ?? [];
    const len = events.length;

    if (prevLenRef.current !== null && len > prevLenRef.current) {
      const latest = events[len - 1];
      setToast(latest);
      playStackUpdateSound();
      const timer = setTimeout(() => setToast(null), 5000);
      prevLenRef.current = len;
      return () => clearTimeout(timer);
    }

    prevLenRef.current = len;
  }, [session?.events]);

  return toast;
}
