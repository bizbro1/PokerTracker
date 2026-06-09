import { useCallback, useSyncExternalStore } from 'react';
import type { BlindPlan, ChipValue, Player, PokerSession } from '../types';
import { cashToChips, generateId } from '../utils/calculations';
import { migrateSession } from '../utils/migrate';

const STORAGE_KEY = 'poker-tracker-sessions';

function loadSessions(): PokerSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    return parsed.map((s) => migrateSession(s as Parameters<typeof migrateSession>[0]));
  } catch {
    return [];
  }
}

function saveSessions(sessions: PokerSession[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

let sessions = loadSessions();
const listeners = new Set<() => void>();

function emitChange(): void {
  saveSessions(sessions);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): PokerSession[] {
  return sessions;
}

export function useSessions() {
  const allSessions = useSyncExternalStore(subscribe, getSnapshot);

  const activeSession = allSessions.find((s) => s.status === 'active') ?? null;

  const createSession = useCallback(
    (data: {
      chipValue: ChipValue;
      defaultBuyInCash: number;
      currency: string;
      startTime: string;
      blindLevels: string;
      blindPlan: BlindPlan | null;
      notes: string;
    }) => {
      const session: PokerSession = {
        id: generateId(),
        chipValue: data.chipValue,
        defaultBuyInCash: data.defaultBuyInCash,
        currency: data.currency,
        startTime: data.startTime,
        endTime: null,
        blindLevels: data.blindLevels,
        blindPlan: data.blindPlan,
        blindTimerPausedAt: null,
        blindTimerTotalPausedMs: 0,
        notes: data.notes,
        players: [],
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      sessions = [...sessions.filter((s) => s.status !== 'active'), session];
      emitChange();
      return session;
    },
    []
  );

  const updateSession = useCallback(
    (id: string, updater: (session: PokerSession) => PokerSession) => {
      sessions = sessions.map((s) => (s.id === id ? updater(s) : s));
      emitChange();
    },
    []
  );

  const addPlayer = useCallback(
    (sessionId: string, name: string, buyInCash: number) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return;

      const player: Player = {
        id: generateId(),
        name: name.trim(),
        buyIns: [
          {
            id: generateId(),
            cashAmount: buyInCash,
            chips: cashToChips(buyInCash, session.chipValue),
          },
        ],
        cashOutChips: null,
        currentStackChips: null,
        status: 'playing',
      };
      updateSession(sessionId, (s) => ({
        ...s,
        players: [...s.players, player],
      }));
    },
    [updateSession]
  );

  const addBuyIn = useCallback(
    (sessionId: string, playerId: string, cashAmount: number) => {
      updateSession(sessionId, (s) => ({
        ...s,
        players: s.players.map((p) =>
          p.id === playerId
            ? {
                ...p,
                buyIns: [
                  ...p.buyIns,
                  {
                    id: generateId(),
                    cashAmount,
                    chips: cashToChips(cashAmount, s.chipValue),
                  },
                ],
                status: 'playing' as const,
                cashOutChips: null,
                currentStackChips: null,
              }
            : p
        ),
      }));
    },
    [updateSession]
  );

  const updatePlayerStack = useCallback(
    (sessionId: string, playerId: string, stackChips: number) => {
      updateSession(sessionId, (s) => ({
        ...s,
        players: s.players.map((p) =>
          p.id === playerId && p.status === 'playing'
            ? { ...p, currentStackChips: stackChips }
            : p
        ),
      }));
    },
    [updateSession]
  );

  const cashOutPlayer = useCallback(
    (sessionId: string, playerId: string, remainingChips: number) => {
      updateSession(sessionId, (s) => ({
        ...s,
        players: s.players.map((p) =>
          p.id === playerId
            ? {
                ...p,
                cashOutChips: remainingChips,
                currentStackChips: null,
                status: remainingChips === 0 ? ('busted' as const) : ('cashed_out' as const),
              }
            : p
        ),
      }));
    },
    [updateSession]
  );

  const markBusted = useCallback(
    (sessionId: string, playerId: string) => {
      cashOutPlayer(sessionId, playerId, 0);
    },
    [cashOutPlayer]
  );

  const removePlayer = useCallback(
    (sessionId: string, playerId: string) => {
      updateSession(sessionId, (s) => ({
        ...s,
        players: s.players.filter((p) => p.id !== playerId),
      }));
    },
    [updateSession]
  );

  const toggleBlindTimerPause = useCallback(
    (sessionId: string) => {
      updateSession(sessionId, (s) => {
        if (s.blindTimerPausedAt) {
          const pauseDuration = Date.now() - new Date(s.blindTimerPausedAt).getTime();
          return {
            ...s,
            blindTimerPausedAt: null,
            blindTimerTotalPausedMs: s.blindTimerTotalPausedMs + pauseDuration,
          };
        }
        return { ...s, blindTimerPausedAt: new Date().toISOString() };
      });
    },
    [updateSession]
  );

  const closeSession = useCallback(
    (sessionId: string) => {
      updateSession(sessionId, (s) => ({
        ...s,
        status: 'closed',
        endTime: new Date().toISOString(),
      }));
    },
    [updateSession]
  );

  const deleteSession = useCallback((sessionId: string) => {
    sessions = sessions.filter((s) => s.id !== sessionId);
    emitChange();
  }, []);

  const getSession = useCallback(
    (id: string) => allSessions.find((s) => s.id === id) ?? null,
    [allSessions]
  );

  return {
    sessions: allSessions,
    activeSession,
    createSession,
    addPlayer,
    addBuyIn,
    updatePlayerStack,
    cashOutPlayer,
    markBusted,
    removePlayer,
    toggleBlindTimerPause,
    closeSession,
    deleteSession,
    getSession,
  };
}
