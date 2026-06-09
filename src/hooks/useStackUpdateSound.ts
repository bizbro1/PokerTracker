import { useEffect, useRef } from 'react';
import type { PokerSession } from '../types';
import { playStackUpdateSound } from '../utils/sound';

/**
 * Plays a sound whenever any player's stack history grows — i.e. someone
 * entered a new stack count, rebought, busted, or cashed out. Works for
 * updates from other devices too, since they arrive via realtime sync.
 */
export function useStackUpdateSound(session: PokerSession | null): void {
  const prevCountRef = useRef<number | null>(null);

  const count = session
    ? session.players.reduce((sum, p) => sum + p.stackHistory.length, 0)
    : null;

  useEffect(() => {
    if (count === null) {
      prevCountRef.current = null;
      return;
    }
    if (prevCountRef.current !== null && count > prevCountRef.current) {
      playStackUpdateSound();
    }
    prevCountRef.current = count;
  }, [count]);
}
