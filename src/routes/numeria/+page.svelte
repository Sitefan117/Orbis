<script lang="ts">
  /**
   * NUMÉRIA — Les Royaumes de la Numération
   * --------------------------------------------------------------
   * Écran Svelte du jeu. Le contenu des royaumes, la génération des
   * exercices et la sauvegarde sont séparés dans src/lib/games/numeria/.
   * Les contrôles sont volontairement des boutons/champs natifs : ils
   * fonctionnent au toucher sur iPad et au clavier/souris sur ordinateur.
   */
  import { base } from '$app/paths';
  import { catalogReturnHref } from '$lib/orbis/navigation';
  import { onDestroy, onMount } from 'svelte';
  import { getStudentName } from '$lib/orbis/identity/local-student';
  import { submitActivityResult } from '$lib/orbis/results/client';
  import { CODEX, GRADE_STORIES, REALMS, getRealm, realmsForGrade } from '$lib/games/numeria/curriculum';
  import { answersEqual, generateQuestions, normalizeAnswer } from '$lib/games/numeria/question-engine';
  import { clearProgress, createEmptySave, loadSave, saveProgress, TEACHER_ACCESS_CODE } from '$lib/games/numeria/progress';
  import type { ActiveMissionSave, Grade, MissionFeedback, MissionMode, Question, QuestionOutcome, Realm, SessionResult, StudentSave } from '$lib/games/numeria/types';

  type Screen = 'welcome' | 'hub' | 'realm' | 'game' | 'result' | 'codex';
  type Feedback = MissionFeedback;

  // Écran actuellement affiché. La valeur détermine quelle vue du jeu est rendue plus bas.
  let screen: Screen = 'welcome';
  // Identité de l'élève : nameInput est le champ du formulaire, studentName le profil actif.
  let nameInput = '';
  let studentName = '';
  // Parcours scolaire sélectionné ; il sert à filtrer les royaumes et les exercices.
  let selectedGrade: Grade = '6H';
  // Progression du profil en cours, chargée et enregistrée par progress.ts.
  let save: StudentSave = createEmptySave('Visiteur');
  let activeRealmId = '';
  let missionMode: MissionMode = 'training';
  // Questions de la mission en cours et état de la question actuellement affichée.
  let questions: Question[] = [];
  let questionIndex = 0;
  let answer = '';
  let attemptsForQuestion = 0;
  let showHint = false;
  let feedback: Feedback = 'none';
  let feedbackText = '';
  let questionFinished = false;
  let outcomes: QuestionOutcome[] = [];
  let result: SessionResult | null = null;
  let previousScreen: Screen = 'hub';

  // Panneau de déverrouillage enseignant : le code est une aide locale, pas un accès sécurisé.
  let teacherPanelOpen = false;
  let accessCode = '';
  let pendingRealmId = '';
  let teacherMessage = '';
  let codexSelectedId = '';
  let soundOn = false;
  let soundContext: AudioContext | null = null;
  let disposed = false;

  // Variables calculées par Svelte à partir de l'état courant.
  // Elles sont recalculées automatiquement quand leurs dépendances changent.
  let currentRealm: Realm | undefined;
  let currentQuestion: Question | undefined;
  let gradeRealms: Realm[] = [];
  let coreRealms: Realm[] = [];
  let gradeStory = GRADE_STORIES['6H'];
  let unlockedCodex: Realm[] = [];
  let progressCount = 0;
  let progressPercent = 0;
  let sortedNumberOptions: string[] = [];

  /** Restaure une mission enregistrée, avec ses questions déjà générées. */
  function resumeActiveMission(session: ActiveMissionSave | undefined = save.activeMission): boolean {
    if (!session || !getRealm(session.realmId)) return false;
    activeRealmId = session.realmId;
    selectedGrade = session.grade;
    missionMode = session.mode;
    questions = session.questions;
    questionIndex = session.questionIndex;
    answer = session.answer;
    attemptsForQuestion = session.attemptsForQuestion;
    showHint = session.showHint;
    feedback = session.feedback;
    feedbackText = session.feedbackText;
    questionFinished = session.questionFinished;
    outcomes = session.outcomes;
    result = null;
    screen = 'game';
    return true;
  }

  /** Enregistre l'état pédagogique de la mission sans changer son moteur ni ses règles. */
  function persistActiveMission(): void {
    const realm = getRealm(activeRealmId);
    if (!studentName || !realm || screen !== 'game' || questions.length === 0) return;

    save.activeMission = {
      realmId: realm.id,
      grade: selectedGrade,
      mode: missionMode,
      questions,
      questionIndex,
      answer,
      attemptsForQuestion,
      showHint,
      feedback,
      feedbackText,
      questionFinished,
      outcomes,
      savedAt: new Date().toISOString()
    };
    saveProgress(save);
  }

  function revealHint(): void {
    showHint = true;
    persistActiveMission();
  }

  function updateAnswerFromInput(event: Event): void {
    answer = (event.currentTarget as HTMLInputElement).value;
    persistActiveMission();
  }

  // Royaume, question, carte et progression visibles : valeurs dérivées de l'état du jeu.
  $: currentRealm = getRealm(activeRealmId);
  $: currentQuestion = questions[questionIndex] as Question | undefined;
  $: gradeRealms = realmsForGrade(selectedGrade);
  $: coreRealms = gradeRealms.filter((realm) => realm.core);
  $: gradeStory = GRADE_STORIES[selectedGrade];
  $: unlockedCodex = REALMS.filter((realm) => save.codexEntries.includes(realm.id));
  $: progressCount = coreRealms.filter((realm) => save.completedRealms.includes(realm.id)).length;
  $: progressPercent = Math.round((progressCount / Math.max(1, coreRealms.length)) * 100);
  $: sortedNumberOptions = currentQuestion?.options ? [...currentQuestion.options].sort((a, b) => Number(normalizeAnswer(a)) - Number(normalizeAnswer(b))) : [];

  // Au chargement, on essaie de récupérer l'élève transmis par ORBIS ou mémorisé localement.
  onMount(() => {
    // ORBIS peut transmettre le profil via ?eleve=Prénom. À défaut, on lit son profil local.
    const urlName = new URLSearchParams(window.location.search).get('eleve')?.trim();
    const connectedName = urlName || getStudentName() || '';
    if (connectedName) {
      nameInput = connectedName;
      studentName = connectedName;
      save = loadSave(connectedName, '6H');
      selectedGrade = save.grade;
      if (!resumeActiveMission()) screen = 'hub';
    }
  });

  // Libère la ressource audio quand on quitte définitivement cette page.
  onDestroy(() => {
    disposed = true;
    if (soundContext) void soundContext.close();
  });

  /** Valide le nom, charge la sauvegarde de l'élève et ouvre la carte des royaumes. */
  function beginAdventure(): void {
    const chosenName = nameInput.trim().replace(/\s+/g, ' ');
    if (chosenName.length < 2) return;
    studentName = chosenName;
    save = loadSave(chosenName, selectedGrade);
    save.grade = selectedGrade;
    saveProgress(save);
    if (!resumeActiveMission()) screen = 'hub';
    playTone(660, 0.08);
  }

  /** Ferme le profil actuel sans effacer ses données et revient à l'écran d'accueil. */
  function switchStudent(): void {
    // On quitte le profil sans effacer sa sauvegarde : un autre élève peut se connecter.
    nameInput = '';
    studentName = '';
    save = createEmptySave('Visiteur');
    selectedGrade = '6H';
    screen = 'welcome';
    teacherPanelOpen = false;
    answer = '';
  }

  /** Change de parcours scolaire et persiste le choix dans la sauvegarde locale. */
  function changeGrade(event: Event): void {
    const value = (event.currentTarget as HTMLSelectElement).value;
    if (value !== '6H' && value !== '7H' && value !== '8H') return;
    selectedGrade = value;
    save.grade = value;
    saveProgress(save);
    playTone(520, 0.05);
  }

  /** Indique si un royaume est disponible selon l'ordre, les réussites et les dérogations enseignant. */
  function isRealmUnlocked(realm: Realm): boolean {
    if (realm.grade !== selectedGrade) return false;
    // Un royaume signalé comme extension est accessible sans bloquer la progression centrale.
    if (!realm.core) return true;
    if (realm.order === 1) return true;
    if (save.teacherBypassRealms.includes(realm.id)) return true;
    const previousCoreRealms = realmsForGrade(realm.grade).filter((item) => item.core && item.order < realm.order);
    const previous = previousCoreRealms.sort((a, b) => b.order - a.order)[0];
    // Le premier royaume central est ouvert même s'il se trouve après une extension facultative.
    return previous ? save.completedRealms.includes(previous.id) : true;
  }

  /** Renvoie la progression du royaume ou une progression vide si aucune entrée n'existe. */
  function realmProgress(realmId: string) {
    return save.realms[realmId] ?? { trainingBest: 0, guardianBest: 0, guardianWon: false, codexUnlocked: false, attempts: 0, totalCorrect: 0 };
  }

  /** Ouvre un royaume ; si celui-ci est verrouillé, affiche le panneau enseignant. */
  function chooseRealm(realm: Realm): void {
    if (!isRealmUnlocked(realm)) {
      openTeacherPanel(realm.id);
      return;
    }
    activeRealmId = realm.id;
    screen = 'realm';
    playTone(480, 0.06);
  }

  /** Revient à la carte principale et remet à zéro les éléments de feedback de la mission. */
  function backToHub(): void {
    screen = 'hub';
    teacherPanelOpen = false;
    answer = '';
    feedback = 'none';
  }

  /** Initialise une nouvelle série de questions en mode entraînement ou gardien. */
  function startMission(mode: MissionMode): void {
    if (!currentRealm) return;
    if (save.activeMission && typeof window !== 'undefined'
      && !window.confirm('Une mission Numéria est déjà en cours. Commencer une nouvelle mission remplacera sa sauvegarde en cours. Continuer ?')) return;
    if (mode === 'guardian' && realmProgress(currentRealm.id).trainingBest < 3 && !realmProgress(currentRealm.id).guardianWon) {
      feedbackText = 'Termine d’abord l’entraînement avec au moins 3 réponses justes pour réveiller le gardien.';
      feedback = 'try-again';
      return;
    }
    missionMode = mode;
    questions = generateQuestions(selectedGrade, currentRealm.id, mode);
    questionIndex = 0;
    answer = '';
    attemptsForQuestion = 0;
    showHint = false;
    feedback = 'none';
    feedbackText = '';
    questionFinished = false;
    outcomes = questions.map(() => ({ solved: false, firstTry: false, mistakes: 0 }));
    result = null;
    screen = 'game';
    persistActiveMission();
    playTone(mode === 'guardian' ? 740 : 600, 0.1);
  }

  /** Met à jour la réponse choisie tant que la question n'est pas terminée. */
  function selectAnswer(value: string): void {
    if (!questionFinished) {
      answer = value;
      persistActiveMission();
    }
  }

  /** Compare la réponse, donne un indice après une erreur et révèle la correction au second échec. */
  function validateAnswer(): void {
    if (!currentQuestion || questionFinished || answer.trim() === '') return;
    const isCorrect = currentQuestion.kind === 'choice' || currentQuestion.kind === 'numberline'
      ? normalizeAnswer(answer) === normalizeAnswer(currentQuestion.expected)
      : answersEqual(answer, currentQuestion.expected);

    if (isCorrect) {
      outcomes[questionIndex] = { solved: true, firstTry: attemptsForQuestion === 0, mistakes: outcomes[questionIndex]?.mistakes ?? 0 };
      questionFinished = true;
      feedback = 'success';
      feedbackText = attemptsForQuestion === 0
        ? 'Le sceau s’illumine ! Réponse exacte du premier coup.'
        : 'Bien joué : tu as corrigé ta réponse.';
      persistActiveMission();
      playTone(880, 0.11);
      return;
    }

    attemptsForQuestion += 1;
    outcomes[questionIndex] = { ...(outcomes[questionIndex] ?? { solved: false, firstTry: false, mistakes: 0 }), mistakes: (outcomes[questionIndex]?.mistakes ?? 0) + 1 };
    showHint = true; // L'indice apparaît après une erreur, sans punition ni blocage.
    playTone(220, 0.1);
    if (attemptsForQuestion < 2) {
      feedback = 'try-again';
      feedbackText = 'Pas encore. Lis l’indice et essaie une deuxième fois.';
      answer = '';
    } else {
      outcomes[questionIndex] = { solved: false, firstTry: false, mistakes: outcomes[questionIndex]?.mistakes ?? attemptsForQuestion };
      questionFinished = true;
      feedback = 'reveal';
      feedbackText = `La réponse attendue était ${currentQuestion.expected}. Lis l’explication, puis continue.`;
    }
    persistActiveMission();
  }

  /** Passe à la question suivante ou termine la mission après la dernière question. */
  function advanceQuestion(): void {
    if (!questionFinished) return;
    if (questionIndex < questions.length - 1) {
      questionIndex += 1;
      answer = '';
      attemptsForQuestion = 0;
      showHint = false;
      feedback = 'none';
      feedbackText = '';
      questionFinished = false;
      persistActiveMission();
      return;
    }
    finishMission();
  }

  /** Calcule le bilan, met à jour XP/progression et tente d'envoyer le résultat à ORBIS. */
  function finishMission(): void {
    if (!currentRealm) return;
    const total = questions.length;
    const correct = outcomes.filter((outcome) => outcome.solved).length;
    const firstTry = outcomes.filter((outcome) => outcome.solved && outcome.firstTry).length;
    const percent = total ? Math.round((correct / total) * 100) : 0;
    const stars = percent >= 90 && firstTry >= Math.ceil(total * 0.6) ? 3 : percent >= 70 ? 2 : percent >= 50 ? 1 : 0;
    const guardianWon = missionMode === 'guardian' && correct >= Math.ceil(total * 0.7);
    const old = realmProgress(currentRealm.id);
    const errorCount = outcomes.reduce((count, outcome) => count + (outcome?.mistakes ?? 0), 0);
    const bestScore = missionMode === 'training'
      ? Math.max(old.trainingBest, correct)
      : Math.max(old.guardianBest, correct);
    const xpGained = firstTry * 12 + (correct - firstTry) * 7 + (guardianWon ? 20 : 0) + (stars === 3 ? 10 : 0);

    save.realms[currentRealm.id] = {
      ...old,
      trainingBest: missionMode === 'training' ? Math.max(old.trainingBest, correct) : old.trainingBest,
      guardianBest: missionMode === 'guardian' ? Math.max(old.guardianBest, correct) : old.guardianBest,
      guardianWon: old.guardianWon || guardianWon,
      codexUnlocked: old.codexUnlocked || guardianWon,
      attempts: old.attempts + 1,
      totalCorrect: old.totalCorrect + correct,
      lastPlayedAt: new Date().toISOString()
    };
    if (guardianWon) {
      if (!save.completedRealms.includes(currentRealm.id)) save.completedRealms.push(currentRealm.id);
      if (!save.codexEntries.includes(currentRealm.id)) save.codexEntries.push(currentRealm.id);
    }
    save.xp += xpGained;
    save.grade = selectedGrade;
    save.activeMission = undefined;
    saveProgress(save);

    // Prépare l'envoi vers le suivi ORBIS existant. La sauvegarde de secours reste locale.
    // L'échec de la synchronisation ne bloque jamais l'écran de résultat.
    try {
      const submission = submitActivityResult({
        studentName,
        world: 'numeria',
        mission: `${currentRealm.id}-${missionMode}`,
        score: correct,
        total,
        scoreBasis: 'best',
        errorCount,
        errorFamilies: questions.filter((question, index) => (outcomes[index]?.mistakes ?? 0) > 0).map((question) => question.errorFamily),
        metadata: { grade: selectedGrade, realmId: currentRealm.id, mode: missionMode, stars, firstTry, xpGained, guardianWon, sessionScore: correct, bestScore, errorCount }
      });
      void Promise.resolve(submission).catch((error) => console.warn('[Numéria] Résultat non synchronisé à ORBIS ; la progression locale est conservée.', error));
    } catch (error) {
      console.warn('[Numéria] Envoi à ORBIS indisponible ; la progression locale est conservée.', error);
    }

    result = { correct, total, percent, stars, xpGained, guardianWon };
    screen = 'result';
    playTone(guardianWon ? 990 : 520, 0.18);
  }

  /** Oriente l'élève vers le prochain royaume ou vers le Codex après le bilan. */
  function continueAfterResult(): void {
    if (missionMode === 'guardian' && result?.guardianWon) {
      const next = realmsForGrade(selectedGrade).find((realm) => realm.order === (currentRealm?.order ?? 0) + 1);
      if (next) {
        activeRealmId = next.id;
        screen = 'realm';
        return;
      }
      screen = 'codex';
      codexSelectedId = unlockedCodex[0]?.id ?? '';
      return;
    }
    screen = 'realm';
  }

  /** Ouvre le Codex et sélectionne une page déjà déverrouillée si possible. */
  function openCodex(realmId?: string): void {
    previousScreen = screen;
    codexSelectedId = realmId && save.codexEntries.includes(realmId) ? realmId : (unlockedCodex[0]?.id ?? '');
    screen = 'codex';
  }

  /** Prépare l'accès enseignant pour le royaume demandé et ouvre le panneau. */
  function openTeacherPanel(realmId: string): void {
    pendingRealmId = realmId;
    accessCode = '';
    teacherMessage = '';
    teacherPanelOpen = true;
  }

  /** Vérifie le code enseignant et ajoute une dérogation locale pour les royaumes précédents. */
  function unlockRealm(): void {
    const requested = getRealm(pendingRealmId);
    if (!requested) return;
    if (accessCode.trim() !== TEACHER_ACCESS_CODE) {
      teacherMessage = 'Code incorrect. Vérifie le code enseignant.';
      playTone(190, 0.12);
      return;
    }
    // Le code ouvre le royaume choisi et les étapes précédentes du même parcours.
    for (const realm of realmsForGrade(requested.grade)) {
      if (realm.order <= requested.order && !save.teacherBypassRealms.includes(realm.id)) save.teacherBypassRealms.push(realm.id);
    }
    selectedGrade = requested.grade;
    save.grade = selectedGrade;
    saveProgress(save);
    teacherMessage = 'Accès pédagogique accordé pour ce royaume et les étapes précédentes.';
    playTone(880, 0.12);
    teacherPanelOpen = false;
    activeRealmId = requested.id;
    screen = 'realm';
  }

  /** Formate les grands nombres avec l'apostrophe usuelle en Suisse. */
  function formatSwiss(value: number): string {
    // fr-CH utilise parfois des espaces fines pour les milliers ; de-CH donne l'apostrophe suisse attendue.
    return Math.trunc(value).toLocaleString('de-CH').replace(/[’']/g, '’');
  }

  /** Retourne à la page d'accueil d'ORBIS en respectant le base path de l'application. */
  function returnToOrbis(): void {
    window.location.replace(catalogReturnHref(base, 'jeux', studentName));
  }

  /** Active ou désactive les bips synthétiques du jeu. */
  function toggleSound(): void {
    soundOn = !soundOn;
    if (soundOn) playTone(660, 0.08);
  }

  /** Petit signal synthétique, désactivé par défaut ; aucun fichier audio requis. */
  function playTone(frequency: number, duration: number): void {
    if (!soundOn || disposed || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext;
      if (!AudioContextClass) return;
      soundContext ??= new AudioContextClass();
      if (soundContext.state === 'suspended') void soundContext.resume();
      const oscillator = soundContext.createOscillator();
      const gain = soundContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.055, soundContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, soundContext.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(soundContext.destination);
      oscillator.start();
      oscillator.stop(soundContext.currentTime + duration);
    } catch (error) {
      console.debug('[Numéria] Audio indisponible dans ce navigateur.', error);
    }
  }

  /** Permet de fermer le panneau enseignant avec Échap ou de revenir à la carte. */
  function handleGlobalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (teacherPanelOpen) teacherPanelOpen = false;
      else if (screen === 'realm' || screen === 'codex' || screen === 'result') backToHub();
    }
  }

  /** Demande confirmation avant d'effacer la progression locale de ce profil sur cet appareil. */
  function confirmClearProgress(): void {
    if (!studentName || !window.confirm(`Effacer la progression locale de ${studentName} sur cet appareil ? Cette action ne peut pas être annulée.`)) return;
    clearProgress(studentName);
    save = createEmptySave(studentName, selectedGrade);
    saveProgress(save);
    backToHub();
  }
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<svelte:head>
  <title>Numéria — Les Royaumes de la Numération</title>
  <meta name="description" content="Une aventure mathématique pour explorer les nombres, les rangs, les fractions et les décimaux." />
  <meta name="theme-color" content="#111523" />
</svelte:head>

<!-- Conteneur général : fond, barre supérieure, vue du jeu et pied de page. -->
<div class="numeria-shell">
  <!-- Barre supérieure commune aux écrans : marque, profil, XP et son. -->
  <header class="topbar">
    <button class="brand" onclick={() => studentName ? backToHub() : screen = 'welcome'} aria-label="Revenir à la carte de Numéria">
      <span class="brand-mark" aria-hidden="true">✦</span>
      <span><strong>NUMÉRIA</strong><small>LES ROYAUMES DE LA NUMÉRATION</small></span>
    </button>
    <div class="top-actions">
      <button class="quiet-button" onclick={returnToOrbis}>↩ ORBIS</button>
      {#if studentName}
        <span class="profile-chip"><span class="profile-dot"></span>{studentName}</span>
        <span class="xp-chip" aria-label={`${save.xp} points d'expérience`}>✧ {save.xp} XP</span>
      {/if}
      <button class="icon-button" onclick={toggleSound} aria-label={soundOn ? 'Désactiver les sons' : 'Activer les sons'} title={soundOn ? 'Son activé' : 'Son désactivé'}>{soundOn ? '♫' : '♬'}</button>
      {#if studentName}
        <button class="quiet-button" onclick={switchStudent}>Changer de profil</button>
      {/if}
    </div>
  </header>

  <main>
    <!-- Une seule vue principale est rendue à la fois selon la variable screen. -->
    {#if screen === 'welcome'}
      <!-- Accueil : choix du nom et du parcours scolaire. -->
      <section class="welcome-screen" aria-labelledby="welcome-title">
        <div class="welcome-art" aria-hidden="true">
          <div class="moon"></div><div class="ring ring-one"></div><div class="ring ring-two"></div>
          <div class="floating-glyph glyph-a">⅛</div><div class="floating-glyph glyph-b">∞</div><div class="floating-glyph glyph-c">0,1</div>
          <div class="crystal crystal-one"></div><div class="crystal crystal-two"></div><div class="crystal crystal-three"></div>
          <div class="portal"><span>✧</span></div>
        </div>
        <div class="welcome-copy">
          <p class="eyebrow">TOME I · LA FRACTURE DES NOMBRES</p>
          <h1 id="welcome-title">Un monde.<br /><span>Des nombres à sauver.</span></h1>
          <p class="lead">Les sceaux des royaumes se sont brisés. Explore les terres, entraîne-toi, affronte les gardiens et retrouve les pages perdues du Codex.</p>
          <form class="entry-form" onsubmit={(event) => { event.preventDefault(); beginAdventure(); }}>
            <label for="player-name">Nom ou prénom d'aventurier</label>
            <input id="player-name" bind:value={nameInput} maxlength="48" autocomplete="given-name" placeholder="Entre ton prénom…" required minlength="2" />
            <label for="grade-choice">Ton parcours</label>
            <select id="grade-choice" bind:value={selectedGrade}>
              <option value="6H">6H · Archives des nombres</option>
              <option value="7H">7H · Frontière des écritures</option>
              <option value="8H">8H · Marches de la précision</option>
            </select>
            <button class="primary-button wide" type="submit">Entrer dans Numéria <span aria-hidden="true">↗</span></button>
          </form>
          <p class="small-note">Progression enregistrée sur cet appareil. La synchronisation entre appareils sera ajoutée avec le futur suivi commun d’ORBIS.</p>
        </div>
      </section>

    {:else if screen === 'hub'}
      <!-- Carte centrale : progression, royaumes disponibles et raccourcis. -->
      <section class="hub-screen">
        <div class="story-banner">
          <div class="story-symbol" aria-hidden="true">✧</div>
          <div class="story-text">
            <p class="eyebrow">JOURNAL D’EXPÉDITION · {selectedGrade}</p>
            <h1>{gradeStory.title}</h1>
            <p>{gradeStory.subtitle}</p>
          </div>
          <div class="progress-orb" aria-label={`${progressCount} royaumes principaux terminés sur ${coreRealms.length}`}>
            <strong>{progressCount}<small>/{coreRealms.length}</small></strong><span>sceaux</span>
          </div>
        </div>
        {#if save.activeMission}
          <div class="resume-mission-note" role="status">
            <p class="small-note">Ta mission est sauvegardée à la question {save.activeMission.questionIndex + 1} sur {save.activeMission.questions.length}.</p>
            <button class="secondary-button" onclick={() => resumeActiveMission()}>Reprendre la mission →</button>
          </div>
        {/if}

        <div class="map-toolbar">
          <div><h2>Carte des royaumes</h2><p>Entraîne-toi pour réveiller le gardien de chaque royaume.</p></div>
          <label class="grade-switch">Parcours
            <select value={selectedGrade} onchange={changeGrade} aria-label="Choisir le parcours scolaire">
              <option value="6H">6H</option><option value="7H">7H</option><option value="8H">8H</option>
            </select>
          </label>
        </div>

        <div class="progress-track" role="progressbar" aria-label="Progression du parcours" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progressPercent}><span style={`width: ${progressPercent}%`}></span></div>
        <div class="realm-map">
          {#each gradeRealms as realm, index}
            <article class={`realm-card theme-${realm.color} ${isRealmUnlocked(realm) ? '' : 'is-locked'} ${save.completedRealms.includes(realm.id) ? 'is-complete' : ''}`}>
              <div class="realm-card-top"><span class="realm-number">{String(realm.order).padStart(2, '0')}</span><span class="realm-symbol" aria-hidden="true">{realm.symbol}</span>{#if save.completedRealms.includes(realm.id)}<span class="status-seal" aria-label="Gardien vaincu">✓</span>{:else if !isRealmUnlocked(realm)}<span class="status-lock" aria-label="Royaume verrouillé">⌑</span>{/if}</div>
              <p class="realm-region">{realm.region}</p>
              <h3>{realm.name}</h3>
              <p class="realm-subtitle">{realm.subtitle}</p>
              <div class="realm-skill"><span>COMPÉTENCE</span>{realm.skill}</div>
              {#if !realm.core}<p class="extension-label">DÉFI D’EXTENSION</p>{/if}
              {#if isRealmUnlocked(realm)}
                <button class="card-action" onclick={() => chooseRealm(realm)}>Explorer <span aria-hidden="true">→</span></button>
              {:else}
                <button class="card-action locked-action" onclick={() => openTeacherPanel(realm.id)}>Royaume verrouillé <span aria-hidden="true">⌑</span></button>
              {/if}
            </article>
            {#if index < gradeRealms.length - 1}
              <div class={`map-connector ${save.completedRealms.includes(realm.id) ? 'connector-lit' : ''}`} aria-hidden="true"><span></span></div>
            {/if}
          {/each}
        </div>

        <section class="bottom-panels">
          <article class="side-panel codex-panel">
            <div class="panel-icon" aria-hidden="true">▤</div>
            <div><p class="eyebrow">OBJET DE QUÊTE</p><h3>Le Codex perdu</h3><p>{unlockedCodex.length} page{unlockedCodex.length > 1 ? 's' : ''} retrouvée{unlockedCodex.length > 1 ? 's' : ''}. Chaque gardien vaincu révèle une stratégie mathématique.</p></div>
            <button class="secondary-button" onclick={() => openCodex()}>Ouvrir le Codex <span>→</span></button>
          </article>
          <article class="side-panel goals-panel">
            <div class="panel-icon" aria-hidden="true">✧</div>
            <div><p class="eyebrow">TA MISSION</p><h3>Trois étapes pour chaque sceau</h3><p>1. Explore la compétence. 2. Entraîne-toi sans pression. 3. Affronte le gardien pour débloquer le royaume suivant.</p></div>
          </article>
        </section>

        <div class="utility-row"><button class="text-button" onclick={confirmClearProgress}>Effacer la progression de ce profil sur cet appareil</button><button class="text-button" onclick={() => openTeacherPanel(gradeRealms.find((realm) => !isRealmUnlocked(realm))?.id ?? gradeRealms[0].id)}>Accès enseignant</button></div>
      </section>

    {:else if screen === 'realm' && currentRealm}
      <!-- Fiche d'un royaume : histoire, compétence et accès à l'entraînement/au gardien. -->
      <section class={`realm-detail theme-${currentRealm.color}`}>
        <div class="breadcrumb"><button onclick={backToHub}>← Carte des royaumes</button><span>/</span><span>{selectedGrade}</span></div>
        <div class="realm-hero">
          <div class="realm-emblem" aria-hidden="true"><div class="emblem-ring"></div><span>{currentRealm.symbol}</span><i>✧</i></div>
          <div class="realm-hero-copy"><p class="eyebrow">ROYAUME {String(currentRealm.order).padStart(2, '0')} · {currentRealm.region.toLocaleUpperCase('fr-CH')}</p><h1>{currentRealm.name}</h1><p class="lead">{currentRealm.subtitle}</p><p>{currentRealm.story}</p><div class="skill-pill">✦ {currentRealm.learningGoal}</div></div>
        </div>
        {#if save.activeMission?.realmId === currentRealm.id}
          <div class="resume-mission-note" role="status">
            <p class="small-note">Une mission est sauvegardée à la question {save.activeMission.questionIndex + 1} sur {save.activeMission.questions.length}.</p>
            <button class="secondary-button" onclick={() => resumeActiveMission()}>Reprendre la mission →</button>
          </div>
        {/if}
        <div class="mission-grid">
          <article class="mission-card training-card"><div class="mission-icon" aria-hidden="true">✧</div><p class="eyebrow">ÉTAPE 1 · SANS PRESSION</p><h2>L’entraînement</h2><p>5 défis pour comprendre la compétence. Une erreur donne un indice ; tu peux réessayer.</p><div class="mission-meta"><span>5 questions</span><span>XP à gagner</span></div><button class="primary-button wide" onclick={() => startMission('training')}>Commencer l’entraînement →</button><p class="best-score">Meilleur score : {realmProgress(currentRealm.id).trainingBest}/5</p></article>
          <article class={`mission-card guardian-card ${realmProgress(currentRealm.id).trainingBest < 3 && !realmProgress(currentRealm.id).guardianWon ? 'mission-disabled' : ''}`}><div class="mission-icon" aria-hidden="true">♜</div><p class="eyebrow">ÉTAPE 2 · LE DÉFI</p><h2>{currentRealm.guardian}</h2><p>7 défis différents. Réussis au moins 5 réponses pour briser le sceau et révéler une page du Codex.</p><div class="mission-meta"><span>7 questions</span><span>+20 XP si victoire</span></div><button class="primary-button wide" disabled={realmProgress(currentRealm.id).trainingBest < 3 && !realmProgress(currentRealm.id).guardianWon} onclick={() => startMission('guardian')}>{realmProgress(currentRealm.id).guardianWon ? 'Rejouer le gardien ↻' : 'Défier le gardien →'}</button><p class="best-score">Meilleur score : {realmProgress(currentRealm.id).guardianBest}/7 {realmProgress(currentRealm.id).guardianWon ? '· Sceau brisé ✓' : ''}</p></article>
        </div>
        <section class="realm-bottom"><div><p class="eyebrow">OBJET DE QUÊTE</p><h3>Ce que tu vas apprendre</h3><p>{currentRealm.learningGoal}</p></div><div><p class="eyebrow">PAGE DU CODEX</p>{#if save.codexEntries.includes(currentRealm.id)}<button class="text-link" onclick={() => openCodex(currentRealm.id)}>{CODEX[currentRealm.id]?.title ?? 'Page retrouvée'} →</button>{:else}<p>Vaincs le gardien pour retrouver cette page.</p>{/if}</div></section>
      </section>

    {:else if screen === 'game' && currentRealm && currentQuestion}
      <!-- Mission en cours : question, réponses, indices, correction et progression. -->
      <section class="game-screen">
        <div class="game-topline"><button class="back-link" onclick={() => screen = 'realm'}>← Quitter la mission</button><div class="mission-label">{missionMode === 'training' ? 'ENTRAÎNEMENT' : `GARDIEN · ${currentRealm.guardian.toLocaleUpperCase('fr-CH')}`}</div><div class="question-count">{questionIndex + 1}<span> / {questions.length}</span></div></div>
        <div class="question-progress" aria-label={`Question ${questionIndex + 1} sur ${questions.length}`}><span style={`width: ${((questionIndex + 1) / questions.length) * 100}%`}></span></div>
        <div class="game-stage">
          <div class="stage-decoration" aria-hidden="true"><div class="stage-orb">{currentRealm.symbol}</div><span class="spark spark-one">✦</span><span class="spark spark-two">✧</span><span class="spark spark-three">·</span></div>
          <div class="question-card">
            <p class="eyebrow">{currentRealm.name} · {currentRealm.skill}</p>
            <h1>{currentQuestion.prompt}</h1>

            {#if currentQuestion.kind === 'numberline' && currentQuestion.line}
              <div class="numberline-visual" role="img" aria-label={`Droite graduée de ${currentQuestion.line.min} à ${currentQuestion.line.max}, divisée en dix intervalles`}>
                <div class="numberline-caption"><span>{formatSwiss(currentQuestion.line.min)}</span><span>{formatSwiss(currentQuestion.line.max)}</span></div>
                <div class="numberline-track">
                  <span class="numberline-axis"></span>
                  {#each Array.from({ length: 11 }, (_, i) => i) as tick}
                    <span class={`tick ${Math.abs((currentQuestion.line.target - currentQuestion.line.min) / (currentQuestion.line.max - currentQuestion.line.min) * 10 - tick) < 0.01 ? 'target-tick' : ''}`} style={`left: ${tick * 10}%`}><i></i></span>
                  {/each}
                </div>
                <p>Choisis la valeur qui correspond au repère.</p>
              </div>
            {/if}

            {#if currentQuestion.kind === 'choice' || currentQuestion.kind === 'numberline'}
              <div class={`answer-options ${currentQuestion.kind === 'numberline' ? 'numeric-options' : ''}`} role="group" aria-label="Choisir une réponse">
                {#each (currentQuestion.kind === 'numberline' ? sortedNumberOptions : currentQuestion.options ?? []) as option, index}
                  <button type="button" class={`answer-option ${answer === option ? 'selected-option' : ''} ${questionFinished && normalizeAnswer(option) === normalizeAnswer(currentQuestion.expected) ? 'correct-option' : ''}`} disabled={questionFinished} onclick={() => selectAnswer(option)}><span class="option-key">{String.fromCharCode(65 + index)}</span><span>{option}</span></button>
                {/each}
              </div>
            {:else}
              <form class="answer-entry" onsubmit={(event) => { event.preventDefault(); validateAnswer(); }}>
                <label for="question-answer">Ta réponse</label>
                <input id="question-answer" value={answer} oninput={updateAnswerFromInput} disabled={questionFinished} autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="decimal" placeholder="Écris ta réponse…" aria-describedby="answer-format" />
                <p id="answer-format" class="input-help">Tu peux utiliser une virgule décimale. Les espaces et apostrophes des milliers sont acceptés.</p>
                <button class="primary-button wide" type="submit" disabled={questionFinished || answer.trim() === ''}>Vérifier ma réponse <span>↗</span></button>
              </form>
            {/if}

            {#if currentQuestion.kind !== 'input'}
              <div class="answer-actions">
                <button class="text-button" disabled={questionFinished || showHint} onclick={revealHint}>Afficher un indice</button>
                <button class="primary-button" disabled={questionFinished || answer.trim() === ''} onclick={validateAnswer}>Valider <span>↗</span></button>
              </div>
            {:else}
              <div class="hint-row"><button class="text-button" disabled={showHint || questionFinished} onclick={revealHint}>Afficher un indice</button></div>
            {/if}

            {#if showHint}
              <aside class="hint-box"><span aria-hidden="true">✧</span><div><strong>Indice</strong><p>{currentQuestion.hint}</p></div></aside>
            {/if}

            {#if feedback !== 'none'}
              <div class={`feedback-box feedback-${feedback}`} role="status" aria-live="polite">
                <span class="feedback-symbol" aria-hidden="true">{feedback === 'success' ? '✓' : feedback === 'reveal' ? '✧' : '↻'}</span>
                <div><strong>{feedback === 'success' ? 'Bien joué !' : feedback === 'reveal' ? 'Le savoir se construit.' : 'On réessaie.'}</strong><p>{feedbackText}</p>{#if feedback === 'reveal'}<p class="explanation-text">{currentQuestion.explanation}</p>{/if}</div>
              </div>
            {/if}

            {#if questionFinished}
              <button class="primary-button wide next-question-button" onclick={advanceQuestion}>{questionIndex === questions.length - 1 ? 'Voir le bilan' : 'Question suivante'} <span>→</span></button>
            {/if}
          </div>
        </div>
        <p class="session-note">Les erreurs servent à apprendre. Tu as deux essais avant de voir la correction, sans perdre la possibilité de continuer.</p>
      </section>

    {:else if screen === 'result' && currentRealm && result}
      <!-- Bilan de la mission : score, étoiles, XP et éventuelle victoire du gardien. -->
      <section class="result-screen">
        <div class="result-glow" aria-hidden="true"></div>
        <div class="result-emblem" aria-hidden="true">{result.guardianWon ? '✦' : result.percent >= 50 ? '✧' : '◌'}</div>
        <p class="eyebrow">{missionMode === 'guardian' ? 'BILAN DU GARDIEN' : 'BILAN DE L’ENTRAÎNEMENT'}</p>
        <h1>{result.guardianWon ? 'Le sceau est brisé !' : result.percent >= 70 ? 'Le savoir prend forme.' : 'Une étape de plus sur le chemin.'}</h1>
        <p class="result-copy">{result.guardianWon ? `${currentRealm.guardian} te reconnaît comme gardien du royaume. Une page du Codex rejoint tes archives.` : missionMode === 'guardian' ? 'Le gardien tient encore le sceau. Revois les indices et retente le défi.' : 'Chaque entraînement renforce tes stratégies. Les erreurs signalent ce qu’il reste à éclaircir.'}</p>
        <div class="score-panel"><div class="score-main"><strong>{result.correct}<span>/{result.total}</span></strong><small>réponses justes</small></div><div class="score-divider"></div><div class="score-main"><strong>{result.percent}<span>%</span></strong><small>réussite</small></div><div class="score-divider"></div><div class="score-main"><strong>+{result.xpGained}</strong><small>XP gagnés</small></div></div>
        <div class="stars-line" aria-label={`${result.stars} étoiles gagnées`}>{#each [1, 2, 3] as star}<span class:star-earned={star <= result.stars} aria-hidden="true">✦</span>{/each}</div>
        {#if result.guardianWon}<article class="codex-unlock"><span>▤</span><div><p class="eyebrow">PAGE RETROUVÉE</p><h2>{CODEX[currentRealm.id]?.title ?? 'Une page du Codex'}</h2><p>{CODEX[currentRealm.id]?.text ?? 'Une nouvelle stratégie rejoint tes archives.'}</p></div></article>{/if}
        <div class="result-actions"><button class="primary-button" onclick={continueAfterResult}>{result.guardianWon ? (currentRealm.order < 5 ? 'Continuer l’expédition →' : 'Ouvrir le Codex →') : 'Retour au royaume →'}</button><button class="secondary-button" onclick={() => screen = 'realm'}>Rejouer cette étape ↻</button><button class="text-button" onclick={backToHub}>Retour à la carte</button></div>
      </section>

    {:else if screen === 'codex'}
      <!-- Codex : consultation des stratégies récupérées en vainquant les gardiens. -->
      <section class="codex-screen">
        <div class="breadcrumb"><button onclick={() => screen = previousScreen === 'realm' ? 'realm' : 'hub'}>← Retour</button><span>/</span><span>Codex</span></div>
        <div class="codex-heading"><div class="codex-book" aria-hidden="true">▤</div><div><p class="eyebrow">ARCHIVES DES STRATÉGIES</p><h1>Le Codex retrouvé</h1><p>Les gardiens vaincus transmettent une stratégie. Reviens ici pour les relire.</p></div></div>
        {#if unlockedCodex.length === 0}
          <div class="empty-codex"><span>◇</span><h2>Les pages attendent leurs gardiens.</h2><p>Réussis le défi du gardien d’un royaume pour récupérer la première page du Codex.</p><button class="primary-button" onclick={backToHub}>Retour à la carte →</button></div>
        {:else}
          <div class="codex-layout"><nav class="codex-index" aria-label="Pages du Codex">{#each unlockedCodex as realm}<button class:active-codex={codexSelectedId === realm.id} onclick={() => codexSelectedId = realm.id}><span>{realm.symbol}</span><span>{CODEX[realm.id]?.title ?? realm.name}</span><b>✓</b></button>{/each}</nav><article class="codex-page"><p class="eyebrow">{getRealm(codexSelectedId)?.name ?? 'ARCHIVES'}</p><h2>{CODEX[codexSelectedId]?.title ?? 'Page retrouvée'}</h2><div class="codex-rule"></div><p>{CODEX[codexSelectedId]?.text ?? 'Aucune entrée disponible.'}</p><div class="codex-annotation"><span>✧</span><p>Conseil d’exploration : explique cette stratégie avec tes propres mots, puis cherche un exemple différent.</p></div></article></div>
        {/if}
      </section>
    {/if}
  </main>

  <footer class="site-footer"><span>NUMÉRIA <i>✦</i> APPRENDRE, EXPLORER, COMPRENDRE</span><button onclick={returnToOrbis}>Retour aux jeux ↗</button></footer>
</div>

{#if teacherPanelOpen}
  <!-- Voile sombre placé au-dessus du jeu lorsque le panneau enseignant est ouvert. -->
  <div class="modal-backdrop">
    <!--
      Panneau de dialogue enseignant.
      On utilise une div avec role="dialog" plutôt que la balise section :
      cela évite l'avertissement d'accessibilité rencontré, tout en conservant
      les styles existants et sans ajouter le comportement natif de <dialog>.
    -->
    <div
      class="teacher-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-modal-title"
    >
      <!-- Ferme la fenêtre sans modifier la progression enregistrée. -->
      <button class="modal-close" onclick={() => teacherPanelOpen = false} aria-label="Fermer">×</button>

      <!-- Icône et titre du panneau enseignant. -->
      <div class="modal-symbol" aria-hidden="true">⌑</div>
      <p class="eyebrow">ESPACE ENSEIGNANT</p>
      <h2 id="teacher-modal-title">Ouvrir un royaume</h2>
      <p>Le code permet de sauter une étape au besoin. Le royaume choisi et les étapes précédentes seront accessibles pour ce profil sur cet appareil.</p>

      <!-- Le formulaire intercepte l'envoi pour vérifier le code sans recharger la page. -->
      <form onsubmit={(event) => { event.preventDefault(); unlockRealm(); }}>
        <label for="teacher-code">Code d’accès pédagogique</label>
        <input id="teacher-code" type="password" bind:value={accessCode} autocomplete="off" placeholder="Code enseignant" />
        <button class="primary-button wide" type="submit">Déverrouiller le royaume →</button>
      </form>

      <!-- Le message n'apparaît qu'après une tentative ou une action enseignant. -->
      {#if teacherMessage}
        <p class="teacher-message" role="status">{teacherMessage}</p>
      {/if}

      <!-- Rappel de sécurité : le code client n'est pas une authentification sécurisée. -->
      <p class="small-note">Le code est vérifié dans le navigateur. Il sert à gérer la progression en classe, mais ne constitue pas une protection contre une personne qui inspecte le code du site.</p>
    </div>
  </div>
{/if}

<style>
  /* Styles de la page Numéria. Les règles sont regroupées par zones de l’interface. */
  /* Base globale : dimensions prévisibles, fond sombre et focus clavier bien visible. */
  :global(*) { box-sizing: border-box; }
  :global(html) { background: #0c101b; scroll-behavior: smooth; }
  :global(body) { margin: 0; background: #0c101b; color: #f2f0e9; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  :global(button), :global(input), :global(select) { font: inherit; }
  :global(button:focus-visible), :global(input:focus-visible), :global(select:focus-visible) { outline: 3px solid #f2bb61; outline-offset: 3px; }
  :global(button:disabled) { opacity: .42; cursor: not-allowed; }
  .numeria-shell { min-height: 100vh; overflow: hidden; background: radial-gradient(ellipse at 50% -18%, #283353 0, #111827 42%, #0c101b 77%); }
  .topbar { position: relative; z-index: 10; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 17px clamp(16px, 4vw, 56px); border-bottom: 1px solid #ffffff13; background: #0c101bdb; backdrop-filter: blur(18px); }
  .brand { display: inline-flex; align-items: center; gap: 11px; padding: 0; border: 0; background: none; color: inherit; cursor: pointer; text-align: left; }
  .brand-mark { display: grid; place-items: center; width: 42px; height: 42px; border: 1px solid #d8b7756c; border-radius: 14px 14px 14px 4px; color: #f2c875; background: linear-gradient(145deg, #e7bd7333, #ffffff03); font-size: 25px; box-shadow: 0 0 28px #c4983c18; }
  .brand strong { display: block; letter-spacing: .2em; font-size: 15px; font-weight: 850; }
  .brand small { display: block; margin-top: 4px; color: #9299ac; font-size: 8px; letter-spacing: .16em; }
  .top-actions { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
  .profile-chip, .xp-chip { padding: 8px 11px; border: 1px solid #ffffff17; border-radius: 999px; background: #ffffff06; color: #dce0ea; font-size: 12px; }
  .profile-dot { display: inline-block; width: 6px; height: 6px; margin-right: 7px; border-radius: 50%; background: #7fe4b8; }
  .xp-chip { border-color: #eac4774a; color: #f0d18a; }
  .icon-button { width: 37px; height: 37px; border: 1px solid #ffffff1f; border-radius: 12px; background: #ffffff07; color: #d9c89f; font-size: 17px; cursor: pointer; }
  .quiet-button, .text-button { padding: 8px 10px; border: 0; background: transparent; color: #aeb5c5; font-size: 12px; cursor: pointer; }
  .quiet-button:hover, .text-button:hover { color: #f7db9c; }
  main { width: min(1180px, calc(100% - 40px)); min-height: calc(100vh - 130px); margin: 0 auto; padding: 34px 0 60px; }
  .eyebrow { margin: 0 0 10px; color: #dfbd78; font-size: 10px; font-weight: 800; letter-spacing: .19em; line-height: 1.5; }
  h1, h2, h3, p { margin-top: 0; }
  h1 { font-family: Georgia, "Times New Roman", serif; font-weight: 500; letter-spacing: -.035em; line-height: 1.1; }
  h2, h3 { letter-spacing: -.02em; }
  .lead { color: #c3c9d6; font-size: 16px; line-height: 1.65; }
  .small-note { color: #7e879b; font-size: 11px; line-height: 1.6; }
  .primary-button, .secondary-button { display: inline-flex; align-items: center; justify-content: center; gap: 16px; min-height: 46px; padding: 12px 18px; border: 1px solid #f3cb77; border-radius: 12px; background: linear-gradient(135deg, #f3d28d, #d8ab56); box-shadow: 0 7px 24px #dbb15d18; color: #1c1b1c; font-size: 13px; font-weight: 800; cursor: pointer; transition: transform .16s ease, filter .16s ease, box-shadow .16s ease; }
  .primary-button:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.04); box-shadow: 0 10px 30px #dbb15d2a; }
  .secondary-button { border-color: #ffffff24; background: #ffffff08; box-shadow: none; color: #eee7d9; }
  .secondary-button:hover { border-color: #d9b96d7a; background: #d9b96d12; }
  .wide { width: 100%; }
  .text-link { padding: 0; border: 0; background: none; color: #f1cf87; cursor: pointer; text-align: left; }

  /* Accueil : une porte astrale en CSS évite les images externes et garde la page légère. */
  .welcome-screen { display: grid; grid-template-columns: minmax(270px, .92fr) minmax(320px, 1.08fr); align-items: center; gap: clamp(30px, 7vw, 95px); min-height: 690px; padding: 30px 5%; }
  .welcome-art { position: relative; min-height: 465px; display: grid; place-items: center; isolation: isolate; }
  .welcome-art::before { content: ''; position: absolute; inset: 13% 1%; border-radius: 50%; background: radial-gradient(ellipse, #4a548c30, #151b30 62%, transparent 70%); filter: blur(7px); }
  .moon { position: absolute; z-index: -1; top: 13%; left: 30%; width: 180px; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle at 31% 29%, #f9e5b9, #cba56a 42%, #6d617c 77%, #22253b); box-shadow: 0 0 75px #dfbd7830; }
  .ring { position: absolute; width: 310px; height: 135px; border: 1px solid #e8c87c7d; border-radius: 50%; transform: rotate(-29deg); }
  .ring-two { width: 365px; height: 185px; border-color: #8d9ee45c; transform: rotate(39deg); }
  .portal { position: relative; display: grid; place-items: center; width: 235px; height: 310px; margin-top: 115px; border: 1px solid #efce8d88; border-radius: 49% 49% 17% 17%; background: linear-gradient(180deg, #b2a3dc18, #f3ce8312 80%, #f3ce8333); box-shadow: 0 0 0 10px #d2b26c09, inset 0 0 35px #e7ce8125, 0 0 70px #6279da25; clip-path: polygon(50% 0, 90% 12%, 94% 82%, 100% 100%, 0 100%, 6% 82%, 10% 12%); }
  .portal::before { content: ''; position: absolute; inset: 16px 18px 8px; border: 1px solid #dfc18467; border-radius: 49% 49% 14% 14%; }
  .portal span { color: #f7d994; font-size: 67px; text-shadow: 0 0 35px #f5d892; }
  .floating-glyph { position: absolute; display: grid; place-items: center; min-width: 53px; height: 48px; padding: 0 8px; border: 1px solid #ffffff22; border-radius: 13px; background: #161d31ce; color: #e9d6a7; font-family: Georgia, serif; font-size: 19px; box-shadow: 0 9px 32px #0003; animation: float 6s ease-in-out infinite; }
  .glyph-a { top: 10%; right: 9%; }.glyph-b { bottom: 25%; left: 6%; animation-delay: -2s; }.glyph-c { top: 48%; right: 0; animation-delay: -4s; }
  .crystal { position: absolute; width: 15px; height: 30px; border: 1px solid #a8d8dfb0; background: linear-gradient(#7ad4e846, #8c86e922); clip-path: polygon(50% 0, 100% 27%, 80% 100%, 20% 100%, 0 27%); box-shadow: 0 0 24px #87e3f218; }
  .crystal-one { bottom: 13%; left: 25%; transform: rotate(-23deg) scale(1.5); }.crystal-two { bottom: 9%; right: 25%; transform: rotate(25deg) scale(1.2); }.crystal-three { top: 6%; left: 24%; transform: rotate(11deg); }
  .welcome-copy { max-width: 510px; padding: 25px 0; }
  .welcome-copy h1 { margin-bottom: 23px; font-size: clamp(39px, 5.2vw, 64px); }
  .welcome-copy h1 span { color: #e7c681; }
  .welcome-copy .lead { max-width: 470px; margin-bottom: 28px; }
  .entry-form { display: grid; gap: 9px; max-width: 390px; }
  .entry-form label, .answer-entry label, .teacher-modal label { margin-top: 8px; color: #b9c0ce; font-size: 12px; font-weight: 700; }
  .entry-form input, .entry-form select, .answer-entry input, .teacher-modal input { width: 100%; min-height: 47px; padding: 12px 14px; border: 1px solid #ffffff25; border-radius: 11px; background: #171e30; color: #f3f1e9; }
  .entry-form input::placeholder, .answer-entry input::placeholder, .teacher-modal input::placeholder { color: #737e94; }
  .entry-form .primary-button { margin-top: 9px; }
  .welcome-copy .small-note { max-width: 390px; margin-top: 15px; }

  /* Carte des royaumes. */
  .hub-screen { animation: arrive .35s ease both; }
  .story-banner { position: relative; display: flex; align-items: center; gap: 22px; min-height: 177px; padding: 31px clamp(20px, 4vw, 45px); overflow: hidden; border: 1px solid #d5bb7040; border-radius: 22px; background: radial-gradient(ellipse at 88% 20%, #8677c02c, transparent 32%), linear-gradient(120deg, #202840 0, #191e30 58%, #20243a); }
  .story-banner::after { content: '✧'; position: absolute; right: 12%; top: -58px; color: #e7c16b20; font-size: 260px; pointer-events: none; }
  .story-symbol { display: grid; place-items: center; flex: 0 0 66px; height: 66px; border: 1px solid #e3c47873; border-radius: 20px 20px 20px 5px; background: #e6be7020; color: #f3d58f; font-size: 37px; }
  .story-text { flex: 1; min-width: 0; position: relative; z-index: 1; }
  .story-text h1 { margin-bottom: 8px; font-size: clamp(28px, 4vw, 42px); }
  .story-text p:last-child { margin-bottom: 0; color: #b9c2d2; font-size: 14px; }
  .progress-orb { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 0 0 94px; height: 94px; border: 1px solid #e9c87873; border-radius: 50%; background: #0e1325a8; box-shadow: inset 0 0 25px #edc87815; }
  .progress-orb strong { font-family: Georgia, serif; font-size: 25px; font-weight: 500; }.progress-orb small { color: #9ca5b7; font-size: 12px; }.progress-orb span { margin-top: 3px; color: #e3c579; font-size: 9px; letter-spacing: .12em; text-transform: uppercase; }
  .map-toolbar { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin: 33px 0 15px; }
  .map-toolbar h2 { margin-bottom: 5px; font-family: Georgia, serif; font-size: 26px; font-weight: 500; }.map-toolbar p { margin-bottom: 0; color: #8f99af; font-size: 12px; }
  .grade-switch { display: flex; align-items: center; gap: 10px; color: #9fa8bb; font-size: 12px; }
  .grade-switch select { min-width: 70px; padding: 9px 12px; border: 1px solid #ffffff20; border-radius: 10px; background: #171e30; color: #f0d28a; font-weight: 800; }
  .progress-track, .question-progress { height: 5px; overflow: hidden; border-radius: 9px; background: #ffffff12; }
  .progress-track { margin: 0 0 24px; }.progress-track span, .question-progress span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #62cda3, #e2c06e); transition: width .3s ease; }
  .realm-map { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; align-items: stretch; }
  .realm-card { --realm-color: #8bdfb9; position: relative; display: flex; flex-direction: column; min-width: 0; min-height: 312px; padding: 16px 14px 13px; border: 1px solid #8bdfb92d; border-radius: 16px; background: linear-gradient(145deg, #233342e8, #151d2bcf 70%); box-shadow: inset 0 1px #ffffff08; transition: transform .18s ease, border-color .18s ease, opacity .18s ease; }
  .realm-card:hover:not(.is-locked) { transform: translateY(-4px); border-color: color-mix(in srgb, var(--realm-color) 66%, transparent); }
  .theme-jade { --realm-color: #84ddb3; }.theme-gold { --realm-color: #e4c071; }.theme-violet { --realm-color: #b4a2ee; }.theme-blue { --realm-color: #8db9ee; }.theme-rose { --realm-color: #ed9db2; }
  .realm-card.theme-gold { background: linear-gradient(145deg, #3b3227d9, #191d2ac9 73%); border-color: #e4c07130; }.realm-card.theme-violet { background: linear-gradient(145deg, #312c49c9, #171c2bcc 73%); border-color: #b4a2ee30; }.realm-card.theme-blue { background: linear-gradient(145deg, #253849e8, #151d2bcf 73%); border-color: #8db9ee30; }.realm-card.theme-rose { background: linear-gradient(145deg, #402b3bc9, #171c2bcc 73%); border-color: #ed9db230; }
  .realm-card.is-locked { opacity: .65; background: linear-gradient(145deg, #1c2230, #131824); border-color: #ffffff15; }
  .realm-card.is-complete { border-color: #90d9ad79; box-shadow: inset 0 0 22px #6dd7a108; }
  .realm-card-top { display: flex; align-items: center; gap: 7px; min-height: 38px; }
  .realm-number { color: #6e7a91; font-size: 10px; font-weight: 800; letter-spacing: .1em; }
  .realm-symbol { display: grid; place-items: center; width: 36px; height: 36px; margin-left: auto; border: 1px solid color-mix(in srgb, var(--realm-color) 40%, transparent); border-radius: 12px 12px 12px 3px; background: color-mix(in srgb, var(--realm-color) 10%, transparent); color: var(--realm-color); font-size: 21px; }
  .status-seal, .status-lock { display: grid; place-items: center; width: 22px; height: 22px; border: 1px solid #91dca773; border-radius: 50%; color: #91dca7; font-size: 12px; }.status-lock { border-color: #7e879b60; color: #929bad; }
  .realm-region { margin: 18px 0 5px; color: var(--realm-color); font-size: 9px; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; }
  .realm-card h3 { margin-bottom: 8px; font-family: Georgia, serif; font-size: 19px; font-weight: 500; line-height: 1.2; }
  .realm-subtitle { min-height: 39px; margin-bottom: 14px; color: #a6afc1; font-size: 11px; line-height: 1.45; }
  .realm-skill { margin-top: auto; padding-top: 11px; border-top: 1px solid #ffffff11; color: #d3d8e1; font-size: 10px; line-height: 1.45; }.realm-skill span { display: block; margin-bottom: 4px; color: #7f8aa2; font-size: 8px; font-weight: 800; letter-spacing: .12em; }
  .extension-label { align-self: flex-start; margin: 10px 0 0; padding: 4px 6px; border-radius: 5px; background: #e2be6f18; color: #d9b96d; font-size: 8px; font-weight: 800; letter-spacing: .08em; }
  .card-action { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 40px; margin-top: 14px; padding: 8px 10px; border: 1px solid color-mix(in srgb, var(--realm-color) 42%, transparent); border-radius: 9px; background: color-mix(in srgb, var(--realm-color) 9%, transparent); color: var(--realm-color); font-size: 11px; font-weight: 800; cursor: pointer; }
  .card-action:hover { background: color-mix(in srgb, var(--realm-color) 17%, transparent); }.locked-action { border-color: #ffffff12; background: #ffffff05; color: #959daf; }
  .map-connector { display: none; }
  .bottom-panels { display: grid; grid-template-columns: 1.2fr .8fr; gap: 14px; margin-top: 22px; }
  .side-panel { display: flex; align-items: flex-start; gap: 15px; padding: 20px; border: 1px solid #ffffff13; border-radius: 16px; background: #ffffff04; }.side-panel .panel-icon { display: grid; place-items: center; flex: 0 0 40px; height: 40px; border: 1px solid #d4b36c3f; border-radius: 13px; color: #d8bd7b; font-size: 22px; }.side-panel h3 { margin-bottom: 6px; font-family: Georgia, serif; font-size: 18px; font-weight: 500; }.side-panel p:not(.eyebrow) { margin-bottom: 0; color: #98a2b6; font-size: 11px; line-height: 1.65; }.side-panel .eyebrow { margin-bottom: 5px; font-size: 8px; }.codex-panel > div:nth-child(2) { flex: 1; }.codex-panel .secondary-button { align-self: center; white-space: nowrap; font-size: 11px; }
  .utility-row { display: flex; justify-content: space-between; gap: 20px; margin-top: 19px; }.utility-row .text-button { font-size: 10px; }

  /* Fiche d'un royaume. */
  .breadcrumb { display: flex; align-items: center; gap: 10px; margin-bottom: 27px; color: #647086; font-size: 11px; }.breadcrumb button { padding: 0; border: 0; background: transparent; color: #b6c0d3; cursor: pointer; }.breadcrumb button:hover { color: #f1d392; }
  .realm-detail { --realm-color: #8bdfb9; animation: arrive .32s ease both; }.realm-detail .theme-jade { --realm-color: #84ddb3; }
  .realm-hero { display: grid; grid-template-columns: minmax(190px, .55fr) minmax(0, 1fr); align-items: center; gap: clamp(28px, 7vw, 90px); padding: 20px clamp(4px, 5vw, 54px) 39px; }
  .realm-emblem { position: relative; display: grid; place-items: center; width: min(250px, 100%); aspect-ratio: 1; margin: auto; border: 1px solid color-mix(in srgb, var(--realm-color) 42%, transparent); border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--realm-color) 15%, transparent), transparent 63%); box-shadow: 0 0 70px color-mix(in srgb, var(--realm-color) 10%, transparent); }
  .realm-emblem span { display: grid; place-items: center; width: 125px; height: 125px; border: 1px solid color-mix(in srgb, var(--realm-color) 50%, transparent); border-radius: 36px 36px 36px 8px; color: var(--realm-color); font-size: 61px; transform: rotate(-8deg); background: #1018278c; }.realm-emblem i { position: absolute; top: 21%; right: 19%; color: #f4d48b; font-size: 27px; font-style: normal; }.emblem-ring { position: absolute; inset: 17px; border: 1px dashed color-mix(in srgb, var(--realm-color) 35%, transparent); border-radius: 50%; }
  .realm-hero-copy h1 { margin-bottom: 12px; font-size: clamp(36px, 5vw, 59px); }.realm-hero-copy > p:not(.eyebrow) { max-width: 620px; color: #b0bacb; line-height: 1.7; }.realm-hero-copy .lead { color: var(--realm-color); }.skill-pill { display: inline-block; margin-top: 12px; padding: 10px 13px; border: 1px solid color-mix(in srgb, var(--realm-color) 28%, transparent); border-radius: 9px; background: color-mix(in srgb, var(--realm-color) 7%, transparent); color: #e5e8ed; font-size: 12px; line-height: 1.5; }
  .mission-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 17px; max-width: 930px; margin: 0 auto; }.mission-card { padding: clamp(20px, 4vw, 30px); border: 1px solid #80d9ac3e; border-radius: 19px; background: linear-gradient(150deg, #21362f88, #161e2b 65%); }.guardian-card { border-color: #e5bd7040; background: linear-gradient(150deg, #4233286c, #191e2a 65%); }.mission-disabled { opacity: .84; }.mission-icon { display: grid; place-items: center; width: 47px; height: 47px; margin-bottom: 20px; border: 1px solid #8de1b258; border-radius: 15px 15px 15px 4px; color: #8de1b2; font-size: 25px; }.guardian-card .mission-icon { border-color: #e4c17159; color: #e4c171; }.mission-card h2 { margin-bottom: 12px; font-family: Georgia, serif; font-size: 27px; font-weight: 500; }.mission-card > p:not(.eyebrow):not(.best-score) { min-height: 55px; color: #a5afc0; font-size: 12px; line-height: 1.7; }.mission-meta { display: flex; gap: 8px; margin: 17px 0; }.mission-meta span { padding: 7px 9px; border: 1px solid #ffffff14; border-radius: 7px; color: #a9b1c2; font-size: 10px; }.mission-card .primary-button { min-height: 48px; }.best-score { margin: 13px 0 0; color: #8b97ab; font-size: 11px; }.realm-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 930px; margin: 19px auto 0; padding: 19px 22px; border: 1px solid #ffffff13; border-radius: 15px; background: #ffffff04; }.realm-bottom h3 { margin-bottom: 6px; font-family: Georgia, serif; font-size: 17px; font-weight: 500; }.realm-bottom p:not(.eyebrow) { margin-bottom: 0; color: #a0aabd; font-size: 11px; line-height: 1.6; }.realm-bottom .eyebrow { margin-bottom: 5px; font-size: 8px; }

  /* Interface d'exercice : texte centré, grands contrôles, pas de drag-and-drop obligatoire. */
  .game-screen { max-width: 930px; margin: 0 auto; animation: arrive .25s ease both; }.game-topline { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; margin-bottom: 16px; }.back-link { justify-self: start; padding: 9px 0; border: 0; background: transparent; color: #a9b4c7; font-size: 12px; cursor: pointer; }.mission-label { color: #d6ba76; font-size: 9px; font-weight: 800; letter-spacing: .17em; text-align: center; }.question-count { justify-self: end; color: #f4d48b; font-family: Georgia, serif; font-size: 21px; }.question-count span { color: #7e899e; font-family: inherit; font-size: 13px; }
  .question-progress { margin-bottom: 18px; }.game-stage { position: relative; min-height: 500px; padding: clamp(20px, 5vw, 50px) clamp(10px, 4vw, 40px); border: 1px solid #ffffff17; border-radius: 24px; background: radial-gradient(ellipse at 50% 0, #5b67912a, transparent 51%), linear-gradient(155deg, #1b2436, #111725 78%); overflow: hidden; }
  .stage-decoration { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }.stage-orb { position: absolute; top: -74px; right: -45px; display: grid; place-items: center; width: 215px; height: 215px; border: 1px solid #d2b56d16; border-radius: 50%; color: #e8ca7b16; font-size: 87px; }.spark { position: absolute; color: #d9bb744d; }.spark-one { top: 16%; left: 8%; font-size: 23px; }.spark-two { bottom: 19%; right: 8%; font-size: 31px; }.spark-three { top: 46%; right: 14%; font-size: 50px; }
  .question-card { position: relative; z-index: 1; width: min(100%, 680px); margin: 0 auto; }.question-card > .eyebrow { margin-bottom: 18px; text-align: center; }.question-card h1 { max-width: 650px; margin: 0 auto 27px; font-size: clamp(26px, 4vw, 38px); line-height: 1.3; text-align: center; }
  .answer-options { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; margin: 0 auto; }.answer-option { display: flex; align-items: center; gap: 12px; min-height: 65px; padding: 12px 14px; border: 1px solid #ffffff1d; border-radius: 13px; background: #ffffff06; color: #eff0ef; font-size: 15px; text-align: left; cursor: pointer; transition: border-color .14s ease, background .14s ease, transform .14s ease; }.answer-option:hover:not(:disabled) { transform: translateY(-1px); border-color: #e7c87977; background: #e7c8790d; }.answer-option.selected-option { border-color: #e7c879bf; background: #e7c87916; }.answer-option.correct-option { border-color: #7ed8a3bd; background: #55d49a17; }.option-key { display: grid; place-items: center; flex: 0 0 27px; height: 27px; border: 1px solid #ffffff20; border-radius: 8px; color: #aeb8ca; font-size: 10px; font-weight: 800; }
  .numeric-options .answer-option { justify-content: center; min-height: 58px; font-variant-numeric: tabular-nums; font-size: 17px; }.numberline-visual { margin: 0 0 22px; padding: 16px 20px; border: 1px solid #8baee92c; border-radius: 14px; background: #82b8e80a; }.numberline-caption { display: flex; justify-content: space-between; color: #c3ccdc; font-size: 12px; }.numberline-track { position: relative; height: 31px; margin: 8px 5px 0; }.numberline-axis { position: absolute; top: 11px; right: 0; left: 0; height: 2px; background: #7e9dc2; }.tick { position: absolute; top: 3px; width: 1px; height: 18px; }.tick i { position: absolute; top: 8px; left: -3px; width: 7px; height: 7px; border-radius: 50%; background: #93a5be; }.tick.target-tick i { width: 13px; height: 13px; top: 5px; left: -6px; border: 2px solid #f2d18a; background: #756137; box-shadow: 0 0 14px #f2d18a99; }.numberline-visual > p { margin: 8px 0 0; color: #929eb1; font-size: 11px; text-align: center; }
  .answer-entry { display: grid; gap: 9px; max-width: 470px; margin: 0 auto; }.answer-entry label { margin-top: 0; }.answer-entry input { min-height: 57px; background: #0f1624; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 21px; text-align: center; }.input-help { margin: 0; color: #8994a8; font-size: 10px; line-height: 1.5; }.answer-entry .primary-button { margin-top: 7px; }.answer-actions { display: flex; align-items: center; justify-content: space-between; gap: 15px; margin-top: 17px; }.answer-actions .primary-button { min-width: 140px; min-height: 42px; }.hint-row { display: flex; justify-content: center; margin-top: 12px; }.hint-box, .feedback-box { display: flex; align-items: flex-start; gap: 12px; margin-top: 17px; padding: 13px 15px; border: 1px solid #e4c37337; border-radius: 11px; background: #e4c3730b; }.hint-box > span { color: #e7c879; font-size: 21px; }.hint-box strong, .feedback-box strong { display: block; margin-bottom: 4px; color: #edd9a8; font-size: 12px; }.hint-box p, .feedback-box p { margin: 0; color: #b2bdcd; font-size: 12px; line-height: 1.65; }.feedback-box { border-color: #e4c37331; background: #e4c37309; }.feedback-success { border-color: #78d9a64b; background: #72d9a60a; }.feedback-success .feedback-symbol { color: #87dfac; }.feedback-try-again .feedback-symbol { color: #e7c879; }.feedback-reveal { border-color: #89b8eb4e; background: #89b8eb0b; }.feedback-reveal .feedback-symbol { color: #8dbcee; }.feedback-symbol { display: grid; place-items: center; flex: 0 0 28px; height: 28px; border: 1px solid #ffffff1b; border-radius: 9px; color: #e7c879; font-weight: 800; }.feedback-box .explanation-text { margin-top: 7px; color: #e1e5ec; }.next-question-button { margin-top: 14px; }.session-note { margin: 15px 0 0; color: #7c879c; font-size: 11px; line-height: 1.6; text-align: center; }

  /* Écran de résultat et récompenses. */
  .result-screen { position: relative; display: flex; flex-direction: column; align-items: center; max-width: 740px; min-height: 670px; margin: 0 auto; padding: 36px 15px; text-align: center; animation: arrive .3s ease both; }.result-glow { position: absolute; z-index: 0; top: -40px; width: 500px; height: 420px; border-radius: 50%; background: radial-gradient(ellipse, #e2c07410, transparent 70%); pointer-events: none; }.result-screen > *:not(.result-glow) { position: relative; z-index: 1; }.result-emblem { display: grid; place-items: center; width: 100px; height: 100px; margin-bottom: 22px; border: 1px solid #e7c87970; border-radius: 50%; background: radial-gradient(circle, #e3c57f21, #ffffff02); box-shadow: 0 0 45px #dfbd7820; color: #f0d18a; font-size: 51px; }.result-screen h1 { max-width: 630px; margin-bottom: 12px; font-size: clamp(34px, 5vw, 50px); }.result-copy { max-width: 530px; color: #aab4c6; font-size: 13px; line-height: 1.7; }.score-panel { display: flex; align-items: center; justify-content: center; gap: clamp(18px, 4vw, 45px); width: min(100%, 540px); margin-top: 26px; padding: 24px 15px; border: 1px solid #ffffff15; border-radius: 17px; background: #ffffff04; }.score-main { display: flex; flex-direction: column; align-items: center; min-width: 70px; }.score-main strong { color: #f0d18a; font-family: Georgia, serif; font-size: 32px; font-weight: 500; }.score-main strong span { color: #909bb0; font-size: 17px; }.score-main small { margin-top: 4px; color: #929db0; font-size: 10px; }.score-divider { width: 1px; height: 42px; background: #ffffff1a; }.stars-line { display: flex; gap: 16px; margin: 24px 0; color: #626b7d; font-size: 34px; }.stars-line .star-earned { color: #f1cd75; text-shadow: 0 0 20px #f1cd7545; }.codex-unlock { display: flex; align-items: flex-start; gap: 14px; max-width: 570px; margin-bottom: 20px; padding: 17px; border: 1px solid #d8ba6e3d; border-radius: 14px; background: #d8ba6e0b; text-align: left; }.codex-unlock > span { color: #e6c777; font-size: 30px; }.codex-unlock .eyebrow { margin-bottom: 4px; font-size: 8px; }.codex-unlock h2 { margin-bottom: 7px; font-family: Georgia, serif; font-size: 18px; font-weight: 500; }.codex-unlock p:last-child { margin-bottom: 0; color: #b6bdca; font-size: 11px; line-height: 1.6; }.result-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px; margin-top: 7px; }.result-actions .text-button { padding: 12px; }

  /* Codex. */
  .codex-screen { animation: arrive .25s ease both; }.codex-heading { display: flex; align-items: center; gap: 24px; margin: 12px 0 34px; }.codex-book { display: grid; place-items: center; flex: 0 0 98px; height: 116px; border: 1px solid #e2c27378; border-radius: 7px 17px 17px 7px; background: linear-gradient(100deg, #a4874e20, #dbbc7220); box-shadow: inset 6px 0 #d7b56723; color: #e8c879; font-family: Georgia, serif; font-size: 55px; }.codex-heading h1 { margin-bottom: 9px; font-size: clamp(32px, 5vw, 48px); }.codex-heading p:last-child { margin-bottom: 0; color: #a7b1c4; font-size: 13px; }.codex-layout { display: grid; grid-template-columns: minmax(230px, .65fr) minmax(0, 1.35fr); gap: 18px; }.codex-index { display: flex; flex-direction: column; gap: 7px; }.codex-index button { display: flex; align-items: center; gap: 10px; min-height: 53px; padding: 10px 13px; border: 1px solid #ffffff15; border-radius: 10px; background: #ffffff04; color: #bfc7d5; cursor: pointer; text-align: left; }.codex-index button > span:first-child { color: #e6c674; font-size: 19px; }.codex-index button > span:nth-child(2) { flex: 1; font-size: 11px; }.codex-index button b { color: #89d9a7; }.codex-index button.active-codex { border-color: #e5c77970; background: #e4c37310; color: #f6e4ba; }.codex-page { min-height: 305px; padding: clamp(22px, 4vw, 39px); border: 1px solid #d9bb6e39; border-radius: 17px; background: linear-gradient(130deg, #343044ad, #1a2030); }.codex-page h2 { margin-bottom: 16px; font-family: Georgia, serif; font-size: 28px; font-weight: 500; }.codex-page > p:not(.eyebrow) { color: #d1d4dc; font-family: Georgia, serif; font-size: 18px; line-height: 1.8; }.codex-rule { width: 74px; height: 2px; margin-bottom: 18px; background: #d9bb6e; }.codex-annotation { display: flex; gap: 10px; margin-top: 24px; padding: 12px; border: 1px solid #ffffff10; border-radius: 9px; background: #ffffff04; }.codex-annotation span { color: #e1c071; }.codex-annotation p { margin: 0; color: #a6b0c1; font-size: 11px; line-height: 1.6; }.empty-codex { display: flex; flex-direction: column; align-items: center; padding: 42px 15px; border: 1px dashed #ffffff23; border-radius: 17px; text-align: center; }.empty-codex > span { color: #e3c174; font-size: 45px; }.empty-codex h2 { margin: 15px 0 6px; font-family: Georgia, serif; font-size: 23px; font-weight: 500; }.empty-codex p { max-width: 400px; color: #9ba6ba; font-size: 12px; line-height: 1.7; }

  /* Modal enseignant : voile d’arrière-plan et panneau centré accessible. */
  .modal-backdrop { position: fixed; z-index: 100; inset: 0; display: grid; place-items: center; padding: 20px; background: #060912ce; backdrop-filter: blur(9px); }.teacher-modal { position: relative; width: min(100%, 450px); max-height: min(90vh, 700px); overflow: auto; padding: 29px; border: 1px solid #d9ba704e; border-radius: 20px; background: radial-gradient(ellipse at 50% 0, #d9ba7011, transparent 50%), #151b2b; box-shadow: 0 25px 90px #0008; }.modal-close { position: absolute; top: 13px; right: 13px; width: 34px; height: 34px; border: 1px solid #ffffff1b; border-radius: 9px; background: #ffffff08; color: #b9c1d0; font-size: 21px; cursor: pointer; }.modal-symbol { display: grid; place-items: center; width: 48px; height: 48px; margin-bottom: 17px; border: 1px solid #e5c4775a; border-radius: 14px 14px 14px 3px; color: #e4c276; font-size: 26px; }.teacher-modal h2 { margin-bottom: 9px; font-family: Georgia, serif; font-size: 30px; font-weight: 500; }.teacher-modal > p:not(.eyebrow):not(.teacher-message):not(.small-note) { color: #a8b2c4; font-size: 12px; line-height: 1.7; }.teacher-modal form { display: grid; gap: 10px; margin: 19px 0 12px; }.teacher-modal input { margin-bottom: 6px; }.teacher-message { color: #f0d28d; font-size: 12px; line-height: 1.5; }
  .site-footer { display: flex; align-items: center; justify-content: space-between; gap: 15px; padding: 18px clamp(16px, 4vw, 56px); border-top: 1px solid #ffffff10; color: #626d84; font-size: 9px; letter-spacing: .14em; }.site-footer i { margin: 0 6px; color: #d6bb76; font-style: normal; }.site-footer button { padding: 8px 0 8px 8px; border: 0; background: transparent; color: #adb5c5; font-size: 10px; letter-spacing: 0; cursor: pointer; }

  /* Animations décoratives ; la préférence de mouvement réduit est gérée en bas du fichier. */
  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
  @keyframes arrive { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  @media (max-width: 1050px) { .realm-map { grid-template-columns: repeat(3, minmax(0, 1fr)); }.realm-card { min-height: 295px; }.welcome-screen { gap: 25px; padding-inline: 1%; }.welcome-art { min-height: 420px; }.codex-layout { grid-template-columns: .8fr 1.2fr; } }
  @media (max-width: 740px) { main { width: min(100% - 28px, 580px); padding-top: 21px; }.topbar { padding: 12px 14px; }.brand-mark { width: 36px; height: 36px; }.brand strong { font-size: 13px; }.brand small { max-width: 155px; font-size: 7px; }.top-actions { gap: 6px; }.profile-chip { max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.profile-chip, .xp-chip { padding: 7px 8px; font-size: 10px; }.quiet-button { max-width: 60px; padding: 5px; font-size: 9px; }.welcome-screen { grid-template-columns: 1fr; gap: 0; padding: 7px 0 24px; }.welcome-art { min-height: 290px; transform: scale(.78); margin: -18px 0 -28px; }.moon { top: 5%; width: 140px; }.portal { width: 170px; height: 220px; margin-top: 75px; }.ring { width: 235px; height: 98px; }.ring-two { width: 285px; height: 135px; }.floating-glyph { min-width: 44px; height: 39px; font-size: 16px; }.welcome-copy { max-width: none; padding: 0 8px; }.welcome-copy h1 { font-size: 43px; }.welcome-copy .lead { font-size: 14px; }.entry-form { max-width: none; }.story-banner { gap: 12px; min-height: 150px; padding: 20px 15px; }.story-symbol { flex-basis: 44px; height: 48px; border-radius: 14px 14px 14px 4px; font-size: 24px; }.story-text h1 { font-size: 26px; }.story-text p:last-child { font-size: 11px; line-height: 1.5; }.progress-orb { flex-basis: 65px; height: 65px; }.progress-orb strong { font-size: 19px; }.progress-orb span { font-size: 7px; }.map-toolbar { align-items: start; margin-top: 24px; }.map-toolbar h2 { font-size: 23px; }.map-toolbar p { max-width: 255px; line-height: 1.55; }.grade-switch { flex-direction: column; align-items: flex-start; gap: 4px; }.realm-map { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }.realm-card { min-height: 282px; padding: 13px 12px; }.realm-card h3 { font-size: 17px; }.realm-subtitle { min-height: 45px; font-size: 10px; }.realm-region { font-size: 8px; }.realm-skill { font-size: 9px; }.bottom-panels { grid-template-columns: 1fr; }.codex-panel { flex-wrap: wrap; }.codex-panel .secondary-button { margin-left: 55px; }.side-panel { padding: 15px; }.utility-row { flex-wrap: wrap; gap: 6px; }.realm-hero { grid-template-columns: 1fr; gap: 24px; padding: 0 0 26px; }.realm-emblem { width: 160px; }.realm-emblem span { width: 82px; height: 82px; border-radius: 25px 25px 25px 5px; font-size: 42px; }.realm-hero-copy h1 { font-size: 39px; }.realm-hero-copy .lead { font-size: 14px; }.mission-grid { grid-template-columns: 1fr; }.mission-card > p:not(.eyebrow):not(.best-score) { min-height: 0; }.realm-bottom { grid-template-columns: 1fr; }.game-stage { min-height: 400px; padding: 25px 13px; }.game-topline { grid-template-columns: 1fr auto; }.mission-label { grid-row: 2; grid-column: 1 / -1; justify-self: start; }.question-count { grid-row: 1; grid-column: 2; }.question-card h1 { font-size: 25px; }.answer-options { grid-template-columns: 1fr; gap: 8px; }.answer-option { min-height: 59px; }.numberline-visual { padding: 13px; }.answer-actions { gap: 6px; }.answer-actions .text-button { padding-left: 2px; }.answer-actions .primary-button { min-width: 105px; padding-inline: 11px; }.score-panel { gap: 10px; padding: 20px 9px; }.score-main { min-width: 0; flex: 1; }.score-main strong { font-size: 26px; }.score-main small { font-size: 9px; }.score-divider { height: 35px; }.result-screen h1 { font-size: 34px; }.result-actions { flex-direction: column; width: 100%; }.result-actions > button { width: 100%; }.codex-heading { gap: 15px; }.codex-book { flex-basis: 62px; height: 80px; font-size: 36px; }.codex-heading h1 { font-size: 31px; }.codex-layout { grid-template-columns: 1fr; }.codex-index { display: grid; grid-template-columns: 1fr 1fr; }.codex-index button { min-width: 0; }.codex-index button > span:nth-child(2) { font-size: 10px; }.site-footer { align-items: flex-start; padding: 14px; font-size: 8px; }.site-footer button { text-align: right; } }
  @media (max-width: 390px) { .topbar { gap: 5px; }.brand { gap: 7px; }.brand small { max-width: 115px; letter-spacing: .09em; }.xp-chip { display: none; }.realm-map { grid-template-columns: 1fr 1fr; }.realm-card h3 { font-size: 16px; }.realm-number { font-size: 9px; }.story-symbol { display: none; }.progress-orb { flex-basis: 54px; height: 54px; }.story-text h1 { font-size: 23px; }.realm-card { min-height: 300px; }.score-panel { gap: 8px; }.score-main strong { font-size: 23px; } }
  @media (prefers-reduced-motion: reduce) { :global(html) { scroll-behavior: auto; } *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }
</style>

