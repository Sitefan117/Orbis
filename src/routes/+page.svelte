<script lang="ts">
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import { clearStudentName, getStudentName, storeStudentName } from '$lib/client/activity';
  import { worlds } from '$lib/worlds';
  import { labModules } from '$lib/modules';

  // =========================================================
  // ÉTAT DE LA PAGE ET PROFIL ÉLÈVE
  // =========================================================
  let ready = false;
  let studentName = '';
  let nameInput = '';
  let currentView: 'HUB' | 'ARCADE' | 'LAB' = 'HUB';

  // Filtres de l'Arcade : les matières sont définies explicitement dans worlds.ts.
  let selectedArcadeCategory = 'TOUS';
  const arcadeCategories = ['TOUS', 'MATHS', 'FRANÇAIS', 'SCIENCES', 'AUTRES', 'À CLASSER'];

  const statusLabels = {
    available: 'Disponible',
    development: 'En développement',
    prototype: 'Prototype'
  } as const;

  // Navigation du Learning Lab : matière puis domaine.
  let selectedSubject: string | null = null;
  let selectedDomain: string | null = null;

  // =========================================================
  // PRÉFÉRENCES D'AFFICHAGE ORBIS
  // Enregistrées dans le navigateur, indépendamment du profil.
  // =========================================================
  type OrbisTheme = 'light' | 'dark';
  type BooleanPreference = 'largeText' | 'comfortableSpacing' | 'highContrast' | 'reduceMotion';

  interface OrbisPreferences {
    theme: OrbisTheme;
    largeText: boolean;
    comfortableSpacing: boolean;
    highContrast: boolean;
    reduceMotion: boolean;
  }

  let theme: OrbisTheme = 'light';
  let settingsOpen = false;
  let largeText = false;
  let comfortableSpacing = false;
  let highContrast = false;
  let reduceMotion = false;

  // Charge le profil et les préférences uniquement côté navigateur.
  onMount(() => {
    const storedName = getStudentName('');
    studentName = storedName;
    nameInput = storedName;

    try {
      const raw = localStorage.getItem('orbis-preferences');
      if (raw) {
        const saved = JSON.parse(raw) as Partial<OrbisPreferences>;
        if (saved.theme === 'light' || saved.theme === 'dark') theme = saved.theme;
        largeText = saved.largeText === true;
        comfortableSpacing = saved.comfortableSpacing === true;
        highContrast = saved.highContrast === true;
        reduceMotion = saved.reduceMotion === true;
      }
    } catch {
      // Si les données sont illisibles, on garde les réglages par défaut.
    }

    applyOrbisPreferences();
    ready = true;
  });

  // Applique les préférences au document pour que le CSS les utilise.
  function applyOrbisPreferences() {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.textSize = largeText ? 'large' : 'normal';
    root.dataset.spacing = comfortableSpacing ? 'comfortable' : 'normal';
    root.dataset.contrast = highContrast ? 'high' : 'normal';
    root.dataset.motion = reduceMotion ? 'reduced' : 'normal';
  }

  // Enregistre les réglages et les applique immédiatement.
  function saveOrbisPreferences() {
    const preferences: OrbisPreferences = {
      theme,
      largeText,
      comfortableSpacing,
      highContrast,
      reduceMotion
    };

    applyOrbisPreferences();

    try {
      localStorage.setItem('orbis-preferences', JSON.stringify(preferences));
    } catch {
      // Les réglages restent actifs jusqu'au rechargement si le stockage échoue.
    }
  }

  function setOrbisTheme(nextTheme: OrbisTheme) {
    theme = nextTheme;
    saveOrbisPreferences();
  }

  function setBooleanPreference(preference: BooleanPreference, event: Event) {
    const enabled = (event.currentTarget as HTMLInputElement).checked;

    // Chaque préférence est indépendante des autres.
    switch (preference) {
      case 'largeText': largeText = enabled; break;
      case 'comfortableSpacing': comfortableSpacing = enabled; break;
      case 'highContrast': highContrast = enabled; break;
      case 'reduceMotion': reduceMotion = enabled; break;
    }

    saveOrbisPreferences();
  }

  // =========================================================
  // PROFIL ÉLÈVE
  // =========================================================
  function login() {
    const nextName = nameInput.trim();
    if (nextName.length < 2) return;

    studentName = nextName;
    storeStudentName(nextName);
  }

  function logout() {
    clearStudentName();
    studentName = '';
    nameInput = '';
    currentView = 'HUB';
  }

  // Conserve la méthode de navigation existante avec le prénom en URL.
  function routeFor(route: string): string {
    const cleanRoute = route.startsWith('/') ? route : `/${route}`;
    return `${base}${cleanRoute}?eleve=${encodeURIComponent(studentName)}`;
  }

  // Les matières sont renseignées dans worlds.ts. Les jeux non classés restent visibles.
  // Cela évite de déduire une matière à partir du nom d'un jeu.

  // Données calculées pour les filtres Arcade et Learning Lab.
  $: filteredWorlds = worlds.filter((world) =>
    selectedArcadeCategory === 'TOUS' || world.subject === selectedArcadeCategory
  );

  $: subjects = Array.from(new Set(labModules.map((module) => module.subject)));

  $: domainsForSubject = selectedSubject
    ? Array.from(new Set(
        labModules
          .filter((module) => module.subject === selectedSubject)
          .map((module) => module.domain)
      ))
    : [];

  $: filteredLabModules = labModules.filter((module) => {
    if (selectedSubject && module.subject !== selectedSubject) return false;
    if (selectedDomain && module.domain !== selectedDomain) return false;
    return true;
  });

  function selectSubject(subject: string) {
    if (selectedSubject === subject) {
      selectedSubject = null;
      selectedDomain = null;
    } else {
      selectedSubject = subject;
      selectedDomain = null;
    }
  }

  function selectDomain(domain: string) {
    selectedDomain = selectedDomain === domain ? null : domain;
  }
</script>

<svelte:head>
  <title>ORBIS — Apprendre, explorer, progresser</title>
  <meta
    name="description"
    content="Orbis, un espace pour apprendre en jouant et explorer des cours interactifs."
  />
  <meta name="theme-color" content={theme === 'dark' ? '#11151c' : '#f4f6fa'} />
</svelte:head>

<!-- Arrière-plan décoratif : aucun contenu fonctionnel n'en dépend. -->
<div class="bg-container" aria-hidden="true">
  <div class="glow-orb orb-1"></div>
  <div class="glow-orb orb-2"></div>
  <div class="glow-orb orb-3"></div>
  <div class="grid-overlay"></div>
</div>

<div class="app-layout">
  <!-- En-tête conservé sur les trois vues. -->
  <header class="header">
    <div class="header-inner">
      <button
        class="brand brand-btn"
        type="button"
        on:click={() => currentView = 'HUB'}
        aria-label="ORBIS : revenir à l'accueil"
      >
        <!-- Logo ORBIS : planète et anneau orbital. -->
        <span class="orbis-logo-tests" aria-hidden="true">
          <svg viewBox="0 0 64 64" focusable="false">
            <circle
              cx="32"
              cy="32"
              r="15"
              fill="var(--orbis-paper, #f3efe5)"
              stroke="var(--orbis-ink, #191815)"
              stroke-width="2.5"
            />
            <circle cx="27" cy="27" r="4" fill="var(--orbis-orange, #ed8125)" />
            <ellipse
              class="orbis-orbit-ring"
              cx="32"
              cy="32"
              rx="27"
              ry="11"
              fill="none"
              stroke="var(--orbis-orange, #ed8125)"
              stroke-width="4"
            />
            <circle cx="53" cy="19" r="3" fill="var(--orbis-ink, #191815)" />
          </svg>
        </span>
        <span class="brand-text">
          <span class="brand-title">ORBIS</span>
          <span class="brand-subtitle">Apprendre. Explorer. Progresser.</span>
        </span>
      </button>

      <div class="header-actions">
        {#if studentName}
          <div class="profile-chip" aria-label={`Profil élève : ${studentName}`}>
            <span class="profile-label">ÉLÈVE</span>
            <span class="profile-name">{studentName}</span>
          </div>

          <button
            class="btn btn-ghost btn-sm"
            type="button"
            on:click={logout}
            title="Changer de profil"
            aria-label="Changer de profil élève"
          >
            ↪
          </button>
        {/if}

        <button
          class="btn btn-teacher settings-toggle"
          type="button"
          aria-expanded={settingsOpen}
          aria-controls="orbis-settings"
          on:click={() => settingsOpen = !settingsOpen}
        >
          <span aria-hidden="true">⚙</span>
          <span class="settings-label">Affichage</span>
        </button>

        <a class="btn btn-teacher teacher-link" href={`${base}/teacher`}>
          Espace enseignant
        </a>
      </div>
    </div>
  </header>

  <!-- Bandeau défilant de marque : décoratif, avec une version statique accessible. -->
  <div class="brand-marquee" aria-label="Orbis — apprendre, explorer, progresser">
    <div class="brand-marquee-track" aria-hidden="true">
      <span>ORBIS <b>✳</b> APPRENDRE <b>✳</b> EXPLORER <b>✳</b> PROGRESSER <b>✳</b> ORBIS <b>✳</b> APPRENDRE <b>✳</b> EXPLORER <b>✳</b> PROGRESSER <b>✳</b></span>
      <span>ORBIS <b>✳</b> APPRENDRE <b>✳</b> EXPLORER <b>✳</b> PROGRESSER <b>✳</b> ORBIS <b>✳</b> APPRENDRE <b>✳</b> EXPLORER <b>✳</b> PROGRESSER <b>✳</b></span>
    </div>
  </div>

  <!-- Panneau de préférences, indépendant de la vue active. -->
  {#if settingsOpen}
    <section
      id="orbis-settings"
      class="settings-panel"
      aria-labelledby="orbis-settings-title"
    >
      <div class="settings-panel-header">
        <div>
          <h2 id="orbis-settings-title">Réglages d'affichage</h2>
          <p>Adapte Orbis à tes besoins.</p>
        </div>
        <button
          class="settings-close"
          type="button"
          aria-label="Fermer les réglages"
          on:click={() => settingsOpen = false}
        >×</button>
      </div>

      <fieldset class="settings-fieldset">
        <legend>Thème</legend>
        <div class="theme-options">
          <button
            class:active={theme === 'light'}
            type="button"
            aria-pressed={theme === 'light'}
            on:click={() => setOrbisTheme('light')}
          >☀️ Clair</button>
          <button
            class:active={theme === 'dark'}
            type="button"
            aria-pressed={theme === 'dark'}
            on:click={() => setOrbisTheme('dark')}
          >🌙 Sombre</button>
        </div>
      </fieldset>

      <label class="setting-option">
        <span><strong>Texte plus grand</strong><small>Facilite la lecture.</small></span>
        <input
          type="checkbox"
          checked={largeText}
          on:change={(event) => setBooleanPreference('largeText', event)}
        />
      </label>

      <label class="setting-option">
        <span><strong>Espacement augmenté</strong><small>Aère les contenus et les cartes.</small></span>
        <input
          type="checkbox"
          checked={comfortableSpacing}
          on:change={(event) => setBooleanPreference('comfortableSpacing', event)}
        />
      </label>

      <label class="setting-option">
        <span><strong>Contraste renforcé</strong><small>Rend les contours plus visibles.</small></span>
        <input
          type="checkbox"
          checked={highContrast}
          on:change={(event) => setBooleanPreference('highContrast', event)}
        />
      </label>

      <label class="setting-option">
        <span><strong>Réduire les animations</strong><small>Limite les mouvements décoratifs.</small></span>
        <input
          type="checkbox"
          checked={reduceMotion}
          on:change={(event) => setBooleanPreference('reduceMotion', event)}
        />
      </label>
    </section>
  {/if}

  <main class="main-content">
    {#if !ready}
      <section class="card auth-card center" aria-live="polite">
        <div class="loader" aria-hidden="true"></div>
        <p class="muted">Préparation d'Orbis…</p>
      </section>

    {:else if !studentName}
      <!-- Connexion élève : même stockage et même validation qu'avant. -->
      <section class="card auth-card center">
        <!-- Même logo orbital que dans l'en-tête. -->
        <div class="avatar-badge orbis-welcome-logo" aria-hidden="true">
          <svg viewBox="0 0 64 64" focusable="false">
            <circle
              cx="32"
              cy="32"
              r="15"
              fill="var(--orbis-paper, #f3efe5)"
              stroke="var(--orbis-ink, #191815)"
              stroke-width="2.5"
            />
            <circle cx="27" cy="27" r="4" fill="var(--orbis-orange, #ed8125)" />
            <ellipse
              class="orbis-orbit-ring"
              cx="32"
              cy="32"
              rx="27"
              ry="11"
              fill="none"
              stroke="var(--orbis-orange, #ed8125)"
              stroke-width="4"
            />
            <circle cx="53" cy="19" r="3" fill="var(--orbis-ink, #191815)" />
          </svg>
        </div>
        <p class="eyebrow">BIENVENUE SUR ORBIS</p>
        <h2>Ton espace d'apprentissage</h2>
        <p class="muted">Inscris ton prénom pour accéder aux activités.</p>

        <form class="auth-form" on:submit|preventDefault={login}>
          <div class="input-group">
            <label for="student-name-input">Ton prénom</label>
            <input
              id="student-name-input"
              class="input-gaming"
              bind:value={nameInput}
              required
              minlength="2"
              maxlength="40"
              placeholder="Ex. : Lucas, Léa…"
              autocomplete="given-name"
            />
          </div>
          <button class="btn btn-primary" type="submit">Entrer dans Orbis <span aria-hidden="true">→</span></button>
        </form>
      </section>

    {:else}
      {#if currentView !== 'HUB'}
        <nav class="breadcrumb-nav" aria-label="Fil d'Ariane">
          <button class="btn-back" type="button" on:click={() => currentView = 'HUB'}>
            ← Retour à l'accueil
          </button>
          <span class="breadcrumb-separator" aria-hidden="true">/</span>
          <span class="breadcrumb-current">
            {currentView === 'ARCADE' ? 'Arcade' : 'Learning Lab'}
          </span>
        </nav>
      {/if}

      {#if currentView === 'HUB'}
        <!-- ACCUEIL : les deux entrées principales sont conservées. -->
        <section class="hero-banner">
          <div class="hero-content">
            <span class="badge-tag">TON ESPACE D'APPRENTISSAGE</span>
            <h2 class="hero-title">Bonjour <span class="student-highlight">{studentName}</span> !</h2>
            <p class="hero-sub">Que souhaites-tu explorer aujourd'hui ?</p>
          </div>
        </section>

        <section class="hub-portals-grid" aria-label="Choisir un espace">
          <button class="portal-card arcade-portal" type="button" on:click={() => currentView = 'ARCADE'}>
            <span class="portal-badge">JEUX ÉDUCATIFS</span>
            <span class="portal-icon" aria-hidden="true">🎮</span>
            <span class="portal-title">Arcade</span>
            <span class="portal-desc">Relève des défis, entraîne-toi et découvre les jeux éducatifs disponibles.</span>
            <span class="portal-footer"><span class="btn btn-portal btn-arcade">Explorer les jeux <span aria-hidden="true">→</span></span></span>
          </button>

          <button class="portal-card lab-portal" type="button" on:click={() => currentView = 'LAB'}>
            <span class="portal-badge lab-badge">COURS INTERACTIFS</span>
            <span class="portal-icon" aria-hidden="true">📘</span>
            <span class="portal-title">Learning Lab</span>
            <span class="portal-desc">Explore des cours, des schémas, des manipulations et des ressources interactives.</span>
            <span class="portal-footer"><span class="btn btn-portal btn-lab">Explorer les cours <span aria-hidden="true">→</span></span></span>
          </button>
        </section>

        <!-- Chiffres calculés depuis les listes réelles, sans XP fictifs. -->
        <section class="hub-overview card" aria-labelledby="hub-overview-title">
          <div class="hub-overview-copy">
            <h3 id="hub-overview-title">À explorer</h3>
            <p>Choisis une activité, avance à ton rythme et reviens quand tu veux.</p>
          </div>
          <div class="hub-overview-stats">
            <div class="overview-stat">
              <strong>{worlds.length}</strong>
              <span>jeux répertoriés</span>
            </div>
            <div class="overview-stat">
              <strong>{labModules.length}</strong>
              <span>modules de cours</span>
            </div>
          </div>
        </section>

      {:else if currentView === 'ARCADE'}
        <!-- ARCADE : présentation modernisée des cartes uniquement. -->
        <section class="library-section">
          <div class="library-header">
            <div>
              <p class="eyebrow">JOUER ET S'ENTRAÎNER</p>
              <h2 class="section-title">Arcade</h2>
              <p class="muted small">Choisis un univers et relève le défi.</p>
            </div>

            <div class="filter-bar" aria-label="Filtrer les jeux par matière">
              {#each arcadeCategories as category}
                <button
                  class="filter-btn"
                  class:active={selectedArcadeCategory === category}
                  aria-pressed={selectedArcadeCategory === category}
                  type="button"
                  on:click={() => selectedArcadeCategory = category}
                >{category}</button>
              {/each}
            </div>
          </div>

          {#if filteredWorlds.length > 0}
            <div class="world-grid">
              {#each filteredWorlds as world}
                {@const status = world.status ?? 'available'}
                <article class="card game-card">
                  <div class="tile-frame">
                    <div class="card-top">
                      <span class="category-tag">{world.subject}</span>
                      <span class={`status-label status-${status}`}>{statusLabels[status]}</span>
                    </div>
                    <div class="tile-art" aria-hidden="true">
                      <!--
                        Image attendue dans static/images/games/{world.id}.png.
                        Le décor graphique reste visible tant que l'image n'est pas ajoutée.
                      -->
                      <div class="tile-art-placeholder">
                        <span class="placeholder-orbit placeholder-orbit-one"></span>
                        <span class="placeholder-orbit placeholder-orbit-two"></span>
                        <span class="placeholder-mark">ORBIS</span>
                      </div>
                      <img
                        class="game-art-image"
                        src={`${base}/images/games/${world.id}.png`}
                        alt=""
                        loading="lazy"
                        on:error={(event) => { (event.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                      <span class="tile-art-index">ORBIS / JEU</span>
                    </div>
                    <div class="card-info">
                      <h3 class="game-title">{world.title}</h3>
                      <p class="game-desc">{world.subtitle}</p>
                    </div>
                    <a class="btn btn-play" href={routeFor(world.route)}>Jouer <span aria-hidden="true">→</span></a>
                  </div>
                </article>
              {/each}
            </div>
          {:else}
            <div class="card empty-state">
              <h3>Aucun jeu dans cette catégorie</h3>
              <p class="muted">Essaie une autre catégorie.</p>
            </div>
          {/if}
        </section>

      {:else if currentView === 'LAB'}
        <!-- LEARNING LAB : navigation matière puis domaine conservée. -->
        <section class="lab-section">
          <div class="lab-header">
            <p class="eyebrow">COMPRENDRE ET PRATIQUER</p>
            <h2 class="section-title">Learning Lab</h2>
            <p class="muted">Cours interactifs et ressources pour apprendre à ton rythme.</p>
          </div>

          <div class="lab-navigation-block">
            <h3 class="nav-label">1. Choisis ta matière</h3>
            <div class="subject-pills">
              <button
                class="subject-pill"
                class:active={selectedSubject === null}
                type="button"
                aria-pressed={selectedSubject === null}
                on:click={() => { selectedSubject = null; selectedDomain = null; }}
              >Toutes les matières</button>

              {#each subjects as subject}
                <button
                  class="subject-pill"
                  class:active={selectedSubject === subject}
                  type="button"
                  aria-pressed={selectedSubject === subject}
                  on:click={() => selectSubject(subject)}
                >
                  {#if subject === 'Mathématiques'}📐{:else if subject === 'Français'}📖{:else if subject === 'Sciences'}🔬{:else}📚{/if}
                  {subject}
                </button>
              {/each}
            </div>
          </div>

          {#if selectedSubject && domainsForSubject.length > 0}
            <div class="lab-navigation-block">
              <h3 class="nav-label">2. Choisis un domaine — {selectedSubject}</h3>
              <div class="domain-pills">
                <button
                  class="domain-pill"
                  class:active={selectedDomain === null}
                  type="button"
                  aria-pressed={selectedDomain === null}
                  on:click={() => selectedDomain = null}
                >Tous les domaines</button>
                {#each domainsForSubject as domain}
                  <button
                    class="domain-pill"
                    class:active={selectedDomain === domain}
                    type="button"
                    aria-pressed={selectedDomain === domain}
                    on:click={() => selectDomain(domain)}
                  >{domain}</button>
                {/each}
              </div>
            </div>
          {/if}

          {#if filteredLabModules.length > 0}
            <div class="lab-modules-grid">
              {#each filteredLabModules as module}
                <article class="card lab-card">
                  <!-- La matière reste identifiée par le bandeau ; l'illustration est décorative. -->
                  <div class="lab-card-header">
                    <span class="lab-subject-tag">{module.subject}</span>
                    <span class="lab-level-badge">{module.level}</span>
                  </div>
                  <div class="tile-art lab-tile-art" aria-hidden="true">
                    <span class="tile-art-mark">{#if /math|mathématique/i.test(module.subject)}∑{:else if /français|langue/i.test(module.subject)}Aa{:else if /science/i.test(module.subject)}⚗{:else if /allemand|anglais/i.test(module.subject)}文{:else}✳{/if}</span>
                    <span class="tile-art-index">{module.domain}</span>
                  </div>
                  <h3 class="lab-card-title">{module.title}</h3>
                  <p class="lab-card-desc">{module.description}</p>

                  {#if module.isInteractive || module.duration}
                    <div class="lab-card-features">
                      {#if module.isInteractive}<span class="feature-tag">Interactif</span>{/if}
                      {#if module.duration}<span class="feature-tag">Durée : {module.duration}</span>{/if}
                    </div>
                  {/if}

                  <div class="lab-card-actions">
                    <a class="btn btn-lab-open" href={routeFor(module.href)}>Ouvrir le cours →</a>
                    {#if module.gameLink}
                      <a class="btn btn-lab-game" href={routeFor(module.gameLink.route)}>🎮 {module.gameLink.title}</a>
                    {/if}
                  </div>
                </article>
              {/each}
            </div>
          {:else}
            <div class="card empty-state">
              <h3>Aucun module pour cette sélection</h3>
              <p class="muted">Essaie une autre matière ou un autre domaine.</p>
            </div>
          {/if}
        </section>
      {/if}
    {/if}
  </main>

  <footer class="footer">
    <span>© 2026 ORBIS — Espace d'apprentissage interactif</span>
  </footer>
</div>

<style>
  /* =========================================================
     BASE : typographie lisible, largeur stable, thème clair.
     ========================================================= */
  :global(*) { box-sizing: border-box; }

  :global(html) {
    width: 100%;
    min-height: 100%;
    overflow-x: hidden;
    scroll-behavior: smooth;
  }

  :global(body) {
    width: 100%;
    min-height: 100%;
    margin: 0;
    padding: 0;
    background: #f4f6fa;
    color: #1d2939;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    overflow-x: hidden;
  }

  :global(button), :global(a), :global(input) {
    font: inherit;
    -webkit-tap-highlight-color: transparent;
  }

  :global(button:focus-visible), :global(a:focus-visible), :global(input:focus-visible) {
    outline: 3px solid #3778c8;
    outline-offset: 3px;
  }

  /* Fond discret, purement décoratif. */
  .bg-container {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
    background: linear-gradient(145deg, #f7f9fc 0%, #edf2f8 100%);
  }

  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(to right, rgba(45, 65, 95, .035) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(45, 65, 95, .035) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .glow-orb {
    position: absolute;
    width: 380px;
    height: 380px;
    border-radius: 50%;
    filter: blur(110px);
    opacity: .07;
    animation: orb-float 24s infinite alternate ease-in-out;
  }

  .orb-1 { top: -140px; left: -120px; background: #3d83d8; }
  .orb-2 { right: -140px; bottom: -150px; background: #7d82d8; animation-delay: -8s; }
  .orb-3 { top: 42%; left: 40%; background: #55a7c8; animation-delay: -14s; }

  @keyframes orb-float {
    from { transform: translate3d(0, 0, 0); }
    to { transform: translate3d(24px, 18px, 0); }
  }

  .app-layout {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    width: 100%;
  }

  .main-content {
    flex: 1;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.5rem 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-width: 0;
  }

  /* =========================================================
     EN-TÊTE ET IDENTITÉ ORBIS
     ========================================================= */
  .header {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(255, 255, 255, .94);
    border-bottom: 1px solid #dce3ed;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .header-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: .8rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .brand-btn {
    display: flex;
    align-items: center;
    gap: .75rem;
    min-width: 0;
    padding: 0;
    border: 0;
    background: transparent;
    text-align: left;
    cursor: pointer;
    color: inherit;
  }

  .brand-text { display: flex; flex-direction: column; gap: .15rem; }
  .brand-title { color: #1d2939; font-size: 1.25rem; font-weight: 850; letter-spacing: .12em; }
  .brand-subtitle { color: #526175; font-size: .78rem; }

  .header-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: .55rem;
    flex-shrink: 0;
  }

  .profile-chip {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: .35rem .7rem;
    border: 1px solid #dce3ed;
    border-radius: 9px;
    background: #f1f5fa;
  }

  .profile-label { color: #2458a6; font-size: .63rem; font-weight: 800; letter-spacing: .06em; }
  .profile-name { color: #1d2939; font-size: .9rem; font-weight: 750; }

  /* Styles partagés des boutons. */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: .4rem;
    min-height: 42px;
    padding: .65rem .95rem;
    border: 1px solid transparent;
    border-radius: 10px;
    font-size: .88rem;
    font-weight: 750;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease;
  }

  .btn-primary { background: #2458a6; color: #fff; }
  .btn-primary:hover { background: #1d498b; }
  .btn-teacher, .btn-ghost {
    background: #f7f9fc;
    color: #344054;
    border-color: #d5deea;
  }
  .btn-teacher:hover, .btn-ghost:hover { background: #eaf0f8; }
  .btn-sm { min-width: 40px; padding: .45rem .65rem; }
  .settings-toggle { white-space: nowrap; }

  /* Panneau de préférences. */
  .settings-panel {
    position: fixed;
    z-index: 100;
    top: 5.4rem;
    right: max(calc((100vw - 1200px) / 2 + 1.5rem), 1rem);
    width: min(420px, calc(100vw - 2rem));
    max-height: calc(100dvh - 7rem);
    overflow-y: auto;
    padding: 1.25rem;
    border: 1px solid #d5deea;
    border-radius: 16px;
    background: #fff;
    color: #1d2939;
    box-shadow: 0 16px 48px rgba(20, 35, 60, .18);
  }

  .settings-panel-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
  .settings-panel-header h2 { margin: 0 0 .25rem; font-size: 1.15rem; }
  .settings-panel-header p { margin: 0; color: #526175; font-size: .9rem; }
  .settings-close { width: 2.1rem; height: 2.1rem; border: 1px solid #d5deea; border-radius: 8px; background: #f1f5fa; color: #1d2939; font-size: 1.4rem; cursor: pointer; }
  .settings-fieldset { margin: 0 0 .8rem; padding: 0; border: 0; }
  .settings-fieldset legend { margin-bottom: .5rem; font-size: .88rem; font-weight: 800; }
  .theme-options { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
  .theme-options button { padding: .7rem; border: 1px solid #d5deea; border-radius: 9px; background: #f7f9fc; color: #344054; cursor: pointer; }
  .theme-options button.active { background: #e8f0ff; color: #214b88; border-color: #8eaddb; font-weight: 800; }

  .setting-option { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .8rem 0; border-top: 1px solid #e5eaf1; cursor: pointer; }
  .setting-option span { display: flex; flex-direction: column; gap: .2rem; }
  .setting-option strong { font-size: .88rem; }
  .setting-option small { color: #526175; font-size: .78rem; line-height: 1.4; }
  .setting-option input { width: 1.15rem; height: 1.15rem; flex-shrink: 0; accent-color: #2458a6; }

  /* =========================================================
     ACCUEIL ET CARTES PRINCIPALES
     ========================================================= */
  .hero-banner {
    padding: 2rem;
    border: 1px solid #dce3ed;
    border-radius: 18px;
    background: linear-gradient(135deg, #fff, #f0f5fc);
    box-shadow: 0 4px 18px rgba(30, 50, 80, .045);
  }

  .eyebrow, .badge-tag {
    display: inline-block;
    margin: 0 0 .55rem;
    color: #2458a6;
    font-size: .75rem;
    font-weight: 800;
    letter-spacing: .06em;
  }

  .badge-tag {
    padding: .35rem .7rem;
    border: 1px solid #c9dafa;
    border-radius: 999px;
    background: #e8f0ff;
  }

  .hero-title { margin: 0 0 .5rem; color: #1d2939; font-size: clamp(1.7rem, 4vw, 2.25rem); line-height: 1.2; font-weight: 850; }
  .hero-sub { margin: 0; color: #526175; font-size: 1.05rem; line-height: 1.6; }
  .student-highlight { color: #2458a6; }

  .hub-portals-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; }

  .portal-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
    width: 100%;
    padding: 1.7rem;
    border: 1px solid #dce3ed;
    border-top: 3px solid #3274c8;
    border-radius: 17px;
    background: rgba(255, 255, 255, .96);
    box-shadow: 0 4px 18px rgba(30, 50, 80, .045);
    color: #1d2939;
    text-align: left;
    cursor: pointer;
    transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
  }

  .lab-portal { border-top-color: #6875bb; }
  .portal-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(30, 70, 130, .09); }
  .portal-card:focus-visible { outline-offset: 4px; }
  .portal-badge { margin-bottom: 1rem; padding: .3rem .55rem; border-radius: 6px; background: #e8f0ff; color: #2458a6; font-size: .7rem; font-weight: 800; letter-spacing: .04em; }
  .lab-badge { background: #edf0ff; color: #535f9e; }
  .portal-icon { margin-bottom: .55rem; font-size: 2.8rem; }
  .portal-title { margin-bottom: .45rem; font-size: 1.55rem; font-weight: 850; }
  .portal-desc { flex: 1; margin: 0 0 1.35rem; color: #526175; font-size: .98rem; line-height: 1.6; }
  .portal-footer { width: 100%; }
  .btn-portal { width: 100%; min-height: 46px; }
  .btn-arcade { background: #2458a6; color: #fff; }
  .btn-arcade:hover { background: #1d498b; }
  .btn-lab { background: #535f9e; color: #fff; }
  .btn-lab:hover { background: #424d85; }

  .hub-overview {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 1.4rem 1.5rem;
    border: 1px solid #dce3ed;
    border-radius: 15px;
    background: rgba(255, 255, 255, .96);
  }

  .hub-overview-copy h3 { margin: 0 0 .4rem; color: #1d2939; font-size: 1.05rem; }
  .hub-overview-copy p { margin: 0; color: #526175; line-height: 1.55; }
  .hub-overview-stats { display: flex; gap: .75rem; flex-shrink: 0; }
  .overview-stat { display: flex; flex-direction: column; gap: .2rem; min-width: 120px; padding: .8rem .9rem; border: 1px solid #dce3ed; border-radius: 11px; background: #f1f5fa; }
  .overview-stat strong { color: #2458a6; font-size: 1.45rem; line-height: 1.2; }
  .overview-stat span { color: #526175; font-size: .78rem; }

  /* =========================================================
     NAVIGATION SECONDAIRE, FILTRES ET TITRES DE SECTION
     ========================================================= */
  .breadcrumb-nav { display: flex; align-items: center; flex-wrap: wrap; gap: .7rem; font-size: .9rem; }
  .btn-back { padding: .55rem .8rem; border: 1px solid #d5deea; border-radius: 9px; background: #f7f9fc; color: #2458a6; font-weight: 750; cursor: pointer; }
  .breadcrumb-separator { color: #8a96a8; }
  .breadcrumb-current { color: #1d2939; font-weight: 800; }

  .library-section, .lab-section { width: 100%; min-width: 0; }
  .library-header { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem; }
  .section-title { margin: 0 0 .3rem; color: #1d2939; font-size: 1.8rem; font-weight: 850; }
  .small { font-size: .88rem; }
  .muted { color: #526175; }
  .library-header p, .lab-header p { margin-top: .2rem; margin-bottom: 0; }
  .lab-header { margin-bottom: .25rem; }

  .filter-bar { display: flex; flex-wrap: wrap; gap: .35rem; max-width: 100%; padding: .3rem; border-radius: 10px; background: #e9eef5; }
  .filter-btn { padding: .5rem .7rem; border: 1px solid transparent; border-radius: 7px; background: transparent; color: #526175; font-size: .78rem; font-weight: 750; cursor: pointer; }
  .filter-btn.active { background: #2458a6; color: #fff; }

  /* =========================================================
     GRILLES DE JEUX ET DE MODULES
     ========================================================= */
  .world-grid, .lab-modules-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: stretch; gap: 1.15rem; }
  .card { min-width: 0; padding: 1.25rem; border: 1px solid #dce3ed; border-radius: 15px; background: rgba(255, 255, 255, .96); box-shadow: 0 4px 18px rgba(30, 50, 80, .045); }
  .game-card { display: flex; flex-direction: column; gap: .9rem; overflow: hidden; }
  .card-top { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
  .category-tag { color: #344f96; font-size: .7rem; font-weight: 800; letter-spacing: .04em; }
  .status-label { color: #16734a; font-size: .72rem; font-weight: 750; }
  .card-info { flex: 1; min-width: 0; }
  .game-title { margin: 0 0 .4rem; color: #1d2939; font-size: 1.08rem; font-weight: 800; line-height: 1.35; overflow-wrap: anywhere; }
  .game-desc { margin: 0; color: #526175; font-size: .9rem; line-height: 1.5; overflow-wrap: anywhere; }
  .card-meta, .lab-card-features { display: flex; flex-wrap: wrap; gap: .45rem; }
  .meta-tag, .feature-tag { padding: .25rem .5rem; border-radius: 5px; background: #eef2f7; color: #526175; font-size: .72rem; font-weight: 650; }
  .btn-play { width: 100%; min-height: 44px; background: #edf3fb; color: #214b88; border-color: #cbd8e8; }
  .btn-play:hover { background: #dfeafb; border-color: #8eaddb; }

  .lab-section { display: flex; flex-direction: column; gap: 1.2rem; }
  .lab-navigation-block { display: flex; flex-direction: column; gap: .75rem; padding: 1rem 1.2rem; border: 1px solid #dce3ed; border-radius: 14px; background: rgba(255, 255, 255, .96); }
  .nav-label { margin: 0; color: #344054; font-size: .95rem; font-weight: 800; }
  .subject-pills, .domain-pills { display: flex; flex-wrap: wrap; gap: .5rem; }
  .subject-pill, .domain-pill { padding: .55rem .85rem; border: 1px solid #d5deea; border-radius: 9px; background: #f7f9fc; color: #344054; font-size: .86rem; font-weight: 700; cursor: pointer; }
  .subject-pill.active, .domain-pill.active { border-color: #2458a6; background: #2458a6; color: #fff; }
  .lab-card { display: flex; flex-direction: column; gap: .85rem; }
  .lab-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: .8rem; }
  .lab-subject-tag { color: #344f96; font-size: .73rem; font-weight: 800; line-height: 1.4; }
  .lab-level-badge { flex-shrink: 0; padding: .25rem .45rem; border-radius: 5px; background: #edf1f7; color: #344054; font-size: .72rem; font-weight: 800; }
  .lab-card-title { margin: 0; color: #1d2939; font-size: 1.2rem; line-height: 1.35; }
  .lab-card-desc { flex: 1; margin: 0; color: #526175; font-size: .9rem; line-height: 1.55; }
  .lab-card-actions { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .2rem; }
  .btn-lab-open, .btn-lab-game { flex: 1 1 auto; }
  .btn-lab-open { background: #344f96; color: #fff; }
  .btn-lab-open:hover { background: #293f7a; }
  .btn-lab-game { background: #f1f5fa; color: #2458a6; border-color: #cbd8e8; }
  .empty-state { text-align: center; }
  .empty-state h3 { margin-top: 0; }

  /* =========================================================
     FORMULAIRE DE CONNEXION ET ÉTATS GÉNÉRAUX
     ========================================================= */
  .auth-card { display: flex; flex-direction: column; align-items: center; gap: 1rem; width: 100%; max-width: 460px; margin: 3rem auto; text-align: center; }
  .avatar-badge { display: flex; align-items: center; justify-content: center; width: 4rem; height: 4rem; border-radius: 16px; background: #e5efff; color: #2458a6; font-size: 2.5rem; }
  .auth-card h2 { margin: 0; color: #1d2939; font-size: 1.55rem; }
  .auth-card > p { margin: 0; line-height: 1.55; }
  .auth-form { display: flex; flex-direction: column; gap: 1.1rem; width: 100%; margin-top: .35rem; }
  .input-group { display: flex; flex-direction: column; gap: .45rem; text-align: left; }
  .input-group label { color: #2458a6; font-size: .82rem; font-weight: 800; }
  .input-gaming { width: 100%; min-height: 46px; padding: .75rem .9rem; border: 1px solid #bdc9d9; border-radius: 10px; background: #fff; color: #1d2939; font-size: 1rem; }
  .input-gaming:focus-visible { outline-offset: 2px; }
  .center { text-align: center; }
  .loader { width: 30px; height: 30px; border: 3px solid #dce3ed; border-top-color: #2458a6; border-radius: 50%; animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .footer { padding: 1.5rem; border-top: 1px solid #dce3ed; color: #64748b; font-size: .8rem; text-align: center; }

  /* =========================================================
     THÈME SOMBRE : anthracite, surfaces distinctes, texte clair.
     ========================================================= */
  :global(html[data-theme='dark']) { color-scheme: dark; }
  :global(html[data-theme='dark'] body) { background: #11151c; color: #eef2f7; }
  :global(html[data-theme='dark']) .bg-container { background: linear-gradient(145deg, #171e2b, #0c1017); }
  :global(html[data-theme='dark']) .grid-overlay {
    background-image:
      linear-gradient(to right, rgba(255,255,255,.025) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,.025) 1px, transparent 1px);
  }
  :global(html[data-theme='dark']) .glow-orb { opacity: .1; }
  :global(html[data-theme='dark']) .header { background: rgba(17, 21, 28, .95); border-bottom-color: #303846; }
  :global(html[data-theme='dark']) .brand-title,
  :global(html[data-theme='dark']) .profile-name,
  :global(html[data-theme='dark']) .hero-title,
  :global(html[data-theme='dark']) .portal-title,
  :global(html[data-theme='dark']) .section-title,
  :global(html[data-theme='dark']) .game-title,
  :global(html[data-theme='dark']) .lab-card-title,
  :global(html[data-theme='dark']) .breadcrumb-current,
  :global(html[data-theme='dark']) .auth-card h2 { color: #eef2f7; }
  :global(html[data-theme='dark']) .avatar-badge { background: #263a5a; color: #a9cbff; }
  :global(html[data-theme='dark']) .brand-subtitle,
  :global(html[data-theme='dark']) .hero-sub,
  :global(html[data-theme='dark']) .portal-desc,
  :global(html[data-theme='dark']) .game-desc,
  :global(html[data-theme='dark']) .lab-card-desc,
  :global(html[data-theme='dark']) .muted { color: #b1bdcc; }
  :global(html[data-theme='dark']) .profile-chip { background: #1d2531; border-color: #3a4555; }
  :global(html[data-theme='dark']) .profile-label,
  :global(html[data-theme='dark']) .student-highlight,
  :global(html[data-theme='dark']) .category-tag,
  :global(html[data-theme='dark']) .lab-subject-tag { color: #91baff; }
  :global(html[data-theme='dark']) .hero-banner,
  :global(html[data-theme='dark']) .portal-card,
  :global(html[data-theme='dark']) .lab-navigation-block,
  :global(html[data-theme='dark']) .lab-card,
  :global(html[data-theme='dark']) .card,
  :global(html[data-theme='dark']) .hub-overview {
    background: #1a212c;
    border-color: #343e4d;
    box-shadow: none;
  }
  :global(html[data-theme='dark']) .hero-banner { background: linear-gradient(135deg, #202a3b, #191f2a); }
  :global(html[data-theme='dark']) .badge-tag { background: #263752; border-color: #3b5274; color: #a9cbff; }
  :global(html[data-theme='dark']) .arcade-portal { border-top-color: #4da2e8; }
  :global(html[data-theme='dark']) .lab-portal { border-top-color: #8f9be2; }
  :global(html[data-theme='dark']) .portal-card:hover,
  :global(html[data-theme='dark']) .lab-card:hover { border-color: #668abd; box-shadow: 0 8px 24px rgba(0,0,0,.16); }
  :global(html[data-theme='dark']) .portal-badge { background: #263752; color: #a9cbff; }
  :global(html[data-theme='dark']) .lab-badge { background: #302f4b; color: #c2c9ff; }
  :global(html[data-theme='dark']) .btn-teacher,
  :global(html[data-theme='dark']) .btn-ghost,
  :global(html[data-theme='dark']) .btn-back,
  :global(html[data-theme='dark']) .subject-pill,
  :global(html[data-theme='dark']) .domain-pill,
  :global(html[data-theme='dark']) .filter-bar,
  :global(html[data-theme='dark']) .filter-btn {
    background: #202936;
    border-color: #3a4656;
    color: #d1dae6;
  }
  :global(html[data-theme='dark']) .subject-pill.active,
  :global(html[data-theme='dark']) .domain-pill.active,
  :global(html[data-theme='dark']) .filter-btn.active { background: #315b96; border-color: #648bc2; color: #fff; }
  :global(html[data-theme='dark']) .nav-label { color: #d1dae6; }
  :global(html[data-theme='dark']) .lab-level-badge,
  :global(html[data-theme='dark']) .feature-tag,
  :global(html[data-theme='dark']) .meta-tag,
  :global(html[data-theme='dark']) .overview-stat { background: #242e3b; border-color: #3a4656; color: #c0cad8; }
  :global(html[data-theme='dark']) .status-label { color: #8ee0b4; }
  :global(html[data-theme='dark']) .btn-play,
  :global(html[data-theme='dark']) .btn-lab-game { background: #242e3b; color: #c2d9ff; border-color: #46566e; }
  :global(html[data-theme='dark']) .btn-play:hover { background: #2c3d53; border-color: #789ac7; }
  :global(html[data-theme='dark']) .btn-lab-open { background: #40568f; }
  :global(html[data-theme='dark']) .input-gaming { background: #111720; color: #eef2f7; border-color: #465365; }
  :global(html[data-theme='dark']) .input-group label,
  :global(html[data-theme='dark']) .overview-stat strong { color: #a9cbff; }
  :global(html[data-theme='dark']) .hub-overview-copy h3 { color: #eef2f7; }
  :global(html[data-theme='dark']) .hub-overview-copy p,
  :global(html[data-theme='dark']) .overview-stat span,
  :global(html[data-theme='dark']) .footer { color: #b1bdcc; }
  :global(html[data-theme='dark']) .overview-stat { border-color: #3a4656; }
  :global(html[data-theme='dark']) .settings-panel { background: #1a212c; color: #eef2f7; border-color: #3a4656; }
  :global(html[data-theme='dark']) .settings-panel-header p,
  :global(html[data-theme='dark']) .setting-option small { color: #b1bdcc; }
  :global(html[data-theme='dark']) .settings-close,
  :global(html[data-theme='dark']) .theme-options button { background: #242e3b; color: #eef2f7; border-color: #465365; }
  :global(html[data-theme='dark']) .theme-options button.active { background: #2b4265; color: #c2d9ff; border-color: #648bc2; }
  :global(html[data-theme='dark']) .setting-option { border-top-color: #343e4d; }
  :global(html[data-theme='dark']) .footer { border-top-color: #303846; }

  /* Réglages indépendants d'accessibilité. */
  :global(html[data-text-size='large']) { font-size: 112.5%; }
  :global(html[data-spacing='comfortable']) .main-content { gap: 2rem; line-height: 1.65; }
  :global(html[data-spacing='comfortable']) .card,
  :global(html[data-spacing='comfortable']) .portal-card,
  :global(html[data-spacing='comfortable']) .lab-card { padding: 1.65rem; }
  :global(html[data-spacing='comfortable']) .world-grid,
  :global(html[data-spacing='comfortable']) .lab-modules-grid,
  :global(html[data-spacing='comfortable']) .hub-portals-grid { gap: 1.6rem; }

  :global(html[data-contrast='high']) .card,
  :global(html[data-contrast='high']) .portal-card,
  :global(html[data-contrast='high']) .lab-card,
  :global(html[data-contrast='high']) .lab-navigation-block,
  :global(html[data-contrast='high']) .settings-panel,
  :global(html[data-contrast='high']) .input-gaming { border-width: 2px; border-color: #526175; }

  :global(html[data-theme='dark'][data-contrast='high']) .card,
  :global(html[data-theme='dark'][data-contrast='high']) .portal-card,
  :global(html[data-theme='dark'][data-contrast='high']) .lab-card,
  :global(html[data-theme='dark'][data-contrast='high']) .lab-navigation-block,
  :global(html[data-theme='dark'][data-contrast='high']) .settings-panel,
  :global(html[data-theme='dark'][data-contrast='high']) .input-gaming { border-color: #c0cad8; }

  :global(html[data-motion='reduced'] *),
  :global(html[data-motion='reduced'] *::before),
  :global(html[data-motion='reduced'] *::after) {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }

  /* Mise en page adaptée aux tablettes et aux téléphones. */
  @media (max-width: 1000px) {
    .world-grid, .lab-modules-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  @media (max-width: 760px) {
    .hub-portals-grid { grid-template-columns: 1fr; }
    .header-inner { padding: .75rem 1rem; }
    .main-content { padding: 1.4rem 1rem 2rem; }
    .hub-overview { align-items: stretch; flex-direction: column; }
    .hub-overview-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .overview-stat { min-width: 0; }
  }

  @media (max-width: 600px) {
    .world-grid, .lab-modules-grid { grid-template-columns: 1fr; }
    .brand-subtitle, .profile-chip, .settings-label { display: none; }
    .header-actions { gap: .35rem; }
    .teacher-link { padding-inline: .65rem; font-size: .78rem; }
    .hero-banner { padding: 1.35rem; }
    .portal-card { padding: 1.4rem; }
    .settings-panel { top: 5rem; right: .5rem; width: calc(100vw - 1rem); max-height: calc(100dvh - 5.5rem); }
    .library-header { align-items: flex-start; }
    .filter-bar { width: 100%; }
    .filter-btn { flex: 1 1 auto; }
    .lab-card-actions { flex-direction: column; }
  }

  @media (prefers-reduced-motion: reduce) {
    .glow-orb { animation: none; }
    *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; }
  }

  /* =========================================================
     ORBIS — NOUVELLE IDENTITÉ VISUELLE
     Couleurs crème, encre et orange ; formes carrées ; texture légère.
     Cette couche remplace progressivement les anciennes couleurs bleues.
     ========================================================= */
  :global(:root) {
    --orbis-paper: #f3efe5;
    --orbis-card: #fbf9f3;
    --orbis-ink: #191815;
    --orbis-muted: #625e55;
    --orbis-line: #c9c2b5;
    --orbis-orange: #ed8125;
    --orbis-orange-soft: #f6dfc7;
  }

  :global(html) { background: var(--orbis-paper); }
  :global(body) {
    background: var(--orbis-paper);
    color: var(--orbis-ink);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  .bg-container {
    background-color: var(--orbis-paper);
    background-image: repeating-linear-gradient(0deg, rgb(45 38 25 / 2%) 0, rgb(45 38 25 / 2%) 1px, transparent 1px, transparent 5px);
    opacity: 1;
  }
  .glow-orb, .grid-overlay { display: none; }
  .app-layout { position: relative; z-index: 1; }
  .header {
    position: relative;
    background: rgb(243 239 229 / 96%);
    border-bottom: 1px solid var(--orbis-ink);
    box-shadow: none;
    backdrop-filter: none;
  }
  .header-inner { max-width: 1440px; }
  .brand-title { color: var(--orbis-ink); letter-spacing: .16em; }
  .brand-subtitle { color: var(--orbis-muted); }
  .btn, .btn-teacher, .btn-ghost, .btn-back, .subject-pill, .domain-pill, .filter-btn, .theme-options button {
    border-radius: 0; box-shadow: none;
  }
  .btn-teacher, .btn-ghost, .btn-back { background: var(--orbis-card); color: var(--orbis-ink); border-color: var(--orbis-line); }
  .btn-primary, .btn-portal, .btn-play, .btn-lab-open { background: var(--orbis-orange); color: var(--orbis-ink); border: 1px solid var(--orbis-ink); font-weight: 800; }
  .btn-primary:hover, .btn-portal:hover, .btn-play:hover, .btn-lab-open:hover { background: #f59a4d; color: var(--orbis-ink); }
  .brand-marquee {
    overflow: hidden; border-bottom: 1px solid var(--orbis-ink);
    background: var(--orbis-orange); color: var(--orbis-ink);
    white-space: nowrap; font-size: .72rem; font-weight: 900; letter-spacing: .16em;
  }
  .brand-marquee-track { display: flex; width: max-content; animation: orbis-marquee 32s linear infinite; }
  .brand-marquee-track span { display: block; flex: 0 0 auto; padding: .62rem 1.4rem; }
  .brand-marquee-track b { padding: 0 1.2rem; font-weight: 900; }
  @keyframes orbis-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .main-content { max-width: 1440px; }
  .hero-banner, .hub-overview, .card, .portal-card, .lab-navigation-block, .settings-panel {
    border-radius: 0; background: var(--orbis-card); border: 1px solid var(--orbis-ink);
    box-shadow: 4px 4px 0 rgb(25 24 21 / 12%);
  }
  .hero-banner { background: transparent; border: 0; box-shadow: none; padding-inline: 0; }
  .badge-tag, .portal-badge, .category-tag, .lab-subject-tag, .lab-level-badge, .feature-tag, .meta-tag, .overview-stat {
    border-radius: 0;
  }
  .badge-tag { background: var(--orbis-orange-soft); color: var(--orbis-ink); border: 1px solid var(--orbis-ink); }
  .hero-title, .portal-title, .section-title, .game-title, .lab-card-title, .auth-card h2, .hub-overview-copy h3 { color: var(--orbis-ink); }
  .hero-sub, .portal-desc, .game-desc, .lab-card-desc, .muted, .hub-overview-copy p { color: var(--orbis-muted); }
  .student-highlight { color: var(--orbis-ink); text-decoration: underline; text-decoration-color: var(--orbis-orange); text-decoration-thickness: .18em; text-underline-offset: .12em; }
  .hub-portals-grid { gap: 1.25rem; }
  .portal-card {
    position: relative; align-items: flex-start; text-align: left; padding: 1.25rem;
    border-top: 1px solid var(--orbis-ink); border-left: 1px solid var(--orbis-ink);
    transition: transform 180ms ease, box-shadow 180ms ease;
  }
  .portal-card:hover { transform: translate(-2px, -2px); box-shadow: 7px 7px 0 rgb(25 24 21 / 18%); border-color: var(--orbis-ink); }
  .portal-icon {
    display: grid; place-items: center; width: 100%; min-height: 140px; margin: .85rem 0;
    border: 1px solid var(--orbis-ink); background: var(--orbis-orange-soft); font-size: 3.4rem;
  }
  .portal-title { font-size: clamp(1.5rem, 2.5vw, 2.1rem); font-weight: 850; letter-spacing: -.04em; }
  .portal-footer { width: 100%; margin-top: auto; }
  .portal-badge { background: var(--orbis-orange); color: var(--orbis-ink); border: 1px solid var(--orbis-ink); }
  .lab-badge { background: var(--orbis-card); }
  .hub-overview { background: rgb(251 249 243 / 72%); }
  .overview-stat { background: var(--orbis-paper); border: 1px solid var(--orbis-line); }
  .library-header { border-bottom: 1px solid var(--orbis-line); padding-bottom: 1rem; }
  .filter-bar { border-radius: 0; background: transparent; border-color: var(--orbis-line); }
  .filter-btn { border-radius: 0; color: var(--orbis-ink); }
  .filter-btn.active, .subject-pill.active, .domain-pill.active { background: var(--orbis-orange); color: var(--orbis-ink); border-color: var(--orbis-ink); }
  .subject-pill, .domain-pill { background: var(--orbis-card); border-color: var(--orbis-line); color: var(--orbis-ink); }
  .world-grid, .lab-modules-grid { gap: 1.1rem; }
  .game-card, .lab-card { padding: .65rem; gap: .7rem; background: var(--orbis-card); border: 1px solid var(--orbis-ink); box-shadow: 3px 3px 0 rgb(25 24 21 / 10%); transition: transform 180ms ease, box-shadow 180ms ease; }
  .game-card:hover, .lab-card:hover { transform: translateY(-3px); box-shadow: 6px 6px 0 rgb(25 24 21 / 16%); }
  .tile-frame { display: flex; flex-direction: column; gap: .75rem; height: 100%; padding: .55rem; border: 1px solid var(--orbis-line); }
  .card-top, .lab-card-header { align-items: center; }
  .category-tag, .lab-subject-tag { display: inline-flex; align-self: flex-start; background: var(--orbis-orange); color: var(--orbis-ink); border: 1px solid var(--orbis-ink); padding: .3rem .45rem; font-size: .68rem; font-weight: 850; letter-spacing: .07em; text-transform: uppercase; }
  .status-label { color: #41623c; }
  .tile-art {
    display: grid; position: relative; place-items: center; min-height: 170px;
    border: 1px solid var(--orbis-ink); background: var(--orbis-paper); overflow: hidden;
    background-image: linear-gradient(135deg, transparent 49.7%, rgb(25 24 21 / 6%) 50%, transparent 50.3%);
  }
  .tile-art::before { content: ""; position: absolute; inset: 10px; border: 1px solid var(--orbis-line); pointer-events: none; }
  .tile-art-mark { position: relative; z-index: 1; font-size: 3.5rem; line-height: 1; }
  .tile-art-index { position: absolute; right: .65rem; bottom: .55rem; font-size: .58rem; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
  .lab-tile-art { min-height: 145px; background-color: #f7e7d6; }
  .lab-tile-art .tile-art-mark { font-family: Georgia, serif; font-size: 3.3rem; font-weight: 700; }
  .game-title, .lab-card-title { font-size: 1.2rem; line-height: 1.25; font-weight: 850; letter-spacing: -.025em; }
  .game-desc, .lab-card-desc { font-size: .88rem; line-height: 1.55; }
  .btn-play, .btn-lab-open, .btn-lab-game { justify-content: space-between; width: 100%; border-radius: 0; }
  .meta-tag, .lab-level-badge, .feature-tag { background: transparent; color: var(--orbis-muted); border: 1px solid var(--orbis-line); }
  .auth-card { border-radius: 0; }
  .avatar-badge { border-radius: 0; background: #ffffff; color: var(--orbis-ink); border: 1px solid var(--orbis-ink); }
  .input-gaming { border-radius: 0; border-color: var(--orbis-ink); background: var(--orbis-card); color: var(--orbis-ink); }
  .input-group label { color: var(--orbis-ink); }
  .settings-panel { background: var(--orbis-card); color: var(--orbis-ink); }
  .setting-option { border-color: var(--orbis-line); }
  .footer { color: var(--orbis-muted); border-top-color: var(--orbis-line); }

  /* Thème sombre : encre profonde et orange conservé comme accent. */
  :global(html[data-theme='dark']) { --orbis-paper: #191815; --orbis-card: #24221e; --orbis-ink: #f5f0e6; --orbis-muted: #c5bfb3; --orbis-line: #5b554a; --orbis-orange: #f29a4b; --orbis-orange-soft: #483326; color-scheme: dark; }
  :global(html[data-theme='dark'] body) { background: #191815; color: #f5f0e6; }
  :global(html[data-theme='dark']) .bg-container { background-color: #191815; background-image: repeating-linear-gradient(0deg, rgb(255 255 255 / 1.5%) 0, rgb(255 255 255 / 1.5%) 1px, transparent 1px, transparent 5px); }
  :global(html[data-theme='dark']) .header { background: rgb(25 24 21 / 97%); border-bottom-color: #f5f0e6; }
  :global(html[data-theme='dark']) .brand-title, :global(html[data-theme='dark']) .hero-title, :global(html[data-theme='dark']) .portal-title, :global(html[data-theme='dark']) .section-title, :global(html[data-theme='dark']) .game-title, :global(html[data-theme='dark']) .lab-card-title, :global(html[data-theme='dark']) .auth-card h2 { color: var(--orbis-ink); }
  :global(html[data-theme='dark']) .brand-subtitle, :global(html[data-theme='dark']) .hero-sub, :global(html[data-theme='dark']) .portal-desc, :global(html[data-theme='dark']) .game-desc, :global(html[data-theme='dark']) .lab-card-desc, :global(html[data-theme='dark']) .muted { color: var(--orbis-muted); }
  :global(html[data-theme='dark']) .hero-banner, :global(html[data-theme='dark']) .portal-card, :global(html[data-theme='dark']) .lab-navigation-block, :global(html[data-theme='dark']) .lab-card, :global(html[data-theme='dark']) .card, :global(html[data-theme='dark']) .hub-overview, :global(html[data-theme='dark']) .settings-panel { background: var(--orbis-card); border-color: var(--orbis-line); box-shadow: 3px 3px 0 rgb(0 0 0 / 25%); }
  :global(html[data-theme='dark']) .hero-banner { background: transparent; box-shadow: none; border: 0; }
  :global(html[data-theme='dark']) .tile-frame { border-color: var(--orbis-line); }
  :global(html[data-theme='dark']) .tile-art { background-color: #302d27; }
  :global(html[data-theme='dark']) .brand-marquee { background: var(--orbis-orange); color: #191815; }
  :global(html[data-theme='dark']) .filter-bar, :global(html[data-theme='dark']) .filter-btn, :global(html[data-theme='dark']) .subject-pill, :global(html[data-theme='dark']) .domain-pill, :global(html[data-theme='dark']) .btn-teacher, :global(html[data-theme='dark']) .btn-ghost, :global(html[data-theme='dark']) .btn-back { background: var(--orbis-card); color: var(--orbis-ink); border-color: var(--orbis-line); }
  :global(html[data-theme='dark']) .filter-btn.active, :global(html[data-theme='dark']) .subject-pill.active, :global(html[data-theme='dark']) .domain-pill.active { background: var(--orbis-orange); color: #191815; border-color: var(--orbis-orange); }
  :global(html[data-theme='dark']) .input-gaming { background: #191815; color: var(--orbis-ink); border-color: var(--orbis-line); }
  :global(html[data-theme='dark']) .settings-close, :global(html[data-theme='dark']) .theme-options button { background: var(--orbis-card); color: var(--orbis-ink); border-color: var(--orbis-line); }
  :global(html[data-theme='dark']) .settings-close, :global(html[data-theme='dark']) .theme-options button.active { background: var(--orbis-orange); color: #191815; }

  /* Les animations sont discrètes et respectent le réglage de réduction. */
  @media (hover: none) { .portal-card:hover, .game-card:hover, .lab-card:hover { transform: none; } }
  @media (prefers-reduced-motion: reduce) { .brand-marquee-track { animation: none; } }
  :global(html[data-motion='reduced']) .brand-marquee-track { animation: none; }

  @media (max-width: 600px) {
    .tile-art { min-height: 145px; }
    .portal-icon { min-height: 110px; }
    .brand-marquee-track span { padding-block: .5rem; }
  }


  /* ============================================================
     LOGO ORBIS — ANNEAU ORBITAL
     Utilisé dans l'en-tête et dans la carte de bienvenue.
     ============================================================ */
  .orbis-logo-tests {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
  }

  .orbis-logo-tests svg,
  .orbis-welcome-logo svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .orbis-orbit-ring {
    transform-box: fill-box;
    transform-origin: center;
    animation: orbis-orbit-rotation 18s linear infinite;
  }

  @keyframes orbis-orbit-rotation {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .orbis-welcome-logo {
    display: grid;
    place-items: center;
    overflow: visible;
  }

  @media (prefers-reduced-motion: reduce) {
    .orbis-orbit-ring { animation: none; }
  }

  :global(html[data-motion='reduced']) .orbis-orbit-ring { animation: none; }



  /* ============================================================
     ARCADE — CARTES ILLUSTRÉES ET STATUTS
     Couche limitée à la grille des jeux ; le reste de la page reste inchangé.
     ============================================================ */
  @media (min-width: 1200px) {
    .world-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
  }

  .game-card { min-width: 0; padding: .55rem; }
  .tile-frame { gap: .75rem; padding: .5rem; }
  .card-top { align-items: flex-start; flex-wrap: wrap; gap: .4rem; }
  .category-tag { max-width: 100%; }
  .status-label {
    display: inline-flex; align-items: center; gap: .3rem;
    padding: .28rem .42rem; border: 1px solid currentColor;
    font-size: .66rem; font-weight: 850; line-height: 1.2;
    white-space: normal; overflow-wrap: anywhere;
  }
  .status-label::before {
    content: ""; display: inline-block; width: .42rem; height: .42rem;
    flex: 0 0 .42rem; border-radius: 50%; background: currentColor;
  }
  .status-available { color: #226b42; background: #e3f1e6; }
  .status-development { color: #914b0f; background: #ffead5; }
  .status-prototype { color: #a42b2b; background: #f9e1df; }

  .tile-art {
    position: relative; display: block; min-height: 0; aspect-ratio: 16 / 9;
    background: var(--orbis-orange-soft); isolation: isolate;
  }
  .tile-art::before { inset: 8px; z-index: 1; }
  .tile-art-placeholder {
    position: absolute; inset: 0; display: grid; place-items: center; overflow: hidden;
    background:
      linear-gradient(135deg, transparent 0 48%, rgb(25 24 21 / 7%) 49% 51%, transparent 52%),
      var(--orbis-orange-soft);
  }
  .placeholder-mark {
    position: relative; z-index: 1; padding: .3rem .55rem;
    border: 2px solid var(--orbis-ink); color: var(--orbis-ink);
    background: var(--orbis-card); font-size: clamp(1rem, 2vw, 1.5rem);
    font-weight: 950; letter-spacing: .15em;
  }
  .placeholder-orbit {
    position: absolute; display: block; width: 55%; aspect-ratio: 1;
    border: 2px solid var(--orbis-orange); border-radius: 50%;
    transform: rotate(-24deg) scaleY(.42);
  }
  .placeholder-orbit-one { width: 72%; }
  .placeholder-orbit-two { width: 48%; border-color: var(--orbis-ink); transform: rotate(42deg) scaleY(.42); }
  .game-art-image {
    position: absolute; z-index: 2; inset: 0; width: 100%; height: 100%;
    display: block; object-fit: cover; object-position: center;
  }
  .tile-art-index {
    z-index: 3; padding: .25rem .35rem; background: var(--orbis-card);
    border: 1px solid var(--orbis-ink); color: var(--orbis-ink);
    font-size: .53rem; letter-spacing: .08em;
  }
  .game-title { margin-bottom: .3rem; font-size: 1.08rem; }
  .game-desc { min-height: 2.7em; }
  .btn-play { margin-top: auto; min-height: 42px; }
  .btn-play span { font-size: 1.2em; transition: transform 160ms ease; }
  .btn-play:hover span { transform: translateX(3px); }

  :global(html[data-theme='dark']) .status-available { color: #a8e1ba; background: #203b2b; }
  :global(html[data-theme='dark']) .status-development { color: #ffd09d; background: #49301d; }
  :global(html[data-theme='dark']) .status-prototype { color: #ffb2ad; background: #4b2525; }
  :global(html[data-theme='dark']) .tile-art-placeholder { background-color: #483326; }
  :global(html[data-theme='dark']) .placeholder-mark,
  :global(html[data-theme='dark']) .tile-art-index { background: var(--orbis-card); color: var(--orbis-ink); border-color: var(--orbis-ink); }

  @media (max-width: 600px) {
    .tile-art { aspect-ratio: 16 / 9; min-height: 0; }
    .game-desc { min-height: 0; }
    .status-label { font-size: .64rem; }
  }

</style>
