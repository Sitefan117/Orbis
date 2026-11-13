-- Identifiants courts Orbis. À exécuter après 202610250001_orbis_free_pilot.sql.
-- Les identifiants sont des pseudonymes de connexion, pas des noms complets.

alter table public.teacher_accounts
  add column if not exists login_id text;

alter table public.student_profiles
  add column if not exists login_id text;

update public.teacher_accounts
set login_id = 'teacher-' || left(replace(user_id::text, '-', ''), 12)
where login_id is null;

update public.student_profiles
set login_id = 'student-' || left(replace(user_id::text, '-', ''), 12)
where login_id is null;

alter table public.teacher_accounts
  alter column login_id set not null;

alter table public.student_profiles
  alter column login_id set not null;

alter table public.teacher_accounts
  add constraint teacher_accounts_login_id_format
  check (login_id ~ '^[a-zA-Z0-9_-]{3,40}$');

alter table public.student_profiles
  add constraint student_profiles_login_id_format
  check (login_id ~ '^[a-zA-Z0-9_-]{3,40}$');

create unique index if not exists teacher_accounts_login_id_idx
  on public.teacher_accounts (lower(login_id));

create unique index if not exists student_profiles_login_id_idx
  on public.student_profiles (lower(login_id));

grant update (display_name, login_id) on public.teacher_accounts to authenticated;
grant update (display_name, login_id) on public.student_profiles to authenticated;

comment on column public.teacher_accounts.login_id is 'Identifiant court de connexion, sans adresse e-mail personnelle.';
comment on column public.student_profiles.login_id is 'Identifiant court de connexion, sans adresse e-mail personnelle.';
