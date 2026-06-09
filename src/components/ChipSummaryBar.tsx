import type { PokerSession } from '../types';
import {
  getSessionSummary,
  getTotalLiveStacksChips,
  getTotalPotCash,
} from '../utils/calculations';
import { formatChips, formatCurrency } from '../utils/format';

interface ChipSummaryBarProps {
  session: PokerSession;
}

export function ChipSummaryBar({ session }: ChipSummaryBarProps) {
  const summary = getSessionSummary(session);
  const totalPot = getTotalPotCash(session);
  const liveStacks = getTotalLiveStacksChips(session);

  return (
    <div className="chip-summary">
      <div className="chip-summary-header">
        <span className="chip-rate">
          {formatCurrency(session.chipValue.cash, session.currency)} ={' '}
          {formatChips(session.chipValue.chips)} chips
        </span>
        <span className="chip-rate-sub">
          ({formatCurrency(summary.cashPerChip, session.currency)} per chip)
        </span>
      </div>
      <div className="summary-bar">
        <div className="summary-item highlight">
          <span className="summary-label">Total Pot</span>
          <span className="summary-value">{formatCurrency(totalPot, session.currency)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Cash Paid Out</span>
          <span className="summary-value">
            {formatCurrency(summary.totalCashOuts, session.currency)}
          </span>
        </div>
        <div className="summary-item highlight">
          <span className="summary-label">Chips Issued</span>
          <span className="summary-value">{formatChips(summary.totalChipsIssued)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Chips Cashed Out</span>
          <span className="summary-value">{formatChips(summary.totalChipsCashedOut)}</span>
        </div>
        <div
          className={`summary-item ${summary.chipsUnaccounted > 0 ? 'summary-warning' : ''}`}
        >
          <span className="summary-label">Chips in Play</span>
          <span className="summary-value">{formatChips(summary.chipsUnaccounted)}</span>
        </div>
        {liveStacks !== null && (
          <div className="summary-item highlight">
            <span className="summary-label">Live Stacks</span>
            <span className="summary-value">{formatChips(liveStacks)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
