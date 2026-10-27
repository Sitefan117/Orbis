<script lang="ts">
  import { ExerciseGenerator, type Exercise } from '$lib/games/fractionstower2/engines/ExerciseGenerator';
  import { AudioManager } from '$lib/games/fractionstower2/audio/AudioManager';
  import VisualFractionModel from '$lib/games/fractionstower2/components/fraction/VisualFractionModel.svelte';
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

let extractedFraction = $derived.by(() => {
const fractionMatches = currentEx.question.match(/\d+\s*\/\s*\d+/g) ?? [];
const decimalMatches = currentEx.question.match(/\b\d+[,.]\d{1,3}\b/g) ?? [];
// Un schéma simple représente une seule quantité ; les calculs à deux fractions
// reçoivent plutôt leur piste écrite pour éviter de ne montrer qu'un opérande.
    if (fractionMatches.length + decimalMatches.length > 1) {
      return { num: 0, den: 0, caption: '', hasFraction: false, visualizable: false };
    }
// Les décimaux sont représentés à leur rang exact jusqu'aux millièmes.
const decimalMatch = currentEx.question.match(/(?:^|\s)(\d+)[,.](\d{1,3})(?!\d)/);
    if (decimalMatches.length === 1 && decimalMatch) {
const denominator = 10 ** decimalMatch[2].length;
const numerator = Number(decimalMatch[1]) * denominator + Number(decimalMatch[2]);
      return {
        num: Math.max(0, Math.min(denominator, numerator)),
        den: denominator,
        caption: `Représentation exacte en ${['', 'dixièmes', 'centièmes', 'millièmes'][decimalMatch[2].length]}.`,
        hasFraction: true,
        visualizable: true
      };
    }
const match = currentEx.question.match(/(\d+)\s*\/\s*(\d+)/);
    if (match) {
const originalNumerator = Number.parseInt(match[1], 10);
const originalDenominator = Number.parseInt(match[2], 10);
      if (originalDenominator > 0) {
        return {
          num: originalNumerator,
          den: originalDenominator,
          caption: 'Première fraction de la question.',
          hasFraction: true,
          visualizable: originalDenominator <= 12 || originalDenominator === 100 || originalDenominator === 1000
        };
      }
    }
    return { num: 0, den: 0, caption: '', hasFraction: false, visualizable: false };
  });
let visualHelpExample = $derived.by(() => {
const numerator = currentEx.interactiveData?.targetParts;
const denominator = currentEx.interactiveData?.totalParts;
    if (currentEx.type !== 'visual_select' || !numerator || !denominator) return null;
    return {
      shape: 'bar' as const,
      partWeights: Array(denominator).fill(1),
      shadedParts: Array.from({ length: numerator }, (_, index) => index),
      description: `Exemple : ${numerator} parts coloriées parmi ${denominator} parts égales.`
    };
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
function toggleVisualOption(index: number) {
    if (isAnswerChecked) return;
const selected = new Set(userAnswer ? userAnswer.split(',').map(Number) : []);
    if (selected.has(index)) selected.delete(index);
    else selected.add(index);
    userAnswer = [...selected].sort((a, b) => a - b).join(',');
    feedback = '';
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
    if (!userAnswer.trim()) {
      feedback = currentEx.type === 'number_line'
        ? 'Choisis d’abord une graduation sur la droite.'
        : currentEx.type === 'color_interactive'
          ? 'Clique sur une case pour commencer à colorier.'
          : currentEx.type === 'visual_select'
            ? 'Sélectionne au moins une image, puis vérifie.'
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
const hint = currentEx.hint || 'Relis la question et vérifie ta méthode.';
    if (attemptsLeft > 0) {
      feedback = `Pas tout à fait. Piste : ${hint} Il te reste ${attemptsLeft} essai.`;
      feedbackKind = 'error';
    } else {
      isAnswerChecked = true;
      feedback = `Ce n’est pas encore juste. Piste : ${hint} Réponse attendue : ${currentEx.correctAnswer}.`;
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
            {#if currentEx.type === 'visual_select' && visualHelpExample}
              <p class="help-title">Regarde d’abord le tout : le bas indique combien de parts égales il contient.</p>
              <VisualFractionModel model={visualHelpExample} />
              <p class="visual-caption">Le haut indique combien de parts sont coloriées. Vérifie aussi que les parts ont la même taille.</p>
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
            {:else if extractedFraction.hasFraction && extractedFraction.visualizable}
              <p class="help-title">Schéma de compréhension</p>
              {#if extractedFraction.den === 100}
                <div class="hundred-grid" role="img" aria-label={`${extractedFraction.num} cases coloriées sur 100`}>
                  {#each Array(100) as _, i}
                    <span class="hundred-cell" class:colored={i < extractedFraction.num}></span>
                  {/each}
                </div>
              {:else if extractedFraction.den === 1000}
                {@const digits = String(extractedFraction.num).padStart(3, '0')}
                <div class="place-value-table" role="img" aria-label={`Zéro unité, ${digits[0]} dixième, ${digits[1]} centième et ${digits[2]} millième`}>
                  <div><span>Unités</span><strong>0</strong></div>
                  <div><span>Dixièmes</span><strong>{digits[0]}</strong></div>
                  <div><span>Centièmes</span><strong>{digits[1]}</strong></div>
                  <div><span>Millièmes</span><strong>{digits[2]}</strong></div>
                </div>
              {:else}
                <div class="visual-bar-wrapper" aria-label="Schéma en parts égales">
                  {#each Array(extractedFraction.den) as _, i}
                    <div class="bar-segment {i < extractedFraction.num ? 'colored' : 'empty'}"><span>{i + 1}</span></div>
                  {/each}
                </div>
              {/if}
              <p class="visual-caption">{extractedFraction.caption} {extractedFraction.num} part(s) colorée(s) sur {extractedFraction.den}.</p>
            {:else}
              <p class="help-title">Piste pour cette question</p>
              <p class="visual-caption">{currentEx.hint || 'Repère les informations utiles dans la consigne, puis choisis une opération.'}</p>
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
        {#if currentEx.type === 'visual_select' && currentEx.interactiveData?.visualOptions}
          <section class="interactive-box visual-selection" aria-label="Choix des représentations">
            <p class="instruction-mini">Sélectionne toutes les images qui conviennent, puis vérifie.</p>
            <div class="visual-selection-grid">
              {#each currentEx.interactiveData.visualOptions as model, index}
                {@const selected = userAnswer.split(',').includes(String(index))}
                {@const isExpected = currentEx.correctAnswer.split(',').includes(String(index))}
                <button
                  type="button"
                  class="visual-option"
                  class:selected
                  class:correct_option={isAnswerChecked && isExpected}
                  class:wrong_option={isAnswerChecked && selected && !isExpected}
                  onclick={() => toggleVisualOption(index)}
                  disabled={isAnswerChecked}
                  aria-pressed={selected}
                  aria-label={`Image ${index + 1}. ${model.description}${selected ? ' Sélectionnée.' : ''}`}
                >
                  <span class="visual-option-number">Image {index + 1}</span>
                  <VisualFractionModel model={model} />
                </button>
              {/each}
            </div>
          </section>
        {/if}
        <div class="action-row">
          {#if !isAnswerChecked}
            {#if currentEx.type === 'input' || currentEx.type === 'number_line' || currentEx.type === 'color_interactive' || currentEx.type === 'visual_select'}
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
  .visual-selection-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
  .visual-option { display: grid; align-content: center; gap: .5rem; min-width: 0; padding: .75rem; border: 2px solid var(--fraction-line); border-radius: 12px; background: #fffdf7; cursor: pointer; }
  .visual-option:hover:not(:disabled) { border-color: var(--fraction-training); background: #f1f5e9; }
  .visual-option.selected { border-color: var(--fraction-training); background: #e6f0e2; box-shadow: inset 0 0 0 1px var(--fraction-training); }
  .visual-option.correct_option { border-color: #55865d; background: #e6f0e2; }
  .visual-option.wrong_option { border-color: #aa6550; background: #f7e8df; }
  .visual-option-number { color: var(--fraction-forest); font-size: .82rem; font-weight: 850; text-align: left; }
  .place-value-table { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); max-width: 540px; margin: .5rem auto; overflow: hidden; border: 1px solid var(--fraction-line); border-radius: 9px; background: #fffdf7; }
  .place-value-table > div { display: grid; gap: .35rem; padding: .65rem .35rem; border-right: 1px solid var(--fraction-line); text-align: center; }
  .place-value-table > div:last-child { border-right: 0; }
  .place-value-table span { color: #675b4a; font-size: .72rem; }
  .place-value-table strong { color: var(--fraction-forest); font-size: 1.35rem; }
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
  /* Habillage cohérent avec le cours guidé, le boss et le cahier papier. */
  .training-container { background: var(--fraction-paper); color: var(--fraction-ink); border: 1px solid var(--fraction-line); }
  .training-header { background: var(--fraction-forest); border-color: var(--fraction-gold); }
  .floor-badge { color: #f2d28c; }
  .score-counter { color: #f8eed7; }
  .training-card, .loading-card { color: var(--fraction-ink); }
  h2 { color: var(--fraction-ink); }
  .help-btn, .speak-btn { background: #fffdf7; border-color: var(--fraction-line); color: var(--fraction-ink); }
  .help-btn:hover, .speak-btn:hover { background: #efe4cd; }
  .visual-help-panel, .interactive-box { background: #fffdf7; border-color: color-mix(in srgb, var(--fraction-training) 55%, var(--fraction-line)); }
  .help-title, .instruction-mini { color: var(--fraction-forest); }
  .visual-bar-wrapper { background: #fff; border-color: var(--fraction-line); }
  .bar-segment.colored, .bar-segment-interactive.colored { background: var(--fraction-teal); color: #fff; }
  .bar-segment.empty, .bar-segment-interactive.empty { background: #f0e9dc; color: var(--fraction-ink); }
  .bar-segment { border-color: #d8c7a4; }
  .hundred-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 3px; width: min(100%, 250px); margin: 0 auto .65rem; padding: .55rem; border: 1px solid var(--fraction-line); border-radius: .75rem; background: #f2ead8; }
  .hundred-cell { aspect-ratio: 1; border: 1px solid #d7c8aa; border-radius: 3px; background: #fffdf7; }
  .hundred-cell.colored { border-color: #426e63; background: #668f86; }
  .visual-caption { color: #675b4a; }
  .option-btn { background: #fffdf7; border-color: var(--fraction-line); color: var(--fraction-ink); }
  .option-btn:hover:not(:disabled) { background: #edf3eb; border-color: var(--fraction-training); }
  .option-btn.selected { background: #e0eee3; border-color: var(--fraction-training); color: #294c34; }
  .option-btn.correct_option { background: #e1efdf; border-color: #6f9a70; color: #294c34; }
  input[type='text'] { background: #fff; border-color: var(--fraction-line); color: var(--fraction-ink); }
  input[type='text']:focus { border-color: var(--fraction-training); }
  .key-btn { background: #f0e7d5; border-color: var(--fraction-line); color: var(--fraction-ink); }
  .key-btn:hover:not(:disabled) { background: #e3d5b8; }
  .number-line-track { background: #76664d; }
  .number-line-tick { color: var(--fraction-ink); }
  .tick-mark { background: var(--fraction-forest); }
  .tick-label { color: #5d5142; }
  .number-line-tick.selected .tick-mark { background: var(--fraction-gold); }
  .number-line-tick.selected .tick-label { color: #8a642a; }
  .btn-verify, .btn-next { background: var(--fraction-forest); color: #fff8e8; }
  .btn-verify:hover, .btn-next:hover { background: #243e3a; }
  .feedback.error { color: #743d34; background: #f7e9e2; border-color: #d5a99d; }
  .feedback.success { color: #315a38; background: #e5f0df; border-color: #9abd8e; }
  .training-footer, .progress-bar { background: #e6dcc6; }
  .progress-fill { background: var(--fraction-gold); }
  .completion-screen { color: var(--fraction-ink); background: linear-gradient(135deg, var(--fraction-paper), #edf2e6); }
  .score-display { color: var(--fraction-forest); background: #fffdf7; border-color: var(--fraction-gold); }
  .congrats-text.warning { color: #8a463b; }
  .btn-retry { background: var(--fraction-gold); color: #352b1c; }
  .btn-close { background: var(--fraction-forest); color: #fff8e8; }
  .confetti-bg, .fireworks-bg { animation: none; }
  @media (prefers-reduced-motion: reduce) { .progress-fill { transition: none; } }

  @media (max-width: 520px) {
    .training-header { align-items: flex-start; flex-direction: column; }
    .score-counter { text-align: left; }
    .question-row { flex-direction: column; }
    .action-buttons-top { align-self: flex-end; }
    .options-grid { grid-template-columns: 1fr; }
    .visual-selection-grid { gap: .45rem; }
    .visual-option { padding: .5rem; }
    .place-value-table span { font-size: .62rem; }
    .option-btn { min-height: 50px; }
    .virtual-keypad { grid-template-columns: repeat(5, minmax(0, 1fr)); }
    .key-btn { min-height: 45px; }
    .score-display { font-size: 2.4rem; }
  }
</style>
