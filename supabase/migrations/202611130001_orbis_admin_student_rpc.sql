-- Création contrôlée d'un élève depuis le tableau enseignant.
create or replace function public.orbis_admin_add_student(
  p_student_id uuid,
  p_login_id text,
  p_display_name text,
  p_class_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.classes
    where id = p_class_id and teacher_id = (select auth.uid())
  ) then
    raise exception using errcode = '42501', message = 'class_not_owned';
  end if;

  insert into public.student_profiles (user_id, login_id, display_name)
  values (p_student_id, p_login_id, p_display_name);

  insert into public.class_memberships (class_id, student_id)
  values (p_class_id, p_student_id);
end;
$$;

revoke all on function public.orbis_admin_add_student(uuid, text, text, uuid) from public, anon;
grant execute on function public.orbis_admin_add_student(uuid, text, text, uuid) to authenticated;
