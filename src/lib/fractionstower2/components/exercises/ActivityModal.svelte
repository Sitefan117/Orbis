<!-- 
  =============================================================================
  COMPOSANT : ActivityModal.svelte (Version Globale & Commentée)
  DESCRIPTION : Modale principale qui s'ouvre lorsqu'on clique sur un étage.
  - Détecte automatiquement l'étage actif (de 1 à 9).
  - Affiche un titre personnalisé.
  - Aiguille vers le cours, l'entraînement, ou le boss unifié.
  =============================================================================
-->

<script lang="ts">
    import IntroCourse from '$lib/fractionstower2/components/course/IntroCourse.svelte';
    import TrainingSession from '$lib/fractionstower2/components/exercises/TrainingSession.svelte';
    import BossBattle from '$lib/fractionstower2/components/exercises/BossBattle.svelte';

    let { activityId, onClose, game } = $props<{
        activityId: string;
        onClose: () => void;
        game: any;
    }>();

    // Détection universelle du floorId (de 1 à 9) à partir de l'identifiant d'activité
    const detectedFloorId = $derived.by(() => {
        for (let i = 9; i >= 1; i--) {
            if (activityId.includes(`floor-${i}`)) return `floor-${i}`;
        }
        const parts = activityId.split('-');
        if (parts.length >= 2 && parts[0] === 'floor') {
            return `${parts[0]}-${parts[1]}`;
        }
        return 'floor-1';
    });

    // Fermeture de la modale avec la touche Échap
    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            onClose();
        }
    }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="modal-backdrop">
    <div class="modal-content">
        <div class="header">
            <h2 style="margin: 0; font-size: 1.5rem;">
                {#if detectedFloorId === 'floor-5' && activityId.includes('boss')}
                    ⚡ Boss Bilan (Étages 1 à 5) ⚡
                {:else if detectedFloorId === 'floor-8' && activityId.includes('boss')}
                    ⚔️ Grand Boss Final de la Tour ⚔️
                {:else if detectedFloorId === 'floor-1'}
                    Entraînement : Bases
                {:else if detectedFloorId === 'floor-2'}
                    Entraînement : Lecture et Représentation
                {:else if detectedFloorId === 'floor-3'}
                    Entraînement : Droite Graduée
                {:else if detectedFloorId === 'floor-4'}
                    Entraînement : Fractions Équivalentes
                {:else if detectedFloorId === 'floor-5'}
                    Entraînement : Comparaison
                {:else if detectedFloorId === 'floor-6'}
                    Entraînement : Fractions Décimales
                {:else if detectedFloorId === 'floor-7'}
                    Entraînement : Addition (Même dénominateur)
                {:else if detectedFloorId === 'floor-8'}
                    Entraînement : Dénominateurs Différents
                {:else if detectedFloorId === 'floor-9'}
                    Entraînement : Étage Final (9)
                {:else if activityId.includes('course')}
                    Le Cours
                {:else}
                    Entraînement : Étage {detectedFloorId.replace('floor-', '')}
                {/if}
            </h2>
            <button class="close-btn" onclick={onClose}>✕</button>
        </div>

        <div class="body">
            {#if activityId.includes('course') && !activityId.includes('training')}
                <!-- Affichage du module de cours théorique -->
                <IntroCourse onComplete={onClose} />
            {:else if activityId.includes('boss') || detectedFloorId === 'floor-5' || detectedFloorId === 'floor-8'}
                <!-- Appel du Boss unifié (Bilan de l'étage 5 ou Boss final de l'étage 8) -->
                <BossBattle floorId={detectedFloorId} onComplete={onClose} {game} />
            {:else}
                <!-- Appel de la session d'entraînement classique pour l'étage -->
                <TrainingSession floorId={detectedFloorId} onComplete={onClose} />
            {/if}
        </div>
    </div>
</div>

<style>
    .modal-backdrop {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.85); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(4px);
    }
    .modal-content {
        background: #f9f9f9; width: 90%; max-width: 700px; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4); display: flex; flex-direction: column;
    }
    .header { background: #3498db; color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
    .close-btn { background: transparent; border: none; color: white; font-size: 1.5rem; cursor: pointer; opacity: 0.7; }
    .close-btn:hover { opacity: 1; }
    .body { padding: 20px; min-height: 450px; display: flex; justify-content: center; align-items: center; }
</style>