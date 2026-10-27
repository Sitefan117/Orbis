
<script lang="ts">
  /**
   * Routeur de modale pour le cours, l'entraînement et le boss.
   * Transmet les scores réels et utilise le bon nombre de questions
   * pour calculer la progression.
   */
  import { onMount } from 'svelte';
  import IntroCourse from '$lib/games/fractionstower2/components/exercises/IntroCourse.svelte';
  import TrainingSession from '$lib/games/fractionstower2/components/exercises/TrainingSession.svelte';
  import BossBattle from '$lib/games/fractionstower2/components/exercises/BossBattle.svelte';
  import { ProgressManager } from '$lib/games/fractionstower2/persistence/ProgressManager';
  import { AudioManager } from '$lib/games/fractionstower2/audio/AudioManager';

  // Typage des propriétés : syntaxe compatible avec l'erreur rencontrée.
  let {
    activityId,
    onClose
  }: {
    activityId: string;
    onClose: () => void;
  } = $props();

  onMount(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  });

  let normalizedId = $derived(
    String(activityId || '').toLowerCase()
  );

  let floorNumber = $derived(
    normalizedId.match(/(\d+)/)?.[1]
      ? `floor-${normalizedId.match(/(\d+)/)![1]}`
      : 'floor-2'
  );

  let activityType = $derived(
    normalizedId.includes('training') || normalizedId.includes('train')
      ? 'training'
      : normalizedId.includes('boss')
        ? 'boss'
        : normalizedId.includes('course') ||
          normalizedId.includes('theory') ||
          normalizedId.includes('intro')
          ? 'course'
          : 'training'
  );

  function handleComplete(finalScore: number = 10) {
    if (typeof (AudioManager as any).play === 'function') {
      (AudioManager as any).play('success');
    } else if (typeof (AudioManager as any).playSuccess === 'function') {
      (AudioManager as any).playSuccess();
    }

    const totalQuestions = activityType === 'boss' ? 18 : 10;

    ProgressManager.recordFloorCompletion(
      floorNumber,
      finalScore,
      totalQuestions
    );

    setTimeout(() => onClose(), 1500);
  }
</script>

<div class="modal-backdrop" role="presentation">
  <div
    class={`modal-content ${activityType === 'course' ? 'course-theme' : 'game-theme'} ${activityType}-role`}
    role="dialog"
    aria-modal="true"
    aria-label={
      activityType === 'course'
        ? 'Leçon interactive'
        : activityType === 'boss'
          ? 'Combat de boss'
          : 'Session d’entraînement'
    }
  >
    <header class="modal-header">
      <div class="header-label">
        <span class="status-dot"></span>
        <span>
          {
            activityType === 'course'
              ? '📖 Leçon interactive'
              : activityType === 'boss'
                ? '⚔️ Combat de Boss'
                : '🎯 Session d’entraînement'
          }
          ({floorNumber.toUpperCase()})
        </span>
      </div>

      <button
        type="button"
        onclick={onClose}
        class="close-btn"
        title="Fermer (Échap)"
        aria-label="Fermer la fenêtre"
      >
        ✕
      </button>
    </header>

    <div class="modal-body">
      {#if activityType === 'course'}
        <IntroCourse
          floorId={floorNumber}
          onComplete={() => onClose()}
        />
      {:else if activityType === 'boss'}
        <BossBattle
          floorId={floorNumber}
          onComplete={(score?: number) => handleComplete(score ?? 0)}
          onClose={onClose}
        />
      {:else}
        <TrainingSession
          floorId={floorNumber}
          onComplete={(score: number) => handleComplete(score)}
        />
      {/if}
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(2, 6, 23, .85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(8px);
  }

  .modal-content {
    box-sizing: border-box;
    max-height: 92vh;
    width: min(calc(100% - 2rem), 900px);
    border-radius: 1.5rem;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 50px rgba(0, 0, 0, .35);
    border: 1px solid;
  }

  .course-theme {
    background: #fffdf7;
    color: #1f2937;
    border-color: #e7dcc8;
  }

  .game-theme {
    background: #0f172a;
    color: #f8fafc;
    border-color: #334155;
  }

  .modal-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: .75rem;
    background: #1e293b;
    border-color: #334155;
  }

  .course-theme .modal-header {
    background: #f5f0e6;
    border-color: #e7dcc8;
  }

  .header-label {
    display: flex;
    align-items: center;
    gap: .65rem;
    color: #67e8f9;
    font: 800 .85rem ui-monospace, monospace;
    letter-spacing: .04em;
    text-transform: uppercase;
  }

  .course-theme .header-label {
    color: #155e75;
  }

  .status-dot {
    width: .7rem;
    height: .7rem;
    border-radius: 50%;
    background: #06b6d4;
    flex-shrink: 0;
  }

  .close-btn {
    width: 2.25rem;
    height: 2.25rem;
    border: 0;
    border-radius: 50%;
    background: #475569;
    color: #fff;
    font-size: 1.1rem;
    cursor: pointer;
  }

  .course-theme .close-btn {
    background: #e2e8f0;
    color: #0f172a;
  }

  .modal-body {
    overflow-y: auto;
    flex: 1;
    min-height: 0;
    padding: 1.25rem;
    background: #f8fafc;
    color: #1f2937;
  }

  .course-theme .modal-body {
    background: #fffdf7;
  }

  /* Les trois activités gardent une base commune et une petite couleur repère. */
  .course-role { --role-accent: var(--fraction-theory); }
  .training-role { --role-accent: var(--fraction-training); }
  .boss-role { --role-accent: var(--fraction-boss); }
  .modal-content,
  .course-theme,
  .game-theme {
    background: var(--fraction-paper);
    color: var(--fraction-ink);
    border-color: var(--fraction-line);
  }
  .modal-header,
  .course-theme .modal-header {
    color: #fff8e8;
    background: linear-gradient(110deg, var(--fraction-forest), color-mix(in srgb, var(--fraction-forest) 78%, var(--role-accent, var(--fraction-theory))));
    border-color: color-mix(in srgb, var(--fraction-gold) 65%, transparent);
  }
  .header-label,
  .course-theme .header-label { color: #fff4d9; }
  .status-dot { background: var(--role-accent, var(--fraction-theory)); }
  .close-btn,
  .course-theme .close-btn {
    border: 1px solid rgba(255, 233, 187, .65);
    color: #fff8e8;
    background: rgba(255, 255, 255, .12);
  }
  .close-btn:hover { background: rgba(255, 255, 255, .2); }
  .modal-body,
  .course-theme .modal-body { background: var(--fraction-parchment); color: var(--fraction-ink); }

  @media (max-width: 520px) {
    .modal-header {
      padding: .8rem 1rem;
    }

    .header-label {
      font-size: .72rem;
    }

    .modal-body {
      padding: .75rem;
    }
  }
</style>
