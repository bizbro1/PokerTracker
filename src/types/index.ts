export type PlayerStatus = 'playing' | 'busted' | 'cashed_out';
export type SessionStatus = 'active' | 'closed';

export interface BuyIn {
  id: string;
  cashAmount: number;
  chips: number;
}

export interface StackSnapshot {
  /** ISO timestamp */
  t: string;
  chips: number;
}

export interface Player {
  id: string;
  name: string;
  buyIns: BuyIn[];
  cashOutChips: number | null;
  currentStackChips: number | null;
  stackHistory: StackSnapshot[];
  rebuyRequested: boolean;
  status: PlayerStatus;
}

export interface ChipValue {
  cash: number;
  chips: number;
}

export interface BlindLevel {
  level: number;
  smallBlind: number;
  bigBlind: number;
  roundStartMinutes: number;
}

export interface BlindPlanConfig {
  numPlayers: number;
  sessionDurationHours: number;
  roundLengthMinutes: number;
  startingStack: number;
  smallestChipDenomination: number;
}

export interface BlindPlan {
  config: BlindPlanConfig;
  totalChipsInPlay: number;
  numLevels: number;
  levels: BlindLevel[];
  warnings: string[];
}

export interface PokerSession {
  id: string;
  joinCode: string;
  hostPin: string | null;
  chipValue: ChipValue;
  defaultBuyInCash: number;
  currency: string;
  startTime: string;
  endTime: string | null;
  blindLevels: string;
  blindPlan: BlindPlan | null;
  blindTimerPausedAt: string | null;
  blindTimerTotalPausedMs: number;
  notes: string;
  players: Player[];
  status: SessionStatus;
  createdAt: string;
}

export interface PlayerStats {
  name: string;
  sessionsPlayed: number;
  totalInvested: number;
  totalCashOut: number;
  netProfit: number;
  wins: number;
  losses: number;
}

export interface SessionSummary {
  totalCashCollected: number;
  totalCashOuts: number;
  totalChipsIssued: number;
  totalChipsCashedOut: number;
  chipsUnaccounted: number;
  cashPerChip: number;
  isCashBalanced: boolean;
  cashOutExceedsCollected: boolean;
  durationMs: number | null;
  biggestWinner: { name: string; profit: number } | null;
  biggestLoser: { name: string; loss: number } | null;
}
