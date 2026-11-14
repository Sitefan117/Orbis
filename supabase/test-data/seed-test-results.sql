-- Données de test Orbis : 10 élèves × 13 activités = 130 résultats.
--
-- À exécuter uniquement dans le projet Supabase de TEST, depuis SQL Editor.
-- Le script ne crée pas de compte Auth : les 10 comptes doivent déjà exister.
-- Il peut être relancé : il supprime uniquement les événements portant
-- l'identifiant de test ci-dessous, puis les recrée avec de nouveaux résultats.

do $$
declare
  test_activity constant text := 'test-profils-reussite-20261114';
begin
  delete from public.activity_events
  where activity_id = test_activity
    and student_id in (
      select sp.user_id
      from public.student_profiles sp
      join public.class_memberships cm on cm.student_id = sp.user_id
      join public.classes c on c.id = cm.class_id
      where c.name = 'TEST — profils de réussite'
    );

  insert into public.activity_events (
    event_id, student_id, game_id, activity_id, skill_id,
    correct_count, question_count, error_count, error_families,
    hints_used, duration_seconds, response_details, occurred_at
  )
  select
    gen_random_uuid(),
    student.user_id,
    game.game_id,
    test_activity,
    'profil-' || profile.profile,
    score.correct_count,
    10,
    10 - score.correct_count,
    case when score.correct_count < 8 then array['test-' || student.profile]::text[] else '{}'::text[] end,
    floor(random() * 3)::integer,
    45 + floor(random() * 256)::integer,
    details.response_details,
    now() - floor(random() * 30) * interval '1 day'
  from (
    -- Les 10 comptes visibles dans la classe de test.
    select * from (values
      ('panda01', 'tres-bon'),
      ('renard01', 'tres-bon'),
      ('loutre02', 'tres-mauvais'),
      ('koala03', 'tres-mauvais'),
      ('lynx02', 'bon'),
      ('hibou04', 'bon'),
      ('tigre05', 'mauvais'),
      ('zebre06', 'mauvais'),
      ('castor07', 'moyen'),
      ('manchot08', 'moyen')
    ) as profiles(login_id, profile)
  ) profile
  join public.student_profiles student on lower(student.login_id) = lower(profile.login_id)
  join public.class_memberships membership on membership.student_id = student.user_id
  join public.classes classroom on classroom.id = membership.class_id
    and classroom.name = 'TEST — profils de réussite'
  cross join lateral (
    -- Les fourchettes correspondent aux cinq profils demandés.
    select case profile.profile
      when 'tres-bon' then 8 + floor(random() * 2)::integer       -- 80–90 %
      when 'tres-mauvais' then 1 + floor(random() * 2)::integer   -- 10–20 %
      when 'bon' then 6 + floor(random() * 3)::integer            -- 60–80 %
      when 'mauvais' then 2 + floor(random() * 3)::integer       -- 20–40 %
      else 4 + floor(random() * 3)::integer                       -- 40–60 %
    end as correct_count
  ) score
  cross join lateral (
    select jsonb_agg(jsonb_build_object(
      'questionIndex', question.index,
      'prompt', 'Question de test ' || (question.index + 1),
      'response', case when question.index < score.correct_count then 'réponse correcte' else 'réponse à reprendre' end,
      'expected', 'réponse attendue',
      'correct', question.index < score.correct_count,
      'attempts', case when question.index < score.correct_count then 1 else 2 end,
      'hintsUsed', case when question.index < score.correct_count then 0 else 1 end,
      'errorFamily', case when question.index < score.correct_count then null else 'test-' || profile.profile end
    ) order by question.index) as response_details
    from generate_series(0, 9) as question(index)
  ) details
  cross join lateral (
    select game_id from (values
      ('race'), ('livrets'), ('geometrie'), ('calculs'), ('numeria'), ('pcp'),
      ('mesurovia'), ('conju_lab'), ('grammaire_lab'), ('musee_vocabulaire'),
      ('shift'), ('fractionstower2'), ('mathhunt')
    ) as games(game_id)
  ) game;
end $$;

-- Contrôle : doit retourner 130.
select count(*) as test_results_created
from public.activity_events
where activity_id = 'test-profils-reussite-20261114';
