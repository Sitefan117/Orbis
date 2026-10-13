<script lang="ts">
    /**
     * ============================================================================
     * [MODALE] ActivityModal.svelte
     * ============================================================================
     * Routeur de modale : interprète l'identifiant de l'activité demandé 
     * et charge le composant adéquat (IntroCourse, TrainingSession, BossBattle).
     * Enregistre automatiquement la progression via ProgressManager en cas de succès.
     * ============================================================================
     */
    import IntroCourse from '$lib/fractionstower2/components/exercises/IntroCourse.svelte';
    import TrainingSession from '$lib/fractionstower2/components/exercises/TrainingSession.svelte';
    import BossBattle from '$lib/fractionstower2/components/exercises/BossBattle.svelte';
    import { ProgressManager } from '$lib/fractionstower2/persistence/ProgressManager';
    import { AudioManager } from '$lib/fractionstower2/audio/AudioManager';

    let { activityId, onClose } = $props<{
        activityId: string; // Ex: "floor-3-training", "floor-5-boss", "floor-1-course"
        onClose: () => void;
    }>();

    // Analyse de l'ID pour extraire le numéro d'étage et le type d'activité
    // Format attendu : "floor-{num}-{type}" (type = course, training, boss)
    let parts = $derived(activityId.split('-'));
    let floorNumber = $derived(parts[1] ? `floor-${parts[1]}` : 'floor-1');
    let activityType = $derived(parts[2] || 'training');

    /**
     * Appelée lorsque l'élève termine avec succès un entraînement ou un boss.
     * @param finalScore Score obtenu par l'élève
     */
    function handleComplete(finalScore: number = 10) {
        AudioManager.playSuccess();
        
        // Enregistrement de la réussite dans le localStorage via le gestionnaire
        ProgressManager.recordFloorCompletion(floorNumber, finalScore, activityType === 'boss' ? 20 : 10);
        
        // Fermeture de la modale après un court délai pour apprécier la victoire
        setTimeout(() => {
            onClose();
        }, 1500);
    }
</script>

<div class="modal-backdrop">
    <div class="modal-content bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-3xl w-full mx-4 overflow-hidden flex flex-col max-h-[92vh]">
        
        <!-- En-tête de la modale -->
        <div class="bg-slate-800/90 p-4 px-6 border-b border-slate-700 flex justify-between items-center">
            <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-cyan-500 animate-pulse"></span>
                <span class="font-mono text-sm text-cyan-400 font-bold uppercase tracking-wider">
                    {activityType === 'course' ? '📖 Leçon interactive' : activityType === 'boss' ? '⚔️ Combat de Boss' : '🎯 Session d\'entraînement'} ({floorNumber.toUpperCase()})
                </span>
            </div>
            <button 
                onclick={onClose}
                class="bg-slate-700 hover:bg-slate-600 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg transition-colors cursor-pointer"
                title="Fermer"
            >
                ✕
            </button>
        </div>

        <!-- Corps de la modale : Affichage de l'activité correspondante -->
        <div class="p-6 overflow-y-auto flex-1">
            {#if activityType === 'course'}
                <IntroCourse 
                    floorId={floorNumber} 
                    onComplete={() => onClose()} 
                />
            {:else if activityType === 'boss'}
                <BossBattle 
                    floorId={floorNumber} 
                    onComplete={(score) => handleComplete(score)} 
                />
            {:else}
                <TrainingSession 
                    floorId={floorNumber} 
                    onComplete={() => handleComplete(10)} 
                />
            {/if}
        </div>

    </div>
</div>

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vw;
        background: rgba(2, 6, 23, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(8px);
    }
</style>