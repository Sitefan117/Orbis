# Arborescence commentée du code Orbis

État du dépôt au 23 novembre 2026. Cette carte couvre les fichiers exécutables et de configuration du projet ; les images, sons, cours HTML, fichiers générés et dépendances sont regroupés par dossier plus bas.

```text
.github/
  workflows/
    main.yml  — construction et publication GitHub Pages
package.json  — scripts npm et dépendances directes
package-lock.json  — versions exactes des dépendances npm
tsconfig.json  — règles TypeScript
.env.example  — variables d’environnement à renseigner
scripts/
  backup-supabase.sh  — outil de maintenance : backup supabase
  build-nexus-memory-pdf.py  — outil de maintenance : build nexus memory pdf
  curate-english-lab.mjs  — outil de maintenance : curate english lab
  english-lab-curation.mjs  — outil de maintenance : english lab curation
  enrich-musee-phrases.mjs  — outil de maintenance : enrich musee phrases
  generate-english-audio.py  — outil de maintenance : generate english audio
  generate-english-lexique.mjs  — outil de maintenance : generate english lexique
  generate-musee-audio.mjs  — outil de maintenance : generate musee audio
src/
  app.html  — coquille HTML des pages
  app.css  — styles globaux
  hooks.server.ts  — initialise les requêtes côté serveur
  lib/
    components/
      NumericKeypad.svelte  — pavé numérique partagé des jeux
      touch-input.ts  — détecte les tablettes utilisant le pavé intégré
    games/
      bazar/
        curriculum.ts  — programme et progression pédagogique
        types.ts  — types et contrats du jeu
      calculs/
        question-engine.ts  — génération et contrôle des questions
      conju-lab/
        curriculum.ts  — programme et progression pédagogique
        question-engine.ts  — génération et contrôle des questions
        types.ts  — types et contrats du jeu
        verbs.ts  — logique ou données de conju-lab : verbs
      fractionstower2/
        audio/
          AudioManager.ts  — logique ou données de fractionstower2 : AudioManager
        components/
          course/
            CourseViewer.svelte  — composant visuel CourseViewer
          exercises/
            ActivityModal.svelte  — composant visuel ActivityModal
            BossBattle.svelte  — composant visuel BossBattle
            BossFloor1.svelte  — composant visuel BossFloor1
            IntroCourse.svelte  — composant visuel IntroCourse
            TrainingSession.svelte  — composant visuel TrainingSession
          fraction/
            Fraction.svelte  — composant visuel Fraction
            FractionBar.svelte  — composant visuel FractionBar
            NumberLine.svelte  — composant visuel NumberLine
            VisualFractionModel.svelte  — composant visuel VisualFractionModel
        data/
          curriculum.ts  — programme et progression pédagogique
        engines/
          ExerciseGenerator.ts  — génération et contrôle des questions
        game/
          CollisionEngine.ts  — règles et moteur du jeu
          FloorManager.ts  — logique ou données de fractionstower2 : FloorManager
          GameState.svelte.ts  — logique ou données de fractionstower2 : GameState.svelte
          InteractionEngine.ts  — règles et moteur du jeu
        persistence/
          LanguageManager.ts  — logique ou données de fractionstower2 : LanguageManager
          ProgressManager.ts  — sauvegarde ou progression du jeu
          SaveManager.ts  — sauvegarde ou progression du jeu
        types/
          world.ts  — types et contrats du jeu
      geometrie/
        ConstructionLab.svelte  — composant visuel ConstructionLab
        FigureDrawing.svelte  — composant visuel FigureDrawing
        construction-progress.ts  — sauvegarde ou progression du jeu
        construction.ts  — logique ou données de geometrie : construction
        figures.ts  — logique ou données de geometrie : figures
        gamification.ts  — logique ou données de geometrie : gamification
        question-engine.ts  — génération et contrôle des questions
        types.ts  — types et contrats du jeu
      grammaire-lab/
        curriculum.ts  — programme et progression pédagogique
        engine.ts  — règles et moteur du jeu
        practice.ts  — logique ou données de grammaire-lab : practice
        types.ts  — types et contrats du jeu
      livrets/
        question-engine.ts  — génération et contrôle des questions
      mathhunt/
        engine.js  — règles et moteur du jeu
        question-engine.ts  — génération et contrôle des questions
      mesurovia/
        ActivityIllustration.svelte  — composant visuel ActivityIllustration
        ConversionGuide.svelte  — composant visuel ConversionGuide
        ConversionPlacementTable.svelte  — composant visuel ConversionPlacementTable
        GameObjectArt.svelte  — composant visuel GameObjectArt
        conversion-table.ts  — règles du tableau de conversion
        courses/
          areas.ts  — contenu de cours areas
          conversions.ts  — contenu de cours conversions
          fondations.ts  — contenu de cours fondations
          index.ts  — contenu de cours index
          mastery.ts  — contenu de cours mastery
          types.ts  — types et contrats du jeu
          volumes.ts  — contenu de cours volumes
        curriculum.ts  — parcours des maisons et objectifs
        engine-legacy.js  — ancien moteur maintenu pour compatibilité
        engine-v3-adapter.ts  — adaptation vers le moteur actuel
        memory-game.ts  — logique du jeu de mémoire
        page-config.ts  — contenus et réglages de la page Mesurovia
        progress.ts  — sauvegarde et progression Mesurovia
        question-bank.ts  — banque des questions
        session-types.ts  — types des séances Mesurovia
      musee-vocabulaire/
        ContextLab.svelte  — composant visuel ContextLab
        Museum.svelte  — composant visuel Museum
        context-content.ts  — logique ou données de musee-vocabulaire : context-content
        lexique.ts  — logique ou données de musee-vocabulaire : lexique
        progress.ts  — sauvegarde ou progression du jeu
      numeria/
        curriculum.ts  — royaumes et objectifs Numéria
        progress.ts  — sauvegarde Numéria
        question-engine.ts  — génération et validation des questions
        types.ts  — types Numéria
      pcp/
        types.ts  — types et contrats du jeu
      race/
        audio.ts  — sons du jeu
        engine.ts  — logique des calculs et courses
        game-config.ts  — réglages et activités de Math Racer
        progress.ts  — progression du jeu
        scene-tools.ts  — objets de la scène 3D
      shift/
        config.ts  — missions et difficultés de Shift
        number-engine.ts  — calculs et représentation des nombres Shift
        task-generator.ts  — génération des tâches Shift
    orbis/
      auth/
        client.ts  — authentification côté navigateur
      catalog/
        course-paths.ts  — chemins des cours
        courses.ts  — catalogue des cours
        games.ts  — catalogue des jeux
      components/
        CatalogCard.svelte  — composant visuel partagé CatalogCard
        OrbitCompanion.svelte  — composant visuel partagé OrbitCompanion
        PixelWordmark.svelte  — composant visuel partagé PixelWordmark
      identity/
        local-student.ts  — profil élève local
      navigation.ts  — liens et retour au catalogue avec contexte
      pcp/
        remote.ts  — données PCP distantes
      persistence/
        game-services.ts  — interface de sauvegarde des jeux
        local-store.ts  — stockage local
        remote-session.ts  — session distante
        supabase-rest.ts  — appels REST à Supabase
        sync.ts  — synchronisation local et distant
      progress/
        contract.ts  — forme de la progression
      results/
        client.ts  — lecture et écriture des résultats
        contract.ts  — forme des résultats
      tasks/
        remote.ts  — tâches assignées à distance
      teacher/
        CompetencyTracker.svelte  — fonction de suivi enseignant : CompetencyTracker
        LocalTrackingPanel.svelte  — fonction de suivi enseignant : LocalTrackingPanel
        RemoteTeacherDashboard.svelte  — fonction de suivi enseignant : RemoteTeacherDashboard
        csv.ts  — sécurise les cellules CSV
        learning-taxonomy.ts  — classe les apprentissages
        nexus-construction-summary.ts  — synthèse des constructions Nexus
        remote.ts  — données enseignantes distantes
        result-export.ts  — exporte les résultats
      tracking/
        client.ts  — collecte des événements pédagogiques
        contract.ts  — forme des événements pédagogiques
    server/
      activity-results.ts  — traitement serveur des résultats
      auth/
        password-hash.ts  — hachage des mots de passe
        print-teacher-hash.ts  — outil de préparation du hachage enseignant
      db/
        client.ts  — connexion à la base locale serveur
        migrate.ts  — application des migrations locales
        schema.ts  — schéma de la base locale serveur
      teacher-auth.ts  — authentification serveur enseignant
  routes/
    +layout.svelte  — cadre commun des pages
    +layout.ts  — configuration du rendu des routes
    +page.svelte  — portail, catalogue et accueil Orbis
    api/
      activity-results/
        +server.ts  — API locale des résultats
      chat/
        +server.ts  — API locale de conversation PCP
    bazar/
      +page.svelte  — page bazar
    calculs/
      +page.svelte  — page Calcul décimal
    confidentialite/
      +page.svelte  — page confidentialité
    conju_lab/
      +page.svelte  — page ConjuFighter
    english_lab/
      +page.svelte  — page English Lab
    fractionstower2/
      +page.svelte  — page Fraction Tower
      play/
        +page.svelte  — page Fraction Tower — play
    geometrie/
      +page.svelte  — page Nexus Géométrie
    grammaire_lab/
      +page.svelte  — page Grammaire Lab
    livrets/
      +page.svelte  — page Atelier des livrets
    mathhunt/
      +page.svelte  — page Table Hunt
    mesurovia/
      +page.svelte  — page Mesurovia
    musee_vocabulaire/
      +page.svelte  — page Musée des mots
      atelier/
        +page.svelte  — page Musée des mots — atelier
    numeria/
      +page.svelte  — page Numéria
    pcp/
      +page.svelte  — page PCP
    race/
      +page.svelte  — page Math Racer
    shift/
      +page.svelte  — page Shift
    student/
      +page.svelte  — page connexion élève
      sync/
        +page.svelte  — page connexion élève — sync
    teacher/
      +page.svelte  — page espace enseignant
      admin/
        +page.svelte  — page espace enseignant — admin
static/
  orbis/
    catalog-return.js  — retour au catalogue depuis les cours HTML
supabase/
  functions/
    orbis-admin/
      index.ts  — fonction distante des opérations administrateur
  migrations/
    202610250001_orbis_free_pilot.sql  — migration SQL : orbis free pilot
    202611120001_orbis_short_ids.sql  — migration SQL : orbis short ids
    202611130001_orbis_admin_student_rpc.sql  — migration SQL : orbis admin student rpc
    202611130002_orbis_copy_student_save.sql  — migration SQL : orbis copy student save
    202611130003_orbis_details_and_pcp.sql  — migration SQL : orbis details and pcp
    202611150001_orbis_tracking_context.sql  — migration SQL : orbis tracking context
    202611150002_orbis_student_tasks.sql  — migration SQL : orbis student tasks
    202611150003_orbis_task_recipients.sql  — migration SQL : orbis task recipients
    202611200001_orbis_private_rls_helpers.sql  — migration SQL : orbis private rls helpers
  test-data/
    seed-test-results.sql  — données de démonstration pour tests
svelte.config.js  — adaptateur statique et préfixe /Orbis
tests/
  bazar-curriculum.test.ts  — test automatisé : bazar curriculum
  conju-lab-engine-smoke.cjs  — test automatisé : conju lab engine smoke
  content-quality-v3.test.cjs  — test automatisé : content quality v3
  engine-v3.test.cjs  — test automatisé : engine v3
  engine.test.cjs  — test automatisé : engine
  fractionstower2-generator.test.ts  — test automatisé : fractionstower2 generator
  geometrie-construction.test.ts  — test automatisé : geometrie construction
  geometrie-gamification.test.ts  — test automatisé : geometrie gamification
  geometry-engine-smoke.cjs  — test automatisé : geometry engine smoke
  grammaire-lab-engine.test.ts  — test automatisé : grammaire lab engine
  mental-math-workshop.test.cjs  — test automatisé : mental math workshop
  mesurovia-conversion-table.test.ts  — test automatisé : mesurovia conversion table
  mesurovia-curriculum.test.ts  — test automatisé : mesurovia curriculum
  musee-vocabulaire-progress.test.ts  — test automatisé : musee vocabulaire progress
  musee-vocabulaire.test.ts  — test automatisé : musee vocabulaire
  nexus-construction-summary.test.ts  — test automatisé : nexus construction summary
  numeria-engine-smoke.cjs  — test automatisé : numeria engine smoke
  numeria-progress-smoke.cjs  — test automatisé : numeria progress smoke
  orbis-catalog-navigation.test.ts  — test automatisé : orbis catalog navigation
  orbis-local-student.test.ts  — test automatisé : orbis local student
  orbis-multi-student-persistence.test.cjs  — test automatisé : orbis multi student persistence
  orbis-navigation-smoke.py  — test automatisé : orbis navigation smoke
  orbis-remote-session.test.ts  — test automatisé : orbis remote session
  orbis-result-export.test.ts  — test automatisé : orbis result export
  orbis-route-structure.py  — test automatisé : orbis route structure
  orbis-student-profile-simulation.test.cjs  — test automatisé : orbis student profile simulation
  orbis-update-detection.test.cjs  — test automatisé : orbis update detection
  race-table-selection.test.ts  — test automatisé : race table selection
  run-conju-lab-smoke.sh  — test automatisé : run conju lab smoke
  run-smoke.sh  — test automatisé : run smoke
  shift-task-generator.test.ts  — test automatisé : shift task generator
vite.config.ts  — configuration Vite
```

## Dossiers non exécutables

- `static/` : images, sons, cours HTML, documents et autres ressources servis tels quels par GitHub Pages.
- `docs/` : architecture, audits, décisions, installation et guides.
- `archives/` : anciens contenus conservés hors application active.
- `.agents/` : instructions et skills locaux pour les agents de développement.
- `node_modules/`, `.svelte-kit/`, `build/` : dépendances ou fichiers générés ; ne pas les modifier à la main.

## Où intervenir ?

- Ajouter un jeu : page dans `src/routes/`, règles dans `src/lib/games/`, entrée dans `src/lib/orbis/catalog/games.ts`.
- Changer une question : chercher `question-engine`, `curriculum` ou `task-generator` dans le dossier du jeu.
- Changer l’affichage d’un jeu : `src/routes/<jeu>/+page.svelte` et ses composants dans `src/lib/games/<jeu>/`.
- Changer comptes, sauvegardes ou suivi : `src/lib/orbis/identity/`, `auth/`, `persistence/`, `tracking/` et les migrations `supabase/`.
- Vérifier une modification : `npm run check`, `npm test`, puis `npm run build` pour la publication.
