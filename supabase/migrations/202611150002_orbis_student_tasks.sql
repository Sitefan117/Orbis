-- Consignes persistantes envoyées par l'enseignant à une classe.
create table if not exists public.student_tasks (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teacher_accounts(user_id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 140),
  body text not null check (char_length(body) between 1 and 2000),
  target_game_id text,
  due_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists student_tasks_class_idx on public.student_tasks(class_id, active, created_at desc);
alter table public.student_tasks enable row level security;

do $$ begin
  create policy student_tasks_teacher_read on public.student_tasks for select to authenticated
    using (teacher_id = (select auth.uid()));
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy student_tasks_teacher_write on public.student_tasks for insert to authenticated
    with check (teacher_id = (select auth.uid()) and public.orbis_teacher_owns_class(class_id));
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy student_tasks_teacher_update on public.student_tasks for update to authenticated
    using (teacher_id = (select auth.uid())) with check (teacher_id = (select auth.uid()) and public.orbis_teacher_owns_class(class_id));
exception when duplicate_object then null;
end $$;
do $$ begin
  create policy student_tasks_student_read on public.student_tasks for select to authenticated
    using (exists (select 1 from public.class_memberships m where m.class_id = student_tasks.class_id and m.student_id = (select auth.uid())));
exception when duplicate_object then null;
end $$;

grant select, insert, update on public.student_tasks to authenticated;
