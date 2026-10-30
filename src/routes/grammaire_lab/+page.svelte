<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { base } from '$app/paths';
  import { getStudentName } from '$lib/orbis/identity/local-student';
  import { catalogHref, restoreCatalogReturn } from '$lib/orbis/navigation';
  import { coursePaths } from '$lib/orbis/catalog/course-paths';
  import { createGameProgressService } from '$lib/orbis/persistence/game-services';
  import { recordGameActivity } from '$lib/orbis/tracking/client';
  import { CATEGORY_LABELS, GRAMMAR_LEVELS, getGrammarLevel } from '$lib/games/grammaire-lab/curriculum';
  import { GRAMMAR_PROGRESS_VERSION, completeLevel, createInitialProgress, sameSelection, sanitizeProgress, starsForLevel } from '$lib/games/grammaire-lab/engine';
  import type { ActivityStats, GrammarBlock, GrammarChallenge, GrammarProgress } from '$lib/games/grammaire-lab/types';

  type Screen = 'map' | 'lego' | 'summary' | 'tetris';
  type Feedback = 'idle' | 'correct' | 'error' | 'revealed';
  // Temporaire pendant la phase de recette : conserve les vrais scores, mais ouvre tout le parcours.
  const TEST_ALL_LEVELS_UNLOCKED = true;
  let screen: Screen = 'map';
  let selectedLevelId = 1;
  let challengeIndex = 0;
  let selectedIds: string[] = [];
  let feedback: Feedback = 'idle';
  let feedbackMessage = '';
  let attempts = 0;
  let resolved = false;
  let loading = true;
  let studentName = 'Explorateur';
  let progress: GrammarProgress = createInitialProgress();
  let stats: ActivityStats = freshStats();
  let summaryStars = 0;
  let reportStatus: 'idle' | 'sending' | 'saved' | 'local' = 'idle';
  let draggedId = '';
  let largeText = false;
  let reducedMotion = false;
  let showTheory = false;
  let showAnalysis = false;
  let tetrisChallenge: GrammarChallenge | null = null;
  let tetrisRemaining: GrammarBlock[] = [];
  let tetrisPlaced: string[] = [];
  let tetrisTimed = false;
  let tetrisTimeLeft = 60;
  let tetrisSpeed: 'doux' | 'normal' | 'rapide' = 'normal';
  let tetrisMessage = '';
  let tetrisFinished = false;
  let tetrisErrors = 0;
  let tetrisStartedAt = 0;
  let timerId: ReturnType<typeof setInterval> | null = null;

  $: level = getGrammarLevel(selectedLevelId);
  $: current = level.challenges[challengeIndex] ?? level.challenges[0];
  $: selectedBlocks = selectedIds.map((id) => current.blocks.find((block) => block.id === id)).filter(Boolean) as GrammarBlock[];
  $: availableBlocks = current.kind === 'order' ? current.blocks.filter((block) => !selectedIds.includes(block.id)) : current.blocks;
  $: progressPercent = Math.round((progress.completedLevels.length / GRAMMAR_LEVELS.length) * 100);
  $: tetrisUnlocked = TEST_ALL_LEVELS_UNLOCKED || progress.completedLevels.some((id) => getGrammarLevel(id).challenges.some((challenge) => challenge.kind === 'order'));
  $: tetrisExpectedId = tetrisChallenge?.solution[tetrisPlaced.length] ?? '';
  $: tetrisSentence = tetrisPlaced.map((id) => tetrisChallenge?.blocks.find((block) => block.id === id)?.text ?? '').join(' ').replace(/ ([.!?])/g, '$1');
  $: analysisBlocks = current.kind === 'order'
    ? current.solution.map((id) => current.blocks.find((block) => block.id === id)).filter(Boolean) as GrammarBlock[]
    : current.blocks.filter((block) => block.group || block.category !== 'neutral');
  $: analysisSentence = current.context || current.sentence;

  function freshStats(): ActivityStats {
    return { correct: 0, questions: 0, errors: 0, hints: 0, errorFamilies: {}, startedAt: Date.now() };
  }

  onMount(async () => {
    studentName = getStudentName();
    const loaded = await createGameProgressService<GrammarProgress>(studentName, 'grammaire_lab').loadProgress();
    if (loaded.ok && loaded.value) progress = sanitizeProgress(loaded.value.state);
    selectedLevelId = Math.min(14, Math.max(1, progress.unlockedLevel));
    loading = false;
  });
  onDestroy(stopTimer);

  function isUnlocked(levelId: number) { return TEST_ALL_LEVELS_UNLOCKED || levelId <= progress.unlockedLevel; }
  function chooseLevel(levelId: number) {
    if (!isUnlocked(levelId)) return;
    selectedLevelId = levelId; screen = 'map'; showTheory = false;
  }
  function startLego(levelId = selectedLevelId) {
    if (!isUnlocked(levelId)) return;
    selectedLevelId = levelId; challengeIndex = 0; stats = freshStats(); reportStatus = 'idle'; showAnalysis = false; screen = 'lego'; resetChallenge();
  }
  function resetChallenge() {
    selectedIds = []; feedback = 'idle'; feedbackMessage = ''; attempts = 0; resolved = false; draggedId = '';
  }
  function useBlock(blockId: string) {
    if (resolved) return;
    feedback = 'idle'; feedbackMessage = '';
    if (current.kind === 'select') {
      selectedIds = selectedIds.includes(blockId) ? selectedIds.filter((id) => id !== blockId) : [...selectedIds, blockId];
    } else if (!selectedIds.includes(blockId)) selectedIds = [...selectedIds, blockId];
  }
  function removePlaced(blockId: string) {
    if (resolved) return;
    selectedIds = selectedIds.filter((id) => id !== blockId); feedback = 'idle';
  }
  function dragStart(event: DragEvent, blockId: string) {
    if (resolved) return;
    draggedId = blockId; event.dataTransfer?.setData('text/plain', blockId);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }
  function dropAt(event: DragEvent, index: number) {
    event.preventDefault();
    if (resolved) return;
    const blockId = event.dataTransfer?.getData('text/plain') || draggedId;
    if (!blockId) return;
    const next = selectedIds.filter((id) => id !== blockId);
    next.splice(Math.max(0, Math.min(index, next.length)), 0, blockId);
    selectedIds = next; draggedId = ''; feedback = 'idle';
  }
  function checkAnswer() {
    if (resolved || selectedIds.length === 0) return;
    attempts += 1;
    if (sameSelection(current, selectedIds)) {
      resolved = true; feedback = 'correct'; feedbackMessage = current.explanation;
      stats = { ...stats, correct: stats.correct + 1, questions: stats.questions + 1 };
      return;
    }
    const errorFamilies = { ...stats.errorFamilies, [current.errorFamily]: (stats.errorFamilies[current.errorFamily] ?? 0) + 1 };
    stats = { ...stats, errors: stats.errors + 1, errorFamilies };
    feedback = 'error';
    feedbackMessage = attempts >= 2 ? `${current.hint} Tu peux maintenant afficher la correction.` : current.hint;
  }
  function showHint() {
    if (resolved) return;
    stats = { ...stats, hints: stats.hints + 1 }; feedback = 'error'; feedbackMessage = current.hint;
  }
  function revealCorrection() {
    if (resolved) return;
    selectedIds = [...current.solution]; resolved = true; feedback = 'revealed';
    feedbackMessage = `${current.explanation} Observe la construction, puis essaie une nouvelle phrase.`;
    stats = { ...stats, questions: stats.questions + 1 };
  }
  function nextChallenge() {
    if (!resolved) return;
    if (challengeIndex >= level.challenges.length - 1) { void finishLevel(); return; }
    challengeIndex += 1; resetChallenge();
  }
  async function finishLevel() {
    summaryStars = starsForLevel(stats.correct, level.challenges.length, stats.hints);
    progress = completeLevel(progress, level.id, summaryStars, stats.correct, stats.errors);
    await createGameProgressService<GrammarProgress>(studentName, 'grammaire_lab').saveProgress(progress, GRAMMAR_PROGRESS_VERSION);
    reportStatus = 'sending';
    const result = await recordGameActivity({
      studentName, gameId: 'grammaire_lab', activityId: `lego-niveau-${level.id}`, skillId: level.notions[0],
      correctCount: stats.correct, questionCount: level.challenges.length, errorCount: stats.errors,
      errorFamilies: Object.entries(stats.errorFamilies).map(([family, count]) => `${family}:${count}`), hintsUsed: stats.hints,
      durationSeconds: Math.max(1, Math.round((Date.now() - stats.startedAt) / 1000)),
      metadata: { level: level.id, stars: summaryStars, mode: 'lego' }
    });
    reportStatus = result.ok ? (result.synced ? 'saved' : 'local') : 'local'; screen = 'summary';
  }
  function findTetrisChallenge(): GrammarChallenge | null {
    if (TEST_ALL_LEVELS_UNLOCKED) {
      const selectedChallenge = getGrammarLevel(selectedLevelId).challenges.find((item) => item.kind === 'order');
      if (selectedChallenge) return selectedChallenge;
    }
    for (const levelId of [...progress.completedLevels].sort((a, b) => b - a)) {
      const challenge = getGrammarLevel(levelId).challenges.find((item) => item.kind === 'order');
      if (challenge) return challenge;
    }
    return getGrammarLevel(3).challenges.find((item) => item.kind === 'order') ?? null;
  }
  function startTetris() {
    const challenge = findTetrisChallenge();
    if (!challenge) return;
    const distractors = GRAMMAR_LEVELS.flatMap((item) => item.challenges)
      .filter((item) => item.kind === 'order' && item.id !== challenge.id)
      .flatMap((item) => item.blocks)
      .filter((block) => !challenge.blocks.some((target) => target.text === block.text))
      .sort(() => Math.random() - 0.5)
      .slice(0, 8);
    stopTimer(); tetrisChallenge = challenge; tetrisRemaining = [...challenge.blocks, ...distractors].sort(() => Math.random() - 0.5);
    tetrisPlaced = []; tetrisErrors = 0; tetrisFinished = false; tetrisMessage = 'Attrape les blocs dans l’ordre pour construire la phrase.';
    tetrisTimeLeft = 60; tetrisStartedAt = Date.now(); screen = 'tetris';
    if (tetrisTimed) startTimer();
  }
  function startTimer() {
    stopTimer();
    timerId = setInterval(() => {
      tetrisTimeLeft -= 1;
      if (tetrisTimeLeft <= 0) {
        stopTimer(); tetrisFinished = true; tetrisMessage = 'Temps écoulé. Observe le début de ta phrase et recommence à ton rythme.'; void reportTetris(false);
      }
    }, 1000);
  }
  function stopTimer() { if (timerId !== null) { clearInterval(timerId); timerId = null; } }
  function catchTetrisBlock(block: GrammarBlock) {
    if (!tetrisChallenge || tetrisFinished) return;
    if (block.id !== tetrisExpectedId) { tetrisErrors += 1; tetrisMessage = `Ce bloc ne vient pas encore ici. ${tetrisChallenge.hint}`; return; }
    tetrisPlaced = [...tetrisPlaced, block.id]; tetrisRemaining = tetrisRemaining.filter((item) => item.id !== block.id);
    tetrisMessage = 'Bien emboîté ! Cherche le bloc suivant.';
    if (tetrisPlaced.length === tetrisChallenge.solution.length) {
      stopTimer(); tetrisFinished = true; tetrisMessage = `Phrase terminée ! ${tetrisChallenge.explanation}`; void reportTetris(true);
    }
  }
  async function reportTetris(success: boolean) {
    if (!tetrisChallenge) return;
    await recordGameActivity({
      studentName, gameId: 'grammaire_lab', activityId: 'tetris-phrase', skillId: tetrisChallenge.errorFamily,
      correctCount: success ? 1 : 0, questionCount: 1, errorCount: tetrisErrors + (success ? 0 : 1),
      errorFamilies: tetrisErrors ? [tetrisChallenge.errorFamily] : [],
      durationSeconds: Math.max(1, Math.round((Date.now() - tetrisStartedAt) / 1000)), metadata: { mode: 'tetris', timed: tetrisTimed, speed: tetrisSpeed }
    });
  }
  function tetrisDuration(index: number) { const seconds = tetrisSpeed === 'doux' ? 16 : tetrisSpeed === 'rapide' ? 7 : 11; return `${seconds + (index % 3)}s`; }
</script>

<svelte:head>
  <title>L’Atelier des phrases — Orbis</title>
  <meta name="description" content="Un jeu Lego et Tetris pour construire et comprendre les phrases jusqu’à la 8H." />
</svelte:head>

<div class:large-text={largeText} class:reduced-motion={reducedMotion} class="grammar-lab">
  <header class="topbar">
    <div class="brand-block"><span class="eyebrow">ORBIS · FRANÇAIS</span><h1>L’Atelier des phrases</h1><p>Construis, emboîte et comprends les phrases.</p></div>
    <nav aria-label="Navigation de l’activité"><a class="nav-link" href={`${base}${coursePaths.french.grammar}`}>Cours & cahier</a><a class="nav-link" href={catalogHref(base, 'jeux')} use:restoreCatalogReturn={base}>← Arcade</a></nav>
  </header>
  <div class="utility-bar">
    <span class="student-chip">Bâtisseur·euse : <strong>{studentName}</strong></span>
    {#if TEST_ALL_LEVELS_UNLOCKED}<span class="test-chip">MODE TEST · 14 NIVEAUX OUVERTS</span>{/if}
    <div class="accessibility"><label><input type="checkbox" bind:checked={largeText} /> Grand texte</label><label><input type="checkbox" bind:checked={reducedMotion} /> Peu d’animations</label></div>
  </div>

  {#if loading}
    <main class="loading-card" aria-live="polite">Préparation de ton atelier…</main>
  {:else if screen === 'map'}
    <main class="map-layout">
      <section class="journey" aria-labelledby="journey-title">
        <div class="section-head"><div><span class="kicker">PARCOURS COMMUN · 14 NIVEAUX</span><h2 id="journey-title">Ta progression</h2></div><div class="progress-orbit" aria-label={`${progressPercent} % du parcours terminé`}><strong>{progressPercent}%</strong><span>{progress.completedLevels.length}/14</span></div></div>
        <div class="progress-track"><span style={`width:${progressPercent}%`}></span></div>
        <div class="level-grid">
          {#each GRAMMAR_LEVELS as item}
            <button class="level-card" class:selected={selectedLevelId === item.id} class:complete={progress.completedLevels.includes(item.id)} class:locked={!isUnlocked(item.id)} disabled={!isUnlocked(item.id)} on:click={() => chooseLevel(item.id)} aria-label={`Niveau ${item.id}, ${item.title}${!isUnlocked(item.id) ? ', verrouillé' : ''}`}>
              <span class="level-number">{item.id}</span><span class="level-copy"><small>{item.grade}</small><strong>{item.shortTitle}</strong></span>
              {#if progress.completedLevels.includes(item.id)}<span class="mini-stars" aria-label={`${progress.starsByLevel[item.id] ?? 0} étoiles`}>{'★'.repeat(progress.starsByLevel[item.id] ?? 0)}{'☆'.repeat(3 - (progress.starsByLevel[item.id] ?? 0))}</span>{:else if !isUnlocked(item.id)}<span aria-hidden="true">🔒</span>{/if}
            </button>
          {/each}
        </div>
      </section>
      <aside class="mission-panel">
        <span class="level-tag">NIVEAU {level.id} · {level.grade}</span><h2>{level.title}</h2><p class="goal">{level.goal}</p>
        <div class="prerequisite"><strong>Prérequis</strong><span>{level.prerequisite}</span></div>
        <div class="notions" aria-label="Notions du niveau">{#each level.notions as notion}<span>{notion}</span>{/each}</div>
        <button class="theory-toggle" on:click={() => showTheory = !showTheory} aria-expanded={showTheory}>🟢 {showTheory ? 'Masquer le repère' : 'Voir le repère théorique'}</button>
        {#if showTheory}<div class="theory-box">{level.theory}</div>{/if}
        <button class="primary-action" on:click={() => startLego(level.id)}>Jouer en mode Lego <span>→</span></button>
        <button class="tetris-action" disabled={!tetrisUnlocked} on:click={startTetris}>Mode Tetris {tetrisUnlocked ? 'débloqué' : 'après le niveau 3'}</button>
      </aside>
    </main>
  {:else if screen === 'lego'}
    <main class="play-shell">
      <div class="play-topline"><button class="back-button" on:click={() => screen = 'map'}>← Parcours</button><div class="challenge-progress" aria-label={`Exercice ${challengeIndex + 1} sur ${level.challenges.length}`}>{#each level.challenges as _, index}<span class:done={index < challengeIndex} class:current={index === challengeIndex}></span>{/each}</div><span class="score-chip">{stats.correct} réussite{stats.correct > 1 ? 's' : ''}</span></div>
      <section class="workbench" aria-labelledby="challenge-title">
        <div class="challenge-heading"><div><span class="level-tag">NIVEAU {level.id} · MODE LEGO</span><h2 id="challenge-title">{current.prompt}</h2><p class="instruction-note">{current.kind === 'order' ? '1. Clique ou dépose les blocs · 2. Mets-les dans l’ordre · 3. Vérifie.' : '1. Lis la phrase · 2. Sélectionne le ou les blocs demandés · 3. Vérifie.'}</p></div><div class="heading-actions"><button class="analysis-toggle" on:click={() => showAnalysis = !showAnalysis} aria-expanded={showAnalysis}>🔎 {showAnalysis ? 'Cacher l’analyse' : 'Analyser la phrase'}</button><button class="hint-button" on:click={showHint} disabled={resolved}>💡 Indice</button></div></div>
        {#if current.context}<p class="context-sentence">{current.context}</p>{/if}
        {#if showAnalysis}
          <div class="analysis-panel" aria-label="Analyse grammaticale de la phrase">
            <span class="analysis-kicker">PHRASE ÉCRITE · CLASSES GRAMMATICALES</span>
            <p class="written-sentence">{analysisSentence}</p>
            <p class="analysis-help">Les contours regroupent les mots qui vont ensemble. Les étiquettes apparaissent progressivement quand tu les demandes.</p>
            <div class="analysis-pieces">
              {#each analysisBlocks as block, index}
                <span class="analysis-piece" class:analysis-connected-left={index > 0 && Boolean(block.group) && analysisBlocks[index - 1]?.group === block.group} class:analysis-connected-right={index < analysisBlocks.length - 1 && Boolean(block.group) && analysisBlocks[index + 1]?.group === block.group} data-category={block.category}>
                  <strong>{block.text}</strong><small>{CATEGORY_LABELS[block.category]}</small>
                </span>
              {/each}
            </div>
          </div>
        {/if}
        <div class="construction-zone" class:success={feedback === 'correct'} on:dragover={(event) => event.preventDefault()} on:drop={(event) => dropAt(event, selectedIds.length)} aria-label="Zone de construction" role="list">
          {#if selectedBlocks.length === 0}<span class="placeholder">{current.kind === 'order' ? 'Dépose ou clique les blocs ici…' : 'Clique sur ta ou tes réponses…'}</span>{/if}
          {#each selectedBlocks as block, index}
            <span class="drop-slot" on:dragover={(event) => event.preventDefault()} on:drop={(event) => dropAt(event, index)} role="separator"></span>
            <button class="grammar-block placed" class:fused={resolved && Boolean(block.group)} class:connected-left={index > 0 && Boolean(block.group) && selectedBlocks[index - 1]?.group === block.group} class:connected-right={index < selectedBlocks.length - 1 && Boolean(block.group) && selectedBlocks[index + 1]?.group === block.group} data-category={block.category} draggable={!resolved} on:dragstart={(event) => dragStart(event, block.id)} on:click={() => removePlaced(block.id)} title={resolved ? block.text : 'Cliquer pour retirer'}><span>{block.text}</span></button>
          {/each}
          {#if selectedBlocks.length > 0}<span class="drop-slot end-slot" on:dragover={(event) => event.preventDefault()} on:drop={(event) => dropAt(event, selectedIds.length)} role="separator"></span>{/if}
        </div>
        <div class="piece-tray" aria-label="Blocs disponibles">
          {#each availableBlocks as block}
            <button class="grammar-block" class:selected={current.kind === 'select' && selectedIds.includes(block.id)} data-category="neutral" draggable={current.kind === 'order' && !resolved} on:dragstart={(event) => dragStart(event, block.id)} on:click={() => useBlock(block.id)} disabled={resolved}><span>{block.text}</span></button>
          {/each}
        </div>
        {#if feedback !== 'idle'}<div class="feedback" class:good={feedback === 'correct'} class:revealed={feedback === 'revealed'} role="status"><strong>{feedback === 'correct' ? 'Bien construit !' : feedback === 'revealed' ? 'Correction' : 'Observe encore'}</strong><span>{feedbackMessage}</span>{#if feedback === 'revealed'}<span class="answer-line">Réponse : {current.sentence}</span>{/if}</div>{/if}
        <div class="workbench-actions">
          {#if !resolved}<button class="secondary-action" on:click={resetChallenge} disabled={selectedIds.length === 0}>Effacer</button>{#if attempts >= 2}<button class="correction-action" on:click={revealCorrection}>Voir la correction</button>{/if}<button class="primary-action compact" on:click={checkAnswer} disabled={selectedIds.length === 0}>Vérifier</button>
          {:else}<button class="primary-action compact" on:click={nextChallenge}>{challengeIndex === level.challenges.length - 1 ? 'Terminer le niveau' : 'Phrase suivante'} →</button>{/if}
        </div>
      </section>
      <aside class="teacher-tip"><strong>Repère vert :</strong> {level.theory}</aside>
    </main>
  {:else if screen === 'summary'}
    <main class="summary-card"><span class="kicker">NIVEAU {level.id} TERMINÉ</span><div class="big-stars" aria-label={`${summaryStars} étoiles sur 3`}>{'★'.repeat(summaryStars)}{'☆'.repeat(3 - summaryStars)}</div><h2>{summaryStars >= 2 ? 'Construction solide !' : 'La base est posée.'}</h2><p>{stats.correct} réussite{stats.correct > 1 ? 's' : ''} sur {level.challenges.length} · {stats.errors} erreur{stats.errors > 1 ? 's' : ''} · {stats.hints} indice{stats.hints > 1 ? 's' : ''}</p><p class="save-state">{reportStatus === 'saved' ? 'Bilan synchronisé avec Orbis.' : 'Bilan conservé dans Orbis sur cet appareil.'}</p><div class="summary-actions"><button class="secondary-action" on:click={() => startLego(level.id)}>Rejouer</button>{#if level.id < 14 && isUnlocked(level.id + 1)}<button class="primary-action compact" on:click={() => { selectedLevelId = level.id + 1; screen = 'map'; }}>Niveau suivant →</button>{/if}<button class="tetris-action" disabled={!tetrisUnlocked} on:click={startTetris}>{tetrisUnlocked ? 'Défi Tetris' : 'Tetris après le niveau 3'}</button></div></main>
  {:else if screen === 'tetris'}
    <main class="tetris-shell">
      <div class="play-topline tetris-topline"><button class="back-button" on:click={() => { stopTimer(); screen = 'map'; }}>← Parcours</button><div class="tetris-settings"><label><input type="checkbox" bind:checked={tetrisTimed} on:change={startTetris} /> Chronomètre</label><label>Vitesse <select bind:value={tetrisSpeed} on:change={startTetris}><option value="doux">Douce</option><option value="normal">Normale</option><option value="rapide">Rapide</option></select></label></div>{#if tetrisTimed}<span class="timer" class:urgent={tetrisTimeLeft <= 10}>{tetrisTimeLeft}s</span>{/if}</div>
      <section class="tetris-board" aria-labelledby="tetris-title">
        <div class="tetris-copy"><span class="level-tag">DÉFI TETRIS · {tetrisSpeed.toUpperCase()}</span><h2 id="tetris-title">Attrape la phrase</h2><p>{tetrisMessage}</p></div>
        <div class="sky" aria-label="Blocs qui descendent"><div class="grid-lines" aria-hidden="true"></div>{#each tetrisRemaining as block, index (block.id)}<button class="falling-block" data-category={block.category} class:paused={reducedMotion || tetrisFinished} style={`--lane:${index % 4};--duration:${tetrisDuration(index)};--delay:-${index * 1.7}s`} on:click={() => catchTetrisBlock(block)} disabled={tetrisFinished}>{block.text}</button>{/each}{#if tetrisRemaining.length === 0}<div class="confetti-message">PHRASE COMPLÈTE !</div>{/if}</div>
        <div class="tetris-build"><span class="build-label">TA PHRASE</span><div>{tetrisSentence || 'Les blocs capturés s’emboîtent ici…'}</div></div>
        <div class="tetris-footer"><span>{tetrisErrors} erreur{tetrisErrors > 1 ? 's' : ''}</span><button class="secondary-action" on:click={startTetris}>{tetrisFinished ? 'Rejouer' : 'Nouvelle série'}</button></div>
      </section>
    </main>
  {/if}
</div>

<style>
  :global(body){margin:0;background:#f0f4f1}:global(*){box-sizing:border-box}:global(button),:global(select),:global(input){font:inherit}
  .grammar-lab{min-height:100vh;color:#18251f;font:16px/1.5 Inter,ui-sans-serif,system-ui,sans-serif;--green:#14735b;--green-dark:#0c493c;--paper:#fbfcf8;--line:#cbd5ce;--blue:#256f9e}.large-text{font-size:19px}
  .topbar{display:flex;align-items:center;justify-content:space-between;gap:2rem;padding:1.35rem max(1rem,calc((100% - 78rem)/2));background:#102c27;color:white;border-bottom:6px solid #f0a443}.brand-block h1{margin:.12rem 0;font-size:clamp(1.8rem,4vw,3rem);line-height:1;letter-spacing:-.04em}.brand-block p{margin:.4rem 0 0;color:#c9ded6}.eyebrow,.kicker,.level-tag{font:800 .72rem/1.2 ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase}.eyebrow{color:#84d6b7}.topbar nav{display:flex;gap:.65rem;flex-wrap:wrap;justify-content:flex-end}.nav-link{color:white;border:1px solid #527068;padding:.58rem .8rem;text-decoration:none;font-weight:800}.nav-link:hover,.nav-link:focus-visible{background:white;color:#102c27}
  .utility-bar{max-width:78rem;margin:auto;padding:.75rem 1rem;display:flex;justify-content:space-between;align-items:center;gap:1rem;border-bottom:1px solid var(--line)}.student-chip{font-size:.9rem}.test-chip{padding:.3rem .55rem;background:#fff0d8;border:1px solid #da8d29;color:#7a470b;font:800 .68rem/1.2 ui-monospace,monospace;letter-spacing:.08em}.accessibility{display:flex;gap:1rem;flex-wrap:wrap;font-size:.82rem;font-weight:700}.accessibility label,.tetris-settings label{display:flex;gap:.4rem;align-items:center}
  .loading-card,.summary-card{max-width:44rem;margin:5rem auto;padding:3rem;background:white;border:1px solid var(--line);text-align:center;box-shadow:8px 8px 0 #d5dfd8}.map-layout{max-width:78rem;margin:auto;padding:1.5rem 1rem 4rem;display:grid;grid-template-columns:minmax(0,1.55fr) minmax(19rem,.75fr);gap:1.3rem;align-items:start}.journey,.mission-panel,.workbench,.tetris-board{background:var(--paper);border:1px solid var(--line);box-shadow:7px 7px 0 #dbe3dc}.journey{padding:clamp(1rem,3vw,2rem)}.section-head{display:flex;align-items:center;justify-content:space-between;gap:1rem}.section-head h2,.mission-panel h2,.workbench h2,.summary-card h2,.tetris-board h2{margin:.25rem 0;font-size:clamp(1.55rem,3vw,2.35rem);line-height:1.1;letter-spacing:-.035em}.kicker,.level-tag{color:var(--green)}
  .progress-orbit{width:4.6rem;aspect-ratio:1;display:grid;place-content:center;text-align:center;border:6px solid #8fcab2;border-radius:50%;background:white}.progress-orbit strong{font-size:1.05rem}.progress-orbit span{font-size:.7rem;color:#5c6d65}.progress-track{height:.55rem;margin:1.2rem 0 1.5rem;overflow:hidden;background:#dfe7e1}.progress-track span{display:block;height:100%;background:linear-gradient(90deg,var(--green),#efad42);transition:width .4s ease}.level-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem}
  .level-card{min-width:0;display:grid;grid-template-columns:2.5rem minmax(0,1fr) auto;gap:.65rem;align-items:center;padding:.75rem;background:white;border:2px solid #d6ded8;color:#18251f;text-align:left;cursor:pointer}.level-card:hover:not(:disabled),.level-card:focus-visible,.level-card.selected{border-color:var(--green);box-shadow:3px 3px 0 #abd5c2;transform:translate(-1px,-1px)}.level-card.complete{background:#f1faf5}.level-card.locked{opacity:.52;cursor:not-allowed}.level-card:disabled{color:#59665f}.level-number{display:grid;place-items:center;width:2.45rem;height:2.45rem;background:#1a4036;color:white;font-weight:900;clip-path:polygon(12% 0,88% 0,100% 12%,100% 88%,88% 100%,12% 100%,0 88%,0 12%)}.level-card.complete .level-number{background:var(--green)}.level-copy{min-width:0;display:grid}.level-copy small{color:#66756e;font-size:.67rem}.level-copy strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:.9rem}.mini-stars{color:#db851d;font-size:.72rem;white-space:nowrap}
  .mission-panel{position:sticky;top:1rem;padding:1.5rem;border-top:6px solid var(--green)}.mission-panel .goal{color:#42574e;font-size:1.05rem}.prerequisite{display:grid;gap:.2rem;margin:1.2rem 0;padding:.8rem;background:#eef2ee;border-left:4px solid #718079}.prerequisite span{color:#56685f;font-size:.88rem}.notions{display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:1rem}.notions span{padding:.25rem .5rem;border:1px solid #b8c7bf;background:white;font-size:.75rem;font-weight:800}button{border-radius:0}.theory-toggle,.hint-button,.back-button{border:0;background:transparent;color:var(--green-dark);font-weight:900;text-decoration:underline;cursor:pointer}.theory-box,.teacher-tip{margin:.8rem 0;padding:1rem;background:#e6f5e9;border-left:5px solid #3d9860;color:#234f31}
  .primary-action,.tetris-action,.secondary-action,.correction-action{border:0;padding:.82rem 1rem;font-weight:900;cursor:pointer}.primary-action{width:100%;display:flex;justify-content:space-between;gap:1rem;margin-top:1rem;background:var(--green);color:white;box-shadow:4px 4px 0 #083a30}.primary-action:hover:not(:disabled),.primary-action:focus-visible{background:#0e5a47;transform:translate(1px,1px);box-shadow:2px 2px 0 #083a30}.primary-action.compact{width:auto;margin:0;display:inline-flex}.tetris-action{width:100%;margin-top:.65rem;background:#1d2732;color:white;box-shadow:4px 4px 0 #9ca7b1}.tetris-action:disabled{opacity:.45;cursor:not-allowed}.secondary-action{background:#e5ebe7;color:#23382f}.correction-action{background:#fff0dc;color:#8a4b12}
  .play-shell,.tetris-shell{max-width:70rem;margin:auto;padding:1.3rem 1rem 4rem}.play-topline{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:1rem;margin-bottom:1rem}.back-button{justify-self:start}.score-chip,.timer{justify-self:end;padding:.4rem .7rem;background:#dcefe7;color:#165c49;font-weight:900}.timer.urgent{background:#ffe2df;color:#a22b23}.challenge-progress{display:flex;gap:.35rem}.challenge-progress span{width:2.8rem;height:.35rem;background:#ccd7d0}.challenge-progress span.current{background:#ef9c3b}.challenge-progress span.done{background:var(--green)}.workbench{padding:clamp(1rem,4vw,2rem);border-top:7px solid #ef9c3b}.challenge-heading{display:flex;justify-content:space-between;gap:1rem;align-items:start}.heading-actions{display:flex;flex-direction:column;align-items:flex-end;gap:.55rem}.instruction-note{margin:.5rem 0 0;color:#51655b;font-size:.9rem;font-weight:700}.analysis-toggle{border:1px solid #b9c9c0;background:#f1f7f3;color:#155c48;padding:.5rem .7rem;font-weight:900;cursor:pointer}.context-sentence{margin:1rem 0;padding:.9rem;background:#edf4fa;border-left:5px solid var(--blue);font-size:1.1rem;font-weight:800}
  .analysis-panel{margin:1rem 0;padding:1rem;background:#fff8e8;border:2px solid #e7bd72}.analysis-kicker{color:#9b5c12;font:800 .68rem ui-monospace,monospace;letter-spacing:.12em}.written-sentence{margin:.45rem 0;font-size:1.3rem;font-weight:900}.analysis-help{margin:.35rem 0 .9rem;color:#6e5a3a;font-size:.85rem}.analysis-pieces{display:flex;flex-wrap:wrap;gap:.25rem;align-items:stretch}.analysis-piece{display:flex;flex-direction:column;gap:.15rem;padding:.45rem .65rem;border:3px solid #8a9b91;background:#f7faf7}.analysis-piece small{color:#52675b;font:800 .58rem ui-monospace,monospace;letter-spacing:.07em}.analysis-piece.analysis-connected-left{margin-left:-.35rem;border-left-color:transparent;padding-left:.9rem}.analysis-piece.analysis-connected-right{margin-right:-.35rem;border-right-color:transparent;padding-right:.9rem}
  .construction-zone{min-height:9rem;margin:1.5rem 0 1rem;padding:1.25rem;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.35rem;background:#f0f3ef;border:3px dashed #aebdb5}.construction-zone.success{border-color:#48a578;background:#effaf4}.placeholder{color:#7b8b83;font-weight:800;text-align:center}.piece-tray{min-height:6rem;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:.65rem;padding:1rem;background:#18251f}
  .grammar-block{position:relative;min-height:3.7rem;padding:.65rem 1rem;border:2px solid #0b546e;background:#dceef5;color:#103e4e;font-weight:900;cursor:pointer;box-shadow:0 4px 0 #87aab7;touch-action:manipulation}.piece-tray .grammar-block{background:#f5f6f2;color:#17231e;border-color:#c6cec8;box-shadow:0 4px 0 #707c75}.grammar-block.selected{outline:4px solid #ffb34f;outline-offset:3px}.grammar-block.placed{margin:.2rem;border-radius:.3rem}.grammar-block.fused{box-shadow:0 4px 0 #5b8f7a}.grammar-block.connected-left{margin-left:-.42rem;border-left-color:transparent;padding-left:1.35rem;border-top-left-radius:0;border-bottom-left-radius:0}.grammar-block.connected-right{margin-right:-.42rem;border-right-color:transparent;padding-right:1.35rem;border-top-right-radius:0;border-bottom-right-radius:0}
  .grammar-block[data-category="subject"]{background:#dce8ff;border-color:#3869a8;color:#244b80}.grammar-block[data-category="verb"]{background:#ddf4df;border-color:#39864b;color:#236a35}.grammar-block[data-category="determiner"]{background:#fff0c8;border-color:#b4771f;color:#70460c}.grammar-block[data-category="noun"]{background:#ffe2a3;border-color:#a96300;color:#673d00}.grammar-block[data-category="adjective"]{background:#f6daf5;border-color:#9b4e98;color:#733270}.grammar-block[data-category="complement"]{background:#dceef5;border-color:#367b99;color:#17556f}.grammar-block[data-category="place"]{background:#d8f2ee;border-color:#328c7f;color:#17685d}.grammar-block[data-category="time"]{background:#e8e1ff;border-color:#7256ad;color:#57408d}.grammar-block[data-category="manner"]{background:#ffe0d7;border-color:#b65a41;color:#8d3c27}.grammar-block[data-category="pronoun"]{background:#e5ddff;border-color:#7256ad;color:#53398c}.grammar-block[data-category="negation"]{background:#ffd9dc;border-color:#ad3b45;color:#8b2630}.grammar-block[data-category="punctuation"]{background:#ececec;border-color:#656565;color:#333}.grammar-block[data-category="phrase"]{background:#dcf4df;border-color:#39864b;color:#235e31}.grammar-block[data-category="non-phrase"]{background:#ffdfdf;border-color:#ad3b45;color:#842932}
  .drop-slot{width:.4rem;min-height:4rem;border-radius:1rem}.drop-slot:hover{background:#ef9c3b}.end-slot{width:.7rem}.feedback{display:grid;gap:.25rem;margin-top:1rem;padding:1rem;background:#fff1dc;border-left:6px solid #e28c28;color:#713f0c}.feedback.good{background:#e4f6e9;border-color:#3b9c5e;color:#205c34}.feedback.revealed{background:#edf1f5;border-color:#687d91;color:#31495e}.answer-line{font-weight:900}.workbench-actions{display:flex;justify-content:flex-end;gap:.6rem;flex-wrap:wrap;margin-top:1rem}.teacher-tip{margin-top:1rem}.summary-card{border-top:8px solid var(--green)}.big-stars{margin:1rem 0;color:#e39a2d;font-size:3rem;letter-spacing:.15em}.save-state{color:#597067;font-size:.85rem}.summary-actions{display:flex;justify-content:center;gap:.8rem;flex-wrap:wrap}.summary-actions .tetris-action{width:auto;margin:0}
  .tetris-topline{grid-template-columns:auto 1fr auto}.tetris-settings{display:flex;justify-content:center;gap:1rem;flex-wrap:wrap;font-size:.85rem;font-weight:800}.tetris-settings select{padding:.25rem}.tetris-board{overflow:hidden;border-top:7px solid #7551b6}.tetris-copy{padding:1.2rem 1.5rem}.tetris-copy p{margin:.3rem 0;color:#53655c}.sky{position:relative;height:min(54vh,32rem);overflow:hidden;background:linear-gradient(#0e1720,#182d35);border-block:5px solid #314853}.grid-lines{position:absolute;inset:0;background-image:linear-gradient(#fff1 1px,transparent 1px),linear-gradient(90deg,#fff1 1px,transparent 1px);background-size:25% 3.2rem}.falling-block{position:absolute;z-index:2;left:calc(var(--lane) * 25% + 2%);top:-5rem;width:21%;min-height:3.5rem;padding:.55rem .3rem;border:2px solid #f8f8ef;background:#f0a443;color:#17231e;font-size:clamp(.68rem,2vw,.92rem);font-weight:900;box-shadow:0 5px 0 #9f5c15;animation:fall var(--duration) linear var(--delay) infinite;cursor:pointer}.falling-block:nth-of-type(3n){background:#58c29b}.falling-block:nth-of-type(4n){background:#92b6f3}.falling-block.paused{animation-play-state:paused;top:calc(1rem + (var(--lane) * 4rem))}@keyframes fall{from{transform:translateY(-5rem)}to{transform:translateY(38rem)}}.confetti-message{position:absolute;inset:0;display:grid;place-items:center;color:#f5c057;font-size:clamp(1.5rem,5vw,3rem);font-weight:1000;letter-spacing:.08em}.tetris-build{min-height:6.5rem;padding:1rem 1.5rem;background:#f4f0ff;border-bottom:1px solid #d0c4e7}.build-label{display:block;color:#7551b6;font:900 .68rem ui-monospace,monospace;letter-spacing:.14em}.tetris-build div{margin-top:.45rem;font-size:1.2rem;font-weight:900}.tetris-footer{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 1.5rem}
  button:focus-visible,a:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid #f0a443;outline-offset:3px}button:disabled{cursor:not-allowed}.reduced-motion *{scroll-behavior:auto!important;animation-duration:.001ms!important;animation-iteration-count:1!important;transition:none!important}
  @media(max-width:850px){.map-layout{grid-template-columns:1fr}.mission-panel{position:static;grid-row:1}.level-grid{grid-template-columns:1fr 1fr}.topbar{align-items:flex-start}.play-topline{grid-template-columns:1fr auto}.challenge-progress{grid-column:1/-1;grid-row:2;justify-content:center}.score-chip{grid-column:2}.tetris-topline{grid-template-columns:auto auto}.tetris-settings{grid-column:1/-1;grid-row:2}}
  @media(max-width:590px){.topbar,.utility-bar,.challenge-heading{display:block}.topbar nav{justify-content:flex-start;margin-top:1rem}.utility-bar .accessibility{margin-top:.6rem}.test-chip{display:inline-block;margin:.55rem 0}.heading-actions{align-items:flex-start;margin-top:.7rem}.level-grid{grid-template-columns:1fr}.map-layout,.play-shell,.tetris-shell{padding-inline:.65rem}.journey,.mission-panel,.workbench{box-shadow:4px 4px 0 #dbe3dc}.grammar-block{max-width:100%;font-size:.9rem}.falling-block{width:22%;font-size:.62rem;padding:.3rem .15rem}.workbench-actions>*{flex:1}.summary-card{margin:1rem}.play-topline{font-size:.85rem}}
  @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;animation-duration:.001ms!important;animation-iteration-count:1!important;transition:none!important}}
</style>
