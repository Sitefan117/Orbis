<script lang="ts">
    /**
     * [Activité] TrainingSession.svelte
     * Entraînement interactif 10 exercices.
     */
    import { onMount } from 'svelte';
    import { ExerciseGenerator } from '$lib/fractionstower2/engines/ExerciseGenerator';
    import FractionBar from '$lib/fractionstower2/components/fraction/FractionBar.svelte';
    import NumberLine from '$lib/fractionstower2/components/fraction/NumberLine.svelte';
    import { AudioManager } from '$lib/fractionstower2/audio/AudioManager';
    import { t } from '$lib/fractionstower2/persistence/LanguageManager';

    let { 
        floorId = 'floor-1', 
        onComplete 
    } = $props<{
        floorId?: string;
        onComplete: () => void;
    }>();

    let inputRef: HTMLInputElement | undefined = $state();

    function getExerciseType(fid: string) {
        if (fid === 'floor-3') return 'number_line';
        if (['floor-4', 'floor-5', 'floor-9'].includes(fid)) return 'comparison';
        if (fid === 'floor-6') return 'decimal_conversion';
        if (['floor-7', 'floor-8'].includes(fid)) return 'addition';
        return 'standard';
    }

    // 1. Initialisation neutre sans référence à la prop floorId
    let currentExercise = $state(
        ExerciseGenerator.generate({ 
            floorId: 'floor-1', 
            difficulty: 'easy', 
            type: 'standard' 
        })
    );

    let userAnswer = $state("");
    let feedback = $state("");
    let score = $state(0);
    const totalExercises = 10;
    let isAdvancing = $state(false);
    // Évite de reproposer une même formulation pendant la session de l’étage 1.
    let seenQuestions = new Set<string>();

    function generateUniqueExercise(activeFloor: string) {
        let exercise = ExerciseGenerator.generate({ floorId: activeFloor, difficulty: 'easy', type: getExerciseType(activeFloor) });
        if (!['floor-1', 'floor-2'].includes(activeFloor)) return exercise;
        let attempts = 0;
        while (seenQuestions.has(exercise.question) && attempts < 80) {
            exercise = ExerciseGenerator.generate({ floorId: activeFloor, difficulty: 'easy', type: getExerciseType(activeFloor) });
            attempts += 1;
        }
        seenQuestions.add(exercise.question);
        return exercise;
    }

    // 2. Synchronisation propre via $effect dès que floorId change
    $effect(() => {
        const activeFloor = floorId;
        seenQuestions = new Set<string>();
        currentExercise = generateUniqueExercise(activeFloor);
        score = 0;
        userAnswer = "";
        feedback = "";
    });

    function checkAnswer() {
        if (isAdvancing) return;

        if (currentExercise.type === 'comparison') {
            if (userAnswer.trim() === currentExercise.correctAnswer) {
                feedback = t('feedback.correct');
                score += 1;
                isAdvancing = true;
                setTimeout(nextExercise, 1500);
            } else {
                feedback = t('feedback.wrong');
            }
            return;
        }

        if (currentExercise.type === 'addition') {
            const cleanUser = userAnswer.replace(/\s+/g, '').trim();
            const cleanCorrect = String(currentExercise.correctAnswer).replace(/\s+/g, '').trim();
            
            if (cleanUser === cleanCorrect) {
                feedback = t('feedback.correct');
                score += 1;
                isAdvancing = true;
                setTimeout(nextExercise, 1500);
            } else {
                feedback = `${t('feedback.wrong')} (Attendu :${currentExercise.correctAnswer})`;
            }
            return;
        }

        let isCorrect = false;

        // L’étage 2 travaille le dessin, l’écriture fractionnaire, les noms et les situations.
        // On accepte les espaces autour de la barre et les accents dans les mots.
        if (floorId === 'floor-2') {
            const normalize = (value: string | number) => String(value)
                .toLocaleLowerCase('fr-CH')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s*\/\s*/g, '/')
                .replace(/[-‐‑]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            const expected = normalize(currentExercise.correctAnswer);
            const actual = normalize(userAnswer);
            const acceptedAliases: Record<string, string[]> = {
                'une moitie': ['un demi', 'la moitie', '1/2'],
                'un tiers': ['1/3'],
                'un quart': ['1/4'],
                'trois quarts': ['3/4'],
                'cinq quarts': ['5/4']
            };
            isCorrect = typeof currentExercise.correctAnswer === 'number'
                ? actual !== '' && Number(actual) === currentExercise.correctAnswer
                : actual === expected || (acceptedAliases[expected]?.includes(actual) ?? false);
        } else if (floorId === 'floor-1') {
            const cleanUser = userAnswer.replace(/\s+/g, '').replace(',', '.');
            const expected = String(currentExercise.correctAnswer).replace(/\s+/g, '');
            if (expected.includes('/')) {
                const [userNum, userDen] = cleanUser.split('/');
                const [expectedNum, expectedDen] = expected.split('/');
                isCorrect = userDen !== undefined
                    && Number(userNum) === Number(expectedNum)
                    && Number(userDen) === Number(expectedDen);
            } else {
                isCorrect = cleanUser !== '' && Number(cleanUser) === Number(expected);
            }
        } else {
            const val = parseFloat(userAnswer);
            if (isNaN(val)) {
                feedback = "S'il te plaît, écris un nombre valide.";
                return;
            }
            if (typeof currentExercise.correctAnswer === 'string') {
                isCorrect = val.toString() === currentExercise.correctAnswer.toString();
            } else {
                isCorrect = val === currentExercise.correctAnswer.numerator;
            }
        }

        if (isCorrect) {
            feedback = t('feedback.correct');
            score += 1;
            isAdvancing = true;
            setTimeout(nextExercise, 1500);
        } else {
            feedback = t('feedback.wrong');
        }
    }

    function nextExercise() {
        if (score >= totalExercises) {
            onComplete();
            return;
        }

        feedback = "";
        userAnswer = "";
        isAdvancing = false;
        currentExercise = generateUniqueExercise(floorId);
        
        setTimeout(() => {
            if (inputRef) {
                inputRef.focus();
                inputRef.value = "";
            }
        }, 50);
    }

    function readQuestion() {
        if (AudioManager.speak) AudioManager.speak(currentExercise.question);
    }

    onMount(() => {
        setTimeout(() => inputRef?.focus(), 100);
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                checkAnswer();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    });
</script>

<div class="training-container">
    <div class="score-board">
        Score : {score} / {totalExercises}
    </div>

    <div class="exercise-box">
        <div class="header-row">
            <h3 class="question-title" style="margin: 0; color: #111827;">{currentExercise.question}</h3>
            <button class="audio-btn" onclick={readQuestion} title="Lire la consigne">🔊</button>
        </div>
        
        {#if floorId === 'floor-2' && currentExercise.fractions?.[0]}
            <div class="viz-box">
                <div class="viz-wrapper">
                    <FractionBar numerator={currentExercise.fractions[0].numerator} denominator={currentExercise.fractions[0].denominator} showLabel={false} width={240} />
                </div>
            </div>
        {:else if floorId !== 'floor-2' && currentExercise.fractions && (currentExercise.type === 'number_line' || currentExercise.type === 'comparison' || currentExercise.type === 'addition')}
            <div class="viz-box">
                {#key currentExercise}
                    <div class="viz-wrapper">
                        {#if currentExercise.type === 'number_line'}
                            <NumberLine {...currentExercise.fractions[0]} />
                        {:else if currentExercise.type === 'comparison'}
                            <div style="display: flex; gap: 20px; align-items: center;">
                                <FractionBar numerator={currentExercise.fractions[0].numerator} denominator={currentExercise.fractions[0].denominator} showLabel={true} width={150} />
                                <span style="font-size: 1.5rem; font-weight: bold;">?</span>
                                <FractionBar numerator={currentExercise.fractions[1].numerator} denominator={currentExercise.fractions[1].denominator} showLabel={true} width={150} />
                            </div>
                        {:else if currentExercise.type === 'addition'}
                            <div style="display: flex; gap: 15px; align-items: center; justify-content: center; flex-wrap: wrap;">
                                <div style="display: flex; flex-direction: column; align-items: center;">
                                    <span style="font-size: 0.85rem; font-weight: bold; margin-bottom: 4px;">{currentExercise.fractions[0].numerator} / {currentExercise.fractions[0].denominator}</span>
                                    <FractionBar numerator={currentExercise.fractions[0].numerator} denominator={currentExercise.fractions[0].denominator} showLabel={true} width={130} />
                                </div>
                                <span style="font-size: 1.8rem; font-weight: bold; color: #3498db;">+</span>
                                <div style="display: flex; flex-direction: column; align-items: center;">
                                    <span style="font-size: 0.85rem; font-weight: bold; margin-bottom: 4px;">{currentExercise.fractions[1].numerator} / {currentExercise.fractions[1].denominator}</span>
                                    <FractionBar numerator={currentExercise.fractions[1].numerator} denominator={currentExercise.fractions[1].denominator} showLabel={true} width={130} />
                                </div>
                            </div>
                        {/if}
                    </div>
                {/key}
            </div>
        {/if}

        {#if currentExercise.type === 'comparison'}
            <div style="display: flex; gap: 10px; margin: 10px 0;">
                <button class="btn-symbol" onclick={() => { userAnswer = '<'; checkAnswer(); }}>&lt;</button>
                <button class="btn-symbol" onclick={() => { userAnswer = '='; checkAnswer(); }}>=</button>
                <button class="btn-symbol" onclick={() => { userAnswer = '>'; checkAnswer(); }}>&gt;</button>
            </div>
        {:else}
            {#if floorId === 'floor-2'}
                <div class="full-answer-container">
                    <input
                        type="text"
                        bind:this={inputRef}
                        bind:value={userAnswer}
                        placeholder={typeof currentExercise.correctAnswer === 'number' ? 'Écris un nombre' : String(currentExercise.correctAnswer).includes('/') ? 'Ex. : 3/5' : 'Écris avec des mots'}
                        aria-label="Ta réponse"
                    />
                </div>
            {:else}
                <div class="fraction-input-container">
                    <div class="numerator-input-wrapper">
                        <input 
                            type="text" 
                            inputmode="numeric"
                            bind:this={inputRef} 
                            bind:value={userAnswer} 
                            placeholder={currentExercise.type === 'addition' || (floorId === 'floor-1' && String(currentExercise.correctAnswer).includes('/')) ? "ex: 2/5" : "?"}
                        />
                    </div>
                    {#if floorId !== 'floor-1' && currentExercise.type !== 'decimal_conversion' && currentExercise.type !== 'addition'}
                        <div class="fraction-bar"></div>
                        <div class="denominator-display">
                            {currentExercise.fractions?.[0]?.denominator ?? 2}
                        </div>
                    {/if}
                </div>
            {/if}
            <button class="btn" onclick={checkAnswer} disabled={isAdvancing}>Vérifier</button>
        {/if}

        <p class="feedback">{feedback}</p>
    </div>
</div>

<style>
    .training-container { display: flex; flex-direction: column; align-items: center; gap: 20px; font-family: sans-serif; }
    .score-board { font-weight: bold; font-size: 1.2rem; color: #666; }
    .exercise-box { color: #1f2937; background: #ffffff !important; display: flex; flex-direction: column; align-items: center; gap: 20px; background: #fff; padding: 30px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center; max-width: 600px; width: 100%; }
    .question-title { color: #111827 !important; }
    .header-row { color: #111827; display: flex; align-items: center; gap: 10px; }
    .audio-btn { background: #eee; border: 1px solid #ccc; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 1rem; }
    .viz-box { padding: 20px; background: #fdfdfd; border: 1px solid #eee; border-radius: 12px; min-height: 180px; display: flex; justify-content: center; align-items: center; width: 100%; }
    .viz-wrapper { display: flex; justify-content: center; align-items: center; width: 100%; }
    .full-answer-container input { width: min(100%, 360px); min-width: 230px; min-height: 48px; box-sizing: border-box; font-size: 1.15rem; text-align: center; padding: 10px 14px; border: 2px solid #0e7490; border-radius: 10px; background: #fff; color: #111827; }
    .fraction-input-container { display: inline-flex; flex-direction: column; align-items: center; gap: 6px; margin: 10px 0; }
    .numerator-input-wrapper input { width: 120px; height: 50px; font-size: 1.5rem; text-align: center; padding: 5px; border: 2px solid #3498db; border-radius: 8px; background: #fcfcfc; }
    .fraction-bar { width: 80px; height: 3px; background-color: #333; border-radius: 2px; }
    .denominator-display { font-size: 2rem; font-weight: bold; color: #333; }
    .btn { padding: 12px 30px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1.1rem; font-weight: bold; }
    .btn:hover { background: #2980b9; }
    .btn-symbol { padding: 15px 25px; font-size: 1.5rem; font-weight: bold; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; }
    .btn-symbol:hover { background: #2980b9; }
    .feedback { font-weight: bold; min-height: 1.5em; color: #444; }
</style>