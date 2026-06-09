import type { SessionEvent } from '../types';
import { eventIcon, formatEventTime } from '../utils/sessionEvents';

interface ActivityLogProps {
  events: SessionEvent[];
  limit?: number;
  compact?: boolean;
  emptyText?: string;
}

export function ActivityLog({
  events,
  limit,
  compact = false,
  emptyText = 'Activity will show up here as players join, buy in, and update stacks.',
}: ActivityLogProps) {
  const items = limit ? [...events].slice(-limit).reverse() : [...events].reverse();

  if (items.length === 0) {
    return <p className="activity-empty">{emptyText}</p>;
  }

  return (
    <ul className={`activity-log ${compact ? 'activity-log-compact' : ''}`}>
      {items.map((event) => (
        <li key={event.id} className={`activity-item activity-${event.type}`}>
          <span className="activity-icon">{eventIcon(event.type)}</span>
          <span className="activity-message">{event.message}</span>
          <span className="activity-time">{formatEventTime(event.t)}</span>
        </li>
      ))}
    </ul>
  );
}
