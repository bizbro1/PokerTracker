import { useMemo } from 'react';
import type { BlindPlan, BlindPlanConfig } from '../types';
import { computeBlindPlan } from '../utils/blindPlan';
import { formatRoundStart } from '../utils/blindStructure';
import { formatChips } from '../utils/format';

interface BlindStructureCalculatorProps {
  config: BlindPlanConfig;
  onConfigChange: (config: BlindPlanConfig) => void;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

export function BlindStructureCalculator({
  config,
  onConfigChange,
  enabled,
  onEnabledChange,
}: BlindStructureCalculatorProps) {
  const plan = useMemo(
    () => (enabled ? computeBlindPlan(config) : null),
    [config, enabled]
  );

  const update = <K extends keyof BlindPlanConfig>(key: K, value: BlindPlanConfig[K]) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="blind-calculator-wrap">
      <fieldset className="fieldset blind-calculator">
        <legend>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onEnabledChange(e.target.checked)}
            />
            Blind Structure Calculator
          </label>
        </legend>

        {enabled && (
          <>
            <div className="form-row-3">
              <label className="field">
                <span>Players</span>
                <input
                  type="number"
                  min="2"
                  step="1"
                  value={config.numPlayers}
                  onChange={(e) => update('numPlayers', parseInt(e.target.value) || 2)}
                />
              </label>
              <label className="field">
                <span>Duration (hours)</span>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={config.sessionDurationHours}
                  onChange={(e) =>
                    update('sessionDurationHours', parseFloat(e.target.value) || 1)
                  }
                />
              </label>
              <label className="field">
                <span>Round length (min)</span>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={config.roundLengthMinutes}
                  onChange={(e) =>
                    update('roundLengthMinutes', parseInt(e.target.value) || 15)
                  }
                />
              </label>
            </div>

            <div className="form-row">
              <label className="field">
                <span>Starting stack</span>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={config.startingStack}
                  onChange={(e) =>
                    update('startingStack', parseInt(e.target.value) || 10000)
                  }
                />
              </label>
              <label className="field">
                <span>Smallest chip</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={config.smallestChipDenomination}
                  onChange={(e) =>
                    update('smallestChipDenomination', parseInt(e.target.value) || 25)
                  }
                />
              </label>
            </div>
          </>
        )}
      </fieldset>

      {enabled && plan && <BlindPlanSummary plan={plan} />}
    </div>
  );
}

export function BlindPlanSummary({
  plan,
  tableOnly = false,
}: {
  plan: BlindPlan;
  tableOnly?: boolean;
}) {
  const { config } = plan;

  return (
    <div className={`blind-plan-summary ${tableOnly ? 'blind-plan-summary-table-only' : ''}`}>
      {!tableOnly && plan.warnings.length > 0 && (
        <div className="plan-warnings">
          {plan.warnings.map((w, i) => (
            <div key={i} className="alert alert-warning">
              {w}
            </div>
          ))}
        </div>
      )}

      {!tableOnly && (
        <div className="plan-stats">
          <div className="plan-stat">
            <span className="plan-stat-label">Players</span>
            <span className="plan-stat-value">{config.numPlayers}</span>
          </div>
          <div className="plan-stat">
            <span className="plan-stat-label">Starting Stack</span>
            <span className="plan-stat-value">{formatChips(config.startingStack)}</span>
          </div>
          <div className="plan-stat">
            <span className="plan-stat-label">Total Chips In Play</span>
            <span className="plan-stat-value">{formatChips(plan.totalChipsInPlay)}</span>
          </div>
          <div className="plan-stat">
            <span className="plan-stat-label">Levels</span>
            <span className="plan-stat-value">{plan.numLevels}</span>
          </div>
          <div className="plan-stat">
            <span className="plan-stat-label">Round Length</span>
            <span className="plan-stat-value">{config.roundLengthMinutes} min</span>
          </div>
        </div>
      )}

      <div className="plan-section">
        {!tableOnly && <h4>Blind Structure</h4>}
        <div className="blind-levels-table-wrap">
          <table className="blind-levels-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Small Blind</th>
                <th>Big Blind</th>
                <th>Round Start</th>
              </tr>
            </thead>
            <tbody>
              {plan.levels.map((level) => (
                <tr key={level.level}>
                  <td>{level.level}</td>
                  <td>{formatChips(level.smallBlind)}</td>
                  <td>{formatChips(level.bigBlind)}</td>
                  <td>
                    {formatRoundStart(
                      level.roundStartMinutes ?? (level.level - 1) * config.roundLengthMinutes
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
