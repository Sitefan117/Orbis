<script lang="ts">
    /**
     * [Enseignant] TeacherDashboard.svelte
     * Tableau de bord de suivi des élèves : affiche la progression globale,
     * les étoiles par étage, les meilleurs scores et permet de réinitialiser.
     */
    import { onMount } from 'svelte';
    import { ProgressManager, type GameProgress } from '$lib/fractionstower2/persistence/ProgressManager';

    let { onClose } = $props<{
        onClose: () => void;
    }>();

    let progress = $state<GameProgress>(ProgressManager.getDefaultProgress());

    onMount(() => {
        progress = ProgressManager.getProgress();
    });

    // Calcul des statistiques globales
    let totalStars = $derived(() => {
        let count = 0;
        Object.values(progress.floors).forEach(f => count += f.stars);
        return count;
    });

    let completedFloorsCount = $derived(() => {
        let count = 0;
        Object.values(progress.floors).forEach(f => {
            if (f.completed) count++;
        });
        return count;
    });

    function handleReset() {
        if (confirm("Es-tu sûr de vouloir réinitialiser toute la progression de la tour ?")) {
            progress = ProgressManager.resetProgress();
        }
    }
</script>

<div class="dashboard-backdrop">
    <div class="dashboard-content bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 max-w-2xl w-full mx-4 overflow-hidden flex flex-col max-h-[90vh]">
        
        <!-- En-tête -->
        <div class="bg-slate-800 p-6 border-b border-slate-700 flex justify-between items-center">
            <div>
                <span class="text-xs font-mono text-cyan-400 uppercase tracking-wider bg-cyan-950 px-3 py-1 rounded-full border border-cyan-800">
                    Espace Pédagogique
                </span>
                <h2 class="text-2xl font-bold mt-2 text-white">Tableau de Bord Enseignant</h2>
            </div>
            <button 
                onclick={onClose} 
                class="bg-slate-700 hover:bg-slate-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors cursor-pointer"
            >
                ✕
            </button>
        </div>

        <!-- Corps du tableau de bord -->
        <div class="p-6 overflow-y-auto flex-1 space-y-6">
            
            <!-- Résumé global / Statistiques -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-center">
                    <span class="text-xs text-slate-400 uppercase font-mono">Étages validés</span>
                    <p class="text-3xl font-extrabold text-cyan-400 mt-1">{completedFloorsCount()} / 9</p>
                </div>
                <div class="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-center">
                    <span class="text-xs text-slate-400 uppercase font-mono">Étoiles récoltées</span>
                    <p class="text-3xl font-extrabold text-amber-400 mt-1">⭐ {totalStars()} / 27</p>
                </div>
                <div class="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-center">
                    <span class="text-xs text-slate-400 uppercase font-mono">Boss final</span>
                    <p class="text-xl font-bold mt-2 {progress.bossUnlocked.final ? 'text-emerald-400' : 'text-slate-500'}">
                        {progress.bossUnlocked.final ? '🏆 Débloqué' : '🔒 Verrouillé'}
                    </p>
                </div>
            </div>

            <!-- Détail par étage -->
            <div>
                <h3 class="text-lg font-bold mb-3 text-slate-200">Progression détaillée par palier</h3>
                <div class="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
                                <th class="p-3">Étage</th>
                                <th class="p-3">Statut</th>
                                <th class="p-3 text-center">Étoiles</th>
                                <th class="p-3 text-right">Meilleur score</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-800/60 text-sm">
                            {#each Object.entries(progress.floors) as [floorKey, data]}
                                <tr class="hover:bg-slate-9rip/50 transition-colors">
                                    <td class="p-3 font-semibold text-slate-200">
                                        Étage {floorKey.replace('floor-', '')}
                                    </td>
                                    <td class="p-3">
                                        {#if data.completed}
                                            <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">Maîtrisé</span>
                                        {:else if data.unlocked}
                                            <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-950 text-cyan-300 border border-cyan-800">En cours</span>
                                        {:else}
                                            <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400">Verrouillé</span>
                                        {/if}
                                    </td>
                                    <td class="p-3 text-center font-mono">
                                        {#if data.stars > 0}
                                            {"⭐".repeat(data.stars)}{"☆".repeat(3 - data.stars)}
                                        {:else}
                                            <span class="text-slate-600">-</span>
                                        {/if}
                                    </td>
                                    <td class="p-3 text-right font-mono text-slate-300">
                                        {data.bestScore} / 10
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Actions enseignant -->
            <div class="pt-2 flex justify-between items-center border-t border-slate-800">
                <button 
                    onclick={handleReset}
                    class="px-4 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                    Réinitialiser les données
                </button>
                <button 
                    onclick={onClose}
                    class="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-semibold transition-colors cursor-pointer"
                >
                    Fermer
                </button>
            </div>

        </div>
    </div>
</div>

<style>
    .dashboard-backdrop {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.85); display: flex; justify-content: center; align-items: center; z-index: 1100; backdrop-filter: blur(6px);
    }
</style>