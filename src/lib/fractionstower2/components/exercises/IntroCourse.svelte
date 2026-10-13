<script lang="ts">
    /**
     * ============================================================================
     * [ACTIVITÉ] IntroCourse.svelte
     * ============================================================================
     * Affiche la leçon interactive de l'étage avec lecture vocale intégrée
     * pour accompagner les élèves en difficulté de lecture.
     * ============================================================================
     */
    import { AudioManager } from '$lib/fractionstower2/audio/AudioManager';

    let { floorId = 'floor-1', onComplete } = $props<{
        floorId?: string;
        onComplete: () => void;
    }>();

    let floorNum = $derived(floorId.replace('floor-', ''));

    function readCourse() {
        AudioManager.speak(`Leçon de l'étage ${floorNum}. Découvrons ensemble comment manipuler les fractions selon le programme HarmoS.`);
    }
</script>

<div class="p-6 bg-slate-900 text-white rounded-3xl max-w-xl mx-auto flex flex-col gap-6 border border-slate-800 shadow-2xl">
    <div class="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
            <span class="text-xs font-mono text-cyan-400 uppercase tracking-wider">Leçon interactive</span>
            <h2 class="text-2xl font-bold mt-1 text-slate-100">Étage {floorNum}</h2>
        </div>
        <button 
            onclick={readCourse}
            class="px-4 py-2 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-xl text-sm font-semibold hover:bg-cyan-900 cursor-pointer flex items-center gap-2 shadow"
        >
            <span>🔊</span> Écouter
        </button>
    </div>

    <div class="p-5 bg-slate-950 rounded-2xl border border-slate-800 text-slate-300 leading-relaxed text-base space-y-3">
        <p>Bienvenue dans cette capsule d'apprentissage ! Une fraction permet de représenter des parts égales d'une unité.</p>
        <p class="text-cyan-300 font-medium">Observe bien les figures géométriques et les barres de partage pour associer chaque quantité à son écriture mathématique.</p>
    </div>

    <div class="flex justify-end pt-2">
        <button 
            onclick={onComplete}
            class="px-6 py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors shadow-lg cursor-pointer"
        >
            J'ai compris, passer aux exercices ➔
        </button>
    </div>
</div>