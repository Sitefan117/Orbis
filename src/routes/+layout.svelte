<script lang="ts">
  // Charge les styles une seule fois pour l’ensemble des routes.
  import '../app.css';
  import { onMount } from 'svelte';
  import { updated } from '$app/stores';

  onMount(() => {
    const checkForUpdate = () => void updated.check();
    const checkWhenVisible = () => {
      if (!document.hidden) checkForUpdate();
    };

    window.addEventListener('focus', checkForUpdate);
    document.addEventListener('visibilitychange', checkWhenVisible);

    return () => {
      window.removeEventListener('focus', checkForUpdate);
      document.removeEventListener('visibilitychange', checkWhenVisible);
    };
  });
</script>

{#if $updated}
  <aside class="orbis-update" role="status" aria-live="polite">
    <span><strong>Orbis a été mis à jour.</strong> Recharge pour utiliser la dernière version.</span>
    <button type="button" onclick={() => window.location.reload()}>Mettre à jour</button>
  </aside>
{/if}

<!-- SvelteKit insère ici le contenu de la page courante. -->
<slot />

<style>
  .orbis-update {
    position: fixed;
    z-index: 10000;
    right: 1rem;
    bottom: 1rem;
    left: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    max-width: 46rem;
    margin: 0 auto;
    padding: 0.85rem 1rem;
    border: 1px solid #69d7c4;
    border-radius: 0.8rem;
    background: #102d32;
    color: #f7fffd;
    box-shadow: 0 0.8rem 2.5rem rgb(0 0 0 / 35%);
    font: 500 0.95rem/1.35 system-ui, sans-serif;
  }

  .orbis-update button {
    flex: 0 0 auto;
    min-height: 2.65rem;
    padding: 0.55rem 0.9rem;
    border: 2px solid #f7fffd;
    border-radius: 0.55rem;
    background: #69d7c4;
    color: #08272b;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .orbis-update button:focus-visible {
    outline: 3px solid #ffd166;
    outline-offset: 3px;
  }

  @media (max-width: 38rem) {
    .orbis-update {
      align-items: stretch;
      flex-direction: column;
      gap: 0.7rem;
    }
  }
</style>
