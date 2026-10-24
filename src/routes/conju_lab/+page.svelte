<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { base } from '$app/paths';
  import { submitActivityResult } from '$lib/client/activity';
  import { getTenseInfo, getTensesForGrade, RULE_CARDS } from '$lib/conju-lab/curriculum';
  import { getGroupLabel, getVerbsForGrade } from '$lib/conju-lab/verbs';
  import {
    analyseAnswer,
    generateQuestion,
    resolveAnswerStyle,
    validateQuestion
  } from '$lib/conju-lab/question-engine';
  import type {
    ActivityFocus,
    AnswerStyle,
    EngineConfig,
    Grade,
    TenseId,
    VerbGroup,
    VerbQuestion
  } from '$lib/conju-lab/types';

  type Screen = 'menu' | 'study' | 'game' | 'end';
  type FeedbackKind = 'none' | 'correct' | 'retry' | 'revealed' | 'timeout';

  const SESSION_LENGTH = 10;
  const GRADES: Grade[] = ['6H', '7H', '8H', '9H'];
  const FOCI: Array<{ id: ActivityFocus; label: string; detail: string }> = [
    { id: 'mixte', label: 'Mission mixte', detail: 'Varier les exercices et les stratégies.' },
    { id: 'conjuguer', label: 'Conjuguer', detail: 'Trouver ou écrire la forme correcte.' },
    { id: 'identifier', label: 'Identifier un temps', detail: 'Lire une forme et reconnaître son temps.' },
    { id: 'groupes', label: 'Classer les verbes', detail: 'Comprendre les trois groupes de verbes.' },
    { id: 'radicaux', label: 'Radicaux et terminaisons', detail: 'Découper une forme et repérer son modèle.' }
  ];

  // L’interface garde seulement les réglages et résultats de la session en mémoire.
  // Aucune progression n’est enregistrée localement par ConjuLab.
  let screen: Screen = 'menu';
  let grade: Grade = '6H';
  let playPath: 'guide' | 'libre' = 'guide';
  let focus: ActivityFocus = 'mixte';
  let answerStyle: AnswerStyle = 'mixte';
  let selectedTenses: TenseId[] = ['present', 'imparfait', 'futurSimple', 'passeCompose'];
  let selectedGroups: VerbGroup[] = [1, 2, 3];
  let timedChallenge = false;

  // Réglages d’accessibilité disponibles depuis le menu et pendant les activités.
  let largeText = false;
  let reducedMotion = false;
  let soundEnabled = false;
  let voiceEnabled = false;

  let studentParam = '';
  let configError = '';
  let currentQuestion: VerbQuestion | null = null;
  let activeAnswerMode: 'qcm' | 'saisie' = 'qcm';
  let answerInput = '';
  let hintIndex = 0;
  let attemptCount = 0;
  let resolved = false;
  let feedbackKind: FeedbackKind = 'none';
  let feedbackMessage = '';
  let errorHint = '';
  let questionIndex = 0;
  let score = 0;
  let correctQuestions = 0;
  let retrySuccesses = 0;
  let totalErrors = 0;
  let timeLeft = 15;
  let showHelp = false;
  let selectedRuleIndex = 0;
  let resultStatus: 'not-sent' | 'sending' | 'sent' | 'unavailable' = 'not-sent';
  let fatalError = '';
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let audioContext: AudioContext | null = null;

  $: availableTenses = getTensesForGrade(grade);
  $: gradeVerbCount = getVerbsForGrade(grade).length;
  $: selectedGradeFocus = FOCI.find((item) => item.id === focus)?.label ?? 'Mission mixte';
  $: progressPercent = Math.round((questionIndex / SESSION_LENGTH) * 100);
  $: currentHint = errorHint || currentQuestion?.hintSteps[Math.min(hintIndex, (currentQuestion?.hintSteps.length ?? 1) - 1)] || 'Repère le sujet, le temps et le verbe avant de répondre.';

  function chooseGrade(nextGrade: Grade) {
    grade = nextGrade;
    // Changer de niveau active les temps proposés pour ce niveau ; l’élève peut ensuite
    // décocher les notions qu’il ne veut pas travailler dans cette session.
    selectedTenses = getTensesForGrade(grade).map((item) => item.id);
    configError = '';
  }

  function toggleGroup(group: VerbGroup) {
    selectedGroups = selectedGroups.includes(group)
      ? selectedGroups.filter((item) => item !== group)
      : [...selectedGroups, group];
    configError = '';
  }

  function selectAllTenses() {
    selectedTenses = availableTenses.map((item) => item.id);
    configError = '';
  }

  function selectCoreTenses() {
    selectedTenses = availableTenses
      .filter((item) => !item.advanced && item.id !== 'passeSimple3e')
      .map((item) => item.id);
    if (selectedTenses.length === 0) selectedTenses = availableTenses.slice(0, 1).map((item) => item.id);
    configError = '';
  }

  function makeConfig(index = questionIndex): EngineConfig {
    let activeFocus = focus;
    let activeTenses = [...selectedTenses];

    // Le mode guidé progresse : classement du verbe, analyse du modèle, puis conjugaison.
    // Le mode libre respecte le choix de l’élève à chaque question.
    if (playPath === 'guide') {
      if (index < 2) activeFocus = 'groupes';
      else if (index < 4) activeFocus = 'radicaux';
      else activeFocus = index % 4 === 0 ? 'identifier' : 'conjuguer';

      const ordered = availableTenses
        .filter((item) => selectedTenses.includes(item.id))
        .map((item) => item.id);
      if (ordered.length > 0 && index >= 4) {
        const unlockedCount = Math.max(1, Math.ceil(((index - 3) / (SESSION_LENGTH - 4)) * ordered.length));
        activeTenses = ordered.slice(0, unlockedCount);
      } else {
        activeTenses = ordered.length > 0 ? [ordered[0]] : ['present'];
      }
    }

    return { grade, focus: activeFocus, answerStyle, selectedTenses: activeTenses, selectedGroups };
  }

  function startSession() {
    if (selectedTenses.length === 0) {
      configError = 'Sélectionne au moins un temps avant de commencer.';
      return;
    }
    if (selectedGroups.length === 0) {
      configError = 'Choisis au moins un groupe de verbes.';
      return;
    }
    stopTimer();
    questionIndex = 0;
    score = 0;
    correctQuestions = 0;
    retrySuccesses = 0;
    totalErrors = 0;
    resultStatus = 'not-sent';
    fatalError = '';
    screen = 'game';
    showHelp = false;
    makeQuestion();
  }

  function makeQuestion() {
    stopTimer();
    try {
      const question = generateQuestion(makeConfig());
      if (!validateQuestion(question)) throw new Error('La question produite ne passe pas la validation.');
      currentQuestion = question;
      activeAnswerMode = resolveAnswerStyle(answerStyle, question);
      answerInput = '';
      hintIndex = 0;
      attemptCount = 0;
      resolved = false;
      feedbackKind = 'none';
      feedbackMessage = '';
      errorHint = '';
      timeLeft = 15;
      if (timedChallenge) startTimer();
    } catch (error) {
      fatalError = error instanceof Error ? error.message : 'Une question n’a pas pu être préparée.';
      screen = 'end';
    }
  }

  function stopTimer() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function startTimer() {
    stopTimer();
    intervalId = setInterval(() => {
      timeLeft -= 1;
      if (timeLeft <= 0) {
        stopTimer();
        totalErrors += 1;
        attemptCount = 2;
        resolved = true;
        feedbackKind = 'timeout';
        feedbackMessage = 'Le temps du défi est écoulé. Regarde la correction, puis continue quand tu es prêt.';
        errorHint = currentQuestion?.hintSteps[1] ?? 'Repère d’abord le temps, puis cherche la terminaison adaptée au sujet.';
      }
    }, 1000);
  }

  function normalizeForComparison(value: string): string {
    return value.trim().toLocaleLowerCase('fr').replace(/[’‘`]/g, "'").replace(/\s+/g, ' ');
  }

  function submitAnswer(rawValue: string) {
    if (!currentQuestion || resolved || screen !== 'game') return;
    stopTimer();
    const analysis = analyseAnswer(currentQuestion, rawValue);
    attemptCount += 1;

    if (analysis.isCorrect) {
      correctQuestions += 1;
      if (attemptCount === 1) score += 100;
      else {
        score += 60;
        retrySuccesses += 1;
      }
      resolved = true;
      feedbackKind = 'correct';
      feedbackMessage = attemptCount === 1 ? 'Bien joué : réponse correcte du premier coup.' : 'Tu as corrigé ton raisonnement. Réponse juste !';
      errorHint = '';
      playTone(true);
      return;
    }

    totalErrors += 1;
    const normalizedExpected = normalizeForComparison(currentQuestion.correctAnswer);
    const normalizedGiven = normalizeForComparison(rawValue);
    const looksLikeMissingAuxiliary = currentQuestion.tense !== undefined
      && ['passeCompose', 'plusQueParfait', 'futurAnterieur', 'passeAnterieur', 'subjonctifPasse', 'conditionnelPasse'].includes(currentQuestion.tense)
      && !normalizedGiven.includes(' ');
    const looksLikePersonError = currentQuestion.subject
      && currentQuestion.tense
      && (currentQuestion.options.includes(rawValue) || (!looksLikeMissingAuxiliary && normalizedGiven.length > 0 && normalizedGiven !== normalizedExpected));

    if (looksLikeMissingAuxiliary) {
      errorHint = 'Tu as peut-être oublié une partie du temps composé. Cherche d’abord l’auxiliaire, puis ajoute le participe passé.';
    } else if (analysis.isNearMiss) {
      errorHint = analysis.hint;
    } else if (looksLikePersonError) {
      errorHint = analysis.hint;
    } else {
      errorHint = analysis.hint || currentQuestion.hintSteps[1] || 'Relis le sujet et le temps demandé, puis essaie encore.';
    }

    if (attemptCount === 1) {
      feedbackKind = 'retry';
      feedbackMessage = 'Pas encore. Utilise l’indice pour vérifier une chose, puis réessaie.';
      playTone(false);
    } else {
      resolved = true;
      feedbackKind = 'revealed';
      feedbackMessage = 'La forme correcte est affichée. Compare-la à ta réponse pour repérer la différence.';
      playTone(false);
    }
  }

  function submitTypedAnswer(event: SubmitEvent) {
    event.preventDefault();
    submitAnswer(answerInput);
  }

  function moveNext() {
    if (!resolved) return;
    stopTimer();
    showHelp = false;
    if (questionIndex + 1 >= SESSION_LENGTH) {
      screen = 'end';
      void sendResult();
      return;
    }
    questionIndex += 1;
    makeQuestion();
  }

  async function sendResult() {
    if (resultStatus === 'sent' || resultStatus === 'sending') return;
    resultStatus = 'sending';
    try {
      // L’API ORBIS reste la seule destination des résultats. Aucun score n’est enregistré
      // dans localStorage et aucune donnée de session n’est conservée par ConjuLab.
      const send = submitActivityResult as unknown as (payload: Record<string, unknown>) => Promise<unknown>;
      await send({
        world: 'conjugaison',
        mission: `${grade} · ${playPath === 'guide' ? 'parcours guidé' : 'parcours libre'} · ${selectedGradeFocus}`,
        score,
        totalQuestions: SESSION_LENGTH,
        correctQuestions,
        metadata: { grade, playPath, selectedTenses, selectedGroups, answerStyle, retrySuccesses, totalErrors }
      });
      resultStatus = 'sent';
    } catch (error) {
      console.warn('ConjuLab : transmission du bilan ORBIS indisponible.', error);
      resultStatus = 'unavailable';
    }
  }

  function returnToMenu() {
    stopTimer();
    showHelp = false;
    screen = 'menu';
    currentQuestion = null;
    fatalError = '';
  }

  function openStudy() {
    stopTimer();
    showHelp = false;
    screen = 'study';
  }

  function backFromStudy() {
    screen = 'menu';
  }

  function speak(text: string) {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.88;
    window.speechSynthesis.speak(utterance);
  }

  function speakQuestion() {
    if (!currentQuestion) return;
    speak(`${currentQuestion.prompt}. ${currentQuestion.sentence}. Verbe : ${currentQuestion.verb.infinitive}.`);
  }

  function playTone(isCorrect: boolean) {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContextConstructor = window.AudioContext;
      if (!AudioContextConstructor) return;
      audioContext ??= new AudioContextConstructor();
      if (audioContext.state === 'suspended') void audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = isCorrect ? 660 : 220;
      gain.gain.setValueAtTime(0.08, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.13);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.13);
    } catch {
      // Le son reste facultatif : une API audio non disponible ne doit jamais bloquer le jeu.
    }
  }

  function toggleHelp() {
    showHelp = !showHelp;
    if (showHelp) stopTimer();
    else if (timedChallenge && !resolved) startTimer();
  }

  function selectAnswerFromKeyboard(event: KeyboardEvent) {
    if (screen !== 'game' || activeAnswerMode !== 'qcm' || resolved || showHelp) return;
    if (!['1', '2', '3', '4'].includes(event.key)) return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
    const index = Number(event.key) - 1;
    const option = currentQuestion?.options[index];
    if (option !== undefined) submitAnswer(option);
  }

  onMount(() => {
    // On préserve la valeur passée par ORBIS dans l’URL, sans deviner son identifiant.
    const search = new URLSearchParams(window.location.search);
    studentParam = search.get('eleve') ?? '';
    window.addEventListener('keydown', selectAnswerFromKeyboard);
  });

  onDestroy(() => {
    stopTimer();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    if (audioContext) void audioContext.close();
    if (typeof window !== 'undefined') window.removeEventListener('keydown', selectAnswerFromKeyboard);
  });

  let orbisHref = `${base || ''}/`;
  $: orbisHref = `${base || ''}/${studentParam ? `?eleve=${encodeURIComponent(studentParam)}` : ''}`;
</script>

<svelte:head>
  <title>ConjuLab — Laboratoire du langage</title>
  <meta name="description" content="Un laboratoire de conjugaison progressif pour apprendre les groupes de verbes, les radicaux et les temps de conjugaison." />
</svelte:head>

<div class:large-text={largeText} class:reduced-motion={reducedMotion} class="conjulab-shell">
  <div class="ambient ambient-one" aria-hidden="true"></div>
  <div class="ambient ambient-two" aria-hidden="true"></div>

  <header class="site-header">
    <a class="brand" href={orbisHref} aria-label="Retour à ORBIS">
      <span class="brand-mark" aria-hidden="true">C<span>.</span></span>
      <span class="brand-text"><strong>CONJULAB</strong><small>LABORATOIRE DU LANGAGE</small></span>
    </a>
    <div class="header-right">
      <span class="header-tag">FRANÇAIS · 6H–9H</span>
      <a class="top-link" href={orbisHref}>← Retour à ORBIS</a>
    </div>
  </header>

  {#if screen === 'menu'}
    <main class="menu-layout">
      <section class="hero-section" aria-labelledby="main-title">
        <p class="eyebrow"><span class="live-dot"></span> LABORATOIRE OUVERT</p>
        <h1 id="main-title">Les verbes ont<br /><em>un système.</em></h1>
        <p class="hero-copy">Observe les modèles. Comprends les radicaux. Décode les terminaisons. Puis conjugue avec méthode.</p>
        <div class="hero-chips" aria-label="Compétences travaillées">
          <span>01 · GROUPES</span><span>02 · RADICAUX</span><span>03 · TEMPS</span>
        </div>
      </section>

      <section class="panel setup-panel" aria-labelledby="setup-title">
        <div class="panel-heading">
          <div><p class="eyebrow">PRÉPARER UNE SESSION</p><h2 id="setup-title">Configure ton labo</h2></div>
          <span class="level-tag">{grade}</span>
        </div>

        <div class="setup-block">
          <h3><span class="step-number">01</span> Choisis ton niveau</h3>
          <div class="grade-grid" role="group" aria-label="Niveau scolaire">
            {#each GRADES as level}
              <button type="button" class:chosen={grade === level} class="grade-button" aria-pressed={grade === level} onclick={() => chooseGrade(level)}>
                <strong>{level}</strong><small>{level === '6H' ? 'Consolider' : level === '7H' ? 'Structurer' : level === '8H' ? 'Approfondir' : 'Maîtriser'}</small>
              </button>
            {/each}
          </div>
          <p class="small-note">{gradeVerbCount} verbes accessibles dans la banque de ce niveau. Les niveaux supérieurs incluent les notions précédentes.</p>
        </div>

        <div class="setup-block">
          <h3><span class="step-number">02</span> Choisis ton parcours</h3>
          <div class="choice-grid two-columns">
            <button type="button" class:chosen={playPath === 'guide'} class="choice-card" aria-pressed={playPath === 'guide'} onclick={() => playPath = 'guide'}>
              <span class="choice-icon" aria-hidden="true">↗</span><strong>Parcours guidé</strong><small>Classement → modèles → conjugaison progressive.</small>
            </button>
            <button type="button" class:chosen={playPath === 'libre'} class="choice-card" aria-pressed={playPath === 'libre'} onclick={() => playPath = 'libre'}>
              <span class="choice-icon" aria-hidden="true">⌘</span><strong>Accès libre</strong><small>Choisis le type d’exercice et les notions à revoir.</small>
            </button>
          </div>
        </div>

        <div class="setup-block">
          <h3><span class="step-number">03</span> Les temps à travailler</h3>
          <div class="compact-actions">
            <button type="button" class="text-button" onclick={selectAllTenses}>Tout sélectionner</button>
            <button type="button" class="text-button" onclick={selectCoreTenses}>Notions principales seulement</button>
          </div>
          <div class="tense-grid">
            {#each availableTenses as tense}
              <label class:advanced={tense.advanced} class="check-card">
                <input type="checkbox" value={tense.id} bind:group={selectedTenses} />
                <span class="fake-check" aria-hidden="true"></span>
                <span class="check-copy"><strong>{tense.shortLabel}</strong><small>{tense.mood}{tense.advanced ? ' · avancé' : ''}</small></span>
              </label>
            {/each}
          </div>
          <p class="small-note">Le mode guidé introduit progressivement les temps sélectionnés. Le mode libre les mélange selon tes choix.</p>
        </div>

        <div class="setup-block">
          <h3><span class="step-number">04</span> Personnalise les exercices</h3>
          <div class="field-label">Type d’activité</div>
          {#if playPath === 'guide'}<p class="small-note focus-note">Le parcours guidé organise les activités dans un ordre progressif. Passe en accès libre pour choisir un type d’exercice précis.</p>{/if}
          <div class="focus-grid">
            {#each FOCI as item}
              <button type="button" class:chosen={focus === item.id} class="focus-button" aria-pressed={focus === item.id} disabled={playPath === 'guide'} onclick={() => focus = item.id}>
                <strong>{item.label}</strong><small>{item.detail}</small>
              </button>
            {/each}
          </div>
          <div class="field-label group-label">Groupes de verbes</div>
          <div class="group-pills" role="group" aria-label="Groupes de verbes">
            {#each [1, 2, 3] as group}
              <button type="button" class:chosen={selectedGroups.includes(group as VerbGroup)} class="group-pill" aria-pressed={selectedGroups.includes(group as VerbGroup)} onclick={() => toggleGroup(group as VerbGroup)}>{getGroupLabel(group as VerbGroup)}</button>
            {/each}
          </div>
          <p class="small-note">Le filtre limite les verbes des exercices. Dans « Classer les verbes », les trois groupes sont comparés pour éviter de révéler la réponse.</p>
          <div class="field-label group-label">Format des réponses</div>
          <div class="segmented-control" role="group" aria-label="Format de réponse">
            <button type="button" class:active={answerStyle === 'mixte'} aria-pressed={answerStyle === 'mixte'} onclick={() => answerStyle = 'mixte'}>Alternance</button>
            <button type="button" class:active={answerStyle === 'qcm'} aria-pressed={answerStyle === 'qcm'} onclick={() => answerStyle = 'qcm'}>Choix multiples</button>
            <button type="button" class:active={answerStyle === 'saisie'} aria-pressed={answerStyle === 'saisie'} onclick={() => answerStyle = 'saisie'}>Écrire la forme</button>
          </div>
          <label class="toggle-row"><input type="checkbox" bind:checked={timedChallenge} /><span><strong>Défi chronométré (facultatif)</strong><small>15 secondes par question. Désactivé par défaut.</small></span></label>
        </div>

        {#if configError}<p class="inline-error" role="alert">{configError}</p>{/if}
        <div class="main-actions">
          <button class="primary-button" type="button" onclick={startSession}>Lancer une session <span aria-hidden="true">↗</span></button>
          <button class="secondary-button" type="button" onclick={openStudy}>Ouvrir les fiches du labo</button>
        </div>
      </section>

      <section class="accessibility-panel panel" aria-labelledby="access-title">
        <div><p class="eyebrow">À TON RYTHME</p><h2 id="access-title">Réglages de confort</h2><p class="small-note">Ces réglages restent actifs pendant cette visite. Ils ne sont pas enregistrés après la fermeture.</p></div>
        <div class="settings-grid">
          <button type="button" class:setting-active={largeText} class="setting-button" aria-pressed={largeText} onclick={() => largeText = !largeText}><span aria-hidden="true">A+</span><strong>Texte agrandi</strong><small>{largeText ? 'Activé' : 'Standard'}</small></button>
          <button type="button" class:setting-active={reducedMotion} class="setting-button" aria-pressed={reducedMotion} onclick={() => reducedMotion = !reducedMotion}><span aria-hidden="true">◌</span><strong>Animations réduites</strong><small>{reducedMotion ? 'Activé' : 'Standard'}</small></button>
          <button type="button" class:setting-active={voiceEnabled} class="setting-button" aria-pressed={voiceEnabled} onclick={() => voiceEnabled = !voiceEnabled}><span aria-hidden="true">◖))</span><strong>Lecture vocale</strong><small>{voiceEnabled ? 'Activée' : 'Désactivée'}</small></button>
          <button type="button" class:setting-active={soundEnabled} class="setting-button" aria-pressed={soundEnabled} onclick={() => soundEnabled = !soundEnabled}><span aria-hidden="true">♫</span><strong>Effets sonores</strong><small>{soundEnabled ? 'Activés' : 'Désactivés'}</small></button>
        </div>
      </section>
    </main>

  {:else if screen === 'study'}
    <main class="study-layout panel" aria-labelledby="study-title">
      <div class="panel-heading"><div><p class="eyebrow">CENTRE DE RÉFÉRENCE</p><h1 id="study-title">Les outils du labo</h1></div><button type="button" class="secondary-button small-button" onclick={backFromStudy}>← Retour au menu</button></div>
      <p class="study-intro">Utilise ces fiches avant une session ou pendant un exercice. Elles donnent des repères : elles ne remplacent pas un tableau complet pour chaque verbe irrégulier.</p>
      <div class="rule-layout">
        <nav class="rule-nav" aria-label="Choisir une fiche">
          {#each RULE_CARDS as card, index}
            <button type="button" class:active={selectedRuleIndex === index} aria-current={selectedRuleIndex === index ? 'page' : undefined} onclick={() => selectedRuleIndex = index}>{String(index + 1).padStart(2, '0')} <span>{card.title}</span></button>
          {/each}
        </nav>
        <article class="rule-card-reading">
          <p class="eyebrow">FICHE {String(selectedRuleIndex + 1).padStart(2, '0')}</p>
          <h2>{RULE_CARDS[selectedRuleIndex].title}</h2>
          <ol>{#each RULE_CARDS[selectedRuleIndex].steps as step}<li>{step}</li>{/each}</ol>
          {#if voiceEnabled}<button type="button" class="secondary-button" onclick={() => speak(`${RULE_CARDS[selectedRuleIndex].title}. ${RULE_CARDS[selectedRuleIndex].steps.join('. ')}`)}>Écouter cette fiche</button>{/if}
        </article>
      </div>
      <section class="reference-section"><h2>Repères rapides par niveau</h2>
        <div class="reference-grid">
          {#each GRADES as level}
            <article class="reference-grade"><h3>{level}</h3><p>{level === '6H' ? 'Présent, imparfait, futur simple et passé composé ; reconnaître l’infinitif, le sujet et les modèles usuels.' : level === '7H' ? 'Réactiver les temps de base ; travailler aussi le conditionnel présent, l’impératif et des verbes à orthographe variable.' : level === '8H' ? 'Approfondir les temps composés, repérer le passé simple à la 3e personne et travailler le subjonctif présent selon la progression de classe.' : 'Approfondir le système des modes et temps, notamment passé simple, passé antérieur, subjonctif et conditionnel passé, avec étude des valeurs en contexte.'}</p></article>
          {/each}
        </div>
        <p class="small-note">La progression est un repère pédagogique fondé sur la lecture du PER. Les attendus annuels exacts doivent être alignés avec la progression MER/cantonale utilisée en classe.</p>
      </section>
    </main>

  {:else if screen === 'game' && currentQuestion}
    <main class="game-layout">
      <div class="game-topbar">
        <div><p class="eyebrow">SESSION {grade} · {playPath === 'guide' ? 'PARCOURS GUIDÉ' : 'ACCÈS LIBRE'}</p><p class="game-progress-label">Question {questionIndex + 1} sur {SESSION_LENGTH}</p></div>
        <div class="topbar-actions"><button type="button" class="secondary-button small-button" onclick={toggleHelp} aria-expanded={showHelp}>{showHelp ? 'Fermer les fiches' : 'Aide et règles'}</button><button type="button" class="text-button back-menu" onclick={returnToMenu}>↩ Menu des niveaux</button></div>
      </div>
      <div class="progress-track" role="progressbar" aria-label="Progression de la session" aria-valuemin="0" aria-valuemax={SESSION_LENGTH} aria-valuenow={questionIndex}><span style={`width: ${progressPercent}%`}></span></div>

      <div class="game-columns">
        <section class="question-panel panel" aria-labelledby="question-title">
          <div class="question-meta"><span class="micro-tag">{currentQuestion.kind === 'conjuguer' ? 'FORME VERBALE' : currentQuestion.kind === 'identifier' ? 'ANALYSE' : currentQuestion.kind === 'groupe' ? 'CLASSIFICATION' : currentQuestion.kind === 'radical' ? 'RADICAL VARIABLE' : 'DÉCOUPAGE'}</span><span class="micro-tag">{currentQuestion.verb.infinitive}</span></div>
          <h1 id="question-title" tabindex="-1">{currentQuestion.prompt}</h1>
          <p class="question-instruction">{currentQuestion.kind === 'conjuguer' ? 'Complète la forme demandée.' : currentQuestion.kind === 'identifier' ? 'Observe la forme puis choisis le temps.' : currentQuestion.kind === 'groupe' ? 'Classe le verbe en t’appuyant sur son infinitif et son modèle.' : currentQuestion.kind === 'radical' ? 'Compare plusieurs formes du même verbe et repère ce qui change.' : 'Repère la terminaison dans la forme proposée.'}</p>
          <div class="sentence-card"><p>{currentQuestion.sentence}</p></div>
          {#if currentQuestion.kind === 'conjuguer' && currentQuestion.tense}
            <div class="form-tags"><span>{getTenseInfo(currentQuestion.tense).label}</span><span>{getGroupLabel(currentQuestion.verb.group)}</span></div>
          {/if}
          {#if activeAnswerMode === 'qcm'}
            <div class="answer-grid" role="group" aria-label="Choisir une réponse">
              {#each currentQuestion.options as option, index}
                <button type="button" class="answer-button" class:answer-correct={resolved && normalizeForComparison(option) === normalizeForComparison(currentQuestion.correctAnswer)} disabled={resolved} onclick={() => submitAnswer(option)}>
                  <span class="answer-number">{index + 1}</span><span>{option}</span>
                </button>
              {/each}
            </div>
            <p class="key-help">Ordinateur : utilise les touches 1, 2, 3 ou 4. Sur iPad : touche une réponse.</p>
          {:else}
            <form class="typing-form" onsubmit={submitTypedAnswer}>
              <label for="answer-input">Écris ce qui complète la phrase</label>
              <input id="answer-input" bind:value={answerInput} autocomplete="off" autocapitalize="none" spellcheck="false" disabled={resolved} placeholder="Écris ta réponse ici…" aria-describedby="typing-help" />
              <p id="typing-help" class="small-note">Les accents et l’apostrophe comptent. Tu peux écrire sur un clavier physique ou utiliser le clavier à l’écran de l’iPad.</p>
              <button type="submit" class="primary-button" disabled={resolved || !answerInput.trim()}>Vérifier la réponse</button>
            </form>
          {/if}

          {#if feedbackKind !== 'none'}
            <section class="feedback-panel" class:feedback-good={feedbackKind === 'correct'} class:feedback-help={feedbackKind === 'retry'} class:feedback-reveal={feedbackKind === 'revealed' || feedbackKind === 'timeout'} aria-live="polite" aria-atomic="true">
              <p class="feedback-title">{feedbackKind === 'correct' ? '✓ Réussi' : feedbackKind === 'retry' ? '↻ On réessaie' : feedbackKind === 'timeout' ? '⌛ Fin du temps du défi' : '→ On analyse la forme'}</p>
              <p>{feedbackMessage}</p>
              {#if feedbackKind === 'retry'}<p class="hint-text"><strong>Indice :</strong> {currentHint}</p>{/if}
              {#if feedbackKind === 'revealed' || feedbackKind === 'timeout'}
                <p class="answer-reveal"><span>Forme attendue</span><strong>{currentQuestion.correctAnswer}</strong></p>
                <p>{currentQuestion.explanation}</p>
              {:else if feedbackKind === 'correct'}
                <p>{currentQuestion.explanation}</p>
              {/if}
              {#if (feedbackKind === 'correct' || feedbackKind === 'revealed' || feedbackKind === 'timeout') && voiceEnabled}
                <button type="button" class="text-button" onclick={() => speak(`${feedbackMessage} ${currentQuestion?.explanation ?? ''}`)}>Écouter l’explication</button>
              {/if}
            </section>
          {/if}

          <div class="question-actions">
            {#if !resolved}
              <button type="button" class="secondary-button" onclick={() => { hintIndex = Math.min(hintIndex + 1, currentQuestion?.hintSteps.length ?? 0); errorHint = ''; }} disabled={hintIndex >= currentQuestion.hintSteps.length - 1}>Indice suivant</button>
              {#if voiceEnabled}<button type="button" class="secondary-button" onclick={speakQuestion}>Écouter la consigne</button>{/if}
            {:else}
              <button type="button" class="primary-button" onclick={moveNext}>{questionIndex + 1 >= SESSION_LENGTH ? 'Voir le bilan' : 'Continuer'} <span aria-hidden="true">→</span></button>
            {/if}
          </div>
        </section>

        <aside class="side-column">
          <section class="panel lab-status"><p class="eyebrow">STATUT DU LABO</p><div class="status-line"><span>Précision</span><strong>{correctQuestions}/{Math.max(1, questionIndex + (resolved ? 1 : 0))}</strong></div><div class="mini-track"><span style={`width: ${Math.min(100, (correctQuestions / Math.max(1, questionIndex + (resolved ? 1 : 0))) * 100)}%`}></span></div><div class="status-line"><span>Points acquis</span><strong>{score}</strong></div><div class="status-line"><span>Indices utilisés</span><strong>{hintIndex + (errorHint ? 1 : 0)}</strong></div>{#if timedChallenge && !resolved}<div class="timer-pill">Temps restant : <strong>{timeLeft}s</strong></div>{/if}</section>
          <section class="panel coach-card"><div class="coach-icon" aria-hidden="true">✳</div><p class="eyebrow">MÉTHODE</p><h2>Décompose avant de répondre.</h2><ol><li>Repère le sujet.</li><li>Identifie le temps.</li><li>Choisis le radical ou l’auxiliaire.</li><li>Vérifie la terminaison.</li></ol><button type="button" class="text-button" onclick={toggleHelp}>{showHelp ? 'Masquer les fiches' : 'Ouvrir les fiches de règle'} ↗</button></section>
          {#if showHelp}<section class="panel quick-help" aria-label="Fiche de révision"><p class="eyebrow">RAPPEL EXPRESS</p><h2>{RULE_CARDS[selectedRuleIndex].title}</h2><ol>{#each RULE_CARDS[selectedRuleIndex].steps as step}<li>{step}</li>{/each}</ol><div class="rule-switcher"><button type="button" class="secondary-button small-button" onclick={() => selectedRuleIndex = (selectedRuleIndex + RULE_CARDS.length - 1) % RULE_CARDS.length}>← Précédente</button><button type="button" class="secondary-button small-button" onclick={() => selectedRuleIndex = (selectedRuleIndex + 1) % RULE_CARDS.length}>Suivante →</button></div></section>{/if}
        </aside>
      </div>
      <div class="bottom-game-actions"><button type="button" class="text-button" onclick={returnToMenu}>Quitter la session et revenir au menu</button></div>
    </main>

  {:else}
    <main class="end-layout panel" aria-labelledby="end-title">
      {#if fatalError}
        <p class="eyebrow">PROBLÈME DE GÉNÉRATION</p><h1 id="end-title">Une question n’a pas pu être préparée.</h1><p>{fatalError}</p><p class="small-note">Aucun résultat n’a été envoyé. Reviens au menu, ajuste les critères et réessaie.</p><button type="button" class="primary-button" onclick={returnToMenu}>Retour au menu</button>
      {:else}
        <p class="eyebrow">SESSION TERMINÉE</p><h1 id="end-title">Analyse terminée<span>.</span></h1><p class="end-copy">Tu as travaillé comme un laboratoire : observer, faire une hypothèse, tester, puis corriger.</p>
        <div class="score-grid"><div><strong>{score}</strong><span>Points</span></div><div><strong>{correctQuestions}/10</strong><span>Réponses trouvées</span></div><div><strong>{retrySuccesses}</strong><span>Corrections réussies</span></div><div><strong>{totalErrors}</strong><span>Essais incorrects / temps écoulés</span></div></div>
        <div class="end-reflection"><h2>Pour la suite</h2><p>{correctQuestions >= 8 ? 'Tu sembles à l’aise avec ces questions. Essaie un temps plus difficile ou une activité de saisie libre.' : correctQuestions >= 5 ? 'Tu as déjà plusieurs repères. Revois les formes qui t’ont posé problème, puis recommence.' : 'Reprends les fiches sur les groupes et les terminaisons, puis choisis une session plus ciblée.'}</p><button type="button" class="secondary-button" onclick={openStudy}>Réviser les règles</button></div>
        <p class="result-status" aria-live="polite">{resultStatus === 'sending' ? 'Transmission du bilan à ORBIS…' : resultStatus === 'sent' ? 'Bilan transmis à ORBIS.' : resultStatus === 'unavailable' ? 'Le bilan n’a pas pu être transmis. La session reste consultable jusqu’à la sortie de la page.' : 'Le bilan sera transmis à ORBIS.'}</p>
        {#if resultStatus === 'unavailable'}<button type="button" class="secondary-button" onclick={() => void sendResult()}>Réessayer la transmission</button>{/if}
        <div class="end-actions"><button type="button" class="primary-button" onclick={returnToMenu}>Retour au menu des niveaux</button><a class="secondary-button" href={orbisHref}>Retour à ORBIS</a></div>
      {/if}
    </main>
  {/if}

  <footer class="site-footer"><span>CONJULAB <span class="footer-dot">•</span> APPRENDRE À COMPRENDRE</span><span>Une forme à la fois.</span></footer>
</div>

<style>
  :global(*) { box-sizing: border-box; }
  :global(html) { background: #0b1020; color-scheme: dark; }
  :global(body) { margin: 0; min-width: 320px; background: #0b1020; }
  :global(button), :global(input) { font: inherit; }
  :global(button), :global(a), :global(input) { -webkit-tap-highlight-color: transparent; }

  .conjulab-shell {
    --bg: #0b1020;
    --surface: rgba(19, 28, 49, .94);
    --surface-soft: #151f36;
    --border: #2b3854;
    --text: #f3f5fb;
    --muted: #bac5d9;
    --muted-2: #94a4be;
    --cyan: #70e1d0;
    --cyan-strong: #22b9a6;
    --amber: #f3c879;
    --purple: #b7a6ff;
    --danger: #ffb6b6;
    --good: #8af0c2;
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    isolation: isolate;
    padding: 0 clamp(14px, 3vw, 34px) 20px;
    background: radial-gradient(ellipse at 12% 0%, rgba(45, 103, 136, .25), transparent 36%), radial-gradient(ellipse at 92% 30%, rgba(95, 64, 143, .15), transparent 40%), var(--bg);
    color: var(--text);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    line-height: 1.55;
    font-size: 16px;
  }
  .conjulab-shell.large-text { font-size: 19px; }
  .ambient { position: absolute; border-radius: 50%; filter: blur(70px); opacity: .14; pointer-events: none; z-index: -1; }
  .ambient-one { width: 360px; height: 360px; top: 280px; left: -180px; background: #41d7c6; }
  .ambient-two { width: 420px; height: 420px; top: 820px; right: -220px; background: #927cff; }
  .site-header { width: min(1240px, 100%); margin: 0 auto; min-height: 82px; display: flex; align-items: center; justify-content: space-between; gap: 18px; border-bottom: 1px solid rgba(148, 164, 190, .15); position: relative; z-index: 2; }
  .brand { display: inline-flex; align-items: center; gap: 12px; color: var(--text); text-decoration: none; }
  .brand-mark { width: 43px; height: 43px; display: grid; place-items: center; border-radius: 13px; background: linear-gradient(145deg, #74e3d0, #927fff); color: #11172b; font-weight: 950; font-size: 23px; box-shadow: 0 8px 30px rgba(65, 215, 198, .16); }
  .brand-mark span { color: #fff; }
  .brand-text { display: flex; flex-direction: column; line-height: 1.1; }
  .brand-text strong { letter-spacing: .16em; font-size: 14px; }
  .brand-text small { color: var(--muted-2); font-size: 9px; letter-spacing: .15em; margin-top: 5px; }
  .header-right { display: flex; align-items: center; gap: 18px; }
  .header-tag, .top-link { font-size: 12px; color: var(--muted); }
  .header-tag { letter-spacing: .12em; border: 1px solid var(--border); border-radius: 999px; padding: 7px 10px; }
  .top-link { text-decoration: none; font-weight: 700; white-space: nowrap; }
  .top-link:hover, .top-link:focus-visible { color: var(--cyan); }
  .menu-layout, .game-layout, .study-layout, .end-layout { width: min(1240px, 100%); margin: 0 auto; }
  .menu-layout { display: grid; grid-template-columns: minmax(0, .84fr) minmax(0, 1.16fr); gap: 24px; align-items: start; padding: 40px 0 16px; }
  .hero-section { padding: 48px 10px 18px 2px; position: sticky; top: 20px; }
  .eyebrow { margin: 0 0 12px; color: var(--cyan); text-transform: uppercase; letter-spacing: .16em; font-size: 11px; font-weight: 850; }
  .live-dot { width: 7px; height: 7px; display: inline-block; margin-right: 8px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 10px rgba(112, 225, 208, .7); }
  h1, h2, h3, p { overflow-wrap: anywhere; }
  .hero-section h1 { font-size: clamp(43px, 6vw, 74px); line-height: .99; letter-spacing: -.055em; margin: 0; font-weight: 900; max-width: 620px; }
  .hero-section h1 em { font-style: normal; color: var(--cyan); }
  .hero-copy { max-width: 470px; color: var(--muted); font-size: 18px; margin: 27px 0; }
  .hero-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .hero-chips span { color: #d7e0ef; font-size: 10px; letter-spacing: .09em; border: 1px solid var(--border); background: rgba(20, 30, 51, .6); border-radius: 8px; padding: 9px 10px; }
  .panel { background: var(--surface); border: 1px solid rgba(145, 164, 192, .25); border-radius: 20px; box-shadow: 0 22px 60px rgba(0, 0, 0, .17); backdrop-filter: blur(14px); }
  .setup-panel { padding: clamp(18px, 3vw, 30px); }
  .panel-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 22px; }
  .panel-heading h2, .accessibility-panel h2 { margin: 0; font-size: clamp(23px, 3vw, 29px); line-height: 1.2; letter-spacing: -.025em; }
  .panel-heading .eyebrow { margin-bottom: 5px; }
  .level-tag { display: grid; place-items: center; border: 1px solid rgba(112, 225, 208, .4); background: rgba(112, 225, 208, .09); color: var(--cyan); font-weight: 900; padding: 8px 13px; border-radius: 10px; }
  .setup-block { padding: 20px 0; border-top: 1px solid rgba(148, 164, 190, .13); }
  .setup-block h3 { margin: 0 0 14px; font-size: 15px; display: flex; gap: 10px; align-items: center; }
  .step-number { width: 24px; height: 24px; display: inline-grid; place-items: center; color: var(--bg); font-weight: 900; background: var(--cyan); border-radius: 7px; font-size: 11px; flex-shrink: 0; }
  .grade-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  .grade-button, .choice-card, .focus-button, .group-pill, .setting-button, .check-card, .answer-button { border: 1px solid var(--border); background: rgba(10, 17, 34, .7); color: var(--text); border-radius: 12px; text-align: left; cursor: pointer; transition: border-color .16s ease, background .16s ease, transform .16s ease; }
  .grade-button { min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; text-align: center; padding: 8px 4px; }
  .grade-button strong { font-size: 20px; }
  .grade-button small { font-size: 10px; color: var(--muted-2); }
  .chosen, .grade-button.chosen, .choice-card.chosen, .focus-button.chosen, .group-pill.chosen { border-color: var(--cyan); background: rgba(112, 225, 208, .09); box-shadow: inset 0 0 0 1px rgba(112, 225, 208, .08); }
  .chosen strong, .grade-button.chosen strong { color: var(--cyan); }
  .small-note { color: var(--muted-2); font-size: 12px; margin: 10px 0 0; line-height: 1.5; }
  .choice-grid { display: grid; gap: 10px; }
  .two-columns { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .choice-card { padding: 15px; display: grid; grid-template-columns: 27px minmax(0, 1fr); column-gap: 8px; text-align: left; align-items: start; }
  .choice-icon { grid-row: span 2; color: var(--cyan); font-size: 22px; font-weight: 900; }
  .choice-card strong { font-size: 13px; }
  .choice-card small { grid-column: 2; color: var(--muted-2); font-size: 11px; line-height: 1.4; margin-top: 4px; }
  .compact-actions { display: flex; flex-wrap: wrap; gap: 12px; margin: -4px 0 12px; }
  .text-button { border: 0; background: transparent; color: var(--cyan); font-size: 12px; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; min-height: 38px; padding: 8px 3px; font-weight: 750; }
  .text-button:hover { color: #b5fff2; }
  .tense-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .check-card { min-height: 60px; display: flex; align-items: center; gap: 10px; padding: 11px; cursor: pointer; }
  .check-card:has(input:checked) { border-color: rgba(112, 225, 208, .8); background: rgba(112, 225, 208, .06); }
  .check-card.advanced { border-style: dashed; }
  .check-card input, .toggle-row input { width: 19px; height: 19px; accent-color: var(--cyan-strong); flex-shrink: 0; }
  .fake-check { display: none; }
  .check-copy { display: flex; flex-direction: column; min-width: 0; }
  .check-copy strong { font-size: 12px; font-weight: 750; }
  .check-copy small { color: var(--muted-2); font-size: 10px; margin-top: 3px; }
  .field-label { color: var(--muted-2); font-size: 12px; font-weight: 800; margin-bottom: 8px; }
  .group-label { margin-top: 17px; }
  .focus-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .focus-button { padding: 12px; display: flex; flex-direction: column; gap: 4px; }
  .focus-button:disabled { opacity: .55; cursor: not-allowed; }
  .focus-note { margin: -2px 0 10px; }
  .focus-button strong { font-size: 12px; }
  .focus-button small { font-size: 11px; color: var(--muted-2); line-height: 1.35; }
  .group-pills { display: flex; flex-wrap: wrap; gap: 8px; }
  .group-pill { min-height: 44px; padding: 9px 12px; font-size: 11px; font-weight: 750; }
  .segmented-control { border: 1px solid var(--border); background: rgba(8, 14, 28, .7); padding: 4px; border-radius: 12px; display: flex; gap: 4px; }
  .segmented-control button { flex: 1; border: 0; background: transparent; border-radius: 8px; color: var(--muted); min-height: 39px; padding: 7px; font-size: 11px; font-weight: 800; cursor: pointer; }
  .segmented-control button.active { background: var(--surface-soft); color: var(--cyan); box-shadow: inset 0 0 0 1px var(--border); }
  .toggle-row { display: flex; align-items: center; gap: 11px; margin-top: 16px; padding: 12px; border-radius: 10px; background: rgba(8, 14, 28, .4); cursor: pointer; }
  .toggle-row span { display: flex; flex-direction: column; }
  .toggle-row strong { font-size: 12px; }
  .toggle-row small { font-size: 11px; color: var(--muted-2); margin-top: 3px; }
  .main-actions { display: flex; flex-direction: column; gap: 10px; padding-top: 12px; }
  .primary-button, .secondary-button { min-height: 46px; border-radius: 11px; padding: 11px 16px; display: inline-flex; align-items: center; justify-content: center; gap: 11px; font-size: 13px; font-weight: 850; text-decoration: none; cursor: pointer; border: 1px solid transparent; }
  .primary-button { background: var(--cyan); color: #081722; box-shadow: 0 9px 24px rgba(34, 185, 166, .12); }
  .primary-button:hover { background: #a5f3e7; }
  .secondary-button { border-color: var(--border); background: rgba(10, 17, 34, .75); color: var(--text); }
  .secondary-button:hover { border-color: var(--cyan); color: var(--cyan); }
  button:disabled { opacity: .45; cursor: not-allowed; transform: none !important; }
  .small-button { min-height: 38px; padding: 8px 11px; font-size: 11px; }
  .inline-error { background: rgba(255, 100, 100, .1); border: 1px solid rgba(255, 150, 150, .4); color: var(--danger); padding: 12px; border-radius: 10px; font-size: 13px; }
  .accessibility-panel { grid-column: 1 / -1; display: grid; grid-template-columns: minmax(210px, .65fr) minmax(0, 1.35fr); gap: 25px; padding: 23px; align-items: center; }
  .accessibility-panel .eyebrow { margin-bottom: 6px; }
  .accessibility-panel h2 { font-size: 20px; }
  .settings-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  .setting-button { padding: 13px 9px; min-height: 98px; display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
  .setting-button > span { color: var(--cyan); font-size: 22px; font-weight: 900; }
  .setting-button strong { font-size: 11px; }
  .setting-button small { color: var(--muted-2); font-size: 10px; }
  .setting-button.setting-active { border-color: var(--cyan); background: rgba(112, 225, 208, .08); }
  .site-footer { width: min(1240px, 100%); margin: 25px auto 0; padding: 13px 0 0; display: flex; justify-content: space-between; gap: 12px; color: var(--muted-2); font-size: 10px; letter-spacing: .04em; }
  .footer-dot { color: var(--cyan); margin: 0 5px; }

  /* Le jeu : une seule question centrale, un panneau d’aide qui reste secondaire. */
  .game-layout { padding: 30px 0 10px; }
  .game-topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
  .game-topbar .eyebrow { margin-bottom: 3px; }
  .game-progress-label { margin: 0; font-size: 13px; color: var(--muted); }
  .topbar-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
  .back-menu { white-space: nowrap; }
  .progress-track, .mini-track { background: #202d46; border-radius: 999px; overflow: hidden; }
  .progress-track { height: 6px; margin-bottom: 18px; }
  .progress-track span, .mini-track span { display: block; height: 100%; background: linear-gradient(90deg, var(--cyan-strong), var(--purple)); border-radius: inherit; transition: width .18s ease; }
  .game-columns { display: grid; grid-template-columns: minmax(0, 1fr) minmax(245px, .35fr); gap: 18px; align-items: start; }
  .question-panel { padding: clamp(18px, 3.4vw, 38px); min-width: 0; }
  .question-meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; }
  .micro-tag { border: 1px solid var(--border); background: rgba(8, 14, 28, .5); border-radius: 7px; padding: 5px 8px; font-size: 10px; color: var(--muted); letter-spacing: .04em; }
  .question-panel h1 { margin: 23px 0 5px; font-size: clamp(27px, 4vw, 42px); letter-spacing: -.035em; line-height: 1.12; }
  .question-instruction { margin: 0 0 18px; color: var(--muted); font-size: 14px; }
  .sentence-card { padding: clamp(18px, 3vw, 26px); background: rgba(5, 11, 24, .55); border: 1px solid rgba(112, 225, 208, .18); border-radius: 14px; margin: 18px 0 12px; }
  .sentence-card p { font-size: clamp(20px, 3.2vw, 28px); font-weight: 850; line-height: 1.45; text-align: center; margin: 0; letter-spacing: -.015em; }
  .form-tags { display: flex; flex-wrap: wrap; justify-content: center; gap: 7px; margin: 13px 0 20px; }
  .form-tags span { font-size: 11px; color: #d0d7e8; background: #1b2740; padding: 5px 9px; border-radius: 7px; }
  .answer-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 22px; }
  .answer-button { min-height: 62px; display: flex; align-items: center; gap: 12px; padding: 12px; font-size: 15px; line-height: 1.35; font-weight: 750; }
  .answer-button:hover:not(:disabled) { transform: translateY(-1px); border-color: var(--cyan); background: rgba(112, 225, 208, .08); }
  .answer-number { display: inline-grid; place-items: center; flex-shrink: 0; width: 28px; height: 28px; border-radius: 8px; background: #26344f; color: var(--cyan); font-size: 12px; }
  .answer-correct { border-color: var(--good) !important; background: rgba(138, 240, 194, .11) !important; }
  .key-help { margin: 10px 0 0; text-align: center; font-size: 11px; color: var(--muted-2); }
  .typing-form { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
  .typing-form label { font-size: 13px; font-weight: 800; }
  .typing-form input { width: 100%; min-height: 55px; border-radius: 11px; border: 1px solid #465575; background: #080e1d; color: var(--text); padding: 13px 15px; font-size: 18px; }
  .typing-form input:focus { outline: 3px solid rgba(112, 225, 208, .25); border-color: var(--cyan); }
  .typing-form .primary-button { align-self: flex-start; }
  .feedback-panel { margin-top: 20px; border-radius: 13px; padding: 16px; border: 1px solid var(--border); background: rgba(13, 21, 39, .7); font-size: 13px; }
  .feedback-panel p { margin: 6px 0; }
  .feedback-title { font-weight: 900; font-size: 14px; }
  .feedback-good { border-color: rgba(138, 240, 194, .45); background: rgba(43, 139, 103, .1); }
  .feedback-good .feedback-title { color: var(--good); }
  .feedback-help { border-color: rgba(243, 200, 121, .45); background: rgba(171, 121, 34, .09); }
  .feedback-help .feedback-title { color: var(--amber); }
  .feedback-reveal { border-color: rgba(183, 166, 255, .45); background: rgba(107, 83, 171, .1); }
  .feedback-reveal .feedback-title { color: var(--purple); }
  .hint-text { color: #ffe4a8; }
  .answer-reveal { display: flex; gap: 12px; align-items: baseline; flex-wrap: wrap; padding: 10px 0; border-bottom: 1px solid rgba(183, 166, 255, .17); }
  .answer-reveal span { color: var(--muted); font-size: 11px; }
  .answer-reveal strong { color: var(--good); font-size: 20px; }
  .question-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; margin-top: 18px; }
  .side-column { display: flex; flex-direction: column; gap: 14px; }
  .lab-status, .coach-card, .quick-help { padding: 18px; }
  .lab-status .eyebrow, .coach-card .eyebrow, .quick-help .eyebrow { margin-bottom: 12px; }
  .status-line { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin: 11px 0; font-size: 12px; }
  .status-line span { color: var(--muted); }
  .status-line strong { color: var(--text); font-size: 14px; }
  .mini-track { height: 5px; margin-bottom: 18px; }
  .timer-pill { border-radius: 8px; padding: 8px 10px; background: rgba(243, 200, 121, .09); color: var(--amber); font-size: 12px; }
  .coach-icon { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; background: rgba(183, 166, 255, .12); color: var(--purple); font-size: 23px; margin-bottom: 15px; }
  .coach-card h2, .quick-help h2 { margin: 0 0 12px; font-size: 18px; line-height: 1.25; }
  .coach-card ol, .quick-help ol { padding-left: 19px; color: var(--muted); font-size: 12px; margin: 0 0 13px; }
  .coach-card li, .quick-help li { padding-left: 3px; margin: 7px 0; }
  .quick-help { border-color: rgba(112, 225, 208, .4); }
  .rule-switcher { display: flex; justify-content: space-between; gap: 6px; margin-top: 12px; }
  .bottom-game-actions { text-align: center; padding-top: 8px; }
  .bottom-game-actions .text-button { color: var(--muted-2); }

  .study-layout { padding: clamp(18px, 4vw, 40px); margin-top: 30px; }
  .study-layout .panel-heading { align-items: flex-start; }
  .study-layout h1 { margin: 0; font-size: clamp(30px, 5vw, 48px); letter-spacing: -.04em; }
  .study-intro { max-width: 780px; color: var(--muted); margin-top: -7px; }
  .rule-layout { display: grid; grid-template-columns: minmax(200px, .42fr) minmax(0, 1fr); gap: 20px; margin-top: 24px; }
  .rule-nav { display: flex; flex-direction: column; gap: 7px; }
  .rule-nav button { display: flex; gap: 12px; align-items: center; text-align: left; border-radius: 10px; padding: 12px; border: 1px solid transparent; color: var(--muted); background: rgba(6, 12, 26, .45); cursor: pointer; font-size: 12px; }
  .rule-nav button.active { color: var(--cyan); border-color: var(--border); background: rgba(112, 225, 208, .08); }
  .rule-nav button span { font-weight: 800; }
  .rule-card-reading { padding: clamp(20px, 4vw, 35px); background: rgba(6, 12, 26, .42); border: 1px solid var(--border); border-radius: 15px; }
  .rule-card-reading h2 { font-size: clamp(23px, 3vw, 31px); margin: 0 0 15px; }
  .rule-card-reading ol { padding-left: 22px; margin: 0 0 22px; color: #dbe3f1; }
  .rule-card-reading li { margin: 12px 0; }
  .reference-section { border-top: 1px solid var(--border); margin-top: 30px; padding-top: 25px; }
  .reference-section h2 { margin-top: 0; }
  .reference-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
  .reference-grade { border: 1px solid var(--border); border-radius: 12px; background: rgba(6, 12, 26, .42); padding: 14px; }
  .reference-grade h3 { color: var(--cyan); margin: 0 0 8px; }
  .reference-grade p { color: var(--muted); font-size: 12px; margin: 0; }

  .end-layout { max-width: 900px; padding: clamp(22px, 5vw, 54px); margin-top: 50px; }
  .end-layout h1 { margin: 0; font-size: clamp(37px, 6vw, 62px); letter-spacing: -.05em; line-height: 1.05; }
  .end-layout h1 span { color: var(--cyan); }
  .end-copy { color: var(--muted); max-width: 650px; font-size: 16px; }
  .score-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin: 27px 0; }
  .score-grid div { border: 1px solid var(--border); border-radius: 12px; padding: 16px 12px; background: rgba(6, 12, 26, .45); display: flex; flex-direction: column; gap: 5px; }
  .score-grid strong { color: var(--cyan); font-size: clamp(24px, 3vw, 35px); letter-spacing: -.04em; }
  .score-grid span { color: var(--muted); font-size: 11px; }
  .end-reflection { border-left: 3px solid var(--purple); background: rgba(183, 166, 255, .06); padding: 17px; border-radius: 0 12px 12px 0; }
  .end-reflection h2 { font-size: 17px; margin: 0 0 5px; }
  .end-reflection p { color: var(--muted); font-size: 13px; }
  .result-status { color: var(--muted-2); font-size: 12px; margin: 17px 0; }
  .end-actions { display: flex; flex-wrap: wrap; gap: 10px; }

  :global(button:focus-visible), :global(a:focus-visible), :global(input:focus-visible) { outline: 3px solid var(--amber); outline-offset: 3px; }
  .large-text :global(.small-note), .large-text :global(.check-copy small), .large-text :global(.focus-button small), .large-text :global(.header-tag) { font-size: 13px; }
  .reduced-motion *, .reduced-motion *::before, .reduced-motion *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: .01ms !important; }
  @media (prefers-reduced-motion: reduce) { .conjulab-shell *, .conjulab-shell *::before, .conjulab-shell *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }
  @media (max-width: 900px) {
    .menu-layout { grid-template-columns: minmax(0, 1fr); gap: 16px; padding-top: 18px; }
    .hero-section { position: static; padding: 25px 4px 14px; }
    .hero-section h1 { font-size: clamp(42px, 8vw, 68px); }
    .hero-copy { margin: 17px 0; max-width: 700px; }
    .accessibility-panel { grid-template-columns: 1fr; gap: 15px; }
    .game-columns { grid-template-columns: minmax(0, 1fr); }
    .side-column { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .quick-help { grid-column: 1 / -1; }
  }
  @media (max-width: 600px) {
    .conjulab-shell { padding-inline: 12px; }
    .site-header { min-height: 69px; }
    .brand-mark { width: 37px; height: 37px; }
    .brand-text strong { font-size: 12px; }
    .brand-text small { font-size: 8px; }
    .header-right { gap: 8px; }
    .header-tag { display: none; }
    .top-link { font-size: 11px; }
    .hero-section { padding-top: 30px; }
    .hero-section h1 { font-size: clamp(40px, 12vw, 57px); }
    .hero-copy { font-size: 16px; }
    .grade-button { min-height: 66px; }
    .two-columns, .tense-grid, .focus-grid, .answer-grid, .reference-grid, .score-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .settings-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .accessibility-panel { padding: 17px; }
    .game-topbar { align-items: flex-start; flex-direction: column; }
    .topbar-actions { width: 100%; justify-content: space-between; }
    .question-panel { padding: 17px; }
    .question-panel h1 { margin-top: 17px; }
    .answer-button { min-height: 60px; font-size: 14px; }
    .side-column { grid-template-columns: 1fr; }
    .rule-layout { grid-template-columns: 1fr; }
    .rule-nav { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .rule-nav button { padding: 10px; }
    .reference-section h2 { font-size: 21px; }
    .score-grid div { padding: 13px 10px; }
    .end-actions { flex-direction: column; }
    .end-actions > * { width: 100%; }
    .site-footer { font-size: 9px; }
  }
  @media (max-width: 370px) {
    .focus-grid, .two-columns, .tense-grid { grid-template-columns: minmax(0, 1fr); }
    .brand-text small { letter-spacing: .07em; }
    .top-link { font-size: 10px; }
  }
</style>
