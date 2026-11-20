<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { getStudentName } from '$lib/orbis/identity/local-student';
  import { catalogHref, restoreCatalogReturn } from '$lib/orbis/navigation';
  import { createGameProgressService } from '$lib/orbis/persistence/game-services';
  import { recordGameActivity } from '$lib/orbis/tracking/client';
  import type { ResponseDetail } from '$lib/orbis/results/contract';
  import { BAZAR_THEMES, getBazarChallenges, getBazarTheme } from '$lib/games/bazar/curriculum';
  import type { BazarChallenge, BazarLevel, BazarLevelProgress, BazarProgress, BazarThemeId } from '$lib/games/bazar/types';

  type Screen = 'market' | 'play' | 'summary';
  type FeedbackKind = 'idle' | 'error' | 'success' | 'revealed';

  const EMPTY_LEVEL: BazarLevelProgress = { completedThemes: [], bestScores: {} };
  const freshProgress = (): BazarProgress => ({ selectedLevel: 6, levels: {}, updatedAt: new Date().toISOString() });

  let studentName = 'Explorateur';
  let level: BazarLevel = 6;
  let progress = freshProgress();
  let screen: Screen = 'market';
  let activeThemeId: BazarThemeId = 'phrase';
  let challenges: BazarChallenge[] = [];
  let questionIndex = 0;
  let selectedAnswer = '';
  let firstAnswer = '';
  let attempts = 0;
  let hintUsed = false;
  let resolved = false;
  let score = 0;
  let errorFamilies: Record<string, number> = {};
  let responseDetails: ResponseDetail[] = [];
  let startedAt = Date.now();
  let questionStartedAt = Date.now();
  let feedback = '';
  let feedbackKind: FeedbackKind = 'idle';
  let reportMessage = '';
  let finishing = false;
  let largeText = false;

  $: activeTheme = getBazarTheme(activeThemeId);
  $: currentChallenge = challenges[questionIndex];
  $: levelProgress = progress.levels[level] ?? EMPTY_LEVEL;

  onMount(() => {
    studentName = getStudentName();
    void loadProgress();
  });

  async function loadProgress() {
    const loaded = await createGameProgressService<BazarProgress>(studentName, 'bazar').loadProgress();
    if (!loaded.ok || !loaded.value?.state) return;
    const saved = loaded.value.state;
    if (![6, 7, 8].includes(saved.selectedLevel) || !saved.levels) return;
    progress = saved;
    level = saved.selectedLevel;
  }

  function chooseLevel(nextLevel: BazarLevel) {
    level = nextLevel;
    progress = { ...progress, selectedLevel: nextLevel, updatedAt: new Date().toISOString() };
  }

  function startTheme(themeId: BazarThemeId) {
    activeThemeId = themeId;
    challenges = getBazarChallenges(themeId, level);
    questionIndex = 0;
    score = 0;
    errorFamilies = {};
    responseDetails = [];
    startedAt = Date.now();
    reportMessage = '';
    screen = 'play';
    resetQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetQuestion() {
    selectedAnswer = '';
    firstAnswer = '';
    attempts = 0;
    hintUsed = false;
    resolved = false;
    feedback = '';
    feedbackKind = 'idle';
    questionStartedAt = Date.now();
  }

  function showHint() {
    if (resolved || !currentChallenge) return;
    hintUsed = true;
    feedbackKind = 'error';
    feedback = `Indice : ${currentChallenge.hint}`;
  }

  function validateAnswer() {
    if (!currentChallenge || !selectedAnswer || resolved) return;
    attempts += 1;
    if (!firstAnswer) firstAnswer = selectedAnswer;

    if (selectedAnswer === currentChallenge.answer) {
      const autonomous = attempts === 1 && !hintUsed;
      if (autonomous) score += 1;
      resolveChallenge(autonomous, autonomous ? 'success' : 'revealed');
      feedback = autonomous
        ? `Bien vu ! ${currentChallenge.explanation}`
        : `Tu as trouvé. ${currentChallenge.explanation}`;
      return;
    }

    errorFamilies = { ...errorFamilies, [currentChallenge.errorFamily]: (errorFamilies[currentChallenge.errorFamily] ?? 0) + 1 };
    if (attempts < 2) {
      feedbackKind = 'error';
      feedback = `Pas encore. ${currentChallenge.hint}`;
      selectedAnswer = '';
      return;
    }

    resolveChallenge(false, 'revealed');
    feedback = `La réponse attendue était : « ${currentChallenge.answer} ». ${currentChallenge.explanation}`;
  }

  function resolveChallenge(autonomous: boolean, kind: FeedbackKind) {
    if (!currentChallenge) return;
    resolved = true;
    feedbackKind = kind;
    responseDetails = [...responseDetails, {
      questionIndex,
      questionId: currentChallenge.id,
      skillId: currentChallenge.skillId,
      category: activeTheme.title,
      prompt: [currentChallenge.context, currentChallenge.prompt].filter(Boolean).join(' — '),
      response: attempts > 1 ? `${firstAnswer} → ${selectedAnswer}` : selectedAnswer,
      expected: currentChallenge.answer,
      correct: autonomous,
      attempts,
      hintsUsed: hintUsed ? 1 : 0,
      durationSeconds: Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000)),
      ...(autonomous ? {} : { errorFamily: currentChallenge.errorFamily })
    }];
  }

  function nextQuestion() {
    if (!resolved || finishing) return;
    if (questionIndex >= challenges.length - 1) {
      void finishTheme();
      return;
    }
    questionIndex += 1;
    resetQuestion();
  }

  async function finishTheme() {
    if (finishing) return;
    finishing = true;
    const previous = progress.levels[level] ?? EMPTY_LEVEL;
    const completedThemes = previous.completedThemes.includes(activeThemeId)
      ? previous.completedThemes
      : [...previous.completedThemes, activeThemeId];
    const nextLevelProgress: BazarLevelProgress = {
      completedThemes,
      bestScores: { ...previous.bestScores, [activeThemeId]: Math.max(previous.bestScores[activeThemeId] ?? 0, score) }
    };
    progress = {
      selectedLevel: level,
      levels: { ...progress.levels, [level]: nextLevelProgress },
      updatedAt: new Date().toISOString()
    };

    const progressService = createGameProgressService<BazarProgress>(studentName, 'bazar');
    const save = await progressService.saveProgress(progress, 1, {
      label: `Le Bazar ${level}H : ${completedThemes.length}/9 échoppes testées`,
      completed: completedThemes.length,
      total: 9
    });
    const report = await recordGameActivity({
      studentName,
      gameId: 'bazar',
      activityId: `${activeThemeId}-${level}H`,
      skillId: activeThemeId,
      correctCount: score,
      questionCount: challenges.length,
      errorCount: Object.values(errorFamilies).reduce((sum, count) => sum + count, 0),
      errorFamilies: Object.entries(errorFamilies).map(([family, count]) => `${family}:${count}`),
      hintsUsed: responseDetails.reduce((sum, detail) => sum + (detail.hintsUsed ?? 0), 0),
      durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
      responseDetails,
      metadata: { level: `${level}H`, theme: activeTheme.title, prototype: true, scoreBasis: 'premier-essai-sans-indice' }
    });
    reportMessage = (!save.ok ? save.message : report.message) ?? 'Bilan enregistré sur cet appareil.';
    screen = 'summary';
    finishing = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function backToMarket() {
    screen = 'market';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
</script>

<svelte:head>
  <title>Le Bazar — Français 6H à 8H</title>
  <meta name="description" content="Neuf échoppes pour entraîner la compréhension, la langue et l’écriture en 6H, 7H et 8H." />
</svelte:head>

<div class:large-text={largeText} class="bazar-page">
  <header class="market-header">
    <a class="back-link" href={catalogHref(base, 'jeux')} use:restoreCatalogReturn={base}>← Jeux</a>
    <div class="brand-block">
      <span class="brand-mark" aria-hidden="true">🎪</span>
      <div><p class="eyebrow">Français · 6H–8H</p><h1>Le Bazar</h1><p>Neuf échoppes, neuf façons de jouer avec la langue.</p></div>
    </div>
    <button class="text-toggle" type="button" aria-pressed={largeText} on:click={() => largeText = !largeText}>A<span aria-hidden="true">⁺</span> Texte</button>
  </header>

  <main>
    {#if screen === 'market'}
      <section class="welcome" aria-labelledby="welcome-title">
        <div>
          <p class="eyebrow">Bonjour {studentName}</p>
          <h2 id="welcome-title">Choisis ton niveau, puis une échoppe.</h2>
          <p>Chaque test contient 3 petits défis. Tu peux utiliser un indice et recommencer.</p>
        </div>
        <div class="level-picker" role="group" aria-label="Niveau scolaire">
          {#each [6, 7, 8] as value}
            <button type="button" class:active={level === value} aria-pressed={level === value} on:click={() => chooseLevel(value as BazarLevel)}>{value}H</button>
          {/each}
        </div>
      </section>

      <div class="progress-strip" aria-live="polite">
        <span><strong>{levelProgress.completedThemes.length}</strong> / 9 échoppes testées en {level}H</span>
        <div class="progress-track" aria-hidden="true"><span style={`width:${levelProgress.completedThemes.length / 9 * 100}%`}></span></div>
      </div>

      <section class="stall-grid" aria-label="Les neuf thématiques de français">
        {#each BAZAR_THEMES as theme, index}
          <button class="stall" type="button" style={`--accent:${theme.color}`} on:click={() => startTheme(theme.id)}>
            <span class="stall-number">{String(index + 1).padStart(2, '0')}</span>
            <span class="stall-icon" aria-hidden="true">{theme.emoji}</span>
            <span class="stall-name">{theme.stall}</span>
            <strong>{theme.title}</strong>
            <span class="stall-description">{theme.description}</span>
            <span class="stall-footer">
              {#if levelProgress.completedThemes.includes(theme.id)}
                <span class="tested">✓ Testé · meilleur score {levelProgress.bestScores[theme.id] ?? 0}/3</span>
              {:else}
                <span>3 défis</span>
              {/if}
              <span aria-hidden="true">→</span>
            </span>
          </button>
        {/each}
      </section>

      <aside class="teacher-note">
        <span aria-hidden="true">ℹ️</span>
        <p><strong>Prototype de repérage.</strong> Le score compte les réponses justes au premier essai, sans indice. Il ne remplace pas une observation ou une production écrite.</p>
      </aside>
    {:else if screen === 'play' && currentChallenge}
      <section class="play-shell" style={`--accent:${activeTheme.color}`}>
        <nav class="play-nav" aria-label="Progression dans l’échoppe">
          <button type="button" on:click={backToMarket}>← Les échoppes</button>
          <div class="question-dots" aria-label={`Défi ${questionIndex + 1} sur ${challenges.length}`}>
            {#each challenges as _, index}<span class:done={index < questionIndex} class:current={index === questionIndex}></span>{/each}
          </div>
          <span>{level}H</span>
        </nav>

        <article class="challenge-card">
          <header class="challenge-heading">
            <span class="theme-icon" aria-hidden="true">{activeTheme.emoji}</span>
            <div><p>{activeTheme.stall} · Défi {questionIndex + 1}/3</p><h2>{currentChallenge.instruction}</h2></div>
          </header>

          {#if currentChallenge.context}
            <div class="source-text"><span>À observer</span><p>{currentChallenge.context}</p></div>
          {/if}

          <fieldset disabled={resolved}>
            <legend>{currentChallenge.prompt}</legend>
            <div class="answer-list">
              {#each currentChallenge.choices as choice, index}
                <label class:selected={selectedAnswer === choice} class:correct={resolved && choice === currentChallenge.answer} class:wrong={resolved && selectedAnswer === choice && choice !== currentChallenge.answer}>
                  <input type="radio" name={currentChallenge.id} value={choice} bind:group={selectedAnswer} />
                  <span class="choice-letter">{String.fromCharCode(65 + index)}</span>
                  <span>{choice}</span>
                </label>
              {/each}
            </div>
          </fieldset>

          {#if feedback}
            <div class="feedback" class:error={feedbackKind === 'error'} class:success={feedbackKind === 'success'} class:revealed={feedbackKind === 'revealed'} role="status" aria-live="polite">
              <strong>{feedbackKind === 'success' ? 'Réponse autonome' : feedbackKind === 'error' ? 'Un indice pour avancer' : 'Explication'}</strong>
              <p>{feedback}</p>
            </div>
          {/if}

          <div class="challenge-actions">
            {#if !resolved}
              <button class="hint-button" type="button" on:click={showHint}>💡 Voir un indice</button>
              <button class="validate-button" type="button" disabled={!selectedAnswer} on:click={validateAnswer}>Vérifier ma réponse</button>
            {:else}
              <span class="score-now">Score autonome : {score}/{questionIndex + 1}</span>
              <button class="validate-button" type="button" on:click={nextQuestion} disabled={finishing}>{questionIndex === challenges.length - 1 ? (finishing ? 'Enregistrement…' : 'Voir mon bilan') : 'Défi suivant →'}</button>
            {/if}
          </div>
        </article>
      </section>
    {:else if screen === 'summary'}
      <section class="summary-card" style={`--accent:${activeTheme.color}`}>
        <span class="summary-icon" aria-hidden="true">{score === 3 ? '🏆' : score >= 1 ? '🧺' : '🌱'}</span>
        <p class="eyebrow">{activeTheme.stall} · {level}H</p>
        <h2>Échoppe terminée</h2>
        <div class="big-score"><strong>{score}</strong><span>/ 3</span></div>
        <p>{score === 3 ? 'Trois réponses autonomes : très solide pour ce premier essai.' : score >= 1 ? 'Tu as déjà de bons repères. Les explications montrent quoi retravailler.' : 'Ce test a repéré une piste de travail. Tu peux recommencer avec les indices.'}</p>
        <div class="report-status" role="status"><span aria-hidden="true">☁️</span><span>{reportMessage || 'Bilan enregistré.'}</span></div>
        <div class="summary-actions">
          <button type="button" class="secondary-action" on:click={() => startTheme(activeThemeId)}>Rejouer cette échoppe</button>
          <button type="button" class="primary-action" on:click={backToMarket}>Choisir une autre échoppe</button>
        </div>
      </section>
    {/if}
  </main>
</div>

<style>
  :global(body) { background: #f6ead8; }
  .bazar-page { min-height: 100vh; color: #2f2723; background: radial-gradient(circle at 15% 5%, rgba(255,255,255,.8), transparent 28rem), linear-gradient(180deg, #fff8e8 0, #f4e5cf 100%); font-family: Inter, ui-sans-serif, system-ui, sans-serif; line-height: 1.55; }
  .bazar-page.large-text { font-size: 118%; }
  button, a { -webkit-tap-highlight-color: transparent; }
  button:focus-visible, a:focus-visible, input:focus-visible + span { outline: 4px solid #1d4ed8; outline-offset: 3px; }
  .market-header { min-height: 9rem; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 1.5rem; align-items: center; padding: 1.35rem max(1rem, calc((100vw - 74rem) / 2)); color: #fffaf0; background: #6f2638; border-bottom: .65rem solid #e4aa45; box-shadow: 0 8px 25px rgba(72, 30, 24, .17); }
  .back-link, .text-toggle { min-height: 3rem; border: 2px solid rgba(255,255,255,.55); border-radius: .75rem; padding: .65rem .9rem; color: white; background: rgba(45,15,23,.22); font-weight: 850; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
  .text-toggle { cursor: pointer; }
  .brand-block { display: flex; align-items: center; gap: 1rem; }
  .brand-mark { font-size: 3.2rem; filter: drop-shadow(0 4px 0 rgba(0,0,0,.18)); }
  .brand-block h1 { margin: -.15rem 0 0; font: 900 clamp(2rem, 5vw, 3.3rem)/1.05 Georgia, serif; letter-spacing: .01em; }
  .brand-block p { margin: .15rem 0 0; }
  .eyebrow { margin: 0; font-size: .76rem; font-weight: 900; text-transform: uppercase; letter-spacing: .12em; }
  main { width: min(74rem, 100%); margin: 0 auto; padding: clamp(1rem, 3vw, 2.5rem); }
  .welcome { display: flex; gap: 2rem; align-items: end; justify-content: space-between; padding: 1rem 0 1.5rem; }
  .welcome h2 { margin: .35rem 0; font: 850 clamp(1.65rem, 4vw, 2.5rem)/1.18 Georgia, serif; }
  .welcome p { max-width: 52rem; margin: .4rem 0; }
  .level-picker { display: flex; gap: .45rem; flex-shrink: 0; padding: .4rem; background: #e4d0b6; border-radius: 1rem; }
  .level-picker button { min-width: 4.1rem; min-height: 3.2rem; border: 0; border-radius: .75rem; background: transparent; font-weight: 900; text-align: center; }
  .level-picker button.active { color: white; background: #6f2638; box-shadow: 0 4px 0 #4c1726; }
  .progress-strip { display: grid; grid-template-columns: auto minmax(10rem, 1fr); gap: 1rem; align-items: center; margin-bottom: 1.25rem; padding: .8rem 1rem; border: 1px solid #d8c1a4; border-radius: 1rem; background: rgba(255,255,255,.68); }
  .progress-track { height: .75rem; overflow: hidden; border-radius: 1rem; background: #dfd4c4; }
  .progress-track span { display: block; height: 100%; border-radius: inherit; background: #24725f; transition: width .25s ease; }
  .stall-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
  .stall { --accent: #6f2638; position: relative; min-height: 16.5rem; display: flex; flex-direction: column; align-items: flex-start; gap: .55rem; overflow: hidden; padding: 1.2rem; border: 2px solid color-mix(in srgb, var(--accent) 35%, #d8c1a4); border-radius: 1.15rem; color: #2f2723; background: #fffdf7; box-shadow: 0 7px 0 color-mix(in srgb, var(--accent) 20%, #cdb89c), 0 16px 26px rgba(78, 50, 30, .08); cursor: pointer; transition: transform .15s ease, box-shadow .15s ease; }
  .stall::before { content: ''; position: absolute; inset: 0 0 auto; height: .6rem; background: repeating-linear-gradient(90deg, var(--accent) 0 2.4rem, #fff2d8 2.4rem 4.8rem); }
  .stall:hover { transform: translateY(-3px); box-shadow: 0 10px 0 color-mix(in srgb, var(--accent) 20%, #cdb89c), 0 20px 30px rgba(78, 50, 30, .11); }
  .stall-number { position: absolute; top: 1.15rem; right: 1.1rem; color: #7a6d61; font-size: .75rem; font-weight: 900; letter-spacing: .12em; }
  .stall-icon { width: 3.5rem; height: 3.5rem; display: grid; place-items: center; margin-top: .35rem; border-radius: 1rem; font-size: 1.8rem; background: color-mix(in srgb, var(--accent) 12%, #fff); }
  .stall-name { color: var(--accent); font-size: .76rem; font-weight: 900; text-transform: uppercase; letter-spacing: .09em; }
  .stall strong { font: 850 1.3rem/1.18 Georgia, serif; text-align: left; }
  .stall-description { color: #5d524b; font-size: .94rem; text-align: left; }
  .stall-footer { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: .5rem; margin-top: auto; padding-top: .65rem; border-top: 1px dashed #d8cbbb; color: var(--accent); font-size: .82rem; font-weight: 850; text-align: left; }
  .tested { color: #17624f; }
  .teacher-note { display: flex; gap: .75rem; align-items: flex-start; margin-top: 1.4rem; padding: 1rem; border: 1px solid #c8b89f; border-radius: 1rem; background: #f9f1e4; }
  .teacher-note p { margin: 0; }
  .play-shell { max-width: 56rem; margin: 0 auto; }
  .play-nav { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 1rem; margin-bottom: 1rem; }
  .play-nav button { justify-self: start; min-height: 2.8rem; border: 0; background: transparent; font-weight: 850; }
  .play-nav > span { justify-self: end; font-weight: 900; }
  .question-dots { display: flex; gap: .45rem; }
  .question-dots span { width: 1.15rem; height: 1.15rem; border: 2px solid #8e7b67; border-radius: 50%; background: #fff; }
  .question-dots span.done { border-color: #17624f; background: #17624f; }
  .question-dots span.current { border-color: var(--accent); box-shadow: inset 0 0 0 3px #fff; background: var(--accent); }
  .challenge-card { overflow: hidden; border: 2px solid color-mix(in srgb, var(--accent) 28%, #d8c1a4); border-radius: 1.4rem; background: #fffdf8; box-shadow: 0 16px 45px rgba(78,50,30,.12); }
  .challenge-heading { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.4rem; color: white; background: var(--accent); }
  .challenge-heading p { margin: 0 0 .2rem; font-size: .78rem; font-weight: 850; text-transform: uppercase; letter-spacing: .09em; }
  .challenge-heading h2 { margin: 0; font: 850 clamp(1.35rem, 4vw, 1.9rem)/1.2 Georgia, serif; }
  .theme-icon { width: 3.4rem; height: 3.4rem; flex: 0 0 auto; display: grid; place-items: center; border-radius: 1rem; font-size: 1.8rem; background: rgba(255,255,255,.18); }
  .source-text { margin: 1.4rem 1.4rem 0; padding: 1.15rem 1.25rem; border-left: .4rem solid var(--accent); border-radius: 0 .8rem .8rem 0; background: #f5efe5; }
  .source-text span { color: #6c625b; font-size: .72rem; font-weight: 900; text-transform: uppercase; letter-spacing: .1em; }
  .source-text p { margin: .35rem 0 0; font: 650 1.15rem/1.65 Georgia, serif; }
  fieldset { margin: 0; padding: 1.4rem; border: 0; }
  legend { width: 100%; padding: 0 0 1rem; font-size: 1.12rem; font-weight: 850; }
  .answer-list { display: grid; gap: .7rem; }
  .answer-list label { min-height: 3.8rem; display: grid; grid-template-columns: 2.2rem 1fr; gap: .8rem; align-items: center; padding: .75rem 1rem; border: 2px solid #d8cbbb; border-radius: .9rem; background: white; cursor: pointer; font-weight: 700; }
  .answer-list label:hover { border-color: var(--accent); }
  .answer-list label.selected { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 7%, white); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 15%, transparent); }
  .answer-list label.correct { border-color: #177357; background: #e5f6ef; }
  .answer-list label.wrong { border-color: #b83232; background: #fff0ee; }
  .answer-list input { position: absolute; opacity: 0; pointer-events: none; }
  .choice-letter { width: 2.1rem; height: 2.1rem; display: grid; place-items: center; border-radius: .55rem; color: #574b43; background: #eee4d6; font-weight: 900; }
  .feedback { min-height: 0; margin: 0 1.4rem 1.2rem; padding: 1rem; border-left: .35rem solid #6f2638; border-radius: .65rem; text-align: left; background: #f7eee5; }
  .feedback p { margin: .25rem 0 0; }
  .feedback.error { border-color: #a85a12; background: #fff3db; color: #653509; }
  .feedback.success { border-color: #177357; background: #e6f6ef; color: #114d3d; }
  .feedback.revealed { border-color: #285ea8; background: #eaf2ff; color: #173d73; }
  .challenge-actions { min-height: 5.4rem; display: flex; justify-content: space-between; align-items: center; gap: .8rem; padding: 1rem 1.4rem; border-top: 1px solid #e5d8c5; background: #fbf5eb; }
  .hint-button, .validate-button, .primary-action, .secondary-action { min-height: 3rem; border-radius: .8rem; padding: .75rem 1rem; font-weight: 900; text-align: center; }
  .hint-button, .secondary-action { border: 2px solid #bba98f; color: #4c4037; background: white; }
  .validate-button, .primary-action { border: 2px solid var(--accent); color: white; background: var(--accent); }
  .score-now { font-weight: 850; }
  .summary-card { max-width: 42rem; margin: 2rem auto; padding: clamp(1.5rem, 5vw, 3rem); border: 2px solid color-mix(in srgb, var(--accent) 30%, #d8c1a4); border-radius: 1.5rem; background: #fffdf8; box-shadow: 0 18px 50px rgba(78,50,30,.14); text-align: center; }
  .summary-icon { display: block; font-size: 3.8rem; }
  .summary-card h2 { margin: .4rem 0; font: 900 clamp(1.8rem, 5vw, 2.7rem)/1.15 Georgia, serif; }
  .big-score { display: flex; justify-content: center; align-items: baseline; color: var(--accent); }
  .big-score strong { font-size: 5rem; line-height: 1; }
  .big-score span { font-size: 1.5rem; font-weight: 850; }
  .report-status { display: flex; gap: .65rem; align-items: center; justify-content: center; margin: 1.2rem 0; padding: .85rem; border-radius: .8rem; background: #eef4ed; color: #305342; font-size: .88rem; }
  .summary-actions { display: flex; justify-content: center; gap: .75rem; flex-wrap: wrap; }
  @media (max-width: 820px) { .stall-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
  @media (max-width: 620px) {
    .market-header { grid-template-columns: auto 1fr; padding: 1rem; }
    .brand-block { grid-column: 1 / -1; grid-row: 1; }
    .back-link { grid-column: 1; grid-row: 2; }
    .text-toggle { grid-column: 2; grid-row: 2; justify-self: end; }
    .welcome { align-items: stretch; flex-direction: column; gap: .8rem; }
    .level-picker button { flex: 1; }
    .progress-strip { grid-template-columns: 1fr; }
    .stall-grid { grid-template-columns: 1fr; }
    .stall { min-height: 14.5rem; }
    .play-nav { grid-template-columns: 1fr auto; }
    .question-dots { grid-column: 1 / -1; grid-row: 2; justify-self: center; }
    .challenge-heading { align-items: flex-start; }
    .challenge-actions { align-items: stretch; flex-direction: column; }
    .hint-button, .validate-button { width: 100%; }
  }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; } }
</style>
