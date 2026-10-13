<script lang="ts">
    /**
     * [Carte] TowerMap.svelte
     * Carte interactive de la tour affichant les 9 étages empilés,
     * les états de déverrouillage, les étoiles et l'accès aux activités.
     */
    import { onMount } from 'svelte';
    import { ProgressManager, type GameProgress } from '$lib/fractionstower2/persistence/ProgressManager';

    let { onSelectActivity, onOpenTeacherDashboard } = $props<{
        onSelectActivity: (activityId: string) => void;
        onOpenTeacherDashboard: () => void;
    }>();

    let progress = $state<GameProgress>(ProgressManager.getProgress());

    // Rafraîchir la progression à chaque fois que la carte s'affiche
    onMount(() => {
        progress = ProgressManager.getProgress();
    });

    // Données textuelles des 9 étages (adaptées programme HarmoS / Enseignement spécialisé)
    const floorDetails: Record<number, { title: string; subtitle: string; color: string }> = {
        9: { title: "Sommet : Fractions Impropres", subtitle: "Fractions supérieures à 1 & Nombres mixtes", color: "from-amber-600 to-yellow-500 border-amber-400" },
        8: { title: "Étage 8 : Dénominateurs Différents", subtitle: "Addition avec conversion préalable", color: "from-purple-600 to-indigo-600 border-purple-400" },
        7: { title: "Étage 7 : Additions Simples", subtitle: "Même dénominateur (parts identiques)", color: "from-blue-600 to-cyan-600 border-blue-400" },
        6: { title: "Étage 6 : Fractions Décimales", subtitle: "Passage aux dixièmes et centièmes", color: "from-emerald-600 to-teal-600 border-emerald-400" },
        5: { title: "Étage 5 : Comparaison & Boss Bilan", subtitle: "Plus grand, plus petit (=, <, >)", color: "from-amber-500 to-orange-600 border-amber-400" },
        4: { title: "Étage 4 : Fractions Équivalentes", subtitle: "Des écritures différentes pour une même part", color: "from-cyan-600 to-blue-500 border-cyan-400" },
        3: { title: "Étage 3 : Droite Graduée", subtitle: "Situer les fractions sur une ligne", color: "from-indigo-600 to-violet-600 border-indigo-400" },
        2: { title: "Étage 2 : Lecture & Représentation", subtitle: "Associer figure et écriture fractionnaire", color: "from-sky-600 to-blue-600 border-sky-400" },
        1: { title: "Étage 1 : Les Bases", subtitle: "Découverte de l'unité et des parts", color: "from-slate-700 to-slate-600 border-slate-500" },
    };

    function handleFloorClick(floorNum: number) {
        const floorId = `floor-${floorNum}`;
        const floorData = progress.floors[floorId];

        if (!floorData || !floorData.unlocked) {
            alert("🔒 Cet étage est encore verrouillé. Réussis l'étage précédent pour l'ouvrir !");
            return;
        }

        // Proposer soit le cours, soit l'entraînement
        onSelectActivity(`floor-${floorNum}-training`);
    }

    function handleCourseClick(floorNum: number, e: MouseEvent) {
        e.stopPropagation();
        onSelectActivity(`floor-${floorNum}-course`);
    }
</script>

<div class="tower-map-container bg-slate-950 text-white min-h-screen p-6 flex flex-col items-center">
    
    <!-- En-tête du jeu -->
    <header class="w-full max-w-3xl flex justify-between items-center mb-8 bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div>
            <span class="text-xs font-mono text-cyan-400 tracking-widest uppercase bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-800">
                Programme HarmoS • Spécialisé
            </span>
            <h1 class="text-3xl font-extrabold mt-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                FRACTION TOWER 2
            </h1>
        </div>
        <button 
            onclick={onOpenTeacherDashboard}
            class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            title="Espace Enseignant"
        >
            <span>👩‍🏫</span>
            <span class="hidden sm:inline">Tableau de bord</span>
        </button>
    </header>

    <!-- Conteneur de la Tour (Empilement du sommet 9 vers la base 1) -->
    <div class="w-full max-w-2xl flex flex-col gap-4 mb-12">
        
        {#each [9, 8, 7, 6, 5, 4, 3, 2, 1] as floorNum}
            {@const floorId = `floor-${floorNum}`}
            {@const floorData = progress.floors[floorId] || { unlocked: false, stars: 0, completed: false }}
            {@const details = floorDetails[floorNum]}

            <div 
                role="button"
                tabindex="0"
                class="relative p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group {floorData.unlocked ? `bg-slate-900/90 hover:bg-slate-900 border-opacity-100 cursor-pointer shadow-lg hover:scale-[1.02] ${details.color}` : 'bg-slate-900/40 border-slate-800 opacity-60 cursor-not-allowed'}"
                onclick={() => handleFloorClick(floorNum)}
                onkeydown={(e) => e.key === 'Enter' && handleFloorClick(floorNum)}
            >
                <!-- Infos de l'étage -->
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-xl bg-slate-950 border border-slate-800 shadow-inner">
                        {#if floorData.unlocked}
                            {floorNum}
                        {:else}
                            🔒
                        {/if}
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="font-bold text-lg text-slate-100">{details.title}</h3>
                            {#if floorData.completed}
                                <span class="bg-emerald-950 text-emerald-300 text-xs px-2 py-0.5 rounded border border-emerald-800 font-mono">Validé</span>
                            {/if}
                        </div>
                        <p class="text-xs text-slate-400 mt-0.5">{details.subtitle}</p>
                    </div>
                </div>

                <!-- Actions et Étoiles -->
                <div class="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <!-- Étoiles -->
                    <div class="font-mono text-lg tracking-wider">
                        {#if floorData.unlocked}
                            {"⭐".repeat(floorData.stars)}{"☆".repeat(3 - floorData.stars)}
                        {:else}
                            <span class="text-xs text-slate-500 font-sans">Verrouillé</span>
                        {/if}
                    </div>

                    <!-- Bouton Cours interactif -->
                    {#if floorData.unlocked}
                        <button 
                            onclick={(e) => handleCourseClick(floorNum, e)}
                            class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow"
                            title="Voir le cours interactif"
                        >
                            <span>📖</span>
                            <span class="hidden sm:inline">Cours</span>
                        </button>
                    {/if}
                </div>
            </div>
        {/each}

    </div>
</div>

<style>
    .tower-map-container {
        font-family: system-ui, -apple-system, sans-serif;
    }
</style>