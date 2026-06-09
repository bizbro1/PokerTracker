import { useCallback, useSyncExternalStore } from 'react';
import { supabase } from '../lib/supabase';
import type { BlindPlan, ChipValue, Player, PokerSession, SessionEvent } from '../types';
import { cashToChips, generateId } from '../utils/calculations';
import { formatChips, formatCurrency } from '../utils/format';
import { generateJoinCode, normalizeJoinCode } from '../utils/joinCode';
import { migrateSession } from '../utils/migrate';
import { createSessionEvent } from '../utils/sessionEvents';

const MAX_EVENTS = 100;

let sessions: PokerSession[] = [];
let ready = false;
let initialized = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

function upsertLocal(session: PokerSession): void {
  const idx = sessions.findIndex((s) => s.id === session.id);
  sessions =
    idx >= 0
      ? sessions.map((s) => (s.id === session.id ? session : s))
      : [...sessions, session];
  emit();
}

async function fetchAll(): Promise<void> {
  const { data, error } = await supabase
    .from('poker_sessions')
    .select('id, data')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load sessions:', error.message);
    ready = true;
    emit();
    return;
  }

  sessions = (data ?? []).map((row) =>
    migrateSession(row.data as Parameters<typeof migrateSession>[0])
  );
  ready = true;
  emit();
}

function init(): void {
  if (initialized) return;
  initialized = true;

  fetchAll();

  supabase
    .channel('poker-sessions-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'poker_sessions' },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          const oldRow = payload.old as { id?: string };
          if (oldRow?.id) {
            sessions = sessions.filter((s) => s.id !== oldRow.id);
            emit();
          }
          return;
        }
        const row = payload.new as { data?: unknown };
        if (row?.data) {
          upsertLocal(
            migrateSession(row.data as Parameters<typeof migrateSession>[0])
          );
        }
      }
    )
    .subscribe();

  // Safety net in case realtime is interrupted (phone lock, network drop)
  window.addEventListener('focus', () => void fetchAll());
  setInterval(() => void fetchAll(), 15000);
}

function subscribe(listener: () => void): () => void {
  init();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): PokerSession[] {
  return sessions;
}

function getReadySnapshot(): boolean {
  return ready;
}

async function pushSession(session: PokerSession): Promise<void> {
  const { error } = await supabase.from('poker_sessions').upsert({
    id: session.id,
    join_code: session.joinCode || null,
    status: session.status,
    data: session,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error('Failed to save session:', error.message);
}

function updateSessionById(
  id: string,
  updater: (session: PokerSession) => PokerSession
): void {
  const existing = sessions.find((s) => s.id === id);
  if (!existing) return;
  const updated = updater(existing);
  upsertLocal(updated);
  void pushSession(updated);
}

function buildPlayer(name: string, buyInCash: number, chipValue: ChipValue): Player {
  const chips = cashToChips(buyInCash, chipValue);
  return {
    id: generateId(),
    name: name.trim(),
    buyIns: [
      {
        id: generateId(),
        cashAmount: buyInCash,
        chips,
      },
    ],
    cashOutChips: null,
    currentStackChips: null,
    stackHistory: [{ t: new Date().toISOString(), chips }],
    rebuyRequested: false,
    status: 'playing',
  };
}

function appendSnapshot(player: Player, chips: number): Player {
  return {
    ...player,
    stackHistory: [...player.stackHistory, { t: new Date().toISOString(), chips }],
  };
}

function withEvent(session: PokerSession, event: SessionEvent): PokerSession {
  return {
    ...session,
    events: [...(session.events ?? []), event].slice(-MAX_EVENTS),
  };
}

export function useSessions() {
  const allSessions = useSyncExternalStore(subscribe, getSnapshot);
  const isReady = useSyncExternalStore(subscribe, getReadySnapshot);

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
      hostPin?: string | null;
    }) => {
      const session: PokerSession = {
        id: generateId(),
        joinCode: generateJoinCode(),
        hostPin: data.hostPin?.trim() || null,
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
        events: [],
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      upsertLocal(session);
      void pushSession(session);
      return session;
    },
    []
  );

  const addPlayer = useCallback((sessionId: string, name: string, buyInCash: number) => {
    updateSessionById(sessionId, (s) => {
      const player = buildPlayer(name, buyInCash, s.chipValue);
      const event = createSessionEvent(
        'player_joined',
        player.id,
        player.name,
        `${player.name} joined — ${formatCurrency(buyInCash, s.currency)} buy-in`
      );
      return withEvent({ ...s, players: [...s.players, player] }, event);
    });
  }, []);

  const joinAsPlayer = useCallback(
    (sessionId: string, name: string): string | null => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return null;
      const player = buildPlayer(name, session.defaultBuyInCash, session.chipValue);
      const event = createSessionEvent(
        'player_joined',
        player.id,
        player.name,
        `${player.name} joined — ${formatCurrency(session.defaultBuyInCash, session.currency)} buy-in`
      );

      // Optimistic local add; the server append is atomic so simultaneous
      // joins from multiple phones can't overwrite each other.
      upsertLocal({ ...session, players: [...session.players, player] });
      void supabase
        .rpc('join_session_player', {
          p_session_id: sessionId,
          p_player: player,
          p_event: event,
        })
        .then(({ error }) => {
          if (error) console.error('Failed to join session:', error.message);
        });
      return player.id;
    },
    []
  );

  const requestRebuy = useCallback(
    (sessionId: string, playerId: string, requested: boolean) => {
      const existing = sessions.find((s) => s.id === sessionId);
      const player = existing?.players.find((p) => p.id === playerId);
      if (existing && player) {
        upsertLocal({
          ...existing,
          players: existing.players.map((p) =>
            p.id === playerId ? { ...p, rebuyRequested: requested } : p
          ),
        });
      }
      const event =
        player &&
        createSessionEvent(
          requested ? 'rebuy_requested' : 'rebuy_cleared',
          playerId,
          player.name,
          requested ? `${player.name} requested a rebuy` : `${player.name} cancelled rebuy request`
        );
      void supabase
        .rpc('set_player_rebuy', {
          p_session_id: sessionId,
          p_player_id: playerId,
          p_requested: requested,
          p_event: event ?? null,
        })
        .then(({ error }) => {
          if (error) console.error('Failed to set rebuy request:', error.message);
        });
    },
    []
  );

  const getSessionByJoinCode = useCallback(
    (code: string): PokerSession | null => {
      const normalized = normalizeJoinCode(code);
      return (
        allSessions.find(
          (s) => s.status === 'active' && s.joinCode === normalized
        ) ?? null
      );
    },
    [allSessions]
  );

  const addBuyIn = useCallback(
    (sessionId: string, playerId: string, cashAmount: number) => {
      updateSessionById(sessionId, (s) => {
        let event: SessionEvent | null = null;
        const players = s.players.map((p) => {
          if (p.id !== playerId) return p;
          const chips = cashToChips(cashAmount, s.chipValue);
          const isRebuy = p.buyIns.length > 0;
          event = createSessionEvent(
            isRebuy ? 'rebuy' : 'buy_in',
            p.id,
            p.name,
            isRebuy
              ? `${p.name} rebought for ${formatCurrency(cashAmount, s.currency)}`
              : `${p.name} bought in for ${formatCurrency(cashAmount, s.currency)}`
          );
          // Estimate the new stack where we can so the progression chart
          // reflects rebuys: busted players restart at the rebuy amount,
          // players with a known stack get it topped up.
          const knownStack =
            p.status === 'busted'
              ? 0
              : p.status === 'playing'
                ? p.currentStackChips
                : p.cashOutChips;
          const updated: Player = {
            ...p,
            buyIns: [...p.buyIns, { id: generateId(), cashAmount, chips }],
            status: 'playing' as const,
            cashOutChips: null,
            currentStackChips: null,
            rebuyRequested: false,
          };
          return knownStack !== null
            ? appendSnapshot(updated, knownStack + chips)
            : updated;
        });
        return event ? withEvent({ ...s, players }, event) : { ...s, players };
      });
    },
    []
  );

  const updatePlayerStack = useCallback(
    (sessionId: string, playerId: string, stackChips: number) => {
      // Optimistic local update, then atomic per-player update on the server
      const existing = sessions.find((s) => s.id === sessionId);
      const player = existing?.players.find((p) => p.id === playerId);
      if (existing) {
        upsertLocal({
          ...existing,
          players: existing.players.map((p) =>
            p.id === playerId && p.status === 'playing'
              ? appendSnapshot({ ...p, currentStackChips: stackChips }, stackChips)
              : p
          ),
        });
      }
      const event =
        player &&
        createSessionEvent(
          'stack_updated',
          playerId,
          player.name,
          `${player.name} updated stack to ${formatChips(stackChips)}`
        );
      void supabase
        .rpc('update_player_stack', {
          p_session_id: sessionId,
          p_player_id: playerId,
          p_stack: stackChips,
          p_event: event ?? null,
        })
        .then(({ error }) => {
          if (error) console.error('Failed to update stack:', error.message);
        });
    },
    []
  );

  const cashOutPlayer = useCallback(
    (sessionId: string, playerId: string, remainingChips: number) => {
      updateSessionById(sessionId, (s) => {
        const player = s.players.find((p) => p.id === playerId);
        if (!player) return s;
        const busted = remainingChips === 0;
        const event = createSessionEvent(
          busted ? 'busted' : 'cashed_out',
          playerId,
          player.name,
          busted
            ? `${player.name} busted`
            : `${player.name} cashed out with ${formatChips(remainingChips)}`
        );
        return withEvent(
          {
            ...s,
            players: s.players.map((p) =>
              p.id === playerId
                ? appendSnapshot(
                    {
                      ...p,
                      cashOutChips: remainingChips,
                      currentStackChips: null,
                      rebuyRequested: false,
                      status: busted ? ('busted' as const) : ('cashed_out' as const),
                    },
                    remainingChips
                  )
                : p
            ),
          },
          event
        );
      });
    },
    []
  );

  const markBusted = useCallback(
    (sessionId: string, playerId: string) => {
      cashOutPlayer(sessionId, playerId, 0);
    },
    [cashOutPlayer]
  );

  const removePlayer = useCallback((sessionId: string, playerId: string) => {
    updateSessionById(sessionId, (s) => {
      const player = s.players.find((p) => p.id === playerId);
      if (!player) return s;
      const event = createSessionEvent(
        'player_removed',
        playerId,
        player.name,
        `${player.name} was removed from the session`
      );
      return withEvent(
        { ...s, players: s.players.filter((p) => p.id !== playerId) },
        event
      );
    });
  }, []);

  const toggleBlindTimerPause = useCallback((sessionId: string) => {
    updateSessionById(sessionId, (s) => {
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
  }, []);

  const closeSession = useCallback((sessionId: string) => {
    updateSessionById(sessionId, (s) => ({
      ...s,
      status: 'closed',
      endTime: new Date().toISOString(),
    }));
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    sessions = sessions.filter((s) => s.id !== sessionId);
    emit();
    void supabase
      .from('poker_sessions')
      .delete()
      .eq('id', sessionId)
      .then(({ error }) => {
        if (error) console.error('Failed to delete session:', error.message);
      });
  }, []);

  const getSession = useCallback(
    (id: string) => allSessions.find((s) => s.id === id) ?? null,
    [allSessions]
  );

  return {
    sessions: allSessions,
    ready: isReady,
    activeSession,
    createSession,
    addPlayer,
    joinAsPlayer,
    requestRebuy,
    getSessionByJoinCode,
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
