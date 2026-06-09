import { useState, type FormEvent } from 'react';
import type { ChipValue } from '../types';
import { cashToChips } from '../utils/calculations';
import { formatChips, formatCurrency } from '../utils/format';

interface BuyInModalProps {
  title: string;
  currency: string;
  chipValue: ChipValue;
  defaultCash?: number;
  onConfirm: (cashAmount: number) => void;
  onClose: () => void;
}

export function BuyInModal({
  title,
  currency,
  chipValue,
  defaultCash,
  onConfirm,
  onClose,
}: BuyInModalProps) {
  const [cash, setCash] = useState(defaultCash?.toString() ?? '');

  const cashNum = parseFloat(cash);
  const chips = !isNaN(cashNum) && cashNum > 0 ? cashToChips(cashNum, chipValue) : 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isNaN(cashNum) || cashNum <= 0) return;
    onConfirm(cashNum);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Cash paid ({currency})</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              placeholder="e.g. 100"
              autoFocus
              required
            />
          </label>
          {chips > 0 && (
            <p className="modal-preview">
              = <strong>{formatChips(chips)}</strong> chips
              <span className="modal-preview-sub">
                ({formatCurrency(chipValue.cash, currency)} = {formatChips(chipValue.chips)} chips)
              </span>
            </p>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
