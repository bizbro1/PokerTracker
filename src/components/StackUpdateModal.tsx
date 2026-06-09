import { useMemo, useState, type FormEvent } from 'react';
import type { ChipValue } from '../types';
import { STACK_CHIP_DENOMINATIONS } from '../constants/chipDenominations';
import { chipsToCash } from '../utils/calculations';
import { formatChips, formatCurrency, formatProfitLoss } from '../utils/format';

type StackMode = 'breakdown' | 'total';

function createEmptyCounts(): Record<number, string> {
  return Object.fromEntries(STACK_CHIP_DENOMINATIONS.map((d) => [d, '']));
}

function sumBreakdown(counts: Record<number, string>): number {
  return STACK_CHIP_DENOMINATIONS.reduce((sum, denom) => {
    const qty = parseInt(counts[denom] || '0', 10);
    return sum + (isNaN(qty) || qty < 0 ? 0 : denom * qty);
  }, 0);
}

interface StackUpdateModalProps {
  playerName: string;
  currency: string;
  chipValue: ChipValue;
  cashInvested: number;
  chipsReceived: number;
  currentStack?: number | null;
  onConfirm: (stackChips: number) => void;
  onClose: () => void;
}

export function StackUpdateModal({
  playerName,
  currency,
  chipValue,
  cashInvested,
  chipsReceived,
  currentStack,
  onConfirm,
  onClose,
}: StackUpdateModalProps) {
  const [mode, setMode] = useState<StackMode>('breakdown');
  const [counts, setCounts] = useState<Record<number, string>>(createEmptyCounts);
  const [totalInput, setTotalInput] = useState(currentStack?.toString() ?? '');

  const breakdownTotal = useMemo(() => sumBreakdown(counts), [counts]);
  const stackChips = mode === 'breakdown' ? breakdownTotal : parseFloat(totalInput);

  const stackCash =
    !isNaN(stackChips) && stackChips >= 0 ? chipsToCash(stackChips, chipValue) : null;
  const profit = stackCash !== null ? stackCash - cashInvested : null;
  const chipProfit = !isNaN(stackChips) && stackChips >= 0 ? stackChips - chipsReceived : null;

  const updateCount = (denom: number, value: string) => {
    setCounts((prev) => ({ ...prev, [denom]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isNaN(stackChips) || stackChips < 0) return;
    onConfirm(stackChips);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h3>Current Stack — {playerName}</h3>
        <p className="modal-context">
          Invested: {formatCurrency(cashInvested, currency)} ({formatChips(chipsReceived)} chips)
        </p>

        <div className="stack-mode-tabs">
          <button
            type="button"
            className={`stack-mode-tab ${mode === 'breakdown' ? 'active' : ''}`}
            onClick={() => setMode('breakdown')}
          >
            By denomination
          </button>
          <button
            type="button"
            className={`stack-mode-tab ${mode === 'total' ? 'active' : ''}`}
            onClick={() => setMode('total')}
          >
            Enter total
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'breakdown' ? (
            <>
              <p className="form-hint stack-breakdown-hint">
                Enter how many of each chip you have (e.g. 25 → 10 means ten 25-chips).
              </p>
              <div className="chip-breakdown-list">
                {STACK_CHIP_DENOMINATIONS.map((denom) => (
                  <div key={denom} className="chip-breakdown-row">
                    <span className="chip-breakdown-denom">{formatChips(denom)}</span>
                    <span className="chip-breakdown-sep">:</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="chip-breakdown-qty"
                      value={counts[denom]}
                      onChange={(e) => updateCount(denom, e.target.value)}
                      placeholder="0"
                      inputMode="numeric"
                    />
                  </div>
                ))}
              </div>
              <div className="stack-count-total">
                <span className="stack-count-label">Total</span>
                <span className="stack-count-value">{formatChips(breakdownTotal)}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setCounts(createEmptyCounts())}
                >
                  Clear
                </button>
              </div>
            </>
          ) : (
            <label className="field">
              <span>Total chips in front of player</span>
              <input
                type="number"
                min="0"
                step="1"
                value={totalInput}
                onChange={(e) => setTotalInput(e.target.value)}
                placeholder="e.g. 15000"
                autoFocus
                required
              />
            </label>
          )}

          {stackCash !== null && stackChips > 0 && (
            <div className="modal-preview cashout-preview">
              <div>
                Stack value: <strong>{formatCurrency(stackCash, currency)}</strong>
              </div>
              {profit !== null && (
                <div className={profit >= 0 ? 'profit' : 'loss'}>
                  Live P/L: {formatProfitLoss(profit, currency)}
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
              Save Stack
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
