<script lang="ts">
  // Gère une séance de multiplication et son bilan ; le moteur tire les questions.
  import { base } from '$app/paths';
  import { catalogHref, restoreCatalogReturn } from '$lib/orbis/navigation';
  import { onMount } from 'svelte';
  import { getStudentName } from '$lib/orbis/identity/local-student';
  import { submitActivityResult } from '$lib/orbis/results/client';
  import { generateMultiplicationQuestion } from '$lib/games/livrets/question-engine';

  type Phase = 'setup' | 'play' | 'done';

  const tables = Array.from({ length: 11 }, (_, index) => index + 2);
  let phase: Phase = 'setup';
  let studentName = 'Explorateur';
  let selectedTables: number[] = [2, 3, 4, 5];
  let question = 1;
  let score = 0;
  let factorA = 2;
  let factorB = 1;
  let expected = 2;
  let typed = '';
  let feedback = '';
  let blocked = false;
  let showDots = false;
  let showTable = false;
  let sentMessage = '';
  let errorFamilies: string[] = [];

  onMount(() => {
    studentName = getStudentName();
  });

  // Le parcours démarre, valide dix questions puis transmet un bilan si le service répond.
  function startMission() {
    if (selectedTables.length === 0) {
      feedback = 'Choisis au moins un livret pour commencer la mission.';
      return;
    }

    phase = 'play';
    question = 1;
    score = 0;
    typed = '';
    feedback = '';
    errorFamilies = [];
    nextQuestion();
  }

  function nextQuestion() {
    if (question > 10) {
      finishMission();
      return;
    }

    blocked = false;
    typed = '';
    feedback = '';
    showDots = false;
    showTable = false;
    const next = generateMultiplicationQuestion(selectedTables);
    if (!next) return;
    ({ factorA, factorB, expected } = next);
  }

  function pressKey(key: string) {
    if (blocked) return;
    if (key === 'C') typed = '';
    else if (typed.length < 3) typed += key;
  }

  function validateAnswer() {
    if (blocked || typed === '') return;
    blocked = true;
    const answer = Number.parseInt(typed, 10);

    if (answer === expected) {
      score += 1;
      feedback = '⚡ Flux intègre ! +1 donnée.';
    } else {
      errorFamilies = [...errorFamilies, `table de ${factorA}`];
      feedback = `🔍 Oups, analyse incomplète. La bonne clé était ${expected}.`;
    }

    question += 1;
    window.setTimeout(nextQuestion, 1600);
  }

  async function finishMission() {
    phase = 'done';
    const report = await submitActivityResult({
      studentName,
      world: 'livrets',
      mission: `Tables ${selectedTables.join(', ')}`,
      score,
      total: 10,
      scoreBasis: 'last',
      errorCount: 10 - score,
      errorFamilies: Array.from(new Set(errorFamilies))
    });
    sentMessage = report.message;
  }
</script>

<!-- La page alterne sélection des livrets, questions avec aides visuelles et résumé. -->
<svelte:head>
  <title>L'Atelier des Livrets — Classe Numérique</title>
</svelte:head>

<div class="dark-page page">
  <header class="dark-header">
    <div class="header-inner">
      <div class="brand">
        <span class="brand-icon">💻</span>
        <div>
          <h1 class="brand-title">Code : Les Livrets</h1>
          <p class="brand-subtitle">Agent : {studentName}</p>
        </div>
      </div>
      <a class="btn dark" href={catalogHref(base, 'jeux')} use:restoreCatalogReturn={base}>↩ Jeux</a>
    </div>
  </header>

  <main class="main" style="max-width: 34rem;">
    {#if phase === 'setup'}
      <section class="dark-card stack center">
        <h2>Sélection des livrets</h2>
        <p class="muted">Coche les tables que tu veux travailler : défi de 10 questions avec aide visuelle.</p>
        <div class="grid" style="grid-template-columns: repeat(3, 1fr);">
          {#each tables as table}
            <label class="dark-option" class:selected={selectedTables.includes(table)}>
              <input type="checkbox" bind:group={selectedTables} value={table} /> L. {table}
            </label>
          {/each}
        </div>
        {#if feedback}<p class="feedback bad">{feedback}</p>{/if}
        <button class="btn primary" type="button" on:click={startMission}>Lancer la Mission 🧭</button>
      </section>
    {:else if phase === 'play'}
      <section class="dark-card stack">
        <div class="mission-top">
          <span class="badge">Calcul {Math.min(question, 10)} / 10</span>
          <span class="badge">Score : {score}</span>
        </div>

        <div class="center">
          <div style="font-size: 3rem; font-weight: 1000; font-family: ui-monospace, monospace; background: #090d16; display: inline-block; padding: 1rem 2rem; border-radius: 1rem; border: 1px solid #25314a;">
            {factorA} · {factorB}
          </div>
          <div style="min-height: 3rem; color: var(--cyan); font-size: 2rem; font-weight: 1000;">{typed}</div>
        </div>

        <div class="grid" style="grid-template-columns: repeat(2, 1fr);">
          <button class="btn dark" type="button" on:click={() => (showDots = !showDots)}>💡 Aide points</button>
          <button class="btn dark" type="button" on:click={() => (showTable = !showTable)}>📋 Table</button>
        </div>

        {#if showDots}
          <div class="dot-grid" style={`grid-template-columns: repeat(${factorA}, auto);`}>
            {#each Array(expected) as _}
              <span class="dot"></span>
            {/each}
          </div>
        {/if}

        {#if showTable}
          <div class="dark-card compact center">
            <strong>Livret de {factorA}</strong>
            <div class="grid" style="grid-template-columns: repeat(2, 1fr); margin-top: 0.75rem; font-family: ui-monospace, monospace;">
              {#each Array.from({ length: 10 }, (_, index) => index + 1) as row}
                <span style:color={row === factorB ? '#fbbf24' : 'inherit'}>{factorA} · {row} = {factorA * row}</span>
              {/each}
            </div>
          </div>
        {/if}

        <div class="keypad">
          {#each ['1','2','3','4','5','6','7','8','9','C','0'] as key}
            <button class="dark-option" type="button" on:click={() => pressKey(key)}>{key === 'C' ? 'Effacer' : key}</button>
          {/each}
          <button class="dark-option selected" type="button" on:click={validateAnswer}>OK</button>
        </div>

        <p class:good={feedback.startsWith('⚡')} class:bad={!feedback.startsWith('⚡')} class="feedback">{feedback}</p>
      </section>
    {:else}
      <section class="dark-card stack center">
        <h2>💻 Matrice décodée avec succès !</h2>
        <p style="font-size: 3rem; font-weight: 1000; color: var(--cyan);">{score} / 10</p>
        <p>{score >= 8 ? '🏆 Maître de la Matrice ! Performance exceptionnelle.' : '⚔️ Flux instable. Revois tes protocoles de calcul.'}</p>
        <p class="muted small">{sentMessage}</p>
        <div class="actions" style="justify-content: center;">
          <button class="btn primary" type="button" on:click={startMission}>Rejouer</button>
          <a class="btn dark" href={catalogHref(base, 'jeux')} use:restoreCatalogReturn={base}>Retour aux jeux</a>
        </div>
      </section>
    {/if}
  </main>
</div>
