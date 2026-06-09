import { useEffect, useRef, useState } from 'react';
import type { PokerSession } from '../types';
import {
  getCurrentBlindLevel,
  getMinutesUntilNextLevel,
} from '../utils/blindStructure';
import { getEffectiveBlindElapsedMs, isBlindTimerPaused } from '../utils/blindTimer';
import {
  getSessionSummary,
  getTotalLiveStacksChips,
  getTotalPotCash,
} from '../utils/calculations';
import { formatChips, formatCurrency, formatDuration } from '../utils/format';
import { playBlindLevelUpSound } from '../utils/sound';

interface SessionStatStripProps {
  session: PokerSession;
  onTogglePause?: () => void;
  /** Show the collapsible chip-accounting details (host view). */
  showAccounting?: boolean;
}

export function SessionStatStrip({
  session,
  onTogglePause,
  showAccounting = false,
}: SessionStatStripProps) {
  const plan = session.blindPlan;
  const totalPot = getTotalPotCash(session);
  const paused = isBlindTimerPaused(session);
  const prevLevelRef = useRef<number | null>(null);
  const [accountingOpen, setAccountingOpen] = useState(false);

  const [elapsedMs, setElapsedMs] = useState(() => getEffectiveBlindElapsedMs(session));

  useEffect(() => {
    const tick = () => setElapsedMs(getEffectiveBlindElapsedMs(session));
    tick();
    if (!paused && session.status === 'active') {
      const interval = setInterval(tick, 1000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.startTime, session.blindTimerPausedAt, session.blindTimerTotalPausedMs, paused, session.status]);

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

  const summary = showAccounting ? getSessionSummary(session) : null;
  const liveStacks = showAccounting ? getTotalLiveStacksChips(session) : null;

  return (
    <div className={`stat-strip ${paused ? 'stat-strip-paused' : ''}`}>
      <div className="stat-strip-main">
        <div className="stat-strip-hero">
          <span className="stat-strip-hero-label">
            {current ? 'Blinds' : 'Live Session'}
            {paused && <span className="paused-tag">paused</span>}
          </span>
          <span className="stat-strip-hero-value">
            {current
              ? `${formatChips(current.smallBlind)} / ${formatChips(current.bigBlind)}`
              : formatCurrency(totalPot, session.currency)}
          </span>
          {current && minutesUntilNext !== null && (
            <span className="stat-strip-hero-sub">
              next level in {formatDuration(minutesUntilNext * 60000)}
            </span>
          )}
          {current && minutesUntilNext === null && (
            <span className="stat-strip-hero-sub">final level</span>
          )}
        </div>

        <div className="stat-strip-cells">
          <div className="stat-strip-cell">
            <span className="stat-strip-cell-label">Total Pot</span>
            <span className="stat-strip-cell-value stat-strip-gold">
              {formatCurrency(totalPot, session.currency)}
            </span>
          </div>
          <div className="stat-strip-cell">
            <span className="stat-strip-cell-label">Duration</span>
            <span className={`stat-strip-cell-value ${paused ? '' : 'live-duration'}`}>
              {formatDuration(elapsedMs)}
            </span>
          </div>
          {plan && current && (
            <div className="stat-strip-cell">
              <span className="stat-strip-cell-label">Level</span>
              <span className="stat-strip-cell-value">
                {current.level}<span className="stat-strip-dim">/{plan.numLevels}</span>
              </span>
            </div>
          )}
          {onTogglePause && plan && session.status === 'active' && (
            <button
              type="button"
              className={`btn btn-sm stat-strip-pause ${paused ? 'btn-primary' : 'btn-ghost'}`}
              onClick={onTogglePause}
            >
              {paused ? '▶ Resume' : '⏸ Pause'}
            </button>
          )}
        </div>
      </div>

      {showAccounting && summary && (
        <div className="stat-strip-accounting">
          <button
            type="button"
            className="stat-strip-accounting-toggle"
            onClick={() => setAccountingOpen((open) => !open)}
          >
            <span>
              Chip accounting
              {summary.chipsUnaccounted !== 0 && (
                <span className="stat-strip-dot" title="Chips still in play" />
              )}
            </span>
            <span className="stat-strip-chevron">{accountingOpen ? '▴' : '▾'}</span>
          </button>
          {accountingOpen && (
            <div className="stat-strip-accounting-grid">
              <div className="stat-strip-cell">
                <span className="stat-strip-cell-label">Rate</span>
                <span className="stat-strip-cell-value-sm">
                  {formatCurrency(session.chipValue.cash, session.currency)} ={' '}
                  {formatChips(session.chipValue.chips)}
                </span>
              </div>
              <div className="stat-strip-cell">
                <span className="stat-strip-cell-label">Cash Paid Out</span>
                <span className="stat-strip-cell-value-sm">
                  {formatCurrency(summary.totalCashOuts, session.currency)}
                </span>
              </div>
              <div className="stat-strip-cell">
                <span className="stat-strip-cell-label">Chips Issued</span>
                <span className="stat-strip-cell-value-sm">
                  {formatChips(summary.totalChipsIssued)}
                </span>
              </div>
              <div className="stat-strip-cell">
                <span className="stat-strip-cell-label">Chips Out</span>
                <span className="stat-strip-cell-value-sm">
                  {formatChips(summary.totalChipsCashedOut)}
                </span>
              </div>
              <div className="stat-strip-cell">
                <span className="stat-strip-cell-label">Chips in Play</span>
                <span className="stat-strip-cell-value-sm">
                  {formatChips(summary.chipsUnaccounted)}
                </span>
              </div>
              {liveStacks !== null && (
                <div className="stat-strip-cell">
                  <span className="stat-strip-cell-label">Live Stacks</span>
                  <span className="stat-strip-cell-value-sm">{formatChips(liveStacks)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
