import { useEffect, useRef, useState } from 'react';
import type { PokerSession } from '../types';
import {
  getCurrentBlindLevel,
  getMinutesUntilNextLevel,
} from '../utils/blindStructure';
import { getEffectiveBlindElapsedMs, isBlindTimerPaused } from '../utils/blindTimer';
import { getTotalPotCash } from '../utils/calculations';
import { playBlindLevelUpSound } from '../utils/sound';
import { formatChips, formatCurrency, formatDateTime, formatDuration } from '../utils/format';

interface CurrentBlindsBarProps {
  session: PokerSession;
  onTogglePause?: () => void;
}

export function CurrentBlindsBar({ session, onTogglePause }: CurrentBlindsBarProps) {
  const plan = session.blindPlan;
  const totalPot = getTotalPotCash(session);
  const paused = isBlindTimerPaused(session);
  const prevLevelRef = useRef<number | null>(null);

  const [elapsedMs, setElapsedMs] = useState(() => getEffectiveBlindElapsedMs(session));

  useEffect(() => {
    const tick = () => setElapsedMs(getEffectiveBlindElapsedMs(session));
    tick();
    if (!paused) {
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }
  }, [session.startTime, session.blindTimerPausedAt, session.blindTimerTotalPausedMs, paused]);

  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const current = plan ? getCurrentBlindLevel(plan, elapsedMinutes) : null;
  const minutesUntilNext = plan ? getMinutesUntilNextLevel(plan, elapsedMinutes) : null;

  useEffect(() => {
    if (!plan || paused || session.status !== 'active') return;
    const level = current?.level ?? null;
    if (level !== null && prevLevelRef.current !== null && level > prevLevelRef.current) {
      playBlindLevelUpSound();
    }
    if (level !== null) prevLevelRef.current = level;
  }, [current?.level, plan, paused, session.status]);

  return (
    <div className={`current-blinds-bar ${paused ? 'current-blinds-paused' : ''}`}>
      <div className="current-blinds-top">
        <div className="current-blinds-main">
          {current ? (
            <>
              <span className="current-blinds-label">Current Blinds</span>
              <span className="current-blinds-value">
                {formatChips(current.smallBlind)} / {formatChips(current.bigBlind)}
              </span>
            </>
          ) : (
            <>
              <span className="current-blinds-label">Live Session</span>
              <span className="current-blinds-value">{formatCurrency(totalPot, session.currency)}</span>
            </>
          )}
        </div>

        <div className="current-blinds-pot-block">
          <span className="current-blinds-side-label">Total Pot</span>
          <span className="current-blinds-pot-value">
            {formatCurrency(totalPot, session.currency)}
          </span>
        </div>
      </div>

      <div className="current-blinds-stats">
        <div className="current-blinds-stat">
          <span className="current-blinds-stat-label">Started</span>
          <span className="current-blinds-stat-value">{formatDateTime(session.startTime)}</span>
        </div>
        <div className="current-blinds-stat">
          <span className="current-blinds-stat-label">Duration</span>
          <span className={`current-blinds-stat-value ${paused ? '' : 'live-duration'}`}>
            {formatDuration(elapsedMs)}
            {paused && <span className="paused-tag"> paused</span>}
          </span>
        </div>
        {plan && current && (
          <>
            <div className="current-blinds-stat">
              <span className="current-blinds-stat-label">Level</span>
              <span className="current-blinds-stat-value">
                {current.level}/{plan.numLevels}
              </span>
            </div>
            <div className="current-blinds-stat">
              <span className="current-blinds-stat-label">Next level</span>
              <span className="current-blinds-stat-value">
                {minutesUntilNext !== null
                  ? formatDuration(minutesUntilNext * 60000)
                  : 'Final'}
              </span>
            </div>
          </>
        )}
      </div>

      {plan && onTogglePause && session.status === 'active' && (
        <div className="current-blinds-actions">
          <button
            type="button"
            className={`btn btn-sm ${paused ? 'btn-primary' : 'btn-secondary'}`}
            onClick={onTogglePause}
          >
            {paused ? 'Resume Blinds' : 'Pause Blinds'}
          </button>
        </div>
      )}
    </div>
  );
}
