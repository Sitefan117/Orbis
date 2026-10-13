<script lang="ts">
    /** Introduction pédagogique de l’étage. Le contenu des autres étages reste inchangé. */
    import { AudioManager } from '$lib/fractionstower2/audio/AudioManager';
    import FractionBar from '$lib/fractionstower2/components/fraction/FractionBar.svelte';

    let { floorId = 'floor-1', onComplete } = $props<{
        floorId?: string;
        onComplete: () => void;
    }>();

    let floorNum = $derived(floorId.replace('floor-', ''));
    let step = $state(0);

    const lessonSteps = [
        {
            title: '1. Une fraction, c’est un partage',
            text: 'Une fraction représente une ou plusieurs parts d’une unité. Pour parler de quarts, de tiers ou de cinquièmes, les parts doivent être de même taille.',
            spoken: 'Une fraction représente une ou plusieurs parts d’une unité partagée en parts égales.'
        },
        {
            title: '2. Numérateur et dénominateur',
            text: 'Le dénominateur, en bas, indique le nombre total de parts égales. Le numérateur, en haut, indique le nombre de parts prises.',
            spoken: 'Dans trois quarts, le dénominateur quatre indique le nombre total de parts égales. Le numérateur trois indique le nombre de parts prises.'
        },
        {
            title: '3. Je lis la représentation',
            text: 'La barre est partagée en 4 parts égales. 3 parts sont coloriées : la fraction représentée est 3/4.',
            spoken: 'La barre est partagée en quatre parts égales. Trois parts sont coloriées. La fraction est trois quarts.'
        }
    ];

    function readCourse() {
        const text = floorId === 'floor-1'
            ? lessonSteps[step].spoken
            : `Leçon de l’étage ${floorNum}. Découvrons ensemble comment manipuler les fractions selon le programme HarmoS.`;
        AudioManager.speak(text);
    }
</script>

<div class="lesson-card p-6 bg-white text-slate-800 rounded-3xl max-w-xl mx-auto flex flex-col gap-6 border border-slate-200 shadow-xl">
    <div class="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
            <span class="text-xs font-mono text-cyan-800 uppercase tracking-wider">Personnage-guide · théorie</span>
            <h2 class="text-2xl font-bold mt-1 text-slate-900">{floorId === 'floor-1' ? 'Le partage équitable' : `Leçon interactive · étage ${floorNum}`}</h2>
        </div>
        <button onclick={readCourse} class="px-4 py-2 bg-cyan-50 text-cyan-900 border border-cyan-200 rounded-xl text-sm font-semibold hover:bg-cyan-100 cursor-pointer flex items-center gap-2 shadow" title="Lire la théorie à voix haute">
            🔊 Écouter
        </button>
    </div>

    {#if floorId === 'floor-1'}
        <div class="flex items-center gap-2" aria-label={`Étape ${step + 1} sur 3`}>
            {#each lessonSteps as _, i}
                <div class={`h-2 flex-1 rounded-full ${i <= step ? 'bg-cyan-400' : 'bg-slate-700'}`}></div>
            {/each}
        </div>
        <section class="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 leading-relaxed space-y-4">
            <h3 class="text-xl font-bold text-cyan-800">{lessonSteps[step].title}</h3>
            <p>{lessonSteps[step].text}</p>
            {#if step === 0}
                <div class="rounded-xl bg-white p-4 text-slate-900">
                    <FractionBar numerator={3} denominator={4} color="#1976d2" width={240} showLabel={false} />
                    <p class="text-center font-semibold">4 parts de même taille, 3 parts prises.</p>
                </div>
            {:else if step === 1}
                <div class="grid grid-cols-2 gap-3">
                    <div class="rounded-xl bg-blue-50 border border-blue-200 p-4 text-center text-blue-900">
                        <div class="text-4xl font-bold">3</div><div class="text-sm text-blue-800">Numérateur : parts prises</div>
                    </div>
                    <div class="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center text-emerald-900">
                        <div class="text-4xl font-bold">4</div><div class="text-sm text-emerald-800">Dénominateur : parts en tout</div>
                    </div>
                </div>
                <div class="text-center text-3xl font-bold" aria-label="trois quarts">3/4</div>
            {:else}
                <div class="rounded-xl bg-white p-4 text-slate-900">
                    <FractionBar numerator={3} denominator={4} color="#1976d2" width={240} showLabel={true} />
                    <p class="text-center">Je compte les parts coloriées : 3. Je compte toutes les parts égales : 4.</p>
                </div>
                <p class="border-l-4 border-amber-400 bg-amber-50 text-amber-950 p-3 rounded-r-lg">Attention : si les parts n’ont pas la même taille, elles ne représentent pas des quarts égaux.</p>
            {/if}
        </section>
        <div class="flex justify-between gap-3">
            <button onclick={() => step = Math.max(0, step - 1)} disabled={step === 0} class="px-5 py-3 bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-40 rounded-xl font-semibold">← Précédent</button>
            {#if step < lessonSteps.length - 1}
                <button onclick={() => step += 1} class="px-6 py-3 bg-cyan-700 text-white hover:bg-cyan-600 rounded-xl font-bold">Étape suivante →</button>
            {:else}
                <button onclick={onComplete} class="px-6 py-3 bg-emerald-700 text-white hover:bg-emerald-600 rounded-xl font-bold">J’ai compris →</button>
            {/if}
        </div>
    {:else}
        <div class="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 leading-relaxed space-y-3">
            <p>Bienvenue dans cette capsule d’apprentissage ! Une fraction permet de représenter des parts égales d’une unité.</p>
            <p class="text-cyan-800 font-medium">Observe les figures et associe chaque quantité à son écriture mathématique.</p>
        </div>
        <div class="flex justify-end pt-2">
            <button onclick={onComplete} class="px-6 py-3.5 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-xl cursor-pointer">J’ai compris, terminer ➔</button>
        </div>
    {/if}
</div>

<style>
    /* La théorie doit rester lisible même si les utilitaires CSS ne sont pas chargés. */
    .lesson-card {
        box-sizing: border-box;
        background: #fffdf7 !important;
        color: #202938 !important;
        border: 1px solid #e7dcc8 !important;
        border-radius: 1.25rem;
        box-shadow: 0 8px 28px rgba(15, 23, 42, .16);
    }
    .lesson-card h2 { color: #172033 !important; }
    .lesson-card h3 { color: #075985 !important; }
    .lesson-card p, .lesson-card span, .lesson-card div { color: inherit; }
    .lesson-card section { background: #f8fafc !important; color: #202938 !important; }
    .lesson-card button {
        color: #fff !important;
        background: #0e7490;
        border: 1px solid #0e7490;
        border-radius: .75rem;
        padding: .65rem 1rem;
        font-weight: 650;
        cursor: pointer;
    }
    .lesson-card > div:first-child button {
        color: #155e75 !important;
        background: #ecfeff;
        border-color: #a5f3fc;
    }
    .lesson-card button[class*="bg-slate-700"] { background: #334155; border-color: #334155; }
    .lesson-card button[class*="bg-cyan-700"] { background: #0e7490; border-color: #0e7490; }
    .lesson-card button[class*="bg-emerald-700"] { background: #047857; border-color: #047857; }
    .lesson-card button:hover { filter: brightness(.95); }
    .lesson-card button:disabled { opacity: .45; }
</style>
