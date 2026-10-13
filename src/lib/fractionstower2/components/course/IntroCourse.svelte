<script lang="ts">
    /**
     * [Cours] IntroCourse.svelte
     * Cours interactif et visuel adapté aux 9 étages de Fraction Tower 2.
     */
    import { onMount } from 'svelte';
    import FractionBar from '$lib/fractionstower2/components/fraction/FractionBar.svelte';
    import FractionCircle from '$lib/fractionstower2/components/fraction/FractionCircle.svelte';
    import Fraction from '$lib/fractionstower2/components/fraction/Fraction.svelte';
    import { AudioManager } from '$lib/fractionstower2/audio/AudioManager';
    import { t } from '$lib/fractionstower2/persistence/LanguageManager';

    let { 
        floorId = 'floor-1', 
        onComplete 
    } = $props<{
        floorId?: string;
        onComplete: () => void;
    }>();

    let currentStep = $state(0);
    let showAnimation = $state(false);
    let isCorrect = $state<boolean | null>(null);
    let userAnswer = $state<number | undefined>(undefined);

    let demoDenominator = $state(4);
    let demoNumerator = $state(0);

    interface StepItem {
        id: string;
        title: string;
        text: string;
        type: string;
    }

    // Étapes réactives valides en Svelte 5 (expression directe sans fonction)
    let steps = $derived<StepItem[]>(
        floorId === 'floor-7' 
            ? [
                { 
                    id: 'course.f7_intro', 
                    title: "Étage 7 : Additionner des parts identiques", 
                    text: "Quand les parts ont la même taille (même dénominateur), on additionne simplement le nombre de morceaux colorés !", 
                    type: 'addition_same' 
                }
              ]
            : floorId === 'floor-8'
            ? [
                { 
                    id: 'course.f8_intro', 
                    title: "Étage 8 : Dénominateurs différents", 
                    text: "Pour additionner des parts de tailles différentes, on convertit d'abord la plus grande pour qu'elles aient le même dénominateur.", 
                    type: 'addition_diff' 
                }
              ]
            : [
                { id: 'course.unit', title: "L'unité entière", text: "Découvrons l'unité de base.", type: 'unit' },
                { id: 'course.division', title: "La division", text: "Apprenons à couper les parts.", type: 'division' },
                { id: 'course.filling', title: "Le remplissage", text: "Colorions les parts ensemble.", type: 'filling' },
                { id: 'course.validation', title: "Vérification", text: "À toi de valider ton savoir.", type: 'validation' }
              ]
    );

    let currentSlide = $derived(steps[currentStep] || steps[0]);

    function handleNext() {
        const totalSteps = steps.length;
        if (currentStep < totalSteps - 1) {
            currentStep += 1;
            showAnimation = false;
            isCorrect = null;
            userAnswer = undefined;
        } else {
            onComplete();
        }
    }

    function startAnimation() {
        showAnimation = true;
        if (currentSlide.type === 'filling') {
            let i = 0;
            const interval = setInterval(() => {
                i++;
                demoNumerator = i;
                if (i >= demoDenominator) clearInterval(interval);
            }, 500);
        }
    }

    function checkValidation() {
        if (userAnswer === 3) {
            isCorrect = true;
        } else {
            isCorrect = false;
        }
    }

    function readCurrentStep() {
        const text = currentSlide.text || t(currentSlide.id + '.text');
        if (AudioManager.speak) AudioManager.speak(text);
    }

    onMount(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                if (currentSlide.type !== 'validation' || isCorrect) {
                    handleNext();
                } else {
                    checkValidation();
                }
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    });
</script>

<div class="course-container">
    <div class="slide">
        <div class="header-row">
            <h3>{currentSlide.title || t(currentSlide.id + '.title')}</h3>
            <button class="audio-btn" onclick={readCurrentStep} title="Lire la consigne">🔊</button>
        </div>
        <p>{currentSlide.text || t(currentSlide.id + '.text')}</p>
        
        <div class="viz-box">
            {#if currentSlide.type === 'unit'}
                <FractionCircle numerator={1} denominator={1} color="#e74c3c" />
                <div class="caption">L'unité entière (1/1)</div>
            
            {:else if currentSlide.type === 'division'}
                <div class="interactive-area">
                    <div class="viz-flex">
                        <FractionCircle numerator={0} denominator={demoDenominator} color="#3498db" showLabel={false} />
                        <div class="fraction-symbol"><Fraction numerator={undefined} denominator={demoDenominator} /></div>
                    </div>
                    <div class="control-panel">
                        <span>Couper en : </span>
                        <input type="number" bind:value={demoDenominator} min="2" max="12" />
                    </div>
                    {#if !showAnimation}
                        <button class="btn-action" onclick={() => showAnimation = true}>Couper le gâteau !</button>
                    {:else}
                        <div class="animation-text">Regarde les lignes apparaître...</div>
                    {/if}
                </div>

            {:else if currentSlide.type === 'filling'}
                <div class="interactive-area">
                    <div class="viz-flex">
                        <FractionCircle numerator={demoNumerator} denominator={demoDenominator} color="#3498db" showLabel={false} />
                        <div class="fraction-symbol"><Fraction numerator={demoNumerator} denominator={demoDenominator} /></div>
                    </div>
                    <div class="control-panel">
                        <span>Prendre : </span>
                        <input type="number" bind:value={demoNumerator} min="0" max={demoDenominator} />
                        <span class="frac-symbol"> / {demoDenominator}</span>
                    </div>
                    <button class="btn-action" onclick={startAnimation}>Lancer le remplissage</button>
                </div>

            {:else if currentSlide.type === 'addition_same'}
                <div class="interactive-area">
                    <div class="viz-flex">
                        <FractionBar numerator={2} denominator={6} showLabel={true} width={150} />
                        <span style="font-size: 1.8rem; font-weight: bold; color: #3498db;">+</span>
                        <FractionBar numerator={3} denominator={6} showLabel={true} width={150} />
                    </div>
                    <div class="caption">2 sixièmes + 3 sixièmes = 5 sixièmes (2 + 3 = 5)</div>
                </div>

            {:else if currentSlide.type === 'addition_diff'}
                <div class="interactive-area">
                    <div class="viz-flex">
                        <FractionBar numerator={1} denominator={2} showLabel={true} width={150} />
                        <span style="font-size: 1.8rem; font-weight: bold; color: #3498db;">+</span>
                        <FractionBar numerator={1} denominator={4} showLabel={true} width={150} />
                    </div>
                    <div class="caption">1 demi (2/4) + 1 quart (1/4) = 3 quarts (3/4)</div>
                </div>

            {:else if currentSlide.type === 'validation'}
                <div class="validation-area">
                    <FractionCircle numerator={3} denominator={4} color="#3498db" showLabel={false} />
                    <div class="input-group">
                        <input type="number" bind:value={userAnswer} />
                        <span class="sep"> / </span>
                        <span>4</span>
                    </div>
                    <button class="btn-check" onclick={checkValidation}>Vérifier</button>
                    
                    {#if isCorrect !== null}
                        <div class="feedback {isCorrect ? 'correct' : 'wrong'}">
                            {isCorrect ? "✅ Bravo ! C'est exactement ça." : "❌ Pas tout à fait, regarde bien le nombre de parts colorées."}
                        </div>
                    {/if}
                </div>
            {/if}
        </div>

        <div class="nav">
            <span>Étape {currentStep + 1} / {steps.length}</span>
            {#if currentSlide.type === 'validation' && isCorrect}
                <button class="btn-next" onclick={handleNext}>Continuer ➔</button>
            {:else if currentSlide.type !== 'validation'}
                <button class="btn-next" onclick={handleNext}>Suivant ➔</button>
            {:else}
                <button class="btn-next disabled" disabled>Saisis la bonne réponse pour continuer</button>
            {/if}
        </div>
    </div>
</div>

<style>
    .course-container { display: flex; flex-direction: column; align-items: center; text-align: center; font-family: sans-serif; gap: 20px; }
    .slide { display: flex; flex-direction: column; align-items: center; gap: 20px; max-width: 600px; width: 100%; }
    .header-row { display: flex; align-items: center; gap: 15px; }
    .audio-btn { background: #eee; border: 1px solid #ccc; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 1.2rem; transition: background 0.2s; }
    .audio-btn:hover { background: #ddd; }
    .viz-box { background: #fff; padding: 30px; border-radius: 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.1); margin: 20px 0; min-height: 250px; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; }
    .interactive-area, .validation-area { display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; }
    .viz-flex { display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap; }
    .fraction-symbol { font-size: 2rem; font-weight: bold; }
    .control-panel { display: flex; align-items: center; gap: 10px; font-size: 1.2rem; font-weight: bold; }
    .control-panel input { width: 60px; font-size: 1.2rem; text-align: center; padding: 5px; border: 2px solid #ddd; border-radius: 5px; }
    .btn-action { padding: 10px 20px; background: #e67e22; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; transition: background 0.2s; }
    .btn-action:hover { background: #d35400; }
    .animation-text { font-style: italic; color: #666; font-size: 0.9rem; }
    .input-group { display: flex; align-items: center; gap: 10px; font-size: 2rem; font-weight: bold; }
    .input-group input { width: 80px; font-size: 2rem; text-align: center; padding: 5px; border: 3px solid #3498db; border-radius: 8px; }
    .btn-check { padding: 12px 30px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1.2rem; font-weight: bold; }
    .feedback { margin-top: 15px; font-weight: bold; padding: 10px; border-radius: 5px; }
    .feedback.correct { background: #d4edda; color: #155724; }
    .feedback.wrong { background: #f8d7da; color: #721c24; }
    .nav { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 20px; }
    .btn-next { padding: 10px 20px; background: #2ecc71; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1rem; }
    .btn-next.disabled { background: #ccc; cursor: not-allowed; }
    .caption { margin-top: 15px; font-style: italic; color: #666; font-size: 1rem; }
</style>