import type { PokerSession } from '../types';

export function getEffectiveBlindElapsedMs(session: PokerSession, now = Date.now()): number {
  const start = new Date(session.startTime).getTime();
  let pausedMs = session.blindTimerTotalPausedMs ?? 0;

  if (session.blindTimerPausedAt) {
    pausedMs += now - new Date(session.blindTimerPausedAt).getTime();
  }

  return Math.max(0, now - start - pausedMs);
}

export function isBlindTimerPaused(session: PokerSession): boolean {
  return session.blindTimerPausedAt !== null;
}
