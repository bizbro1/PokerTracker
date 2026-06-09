import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSessions } from '../hooks/useSessions';
import { useWakeLock } from '../hooks/useWakeLock';
import { getCurrentBlindLevel, getLevelStartMinutes } from '../utils/blindStructure';
import { getEffectiveBlindElapsedMs, isBlindTimerPaused } from '../utils/blindTimer';
import { getTotalPotCash } from '../utils/calculations';
import { formatChips, formatCurrency, formatDuration } from '../utils/format';
import { isHostDevice } from '../utils/hostDevice';
import { playBlindLevelUpSound } from '../utils/sound';

function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function TvMode() {
  const { activeSession, toggleBlindTimerPause } = useSessions();
  const prevLevelRef = useRef<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useWakeLock(true);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

  const session = activeSession;
  const plan = session?.blindPlan ?? null;
  const paused = session ? isBlindTimerPaused(session) : false;
  const elapsedMs = session ? getEffectiveBlindElapsedMs(session) : 0;
  const elapsedMinutes = Math.floor(elapsedMs / 60000);
  const current = plan ? getCurrentBlindLevel(plan, elapsedMinutes) : null;
  const next =
    plan && current ? (plan.levels.find((l) => l.level === current.level + 1) ?? null) : null;

  // `now` drives the re-render tick; elapsedMs above recomputes from it
  void now;

  useEffect(() => {
    if (!plan || paused || session?.status !== 'active') return;
    const level = current?.level ?? null;
    if (level !== null && prevLevelRef.current !== null && level > prevLevelRef.current) {
      playBlindLevelUpSound();
    }
    if (level !== null) prevLevelRef.current = level;
  }, [current?.level, plan, paused, session?.status]);

  if (!session) {
    return (
      <div className="tv">
        <div className="tv-empty">
          <span className="tv-empty-icon">♠</span>
          <p>No active session</p>
          <Link to="/" className="btn btn-secondary">
            Back to App
          </Link>
        </div>
      </div>
    );
  }

  const totalPot = getTotalPotCash(session);
  const isHost = isHostDevice(session.id);

  // Seconds-precision countdown + level progress
  let remainingMs: number | null = null;
  let progress = 0;
  if (plan && current) {
    const currentStartMs = getLevelStartMinutes(current, plan) * 60000;
    if (next) {
      const nextStartMs = getLevelStartMinutes(next, plan) * 60000;
      remainingMs = Math.max(0, nextStartMs - elapsedMs);
      const levelLength = nextStartMs - currentStartMs;
      progress = levelLength > 0 ? Math.min(1, (elapsedMs - currentStartMs) / levelLength) : 0;
    } else {
      progress = 1;
    }
  }

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div className={`tv ${paused ? 'tv-paused' : ''}`}>
      <div className="tv-top">
        <Link to="/session" className="tv-brand">
          ♠ Poker Night
        </Link>
        <div className="tv-top-right">
          <div className="tv-pot">
            <span className="tv-pot-label">Pot</span>
            <span className="tv-pot-value">{formatCurrency(totalPot, session.currency)}</span>
          </div>
          <button type="button" className="tv-icon-btn" onClick={handleFullscreen}>
            ⛶
          </button>
        </div>
      </div>

      <div className="tv-center">
        {current ? (
          <>
            <span className="tv-level-tag">
              Level {current.level}
              {plan && <span className="tv-level-total"> / {plan.numLevels}</span>}
            </span>
            <div className="tv-blinds">
              {formatChips(current.smallBlind)}
              <span className="tv-blinds-sep">/</span>
              {formatChips(current.bigBlind)}
            </div>
            {remainingMs !== null ? (
              <div className="tv-clock">{paused ? 'PAUSED' : formatClock(remainingMs)}</div>
            ) : (
              <div className="tv-clock tv-clock-final">
                {paused ? 'PAUSED' : 'FINAL LEVEL'}
              </div>
            )}
            <div className="tv-progress">
              <div className="tv-progress-fill" style={{ width: `${progress * 100}%` }} />
            </div>
          </>
        ) : (
          <>
            <span className="tv-level-tag">Cash Game</span>
            <div className="tv-blinds">{formatCurrency(totalPot, session.currency)}</div>
            <div className="tv-clock">{formatDuration(elapsedMs)}</div>
          </>
        )}
      </div>

      {session.players.length > 0 && (
        <div className="tv-players">
          {session.players.map((p) => (
            <div
              key={p.id}
              className={`tv-player ${p.status !== 'playing' ? 'tv-player-out' : ''}`}
            >
              <span className="tv-player-name">{p.name}</span>
              <span
                className={`tv-player-sub ${p.status === 'busted' ? 'tv-player-busted' : ''}`}
              >
                {p.status === 'playing'
                  ? p.currentStackChips !== null
                    ? formatChips(p.currentStackChips)
                    : `${p.buyIns.length} buy-in${p.buyIns.length === 1 ? '' : 's'}`
                  : p.status === 'busted'
                    ? 'Busted'
                    : 'Cashed out'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="tv-bottom">
        <div className="tv-stat">
          <span className="tv-stat-label">Duration</span>
          <span className="tv-stat-value">{formatDuration(elapsedMs)}</span>
        </div>
        {next && (
          <div className="tv-stat">
            <span className="tv-stat-label">Next Blinds</span>
            <span className="tv-stat-value">
              {formatChips(next.smallBlind)} / {formatChips(next.bigBlind)}
            </span>
          </div>
        )}
        {session.joinCode && (
          <div className="tv-stat">
            <span className="tv-stat-label">Join Code</span>
            <span className="tv-stat-value tv-stat-gold">{session.joinCode}</span>
          </div>
        )}
        {isHost && plan && (
          <button
            type="button"
            className={`btn ${paused ? 'btn-primary' : 'btn-ghost'} tv-pause-btn`}
            onClick={() => toggleBlindTimerPause(session.id)}
          >
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
        )}
      </div>
    </div>
  );
}
