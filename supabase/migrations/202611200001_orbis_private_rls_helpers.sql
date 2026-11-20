-- Les politiques existantes référencent les fonctions par leur identité PostgreSQL.
-- ALTER FUNCTION SET SCHEMA conserve cette identité et leurs dépendances RLS.
-- Exécuter après toutes les migrations précédentes, dans une transaction.
begin;

create schema if not exists orbis_private;
revoke all on schema orbis_private from public, anon;
grant usage on schema orbis_private to authenticated;

alter function public.orbis_is_teacher() set schema orbis_private;
alter function public.orbis_teacher_owns_class(uuid) set schema orbis_private;
alter function public.orbis_teacher_can_view_student(uuid) set schema orbis_private;

-- Les corps de ces fonctions qualifient déjà leurs tables et auth.uid().
alter function orbis_private.orbis_is_teacher() set search_path = '';
alter function orbis_private.orbis_teacher_owns_class(uuid) set search_path = '';
alter function orbis_private.orbis_teacher_can_view_student(uuid) set search_path = '';
revoke all on function orbis_private.orbis_is_teacher() from public, anon;
revoke all on function orbis_private.orbis_teacher_owns_class(uuid) from public, anon;
revoke all on function orbis_private.orbis_teacher_can_view_student(uuid) from public, anon;
grant execute on function orbis_private.orbis_is_teacher() to authenticated;
grant execute on function orbis_private.orbis_teacher_owns_class(uuid) to authenticated;
grant execute on function orbis_private.orbis_teacher_can_view_student(uuid) to authenticated;

-- Les RPC administratives restent dans public : PostgREST doit les exposer à
-- l'Edge Function. Leur exécution est limitée aux comptes authentifiés et
-- leurs vérifications de propriété restent dans le corps de chaque fonction.
alter function public.orbis_admin_add_student(uuid, text, text, uuid) set search_path = '';
alter function public.orbis_admin_copy_student_save(uuid, uuid, text) set search_path = '';
alter function public.orbis_save_game_state(text, integer, jsonb, bigint, timestamptz) set search_path = '';

-- La copie appelait l'ancien nom public. On met à jour ce corps sans changer
-- la signature ni les contrôles de propriété de l'enseignant.
create or replace function public.orbis_admin_copy_student_save(
  p_source_student_id uuid,
  p_target_student_id uuid,
  p_game_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_source_student_id = p_target_student_id
    or not orbis_private.orbis_teacher_can_view_student(p_source_student_id)
    or not orbis_private.orbis_teacher_can_view_student(p_target_student_id) then
    raise exception using errcode = '42501', message = 'student_not_in_teacher_class';
  end if;

  if not exists (
    select 1 from public.game_saves
    where student_id = p_source_student_id and game_id = p_game_id
  ) then
    raise exception using errcode = 'P0002', message = 'source_save_not_found';
  end if;

  insert into public.game_saves (student_id, game_id, format_version, state, revision, updated_at)
  select p_target_student_id, game_id, format_version, state, 1, now()
  from public.game_saves
  where student_id = p_source_student_id and game_id = p_game_id
  on conflict (student_id, game_id) do update
  set format_version = excluded.format_version,
      state = excluded.state,
      revision = public.game_saves.revision + 1,
      updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.orbis_admin_add_student(uuid, text, text, uuid) from public, anon;
revoke all on function public.orbis_admin_copy_student_save(uuid, uuid, text) from public, anon;
grant execute on function public.orbis_admin_add_student(uuid, text, text, uuid) to authenticated;
grant execute on function public.orbis_admin_copy_student_save(uuid, uuid, text) to authenticated;

commit;
