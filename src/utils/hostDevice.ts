const STORAGE_KEY = 'poker-host-sessions';

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/** True if this device created (or unlocked host controls for) the session. */
export function isHostDevice(sessionId: string): boolean {
  return readIds().includes(sessionId);
}

export function markHostDevice(sessionId: string): void {
  const ids = readIds();
  if (!ids.includes(sessionId)) {
    // Keep only recent sessions to avoid unbounded growth
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids.slice(-19), sessionId]));
  }
}
