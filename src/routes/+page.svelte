<script lang="ts">
  /* ORBIS — page d’accueil complète. Les commentaires repèrent les responsabilités ;
     la navigation, les profils et les modules restent fournis par les fichiers existants. */
  import { base } from '$app/paths';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { afterNavigate, beforeNavigate, disableScrollHandling, goto } from '$app/navigation';
  import { onMount, tick } from 'svelte';
  import { fly } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import CatalogCard from '$lib/orbis/components/CatalogCard.svelte';
  import OrbitCompanion from '$lib/orbis/components/OrbitCompanion.svelte';
  import PixelWordmark from '$lib/orbis/components/PixelWordmark.svelte';
  import { catalogHref, matchesCatalogLocation, rememberCatalogLocation, savedCatalogLocation, type CatalogView } from '$lib/orbis/navigation';
  import { clearStudentName, getStudentName, storeStudentName } from '$lib/orbis/identity/local-student';
  import { worlds, type WorldId } from '$lib/orbis/catalog/games';
  import { courses } from '$lib/orbis/catalog/courses';

  // =========================================================
  // ÉTAT DE LA PAGE ET PROFIL ÉLÈVE
  // =========================================================
  let ready = false;
  let studentName = '';
  let nameInput = '';
  // Static prerendering has no query parameters; read them only in the browser.
  $: catalogParams = browser ? $page.url.searchParams : new URLSearchParams();
  $: currentView = catalogParams.get('vue') === 'jeux' ? 'ARCADE'
    : catalogParams.get('vue') === 'cours' ? 'LAB' : 'HUB';

  // Filtres de l'Arcade : les matières sont définies explicitement dans worlds.ts.
  $: selectedArcadeCategory = catalogParams.get('matiere') || 'TOUS';
  const arcadeCategories = ['TOUS', 'MATHS', 'FRANÇAIS', 'SCIENCES', 'AUTRES', 'À CLASSER'];
  const categoryLabels: Record<string, string> = { TOUS: 'Toutes', MATHS: 'Maths', FRANÇAIS: 'Français', SCIENCES: 'Sciences', AUTRES: 'Autres', 'À CLASSER': 'À découvrir' };
  const gamePresentation: Record<WorldId, { notion: string; goal: string }> = {
    race: { notion: 'Calcul mental', goal: 'Calcule juste pour avancer.' },
    livrets: { notion: 'Multiplications', goal: 'Entraîne-toi aux tables.' },
    geometrie: { notion: 'Figures et solides', goal: 'Reconnais les formes et leurs propriétés.' },
    calculs: { notion: 'Décimaux', goal: 'Entraîne-toi avec les nombres à virgule.' },
    numeria: { notion: 'Grands nombres', goal: 'Lis et construis les grands nombres.' },
    pcp: { notion: 'Orientation', goal: 'Explore tes envies et tes projets.' },
    mesurovia: { notion: 'Mesures', goal: 'Convertis les unités de mesure.' },
    conju_lab: { notion: 'Conjugaison', goal: 'Choisis la bonne forme du verbe.' },
    shift: { notion: 'Numération', goal: 'Comprends la valeur de chaque chiffre.' },
    fractionstower2: { notion: 'Fractions', goal: 'Comprends les fractions, étape par étape.' },
    mathhunt: { notion: 'Calcul mental', goal: 'Vise la bonne réponse.' }
  };
  $: selectedGameNotion = catalogParams.get('notion');
  $: visibleArcadeCategories = arcadeCategories.filter(category => category === 'TOUS' || worlds.some(world => world.subject === category));
  $: gameNotions = Array.from(new Set(worlds.filter(world => selectedArcadeCategory === 'TOUS' || world.subject === selectedArcadeCategory).map(world => gamePresentation[world.id].notion)));

  const statusLabels = {
    available: 'Disponible',
    development: 'En développement',
    prototype: 'Prototype'
  } as const;

  // Le type est dérivé de statusLabels : impossible de créer un statut sans libellé.
  type GameStatus = keyof typeof statusLabels;
  type GameStatusFilter = 'ALL' | GameStatus;

  // Les filtres sont indépendants : la catégorie et le statut se cumulent.
  $: selectedGameStatus = (catalogParams.get('statut') || 'ALL') as GameStatusFilter;
  const gameStatusFilters: Array<{ value: GameStatusFilter; label: string }> = [
    { value: 'ALL', label: 'Tous les statuts' },
    { value: 'available', label: 'Disponible' },
    { value: 'development', label: 'En développement' },
    { value: 'prototype', label: 'Prototype' }
  ];

  // Navigation des cours : matière puis domaine.
  $: selectedSubject = catalogParams.get('matiere');
  $: selectedDomain = catalogParams.get('domaine');

  let pendingCatalogScroll: { href: string; scrollY: number } | null = null;
  let scrollRestoreVersion = 0;

  beforeNavigate(() => {
    scrollRestoreVersion += 1;
    pendingCatalogScroll = null;
    rememberCatalogLocation($page.url, window.scrollY);
  });
  afterNavigate((navigation) => {
    // Filters within the catalogue keep their current scroll. Returning from a game or
    // document restores its matching snapshot, including browser Previous/Next.
    if (navigation.from?.url.pathname === $page.url.pathname) return;
    const view = $page.url.searchParams.get('vue');
    if (view !== 'jeux' && view !== 'cours') return;
    const saved = savedCatalogLocation(base, view);
    if (!saved || !matchesCatalogLocation($page.url, saved.href)) return;
    disableScrollHandling();
    pendingCatalogScroll = { href: $page.url.href, scrollY: saved.scrollY };
  });

  // At remount the catalogue is initially hidden by the loading screen. Wait for
  // the profile, filtered cards and their layout before restoring the position.
  $: if (ready && pendingCatalogScroll) {
    const target = pendingCatalogScroll;
    pendingCatalogScroll = null;
    const version = ++scrollRestoreVersion;
    void tick().then(() => requestAnimationFrame(() => {
      if (version !== scrollRestoreVersion || $page.url.href !== target.href) return;
      window.scrollTo({ top: target.scrollY, left: 0, behavior: 'instant' });
    }));
  }

  function setCatalogFilters(view: CatalogView, changes: Record<string, string | null>) {
    const url = new URL($page.url);
    url.searchParams.set('vue', view);
    for (const [key, value] of Object.entries(changes)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    void goto(`${url.pathname}${url.search}`, { replaceState: true, noScroll: true, keepFocus: true });
  }

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
    pauseAnimations: boolean;
  }

  let theme: OrbisTheme = 'light';
  let settingsOpen = false;
  let appearanceTrigger: HTMLButtonElement | undefined;
  let appearanceClose: HTMLButtonElement | undefined;
  let largeText = false;
  let comfortableSpacing = false;
  let highContrast = false;
  let reduceMotion = false;
  let systemReduceMotion = false;
  let pauseAnimations = false;
  $: comfortEnabled = largeText && comfortableSpacing && reduceMotion;
  $: motionReduced = reduceMotion || systemReduceMotion || pauseAnimations;
  $: transitionDuration = ready && !motionReduced ? 200 : 0;
  const encouragements = ['Apprendre. Explorer. Progresser.', 'Un essai de plus, un pas de plus.', 'On apprend aussi en se trompant.', 'Comprendre prend du temps. Chaque progrès compte.'];

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
        pauseAnimations = saved.pauseAnimations === true;
      }
    } catch {
      // Si les données sont illisibles, on garde les réglages par défaut.
    }

    applyOrbisPreferences();
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    systemReduceMotion = motionQuery.matches;
    const updateMotionPreference = (event: MediaQueryListEvent) => systemReduceMotion = event.matches;
    motionQuery.addEventListener('change', updateMotionPreference);
    ready = true;
    return () => motionQuery.removeEventListener('change', updateMotionPreference);
  });

  // Applique les préférences au document pour que le CSS les utilise.
  function applyOrbisPreferences() {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.dataset.textSize = largeText ? 'large' : 'normal';
    root.dataset.spacing = comfortableSpacing ? 'comfortable' : 'normal';
    root.dataset.contrast = highContrast ? 'high' : 'normal';
    root.dataset.motion = reduceMotion || pauseAnimations ? 'reduced' : 'normal';
  }

  // Enregistre les réglages et les applique immédiatement.
  function saveOrbisPreferences() {
    const preferences: OrbisPreferences = {
      theme,
      largeText,
      comfortableSpacing,
      highContrast,
      reduceMotion,
      pauseAnimations
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

  function toggleComfort() {
    const enabled = !comfortEnabled;
    largeText = enabled;
    comfortableSpacing = enabled;
    reduceMotion = enabled;
    saveOrbisPreferences();
  }

  function toggleAnimationPause() {
    pauseAnimations = !pauseAnimations;
    saveOrbisPreferences();
  }

  async function closeAppearance() {
    settingsOpen = false;
    await tick();
    appearanceTrigger?.focus();
  }

  async function toggleAppearance() {
    if (settingsOpen) return closeAppearance();
    settingsOpen = true;
    await tick();
    appearanceClose?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: motionReduced ? 'instant' : 'smooth' });
  }

  function handleAppearanceKey(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !settingsOpen) return;
    event.preventDefault();
    void closeAppearance();
  }

  function courseImage(domain: string): string {
    const name = domain === 'Fractions' ? 'fractions' : domain === 'Espace' ? 'geometrie' : 'mesures';
    return `${base}/orbis/illustrations/${name}.svg`;
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
    void goto(`${base}/`);
  }

  // Conserve la méthode de navigation existante avec le prénom en URL.
  function routeFor(route: string): string {
    const cleanRoute = route.startsWith('/') ? route : `/${route}`;
    return `${base}${cleanRoute}?eleve=${encodeURIComponent(studentName)}`;
  }

  // Les matières sont renseignées dans worlds.ts. Les jeux non classés restent visibles.
  // Cela évite de déduire une matière à partir du nom d'un jeu.

  // Données calculées pour les filtres Arcade et Cours.
  // Un jeu n'a pas besoin de satisfaire les deux critères quand un filtre est sur « Tous ».
  // Le statut 'available' sert de valeur de secours si un ancien jeu n'en possède pas encore.
  $: filteredWorlds = worlds.filter((world) => {
    const matchesCategory =
      selectedArcadeCategory === 'TOUS' || world.subject === selectedArcadeCategory;

    const status: GameStatus = world.status ?? 'available';
    const matchesStatus =
      selectedGameStatus === 'ALL' || status === selectedGameStatus;

    const matchesNotion = !selectedGameNotion || gamePresentation[world.id].notion === selectedGameNotion;
    return matchesCategory && matchesStatus && matchesNotion;
  });

  $: subjects = Array.from(new Set(courses.map((course) => course.subject)));

  $: domainsForSubject = selectedSubject
    ? Array.from(new Set(
        courses
          .filter((course) => course.subject === selectedSubject)
          .map((course) => course.domain)
      ))
    : [];

  $: filteredCourses = courses.filter((course) => {
    if (selectedSubject && course.subject !== selectedSubject) return false;
    if (selectedDomain && course.domain !== selectedDomain) return false;
    return true;
  });

  function selectSubject(subject: string) {
    setCatalogFilters('cours', { matiere: selectedSubject === subject ? null : subject, domaine: null });
  }

  function selectDomain(domain: string) {
    setCatalogFilters('cours', { domaine: selectedDomain === domain ? null : domain });
  }
</script>

<svelte:window on:keydown={handleAppearanceKey} />

<svelte:head>
  <title>Orbis — Apprendre. Explorer. Progresser.</title>
  <meta name="description" content="Des cours pour comprendre, des jeux pour essayer. Explore Orbis et avance à ton rythme." />
  <meta name="theme-color" content={theme === 'dark' ? '#20232a' : '#e9eaee'} />
</svelte:head>

<div class="orbis-shell" data-theme={theme} class:large-text={largeText} class:spacious={comfortableSpacing} class:high-contrast={highContrast} class:comfort-enabled={comfortEnabled} class:motion-reduced={motionReduced}>
  <div class="site-frame">
    <header class="site-header">
      <a class="orbis-brand" href={`${base}/`} aria-label="Orbis, revenir à l’accueil">
        <svg class="brand-symbol" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
          <circle cx="32" cy="32" r="15" fill="var(--orbis-ink)" />
          <g class="brand-orbit"><ellipse cx="32" cy="32" rx="28" ry="11" fill="none" stroke="var(--orbis-orange)" stroke-width="3" /><circle cx="59" cy="32" r="4" fill="var(--orbis-orange)" /></g>
          <circle cx="27" cy="27" r="3" fill="var(--orbis-card-surface)" />
        </svg>
        <span>orbis</span>
      </a>
      <nav class="main-navigation" aria-label="Navigation principale">
        <a href={`${base}/`} aria-current={currentView === 'HUB' ? 'page' : undefined}>/ Accueil</a>
        <a href={catalogHref(base, 'jeux', studentName)} aria-current={currentView === 'ARCADE' ? 'page' : undefined}>/ Jeux</a>
        <a href={catalogHref(base, 'cours', studentName)} aria-current={currentView === 'LAB' ? 'page' : undefined}>/ Cours</a>
      </nav>
      <button id="orbis-comfort" class="comfort-toggle" type="button" aria-pressed={comfortEnabled} on:click={toggleComfort}>
        <span>{comfortEnabled ? 'Confort activé' : 'Confort de lecture'}</span><span aria-hidden="true">↗</span>
      </button>
    </header>

    {#if settingsOpen}
      <section id="orbis-appearance" class="appearance-panel" aria-labelledby="appearance-heading" in:fly={{ y: -4, duration: transitionDuration }}>
        <div class="appearance-heading"><h2 id="appearance-heading">À ta façon.</h2><button bind:this={appearanceClose} class="text-button" type="button" on:click={closeAppearance} aria-label="Fermer les réglages">Fermer ×</button></div>
        <fieldset><legend>Apparence</legend><div class="theme-options"><button type="button" aria-pressed={theme === 'light'} on:click={() => setOrbisTheme('light')}>Clair doux</button><button type="button" aria-pressed={theme === 'dark'} on:click={() => setOrbisTheme('dark')}>Sombre</button></div></fieldset>
        <label><span>Texte plus grand</span><input type="checkbox" checked={largeText} on:change={(event) => setBooleanPreference('largeText', event)} /></label>
        <label><span>Lecture aérée</span><input type="checkbox" checked={comfortableSpacing} on:change={(event) => setBooleanPreference('comfortableSpacing', event)} /></label>
        <label><span>Contraste renforcé</span><input type="checkbox" checked={highContrast} on:change={(event) => setBooleanPreference('highContrast', event)} /></label>
        <label><span>Réduire les mouvements</span><input type="checkbox" checked={reduceMotion} on:change={(event) => setBooleanPreference('reduceMotion', event)} /></label>
      </section>
    {/if}

    <div class="encouragement-band">
      <div class="encouragement-window">
        {#if motionReduced}
          <p class="encouragement-static">Un essai de plus, un pas de plus.</p>
        {:else}
          <span class="sr-only">{encouragements.join(' ')}</span>
          <div class="encouragement-track" aria-hidden="true">
            {#each [0, 1] as repeat}<div class="encouragement-copy">{#each encouragements as phrase}<span>{phrase}</span><span class="band-star">✳</span>{/each}</div>{/each}
          </div>
        {/if}
      </div>
      <button class="motion-toggle" type="button" on:click={toggleAnimationPause} aria-pressed={motionReduced} disabled={reduceMotion || systemReduceMotion} aria-label={motionReduced ? 'Relancer les animations' : 'Mettre les animations en pause'}>
        <span aria-hidden="true">{motionReduced ? '▷' : 'Ⅱ'}</span><span>{reduceMotion || systemReduceMotion ? 'Au calme' : pauseAnimations ? 'Relancer' : 'Pause'}</span>
      </button>
    </div>

    <main id="orbis-content">
      {#if !ready}
        <div class="loading-state" role="status">Préparation d’Orbis…</div>
      {:else if currentView === 'HUB' || !studentName}
        <section class="home-view" in:fly={{ y: 8, duration: transitionDuration }}>
          <div class="editorial-meta"><span>Un espace pour apprendre</span><span>À ton rythme. À ta façon.</span></div>
          <h1 class="wordmark"><span class="sr-only">Orbis — Apprendre. Explorer. Progresser.</span><PixelWordmark /><span class="wordmark-corner" aria-hidden="true"></span></h1>
          <div class="hero-grid">
            <div class="hero-motto"><span>Apprendre.</span><span>Explorer.</span><span>Progresser.</span><span class="motto-index" aria-hidden="true">[ ORB / 01 ]</span></div>
            <div class="hero-intro">
              <p class="eyebrow">{studentName ? `Bonjour ${studentName}.` : 'Bienvenue sur Orbis.'}</p>
              <h2>Comprendre.<br />Puis essayer.</h2>
              <p>Un cours pour découvrir.<br />Un jeu pour t’entraîner.</p>
              {#if !studentName}
                <form class="entry-form" on:submit|preventDefault={login}>
                  <label for="student-name-input">Ton prénom</label>
                  <div class="entry-fields"><input id="student-name-input" bind:value={nameInput} required minlength="2" maxlength="40" placeholder="Ton prénom" autocomplete="given-name" /><button class="solid-action" type="submit">Entrer <span aria-hidden="true">↗</span></button></div>
                </form>
              {/if}
            </div>
            <div class="robot-cell"><span class="robot-caption">Toujours en orbite.</span><OrbitCompanion reducedMotion={reduceMotion || systemReduceMotion} paused={pauseAnimations} id="orbis-robot" /></div>
          </div>
          {#if studentName}
            <div class="portal-grid">
              <div class="portal-label"><span>Ton prochain pas.</span><span class="portal-label-arrow" aria-hidden="true">↓</span></div>
              <a class="portal portal-games" href={catalogHref(base, 'jeux', studentName)}><span class="portal-number">01 / S’entraîner</span><strong>Les jeux</strong><span class="portal-arrow" aria-hidden="true">↗</span></a>
              <a class="portal" href={catalogHref(base, 'cours', studentName)}><span class="portal-number">02 / Comprendre</span><strong>Les cours</strong><span class="portal-arrow" aria-hidden="true">↗</span></a>
            </div>
            <div class="home-note"><span>{worlds.length} jeux · {courses.length} cours</span><span>Choisis une activité. Essaie. Reviens quand tu veux.</span></div>
          {/if}
        </section>
      {:else if currentView === 'ARCADE'}
        <section class="catalog-view" aria-labelledby="games-heading" in:fly={{ y: 8, duration: transitionDuration }}>
          <div class="section-rail"><a href={`${base}/`}>← Accueil</a><span>01 / S’entraîner</span></div>
          <div class="catalog-heading"><h1 id="games-heading">Les jeux.</h1><p>Choisis une matière.<br />Trouve ton prochain défi.</p></div>
          <div class="filter-row"><span class="filter-label">Matière</span><div class="filter-options" role="group" aria-label="Matière des jeux">
            {#each visibleArcadeCategories as category}<button type="button" aria-pressed={selectedArcadeCategory === category} on:click={() => setCatalogFilters('jeux', { matiere: category === 'TOUS' ? null : category, notion: null })}>{categoryLabels[category]}</button>{/each}
          </div></div>
          {#if selectedArcadeCategory !== 'TOUS' && gameNotions.length > 1}
            <div class="filter-row notion-row" in:fly={{ y: -4, duration: transitionDuration }}><span class="filter-label">Notion</span><div class="filter-options" role="group" aria-label="Notion des jeux"><button type="button" aria-pressed={!selectedGameNotion} on:click={() => setCatalogFilters('jeux', { notion: null })}>Toutes</button>{#each gameNotions as notion}<button type="button" aria-pressed={selectedGameNotion === notion} on:click={() => setCatalogFilters('jeux', { notion })}>{notion}</button>{/each}</div></div>
          {/if}
          <div class="catalog-meta"><p aria-live="polite" aria-atomic="true">{filteredWorlds.length} {filteredWorlds.length > 1 ? 'jeux à explorer' : 'jeu à explorer'}</p><label class="status-select"><span class="sr-only">Disponibilité des jeux</span><select value={selectedGameStatus} on:change={(event) => setCatalogFilters('jeux', { statut: event.currentTarget.value === 'ALL' ? null : event.currentTarget.value })}>{#each gameStatusFilters as filter}<option value={filter.value}>{filter.label}</option>{/each}</select></label></div>
          {#if filteredWorlds.length}
            <div class="catalog-grid">
              {#each filteredWorlds as world, index (world.id)}
                <div class="catalog-item" in:fly={{ y: 10, duration: transitionDuration, delay: motionReduced ? 0 : Math.min(index, 3) * 25 }} animate:flip={{ duration: transitionDuration }}>
                  <CatalogCard title={world.title} description={gamePresentation[world.id].goal} subject={categoryLabels[world.subject]} meta={gamePresentation[world.id].notion} status={world.status === 'available' ? undefined : world.status} image={world.image ? `${base}/images/games/${world.image}` : undefined} href={routeFor(world.route)} actionLabel="Jouer" {index} reducedMotion={motionReduced} />
                </div>
              {/each}
            </div>
          {:else}
            <div class="empty-state"><h2>Aucune activité avec ces filtres.</h2><p>Essaie une autre matière ou une autre notion.</p><button class="solid-action" type="button" on:click={() => setCatalogFilters('jeux', { matiere: null, notion: null, statut: null })}>Voir tous les jeux <span aria-hidden="true">↗</span></button></div>
          {/if}
        </section>
      {:else}
        <section class="catalog-view" aria-labelledby="courses-heading" in:fly={{ y: 8, duration: transitionDuration }}>
          <div class="section-rail"><a href={`${base}/`}>← Accueil</a><span>02 / Comprendre</span></div>
          <div class="catalog-heading"><h1 id="courses-heading">Les cours.</h1><p>Une notion à comprendre.<br />Des repères pour avancer.</p></div>
          <div class="filter-row"><span class="filter-label">Matière</span><div class="filter-options" role="group" aria-label="Matière des cours"><button type="button" aria-pressed={selectedSubject === null} on:click={() => setCatalogFilters('cours', { matiere: null, domaine: null })}>Toutes</button>{#each subjects as subject}<button type="button" aria-pressed={selectedSubject === subject} on:click={() => selectSubject(subject)}>{subject}</button>{/each}</div></div>
          {#if selectedSubject}
            <div class="filter-row notion-row" in:fly={{ y: -4, duration: transitionDuration }}><span class="filter-label">Notion</span><div class="filter-options" role="group" aria-label="Notion des cours"><button type="button" aria-pressed={selectedDomain === null} on:click={() => setCatalogFilters('cours', { domaine: null })}>Toutes</button>{#each domainsForSubject as domain}<button type="button" aria-pressed={selectedDomain === domain} on:click={() => selectDomain(domain)}>{domain}</button>{/each}</div></div>
          {/if}
          <div class="catalog-meta"><p aria-live="polite" aria-atomic="true">{filteredCourses.length} cours à explorer</p><span>Comprendre, puis pratiquer.</span></div>
          {#if filteredCourses.length}
            <div class="catalog-grid">
              {#each filteredCourses as course, index (course.id)}
                <div class="catalog-item" in:fly={{ y: 10, duration: transitionDuration, delay: motionReduced ? 0 : Math.min(index, 3) * 25 }} animate:flip={{ duration: transitionDuration }}>
                  <CatalogCard title={course.title} description={course.description} subject={course.domain} meta={course.duration || course.level} image={courseImage(course.domain)} href={routeFor(course.href)} actionLabel="Ouvrir" {index} reducedMotion={motionReduced} />
                </div>
              {/each}
            </div>
          {:else}
            <div class="empty-state"><h2>Aucun cours avec ces filtres.</h2><button class="solid-action" type="button" on:click={() => setCatalogFilters('cours', { matiere: null, domaine: null })}>Voir tous les cours <span aria-hidden="true">↗</span></button></div>
          {/if}
        </section>
      {/if}
    </main>

    <footer class="site-footer">
      <span class="footer-brand">Orbis / Apprendre. Explorer. Progresser.</span>
      <div class="footer-links"><button bind:this={appearanceTrigger} class="text-button" type="button" aria-expanded={settingsOpen} aria-controls="orbis-appearance" on:click={toggleAppearance}>Affichage</button><a href={`${base}/teacher`}>Espace enseignant</a>{#if studentName}<button class="text-button" type="button" on:click={logout}>Changer de prénom</button>{/if}</div>
    </footer>
    <span class="sr-only" role="status">{comfortEnabled ? 'Confort activé : texte agrandi, lecture aérée, mouvements arrêtés.' : ''}</span>
  </div>
</div>

<style>
  .orbis-shell { --orbis-paper:#e9eaee; --orbis-card-surface:#fff; --orbis-ink:#20211f; --orbis-muted:#51555e; --orbis-line:#b8bdc9; --orbis-orange:#e88a39; --orbis-action-text:#fff; --orbis-label-font:ui-monospace,SFMono-Regular,Consolas,monospace; min-height:100vh; padding:0 1rem; background:var(--orbis-paper); color:var(--orbis-ink); font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:1.55; }
  .site-frame { max-width:1480px; margin:auto; border-inline:1px solid var(--orbis-line); }
  .orbis-shell :global(*) { box-sizing:border-box; }
  .orbis-shell :global(button), .orbis-shell :global(a), .orbis-shell :global(input), .orbis-shell :global(select) { -webkit-tap-highlight-color:transparent; }
  .orbis-shell :global(button:focus-visible), .orbis-shell :global(a:focus-visible), .orbis-shell :global(input:focus-visible), .orbis-shell :global(select:focus-visible) { outline:3px solid var(--orbis-ink); outline-offset:4px; }
  a { color:inherit; text-decoration:none; }
  button { color:inherit; }
  h1,h2,p { margin:0; }
  .site-header { display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:1.5rem; min-height:88px; padding:1rem 1.5rem; border-bottom:1px solid var(--orbis-line); }
  .orbis-brand { width:fit-content; display:flex; align-items:center; gap:.65rem; font:500 1.65rem/1 var(--orbis-label-font); }
  .brand-symbol { width:42px; height:42px; overflow:visible; }
  .brand-orbit { transform-origin:32px 32px; animation:header-orbit 18s linear infinite; }
  @keyframes header-orbit { from { transform:rotate(-24deg); } to { transform:rotate(336deg); } }
  .main-navigation { display:flex; align-items:center; gap:1.25rem; font:500 .875rem/1.4 var(--orbis-label-font); }
  .main-navigation a { display:flex; align-items:center; min-height:44px; white-space:nowrap; }
  .main-navigation a[aria-current='page'] { text-decoration:underline; text-underline-offset:8px; text-decoration-color:var(--orbis-orange); text-decoration-thickness:2px; }
  .comfort-toggle { justify-self:end; min-height:44px; display:flex; align-items:center; gap:.85rem; padding:.7rem .85rem; border:1px solid var(--orbis-ink); background:var(--orbis-card-surface); font:500 .8125rem/1.4 var(--orbis-label-font); }
  .comfort-toggle[aria-pressed='true'] { color:var(--orbis-paper); background:var(--orbis-ink); }
  .encouragement-band { display:flex; overflow:hidden; background:var(--orbis-orange); color:#20211f; border-bottom:1px solid var(--orbis-ink); }
  .encouragement-window { flex:1; min-width:0; overflow:hidden; display:flex; align-items:center; }
  .encouragement-track { display:flex; flex-shrink:0; width:max-content; animation:encouragement-scroll 48s linear infinite; }
  .encouragement-copy { display:flex; flex-shrink:0; align-items:center; gap:2rem; padding:.65rem 1rem; font:600 .8125rem/1.4 var(--orbis-label-font); white-space:nowrap; }
  .band-star { font-size:1.1rem; }
  .encouragement-band:hover .encouragement-track,.encouragement-band:focus-within .encouragement-track { animation-play-state:paused; }
  @keyframes encouragement-scroll { to { transform:translateX(-50%); } }
  .encouragement-static { padding:.65rem 1rem; font:600 .8125rem/1.4 var(--orbis-label-font); }
  .motion-toggle { display:flex; flex:0 0 auto; gap:.55rem; justify-content:center; align-items:center; min-height:44px; min-width:100px; padding:.55rem .8rem; border:0; border-left:1px solid currentColor; background:var(--orbis-orange); color:#20211f; font:500 .75rem/1.4 var(--orbis-label-font); }
  .motion-toggle:disabled { opacity:1; cursor:default; }
  .loading-state { padding:5rem 1.5rem; text-align:center; }
  .editorial-meta { display:flex; justify-content:space-between; flex-wrap:wrap; gap:1rem; padding:1.3rem 1.5rem .5rem; font:500 .7rem/1.4 var(--orbis-label-font); text-transform:uppercase; letter-spacing:.04em; }
  .wordmark { position:relative; padding:1rem 1.5rem 1.8rem; border-bottom:1px solid var(--orbis-line); line-height:1; }
  .wordmark-corner { position:absolute; right:1.5rem; top:1rem; width:14px; height:14px; background:var(--orbis-orange); }
  .hero-grid { display:grid; grid-template-columns:.82fr 1.3fr 1fr; border-bottom:1px solid var(--orbis-line); }
  .hero-grid>div { position:relative; min-width:0; }
  .hero-grid>div+div { border-left:1px solid var(--orbis-line); }
  .hero-motto { display:flex; flex-direction:column; justify-content:center; padding:2rem 1.5rem; font:500 clamp(1rem,1.5vw,1.3rem)/1.7 var(--orbis-label-font); }
  .hero-motto>span:first-child { color:#98400e; }
  .motto-index { margin-top:2rem; color:var(--orbis-muted); font-size:.7rem; }
  .hero-intro { padding:2rem; display:flex; flex-direction:column; justify-content:center; gap:1rem; }
  .eyebrow { color:var(--orbis-muted); font:500 .8125rem/1.5 var(--orbis-label-font); overflow-wrap:anywhere; }
  .hero-intro h2 { font-size:clamp(1.8rem,3.1vw,3rem); line-height:1.08; letter-spacing:-.055em; font-weight:500; }
  .hero-intro>p:not(.eyebrow) { color:var(--orbis-muted); font-size:1rem; }
  .robot-cell { display:flex; flex-direction:column; justify-content:center; align-items:center; overflow:hidden; min-height:280px; }
  .robot-caption { align-self:flex-start; padding:1rem 1.2rem 0; font:500 .7rem/1.4 var(--orbis-label-font); color:var(--orbis-muted); }
  .entry-form { display:grid; gap:.45rem; margin-top:.35rem; }
  .entry-form label { font:500 .8125rem/1.4 var(--orbis-label-font); }
  .entry-fields { display:flex; flex-wrap:wrap; gap:.5rem; }
  .entry-fields input { width:0; min-width:120px; flex:1; padding:.7rem .8rem; min-height:48px; border:1px solid var(--orbis-line); border-radius:0; background:var(--orbis-card-surface); color:var(--orbis-ink); font-size:1rem; }
  .solid-action { min-height:48px; display:inline-flex; align-items:center; justify-content:space-between; gap:1.5rem; padding:.7rem 1rem; border:0; background:var(--orbis-ink); color:var(--orbis-action-text); text-decoration:none; font:500 .875rem/1.4 var(--orbis-label-font); clip-path:polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px); }
  .portal-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); border-bottom:1px solid var(--orbis-line); }
  .portal-label { padding:1.5rem; display:flex; flex-direction:column; justify-content:space-between; gap:1rem; font:500 .8125rem/1.5 var(--orbis-label-font); }
  .portal-label-arrow { font:400 2rem/1 Arial,sans-serif; }
  .portal { display:flex; flex-direction:column; position:relative; gap:2rem; padding:1.4rem 1.5rem; min-height:160px; border-left:1px solid var(--orbis-line); transition:background-color 160ms ease; }
  .portal-number { font:500 .75rem/1.5 var(--orbis-label-font); }
  .portal strong { font-size:clamp(1.8rem,3vw,2.5rem); line-height:1.1; font-weight:500; letter-spacing:-.05em; }
  .portal-arrow { position:absolute; right:1.5rem; bottom:1.2rem; font-size:2rem; transition:transform 160ms ease; }
  .portal-games { background:var(--orbis-orange); color:#20211f; }
  .portal:hover .portal-arrow { transform:translate(3px,-3px); }
  .home-note { display:flex; justify-content:space-between; flex-wrap:wrap; gap:1rem; padding:1.25rem 1.5rem; color:var(--orbis-muted); font:500 .75rem/1.5 var(--orbis-label-font); }
  .section-rail { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.5rem 1.5rem; min-height:58px; font:500 .75rem/1.5 var(--orbis-label-font); border-bottom:1px solid var(--orbis-line); }
  .section-rail a { display:inline-flex; align-items:center; min-height:44px; }
  .catalog-heading { display:grid; grid-template-columns:2fr 1fr; align-items:center; gap:1rem; padding:2.2rem 1.5rem; border-bottom:1px solid var(--orbis-line); }
  .catalog-heading h1 { font-size:clamp(2.6rem,5.5vw,5.5rem); letter-spacing:-.065em; line-height:1.05; font-weight:500; }
  .catalog-heading p { color:var(--orbis-muted); }
  .filter-row { display:grid; grid-template-columns:130px 1fr; gap:1rem; align-items:start; padding:.85rem 1.5rem; border-bottom:1px solid var(--orbis-line); }
  .filter-label { padding-block:.7rem; color:var(--orbis-muted); font:500 .75rem/1.5 var(--orbis-label-font); }
  .filter-options { display:flex; align-items:center; flex-wrap:wrap; gap:.4rem; }
  .filter-options button,.theme-options button { min-height:44px; padding:.55rem .85rem; border:1px solid var(--orbis-line); background:var(--orbis-paper); font-size:.875rem; transition:background-color 140ms ease,color 140ms ease,transform 140ms ease; }
  .filter-options button[aria-pressed='true'],.theme-options button[aria-pressed='true'] { background:var(--orbis-ink); border-color:var(--orbis-ink); color:var(--orbis-paper); }
  .filter-options button:active,.comfort-toggle:active,.solid-action:active { transform:translateY(1px); }
  .catalog-meta { min-height:64px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:.75rem; padding:.6rem 1.5rem; border-bottom:1px solid var(--orbis-line); font:500 .75rem/1.5 var(--orbis-label-font); color:var(--orbis-muted); }
  .status-select select { max-width:100%; min-height:44px; padding:.5rem 1.8rem .5rem .7rem; border:1px solid var(--orbis-line); border-radius:0; background:var(--orbis-card-surface); color:var(--orbis-ink); font:500 .8125rem/1.4 var(--orbis-label-font); }
  .catalog-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:1px; background:var(--orbis-line); border-bottom:1px solid var(--orbis-line); }
  .catalog-item { min-width:0; display:flex; }
  .empty-state { display:grid; justify-items:start; gap:1rem; padding:3rem 1.5rem; }
  .empty-state h2 { font-size:1.4rem; font-weight:500; }
  .appearance-panel { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:1rem 2rem; padding:1.5rem; border-bottom:1px solid var(--orbis-line); background:var(--orbis-card-surface); }
  .appearance-heading { grid-column:1/-1; display:flex; justify-content:space-between; gap:1rem; align-items:center; }
  .appearance-heading h2 { font-size:1.5rem; font-weight:500; }
  .appearance-panel fieldset { grid-column:1/-1; margin:0; padding:0; border:0; }
  .appearance-panel legend { margin-bottom:.6rem; font-size:.875rem; }
  .theme-options { display:flex; flex-wrap:wrap; gap:.5rem; }
  .appearance-panel>label { display:flex; align-items:center; justify-content:space-between; gap:1rem; min-height:44px; }
  .appearance-panel input { width:22px; height:22px; accent-color:var(--orbis-ink); }
  .site-footer { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:.5rem 1rem; min-height:78px; padding:1rem 1.5rem; border-top:1px solid var(--orbis-line); color:var(--orbis-muted); font:500 .7rem/1.5 var(--orbis-label-font); }
  .footer-links { display:flex; flex-wrap:wrap; align-items:center; gap:1rem; }
  .footer-links>a,.text-button { display:inline-flex; align-items:center; min-height:44px; }
  .text-button { padding:0; border:0; background:none; font:inherit; text-decoration:underline; text-underline-offset:4px; }
  .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
  .large-text { font-size:18px; --orbis-card-title-size:1.15rem; --orbis-card-body-size:1rem; --orbis-card-meta-size:.875rem; }
  .large-text .filter-options button { font-size:1rem; }
  .large-text .hero-intro>p:not(.eyebrow),.large-text .catalog-heading p { font-size:1.15rem; }
  .spacious .hero-intro { gap:1.3rem; line-height:1.75; }
  .spacious .catalog-meta { padding-block:1rem; }
  .comfort-enabled { --orbis-label-font:Arial,Helvetica,sans-serif; --orbis-paper:#f4f1e9; --orbis-line:#b9bab3; }
  .high-contrast { --orbis-ink:#111; --orbis-muted:#303330; --orbis-line:#72776e; }
  .orbis-shell[data-theme='dark'] { --orbis-paper:#20232a; --orbis-card-surface:#2a2e35; --orbis-ink:#f1f0e8; --orbis-muted:#c3c7cf; --orbis-line:#66707c; --orbis-orange:#e99b55; --orbis-action-text:#20232a; color-scheme:dark; }
  .orbis-shell[data-theme='dark'] .hero-motto>span:first-child { color:var(--orbis-orange); }
  .motion-reduced .brand-orbit { animation:none; }
  .motion-reduced .portal-arrow,.motion-reduced .portal,.motion-reduced .filter-options button { transition:none; }
  .motion-reduced .portal:hover .portal-arrow { transform:none; }
  @media (prefers-reduced-motion:reduce) { .brand-orbit,.encouragement-track { animation:none; } .portal-arrow,.portal,.filter-options button { transition:none; } .portal:hover .portal-arrow { transform:none; } }
  @media (max-width:1160px) { .catalog-grid { grid-template-columns:repeat(3,minmax(0,1fr)); } .hero-grid { grid-template-columns:.65fr 1.2fr 1fr; } .hero-intro { padding:1.5rem; } }
  @media (max-width:900px) { .catalog-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .site-header { grid-template-columns:1fr auto; gap:.4rem 1rem; } .main-navigation { grid-column:1/-1; grid-row:2; justify-content:center; } .comfort-toggle { grid-column:2; grid-row:1; } .hero-grid { grid-template-columns:1.2fr 1fr; } .hero-motto { display:none; } .hero-grid>div.hero-intro { border-left:0; } .catalog-heading { grid-template-columns:1.5fr 1fr; } }
  @media (max-width:580px) { .orbis-shell { padding:0 .5rem; } .site-header { padding:.8rem 1rem; gap:.4rem .8rem; } .orbis-brand { font-size:1.4rem; gap:.4rem; } .brand-symbol { width:33px; height:33px; } .comfort-toggle { font-size:.7rem; gap:.6rem; padding:.6rem; } .main-navigation { font-size:.8125rem; gap:1.5rem; } .editorial-meta { padding:1rem 1rem .4rem; } .editorial-meta>span:last-child { display:none; } .wordmark { padding:.8rem 1rem 1.1rem; } .wordmark-corner { width:8px; height:8px; right:1rem; top:.8rem; } .hero-grid { grid-template-columns:1fr; } .hero-intro { padding:1.5rem 1rem; } .hero-intro h2 { font-size:2rem; } .hero-grid>div.robot-cell { border-left:0; border-top:1px solid var(--orbis-line); min-height:220px; } .robot-caption { align-self:center; padding:.8rem 0 0; } .robot-cell :global(.orbit-companion) { max-height:230px; } .portal-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .portal-label { display:none; } .portal { min-height:142px; padding:1.2rem 1rem; } .portal:first-of-type { border-left:0; } .portal strong { font-size:1.8rem; } .portal-arrow { right:.85rem; bottom:.8rem; } .portal-number { font-size:.7rem; } .home-note { padding:1rem; } .home-note>span:last-child { display:none; } .catalog-grid { grid-template-columns:1fr; } .catalog-heading { grid-template-columns:1fr; gap:1rem; padding:1.8rem 1rem; } .catalog-heading h1 { font-size:3rem; } .catalog-heading p { font-size:1rem; } .section-rail { padding:.4rem 1rem; } .filter-row { grid-template-columns:1fr; gap:.3rem; padding:.8rem 1rem; } .filter-label { padding:0; } .catalog-meta { padding:.65rem 1rem; } .catalog-meta>span { display:none; } .filter-options { gap:.4rem; } .filter-options button { padding:.6rem .75rem; } .motion-toggle { min-width:88px; padding:.55rem .6rem; } .encouragement-static { font-size:.75rem; padding:.55rem .75rem; } .site-footer { padding:1rem; } .appearance-panel { grid-template-columns:1fr; padding:1rem; } .footer-links { gap:.75rem; } }
  @media print { .site-header,.encouragement-band,.site-footer,.robot-cell,.appearance-panel { display:none; } .orbis-shell { padding:0; } }
</style>
