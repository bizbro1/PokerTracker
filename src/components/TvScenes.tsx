import { useEffect, useState } from 'react';
import type { Player, PokerSession } from '../types';
import {
  getPlayerLiveProfitCash,
  getPlayerProfitCash,
  getTotalPotCash,
} from '../utils/calculations';
import { getCurrentBlindLevel, getLevelStartMinutes } from '../utils/blindStructure';
import {
  formatChips,
  formatCurrency,
  formatProfitLoss,
} from '../utils/format';
import { HAND_RANKINGS } from '../utils/pokerHands';
import { PlayingCard } from './PlayingCard';

export interface LeaderboardRow {
  player: Player;
  chips: number | null;
  profit: number | null;
}

export function buildLeaderboard(session: PokerSession): LeaderboardRow[] {
  const rows: LeaderboardRow[] = session.players.map((player) => {
    if (player.status === 'playing') {
      return {
        player,
        chips: player.currentStackChips,
        profit: getPlayerLiveProfitCash(player, session.chipValue),
      };
    }
    return {
      player,
      chips: player.cashOutChips,
      profit: getPlayerProfitCash(player, session.chipValue),
    };
  });

  // Playing players with known stacks first (by stack), then playing without
  // a count, then settled players (by their final chips)
  const rank = (row: LeaderboardRow) => {
    if (row.player.status === 'playing') return row.chips !== null ? 0 : 1;
    return 2;
  };
  return rows.sort((a, b) => rank(a) - rank(b) || (b.chips ?? 0) - (a.chips ?? 0));
}

const SERIES_COLORS = [
  '#e2b14d',
  '#4dc97d',
  '#5aa0e8',
  '#e25c5c',
  '#b07ce8',
  '#4ecbc4',
  '#e8915a',
  '#e070b0',
  '#a8c84d',
  '#7d8fe8',
];

/* ---------------------------------- Chip race --------------------------------- */

export function TvChipRace({ session }: { session: PokerSession }) {
  const rows = session.players
    .filter((p) => p.status === 'playing')
    .map((p) => ({ player: p, chips: p.currentStackChips }))
    .sort((a, b) => (b.chips ?? -1) - (a.chips ?? -1));
  const max = Math.max(...rows.map((r) => r.chips ?? 0), 1);

  return (
    <div className="tv-scene-inner">
      <span className="tv-scene-title">Chip Race</span>
      {rows.length === 0 ? (
        <p className="tv-scene-empty">No players yet</p>
      ) : (
        <div className="tv-race">
          {rows.map(({ player, chips }, i) => (
            <div key={player.id} className="tv-race-row">
              <span className="tv-race-name">{player.name}</span>
              <div className="tv-race-track">
                <div
                  className={`tv-race-bar ${i === 0 && chips !== null ? 'tv-race-bar-leader' : ''}`}
                  style={{ width: chips !== null ? `${Math.max((chips / max) * 100, 2)}%` : '0%' }}
                />
                <span className="tv-race-value">
                  {chips !== null ? formatChips(chips) : 'no count yet'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Stack progression ------------------------------ */

const CHART = { w: 1000, h: 480, left: 80, right: 36, top: 24, bottom: 44 };

export function TvProgression({ session }: { session: PokerSession }) {
  const players = session.players.filter((p) => p.stackHistory.length > 0);
  const allPoints = players.flatMap((p) => p.stackHistory);

  if (players.length === 0 || allPoints.length < 2) {
    return (
      <div className="tv-scene-inner">
        <span className="tv-scene-title">Stack Progression</span>
        <p className="tv-scene-empty">
          The chart draws itself as players update their stacks
        </p>
      </div>
    );
  }

  const t0 = Math.min(
    new Date(session.startTime).getTime(),
    ...allPoints.map((s) => new Date(s.t).getTime())
  );
  const t1 = Math.max(Date.now(), t0 + 60000);
  const maxChips = Math.max(...allPoints.map((s) => s.chips), 1) * 1.08;

  const px = (t: number) =>
    CHART.left + ((t - t0) / (t1 - t0)) * (CHART.w - CHART.left - CHART.right);
  const py = (chips: number) =>
    CHART.top + (1 - chips / maxChips) * (CHART.h - CHART.top - CHART.bottom);

  const gridLines = [0.25, 0.5, 0.75, 1].map((f) => ({
    y: py(maxChips * f),
    label: formatChips(Math.round(maxChips * f)),
  }));

  const fmtTime = (t: number) =>
    new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="tv-scene-inner">
      <span className="tv-scene-title">Stack Progression</span>
      <div className="tv-chart-wrap">
        <svg
          className="tv-chart"
          viewBox={`0 0 ${CHART.w} ${CHART.h}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {gridLines.map((g) => (
            <g key={g.y}>
              <line
                x1={CHART.left}
                x2={CHART.w - CHART.right}
                y1={g.y}
                y2={g.y}
                className="tv-chart-grid"
              />
              <text x={CHART.left - 10} y={g.y + 4} className="tv-chart-label" textAnchor="end">
                {g.label}
              </text>
            </g>
          ))}
          <text
            x={CHART.left}
            y={CHART.h - 14}
            className="tv-chart-label"
            textAnchor="start"
          >
            {fmtTime(t0)}
          </text>
          <text
            x={CHART.w - CHART.right}
            y={CHART.h - 14}
            className="tv-chart-label"
            textAnchor="end"
          >
            {fmtTime(t1)}
          </text>
          {players.map((p, i) => {
            const pts = p.stackHistory
              .map((s) => ({ t: new Date(s.t).getTime(), chips: s.chips }))
              .sort((a, b) => a.t - b.t);
            const coords = pts.map((s) => `${px(s.t)},${py(s.chips)}`);
            // Still-playing players hold their last value through to "now"
            if (p.status === 'playing') {
              coords.push(`${px(t1)},${py(pts[pts.length - 1].chips)}`);
            }
            const color = SERIES_COLORS[i % SERIES_COLORS.length];
            const last = pts[pts.length - 1];
            return (
              <g key={p.id}>
                <polyline
                  points={coords.join(' ')}
                  fill="none"
                  stroke={color}
                  strokeWidth={3.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={p.status === 'playing' ? 1 : 0.4}
                />
                <circle
                  cx={p.status === 'playing' ? px(t1) : px(last.t)}
                  cy={py(last.chips)}
                  r={6}
                  fill={color}
                  opacity={p.status === 'playing' ? 1 : 0.4}
                />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="tv-chart-legend">
        {players.map((p, i) => (
          <span
            key={p.id}
            className={`tv-legend-item ${p.status !== 'playing' ? 'tv-legend-out' : ''}`}
          >
            <span
              className="tv-legend-dot"
              style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }}
            />
            {p.name}
          </span>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- Profit / Loss -------------------------------- */

export function TvPLBoard({ session }: { session: PokerSession }) {
  const rows = buildLeaderboard(session)
    .filter((r) => r.profit !== null)
    .sort((a, b) => (b.profit ?? 0) - (a.profit ?? 0));
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.profit ?? 0)), 1);

  return (
    <div className="tv-scene-inner">
      <span className="tv-scene-title">Profit / Loss</span>
      {rows.length === 0 ? (
        <p className="tv-scene-empty">
          Stats appear once players enter their stacks
        </p>
      ) : (
        <div className="tv-pl">
          {rows.map(({ player, profit }) => {
            const value = profit ?? 0;
            const width = Math.max((Math.abs(value) / maxAbs) * 50, 1);
            return (
              <div key={player.id} className="tv-pl-row">
                <span className="tv-pl-name">{player.name}</span>
                <div className="tv-pl-track">
                  <div
                    className={`tv-pl-bar ${value >= 0 ? 'tv-pl-bar-pos' : 'tv-pl-bar-neg'}`}
                    style={
                      value >= 0
                        ? { left: '50%', width: `${width}%` }
                        : { right: '50%', width: `${width}%` }
                    }
                  />
                </div>
                <span className={`tv-pl-value ${value > 0 ? 'profit' : value < 0 ? 'loss' : ''}`}>
                  {formatProfitLoss(value, session.currency)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- Night stats --------------------------------- */

export function TvStats({ session }: { session: PokerSession }) {
  const playing = session.players.filter((p) => p.status === 'playing');
  const knownStacks = playing.filter((p) => p.currentStackChips !== null);

  const leader =
    knownStacks.length > 0
      ? knownStacks.reduce((best, p) =>
          (p.currentStackChips ?? 0) > (best.currentStackChips ?? 0) ? p : best
        )
      : null;

  const avgStack =
    knownStacks.length > 0
      ? Math.round(
          knownStacks.reduce((sum, p) => sum + (p.currentStackChips ?? 0), 0) /
            knownStacks.length
        )
      : null;

  const totalRebuys = session.players.reduce(
    (sum, p) => sum + Math.max(p.buyIns.length - 1, 0),
    0
  );
  const rebuyKing = session.players.reduce<Player | null>(
    (best, p) =>
      p.buyIns.length > 1 && p.buyIns.length > (best?.buyIns.length ?? 1) ? p : best,
    null
  );

  const stats: { label: string; value: string; sub?: string; gold?: boolean }[] = [
    {
      label: 'Chip Leader',
      value: leader ? leader.name : '—',
      sub: leader ? formatChips(leader.currentStackChips ?? 0) : undefined,
      gold: true,
    },
    {
      label: 'Total Pot',
      value: formatCurrency(getTotalPotCash(session), session.currency),
    },
    {
      label: 'Players Left',
      value: `${playing.length} / ${session.players.length}`,
    },
    {
      label: 'Average Stack',
      value: avgStack !== null ? formatChips(avgStack) : '—',
    },
    {
      label: 'Total Rebuys',
      value: String(totalRebuys),
    },
    {
      label: 'Rebuy King',
      value: rebuyKing ? rebuyKing.name : '—',
      sub: rebuyKing ? `${rebuyKing.buyIns.length} buy-ins` : undefined,
    },
  ];

  return (
    <div className="tv-scene-inner">
      <span className="tv-scene-title">Tonight's Stats</span>
      <div className="tv-stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="tv-stats-card">
            <span className="tv-stats-label">{s.label}</span>
            <span className={`tv-stats-value ${s.gold ? 'tv-stats-gold' : ''}`}>
              {s.value}
            </span>
            {s.sub && <span className="tv-stats-sub">{s.sub}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- Blind schedule -------------------------------- */

export function TvSchedule({
  session,
  elapsedMs,
}: {
  session: PokerSession;
  elapsedMs: number;
}) {
  const plan = session.blindPlan;
  if (!plan) return null;

  const current = getCurrentBlindLevel(plan, Math.floor(elapsedMs / 60000));
  const upcoming = plan.levels
    .filter((l) => l.level >= current.level)
    .slice(0, 5);

  return (
    <div className="tv-scene-inner">
      <span className="tv-scene-title">Blind Schedule</span>
      <div className="tv-schedule">
        {upcoming.map((level) => {
          const startsInMs = getLevelStartMinutes(level, plan) * 60000 - elapsedMs;
          const isCurrent = level.level === current.level;
          return (
            <div
              key={level.level}
              className={`tv-sched-row ${isCurrent ? 'tv-sched-current' : ''}`}
            >
              <span className="tv-sched-level">Level {level.level}</span>
              <span className="tv-sched-blinds">
                {formatChips(level.smallBlind)} / {formatChips(level.bigBlind)}
              </span>
              <span className="tv-sched-time">
                {isCurrent
                  ? 'Now'
                  : startsInMs <= 0
                    ? '—'
                    : `in ${Math.ceil(startsInMs / 60000)}m`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------- Join screen --------------------------------- */

export function TvJoin({ session }: { session: PokerSession }) {
  const [qr, setQr] = useState<string | null>(null);
  const url = `${window.location.origin}/join/${session.joinCode}`;

  useEffect(() => {
    let cancelled = false;
    void import('qrcode').then((QRCode) =>
      QRCode.toDataURL(url, {
        width: 512,
        margin: 1,
        color: { dark: '#10141c', light: '#f3e7cd' },
      }).then((dataUrl) => {
        if (!cancelled) setQr(dataUrl);
      })
    );
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="tv-scene-inner">
      <span className="tv-scene-title">Join the Game</span>
      <div className="tv-join">
        {qr && <img className="tv-join-qr" src={qr} alt="QR code to join" />}
        <div className="tv-join-info">
          <span className="tv-join-label">Scan or enter the code</span>
          <span className="tv-join-code">{session.joinCode}</span>
          <span className="tv-join-url">{window.location.host}/join</span>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- Hand rankings -------------------------------- */

export function TvHandRankings() {
  return (
    <div className="tv-scene-inner">
      <span className="tv-scene-title">Hand Rankings</span>
      <div className="tv-hands-grid">
        {HAND_RANKINGS.map((hand) => (
          <div key={hand.rank} className="tv-hand">
            <span className="tv-hand-rank">{hand.rank}</span>
            <span className="tv-hand-name">{hand.name}</span>
            <span className="tv-hand-cards">
              {hand.example.map((card, i) => (
                <PlayingCard key={i} card={card} small />
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
