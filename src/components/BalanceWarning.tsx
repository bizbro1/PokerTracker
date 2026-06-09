import type { PokerSession } from '../types';
import { getSessionSummary } from '../utils/calculations';
import { formatChips, formatCurrency } from '../utils/format';

interface BalanceWarningProps {
  session: PokerSession;
}

export function BalanceWarning({ session }: BalanceWarningProps) {
  const summary = getSessionSummary(session);
  const allSettled = session.players.every(
    (p) => p.status === 'busted' || p.status === 'cashed_out'
  );
  const showBalance = allSettled || session.status === 'closed';

  return (
    <>
      {summary.cashOutExceedsCollected && (
        <div className="alert alert-danger">
          <strong>Cash-out exceeds collection!</strong> Total cash paid out (
          {formatCurrency(summary.totalCashOuts, session.currency)}) is more than cash collected
          from buy-ins ({formatCurrency(summary.totalCashCollected, session.currency)}).
        </div>
      )}

      {summary.chipsUnaccounted > 0 && session.status === 'active' && (
        <div className="alert alert-info">
          <strong>{formatChips(summary.chipsUnaccounted)} chips</strong> still in play — not yet
          cashed out by active players.
        </div>
      )}

      {showBalance && (
        <>
          {summary.isCashBalanced && summary.chipsUnaccounted === 0 ? (
            <div className="alert alert-success">
              Books balanced — cash and chips fully accounted for (
              {formatCurrency(summary.totalCashCollected, session.currency)},{' '}
              {formatChips(summary.totalChipsIssued)} chips).
            </div>
          ) : (
            <div className="alert alert-warning">
              {!summary.isCashBalanced && (
                <div>
                  <strong>Cash mismatch!</strong> Collected{' '}
                  {formatCurrency(summary.totalCashCollected, session.currency)} but paid out{' '}
                  {formatCurrency(summary.totalCashOuts, session.currency)}. Difference:{' '}
                  {formatCurrency(
                    summary.totalCashCollected - summary.totalCashOuts,
                    session.currency
                  )}
                  .
                </div>
              )}
              {summary.chipsUnaccounted !== 0 && (
                <div>
                  <strong>Chip mismatch!</strong>{' '}
                  {formatChips(Math.abs(summary.chipsUnaccounted))} chips{' '}
                  {summary.chipsUnaccounted > 0 ? 'unaccounted' : 'over-cashed'}.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
