-- Permet d'adresser une consigne à toute une classe ou à certains élèves.
alter table public.student_tasks
  add column if not exists student_id uuid references public.student_profiles(user_id) on delete cascade;

drop policy if exists student_tasks_student_read on public.student_tasks;
create policy student_tasks_student_read on public.student_tasks for select to authenticated
  using (
    exists (
      select 1 from public.class_memberships m
      where m.class_id = student_tasks.class_id
        and m.student_id = (select auth.uid())
    )
    and (student_tasks.student_id is null or student_tasks.student_id = (select auth.uid()))
  );

drop policy if exists student_tasks_teacher_write on public.student_tasks;
create policy student_tasks_teacher_write on public.student_tasks for insert to authenticated
  with check (
    teacher_id = (select auth.uid())
    and public.orbis_teacher_owns_class(class_id)
    and (student_id is null or exists (select 1 from public.class_memberships m where m.class_id = student_tasks.class_id and m.student_id = student_tasks.student_id))
  );

drop policy if exists student_tasks_teacher_update on public.student_tasks;
create policy student_tasks_teacher_update on public.student_tasks for update to authenticated
  using (teacher_id = (select auth.uid()))
  with check (
    teacher_id = (select auth.uid())
    and public.orbis_teacher_owns_class(class_id)
    and (student_id is null or exists (select 1 from public.class_memberships m where m.class_id = student_tasks.class_id and m.student_id = student_tasks.student_id))
  );
