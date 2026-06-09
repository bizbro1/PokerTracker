import type { SessionEvent } from '../types';
import { eventIcon, formatEventTime } from '../utils/sessionEvents';

interface SessionEventToastProps {
  event: SessionEvent | null;
  className?: string;
}

export function SessionEventToast({ event, className = '' }: SessionEventToastProps) {
  if (!event) return null;

  return (
    <div className={`event-toast ${className}`} role="status" aria-live="polite">
      <span className="event-toast-icon">{eventIcon(event.type)}</span>
      <div className="event-toast-body">
        <span className="event-toast-message">{event.message}</span>
        <span className="event-toast-time">{formatEventTime(event.t)}</span>
      </div>
    </div>
  );
}
