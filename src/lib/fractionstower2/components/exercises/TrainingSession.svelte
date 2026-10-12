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

    // 2. Synchronisation propre via $effect dès que floorId change
    $effect(() => {
        const activeFloor = floorId;
        currentExercise = ExerciseGenerator.generate({ 
            floorId: activeFloor, 
            difficulty: 'easy', 
            type: getExerciseType(activeFloor)
        });
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

        const val = parseFloat(userAnswer);
        if (isNaN(val)) {
            feedback = "S'il te plaît, écris un nombre valide.";
            return;
        }

        let isCorrect = false;
        if (typeof currentExercise.correctAnswer === 'string') {
            isCorrect = val.toString() === currentExercise.correctAnswer.toString();
        } else {
            isCorrect = val === currentExercise.correctAnswer.numerator;
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
        currentExercise = ExerciseGenerator.generate({ 
            floorId: floorId, 
            difficulty: 'easy',
            type: getExerciseType(floorId)
        });
        
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
            <h3 style="margin: 0;">{currentExercise.question}</h3>
            <button class="audio-btn" onclick={readQuestion} title="Lire la consigne">🔊</button>
        </div>
        
        <div class="viz-box">
            {#key currentExercise}
                <div class="viz-wrapper">
                    {#if currentExercise.type === 'number_line' && currentExercise.fractions}
                        <NumberLine {...currentExercise.fractions[0]} />
                    {:else if currentExercise.type === 'comparison' && currentExercise.fractions}
                        <div style="display: flex; gap: 20px; align-items: center;">
                            <FractionBar 
                                numerator={currentExercise.fractions[0].numerator} 
                                denominator={currentExercise.fractions[0].denominator} 
                                showLabel={true}
                                width={150}
                            />
                            <span style="font-size: 1.5rem; font-weight: bold;">?</span>
                            <FractionBar 
                                numerator={currentExercise.fractions[1].numerator} 
                                denominator={currentExercise.fractions[1].denominator} 
                                showLabel={true}
                                width={150}
                            />
                        </div>
                    {:else if currentExercise.type === 'addition' && currentExercise.fractions}
                        <div style="display: flex; gap: 15px; align-items: center; justify-content: center; flex-wrap: wrap;">
                            <div style="display: flex; flex-direction: column; align-items: center;">
                                <span style="font-size: 0.85rem; font-weight: bold; margin-bottom: 4px;">
                                    {currentExercise.fractions[0].numerator} / {currentExercise.fractions[0].denominator}
                                </span>
                                <FractionBar 
                                    numerator={currentExercise.fractions[0].numerator} 
                                    denominator={currentExercise.fractions[0].denominator} 
                                    showLabel={true}
                                    width={130}
                                />
                            </div>
                            <span style="font-size: 1.8rem; font-weight: bold; color: #3498db;">+</span>
                            <div style="display: flex; flex-direction: column; align-items: center;">
                                <span style="font-size: 0.85rem; font-weight: bold; margin-bottom: 4px;">
                                    {currentExercise.fractions[1].numerator} / {currentExercise.fractions[1].denominator}
                                </span>
                                <FractionBar 
                                    numerator={currentExercise.fractions[1].numerator} 
                                    denominator={currentExercise.fractions[1].denominator} 
                                    showLabel={true}
                                    width={130}
                                />
                            </div>
                        </div>
                    {:else}
                        <FractionBar 
                            numerator={currentExercise.fractions?.[0]?.numerator ?? 1} 
                            denominator={currentExercise.fractions?.[0]?.denominator ?? 2} 
                            showLabel={false}
                            width={200}
                        />
                    {/if}
                </div>
            {/key}
        </div>

        {#if currentExercise.type === 'comparison'}
            <div style="display: flex; gap: 10px; margin: 10px 0;">
                <button class="btn-symbol" onclick={() => { userAnswer = '<'; checkAnswer(); }}>&lt;</button>
                <button class="btn-symbol" onclick={() => { userAnswer = '='; checkAnswer(); }}>=</button>
                <button class="btn-symbol" onclick={() => { userAnswer = '>'; checkAnswer(); }}>&gt;</button>
            </div>
        {:else}
            <div class="fraction-input-container">
                <div class="numerator-input-wrapper">
                    <input 
                        type="text" 
                        inputmode="numeric"
                        bind:this={inputRef} 
                        bind:value={userAnswer} 
                        placeholder={currentExercise.type === 'addition' ? "ex: 5/6" : "?"}
                    />
                </div>
                {#if currentExercise.type !== 'decimal_conversion' && currentExercise.type !== 'addition'}
                    <div class="fraction-bar"></div>
                    <div class="denominator-display">
                        {currentExercise.fractions?.[0]?.denominator ?? 2}
                    </div>
                {/if}
            </div>
            <button class="btn" onclick={checkAnswer} disabled={isAdvancing}>Vérifier</button>
        {/if}

        <p class="feedback">{feedback}</p>
    </div>
</div>

<style>
    .training-container { display: flex; flex-direction: column; align-items: center; gap: 20px; font-family: sans-serif; }
    .score-board { font-weight: bold; font-size: 1.2rem; color: #666; }
    .exercise-box { display: flex; flex-direction: column; align-items: center; gap: 20px; background: #fff; padding: 30px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center; max-width: 600px; width: 100%; }
    .header-row { display: flex; align-items: center; gap: 10px; }
    .audio-btn { background: #eee; border: 1px solid #ccc; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 1rem; }
    .viz-box { padding: 20px; background: #fdfdfd; border: 1px solid #eee; border-radius: 12px; min-height: 180px; display: flex; justify-content: center; align-items: center; width: 100%; }
    .viz-wrapper { display: flex; justify-content: center; align-items: center; width: 100%; }
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