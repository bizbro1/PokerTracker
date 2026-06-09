import { useEffect, useState } from 'react';
import type { PokerSession } from '../types';
import { getSessionDurationMs } from '../utils/calculations';
import { formatDateTime, formatDuration } from '../utils/format';

interface SessionSummaryBarProps {
  session: PokerSession;
}

export function SessionSummaryBar({ session }: SessionSummaryBarProps) {
  const isActive = session.status === 'active';
  const durationMs = getSessionDurationMs(session);

  return (
    <div className="summary-bar session-meta-bar">
      <div className="summary-item">
        <span className="summary-label">Started</span>
        <span className="summary-value">{formatDateTime(session.startTime)}</span>
      </div>
      {session.endTime && (
        <div className="summary-item">
          <span className="summary-label">Ended</span>
          <span className="summary-value">{formatDateTime(session.endTime)}</span>
        </div>
      )}
      {durationMs !== null && (
        <div className="summary-item">
          <span className="summary-label">Duration</span>
          <span className="summary-value">{formatDuration(durationMs)}</span>
        </div>
      )}
      {isActive && !session.endTime && (
        <div className="summary-item">
          <span className="summary-label">Duration</span>
          <span className="summary-value live-duration">
            <LiveDuration startTime={session.startTime} />
          </span>
        </div>
      )}
      {session.blindPlan && (
        <div className="summary-item">
          <span className="summary-label">Blind Levels</span>
          <span className="summary-value">{session.blindPlan.numLevels} levels</span>
        </div>
      )}
      {!session.blindPlan && session.blindLevels && (
        <div className="summary-item">
          <span className="summary-label">Blinds</span>
          <span className="summary-value">{session.blindLevels}</span>
        </div>
      )}
    </div>
  );
}

function LiveDuration({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState(
    () => Date.now() - new Date(startTime).getTime()
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - new Date(startTime).getTime());
    }, 30000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <>{formatDuration(elapsed)}</>;
}
