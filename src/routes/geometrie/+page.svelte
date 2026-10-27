<script lang="ts">
  // L’écran règle la mission et le feedback ; questions et figures viennent des modules géométrie.
  import { base } from '$app/paths';
  import { catalogHref, restoreCatalogReturn } from '$lib/orbis/navigation';
  import { onDestroy, onMount, tick } from 'svelte';
  import { getStudentName } from '$lib/orbis/identity/local-student';
  import { submitActivityResult } from '$lib/orbis/results/client';
  import { GEOMETRY_FIGURES, getFiguresForLevel } from '$lib/games/geometrie/figures';
  import FigureDrawing from '$lib/games/geometrie/FigureDrawing.svelte';
  import { generateQuestion } from '$lib/games/geometrie/question-engine';
  import type { ErrorFamily, GeometryFigure, Level, Mode, PlayMode, Question } from '$lib/games/geometrie/types';

  type Phase = 'config' | 'play' | 'done';
  type FeedbackKind = 'success' | 'retry' | 'solution' | '';

  const ORBIS_HOME = `${base}/`;
  let homeHref = ORBIS_HOME;
  let helpOpenButton: HTMLButtonElement | null = null;
  let helpCloseButton: HTMLButtonElement | null = null;
  let feedbackPanelElement: HTMLDivElement | null = null;
  const QUESTION_COUNT = 10;
  const levelChoices: Level[] = ['6H', '7H', '8H'];
  const modeChoices: { id: Mode; title: string; description: string }[] = [
    { id: 'A', title: 'Enquête', description: 'Trouver une figure à partir de ses propriétés.' },
    { id: 'B', title: 'Intrus logique', description: 'Repérer la figure qui ne partage pas un critère.' },
    { id: 'C', title: '2D ou 3D ?', description: 'Distinguer figure plane et solide.' },
    { id: 'D', title: 'Classification', description: 'Sélectionner toutes les figures correspondant à une propriété.' },
    { id: 'Mixte', title: 'Parcours mixte', description: 'Mélanger les quatre types de défi.' }
  ];

  let studentName = 'Explorateur';
  let phase: Phase = 'config';
  let level: Level | '' = '';
  let mode: Mode | '' = '';
  let questionIndex = 1;
  let question: Question | null = null;
  let selectedOptionIds: string[] = [];
  let visibleHintCount = 1;
  let pointsForQuestion = 30;
  let xp = 0;
  let correctCount = 0;
  let firstTryCorrectCount = 0;
  let attemptsForQuestion = 0;
  let locked = false;
  let feedbackKind: FeedbackKind = '';
  let feedbackTitle = '';
  let feedbackDetails = '';
  let errorFamilies: ErrorFamily[] = [];
  let showHelp = false;
  let enlargeFigures = false;
  let submittingResult = false;
  let resultSubmissionMessage = '';
  let resultSubmitted = false;
  let generationError = '';
  let availableFigures: GeometryFigure[] = GEOMETRY_FIGURES;
  let planeFigures: GeometryFigure[] = [];
  let solidFigures: GeometryFigure[] = [];
  let progressPercent = 0;

  // Les figures de l'aide sont filtrées sur le niveau choisi, pour éviter
  // d'afficher d'emblée tout le vocabulaire des niveaux supérieurs.
  $: availableFigures = level ? getFiguresForLevel(level) : GEOMETRY_FIGURES;
  $: planeFigures = availableFigures.filter((figure) => figure.kind === 'plane');
  $: solidFigures = availableFigures.filter((figure) => figure.kind === 'solid');
  $: progressPercent = Math.min(100, ((questionIndex - 1) / QUESTION_COUNT) * 100);

  onMount(() => {
    const savedName = getStudentName();
    studentName = typeof savedName === 'string' && savedName.trim() ? savedName.trim() : 'Explorateur';
    // Préserve le contexte de l'élève transmis par ORBIS (?eleve=...).
    const studentId = new URLSearchParams(window.location.search).get('eleve');
    homeHref = studentId ? `${ORBIS_HOME}?eleve=${encodeURIComponent(studentId)}` : ORBIS_HOME;
  });

  onDestroy(() => {
    // Arrête la synthèse vocale si l'élève quitte la page pendant la consigne.
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  });

  // Prépare une série, charge les questions puis termine avec un bilan facultatif.
  function startMission(): void {
    if (!level || !mode) return;
    phase = 'play';
    questionIndex = 1;
    xp = 0;
    correctCount = 0;
    firstTryCorrectCount = 0;
    errorFamilies = [];
    resultSubmissionMessage = '';
    resultSubmitted = false;
    loadQuestion();
  }

  function loadQuestion(): void {
    if (!level || !mode) return;
    if (questionIndex > QUESTION_COUNT) {
      void finishMission();
      return;
    }

    generationError = '';
    try {
      // La fonction génère et valide chaque question avant de la renvoyer.
      question = generateQuestion(level, mode);
      selectedOptionIds = [];
      visibleHintCount = Math.min(question.initialHintCount ?? 1, Math.max(1, question.progressiveHints.length));
      pointsForQuestion = 30;
      attemptsForQuestion = 0;
      locked = false;
      feedbackKind = '';
      feedbackTitle = '';
      feedbackDetails = '';
    } catch (error) {
      question = null;
      generationError = error instanceof Error ? error.message : 'La question n’a pas pu être créée.';
    }
  }

  function toggleOptionSelection(optionId: string): void {
    if (locked || !question) return;

    if (question.type === 'single') {
      selectedOptionIds = [optionId];
      return;
    }

    selectedOptionIds = selectedOptionIds.includes(optionId)
      ? selectedOptionIds.filter((id) => id !== optionId)
      : [...selectedOptionIds, optionId];
  }

  function revealNextHint(): void {
    if (locked || !question || visibleHintCount >= question.progressiveHints.length) return;
    visibleHintCount += 1;
    pointsForQuestion = Math.max(10, pointsForQuestion - 5);
  }

  function submitAnswer(): void {
    if (locked || !question || selectedOptionIds.length === 0) return;

    const expected = new Set(question.correctIds);
    const selected = new Set(selectedOptionIds);
    const isCorrect = expected.size === selected.size && [...expected].every((id) => selected.has(id));
    const selectedLabels = question.options
      .filter((option) => selectedOptionIds.includes(option.id))
      .map((option) => option.label);
    const expectedLabels = question.options
      .filter((option) => question?.correctIds.includes(option.id))
      .map((option) => option.label);

    if (isCorrect) {
      correctCount += 1;
      if (attemptsForQuestion === 0) firstTryCorrectCount += 1;
      xp += Math.max(10, pointsForQuestion);
      locked = true;
      feedbackKind = 'success';
      feedbackTitle = attemptsForQuestion === 0 ? `Bonne réponse ! +${Math.max(10, pointsForQuestion)} XP` : `Bien repris ! +${Math.max(10, pointsForQuestion)} XP`;
      feedbackDetails = question.explanation;
      void scrollFeedbackIntoView();
      return;
    }

    errorFamilies = [...errorFamilies, {
      // `target`, `answered` et `mode` gardent le format historique attendu par ORBIS.
      target: expectedLabels.join(', '),
      answered: selectedLabels.join(', '),
      mode: question.mode,
      questionText: question.text,
      selectedLabels,
      expectedLabels,
      firstOrSecondAttempt: attemptsForQuestion === 0 ? 1 : 2
    }];
    attemptsForQuestion += 1;
    pointsForQuestion = Math.max(10, pointsForQuestion - 5);

    // Après la première erreur, le joueur peut réessayer sans voir la solution.
    if (attemptsForQuestion === 1) {
      if (question.progressiveHints.length > visibleHintCount) visibleHintCount += 1;
      selectedOptionIds = [];
      feedbackKind = 'retry';
      feedbackTitle = 'Pas encore. Tu peux faire une deuxième tentative.';
      feedbackDetails = 'Relis les indices, puis compare les figures une par une. La solution ne sera affichée qu’après la deuxième tentative.';
      void scrollFeedbackIntoView();
      return;
    }

    locked = true;
    feedbackKind = 'solution';
    feedbackTitle = 'Voici comment raisonner.';
    feedbackDetails = `Réponse attendue : ${expectedLabels.join(', ')}. ${question.explanation}`;
    void scrollFeedbackIntoView();
  }

  async function scrollFeedbackIntoView(): Promise<void> {
    // Sur iPad et petits écrans, place la correction dans la zone visible.
    await tick();
    feedbackPanelElement?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  }

  function nextQuestion(): void {
    if (!locked) return;
    questionIndex += 1;
    loadQuestion();
  }

  function backToSelection(): void {
    // Aucune progression de partie n'est enregistrée : retour immédiat et clair.
    question = null;
    phase = 'config';
    selectedOptionIds = [];
    showHelp = false;
    feedbackKind = '';
    feedbackTitle = '';
    feedbackDetails = '';
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  async function finishMission(): Promise<void> {
    phase = 'done';
    question = null;
    if (resultSubmitted || submittingResult) return;
    resultSubmitted = true;
    submittingResult = true;
    try {
      // Conserve le contrat d'intégration ORBIS du composant précédent.
      await submitActivityResult({
        studentName,
        world: 'geometrie',
        mission: `${level} mode ${mode}`,
        score: correctCount,
        total: QUESTION_COUNT,
        scoreBasis: 'last',
        errorCount: QUESTION_COUNT - correctCount,
        errorFamilies,
        metadata: { xp, firstTryCorrectCount, attemptedErrors: errorFamilies.length, level, mode }
      });
      resultSubmissionMessage = 'Résultat transmis à ORBIS.';
    } catch (error) {
      // Le bilan reste disponible même si le service de résultat est indisponible.
      console.error('Impossible de transmettre le résultat de géométrie à ORBIS.', error);
      resultSubmissionMessage = 'Le bilan est affiché, mais ORBIS n’a pas pu recevoir le résultat.';
    } finally {
      submittingResult = false;
    }
  }

  function readInstructions(): void {
    if (!question || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question.text);
    utterance.lang = 'fr-CH';
    const visibleHints = question.progressiveHints.slice(0, visibleHintCount);
    if (visibleHints.length) utterance.text += ` Indice. ${visibleHints.join(' ')}`;
    utterance.text += ` Propositions : ${question.options.map((option) => option.label).join(', ')}.`;
    if (question.type === 'multiple') utterance.text += ' Plusieurs réponses sont attendues.';
    window.speechSynthesis.speak(utterance);
  }

  async function openHelp(): Promise<void> {
    showHelp = true;
    // Place le focus dans la fenêtre pour que l'usage au clavier soit immédiat.
    await tick();
    helpCloseButton?.focus();
  }

  function closeHelp(): void {
    showHelp = false;
    helpOpenButton?.focus();
  }

  function onWindowKeydown(event: KeyboardEvent): void {
    if (!showHelp) return;
    if (event.key === 'Escape') {
      closeHelp();
      return;
    }
    // Conserve la navigation Tab à l'intérieur de la fenêtre d'aide.
    if (event.key === 'Tab') {
      const dialog = document.querySelector<HTMLElement>('.reference-modal');
      const focusables = Array.from(dialog?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }
</script>

<!-- Les vues de configuration, de jeu, d’aide et de bilan suivent la phase active. -->
<svelte:window on:keydown={onWindowKeydown} />
<svelte:head>
  <title>NEXUS — Division Géométrie</title>
  <meta name="description" content="Défis de géométrie adaptés aux niveaux 6H, 7H et 8H." />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
</svelte:head>

<div class="nexus-page">
  <header class="site-header">
    <a class="brand" href={homeHref} aria-label="Retour à l'accueil ORBIS">
      <span class="brand-mark" aria-hidden="true">N</span>
      <span class="brand-copy">
        <span class="brand-title">NEXUS <span> / DIVISION GÉOMÉTRIE</span></span>
        <span class="brand-subtitle">Espace d’analyse géométrique · {studentName}</span>
      </span>
    </a>
    <div class="header-actions">
      {#if phase === 'play'}
        <button class="button button-quiet" type="button" on:click={backToSelection}>Quitter le dossier</button>
      {/if}
      <a class="button button-quiet" href={catalogHref(base, 'jeux')} use:restoreCatalogReturn={base}>Retour aux jeux</a>
    </div>
  </header>

  <main class="main-content">
    {#if phase === 'config'}
      <section class="intro-block">
        <p class="eyebrow">LABORATOIRE · PLAN & ESPACE</p>
        <h1>Observe. Compare. <span>Déduis.</span></h1>
        <p class="lead">Des enquêtes visuelles pour comprendre les propriétés des figures, pas seulement mémoriser leur apparence.</p>
      </section>

      <section class="panel setup-panel" aria-labelledby="setup-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">01 / PARAMÈTRES DU PARCOURS</p>
            <h2 id="setup-title">Choisis ton niveau</h2>
          </div>
          <span class="step-tag">10 questions par dossier</span>
        </div>

        <div class="level-grid" role="group" aria-label="Niveau scolaire">
          {#each levelChoices as levelChoice}
            <button class="level-card" class:selected={level === levelChoice} aria-pressed={level === levelChoice} type="button" on:click={() => (level = levelChoice)}>
              <span class="level-number">{levelChoice}</span>
              <span class="level-description">{levelChoice === '6H' ? 'Repères et propriétés essentielles' : levelChoice === '7H' ? 'Classer et comparer' : 'Raisonner avec plusieurs propriétés'}</span>
            </button>
          {/each}
        </div>

        <div class="section-heading mode-heading">
          <div>
            <p class="eyebrow">02 / DOSSIER D’ENQUÊTE</p>
            <h2>Choisis une activité</h2>
          </div>
          {#if level}
            <span class="step-tag">{getFiguresForLevel(level).length} figures accessibles</span>
          {/if}
        </div>

        <div class="mode-grid" role="group" aria-label="Type d'activité">
          {#each modeChoices as choice}
            <button class="mode-card" class:selected={mode === choice.id} aria-pressed={mode === choice.id} type="button" on:click={() => (mode = choice.id)}>
              <span class="mode-index">{choice.id === 'Mixte' ? '∞' : `0${['A','B','C','D'].indexOf(choice.id) + 1}`}</span>
              <span class="mode-title">{choice.title}</span>
              <span class="mode-description">{choice.description}</span>
            </button>
          {/each}
        </div>

        <div class="setup-footer">
          <p class="muted-note">Tu peux demander un indice, réessayer après une erreur et lire ou écouter les explications. Aucun chronomètre n’est imposé.</p>
          <button class="button button-primary button-large" disabled={!level || !mode} type="button" on:click={startMission}>Lancer le dossier <span aria-hidden="true">↗</span></button>
        </div>
      </section>

    {:else if phase === 'play'}
      <section class="play-shell" aria-labelledby="question-title">
        {#if question}
        <div class="play-topline">
          <div class="crumbs"><span>GÉOMÉTRIE</span><span aria-hidden="true">/</span><span>{level}</span><span aria-hidden="true">/</span><strong>{modeChoices.find((choice) => choice.id === mode)?.title ?? 'Parcours mixte'}</strong></div>
          <button class="button button-quiet" type="button" bind:this={helpOpenButton} on:click={openHelp}>Fiche de référence</button>
        </div>

        <div class="progress-row">
          <div class="progress-track" role="progressbar" aria-label="Progression du dossier" aria-valuemin="0" aria-valuemax={QUESTION_COUNT} aria-valuenow={questionIndex - 1}>
            <span style={`width: ${progressPercent}%`}></span>
          </div>
          <span class="question-counter">{questionIndex} <span>/ {QUESTION_COUNT}</span></span>
          <span class="xp-counter">✦ {xp} XP</span>
        </div>

        <article class="question-panel" aria-labelledby="question-title">
          <div class="question-copy">
            <p class="eyebrow">DOSSIER {String(questionIndex).padStart(2, '0')} · ANALYSE</p>
            <h1 id="question-title" aria-live="polite">{question.text}</h1>
            {#if question.type === 'multiple'}
              <p class="question-note">Plusieurs réponses possibles. Sélectionne toutes celles qui conviennent, puis vérifie.</p>
            {:else}
              <p class="question-note">Prends le temps d’observer les propriétés avant de choisir.</p>
            {/if}
          </div>

          {#if question.focusFigure}
            <div class="focus-figure-card" aria-label="Figure à classer, sans nom affiché">
              <FigureDrawing figure={question.focusFigure} large={true} showName={false} />
              <span class="figure-caption">FIGURE À CLASSER</span>
            </div>
          {/if}

          {#if question.progressiveHints.length > 0}
            <div class="clue-panel" aria-live="polite">
              <div class="clue-heading"><span class="clue-symbol" aria-hidden="true">⌁</span><span>Indices disponibles</span></div>
              {#each question.progressiveHints.slice(0, visibleHintCount) as hint, index}
                <p class="clue-text"><span>{String(index + 1).padStart(2, '0')}</span>{hint}</p>
              {/each}
              {#if visibleHintCount < question.progressiveHints.length && !locked}
                <button class="text-button" type="button" on:click={revealNextHint}>+ Afficher un indice supplémentaire (−5 XP)</button>
              {/if}
            </div>
          {/if}

          <div class="answer-heading">
            <span>{question.type === 'multiple' ? 'SÉLECTION MULTIPLE' : 'CHOISIS UNE RÉPONSE'}</span>
            <button class="text-button" type="button" on:click={readInstructions}>◖ Écouter la consigne</button>
          </div>

          <div class="answer-grid" class:large-figures={enlargeFigures}>
            {#each question.options as option, index (option.id)}
              <button
                class="answer-card"
                class:selected={selectedOptionIds.includes(option.id)}
                class:correct-answer={locked && question.correctIds.includes(option.id)}
                aria-pressed={selectedOptionIds.includes(option.id)}
                type="button"
                disabled={locked}
                on:click={() => toggleOptionSelection(option.id)}
              >
                <span class="option-number">{String(index + 1).padStart(2, '0')}</span>
                {#if option.figure}
                  <span class="figure-box"><FigureDrawing figure={option.figure} large={enlargeFigures} showName={false} /></span>
                {/if}
                <span class="option-label">{option.label}</span>
                <span class="selection-mark" aria-hidden="true">{selectedOptionIds.includes(option.id) ? '✓' : '+'}</span>
              </button>
            {/each}
          </div>

          <div class="answer-actions">
            <button class="button button-quiet" type="button" on:click={() => (enlargeFigures = !enlargeFigures)} aria-pressed={enlargeFigures}>{enlargeFigures ? 'Taille normale' : 'Agrandir les figures'}</button>
            {#if !locked}
              <button class="button button-primary" type="button" disabled={selectedOptionIds.length === 0} on:click={submitAnswer}>Vérifier ma réponse <span aria-hidden="true">→</span></button>
            {:else}
              <button class="button button-primary" type="button" on:click={nextQuestion}>{questionIndex === QUESTION_COUNT ? 'Voir le bilan' : 'Continuer'} <span aria-hidden="true">→</span></button>
            {/if}
          </div>

          {#if feedbackTitle}
            <div bind:this={feedbackPanelElement} class="feedback-panel" class:feedback-success={feedbackKind === 'success'} class:feedback-retry={feedbackKind === 'retry'} class:feedback-solution={feedbackKind === 'solution'} role="status" aria-live="polite">
              <p class="feedback-eyebrow">{feedbackKind === 'success' ? 'ANALYSE VALIDÉE' : feedbackKind === 'retry' ? 'NOUVELLE TENTATIVE' : 'POINT DE REPÈRE'}</p>
              <h2>{feedbackTitle}</h2>
              <p>{feedbackDetails}</p>
            </div>
          {/if}
        </article>

        {/if}
      </section>
      {#if !question}
        <section class="feedback-panel feedback-solution" role="alert">
          <h2>Impossible de construire cette question.</h2>
          <p>{generationError || 'Le moteur n’a pas fourni de question valide.'}</p>
          <button class="button button-quiet" type="button" on:click={backToSelection}>Retour au choix du dossier</button>
        </section>
      {/if}

    {:else}
      <section class="panel result-panel" aria-labelledby="result-title">
        <p class="eyebrow">RAPPORT DE MISSION · {level}</p>
        <h1 id="result-title">Dossier terminé<span>.</span></h1>
        <p class="lead">Tu as terminé les dix questions. Le bilan distingue les réponses réussies et celles du premier essai.</p>
        <div class="result-stats">
          <div><span class="result-value">{correctCount}<small> / {QUESTION_COUNT}</small></span><span class="result-label">Questions réussies</span></div>
          <div><span class="result-value">{firstTryCorrectCount}<small> / {QUESTION_COUNT}</small></span><span class="result-label">Réussies du premier coup</span></div>
          <div><span class="result-value">{xp}</span><span class="result-label">XP gagnés</span></div>
        </div>
        <div class="result-reflection">
          <h2>Pour continuer à progresser</h2>
          {#if correctCount === QUESTION_COUNT}
            <p>Tu as réussi toutes les questions. Pour approfondir, choisis un autre dossier ou un niveau supérieur avec des propriétés plus complexes.</p>
          {:else if firstTryCorrectCount >= 7}
            <p>Tu reconnais déjà plusieurs propriétés. Reprends les figures sur lesquelles tu as hésité et explique à voix haute ce qui distingue chacune d’elles.</p>
          {:else}
            <p>Revoir les propriétés aide à construire des repères stables. Utilise la fiche de référence, compare les figures et cherche une propriété à la fois.</p>
          {/if}
        </div>
        <p class="submission-message" aria-live="polite">{submittingResult ? 'Transmission du bilan à ORBIS…' : resultSubmissionMessage}</p>
        <div class="result-actions">
          <button class="button button-primary button-large" type="button" on:click={startMission}>Rejouer ce dossier</button>
          <button class="button button-quiet" type="button" on:click={backToSelection}>Changer de niveau ou d’activité</button>
          <a class="button button-quiet" href={catalogHref(base, 'jeux')} use:restoreCatalogReturn={base}>Retour aux jeux</a>
        </div>
      </section>
    {/if}
  </main>

  <footer class="site-footer"><span>NEXUS / GÉOMÉTRIE</span><span>Le raisonnement compte plus que la vitesse.</span></footer>
</div>

{#if showHelp}
  <div class="modal-backdrop" role="presentation">
    <div class="reference-modal" role="dialog" aria-modal="true" aria-labelledby="reference-title">
      <header class="modal-header">
        <div><p class="eyebrow">OUTIL DE RÉFÉRENCE · {level}</p><h2 id="reference-title">Banque de figures</h2></div>
        <button class="close-button" type="button" aria-label="Fermer la fiche de référence" bind:this={helpCloseButton} on:click={closeHelp}>×</button>
      </header>
      <p class="reference-intro">Utilise cette fiche pour observer et comparer. Elle reste disponible pendant le dossier, sans afficher la réponse attendue.</p>
      <h3>Figures planes</h3>
      <div class="reference-grid">
        {#each planeFigures as figure (figure.id)}
          <article class="reference-card"><div class="reference-drawing"><FigureDrawing figure={figure} large={false} showName={true} /></div><h4>{figure.name}</h4><p>{figure.definition}</p></article>
        {/each}
      </div>
      <h3>Solides</h3>
      <div class="reference-grid">
        {#each solidFigures as figure (figure.id)}
          <article class="reference-card"><div class="reference-drawing"><FigureDrawing figure={figure} large={false} showName={true} /></div><h4>{figure.name}</h4><p>{figure.definition}</p></article>
        {/each}
      </div>
      <div class="modal-footer"><button class="button button-primary" type="button" on:click={closeHelp}>Reprendre le dossier</button></div>
    </div>
  </div>
{/if}


<style>
  /* Styles isolés à l’expérience de géométrie. */
  :global(html) { background: #0a0f18; }
  :global(body) { margin: 0; background: #0a0f18; color: #edf3fa; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  :global(button), :global(a) { -webkit-tap-highlight-color: transparent; }
  :global(button:focus-visible), :global(a:focus-visible) { outline: 3px solid #f3b64c; outline-offset: 3px; }
  .nexus-page { min-height: 100vh; color: #edf3fa; background: radial-gradient(ellipse at 85% -15%, rgba(31, 111, 128, .22), transparent 42%), #0a0f18; }
  .site-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem clamp(1rem, 4vw, 3.5rem); border-bottom: 1px solid #263243; background: rgba(10, 15, 24, .94); }
  .brand { display: flex; align-items: center; gap: .85rem; min-width: 0; color: inherit; text-decoration: none; }
  .brand-mark { display: grid; width: 2.8rem; height: 2.8rem; place-items: center; flex: 0 0 auto; border: 1px solid #39c5c8; color: #54e1df; font-weight: 900; font-size: 1.4rem; transform: rotate(45deg); }
  .brand-mark::first-letter { transform: rotate(-45deg); }
  .brand-copy { display: flex; flex-direction: column; gap: .25rem; min-width: 0; }
  .brand-title { font-size: .95rem; letter-spacing: .14em; font-weight: 850; }
  .brand-title span { color: #9baabd; font-weight: 600; font-size: .75rem; letter-spacing: .08em; }
  .brand-subtitle { color: #aab7c8; font-size: .82rem; }
  .header-actions { display: flex; align-items: center; flex-wrap: wrap; justify-content: flex-end; gap: .65rem; }
  .main-content { width: min(1080px, calc(100% - 2rem)); margin: 0 auto; padding: clamp(1.5rem, 4vw, 3.5rem) 0 4rem; }
  .intro-block { max-width: 750px; margin: 0 auto 2rem; }
  .eyebrow { margin: 0 0 .7rem; color: #54d8d5; font-size: .75rem; font-weight: 800; letter-spacing: .16em; }
  h1, h2, h3, h4, p { overflow-wrap: anywhere; }
  h1 { margin: 0; font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.06; letter-spacing: -.04em; }
  h1 span { color: #54d8d5; }
  h2 { margin: 0; font-size: clamp(1.35rem, 2.5vw, 1.8rem); letter-spacing: -.02em; }
  .lead { max-width: 720px; margin: 1rem 0 0; color: #bdc8d6; font-size: 1.05rem; line-height: 1.65; }
  .panel, .question-panel { border: 1px solid #2c394d; border-radius: 1.2rem; background: linear-gradient(140deg, rgba(23, 34, 51, .98), rgba(15, 22, 34, .98)); box-shadow: 0 24px 70px rgba(0,0,0,.18); }
  .setup-panel { padding: clamp(1rem, 3vw, 2rem); }
  .section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
  .step-tag { display: inline-flex; align-items: center; border: 1px solid #3a4a60; border-radius: 999px; padding: .45rem .75rem; color: #b4c3d4; font-size: .82rem; white-space: nowrap; }
  .level-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .8rem; }
  .level-card, .mode-card { min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: .55rem; border: 1px solid #364358; border-radius: .8rem; padding: 1rem; background: #111b2a; color: #eaf2fb; text-align: left; cursor: pointer; transition: border-color .15s ease, background .15s ease, transform .15s ease; }
  .level-card:hover, .mode-card:hover { border-color: #51cdd0; }
  .level-card.selected, .mode-card.selected { border-color: #54d8d5; background: #123239; box-shadow: inset 0 0 0 1px rgba(84,216,213,.16); }
  .level-number { font-size: 1.5rem; font-weight: 900; letter-spacing: -.03em; }
  .level-description, .mode-description { color: #b7c3d3; font-size: .9rem; line-height: 1.45; }
  .mode-heading { margin-top: 2rem; }
  .mode-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .8rem; }
  .mode-index { color: #58d6d4; font-size: .78rem; font-weight: 850; letter-spacing: .12em; }
  .mode-title { font-size: 1.05rem; font-weight: 800; }
  .setup-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #2b394b; }
  .muted-note { max-width: 550px; margin: 0; color: #b4c1d0; font-size: .9rem; line-height: 1.55; }
  .button { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; gap: .6rem; border: 1px solid #3b4a5f; border-radius: .7rem; padding: .7rem 1rem; font: inherit; font-weight: 750; line-height: 1.2; text-decoration: none; cursor: pointer; transition: background .15s ease, border-color .15s ease; }
  .button:disabled { opacity: .45; cursor: not-allowed; }
  .button-quiet { color: #d4deea; background: #121b29; }
  .button-quiet:hover:not(:disabled) { border-color: #5bbec5; background: #172538; }
  .button-primary { border-color: #54d8d5; color: #081519; background: #54d8d5; }
  .button-primary:hover:not(:disabled) { background: #7de8df; border-color: #7de8df; }
  .button-large { min-height: 52px; padding: .9rem 1.3rem; }
  .play-shell { max-width: 950px; margin: 0 auto; }
  .play-topline { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
  .crumbs { display: flex; flex-wrap: wrap; gap: .5rem; color: #9cadbf; font-size: .78rem; letter-spacing: .05em; }
  .crumbs strong { color: #e7eff8; }
  .progress-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.1rem; }
  .progress-track { height: .5rem; flex: 1 1 auto; overflow: hidden; border-radius: 99px; background: #202b3b; }
  .progress-track span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #45c7c8, #a0e7d5); transition: width .2s ease; }
  .question-counter { font-weight: 900; white-space: nowrap; }
  .question-counter span { color: #98a8bb; font-weight: 600; }
  .xp-counter { color: #f2c06a; font-weight: 850; white-space: nowrap; }
  .question-panel { padding: clamp(1rem, 3.3vw, 2rem); }
  .question-copy { max-width: 800px; }
  .question-copy h1 { font-size: clamp(1.6rem, 4vw, 2.5rem); line-height: 1.18; letter-spacing: -.03em; }
  .question-note { margin: .8rem 0 0; color: #b8c5d4; font-size: 1rem; line-height: 1.55; }
  .focus-figure-card { display: flex; flex-direction: column; align-items: center; gap: .75rem; margin: 1.3rem 0; padding: 1rem; border: 1px solid #314155; border-radius: .9rem; background: #0c1420; }
  .figure-caption { color: #9fafc0; font-size: .72rem; font-weight: 800; letter-spacing: .13em; }
  .clue-panel { margin-top: 1.4rem; padding: 1rem 1.1rem; border: 1px solid #31515a; border-radius: .85rem; background: rgba(18, 53, 60, .35); }
  .clue-heading { display: flex; align-items: center; gap: .55rem; color: #77e0d9; font-size: .76rem; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
  .clue-symbol { font-size: 1.25rem; }
  .clue-text { display: flex; gap: .75rem; margin: .8rem 0 0; color: #eef5fa; font-size: 1rem; line-height: 1.5; }
  .clue-text > span { color: #64d9d3; font-size: .75rem; font-weight: 900; padding-top: .2rem; }
  .text-button { min-height: 44px; border: 0; padding: .3rem 0; color: #73dedb; background: transparent; font: inherit; font-size: .9rem; font-weight: 750; text-align: left; cursor: pointer; text-decoration: underline; text-underline-offset: .2em; }
  .clue-panel .text-button { margin-top: .6rem; }
  .answer-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: 1.6rem 0 .75rem; color: #9aabbf; font-size: .75rem; font-weight: 850; letter-spacing: .13em; }
  .answer-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .8rem; }
  .answer-card { position: relative; display: grid; grid-template-columns: auto 1fr auto; grid-template-rows: auto 1fr; align-items: center; justify-items: center; gap: .7rem .8rem; min-width: 0; min-height: 170px; border: 1px solid #354357; border-radius: .9rem; padding: 1rem; color: #eaf2fb; background: #111b2a; text-align: center; font: inherit; cursor: pointer; transition: border-color .15s ease, background .15s ease; }
  .answer-card:hover:not(:disabled) { border-color: #58d6d4; background: #162637; }
  .answer-card.selected { border-color: #54d8d5; background: #11333a; box-shadow: inset 0 0 0 1px rgba(84,216,213,.22); }
  .answer-card.correct-answer { border-color: #84d3ac; background: #123629; }
  .answer-card:disabled { cursor: default; }
  .option-number { justify-self: start; color: #8296ab; font-size: .75rem; font-weight: 800; }
  .figure-box { grid-column: 1 / -1; display: grid; place-items: center; width: 100%; min-height: 86px; }
  .figure-box :global(svg) { width: 100%; height: 88px; max-width: 140px; color: #69d9d7; overflow: visible; }
  .option-label { grid-column: 1 / 3; width: 100%; font-size: 1rem; line-height: 1.35; font-weight: 800; }
  .selection-mark { grid-column: 3; grid-row: 2; display: grid; place-items: center; width: 1.75rem; height: 1.75rem; border: 1px solid #4a5b70; border-radius: 50%; color: #c7d4e2; font-size: 1rem; }
  .answer-card.selected .selection-mark { border-color: #54d8d5; color: #081519; background: #54d8d5; }
  .large-figures .answer-card { min-height: 220px; }
  .large-figures .figure-box :global(svg) { height: 125px; max-width: 180px; }
  .answer-actions { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: .8rem; margin-top: 1.2rem; }
  .feedback-panel { margin-top: 1.2rem; padding: 1.2rem; border: 1px solid #536277; border-radius: .9rem; background: #121e2d; }
  .feedback-panel h2 { font-size: 1.2rem; }
  .feedback-panel p:last-child { margin-bottom: 0; color: #d3deea; line-height: 1.6; }
  .feedback-eyebrow { margin: 0 0 .45rem; color: #c1cedb; font-size: .72rem; font-weight: 850; letter-spacing: .13em; }
  .feedback-success { border-color: #358b70; background: #102b27; }
  .feedback-success .feedback-eyebrow { color: #7dd8b4; }
  .feedback-retry { border-color: #a66e2c; background: #342716; }
  .feedback-retry .feedback-eyebrow { color: #f0c16e; }
  .feedback-solution { border-color: #4c657f; background: #162334; }
  .result-panel { max-width: 850px; margin: 0 auto; padding: clamp(1.2rem, 4vw, 2.5rem); }
  .result-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .8rem; margin: 2rem 0; }
  .result-stats > div { display: flex; flex-direction: column; gap: .5rem; border: 1px solid #35455a; border-radius: .9rem; padding: 1rem; background: #101927; }
  .result-value { font-size: clamp(1.7rem, 4vw, 2.6rem); font-weight: 900; letter-spacing: -.04em; }
  .result-value small { color: #9aabbe; font-size: .9rem; letter-spacing: 0; }
  .result-label { color: #b8c6d6; font-size: .86rem; line-height: 1.4; }
  .result-reflection { border-left: 3px solid #54d8d5; padding: .2rem 0 .2rem 1rem; }
  .result-reflection h2 { font-size: 1.2rem; }
  .result-reflection p { color: #c2cfdd; line-height: 1.6; }
  .submission-message { min-height: 1.2rem; color: #9eb1c5; font-size: .85rem; }
  .result-actions { display: flex; flex-wrap: wrap; gap: .7rem; margin-top: 1.5rem; }
  .site-footer { display: flex; justify-content: space-between; gap: 1rem; padding: 1.2rem clamp(1rem, 4vw, 3.5rem); border-top: 1px solid #263243; color: #8799ae; font-size: .76rem; }
  .site-footer span:first-child { font-weight: 850; letter-spacing: .13em; }
  .modal-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 1rem; background: rgba(3, 7, 13, .86); }
  .reference-modal { width: min(100%, 1000px); max-height: min(90vh, 900px); overflow: auto; border: 1px solid #40546c; border-radius: 1rem; padding: clamp(1rem, 3vw, 1.6rem); background: #101927; box-shadow: 0 25px 80px rgba(0,0,0,.5); }
  .modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; border-bottom: 1px solid #2f4054; padding-bottom: 1rem; }
  .modal-header h2 { font-size: 1.6rem; }
  .close-button { display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid #45566d; border-radius: .7rem; color: #eef4fa; background: #172235; font-size: 1.8rem; cursor: pointer; }
  .reference-intro { color: #bfccdb; line-height: 1.55; }
  .reference-modal h3 { margin: 1.5rem 0 .8rem; color: #6cddd7; }
  .reference-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: .7rem; }
  .reference-card { min-width: 0; border: 1px solid #314156; border-radius: .8rem; padding: .9rem; background: #0b1420; }
  .reference-drawing { display: grid; place-items: center; min-height: 95px; }
  .reference-drawing :global(svg) { width: 100%; height: 95px; max-width: 150px; color: #64d7d4; }
  .reference-card h4 { margin: .6rem 0 .4rem; font-size: .98rem; }
  .reference-card p { margin: 0; color: #bdc9d8; font-size: .9rem; line-height: 1.5; }
  .modal-footer { display: flex; justify-content: flex-end; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #2f4054; }
  @media (max-width: 680px) {
    .site-header { align-items: flex-start; flex-direction: column; }
    .header-actions { width: 100%; justify-content: flex-start; }
    .brand-title { font-size: .85rem; }
    .brand-title span { display: block; margin-top: .2rem; }
    .section-heading, .setup-footer, .play-topline { align-items: stretch; flex-direction: column; }
    .step-tag { align-self: flex-start; }
    .level-grid { gap: .5rem; }
    .level-card { padding: .75rem; }
    .level-description { font-size: .82rem; }
    .mode-grid { grid-template-columns: minmax(0, 1fr); }
    .answer-grid { grid-template-columns: minmax(0, 1fr); }
    .answer-card { min-height: 145px; }
    .answer-heading { align-items: flex-start; flex-direction: column; gap: .2rem; }
    .progress-row { gap: .55rem; }
    .question-counter, .xp-counter { font-size: .88rem; }
    .result-stats { grid-template-columns: minmax(0, 1fr); }
    .result-actions { align-items: stretch; flex-direction: column; }
    .site-footer { flex-direction: column; }
  }
  @media (max-width: 380px) {
    .level-number { font-size: 1.2rem; }
    .level-description { font-size: .76rem; }
    .question-panel { padding: .85rem; }
    .question-copy h1 { font-size: 1.5rem; }
    .button { padding: .65rem .75rem; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; }
  }
</style>

