-- Poker Night Tracker — database schema
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run

create table if not exists public.poker_sessions (
  id uuid primary key,
  join_code text,
  status text not null default 'active',
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists poker_sessions_join_code_idx on public.poker_sessions (join_code);

-- Needed so realtime delete/update events carry full row data
alter table public.poker_sessions replica identity full;

-- Row level security: open to the anon key (private friends app, no accounts)
alter table public.poker_sessions enable row level security;

drop policy if exists "anon full access" on public.poker_sessions;
create policy "anon full access" on public.poker_sessions
  for all to anon using (true) with check (true);

-- Atomic per-player stack update so phones can't overwrite each other's data
create or replace function public.update_player_stack(
  p_session_id uuid,
  p_player_id text,
  p_stack numeric
) returns void
language sql
as $$
  update public.poker_sessions
  set
    data = jsonb_set(
      data,
      '{players}',
      (
        select coalesce(
          jsonb_agg(
            case
              when player->>'id' = p_player_id
                then jsonb_set(player, '{currentStackChips}', to_jsonb(p_stack))
              else player
            end
          ),
          '[]'::jsonb
        )
        from jsonb_array_elements(data->'players') as player
      )
    ),
    updated_at = now()
  where id = p_session_id;
$$;

-- Atomic player join so two phones joining at once can't overwrite each other
create or replace function public.join_session_player(
  p_session_id uuid,
  p_player jsonb
) returns void
language sql
as $$
  update public.poker_sessions
  set
    data = jsonb_set(
      data,
      '{players}',
      coalesce(data->'players', '[]'::jsonb) || jsonb_build_array(p_player)
    ),
    updated_at = now()
  where id = p_session_id;
$$;

-- Atomic rebuy-request flag toggled from player phones
create or replace function public.set_player_rebuy(
  p_session_id uuid,
  p_player_id text,
  p_requested boolean
) returns void
language sql
as $$
  update public.poker_sessions
  set
    data = jsonb_set(
      data,
      '{players}',
      (
        select coalesce(
          jsonb_agg(
            case
              when player->>'id' = p_player_id
                then jsonb_set(player, '{rebuyRequested}', to_jsonb(p_requested))
              else player
            end
          ),
          '[]'::jsonb
        )
        from jsonb_array_elements(data->'players') as player
      )
    ),
    updated_at = now()
  where id = p_session_id;
$$;

-- Enable realtime broadcasts for this table
alter publication supabase_realtime add table public.poker_sessions;
