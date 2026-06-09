import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BlindStructureCalculator } from '../components/BlindStructureCalculator';
import { Card } from '../components/Card';
import { useSessions } from '../hooks/useSessions';
import type { BlindPlanConfig } from '../types';
import { cashToChips } from '../utils/calculations';
import { blindPlanToSummaryString, computeBlindPlan } from '../utils/blindPlan';
import { formatChips, formatCurrency } from '../utils/format';

const CURRENCIES = ['NOK', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SEK', 'DKK'];

const PRESETS = [
  { label: '100 = 2,000', cash: '100', chips: '2000' },
  { label: '200 = 4,000', cash: '200', chips: '4000' },
  { label: '500 = 10,000', cash: '500', chips: '10000' },
];

const DEFAULT_BLIND_CONFIG: BlindPlanConfig = {
  numPlayers: 8,
  sessionDurationHours: 4,
  roundLengthMinutes: 30,
  startingStack: 20000,
  smallestChipDenomination: 25,
};

export function NewSession() {
  const navigate = useNavigate();
  const { createSession, activeSession } = useSessions();
  const [chipValueCash, setChipValueCash] = useState('100');
  const [chipValueChips, setChipValueChips] = useState('2000');
  const [defaultBuyInCash, setDefaultBuyInCash] = useState('100');
  const [currency, setCurrency] = useState('NOK');
  const [notes, setNotes] = useState('');
  const [hostPin, setHostPin] = useState('');
  const [blindCalcEnabled, setBlindCalcEnabled] = useState(true);
  const [blindConfig, setBlindConfig] = useState<BlindPlanConfig>(DEFAULT_BLIND_CONFIG);

  useEffect(() => {
    if (activeSession) navigate('/session', { replace: true });
  }, [activeSession, navigate]);

  const cashNum = parseFloat(chipValueCash);
  const chipsNum = parseFloat(chipValueChips);
  const defaultNum = parseFloat(defaultBuyInCash);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isNaN(cashNum) || cashNum <= 0 || isNaN(chipsNum) || chipsNum <= 0) return;

    const plan = blindCalcEnabled ? computeBlindPlan(blindConfig) : null;

    createSession({
      chipValue: { cash: cashNum, chips: chipsNum },
      defaultBuyInCash: isNaN(defaultNum) || defaultNum <= 0 ? cashNum : defaultNum,
      currency,
      startTime: new Date().toISOString(),
      blindLevels: plan ? blindPlanToSummaryString(plan) : '',
      blindPlan: plan,
      notes: notes.trim(),
      hostPin: hostPin.trim() || null,
    });
    navigate('/session');
  };

  const applyPreset = (cash: string, chips: string) => {
    setChipValueCash(cash);
    setChipValueChips(chips);
    setDefaultBuyInCash(cash);
  };

  const previewChips =
    !isNaN(defaultNum) && defaultNum > 0 && !isNaN(cashNum) && !isNaN(chipsNum)
      ? cashToChips(defaultNum, { cash: cashNum, chips: chipsNum })
      : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>New Session</h1>
        <p className="page-subtitle">Set up chip values, blinds, and your poker night</p>
      </div>

      <Card>
        <form className="form" onSubmit={handleSubmit}>
          <BlindStructureCalculator
            config={blindConfig}
            onConfigChange={setBlindConfig}
            enabled={blindCalcEnabled}
            onEnabledChange={setBlindCalcEnabled}
          />

          <fieldset className="fieldset">
            <legend>Cash & Chip Value</legend>
            <div className="preset-buttons">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => applyPreset(p.cash, p.chips)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="chip-value-row">
              <label className="field">
                <span>Cash</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={chipValueCash}
                  onChange={(e) => setChipValueCash(e.target.value)}
                  required
                />
              </label>
              <span className="chip-equals">=</span>
              <label className="field">
                <span>Chips</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={chipValueChips}
                  onChange={(e) => setChipValueChips(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label className="field">
                <span>Default Buy-in (cash)</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={defaultBuyInCash}
                  onChange={(e) => setDefaultBuyInCash(e.target.value)}
                  required
                />
                {previewChips > 0 && (
                  <span className="field-hint">= {formatChips(previewChips)} chips</span>
                )}
              </label>
              <label className="field">
                <span>Currency</span>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {!isNaN(cashNum) && !isNaN(chipsNum) && chipsNum > 0 && (
              <p className="form-hint">
                Rate: {formatCurrency(cashNum / chipsNum, currency)} per chip
              </p>
            )}
          </fieldset>

          <label className="field">
            <span>Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Location, special rules, etc."
              rows={3}
            />
          </label>

          <label className="field">
            <span>Host PIN (optional)</span>
            <input
              type="text"
              inputMode="numeric"
              value={hostPin}
              onChange={(e) => setHostPin(e.target.value)}
              placeholder="e.g. 1234"
              maxLength={12}
              autoComplete="off"
            />
            <span className="field-hint">
              If set, ending the session, removing players, and deleting require this PIN.
            </span>
          </label>

          <p className="form-hint">
            Session start time will be recorded when you create the session.
          </p>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Start Session
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
