<script lang="ts">
  // L’écran gère la séance et le brouillon ; les règles des questions sont dans le moteur dédié.
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { catalogHref, restoreCatalogReturn } from '$lib/orbis/navigation';
  import { getStudentName } from '$lib/orbis/identity/local-student';
  import { recordGameActivity } from '$lib/orbis/tracking/client';
  import { generateDecimalQuestion, type DecimalQuestion } from '$lib/games/calculs/question-engine';

  type Phase = 'setup' | 'play' | 'done';
  let studentName = 'Explorateur';
  let phase: Phase = 'setup';
  let activeLevels: number[] = [1];
  let question = 1;
  let score = 0;
  let current: DecimalQuestion = { left: '12', right: '4.5', operation: '+', answer: 16.5, level: 1 };
  let answerInput = '';
  let feedback = '';
  let blocked = false;
  let sentMessage = '';
  let errorFamilies: string[] = [];
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let drawing = false;

  // Prépare le profil et le canvas quand le navigateur rend la page.
  onMount(() => {
    studentName = getStudentName();
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  });

  // Le canvas sert de feuille de brouillon et conserve ses traits au redimensionnement.
  function setupCanvas() {
    if (!canvas) return;
    const previous = document.createElement('canvas');
    previous.width = canvas.width;
    previous.height = canvas.height;
    previous.getContext('2d')?.drawImage(canvas, 0, 0);

    canvas.width = canvas.clientWidth;
    canvas.height = Math.max(300, canvas.clientHeight);
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.drawImage(previous, 0, 0);
  }

  function pointerPosition(event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function startDraw(event: PointerEvent) {
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    draw(event);
  }

  function stopDraw() {
    drawing = false;
    ctx?.beginPath();
  }

  function draw(event: PointerEvent) {
    if (!drawing || !ctx) return;
    event.preventDefault();
    const pos = pointerPosition(event);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function clearCanvas() {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Le parcours alterne génération de questions, validation et bilan de séance.
  function startMission() {
    if (activeLevels.length === 0) {
      feedback = 'Activation impossible : choisis au moins un niveau.';
      return;
    }

    phase = 'play';
    question = 1;
    score = 0;
    errorFamilies = [];
    nextQuestion();
  }

  // Demande une question au moteur et remet à zéro les champs de la question précédente.
  function nextQuestion() {
    if (question > 10) {
      finishMission();
      return;
    }

    blocked = false;
    feedback = '';
    answerInput = '';
    const next = generateDecimalQuestion(activeLevels);
    if (!next) return;
    current = next;
    clearCanvas();
  }

  // Bloque les doubles clics, compare le résultat et ajoute une erreur au bilan si besoin.
  function validateAnswer() {
    if (blocked || answerInput.trim() === '') return;
    const value = Number(answerInput.replace(',', '.'));
    if (!Number.isFinite(value)) return;

    blocked = true;
    if (Math.abs(value - current.answer) < 0.001) {
      score += 1;
      feedback = '⚡ Analyse correcte ! +1 alignement.';
    } else {
      errorFamilies = [...errorFamilies, `niveau ${current.level}`];
      feedback = `❌ Anomalie détectée. La cible était ${current.answer}.`;
    }

    question += 1;
    window.setTimeout(nextQuestion, 1700);
  }

  // Termine la séance puis tente d’envoyer un bilan sans empêcher le jeu de fonctionner hors ligne.
  async function finishMission() {
    phase = 'done';
    const report = await recordGameActivity({
      studentName,
      gameId: 'calculs',
      activityId: `Niveaux ${activeLevels.join(', ')}`,
      correctCount: score,
      questionCount: 10,
      errorCount: 10 - score,
      errorFamilies: Array.from(new Set(errorFamilies))
    });
    sentMessage = report.message;
  }
</script>

<!-- Affiche le choix des niveaux, la question ou le bilan selon la phase de la séance. -->
<svelte:head>
  <title>Le Calcul Décimal — Classe Numérique</title>
</svelte:head>

<div class="dark-page page">
  <header class="dark-header">
    <div class="header-inner">
      <div class="brand"><span class="brand-icon">⚡</span><div><h1 class="brand-title">Noyau : Calcul Décimal</h1><p class="brand-subtitle">Agent : {studentName}</p></div></div>
      <a class="btn dark" href={catalogHref(base, 'jeux')} use:restoreCatalogReturn={base}>↩ Jeux</a>
    </div>
  </header>

  <main class="main split">
    <section class="stack">
      {#if phase === 'setup'}
        <div class="dark-card stack">
          <h2>🛰️ Configuration des paramètres de vol</h2>
          <p class="muted">Sélectionne un ou plusieurs niveaux de difficulté.</p>
          {#each [1, 2, 3] as level}
            <label class="dark-option" class:selected={activeLevels.includes(level)}>
              <input type="checkbox" bind:group={activeLevels} value={level} />
              <strong>Niveau {level}</strong>
              <span class="muted small">
                {level === 1 ? 'Un nombre entier et un nombre à virgule.' : level === 2 ? 'Deux nombres à une décimale.' : 'Deux nombres à deux décimales.'}
              </span>
            </label>
          {/each}
          {#if feedback}<p class="feedback bad">{feedback}</p>{/if}
          <button class="btn primary" type="button" on:click={startMission}>Enclencher la propulsion 🚀</button>
        </div>
      {:else if phase === 'play'}
        <div class="dark-card stack">
          <div class="mission-top"><span class="badge">Question {Math.min(question, 10)} / 10</span><span class="badge">Score : {score}</span></div>
          <div class="center">
            <p class="kicker">Résous l’opération suivante</p>
            <div style="font-size: 2.7rem; font-weight: 1000; font-family: ui-monospace, monospace; background: #090d16; display: inline-block; padding: 1rem 2rem; border-radius: 1rem; border: 1px solid #25314a;">
              {current.left} {current.operation} {current.right}
            </div>
          </div>
          <label class="label" style="color: #cbd5e1; text-align: center;">
            Saisis ta réponse de précision
            <input class="dark-input" style="text-align: center; font-size: 1.7rem; font-weight: 1000;" bind:value={answerInput} on:keydown={(event) => event.key === 'Enter' && validateAnswer()} inputmode="decimal" placeholder="0.00" />
          </label>
          <button class="btn warn" disabled={blocked} type="button" on:click={validateAnswer}>Soumettre le calcul ⚔️</button>
          <p class:good={feedback.startsWith('⚡')} class:bad={!feedback.startsWith('⚡')} class="feedback">{feedback}</p>
        </div>
      {:else}
        <div class="dark-card stack center">
          <h2>🏁 Mission Terminée !</h2>
          <p class="muted">Votre rapport d’exactitude a été transmis à la console maître.</p>
          <p style="font-size: 3rem; font-weight: 1000; color: var(--amber);">{score} / 10</p>
          <p>{score >= 8 ? '🏆 Victoire éclatante ! Excellents calculs.' : '⚔️ Objectif incomplet. Poursuis l’entraînement.'}</p>
          <p class="muted small">{sentMessage}</p>
          <div class="actions" style="justify-content: center;"><button class="btn primary" type="button" on:click={startMission}>Rejouer</button><a class="btn dark" href={catalogHref(base, 'jeux')} use:restoreCatalogReturn={base}>Retour aux jeux</a></div>
        </div>
      {/if}
    </section>

    <aside class="stack">
      <div class="mission-top"><h3 class="kicker">📝 Ardoise tactique</h3><button class="btn dark" type="button" on:click={clearCanvas}>Effacer ×</button></div>
      <canvas bind:this={canvas} class="canvas-board" on:pointerdown={startDraw} on:pointerup={stopDraw} on:pointerleave={stopDraw} on:pointermove={draw}></canvas>
    </aside>
  </main>
</div>
