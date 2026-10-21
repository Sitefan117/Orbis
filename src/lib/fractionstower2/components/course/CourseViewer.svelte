
<script lang="ts">
  import { onMount } from 'svelte';
  import { languageState } from '$lib/fractionstower2/persistence/LanguageManager';

  // Identifiant de l'étage transmis par le jeu, par exemple "floor-2".
  let {
    floorId,
    onClose
  }: {
    floorId: string;
    onClose: () => void;
  } = $props();

  // Le document complet est chargé dans une iframe.
  // Ses scripts peuvent ainsi gérer les traductions, les réponses,
  // les zones de dessin et les corrigés sans être bloqués par {@html}.
// Utilise le préfixe de déploiement défini dans svelte.config.js.
// En production, cela ajoute /ma-classeV3 au chemin du cours.
import { base } from '$app/paths';

const courseUrl = `${base}/fractionstower2/courses/support_etage_complet.html`;
// Diagnostic temporaire : afficher le chemin calculé.

// Fermer le cours avec la touche Échap.
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
</script>

<div class="course-overlay">
  <div
    class="course-window"
    role="dialog"
    aria-modal="true"
    aria-label="Cours de mathématiques"
  >
    <header class="course-header">
      <div>
        <h1>
          {languageState.current.startsWith('fr')
            ? 'Guide académique — Cours classique'
            : 'Академический гид — Классический курс'}
        </h1>

        <p>Module : {floorId.toUpperCase()}</p>
      </div>

      <button
        class="close-btn"
        type="button"
        onclick={onClose}
        aria-label="Fermer le cours"
        title="Fermer le cours (Échap)"
      >
        ✕
      </button>
    </header>

    <!--
      L'iframe charge le document HTML complet.
      Ses propres styles et scripts restent actifs.
      Il contient déjà les boutons de traduction, le brouillon,
      les réponses interactives et les corrigés.
    -->
      
    <iframe
      class="course-frame"
      src={courseUrl}
      title="Cahier de mathématiques interactif"
    ></iframe>
  </div>
</div>

<style>
  .course-overlay {
    position: fixed;
    inset: 0;
    z-index: 3000;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(5px);
  }

  .course-window {
    width: 95%;
    max-width: 1200px;
    height: 94vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  }

  .course-header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.8rem 1.25rem;
    color: white;
    background: #1a237e;
  }

  .course-header h1 {
    margin: 0;
    font-size: 1.2rem;
  }

  .course-header p {
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
  }

  .close-btn {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 8px;
    color: white;
    background: transparent;
    font-size: 1.4rem;
    cursor: pointer;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .course-frame {
    display: block;
    flex: 1;
    width: 100%;
    min-height: 0;
    border: 0;
    background: white;
  }

  @media (max-width: 600px) {
    .course-overlay {
      padding: 0;
    }

    .course-window {
      width: 100%;
      height: 100dvh;
      border-radius: 0;
    }

    .course-header {
      padding: 0.7rem 0.9rem;
    }

    .course-header h1 {
      font-size: 1rem;
    }
  }
</style>
