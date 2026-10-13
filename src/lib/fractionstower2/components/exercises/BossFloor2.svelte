<script lang="ts">
    /**
     * Boss propre à l'étage 2 : lire, écrire et représenter les fractions.
     * Conserve le principe du boss de référence : 3 phases de 6 questions.
     * Les réponses erronées permettent de réessayer la question en cours.
     */
    import { onMount } from 'svelte';
    import FractionBar from '$lib/fractionstower2/components/fraction/FractionBar.svelte';
    import { AudioManager } from '$lib/fractionstower2/audio/AudioManager';

    type FractionItem = { numerator: number; denominator: number; words: string };
    type BossQuestion =
        | { kind: 'writeFraction'; prompt: string; fraction: FractionItem }
        | { kind: 'chooseRepresentation'; prompt: string; fraction: FractionItem; options: FractionItem[] }
        | { kind: 'writeFromWords'; prompt: string; fraction: FractionItem; words: string }
        | { kind: 'chooseName'; prompt: string; fraction: FractionItem; wordOptions: string[] };

    let { onComplete } = $props<{ onComplete: (score: number) => void }>();

    const FRACTIONS: FractionItem[] = [
        { numerator: 1, denominator: 2, words: 'une moitié' },
        { numerator: 1, denominator: 3, words: 'un tiers' },
        { numerator: 2, denominator: 3, words: 'deux tiers' },
        { numerator: 1, denominator: 4, words: 'un quart' },
        { numerator: 3, denominator: 4, words: 'trois quarts' },
        { numerator: 2, denominator: 5, words: 'deux cinquièmes' },
        { numerator: 3, denominator: 5, words: 'trois cinquièmes' },
        { numerator: 4, denominator: 7, words: 'quatre septièmes' },
        { numerator: 5, denominator: 6, words: 'cinq sixièmes' },
        { numerator: 3, denominator: 9, words: 'trois neuvièmes' }
    ];

    function shuffled<T>(items: T[]): T[] {
        return [...items].sort(() => Math.random() - 0.5);
    }

    function randomFraction(): FractionItem {
        return FRACTIONS[Math.floor(Math.random() * FRACTIONS.length)];
    }

    function sameValue(a: FractionItem, b: FractionItem): boolean {
        return a.numerator * b.denominator === b.numerator * a.denominator;
    }

    function createQuestion(phase: number, index: number): BossQuestion {
        const fraction = randomFraction();

        if (phase === 1) {
            return {
                kind: 'writeFraction',
                prompt: 'Observe la barre. Écris la fraction représentée.',
                fraction
            };
        }

        if (phase === 2) {
            const distractors = shuffled(FRACTIONS.filter((item) => !sameValue(item, fraction))).slice(0, 2);
            return {
                kind: 'chooseRepresentation',
                prompt: `Quelle barre représente « ${fraction.words} » ?`,
                fraction,
                options: shuffled([fraction, ...distractors])
            };
        }

        if (index % 2 === 0) {
            return {
                kind: 'writeFromWords',
                prompt: `Écris en chiffres la fraction « ${fraction.words} ».`,
                fraction,
                words: fraction.words
            };
        }

        const otherWords = shuffled(FRACTIONS.filter((item) => item.words !== fraction.words).map((item) => item.words)).slice(0, 2);
        return {
            kind: 'chooseName',
            prompt: `Comment lit-on la fraction ${fraction.numerator}/${fraction.denominator} ?`,
            fraction,
            wordOptions: shuffled([fraction.words, ...otherWords])
        };
    }

    let phase = $state(1);
    let questionIndex = $state(0);
    let score = $state(0);
    let feedback = $state('');
    let userNumerator = $state('');
    let userDenominator = $state('');
    let userAnswer = $state('');
    let locked = $state(false);
    let finished = $state(false);
    let currentQuestion = $state<BossQuestion>(createQuestion(1, 0));
    let advanceTimer: ReturnType<typeof setTimeout> | undefined;

    function advanceQuestion() {
        if (!locked || finished) return;
        if (advanceTimer) clearTimeout(advanceTimer);
        if (questionIndex < 5) {
            questionIndex += 1;
            currentQuestion = createQuestion(phase, questionIndex);
            userNumerator = '';
            userDenominator = '';
            userAnswer = '';
            feedback = '';
            locked = false;
            return;
        }
        if (phase < 3) {
            phase += 1;
            questionIndex = 0;
            currentQuestion = createQuestion(phase, 0);
            userNumerator = '';
            userDenominator = '';
            userAnswer = '';
            feedback = `Phase ${phase - 1} validée ! Voici la phase ${phase}.`;
            locked = false;
            setTimeout(() => { if (!finished) feedback = ''; }, 1400);
            return;
        }
        finished = true;
        feedback = 'Les trois phases sont terminées !';
        setTimeout(() => onComplete(score), 1400);
    }

    function handleEnter(event: KeyboardEvent) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        if (locked) {
            advanceQuestion();
            return;
        }
        if (currentQuestion.kind === 'writeFraction') submitFraction();
        else if (currentQuestion.kind === 'writeFromWords') submitWordsToFraction();
    }

    onMount(() => {
        window.addEventListener('keydown', handleEnter);
        return () => {
            window.removeEventListener('keydown', handleEnter);
            if (advanceTimer) clearTimeout(advanceTimer);
        };
    });

    function normalize(value: string): string {
        return value
            .toLocaleLowerCase('fr-CH')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s*\/\s*/g, '/')
            .replace(/[-‐‑]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function readInstruction() {
        AudioManager.speak(currentQuestion.prompt);
    }

    function answerCorrect() {
        if (locked || finished) return;
        locked = true;
        const nextScore = score + 1;
        score = nextScore;
        feedback = 'Bonne réponse ! Le boss perd de l’énergie. ✨';

        // Laisse un bref temps de lecture, mais Enter permet de passer tout de suite.
        advanceTimer = setTimeout(advanceQuestion, 1000);
    }

    function answerWrong(message = 'Pas tout à fait. Observe les parts et réessaie.') {
        if (locked || finished) return;
        feedback = message;
    }

    function submitFraction() {
        if (currentQuestion.kind !== 'writeFraction' || locked) return;
        const n = Number(userNumerator);
        const d = Number(userDenominator);
        if (userNumerator.trim() === '' || userDenominator.trim() === '' || !Number.isInteger(n) || !Number.isInteger(d)) {
            answerWrong('Complète le numérateur et le dénominateur avec des nombres entiers.');
            return;
        }
        if (n === currentQuestion.fraction.numerator && d === currentQuestion.fraction.denominator) answerCorrect();
        else answerWrong('Vérifie le nombre de parts coloriées et le nombre total de parts.');
    }

    function chooseRepresentation(option: FractionItem) {
        if (currentQuestion.kind !== 'chooseRepresentation' || locked) return;
        if (sameValue(option, currentQuestion.fraction)) answerCorrect();
        else answerWrong('Regarde combien de parts sont coloriées et combien il y en a en tout.');
    }

    function submitWordsToFraction() {
        if (currentQuestion.kind !== 'writeFromWords' || locked) return;
        const expected = `${currentQuestion.fraction.numerator}/${currentQuestion.fraction.denominator}`;
        if (normalize(userAnswer) === expected) answerCorrect();
        else answerWrong('Écris le numérateur, puis le dénominateur, sous la forme a/b.');
    }

    function chooseName(word: string) {
        if (currentQuestion.kind !== 'chooseName' || locked) return;
        if (normalize(word) === normalize(currentQuestion.fraction.words)) answerCorrect();
        else answerWrong('Relis les deux nombres de la fraction et cherche le nom correspondant.');
    }
</script>

<div class="boss2-card">
    <header class="boss2-header">
        <div>
            <p class="eyebrow">⚔️ Boss de l’étage 2</p>
            <h2>Le gardien des fractions</h2>
        </div>
        <div class="progress-label">Phase {phase}/3 · Question {questionIndex + 1}/6</div>
    </header>

    <div class="progress-track" aria-label={`Progression : ${(phase - 1) * 6 + questionIndex} sur 18 questions validées`}>
        <div class="progress-fill" style={`width: ${((phase - 1) * 6 + questionIndex) / 18 * 100}%`}></div>
    </div>

    {#if finished}
        <section class="victory-panel">
            <div class="victory-icon">🏆</div>
            <h3>Boss vaincu !</h3>
            <p>Tu sais passer du dessin à la fraction, et de la fraction aux mots.</p>
            <p class="final-score">Score : {score}/18</p>
            <button class="primary-button" onclick={() => onComplete(score)}>Retourner dans la tour</button>
        </section>
    {:else}
        <section class="question-panel">
            <div class="question-title-row">
                <h3>{currentQuestion.prompt}</h3>
                <button class="audio-button" onclick={readInstruction} aria-label="Écouter la consigne" title="Écouter la consigne">🔊</button>
            </div>

            {#if currentQuestion.kind === 'writeFraction'}
                <div class="visual-stage">
                    <FractionBar numerator={currentQuestion.fraction.numerator} denominator={currentQuestion.fraction.denominator} showLabel={false} width={260} />
                </div>
                <div class="fraction-answer">
                    <label>Numérateur <input bind:value={userNumerator} inputmode="numeric" aria-label="Numérateur" /></label>
                    <span class="fraction-separator">/</span>
                    <label>Dénominateur <input bind:value={userDenominator} inputmode="numeric" aria-label="Dénominateur" /></label>
                </div>
                <button class="primary-button" onclick={submitFraction} disabled={locked}>Valider la fraction</button>
            {:else if currentQuestion.kind === 'chooseRepresentation'}
                <div class="representation-options">
                    {#each currentQuestion.options as option, i}
                        <button class="representation-option" onclick={() => chooseRepresentation(option)} disabled={locked} aria-label={`Choix ${i + 1}`}>
                            <span class="option-letter">{String.fromCharCode(65 + i)}</span>
                            <FractionBar numerator={option.numerator} denominator={option.denominator} showLabel={false} width={150} />
                        </button>
                    {/each}
                </div>
            {:else if currentQuestion.kind === 'writeFromWords'}
                <div class="word-prompt">« {currentQuestion.words} »</div>
                <input class="text-answer" bind:value={userAnswer} placeholder="Ex. : 3/5" aria-label="Écriture fractionnaire" />
                <button class="primary-button" onclick={submitWordsToFraction} disabled={locked}>Valider la réponse</button>
            {:else if currentQuestion.kind === 'chooseName'}
                <div class="symbolic-fraction" aria-label={`${currentQuestion.fraction.numerator} sur ${currentQuestion.fraction.denominator}`}>
                    <span>{currentQuestion.fraction.numerator}</span><span class="symbolic-bar"></span><span>{currentQuestion.fraction.denominator}</span>
                </div>
                <div class="word-options">
                    {#each currentQuestion.wordOptions as option}
                        <button class="word-option" onclick={() => chooseName(option)} disabled={locked}>{option}</button>
                    {/each}
                </div>
            {/if}

            <p class:success={feedback.startsWith('Bonne') || feedback.startsWith('Phase')} class="feedback" aria-live="polite">{feedback}</p>
        </section>
    {/if}
</div>

<style>
    .boss2-card { width: min(100%, 760px); margin: 0 auto; box-sizing: border-box; padding: 24px; color: #172033; background: #fffdf7; border: 1px solid #e7dcc8; border-radius: 22px; box-shadow: 0 12px 32px rgba(15,23,42,.18); }
    .boss2-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; border-bottom: 1px solid #e7dcc8; padding-bottom: 16px; }
    .eyebrow { margin: 0 0 5px; color: #0e7490; font-weight: 800; font-size: .8rem; text-transform: uppercase; letter-spacing: .08em; }
    h2, h3, p { margin-top: 0; }
    .boss2-header h2 { margin-bottom: 0; color: #172033; font-size: 1.5rem; }
    .progress-label { padding: 8px 10px; border-radius: 10px; background: #e0f2fe; color: #075985; font-weight: 700; font-size: .85rem; white-space: nowrap; }
    .progress-track { height: 8px; margin: 18px 0 24px; background: #e5e7eb; border-radius: 99px; overflow: hidden; }
    .progress-fill { height: 100%; background: #0e7490; transition: width .2s ease; }
    .question-panel { display: flex; flex-direction: column; align-items: center; gap: 18px; }
    .question-title-row { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; }
    .question-title-row h3 { margin: 0; text-align: center; font-size: 1.15rem; line-height: 1.5; color: #172033; }
    .audio-button { flex: 0 0 auto; border: 1px solid #a5f3fc; background: #ecfeff; color: #155e75; border-radius: 50%; width: 42px; height: 42px; font-size: 1.1rem; cursor: pointer; }
    .visual-stage { display: flex; justify-content: center; align-items: center; width: 100%; min-height: 100px; padding: 16px; box-sizing: border-box; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; }
    .fraction-answer { display: flex; align-items: end; gap: 10px; }
    .fraction-answer label { display: flex; flex-direction: column; gap: 6px; color: #334155; font-weight: 700; font-size: .85rem; }
    .fraction-answer input { width: 100px; height: 48px; box-sizing: border-box; border: 2px solid #cbd5e1; border-radius: 10px; background: #fff; color: #111827; font-size: 1.35rem; text-align: center; }
    .fraction-separator { font-size: 1.6rem; font-weight: 800; padding-bottom: 10px; }
    .representation-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; width: 100%; }
    .representation-option { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 118px; padding: 10px; border: 2px solid #cbd5e1; border-radius: 14px; background: #fff; cursor: pointer; }
    .representation-option:hover:not(:disabled), .word-option:hover:not(:disabled) { border-color: #0891b2; background: #ecfeff; }
    .option-letter { display: inline-flex; align-items: center; justify-content: center; width: 25px; height: 25px; border-radius: 50%; background: #e2e8f0; color: #334155; font-weight: 800; margin-bottom: 4px; }
    .word-prompt { padding: 14px 20px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; color: #075985; font-size: 1.2rem; font-weight: 800; }
    .text-answer { width: min(100%, 320px); box-sizing: border-box; height: 50px; padding: 10px 14px; border: 2px solid #cbd5e1; border-radius: 10px; font-size: 1.2rem; text-align: center; color: #111827; background: #fff; }
    .symbolic-fraction { display: flex; flex-direction: column; align-items: center; font-size: 1.6rem; font-weight: 800; color: #172033; }
    .symbolic-bar { width: 48px; height: 3px; background: #172033; margin: 3px 0; }
    .word-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; width: 100%; }
    .word-option { min-height: 56px; padding: 10px; border: 2px solid #cbd5e1; border-radius: 12px; background: #fff; color: #172033; font-weight: 700; cursor: pointer; }
    .primary-button { border: 0; border-radius: 12px; padding: 13px 20px; background: #0e7490; color: #fff; font-size: 1rem; font-weight: 800; cursor: pointer; }
    .primary-button:hover:not(:disabled) { background: #155e75; }
    button:disabled { opacity: .55; cursor: not-allowed; }
    .feedback { min-height: 1.5em; margin: 0; text-align: center; font-weight: 700; color: #b91c1c; }
    .feedback.success { color: #047857; }
    .victory-panel { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 28px 10px; }
    .victory-icon { font-size: 3rem; }
    .victory-panel h3 { margin: 0; color: #047857; font-size: 1.7rem; }
    .victory-panel p { margin: 0; }
    .final-score { font-weight: 800; color: #075985; }
    @media (max-width: 560px) { .boss2-card { padding: 16px; } .boss2-header { align-items: flex-start; flex-direction: column; } .representation-options, .word-options { grid-template-columns: 1fr; } .representation-option { min-height: 95px; } }
</style>
