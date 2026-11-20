-- Données de test Orbis : 10 élèves × 12 activités = 120 résultats.
--
-- À exécuter uniquement dans le projet Supabase de TEST, depuis SQL Editor.
-- Le script ne crée pas de compte Auth : les 10 comptes doivent déjà exister.
-- Il peut être relancé : il supprime uniquement les événements portant
-- l'identifiant de test ci-dessous, puis les recrée avec de nouveaux résultats.

do $$
declare
  test_activity constant text := 'test-profils-reussite-20261115';
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
    hints_used, duration_seconds, response_details, metadata, activity_kind, session_id, occurred_at
  )
  select
    gen_random_uuid(),
    student.user_id,
    game.game_id,
    test_activity,
    game.primary_skill,
    score.correct_count,
    10,
    10 - score.correct_count,
    case when score.correct_count < 8 then array[game.error_family || ':' || (10 - score.correct_count)::text]::text[] else '{}'::text[] end,
    floor(random() * 3)::integer,
    45 + floor(random() * 256)::integer,
    details.response_details,
    jsonb_build_object('simulation', true, 'profile', profile.profile, 'theme', game.category, 'difficulty', 'standard'),
    'game',
    gen_random_uuid(),
    now() - floor(random() * 30) * interval '1 day'
  from (
    -- Les 10 comptes visibles dans la classe de test.
    select * from (values
      ('renard01', 'tres-bon'),
      ('dauphin09', 'tres-bon'),
      ('chat10', 'tres-mauvais'),
      ('singe11', 'tres-mauvais'),
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
    select * from (values
      ('race', 'race.calcul_mental', 'race.ordre_grandeur', 'Calcul mental', 'Choisir rapidement le bon résultat', 'bonne option', 'option voisine', 'strategie-inefficace'),
      ('livrets', 'livrets.table_7', 'livrets.table_8', 'Multiplication', 'Calculer un produit des tables de 7 ou 8', '56', '54', 'confusion-table'),
      ('geometrie', 'geometrie.proprietes_figures', 'geometrie.vocabulaire', 'Géométrie', 'Reconnaître une propriété de la figure', 'propriété correcte', 'propriété incorrecte', 'confusion-propriete'),
      ('calculs', 'calculs.addition_decimale', 'calculs.soustraction_decimale', 'Nombres décimaux', 'Effectuer un calcul décimal', '12,5', '125', 'virgule-mal-placee'),
      ('numeria', 'numeria.valeur_position', 'numeria.comparaison', 'Numération', 'Identifier la valeur et comparer les nombres', 'valeur correcte', 'rang voisin', 'confusion-position'),
      ('mesurovia', 'mesurovia.conversion_longueur', 'mesurovia.choix_unite', 'Mesures', 'Convertir une longueur et choisir l’unité', 'conversion correcte', 'unité incorrecte', 'conversion-unite'),
      ('conju_lab', 'conju_lab.temps_verbe', 'conju_lab.accord_sujet', 'Conjugaison', 'Conjuguer le verbe avec le sujet indiqué', 'forme correcte', 'terminaison incorrecte', 'terminaison-verbale'),
      ('grammaire_lab', 'grammaire_lab.accord', 'grammaire_lab.fonction', 'Grammaire', 'Analyser ou compléter la phrase', 'analyse correcte', 'accord incorrect', 'accord-grammatical'),
      ('musee_vocabulaire', 'musee_vocabulaire.sens_mot', 'musee_vocabulaire.famille_mot', 'Vocabulaire', 'Associer le mot à son sens ou à sa famille', 'association correcte', 'mot proche', 'confusion-semantique'),
      ('shift', 'shift.ordre_grandeur', 'shift.comparaison', 'Numération', 'Comparer et estimer les nombres', 'estimation correcte', 'ordre incorrect', 'ordre-grandeur'),
      ('fractionstower2', 'fractionstower2.fraction_equivalente', 'fractionstower2.comparaison', 'Fractions', 'Comparer ou compléter les fractions', 'fraction correcte', 'fraction non équivalente', 'equivalence-fraction'),
      ('mathhunt', 'mathhunt.strategie_calcul', 'mathhunt.resolution', 'Résolution', 'Choisir une stratégie et résoudre le problème', 'solution correcte', 'résultat plausible mais faux', 'strategie-calcul')
    ) as games(game_id, primary_skill, secondary_skill, category, prompt_prefix, expected, wrong_answer, error_family)
  ) game
  cross join lateral (
    select jsonb_agg(jsonb_build_object(
      'questionIndex', question.question_number,
      'questionId', game.game_id || '-simulation-' || lpad((question.question_number + 1)::text, 2, '0'),
      'skillId', case when question.question_number % 2 = 0 then game.primary_skill else game.secondary_skill end,
      'category', game.category,
      'prompt', game.prompt_prefix || ' — exercice ' || (question.question_number + 1),
      'response', case when question.question_number < score.correct_count then game.expected else game.wrong_answer end,
      'expected', game.expected,
      'correct', question.question_number < score.correct_count,
      'attempts', case when question.question_number < score.correct_count then 1 else 2 end,
      'hintsUsed', case when question.question_number < score.correct_count then 0 else 1 end,
      'durationSeconds', 4 + floor(random() * 18)::integer,
      'errorFamily', case when question.question_number < score.correct_count then null else game.error_family end
    ) order by question.question_number) as response_details
    from generate_series(0, 9) as question(question_number)
  ) details;
end $$;

-- Contrôle : doit retourner 120.
select count(*) as test_results_created
from public.activity_events
where activity_id = 'test-profils-reussite-20261115';
