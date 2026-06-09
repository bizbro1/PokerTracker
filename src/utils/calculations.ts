import type { ChipValue, Player, PokerSession, PlayerStats, SessionSummary } from '../types';

export function generateId(): string {
  return crypto.randomUUID();
}

export function cashToChips(cash: number, chipValue: ChipValue): number {
  if (chipValue.cash <= 0) return 0;
  return Math.round((cash / chipValue.cash) * chipValue.chips);
}

export function chipsToCash(chips: number, chipValue: ChipValue): number {
  if (chipValue.chips <= 0) return 0;
  return (chips / chipValue.chips) * chipValue.cash;
}

export function getCashPerChip(chipValue: ChipValue): number {
  if (chipValue.chips <= 0) return 0;
  return chipValue.cash / chipValue.chips;
}

export function getPlayerCashInvested(player: Player): number {
  return player.buyIns.reduce((sum, b) => sum + b.cashAmount, 0);
}

export function getPlayerChipsReceived(player: Player): number {
  return player.buyIns.reduce((sum, b) => sum + b.chips, 0);
}

export function getPlayerCashOut(player: Player, chipValue: ChipValue): number | null {
  if (player.cashOutChips === null) return null;
  return chipsToCash(player.cashOutChips, chipValue);
}

export function getPlayerProfitCash(player: Player, chipValue: ChipValue): number | null {
  const cashOut = getPlayerCashOut(player, chipValue);
  if (cashOut === null) return null;
  return cashOut - getPlayerCashInvested(player);
}

export function getPlayerProfitChips(player: Player): number | null {
  if (player.cashOutChips === null) return null;
  return player.cashOutChips - getPlayerChipsReceived(player);
}

export function getTotalCashCollected(session: PokerSession): number {
  return session.players.reduce((sum, p) => sum + getPlayerCashInvested(p), 0);
}

export function getTotalPotCash(session: PokerSession): number {
  return getTotalCashCollected(session);
}

export function getPlayerLiveProfitCash(player: Player, chipValue: ChipValue): number | null {
  if (player.status !== 'playing' || player.currentStackChips === null) return null;
  return chipsToCash(player.currentStackChips, chipValue) - getPlayerCashInvested(player);
}

export function getPlayerLiveProfitChips(player: Player): number | null {
  if (player.status !== 'playing' || player.currentStackChips === null) return null;
  return player.currentStackChips - getPlayerChipsReceived(player);
}

export function getTotalLiveStacksChips(session: PokerSession): number | null {
  const stacks = session.players
    .filter((p) => p.status === 'playing' && p.currentStackChips !== null)
    .map((p) => p.currentStackChips as number);
  if (stacks.length === 0) return null;
  return stacks.reduce((sum, chips) => sum + chips, 0);
}

export function getTotalCashOuts(session: PokerSession): number {
  return session.players.reduce((sum, p) => {
    const cashOut = getPlayerCashOut(p, session.chipValue);
    return sum + (cashOut ?? 0);
  }, 0);
}

export function getTotalChipsIssued(session: PokerSession): number {
  return session.players.reduce((sum, p) => sum + getPlayerChipsReceived(p), 0);
}

export function getTotalChipsCashedOut(session: PokerSession): number {
  return session.players.reduce((sum, p) => sum + (p.cashOutChips ?? 0), 0);
}

export function getChipsUnaccounted(session: PokerSession): number {
  return getTotalChipsIssued(session) - getTotalChipsCashedOut(session);
}

export function getSessionDurationMs(session: PokerSession): number | null {
  if (!session.endTime) return null;
  return new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
}

export function getSessionSummary(session: PokerSession): SessionSummary {
  const totalCashCollected = getTotalCashCollected(session);
  const totalCashOuts = getTotalCashOuts(session);
  const totalChipsIssued = getTotalChipsIssued(session);
  const totalChipsCashedOut = getTotalChipsCashedOut(session);

  const playerResults = session.players
    .map((p) => ({
      name: p.name,
      profit: getPlayerProfitCash(p, session.chipValue),
    }))
    .filter((p): p is { name: string; profit: number } => p.profit !== null);

  const winners = playerResults.filter((p) => p.profit > 0);
  const losers = playerResults.filter((p) => p.profit < 0);

  const biggestWinner =
    winners.length > 0
      ? winners.reduce((best, p) => (p.profit > best.profit ? p : best))
      : null;

  const biggestLoser =
    losers.length > 0
      ? losers.reduce((worst, p) => (p.profit < worst.profit ? p : worst))
      : null;

  return {
    totalCashCollected,
    totalCashOuts,
    totalChipsIssued,
    totalChipsCashedOut,
    chipsUnaccounted: totalChipsIssued - totalChipsCashedOut,
    cashPerChip: getCashPerChip(session.chipValue),
    isCashBalanced: Math.abs(totalCashCollected - totalCashOuts) < 0.01,
    cashOutExceedsCollected: totalCashOuts > totalCashCollected + 0.01,
    durationMs: getSessionDurationMs(session),
    biggestWinner: biggestWinner ? { name: biggestWinner.name, profit: biggestWinner.profit } : null,
    biggestLoser: biggestLoser ? { name: biggestLoser.name, loss: biggestLoser.profit } : null,
  };
}

export function aggregatePlayerStats(sessions: PokerSession[]): PlayerStats[] {
  const map = new Map<string, PlayerStats>();

  for (const session of sessions) {
    if (session.status !== 'closed') continue;

    for (const player of session.players) {
      const invested = getPlayerCashInvested(player);
      const cashOut = getPlayerCashOut(player, session.chipValue) ?? 0;
      const profit = cashOut - invested;

      const existing = map.get(player.name) ?? {
        name: player.name,
        sessionsPlayed: 0,
        totalInvested: 0,
        totalCashOut: 0,
        netProfit: 0,
        wins: 0,
        losses: 0,
      };

      existing.sessionsPlayed += 1;
      existing.totalInvested += invested;
      existing.totalCashOut += cashOut;
      existing.netProfit += profit;
      if (profit > 0) existing.wins += 1;
      if (profit < 0) existing.losses += 1;

      map.set(player.name, existing);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.netProfit - a.netProfit);
}
