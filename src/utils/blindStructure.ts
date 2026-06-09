import type { BlindLevel, BlindPlan, BlindPlanConfig } from '../types';

/**
 * Standard big-blind multipliers relative to the smallest chip denomination.
 * Matches common tournament blind schedules (e.g. 25 → 50/100/200/350/600/…).
 */
const BB_MULT_SEQUENCE = [2, 4, 8, 14, 24, 48, 80, 160, 320, 640, 1280, 2560];

export function calculateNumLevels(
  sessionDurationHours: number,
  roundLengthMinutes: number
): number {
  if (roundLengthMinutes <= 0) return 1;
  return Math.max(1, Math.floor((sessionDurationHours * 60) / roundLengthMinutes));
}

/** Starting BB = 2× smallest chip (SB = smallest chip). */
export function getTargetStartBB(config: BlindPlanConfig): number {
  return 2 * config.smallestChipDenomination;
}

/** Ending BB ≈ 40% of starting stack — standard tournament target. */
export function getTargetEndBB(config: BlindPlanConfig): number {
  return config.startingStack * 0.4;
}

export function buildBBLadder(smallestDenom: number, endBB: number): number[] {
  const ladder: number[] = [];

  for (const mult of BB_MULT_SEQUENCE) {
    const bb = mult * smallestDenom;
    if (bb > endBB * 1.05) break;
    ladder.push(bb);
  }

  const last = ladder[ladder.length - 1];
  if (!last || last < endBB * 0.95) {
    ladder.push(endBB);
  }

  return ladder;
}

export function generateBlindStructure(config: BlindPlanConfig): BlindLevel[] {
  const numLevels = calculateNumLevels(
    config.sessionDurationHours,
    config.roundLengthMinutes
  );

  const startBB = getTargetStartBB(config);
  const endBB = Math.max(startBB, getTargetEndBB(config));
  const ladder = buildBBLadder(config.smallestChipDenomination, endBB);

  const levels: BlindLevel[] = [];

  for (let i = 0; i < numLevels; i++) {
    const t = numLevels === 1 ? 0 : i / (numLevels - 1);
    const idx = Math.round(t * (ladder.length - 1));
    const bb = ladder[Math.min(idx, ladder.length - 1)];

    levels.push({
      level: i + 1,
      smallBlind: bb / 2,
      bigBlind: bb,
      roundStartMinutes: i * config.roundLengthMinutes,
    });
  }

  return levels;
}

export function formatBlindLevelsSummary(levels: BlindLevel[]): string {
  return levels.map((l) => `${l.smallBlind}/${l.bigBlind}`).join(', ');
}

export function formatRoundStart(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `+${h}:${m.toString().padStart(2, '0')}`;
}

export function getLevelStartMinutes(level: BlindLevel, plan: BlindPlan): number {
  return level.roundStartMinutes ?? (level.level - 1) * plan.config.roundLengthMinutes;
}

export function getCurrentBlindLevel(plan: BlindPlan, elapsedMinutes: number): BlindLevel {
  let current = plan.levels[0];
  for (const level of plan.levels) {
    if (getLevelStartMinutes(level, plan) <= elapsedMinutes) {
      current = level;
    } else {
      break;
    }
  }
  return current;
}

export function getMinutesUntilNextLevel(
  plan: BlindPlan,
  elapsedMinutes: number
): number | null {
  const current = getCurrentBlindLevel(plan, elapsedMinutes);
  const next = plan.levels.find((l) => l.level === current.level + 1);
  if (!next) return null;
  return Math.max(0, getLevelStartMinutes(next, plan) - elapsedMinutes);
}
