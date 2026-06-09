import type { PokerSession } from '../types';
import { cashToChips, generateId } from './calculations';

interface LegacyPlayer {
  id: string;
  name: string;
  buyInCount?: number;
  buyIns?: PokerSession['players'][0]['buyIns'];
  cashOutAmount?: number | null;
  cashOutChips?: number | null;
  status: PokerSession['players'][0]['status'];
}

interface LegacySession {
  id: string;
  buyInAmount?: number;
  chipValue?: PokerSession['chipValue'];
  defaultBuyInCash?: number;
  currency: string;
  startTime: string;
  endTime: string | null;
  blindLevels: string;
  notes: string;
  players: LegacyPlayer[];
  status: PokerSession['status'];
  createdAt: string;
}

export function migrateSession(raw: LegacySession): PokerSession {
  if (raw.chipValue && raw.players.every((p) => Array.isArray(p.buyIns))) {
    const session = raw as PokerSession;
    return {
      ...session,
      blindPlan: session.blindPlan ?? null,
      blindTimerPausedAt: session.blindTimerPausedAt ?? null,
      blindTimerTotalPausedMs: session.blindTimerTotalPausedMs ?? 0,
      players: session.players.map((p) => ({
        ...p,
        currentStackChips: p.currentStackChips ?? null,
      })),
    };
  }

  const legacyBuyIn = raw.buyInAmount ?? 100;
  const chipValue = raw.chipValue ?? { cash: legacyBuyIn, chips: legacyBuyIn * 20 };

  const players = raw.players.map((p) => {
    if (Array.isArray(p.buyIns)) {
      const player = p as PokerSession['players'][0];
      return {
        id: p.id,
        name: p.name,
        buyIns: p.buyIns,
        cashOutChips: p.cashOutChips ?? null,
        currentStackChips: player.currentStackChips ?? null,
        status: p.status,
      };
    }

    const buyInCount = p.buyInCount ?? 0;
    const buyIns = Array.from({ length: buyInCount }, () => ({
      id: generateId(),
      cashAmount: legacyBuyIn,
      chips: cashToChips(legacyBuyIn, chipValue),
    }));

    let cashOutChips: number | null = null;
    if (p.cashOutAmount !== null && p.cashOutAmount !== undefined) {
      cashOutChips =
        p.cashOutAmount === 0
          ? 0
          : cashToChips(p.cashOutAmount, chipValue);
    }

    return {
      id: p.id,
      name: p.name,
      buyIns,
      cashOutChips,
      currentStackChips: null,
      status: p.status,
    };
  });

  return {
    id: raw.id,
    chipValue,
    defaultBuyInCash: raw.defaultBuyInCash ?? chipValue.cash,
    currency: raw.currency,
    startTime: raw.startTime,
    endTime: raw.endTime,
    blindLevels: raw.blindLevels,
    blindPlan: null,
    blindTimerPausedAt: null,
    blindTimerTotalPausedMs: 0,
    notes: raw.notes,
    players,
    status: raw.status,
    createdAt: raw.createdAt,
  };
}
