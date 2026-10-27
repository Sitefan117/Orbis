-- Orbis free pilot: teacher-managed classes, student saves, and activity results.
-- This migration is a reviewed draft. Do not run it against a project containing
-- real student data until the policies have been tested with separate accounts.

create table public.teacher_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teacher_accounts (user_id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now()
);

create table public.student_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.class_memberships (
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.student_profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

create table public.game_saves (
  student_id uuid not null references public.student_profiles (user_id) on delete cascade,
  game_id text not null check (char_length(game_id) between 1 and 80),
  format_version integer not null check (format_version > 0),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  primary key (student_id, game_id),
  constraint game_saves_state_size check (octet_length(state::text) <= 500000)
);

create table public.activity_events (
  event_id uuid primary key,
  student_id uuid not null references public.student_profiles (user_id) on delete cascade,
  game_id text not null check (char_length(game_id) between 1 and 80),
  activity_id text not null check (char_length(activity_id) between 1 and 120),
  skill_id text check (skill_id is null or char_length(skill_id) <= 120),
  correct_count integer not null check (correct_count >= 0),
  question_count integer not null check (question_count > 0),
  error_count integer not null default 0 check (error_count >= 0),
  error_families text[] not null default '{}',
  hints_used integer check (hints_used is null or hints_used >= 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint activity_events_score_valid check (correct_count <= question_count),
  constraint activity_events_error_families_count check (cardinality(error_families) <= 20)
);

create index class_memberships_student_idx on public.class_memberships (student_id);
create index classes_teacher_idx on public.classes (teacher_id);
create index activity_events_student_date_idx on public.activity_events (student_id, occurred_at desc);
create index activity_events_game_idx on public.activity_events (student_id, game_id, occurred_at desc);

-- Sauvegarde optimiste : refuse d'écraser une révision créée sur un autre appareil.
create function public.orbis_save_game_state(
  p_game_id text,
  p_format_version integer,
  p_state jsonb,
  p_expected_revision bigint,
  p_updated_at timestamptz
)
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  next_revision bigint;
begin
  if p_expected_revision = 0 then
    insert into public.game_saves (student_id, game_id, format_version, state, revision, updated_at)
    values ((select auth.uid()), p_game_id, p_format_version, p_state, 1, p_updated_at)
    on conflict (student_id, game_id) do nothing
    returning revision into next_revision;
  else
    update public.game_saves
    set format_version = p_format_version,
        state = p_state,
        revision = revision + 1,
        updated_at = p_updated_at
    where student_id = (select auth.uid())
      and game_id = p_game_id
      and revision = p_expected_revision
    returning revision into next_revision;
  end if;

  if next_revision is null then
    raise exception using errcode = '23505', message = 'orbis_save_conflict';
  end if;
  return next_revision;
end;
$$;

-- These helpers use the table owner's permissions to avoid recursive RLS checks.
-- Their return values reveal only whether the current teacher has the relationship.
create function public.orbis_is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.teacher_accounts t where t.user_id = (select auth.uid())
  );
$$;

create function public.orbis_teacher_owns_class(target_class uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.classes c
    where c.id = target_class and c.teacher_id = (select auth.uid())
  );
$$;

create function public.orbis_teacher_can_view_student(target_student uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_memberships m
    join public.classes c on c.id = m.class_id
    where m.student_id = target_student and c.teacher_id = (select auth.uid())
  );
$$;

revoke all on function public.orbis_is_teacher() from public, anon;
revoke all on function public.orbis_teacher_owns_class(uuid) from public, anon;
revoke all on function public.orbis_teacher_can_view_student(uuid) from public, anon;
grant execute on function public.orbis_is_teacher() to authenticated;
grant execute on function public.orbis_teacher_owns_class(uuid) to authenticated;
grant execute on function public.orbis_teacher_can_view_student(uuid) to authenticated;
revoke all on function public.orbis_save_game_state(text, integer, jsonb, bigint, timestamptz) from public, anon;
grant execute on function public.orbis_save_game_state(text, integer, jsonb, bigint, timestamptz) to authenticated;

alter table public.teacher_accounts enable row level security;
alter table public.classes enable row level security;
alter table public.student_profiles enable row level security;
alter table public.class_memberships enable row level security;
alter table public.game_saves enable row level security;
alter table public.activity_events enable row level security;

-- A teacher account is provisioned by a trusted administrator, never by a client.
create policy teacher_accounts_read_self on public.teacher_accounts
  for select to authenticated using (user_id = (select auth.uid()));

create policy classes_teacher_read on public.classes
  for select to authenticated using (teacher_id = (select auth.uid()));
create policy classes_teacher_create on public.classes
  for insert to authenticated
  with check (teacher_id = (select auth.uid()) and (select public.orbis_is_teacher()));
create policy classes_teacher_update on public.classes
  for update to authenticated
  using (teacher_id = (select auth.uid()))
  with check (teacher_id = (select auth.uid()) and (select public.orbis_is_teacher()));
create policy classes_teacher_delete on public.classes
  for delete to authenticated using (teacher_id = (select auth.uid()));

create policy student_profiles_read_self_or_teacher on public.student_profiles
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.orbis_teacher_can_view_student(user_id))
  );

create policy class_memberships_read_related on public.class_memberships
  for select to authenticated
  using (
    student_id = (select auth.uid())
    or (select public.orbis_teacher_owns_class(class_id))
  );

create policy game_saves_read_self_or_teacher on public.game_saves
  for select to authenticated
  using (
    student_id = (select auth.uid())
    or (select public.orbis_teacher_can_view_student(student_id))
  );
create policy game_saves_student_create on public.game_saves
  for insert to authenticated with check (student_id = (select auth.uid()));
create policy game_saves_student_update on public.game_saves
  for update to authenticated
  using (student_id = (select auth.uid()))
  with check (student_id = (select auth.uid()));
create policy game_saves_student_delete on public.game_saves
  for delete to authenticated using (student_id = (select auth.uid()));

create policy activity_events_read_self_or_teacher on public.activity_events
  for select to authenticated
  using (
    student_id = (select auth.uid())
    or (select public.orbis_teacher_can_view_student(student_id))
  );
create policy activity_events_student_create on public.activity_events
  for insert to authenticated with check (student_id = (select auth.uid()));

-- Explicit grants keep student results append-only for normal client accounts.
revoke all on table public.teacher_accounts, public.classes, public.student_profiles,
  public.class_memberships, public.game_saves, public.activity_events from anon, authenticated;
grant select on public.teacher_accounts to authenticated;
grant select, insert, update, delete on public.classes to authenticated;
grant select on public.student_profiles, public.class_memberships to authenticated;
grant select, insert, update, delete on public.game_saves to authenticated;
grant select, insert on public.activity_events to authenticated;
