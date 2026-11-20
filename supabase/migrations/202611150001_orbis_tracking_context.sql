-- Conserve les réglages choisis dans un jeu et distingue les cours des jeux.
alter table public.activity_events
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists activity_kind text not null default 'game',
  add column if not exists session_id uuid;

do $$ begin
  alter table public.activity_events
    add constraint activity_events_metadata_object
    check (jsonb_typeof(metadata) = 'object' and octet_length(metadata::text) <= 50000);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.activity_events
    add constraint activity_events_activity_kind
    check (activity_kind in ('game', 'course'));
exception when duplicate_object then null;
end $$;

create index if not exists activity_events_session_idx
  on public.activity_events (student_id, session_id, occurred_at desc);
