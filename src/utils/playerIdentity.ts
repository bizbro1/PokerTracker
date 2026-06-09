const STORAGE_KEY = 'poker-player-identity';

export interface PlayerIdentity {
  sessionId: string;
  playerId: string;
  name: string;
}

export function getPlayerIdentity(): PlayerIdentity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlayerIdentity;
  } catch {
    return null;
  }
}

export function savePlayerIdentity(identity: PlayerIdentity): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

export function clearPlayerIdentity(): void {
  localStorage.removeItem(STORAGE_KEY);
}
