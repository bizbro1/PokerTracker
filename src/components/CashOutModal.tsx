import { useState, type FormEvent } from 'react';
import type { ChipValue } from '../types';
import { chipsToCash } from '../utils/calculations';
import { formatChips, formatCurrency, formatProfitLoss } from '../utils/format';

interface CashOutModalProps {
  playerName: string;
  currency: string;
  chipValue: ChipValue;
  cashInvested: number;
  chipsReceived: number;
  onConfirm: (remainingChips: number) => void;
  onClose: () => void;
}

export function CashOutModal({
  playerName,
  currency,
  chipValue,
  cashInvested,
  chipsReceived,
  onConfirm,
  onClose,
}: CashOutModalProps) {
  const [chips, setChips] = useState('');

  const chipsNum = parseFloat(chips);
  const cashOut =
    !isNaN(chipsNum) && chipsNum >= 0 ? chipsToCash(chipsNum, chipValue) : null;
  const profit = cashOut !== null ? cashOut - cashInvested : null;
  const chipProfit = !isNaN(chipsNum) && chipsNum >= 0 ? chipsNum - chipsReceived : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isNaN(chipsNum) || chipsNum < 0) return;
    onConfirm(chipsNum);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Cash Out — {playerName}</h3>
        <p className="modal-context">
          Invested: {formatCurrency(cashInvested, currency)} ({formatChips(chipsReceived)} chips)
        </p>
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Remaining chips</span>
            <input
              type="number"
              min="0"
              step="1"
              value={chips}
              onChange={(e) => setChips(e.target.value)}
              placeholder="e.g. 8000"
              autoFocus
              required
            />
          </label>
          {cashOut !== null && (
            <div className="modal-preview cashout-preview">
              <div>
                Cash out: <strong>{formatCurrency(cashOut, currency)}</strong>
              </div>
              {profit !== null && (
                <div className={profit >= 0 ? 'profit' : 'loss'}>
                  P/L: {formatProfitLoss(profit, currency)}
                  {chipProfit !== null && (
                    <span className="chip-pl"> ({formatChips(chipProfit)} chips)</span>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Cash Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
