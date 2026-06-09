import { jsPDF } from 'jspdf';
import type { PokerSession } from '../types';
import {
  getPlayerCashInvested,
  getPlayerCashOut,
  getPlayerChipsReceived,
  getPlayerProfitCash,
  getPlayerProfitChips,
  getSessionSummary,
} from './calculations';
import { formatChips, formatCurrency, formatDateTime, formatDuration } from './format';

export function exportSessionCSV(session: PokerSession): void {
  const summary = getSessionSummary(session);
  const lines: string[] = [
    'Poker Night Session Summary',
    `Date,${formatDateTime(session.startTime)}`,
    `Chip Value,${session.chipValue.cash} ${session.currency} = ${session.chipValue.chips} chips`,
    `Currency,${session.currency}`,
    `Status,${session.status}`,
    `Cash Collected,${summary.totalCashCollected}`,
    `Cash Paid Out,${summary.totalCashOuts}`,
    `Chips Issued,${summary.totalChipsIssued}`,
    `Chips Cashed Out,${summary.totalChipsCashedOut}`,
    `Balanced,${summary.isCashBalanced && summary.chipsUnaccounted === 0}`,
    '',
    'Player,Buy-ins,Cash Invested,Chips Received,Cash-out,Chips Out,Cash P/L,Chip P/L,Status',
  ];

  for (const player of session.players) {
    const invested = getPlayerCashInvested(player);
    const chipsIn = getPlayerChipsReceived(player);
    const cashOut = getPlayerCashOut(player, session.chipValue);
    const profitCash = getPlayerProfitCash(player, session.chipValue);
    const profitChips = getPlayerProfitChips(player);
    lines.push(
      [
        `"${player.name}"`,
        player.buyIns.length,
        invested,
        chipsIn,
        cashOut ?? '',
        player.cashOutChips ?? '',
        profitCash ?? '',
        profitChips ?? '',
        player.status,
      ].join(',')
    );
  }

  if (session.blindPlan) {
    const plan = session.blindPlan;
    lines.push(
      '',
      'Blind Structure',
      `Players,${plan.config.numPlayers}`,
      `Starting Stack,${plan.config.startingStack}`,
      `Total Chips In Play,${plan.totalChipsInPlay}`,
      `Levels,${plan.numLevels}`,
      `Round Length,${plan.config.roundLengthMinutes} min`,
      '',
      'Level,Small Blind,Big Blind,Round Start',
      ...plan.levels.map(
        (l) => `${l.level},${l.smallBlind},${l.bigBlind},+${l.roundStartMinutes}min`
      )
    );
  }

  if (session.notes) {
    lines.push('', `Notes,"${session.notes.replace(/"/g, '""')}"`);
  }

  downloadBlob(
    new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }),
    `poker-session-${session.id.slice(0, 8)}.csv`
  );
}

export function exportSessionPDF(session: PokerSession): void {
  const summary = getSessionSummary(session);
  const doc = new jsPDF();
  let y = 20;

  const addLine = (text: string, size = 11) => {
    doc.setFontSize(size);
    doc.text(text, 14, y);
    y += size === 16 ? 10 : 7;
  };

  addLine('Poker Night Session Summary', 16);
  addLine(`Started: ${formatDateTime(session.startTime)}`);
  if (session.endTime) {
    addLine(`Ended: ${formatDateTime(session.endTime)}`);
    if (summary.durationMs) {
      addLine(`Duration: ${formatDuration(summary.durationMs)}`);
    }
  }
  addLine(
    `Chip value: ${formatCurrency(session.chipValue.cash, session.currency)} = ${formatChips(session.chipValue.chips)} chips`
  );
  if (session.blindPlan) {
    const plan = session.blindPlan;
    addLine(
      `Blind plan: ${plan.config.numPlayers} players, ${formatChips(plan.config.startingStack)} stack, ${plan.numLevels} levels`
    );
    for (const level of plan.levels) {
      const startMin =
        level.roundStartMinutes ?? (level.level - 1) * plan.config.roundLengthMinutes;
      addLine(
        `  L${level.level}: ${formatChips(level.smallBlind)} / ${formatChips(level.bigBlind)} (+${startMin}min)`
      );
    }
  } else if (session.blindLevels) {
    addLine(`Blinds: ${session.blindLevels}`);
  }
  y += 4;

  addLine('Players', 13);
  for (const player of session.players) {
    const profit = getPlayerProfitCash(player, session.chipValue);
    const chipsIn = getPlayerChipsReceived(player);
    addLine(
      `${player.name} | ${player.buyIns.length} buy-ins | ${formatChips(chipsIn)} chips | Out: ${formatCurrency(getPlayerCashOut(player, session.chipValue) ?? 0, session.currency)} | P/L: ${formatCurrency(profit ?? 0, session.currency)}`
    );
  }

  y += 4;
  addLine(`Cash collected: ${formatCurrency(summary.totalCashCollected, session.currency)}`);
  addLine(`Chips issued: ${formatChips(summary.totalChipsIssued)}`);
  addLine(
    `Balance: ${summary.isCashBalanced && summary.chipsUnaccounted === 0 ? 'OK' : 'MISMATCH'}`
  );

  if (summary.biggestWinner) {
    addLine(
      `Biggest winner: ${summary.biggestWinner.name} (+${formatCurrency(summary.biggestWinner.profit, session.currency)})`
    );
  }
  if (summary.biggestLoser) {
    addLine(
      `Biggest loser: ${summary.biggestLoser.name} (${formatCurrency(summary.biggestLoser.loss, session.currency)})`
    );
  }

  if (session.notes) {
    y += 4;
    addLine(`Notes: ${session.notes}`);
  }

  doc.save(`poker-session-${session.id.slice(0, 8)}.pdf`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
