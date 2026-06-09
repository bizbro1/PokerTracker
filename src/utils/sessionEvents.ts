import type { SessionEvent, SessionEventType } from '../types';
import { generateId } from './calculations';

export function createSessionEvent(
  type: SessionEventType,
  playerId: string,
  playerName: string,
  message: string
): SessionEvent {
  return {
    id: generateId(),
    t: new Date().toISOString(),
    type,
    playerId,
    playerName,
    message,
  };
}

export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function eventIcon(type: SessionEventType): string {
  switch (type) {
    case 'player_joined':
      return '👋';
    case 'buy_in':
      return '💵';
    case 'rebuy':
      return '🔄';
    case 'stack_updated':
      return '📊';
    case 'rebuy_requested':
      return '✋';
    case 'rebuy_cleared':
      return '✓';
    case 'busted':
      return '💀';
    case 'cashed_out':
      return '🏦';
    case 'player_removed':
      return '✕';
  }
}
