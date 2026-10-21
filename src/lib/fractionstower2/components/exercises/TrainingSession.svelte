<script lang="ts">
  import { ExerciseGenerator, type Exercise } from '$lib/fractionstower2/engines/ExerciseGenerator';
  import { AudioManager } from '$lib/fractionstower2/audio/AudioManager';
// Déclare les propriétés reçues par le composant et leur type.
let { floorId = 'floor-1', onComplete }: {
  floorId?: string;
  onComplete?: (score: number) => void;
} = $props();
let floorNum = $derived(Number.parseInt(floorId.match(/(\d+)/)?.[1] ?? '1', 10));
let exercises = $state<Exercise[]>([]);
let currentIndex = $state(0);
let userAnswer = $state('');
let attemptsLeft = $state(2);
let feedback = $state('');
let feedbackKind = $state<'success' | 'error'>('error');
let isAnswerChecked = $state(false);
let isCorrect = $state(false);
let score = $state(0);
let sessionCompleted = $state(false);
let showVisualHelp = $state(false);
// Valeur précédente utilisée uniquement pour détecter un changement d'étage.
// Elle n'est pas initialisée depuis la prop afin d'éviter state_referenced_locally.
let lastLoadedFloorId = '';
// Génère une session au montage et chaque fois que l'étage change.
  $effect(() => {
const requestedFloorId = floorId;
    if (requestedFloorId !== lastLoadedFloorId) {
      lastLoadedFloorId = requestedFloorId;
      startSession(requestedFloorId);
    }
  });
let currentEx = $derived(exercises[currentIndex] ?? {
    id: 'loading',
    question: 'Préparation des exercices…',
    correctAnswer: '',
    type: 'input' as const,
    hint: ''
  });

// Pour le découpage de l'étage 3, le bouton d'aide reste visible mais n'affiche pas de méthode.
let noHelpAvailable = $derived(floorNum === 3 && currentEx.type === 'slice_interactive');

let extractedFraction = $derived.by(() => {
// Pour les décimaux, proposer une représentation approximative en dixièmes.
const decimalMatch = currentEx.question.match(/(?:^|\s)(\d+)[,.](\d+)(?!\d)/);
    if (decimalMatch && !currentEx.question.includes('/')) {
const decimalValue = Number(`${decimalMatch[1]}.${decimalMatch[2]}`);
const denominator = 10;
      return {
        num: Math.max(0, Math.min(denominator, Math.round(decimalValue * denominator))),
        den: denominator,
        caption: 'Schéma indicatif : quantité approximée en dixièmes.'
      };
    }
const match = currentEx.question.match(/(\d+)\s*\/\s*(\d+)/);
    if (match) {
const originalNumerator = Number.parseInt(match[1], 10);
const originalDenominator = Number.parseInt(match[2], 10);
      if (originalDenominator > 0) {
const den = Math.min(originalDenominator, 12);
const num = Math.max(0, Math.min(den, Math.round((originalNumerator / originalDenominator) * den)));
        return {
          num,
          den,
          caption: 'Schéma indicatif de la première fraction de la question.'
        };
      }
    }
const numbers = currentEx.question.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
const first = Number.parseInt(numbers[0], 10);
const second = Number.parseInt(numbers[1], 10);
      if (second > 0 && first <= second) {
        return { num: first, den: Math.min(second, 12), caption: 'Schéma indicatif de la quantité.' };
      }
    }
    return { num: 1, den: 4, caption: 'Exemple visuel : une part sur quatre.' };
  });
let passingScore = $derived(Math.ceil(exercises.length * 0.7));
let excellentScore = $derived(Math.ceil(exercises.length * 0.9));
function startSession(sessionFloorId: string = floorId) {
    exercises = ExerciseGenerator.generateSession(sessionFloorId, 10);
    currentIndex = 0;
    userAnswer = '';
    attemptsLeft = 2;
    feedback = '';
    feedbackKind = 'error';
    isAnswerChecked = false;
    isCorrect = false;
    score = 0;
    sessionCompleted = false;
    showVisualHelp = false;
  }
function speakQuestion() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
const utterance = new SpeechSynthesisUtterance(currentEx.question);
    utterance.lang = 'fr-CH';
    window.speechSynthesis.speak(utterance);
  }
function selectQcmOption(option: string) {
    if (isAnswerChecked) return;
    userAnswer = option;
    checkAnswer(option);
  }
function appendToInput(char: string) {
    if (isAnswerChecked) return;
    if (char === '⌫') {
      userAnswer = userAnswer.slice(0, -1);
    } else if (char === 'Effacer') {
      userAnswer = '';
    } else {
      userAnswer += char;
    }
  }
function selectNumberLineTick(tick: number) {
    if (isAnswerChecked) return;
const total = currentEx.interactiveData?.totalParts ?? 1;
    userAnswer = `${tick}/${total}`;
    feedback = '';
  }
/** Construit le secteur SVG d'une part de cercle pour les exercices de découpage. */
function sliceWedgePath(index: number, total: number): string {
  const center = 60;
  const radius = 48;
  const startAngle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  const endAngle = -Math.PI / 2 + ((index + 1) * 2 * Math.PI) / total;
  const startX = center + radius * Math.cos(startAngle);
  const startY = center + radius * Math.sin(startAngle);
  const endX = center + radius * Math.cos(endAngle);
  const endY = center + radius * Math.sin(endAngle);
  const largeArc = (2 * Math.PI) / total > Math.PI ? 1 : 0;
  return `M ${center} ${center} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
}

function normalizeAnswer(value: string): string {
const cleaned = value.trim().toLowerCase().replace(/\s+/g, '');
// La virgule et le point sont tous deux acceptés comme séparateur décimal.
    if (/^-?\d+[.,]\d+$/.test(cleaned)) return cleaned.replace('.', ',');
    return cleaned;
  }
function fractionParts(value: string): { numerator: number; denominator: number } | null {
const match = value.match(/^(-?\d+)\/(-?\d+)$/);
    if (!match) return null;
const numerator = Number.parseInt(match[1], 10);
const denominator = Number.parseInt(match[2], 10);
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
    return { numerator, denominator };
  }
function greatestCommonDivisor(a: number, b: number): number {
let x = Math.abs(a);
let y = Math.abs(b);
    while (y !== 0) {
const remainder = x % y;
      x = y;
      y = remainder;
    }
    return x || 1;
  }
function answersMatch(userValue: string, correctValue: string): boolean {
const normalizedUser = normalizeAnswer(userValue);
const normalizedCorrect = normalizeAnswer(correctValue);
    if (normalizedUser === normalizedCorrect) return true;
// Accepter une virgule ou un point, ainsi que les zéros décimaux non significatifs.
const decimalPattern = /^-?\d+[,.]\d+$/;
    if (decimalPattern.test(userValue.trim()) && decimalPattern.test(correctValue.trim())) {
const userDecimal = Number(userValue.trim().replace(',', '.'));
const correctDecimal = Number(correctValue.trim().replace(',', '.'));
      if (Number.isFinite(userDecimal) && Number.isFinite(correctDecimal) && Math.abs(userDecimal - correctDecimal) < 1e-10) return true;
    }
    if (currentEx.answerMode === 'exact' || currentEx.type !== 'input') return false;
// Pour les saisies de fractions, accepter une fraction de même valeur sauf si le format exact est demandé.
const userFraction = fractionParts(normalizedUser);
const correctFraction = fractionParts(normalizedCorrect);
    if (userFraction && correctFraction) {
      return userFraction.numerator * correctFraction.denominator ===
        correctFraction.numerator * userFraction.denominator;
    }
    return false;
  }
function checkAnswer(answerOverride?: string) {
    if (isAnswerChecked) return;
    if (answerOverride !== undefined) userAnswer = answerOverride;
    if (currentEx.type === 'slice_interactive' && !userAnswer) {
// Le compteur affiche 1 au départ : on vérifie donc la valeur réellement affichée.
      userAnswer = '1';
    }
    if (!userAnswer.trim()) {
      feedback = currentEx.type === 'number_line'
        ? 'Choisis d’abord une graduation sur la droite.'
        : currentEx.type === 'color_interactive'
          ? 'Clique sur une case pour commencer à colorier.'
          : 'Écris ou sélectionne une réponse avant de vérifier.';
      feedbackKind = 'error';
      return;
    }
    if (answersMatch(userAnswer, currentEx.correctAnswer)) {
      isCorrect = true;
      isAnswerChecked = true;
      score += 1;
      feedback = 'Bravo ! C’est la bonne réponse.';
      feedbackKind = 'success';
      if (typeof (AudioManager as any).play === 'function') (AudioManager as any).play('success');
      return;
    }
    isCorrect = false;
    attemptsLeft -= 1;
const isUnsupportedSliceHelp = floorNum === 3 && currentEx.type === 'slice_interactive';
const hint = currentEx.hint || 'Relis la question et vérifie ta méthode.';
    if (attemptsLeft > 0) {
      feedback = isUnsupportedSliceHelp
        ? `Pas tout à fait. Il te reste ${attemptsLeft} essai.`
        : `Pas tout à fait. Piste : ${hint} Il te reste ${attemptsLeft} essai.`;
      feedbackKind = 'error';
    } else {
      isAnswerChecked = true;
      feedback = isUnsupportedSliceHelp
? `Ce n’est pas encore juste. Réponse attendue : ${currentEx.correctAnswer}.`
: `Ce n’est pas encore juste. Piste : ${hint} Réponse attendue : ${currentEx.correctAnswer}.`;
      feedbackKind = 'error';
    }
    if (typeof (AudioManager as any).play === 'function') (AudioManager as any).play('error');
  }
function nextQuestion() {
    if (currentIndex < exercises.length - 1) {
      currentIndex += 1;
      resetCurrentQuestion();
      return;
    }
    sessionCompleted = true;
    if (onComplete) onComplete(score);
  }
function resetCurrentQuestion() {
    userAnswer = '';
    attemptsLeft = 2;
    feedback = '';
    feedbackKind = 'error';
    isAnswerChecked = false;
    isCorrect = false;
    showVisualHelp = false;
  }
function restartSession() {
    startSession();
  }
</script>
<div class="training-container">
  {#if !sessionCompleted}
    <header class="training-header">
      <span class="floor-badge">Étage {floorNum} — Entraînement</span>
      <span class="score-counter">
        Question {exercises.length ? currentIndex + 1 : 0} / {exercises.length} · Score : {score}
      </span>
    </header>
    {#if exercises.length > 0}
      <main class="training-card">
        <div class="question-row">
          <h2>{currentEx.question}</h2>
          <div class="action-buttons-top">
            <button
              type="button"
              class="help-btn"
              onclick={() => (showVisualHelp = !showVisualHelp)}
              aria-expanded={showVisualHelp}
              title="Afficher ou masquer l’aide visuelle"
            >
              💡 Aide
            </button>
            <button type="button" class="speak-btn" onclick={speakQuestion} title="Écouter la question" aria-label="Écouter la question">
              🔊
            </button>
          </div>
        </div>
        {#if showVisualHelp}
          <div class="visual-help-panel">
            {#if noHelpAvailable}
              <p class="help-title">Aucune aide disponible</p>
            {:else if currentEx.type === 'number_line' && currentEx.interactiveData?.totalParts}
              {@const totalParts = currentEx.interactiveData.totalParts}
              <p class="help-title">La droite est partagée en {totalParts} intervalles égaux.</p>
              <div class="number-line-scroll">
                <div class="number-line-visual" style={`min-width: ${Math.max(360, totalParts * 44)}px`}>
                  <div class="number-line-track"></div>
                  {#each Array(totalParts + 1) as _, tick}
                    <button type="button" class="number-line-tick"
                      class:selected={userAnswer === `${tick}/${totalParts}`}
                      style={`left: ${(tick / totalParts) * 100}%`}
                      onclick={() => selectNumberLineTick(tick)} disabled={isAnswerChecked}
                      aria-label={tick === 0 ? 'Zéro' : tick === totalParts ? 'Un' : `Graduation ${tick} sur ${totalParts}`}
                      aria-pressed={userAnswer === `${tick}/${totalParts}`}>
                      <span class="tick-mark"></span>
                      <span class="tick-label">{tick === 0 ? '0' : tick === totalParts ? '1' : `${tick}/${totalParts}`}</span>
                    </button>
                  {/each}
                </div>
              </div>
              <p class="visual-caption">Il y a {totalParts} intervalles égaux entre 0 et 1, donc {totalParts + 1} graduations.</p>
            {:else}
              <p class="help-title">Schéma de compréhension</p>
              <div class="visual-bar-wrapper" aria-label="Schéma en parts égales">
                {#each Array(extractedFraction.den) as _, i}
                  <div class="bar-segment {i < extractedFraction.num ? 'colored' : 'empty'}"><span>{i + 1}</span></div>
                {/each}
              </div>
              <p class="visual-caption">{extractedFraction.caption} {extractedFraction.num} part(s) colorée(s) sur {extractedFraction.den}.</p>
            {/if}
          </div>
        {/if}
        {#if currentEx.type === 'qcm' || currentEx.type === 'comparison'}
          <div class="options-grid">
            {#each currentEx.options ?? [] as option}
              <button
                type="button"
                class="option-btn"
                class:selected={userAnswer === option}
                class:correct_option={isAnswerChecked && userAnswer === currentEx.correctAnswer && userAnswer === option}
                onclick={() => selectQcmOption(option)}
                disabled={isAnswerChecked}
              >
                {option}
              </button>
            {/each}
          </div>
        {/if}
        {#if currentEx.type === 'input' || (currentEx.type === 'number_line' && !currentEx.interactiveData?.totalParts)}
          <div class="input-section">
            <label class="sr-only" for="exercise-answer">Ta réponse</label>
            <input
              id="exercise-answer"
              type="text"
              inputmode="none"
              readonly
              autocomplete="off"
              bind:value={userAnswer}
              placeholder="Ta réponse…"
              onkeydown={(event) => event.key === 'Enter' && checkAnswer()}
              disabled={isAnswerChecked}
              aria-label="Ta réponse"
            />
            <div class="virtual-keypad" aria-label="Pavé numérique">
              {#each ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '/', ',', '.', '⌫', 'Effacer'] as key}
                <button
                  type="button"
                  class="key-btn {key === 'Effacer' ? 'clear-key' : ''}"
                  onclick={() => appendToInput(key)}
                  disabled={isAnswerChecked}
                  aria-label={key === '⌫' ? 'Effacer le dernier caractère' : key === 'Effacer' ? 'Effacer toute la réponse' : key === ',' ? 'Virgule' : key}
                >
                  {key}
                </button>
              {/each}
            </div>
          </div>
        {/if}
        {#if currentEx.type === 'number_line' && currentEx.interactiveData?.totalParts && !showVisualHelp}
          {@const totalParts = currentEx.interactiveData?.totalParts ?? 1}
          <section class="interactive-box number-line-box">
            <p class="instruction-mini">Clique sur la graduation qui correspond à la fraction.</p>
            <div class="number-line-scroll">
              <div class="number-line-visual" style={`min-width: ${Math.max(360, totalParts * 44)}px`}>
                <div class="number-line-track"></div>
                {#each Array(totalParts + 1) as _, tick}
                  <button
                    type="button"
                    class="number-line-tick"
                    class:selected={userAnswer === `${tick}/${totalParts}`}
                    style={`left: ${(tick / totalParts) * 100}%`}
                    onclick={() => selectNumberLineTick(tick)}
                    disabled={isAnswerChecked}
                    aria-label={tick === 0 ? 'Zéro' : tick === totalParts ? 'Un' : `${tick}/${totalParts}`}
                    aria-pressed={userAnswer === `${tick}/${totalParts}`}
                  >
                    <span class="tick-mark"></span>
                    <span class="tick-label">{tick === 0 ? '0' : tick === totalParts ? '1' : `${tick}/${totalParts}`}</span>
                  </button>
                {/each}
              </div>
            </div>
          </section>
        {/if}
        {#if currentEx.type === 'color_interactive'}
          {@const totalParts = currentEx.interactiveData?.totalParts ?? 4}
          {@const coloredCount = userAnswer ? Number.parseInt(userAnswer.split('/')[0], 10) || 0 : 0}
          <section class="interactive-box">
            <p class="instruction-mini">Clique sur une case pour régler le nombre de parts coloriées.</p>
            <div class="visual-bar-wrapper clickable" role="group" aria-label="Choisir le nombre de parts coloriées">
              {#each Array(totalParts) as _, i}
                <button
                  type="button"
                  class="bar-segment-interactive {i < coloredCount ? 'colored' : 'empty'}"
                  onclick={() => {
                    if (isAnswerChecked) return;
const nextCount = coloredCount === i + 1 ? i : i + 1;
                    userAnswer = `${nextCount}/${totalParts}`;
                    feedback = '';
                  }}
                  disabled={isAnswerChecked}
                  aria-label={`Colorier ${i + 1} part(s) sur ${totalParts}`}
                  aria-pressed={i < coloredCount}
                >
                  <span>{i + 1}</span>
                </button>
              {/each}
            </div>
            <p class="visual-caption">Parts coloriées : {coloredCount} / {totalParts}</p>
          </section>
        {/if}
        {#if currentEx.type === 'slice_interactive'}
          {@const sliceCount = Math.max(1, Math.min(12, Number.parseInt(userAnswer || '1', 10) || 1))}
          {@const sliceShape = floorNum === 3 ? currentEx.interactiveData?.visualShape : undefined}
          <section class="interactive-box">
            <p class="instruction-mini">Ajuste le nombre de parts égales avec les boutons + et −.</p>
            {#if sliceShape === 'bar'}
              <div class="slice-bar-visual" role="img" aria-label={`Une unité découpée en ${sliceCount} parts égales`}>
                {#each Array(sliceCount) as _, index}
                  <div class="slice-bar-part" class:alternate={index % 2 === 1}><span>{index + 1}</span></div>
                {/each}
              </div>
            {:else if sliceShape === 'circle'}
              <svg class="slice-circle-visual" viewBox="0 0 120 120" role="img" aria-label={`Un cercle découpé en ${sliceCount} parts égales`}>
                {#if sliceCount === 1}
                  <circle cx="60" cy="60" r="48" class="slice-wedge" />
                {:else}
                  {#each Array(sliceCount) as _, index}
                    <path d={sliceWedgePath(index, sliceCount)} class="slice-wedge" class:alternate={index % 2 === 1} />
                  {/each}
                {/if}
              </svg>
            {/if}
            <div class="slider-row">
              <button
                type="button"
                class="adjust-btn"
                onclick={() => {
                  if (isAnswerChecked) return;
const current = Number.parseInt(userAnswer || '1', 10);
                  if (current > 1) userAnswer = String(current - 1);
                  feedback = '';
                }}
                disabled={isAnswerChecked}
                aria-label="Retirer une part"
              >−</button>
              <span class="slice-counter">{sliceCount} part(s) égale(s)</span>
              <button
                type="button"
                class="adjust-btn"
                onclick={() => {
                  if (isAnswerChecked) return;
const current = Number.parseInt(userAnswer || '1', 10);
                  if (current < 12) userAnswer = String(current + 1);
                  feedback = '';
                }}
                disabled={isAnswerChecked}
                aria-label="Ajouter une part"
              >+</button>
            </div>
          </section>
        {/if}
        <div class="action-row">
          {#if !isAnswerChecked}
            {#if currentEx.type === 'input' || currentEx.type === 'number_line' || currentEx.type === 'color_interactive' || currentEx.type === 'slice_interactive'}
              <button type="button" class="btn-verify" onclick={() => checkAnswer()}>
                Vérifier ma réponse
              </button>
            {/if}
          {:else}
            <button type="button" class="btn-next" onclick={nextQuestion}>
              {currentIndex === exercises.length - 1 ? 'Voir mon score final 🎯' : 'Question suivante →'}
            </button>
          {/if}
        </div>
        {#if feedback}
          <p class="feedback {feedbackKind}" role="status" aria-live="polite">{feedback}</p>
        {/if}
      </main>
      <footer class="training-footer" aria-label="Progression de la session">
        <div class="progress-bar">
          <div class="progress-fill" style={`width: ${((currentIndex + (isAnswerChecked ? 1 : 0)) / exercises.length) * 100}%`}></div>
        </div>
      </footer>
    {:else}
      <main class="training-card loading-card" aria-live="polite">Préparation des exercices…</main>
    {/if}
  {:else}
    <section class="completion-screen {score >= excellentScore ? 'fireworks-bg' : score >= passingScore ? 'confetti-bg' : ''}">
      <h2>Session terminée !</h2>
      <div class="score-display" aria-label={`Score ${score} sur ${exercises.length}`}>
        <span class="score-number">{score} / {exercises.length}</span>
      </div>
      {#if score >= excellentScore}
        <p class="congrats-text">Excellent travail ! Tu maîtrises très bien ces notions.</p>
      {:else if score >= passingScore}
        <p class="congrats-text">Bravo ! Tu as atteint le seuil de réussite de l’entraînement.</p>
      {:else}
        <p class="congrats-text warning">
          Tu as besoin de {passingScore} bonnes réponses sur {exercises.length} pour valider cet entraînement. Relis les pistes et recommence.
        </p>
      {/if}
      <div class="end-actions">
        {#if score < passingScore}
          <button type="button" class="btn-retry" onclick={restartSession}>Recommencer l’entraînement ↻</button>
        {/if}
        <button type="button" class="btn-close" onclick={() => onComplete?.(score)}>
          Fermer et retourner à la tour
        </button>
      </div>
    </section>
  {/if}
</div>
<style>
  .training-container {
    max-width: 760px;
    margin: 0 auto;
    background: #0f172a;
    color: #f8fafc;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: system-ui, sans-serif;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.28);
  }
  .training-header {
    background: #1e293b;
    padding: 1rem 1.25rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    border-bottom: 1px solid #334155;
  }
  .floor-badge { font-weight: 800; color: #7dd3fc; font-size: 0.9rem; }
  .score-counter { font-size: 0.85rem; color: #cbd5e1; text-align: right; }
  .training-card {
    padding: clamp(1rem, 4vw, 2rem);
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .question-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
  h2 { font-size: 1.25rem; margin: 0; color: #f8fafc; line-height: 1.5; overflow-wrap: anywhere; }
  .action-buttons-top { display: flex; gap: 0.5rem; flex-shrink: 0; }
  .help-btn, .speak-btn {
    background: #334155;
    border: 1px solid #64748b;
    color: #f8fafc;
    font-size: 0.95rem;
    padding: 0.55rem 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 750;
  }
  .help-btn:hover, .speak-btn:hover { background: #475569; }
  button:focus-visible, input:focus-visible { outline: 3px solid #fbbf24; outline-offset: 2px; }
  button:disabled { cursor: not-allowed; opacity: 0.65; }
  .visual-help-panel, .interactive-box {
    background: #1e293b;
    border: 2px solid #38bdf8;
    border-radius: 12px;
    padding: 1rem;
    text-align: center;
  }
  .help-title, .instruction-mini { font-size: 0.95rem; font-weight: 800; color: #7dd3fc; margin: 0 0 0.75rem; text-align: left; }
  .visual-bar-wrapper {
    display: flex;
    min-height: 46px;
    border: 2px solid #64748b;
    border-radius: 8px;
    overflow: hidden;
    background: #0f172a;
    margin-bottom: 0.5rem;
  }
  .bar-segment {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 0.85rem;
    border-right: 1px solid #64748b;
  }
  .bar-segment:last-child { border-right: none; }
  .bar-segment.colored { background: #0284c7; color: #fff; }
  .bar-segment.empty { background: #1e293b; color: #cbd5e1; }
  .visual-caption { font-size: 0.85rem; color: #cbd5e1; margin: 0; line-height: 1.45; }
  .options-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
  .option-btn {
    background: #1e293b;
    border: 2px solid #475569;
    color: #fff;
    min-height: 58px;
    padding: 0.8rem;
    font-size: 1rem;
    font-weight: 750;
    border-radius: 12px;
    cursor: pointer;
    overflow-wrap: anywhere;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .option-btn:hover:not(:disabled) { background: #334155; border-color: #7dd3fc; }
  .option-btn.selected { background: #075985; border-color: #7dd3fc; }
  .option-btn.correct_option { background: #166534; border-color: #4ade80; }
  .input-section { display: flex; flex-direction: column; gap: 0.85rem; }
  input[type='text'] {
    box-sizing: border-box;
    width: 100%;
    min-height: 54px;
    padding: 0.75rem 1rem;
    font-size: 1.25rem;
    background: #1e293b;
    border: 2px solid #64748b;
    border-radius: 8px;
    color: #fff;
    text-align: center;
    outline: none;
  }
  input[type='text']:focus { border-color: #38bdf8; }
  .virtual-keypad { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0.4rem; }
  .key-btn {
    background: #334155;
    border: 1px solid #64748b;
    color: #fff;
    min-height: 48px;
    padding: 0.45rem 0.2rem;
    font-size: 1.05rem;
    font-weight: 800;
    border-radius: 7px;
    cursor: pointer;
  }
  .key-btn:hover:not(:disabled) { background: #475569; }
  .key-btn.clear-key { font-size: 0.8rem; }
  .number-line-box { padding-bottom: 1.25rem; }
  .number-line-scroll { overflow-x: auto; padding: 0.25rem 0.25rem 0.5rem; }
  .number-line-visual { box-sizing: border-box; position: relative; height: 112px; margin: 0 auto; }
  .number-line-track { position: absolute; left: 18px; right: 18px; top: 30px; height: 4px; border-radius: 4px; background: #94a3b8; }
  .number-line-tick {
    position: absolute;
    top: 12px;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 0.4rem;
    min-width: 36px;
    padding: 0.15rem 0.05rem;
    background: transparent;
    border: 0;
    color: #f8fafc;
    cursor: pointer;
  }
  .number-line-tick:first-of-type { transform: translateX(-15%); }
  .number-line-tick:last-of-type { transform: translateX(-85%); }
  .tick-mark { display: block; width: 3px; height: 24px; background: #cbd5e1; border-radius: 2px; }
  .tick-label { display: block; font-size: 0.72rem; line-height: 1; white-space: nowrap; color: #cbd5e1; }
  .number-line-tick.selected .tick-mark { width: 5px; background: #fbbf24; height: 30px; }
  .number-line-tick.selected .tick-label { color: #fbbf24; font-weight: 900; }
  .bar-segment-interactive {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 0.9rem;
    border: 0;
    border-right: 1px solid #64748b;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .bar-segment-interactive:last-child { border-right: none; }
  .bar-segment-interactive.colored { background: #0284c7; color: #fff; }
  .bar-segment-interactive.empty { background: #1e293b; color: #cbd5e1; }
  .bar-segment-interactive:hover:not(:disabled) { filter: brightness(1.18); }
  .slider-row { display: flex; align-items: center; justify-content: center; gap: 1.5rem; padding: 0.5rem; }
  .adjust-btn {
    background: #0284c7;
    color: white;
    border: none;
    width: 48px;
    height: 48px;
    font-size: 1.6rem;
    font-weight: 900;
    border-radius: 10px;
    cursor: pointer;
  }
  .adjust-btn:hover:not(:disabled) { background: #0369a1; }
  .slice-counter { min-width: 115px; font-size: 1.15rem; font-weight: 800; color: #f8fafc; }
  .slice-bar-visual { display: flex; width: min(100%, 520px); min-height: 82px; margin: .25rem auto .5rem; overflow: hidden; border: 2px solid #cbd5e1; border-radius: .5rem; background: #0f172a; }
  .slice-bar-part { display: flex; flex: 1 1 0; min-width: 0; align-items: center; justify-content: center; border-right: 2px solid #cbd5e1; background: #155e75; color: #f8fafc; font-weight: 800; }
  .slice-bar-part.alternate { background: #164e63; }
  .slice-bar-part:last-child { border-right: 0; }
  .slice-circle-visual { display: block; width: 176px; height: 176px; max-width: 100%; margin: 0 auto .25rem; }
  .slice-wedge { fill: #155e75; stroke: #cbd5e1; stroke-width: 1.5; }
  .slice-wedge.alternate { fill: #164e63; }
  .action-row { display: flex; justify-content: center; }
  .btn-verify, .btn-next {
    background: #0ea5e9;
    color: white;
    border: none;
    min-height: 50px;
    padding: 0.8rem 1.6rem;
    font-size: 1.05rem;
    font-weight: 850;
    border-radius: 10px;
    cursor: pointer;
  }
  .btn-verify:hover, .btn-next:hover { background: #0284c7; }
  .feedback { font-weight: 750; text-align: left; font-size: 1rem; line-height: 1.55; margin: 0; padding: 0.9rem 1rem; border-radius: 10px; }
  .feedback.success { color: #dcfce7; background: #14532d; border: 1px solid #22c55e; }
  .feedback.error { color: #fee2e2; background: #7f1d1d; border: 1px solid #f87171; }
  .training-footer { background: #1e293b; height: 8px; overflow: hidden; }
  .progress-bar { height: 100%; background: #334155; }
  .progress-fill { height: 100%; background: #38bdf8; transition: width 0.3s ease; }
  .loading-card { text-align: center; min-height: 150px; justify-content: center; color: #cbd5e1; }
  .completion-screen {
    padding: clamp(1.5rem, 5vw, 3rem) 1.25rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    background: linear-gradient(135deg, #0f172a, #1e293b);
  }
  .completion-screen h2 { font-size: 1.65rem; }
  .score-display { font-size: 3rem; font-weight: 900; color: #7dd3fc; background: #1e293b; border: 4px solid #334155; padding: 1rem 2rem; border-radius: 20px; }
  .congrats-text { font-size: 1.1rem; max-width: 520px; line-height: 1.55; margin: 0; }
  .congrats-text.warning { color: #fecaca; }
  .end-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; margin-top: 0.5rem; }
  .btn-retry, .btn-close { min-height: 48px; padding: 0.75rem 1.2rem; font-weight: 850; border: 0; border-radius: 10px; cursor: pointer; }
  .btn-retry { background: #facc15; color: #172033; }
  .btn-close { background: #22c55e; color: #052e16; }
  .confetti-bg { animation: pulse-bg 2s infinite alternate; }
  .fireworks-bg { animation: glow-bg 1.5s infinite alternate; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
  @keyframes pulse-bg { from { background-color: #0f172a; } to { background-color: #142850; } }
  @keyframes glow-bg { from { background-color: #0f172a; box-shadow: inset 0 0 50px rgba(56, 189, 248, 0.2); } to { background-color: #1e1b4b; box-shadow: inset 0 0 80px rgba(234, 179, 8, 0.25); } }
  @media (max-width: 520px) {
    .training-header { align-items: flex-start; flex-direction: column; }
    .score-counter { text-align: left; }
    .question-row { flex-direction: column; }
    .action-buttons-top { align-self: flex-end; }
    .options-grid { grid-template-columns: 1fr; }
    .option-btn { min-height: 50px; }
    .virtual-keypad { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .key-btn { min-height: 45px; }
    .score-display { font-size: 2.4rem; }
  }
</style>
