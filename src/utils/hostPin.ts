import type { PokerSession } from '../types';

/**
 * Client-side guard for destructive host actions. Not real security —
 * it just prevents accidents and curious friends with the URL.
 */
export function confirmHostPin(session: PokerSession, action: string): boolean {
  if (!session.hostPin) return true;
  const entered = window.prompt(`Enter the host PIN to ${action}:`);
  if (entered === null) return false;
  if (entered.trim() !== session.hostPin) {
    window.alert('Wrong PIN.');
    return false;
  }
  return true;
}
