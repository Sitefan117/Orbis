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

    const floor2LessonSteps = [
        {
            title: '1. Une même fraction, trois représentations',
            text: 'Regarde toujours les trois façons de dire la même chose : le dessin montre les parts, l’écriture fractionnaire les note, et les mots permettent de la lire. Ici, les trois représentent exactement la même quantité.',
            spoken: 'Une fraction peut se représenter de trois façons. Le dessin montre les parts, l’écriture fractionnaire les note et les mots permettent de la lire. Nous allons voir un exemple complet.'
        },
        {
            title: '2. Comment passer du dessin à l’écriture ?',
            text: 'Dans cette barre, il y a 5 parts égales en tout et 3 parts coloriées. Le nombre de parts coloriées s’écrit en haut : 3. Le nombre total de parts égales s’écrit en bas : 5. La fraction est donc 3/5.',
            spoken: 'La barre contient cinq parts égales. Trois sont coloriées. J’écris trois en haut, car trois parts sont coloriées, et cinq en bas, car il y a cinq parts en tout. La fraction est trois cinquièmes.'
        },
        {
            title: '3. Comment lire et écrire le nom ?',
            text: 'La fraction 3/5 se lit « trois cinquièmes ». Le nombre du haut est le numérateur : 3. Le nombre du bas est le dénominateur : 5. Dans l’autre sens, si j’entends « quatre septièmes », j’écris 4/7.',
            spoken: 'Trois sur cinq se lit trois cinquièmes. Trois est le numérateur et cinq est le dénominateur. Si j’entends quatre septièmes, j’écris quatre au numérateur et sept au dénominateur : quatre septièmes, quatre sur sept.'
        }
    ];

    let activeLessonSteps = $derived(floorId === 'floor-2' ? floor2LessonSteps : lessonSteps);
    let lessonFraction = $derived(floorId === 'floor-2' ? { numerator: 3, denominator: 5 } : { numerator: 3, denominator: 4 });

    function readCourse() {
        const text = floorId === 'floor-1' || floorId === 'floor-2'
            ? activeLessonSteps[step].spoken
            : `Leçon de l’étage ${floorNum}. Découvrons ensemble comment manipuler les fractions selon le programme HarmoS.`;
        AudioManager.speak(text);
    }
</script>

<div class="lesson-card p-6 bg-white text-slate-800 rounded-3xl max-w-xl mx-auto flex flex-col gap-6 border border-slate-200 shadow-xl">
    <div class="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
            <span class="text-xs font-mono text-cyan-800 uppercase tracking-wider">Personnage-guide · théorie</span>
            <h2 class="text-2xl font-bold mt-1 text-slate-900">{floorId === 'floor-1' ? 'Le partage équitable' : floorId === 'floor-2' ? 'Lire et représenter les fractions' : `Leçon interactive · étage ${floorNum}`}</h2>
        </div>
        <button onclick={readCourse} class="px-4 py-2 bg-cyan-50 text-cyan-900 border border-cyan-200 rounded-xl text-sm font-semibold hover:bg-cyan-100 cursor-pointer flex items-center gap-2 shadow" title="Lire la théorie à voix haute">
            🔊 Écouter
        </button>
    </div>

    {#if floorId === 'floor-1' || floorId === 'floor-2'}
        <div class="flex items-center gap-2" aria-label={`Étape ${step + 1} sur ${activeLessonSteps.length}`}>
            {#each activeLessonSteps as _, i}
                <div class={`h-2 flex-1 rounded-full ${i <= step ? 'bg-cyan-400' : 'bg-slate-700'}`}></div>
            {/each}
        </div>
        <section class="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 leading-relaxed space-y-4">
            <h3 class="text-xl font-bold text-cyan-800">{activeLessonSteps[step].title}</h3>
            <p>{activeLessonSteps[step].text}</p>
            {#if step === 0}
                <div class="rounded-xl bg-white p-4 text-slate-900">
                    <FractionBar numerator={lessonFraction.numerator} denominator={lessonFraction.denominator} color="#1976d2" width={240} showLabel={false} />
                    <p class="text-center font-semibold">{lessonFraction.denominator} parts égales, {lessonFraction.numerator} parts coloriées.</p>
                </div>
            {:else if step === 1}
                <div class="grid grid-cols-2 gap-3">
                    <div class="rounded-xl bg-blue-50 border border-blue-200 p-4 text-center text-blue-900">
                        <div class="text-4xl font-bold">{lessonFraction.numerator}</div><div class="text-sm text-blue-800">Numérateur : parts prises</div>
                    </div>
                    <div class="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center text-emerald-900">
                        <div class="text-4xl font-bold">{lessonFraction.denominator}</div><div class="text-sm text-emerald-800">Dénominateur : parts en tout</div>
                    </div>
                </div>
                <div class="text-center text-3xl font-bold" aria-label="fraction représentée">{lessonFraction.numerator}/{lessonFraction.denominator}</div>
            {:else}
                <div class="rounded-xl bg-white p-4 text-slate-900">
                    <FractionBar numerator={lessonFraction.numerator} denominator={lessonFraction.denominator} color="#1976d2" width={240} showLabel={true} />
                    <p class="text-center">Je compte les parts coloriées : {lessonFraction.numerator}. Je compte toutes les parts égales : {lessonFraction.denominator}.</p>
                </div>
                {#if floorId === 'floor-2'}
                    <div class="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center text-amber-950">
                        <p class="font-semibold">« quatre septièmes »</p>
                        <p>quatre parts prises sur sept parts égales</p>
                        <div class="text-2xl font-extrabold">4/7</div>
                    </div>
                {/if}
                <p class="border-l-4 border-amber-400 bg-amber-50 text-amber-950 p-3 rounded-r-lg">Attention : {floorId === 'floor-1' ? 'si les parts n’ont pas la même taille, elles ne représentent pas des quarts égaux.' : 'pour représenter une fraction, les parts doivent être de même taille.'}</p>
            {/if}
        </section>
        <div class="flex justify-between gap-3">
            <button onclick={() => step = Math.max(0, step - 1)} disabled={step === 0} class="px-5 py-3 bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-40 rounded-xl font-semibold">← Précédent</button>
            {#if step < activeLessonSteps.length - 1}
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
