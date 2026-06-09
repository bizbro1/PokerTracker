import { useState } from 'react';
import type { BlindPlan } from '../types';
import { BlindPlanSummary } from './BlindStructureCalculator';
import { Card } from './Card';

interface BlindPlanDisplayProps {
  blindPlan: BlindPlan;
  collapsible?: boolean;
}

export function BlindPlanDisplay({ blindPlan, collapsible = false }: BlindPlanDisplayProps) {
  const [open, setOpen] = useState(false);

  if (collapsible) {
    return (
      <div className="blind-plan-collapsible">
        <button
          type="button"
          className="btn btn-secondary blind-plan-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? 'Hide Blind Structure' : `Blind Structure (${blindPlan.numLevels} levels)`}
        </button>
        {open && (
          <Card className="blind-plan-expanded">
            <BlindPlanSummary plan={blindPlan} tableOnly />
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card title="Blind Structure Plan">
      <BlindPlanSummary plan={blindPlan} />
    </Card>
  );
}
