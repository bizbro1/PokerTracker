import type { BlindPlan, BlindPlanConfig } from '../types';
import {
  calculateNumLevels,
  formatBlindLevelsSummary,
  generateBlindStructure,
  getTargetEndBB,
  getTargetStartBB,
} from './blindStructure';

export function computeBlindPlan(config: BlindPlanConfig): BlindPlan {
  const levels = generateBlindStructure(config);
  const warnings = validateBlindPlan(config, levels);

  return {
    config,
    totalChipsInPlay: config.numPlayers * config.startingStack,
    numLevels: levels.length,
    levels,
    warnings,
  };
}

function validateBlindPlan(
  config: BlindPlanConfig,
  levels: BlindPlan['levels']
): string[] {
  const warnings: string[] = [];

  const targetEndBB = getTargetEndBB(config);
  const actualEndBB = levels[levels.length - 1]?.bigBlind ?? 0;

  if (actualEndBB < targetEndBB * 0.5) {
    warnings.push(
      `Blind structure may not reach a strong ending level within ${config.sessionDurationHours}h ` +
        `(final BB ${actualEndBB.toLocaleString()} vs target ~${Math.round(targetEndBB).toLocaleString()}). ` +
        `Consider a longer session or shorter rounds.`
    );
  }

  const targetStartBB = getTargetStartBB(config);
  const actualStartBB = levels[0]?.bigBlind ?? 0;
  if (actualStartBB > targetStartBB * 1.5) {
    warnings.push(
      `Starting big blind (${actualStartBB}) is higher than expected ` +
        `(target ${targetStartBB}). Check smallest chip denomination.`
    );
  }

  const numLevels = calculateNumLevels(
    config.sessionDurationHours,
    config.roundLengthMinutes
  );
  if (numLevels < 2 && config.sessionDurationHours > 1) {
    warnings.push('Session duration yields only 1 blind level — increase duration or shorten rounds.');
  }

  return warnings;
}

export function blindPlanToSummaryString(plan: BlindPlan): string {
  return formatBlindLevelsSummary(plan.levels);
}
