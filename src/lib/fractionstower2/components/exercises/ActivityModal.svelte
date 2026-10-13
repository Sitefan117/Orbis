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
    import { onMount } from 'svelte';

    let { activityId, onClose } = $props<{
        activityId: string; // Ex: "floor-2-training", "floor-2-course", "floor-2-boss"
        onClose: () => void;
    }>();

    onMount(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    });

    let normalizedId = $derived(String(activityId || '').toLowerCase());
    
    // Extraction sécurisée du numéro de l'étage
    let floorNumber = $derived(
        normalizedId.match(/(\d+)/)?.[1] 
            ? `floor-${normalizedId.match(/(\d+)/)![1]}` 
            : 'floor-2'
    );

    // Analyse prioritaire du type d'activité :
    // 1. Si l'ID contient 'training' ou 'train' -> Entraînement (Guerrier en armure)
    // 2. Si l'ID contient 'boss' -> Combat de Boss (Monstre rouge)
    // 3. Si l'ID contient 'course', 'theory' ou 'intro' -> Leçon interactive (Moustachu)
    let activityType = $derived(
        normalizedId.includes('training') || normalizedId.includes('train')
            ? 'training'
            : normalizedId.includes('boss')
                ? 'boss'
                : normalizedId.includes('course') || normalizedId.includes('theory') || normalizedId.includes('intro')
                    ? 'course'
                    : 'training'
    );

    function handleComplete(finalScore: number = 10) {
        AudioManager.playSuccess();
        ProgressManager.recordFloorCompletion(floorNumber, finalScore, activityType === 'boss' ? 20 : 10);
        setTimeout(() => {
            onClose();
        }, 1500);
    }
</script>

<div class="modal-backdrop" role="presentation">
    <div class={`modal-content ${activityType === 'course' ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-700'} rounded-3xl shadow-2xl max-w-3xl w-full mx-4 overflow-hidden flex flex-col max-h-[92vh]`} style={`background:${activityType === 'course' ? '#fffdf7' : '#0f172a'};color:${activityType === 'course' ? '#1f2937' : '#f8fafc'};border:1px solid ${activityType === 'course' ? '#e7dcc8' : '#334155'};`} role="dialog" aria-modal="true" aria-label={activityType === 'course' ? 'Leçon interactive' : activityType === 'boss' ? 'Combat de boss' : 'Session d’entraînement'}>
        
        <!-- En-tête de la modale -->
        <div class={`${activityType === 'course' ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/90 border-slate-700'} p-4 px-6 border-b flex justify-between items-center`} style={`background:${activityType === 'course' ? '#f5f0e6' : '#1e293b'};border-color:${activityType === 'course' ? '#e7dcc8' : '#334155'};`}>
            <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-cyan-500 animate-pulse"></span>
                <span class={`font-mono text-sm ${activityType === 'course' ? 'text-cyan-800' : 'text-cyan-400'} font-bold uppercase tracking-wider`} style={`color:${activityType === 'course' ? '#155e75' : '#67e8f9'};`}>
                    {activityType === 'course' ? '📖 Leçon interactive' : activityType === 'boss' ? '⚔️ Combat de Boss' : '🎯 Session d\'entraînement'} ({floorNumber.toUpperCase()})
                </span>
            </div>
            <button 
                onclick={onClose}
                class={`${activityType === 'course' ? 'bg-slate-200 hover:bg-slate-300 text-slate-900' : 'bg-slate-700 hover:bg-slate-600 text-white'} w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg transition-colors cursor-pointer`}
                title="Fermer (Échap)"
                aria-label="Fermer la fenêtre"
            >
                ✕
            </button>
        </div>

        <!-- Corps de la modale : Affichage de l'activité correspondante -->
        <div class="modal-body p-6 overflow-y-auto flex-1" style={`background:${activityType === 'course' ? '#fffdf7' : '#f8fafc'};color:${activityType === 'course' ? '#1f2937' : '#1f2937'};`}>
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
    .modal-content { box-sizing: border-box; max-height: 92vh; }
    .modal-body { color: #1f2937; }
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(2, 6, 23, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(8px);
    }
</style>