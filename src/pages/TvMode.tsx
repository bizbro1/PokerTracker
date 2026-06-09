import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSessions } from '../hooks/useSessions';
import { SessionEventToast } from '../components/SessionEventToast';
import { useSessionEventAlerts } from '../hooks/useSessionEventAlerts';
import { useWakeLock } from '../hooks/useWakeLock';
import { getCurrentBlindLevel, getLevelStartMinutes } from '../utils/blindStructure';
import { getEffectiveBlindElapsedMs, isBlindTimerPaused } from '../utils/blindTimer';
import { getTotalPotCash } from '../utils/calculations';
import type { PokerSession } from '../types';
import {
  formatChips,
  formatCurrency,
  formatDuration,
  formatProfitLoss,
} from '../utils/format';
import { isHostDevice } from '../utils/hostDevice';
import { playBlindLevelUpSound } from '../utils/sound';
import {
  buildLeaderboard,
  TvActivity,
  TvChipRace,
  TvHandRankings,
  TvJoin,
  TvPLBoard,
  TvProgression,
  TvSchedule,
  TvStats,
} from '../components/TvScenes';

type TvSceneId =
  | 'clock'
  | 'chiprace'
  | 'progression'
  | 'pl'
  | 'stats'
  | 'activity'
  | 'schedule'
  | 'join'
  | 'hands';

const SCENE_INTERVAL_MS = 2 * 60 * 1000;
const CLOCK_SNAP_BACK_MS = 60 * 1000;

function getScenes(session: PokerSession | null): TvSceneId[] {
  if (!session) return ['clock'];
  const scenes: TvSceneId[] = ['clock'];
  const hasPlayers = session.players.length > 0;
  if (hasPlayers) scenes.push('chiprace');
  if (session.players.some((p) => p.stackHistory.length >= 2)) scenes.push('progression');
  if (hasPlayers) scenes.push('pl', 'stats');
  if ((session.events ?? []).length > 0) scenes.push('activity');
  if (session.blindPlan) scenes.push('schedule');
  if (session.joinCode) scenes.push('join');
  scenes.push('hands');
  return scenes;
}

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
  const [sceneIdx, setSceneIdx] = useState(0);

  useWakeLock(true);
  const eventToast = useSessionEventAlerts(activeSession);

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

  const scenes = getScenes(session);
  const sceneCount = scenes.length;

  // Auto-advance; depends on sceneIdx so a manual change restarts the 2 min timer
  useEffect(() => {
    if (sceneCount <= 1) return;
    const id = setInterval(() => setSceneIdx((i) => i + 1), SCENE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [sceneCount, sceneIdx]);

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

  // Always snap back to the clock when a level change is imminent
  const forceClock =
    !paused && remainingMs !== null && remainingMs <= CLOCK_SNAP_BACK_MS;
  const activeIdx = sceneIdx % sceneCount;
  const scene: TvSceneId = forceClock ? 'clock' : scenes[activeIdx];

  const advanceScene = () => {
    if (sceneCount > 1) setSceneIdx((i) => i + 1);
  };

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div className={`tv ${paused ? 'tv-paused' : ''}`}>
      <SessionEventToast event={eventToast} className="event-toast-tv" />
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

      <div className="tv-body">
        <div className="tv-main">
          {scene === 'clock' ? (
            <div className="tv-center" onClick={advanceScene}>
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
                    <div className="tv-clock">
                      {paused ? 'PAUSED' : formatClock(remainingMs)}
                    </div>
                  ) : (
                    <div className="tv-clock tv-clock-final">
                      {paused ? 'PAUSED' : 'FINAL LEVEL'}
                    </div>
                  )}
                  <div className="tv-progress">
                    <div
                      className="tv-progress-fill"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <span className="tv-level-tag">Cash Game</span>
                  <div className="tv-blinds">
                    {formatCurrency(totalPot, session.currency)}
                  </div>
                  <div className="tv-clock">{formatDuration(elapsedMs)}</div>
                </>
              )}
            </div>
          ) : (
            <div className="tv-scene" key={scene} onClick={advanceScene}>
              {scene === 'chiprace' && <TvChipRace session={session} />}
              {scene === 'progression' && <TvProgression session={session} />}
              {scene === 'pl' && <TvPLBoard session={session} />}
              {scene === 'stats' && <TvStats session={session} />}
              {scene === 'activity' && <TvActivity session={session} />}
              {scene === 'schedule' && <TvSchedule session={session} elapsedMs={elapsedMs} />}
              {scene === 'join' && <TvJoin session={session} />}
              {scene === 'hands' && <TvHandRankings />}
            </div>
          )}

          {sceneCount > 1 && (
            <div className="tv-dots">
              {scenes.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  className={`tv-dot ${i === activeIdx && !forceClock ? 'tv-dot-active' : ''}`}
                  onClick={() => setSceneIdx(i)}
                  aria-label={`Scene: ${s}`}
                />
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

        {scene === 'clock' && session.players.length > 0 && (
          <aside className="tv-leaderboard">
            <span className="tv-lb-title">Leaderboard</span>
            <div className="tv-lb-list">
              {buildLeaderboard(session).map(({ player, chips, profit }, i) => (
                <div
                  key={player.id}
                  className={`tv-lb-row ${player.status !== 'playing' ? 'tv-lb-out' : ''}`}
                >
                  <span className="tv-lb-rank">{i + 1}</span>
                  <span className="tv-lb-name">{player.name}</span>
                  <span className="tv-lb-figures">
                    <span
                      className={`tv-lb-chips ${player.status === 'busted' ? 'tv-lb-busted' : ''}`}
                    >
                      {player.status === 'busted'
                        ? 'Busted'
                        : chips !== null
                          ? formatChips(chips)
                          : '—'}
                    </span>
                    <span
                      className={`tv-lb-pl ${
                        profit === null ? '' : profit > 0 ? 'profit' : profit < 0 ? 'loss' : ''
                      }`}
                    >
                      {profit !== null ? formatProfitLoss(profit, session.currency) : ''}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
