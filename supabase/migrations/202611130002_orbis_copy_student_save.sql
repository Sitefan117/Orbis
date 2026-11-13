-- Copie volontaire d'une sauvegarde entre deux élèves du même enseignant.
-- Les résultats d'activité ne sont jamais copiés.
create or replace function public.orbis_admin_copy_student_save(
  p_source_student_id uuid,
  p_target_student_id uuid,
  p_game_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_source_student_id = p_target_student_id
    or not public.orbis_teacher_can_view_student(p_source_student_id)
    or not public.orbis_teacher_can_view_student(p_target_student_id) then
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

revoke all on function public.orbis_admin_copy_student_save(uuid, uuid, text) from public, anon;
grant execute on function public.orbis_admin_copy_student_save(uuid, uuid, text) to authenticated;
