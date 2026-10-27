<script lang="ts">
  /**
   * MESUROVIA V3 — page de jeu intégrable dans ORBIS / SvelteKit.
   *
   * Choix de conception :
   * - une seule diapositive visible à la fois pour limiter la recherche d'information ;
   * - la théorie est divisée en 4 explications, chacune suivie d'une question obligatoire ;
   * - les maisons et villages restent tous accessibles dans ce prototype ;
   * - la carte utilise le point-and-click : aucun déplacement au clavier n'est enregistré ;
   * - profil et progression sont stockés dans une clé V2 dédiée, sans modifier les anciennes sauvegardes.
   */
  import { onDestroy, onMount } from 'svelte';
  import { base } from '$app/paths';
  import { catalogHref, restoreCatalogReturn } from '$lib/orbis/navigation';
  import engine from '$lib/games/mesurovia/engine-v3-adapter';
  import { createMemoryCards, createMemoryPairs, type MemoryCard } from '$lib/games/mesurovia/memory-game';
  import { createBlankProfile, normalizeProfile, type HouseProgress, type Profile } from '$lib/games/mesurovia/progress';
  import ActivityIllustration from '$lib/games/mesurovia/ActivityIllustration.svelte';
  import GameObjectArt from '$lib/games/mesurovia/GameObjectArt.svelte';
  import ConversionGuide from '$lib/games/mesurovia/ConversionGuide.svelte';
  import { houseCurriculum, villageCurriculum } from '$lib/games/mesurovia/curriculum';
  import { coursePaths } from '$lib/orbis/catalog/course-paths';

  type View = 'welcome' | 'games-catalog' | 'courses-catalog' | 'character' | 'villages' | 'village' | 'room' | 'pretest' | 'howto';
  type SessionMode = 'practice' | 'battle' | 'table' | 'detective' | 'clock' | 'builder' | 'memory' | 'race' | 'exam' | 'boss' | 'pretest';
  type Feedback = { kind: 'success' | 'hint' | 'worked' | 'notice'; title: string; text: string } | null;
  type Session = {
    mode: SessionMode;
    questions: any[];
    index: number;
    correct: number;
    firstTryCorrect: number;
    wrong: number;
    attempts: number;
    helped: boolean;
    answerStatus: 'correct' | 'wrong' | null;
    selected: string;
    typed: string;
    selectedMany: string[];
    matches: Record<string, string>;
    matchingLeft: string;
    orderedItems: string[];
    gameEvent: 'player-attack' | 'enemy-attack' | 'success' | 'miss' | 'race-move' | null;
    playerHp: number;
    enemyHp: number;
    raceSteps: number;
    rivalSteps: number;
    raceRoll: number;
    memoryCards: MemoryCard[];
    memoryOpenIds: string[];
    memoryMoves: number;
    familyResults: Record<string, { total: number; correct: number }>;
  };

  const STORAGE_KEY = 'mesurovia-orbis-v2';
  const gameCatalog: Array<{ mode: SessionMode; title: string; description: string; image: string; target: [string, string] }> = [
    { mode: 'practice', title: 'Le pupitre d’exercices', description: 'Des questions progressives sur les mesures travaillées dans la maison.', image: 'game-practice.png', target: ['sentiers-moulin', 'repères'] },
    { mode: 'battle', title: 'Bataille des unités', description: 'Choisis la bonne carte pour faire avancer ton personnage.', image: 'game-battle.png', target: ['sentiers-moulin', 'repères'] },
    { mode: 'memory', title: 'Associe les mesures', description: 'Toutes les cartes sont visibles : retrouve les écritures équivalentes.', image: 'game-pairs.png', target: ['sentiers-moulin', 'repères'] },
    { mode: 'race', title: 'Course au trésor', description: 'Résous les défis et atteins le coffre avant le renard.', image: 'game-race.png', target: ['sentiers-moulin', 'repères'] },
    { mode: 'table', title: 'Le Tableau magique', description: 'Place et lis les mesures dans le tableau de conversion.', image: 'game-table.png', target: ['sentiers-moulin', 'repères'] },
    { mode: 'detective', title: 'Qui a raison ?', description: 'Quatre élèves répondent : vérifie les conversions et trouve la bonne proposition.', image: 'game-detective.png', target: ['clairieres-compas', 'repères'] },
    { mode: 'clock', title: 'Répare l’horloge', description: 'Travaille les secondes, minutes, heures, jours et semaines.', image: 'game-clock.png', target: ['sentiers-moulin', 'durées'] },
    { mode: 'builder', title: 'Le chantier des formes', description: 'Construis avec les aires, les capacités et les volumes.', image: 'game-builder.png', target: ['canaux-artisans', 'surfaces'] }
  ];
  const courseCatalog = [
    { id: 'length', title: 'Longueurs', units: 'km · m · dm · cm · mm', description: 'Choisir, comparer et convertir des longueurs.', image: 'course-length.png', target: ['sentiers-moulin', 'longueurs'] },
    { id: 'mass', title: 'Masses', units: 't · kg · g · mg', description: 'Peser, comparer et convertir les masses.', image: 'course-mass.png', target: ['sentiers-moulin', 'masses'] },
    { id: 'capacity', title: 'Capacités', units: 'L · dL · cL · mL', description: 'Comprendre ce que contient un récipient et changer d’unité.', image: 'course-capacity.png', target: ['sentiers-moulin', 'masses'] },
    { id: 'duration', title: 'Durées', units: 'h · min · s puis j · semaine · mois · année', description: 'Calculer des durées et utiliser les relations du calendrier.', image: 'course-duration.png', target: ['sentiers-moulin', 'durées'] },
    { id: 'area', title: 'Aires', units: 'km² · ha · m² · cm² · mm²', description: 'Mesurer une surface et comprendre les facteurs au carré.', image: 'course-area.png', target: ['canaux-artisans', 'surfaces'] },
    { id: 'volume', title: 'Volumes et litres', units: 'm³ · L (= dm³) · cm³ · mm³', description: 'Mesurer l’espace occupé et relier volume et capacité dans des situations guidées.', image: 'course-volume.png', target: ['hautes-terres', 'formes'] }
  ];
  const avatars = ['hero-1', 'hero-2', 'hero-3', 'hero-4', 'hero-5', 'hero-6'];
  const legacyAvatars = ['🧑‍🎒', '🧙🏽‍♀️', '🧑🏻‍🔬', '🧝🏾', '🧑🏼‍🚀', '🦊'];
  const avatarNames = ['Explorateur vert', 'Exploratrice bleue', 'Explorateur blond', 'Exploratrice rousse', 'Explorateur bleu', 'Exploratrice orange'];
  function avatarIndex(avatar?: string): number { const modern = avatars.indexOf(avatar ?? ''); return modern >= 0 ? modern : Math.max(0, legacyAvatars.indexOf(avatar ?? '')); }
  function avatarPosition(avatar?: string): number { return avatarIndex(avatar) * 20; }
  // Each illustrated map has its own hotspot positions so doors and residents remain clickable.
  const buildingLayouts: Record<string, Array<{ x: number; y: number }>> = {
    'sentiers-moulin': [{ x: 130, y: 72 }, { x: 375, y: 34 }, { x: 700, y: 68 }, { x: 815, y: 235 }, { x: 230, y: 235 }],
    'clairieres-compas': [{ x: 110, y: 68 }, { x: 375, y: 34 }, { x: 690, y: 56 }, { x: 805, y: 222 }, { x: 245, y: 220 }],
    'canaux-artisans': [{ x: 120, y: 82 }, { x: 405, y: 60 }, { x: 700, y: 72 }, { x: 815, y: 215 }, { x: 230, y: 235 }],
    'hautes-terres': [{ x: 120, y: 72 }, { x: 380, y: 36 }, { x: 695, y: 66 }, { x: 810, y: 228 }, { x: 225, y: 230 }]
  };
  const residentsByVillage: Record<string, Array<{ x: number; y: number; label: string }>> = {
    'sentiers-moulin': [{ x: 320, y: 195, label: 'Milo' }, { x: 620, y: 215, label: 'Lina' }, { x: 380, y: 450, label: 'Noé' }, { x: 810, y: 455, label: 'Papi' }],
    'clairieres-compas': [{ x: 315, y: 195, label: 'Aïna' }, { x: 745, y: 195, label: 'Théo' }, { x: 400, y: 435, label: 'Mira' }, { x: 805, y: 440, label: 'Robin' }],
    'canaux-artisans': [{ x: 315, y: 205, label: 'Rosa' }, { x: 700, y: 220, label: 'Jules' }, { x: 370, y: 440, label: 'Samir' }, { x: 790, y: 445, label: 'Zoé' }],
    'hautes-terres': [{ x: 320, y: 195, label: 'Elio' }, { x: 690, y: 215, label: 'Ariane' }, { x: 400, y: 435, label: 'Yann' }, { x: 810, y: 430, label: 'Nora' }]
  };
  const familyOrder = ['length', 'mass', 'capacity', 'duration', 'area', 'volume'];
  const villageArtwork: Record<string, string> = {
    'sentiers-moulin': `${base}/images/mesurovia/village-hero.jpg`,
    'clairieres-compas': `${base}/images/mesurovia/regions/clairieres-compas.jpg`,
    'canaux-artisans': `${base}/images/mesurovia/regions/canaux-artisans.jpg`,
    'hautes-terres': `${base}/images/mesurovia/regions/hautes-terres.jpg`
  };
  const villageMapArtwork: Record<string, string> = {
    'sentiers-moulin': `${base}/images/mesurovia/villages/sentiers-moulin-map.jpg`,
    'clairieres-compas': `${base}/images/mesurovia/villages/clairieres-compas-map.jpg`,
    'canaux-artisans': `${base}/images/mesurovia/villages/canaux-artisans-map.jpg`,
    'hautes-terres': `${base}/images/mesurovia/villages/hautes-terres-map.jpg`
  };
  const jokes = [
    'Pourquoi le mètre est-il toujours calme ? Parce qu’il garde ses distances.',
    'Pourquoi la règle ne raconte-t-elle jamais de mensonges ? Parce qu’elle est droite.',
    'Mon horloge a quitté son travail. Elle en avait assez de faire des heures supplémentaires.',
    'Pourquoi la balance est-elle une bonne amie ? Elle prend toujours les choses avec équilibre.',
    'J’ai voulu faire une blague sur les litres… mais elle était trop pleine.',
    'Mon ruban mesure tout. C’est quelqu’un qui voit grand, mais centimètre par centimètre.'
  ];

  let ready = false;
  let view: View = 'welcome';
  let profiles: Record<string, Profile> = {};
  let activeProfileKey = '';
  let profile: Profile | null = null;
  let saveMessage = '';
  let newName = '';
  let chosenAvatar = avatars[0];
  let currentVillageId = engine.VILLAGES[0].id;
  let currentHouseId = '';
  let house: any = null;
  let lessons: any[] = [];
  let lessonIndex = 0;
  let theoryPhase: 'explain' | 'checkpoint' = 'explain';
  let lessonChoice = '';
  let lessonFeedback: Feedback = null;
  let trainingFeedback: Feedback = null;
  let session: Session | null = null;
  let activeQuestion: any = null;
  let currentFeedback: Feedback = null;
  let sessionResult: { passed: boolean; score: number; total: number; title: string; detail: string; mode?: SessionMode } | null = null;
  let selectedMenu = false;
  let modalMessage = '';
  let mapPlayer = { x: 500, y: 305 };
  let npcBubble: { x: number; y: number; text: string } | null = null;
  let currentHowToSlide = 0;
  let reduceMotion = false;
  let largeText = false;
  let highContrast = false;
  let pretestRecommendationName = '';
  let pretestAfterCharacterCreation = false;
  let useOnscreenKeyboard = false;
  let memoryFlipTimer: number | null = null;
  let conversionGuideOpen = false;
  let lastScrollY = 0;
  let headerHidden = false;

  const howToSlides = [
    { title: '1. Explore le village', text: 'Clique sur le sol : ton personnage court jusque-là. Clique sur une maison pour entrer. Tous les villages et toutes les maisons sont accessibles dans cette version.' },
    { title: '2. Lis les explications', text: 'Chaque maison propose quatre petites explications. Après chacune, réponds à une question pour passer à la diapositive suivante.' },
    { title: '3. Entraîne-toi en jouant', text: 'Choisis un jeu : appariement de mesures, course au trésor, duel de cartes, enquête ou défi de construction. Tu peux toucher les éléments à l’écran ; le jeu t’aide sans chronomètre.' },
    { title: '4. Valide ton blason', text: 'L’épreuve comporte dix questions. Il faut au moins 8 réponses justes sur 10. En cas d’échec, révise et recommence : aucun point ni badge ne sera retiré.' }
  ];

  $: currentVillage = engine.VILLAGES.find((v: any) => v.id === currentVillageId) ?? engine.VILLAGES[0];
  $: villageHouses = engine.listHouses(currentVillageId);
  $: currentLesson = lessons[lessonIndex] ?? null;
  $: houseProgress = getHouseProgress(currentVillageId, currentHouseId);
  $: hasProfile = !!profile;
  $: profileLabel = profile ? `${profile.avatar} ${profile.name}` : 'Aventurier';
  $: mapProgress = villageHouses.filter((h: any) => getHouseProgress(currentVillageId, h.id).examPassed).length;
  $: lessonSlideNumber = lessonIndex * 2 + (theoryPhase === 'explain' ? 1 : 2);
  $: lessonProgress = Math.round((lessonSlideNumber / Math.max(1, lessons.length * 2)) * 100);
  $: currentFamilyLabel = activeQuestion ? (engine.FAMILIES[activeQuestion.family]?.label ?? 'Mesures') : '';
  $: tableGameAvailable = !!house?.families?.some((family: string) => ['length', 'mass', 'capacity'].includes(family));
  $: builderGameAvailable = !!house?.families?.some((family: string) => ['area', 'volume'].includes(family));
  $: clockGameAvailable = house?.id === 'durées';

  onMount(() => {
    const onScroll = () => { const next = window.scrollY; headerHidden = view === 'room' && next > 100 && next > lastScrollY; lastScrollY = next; };
    window.addEventListener('scroll', onScroll, { passive: true });
    useOnscreenKeyboard = (typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints ?? 0) > 1));
    let migratedLegacy = false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.profiles && typeof parsed.profiles === 'object') {
          profiles = Object.fromEntries(Object.entries(parsed.profiles).map(([key, value]) => [key, normalizeProfile(value, key, avatars[0], engine.VILLAGES[0].id, engine.VILLAGES.map((village: any) => village.id))]));
          activeProfileKey = typeof parsed.active === 'string' ? parsed.active : Object.keys(profiles)[0] ?? '';
          profile = profiles[activeProfileKey] ?? null;
        }
      } else {
        // Migration non destructive : l'ancienne clé reste intacte jusqu'à ce que l'enseignant la supprime lui-même.
        const oldRaw = localStorage.getItem('mesurovia-rpg-v1');
        if (oldRaw) {
          const oldSave = JSON.parse(oldRaw);
          if (oldSave?.profiles && typeof oldSave.profiles === 'object') {
            profiles = Object.fromEntries(Object.entries(oldSave.profiles).map(([key, value]) => [key, normalizeProfile(value, key, avatars[0], engine.VILLAGES[0].id, engine.VILLAGES.map((village: any) => village.id))]));
            activeProfileKey = typeof oldSave.active === 'string' && profiles[oldSave.active] ? oldSave.active : Object.keys(profiles)[0] ?? '';
            profile = profiles[activeProfileKey] ?? null;
            if (profile) {
              migratedLegacy = true;
            }
          }
        }
      }
      if (profile) {
        newName = profile.name;
        chosenAvatar = profile.avatar;
        currentVillageId = profile.lastVillage || engine.VILLAGES[0].id;
        reduceMotion = !!profile.preferences?.reducedMotion;
        largeText = !!profile.preferences?.largeText;
        highContrast = !!profile.preferences?.highContrast;
      }
      if (migratedLegacy && profile) {
        persist();
        saveMessage = 'Ta progression précédente a été reprise dans Mesurovia V3. L’ancienne sauvegarde est conservée.';
      }
    } catch {
      // Si une sauvegarde est illisible, la page reste jouable et n'efface rien automatiquement.
      saveMessage = 'La sauvegarde existante n’a pas pu être lue. Tu peux créer un nouveau profil.';
    }
    ready = true;
    return () => window.removeEventListener('scroll', onScroll);
  });

  function persist() {
    if (!profile) return;
    // Valeurs par défaut explicites : un vieux profil importé reste exploitable.
    profile.houses ??= {};
    profile.skills ??= {};
    profile.badges ??= [];
    profile.preferences = { reducedMotion: reduceMotion, largeText, highContrast };
    profiles[activeProfileKey] = profile;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, active: activeProfileKey, profiles }));
      saveMessage = 'Progression sauvegardée sur cet appareil.';
    } catch {
      saveMessage = 'La sauvegarde locale est indisponible dans ce contexte de navigateur.';
    }
  }

  function getHouseProgress(villageId: string, houseId: string): HouseProgress {
    const stored = profile?.houses?.[villageId]?.[houseId];
    return stored ? stored : { theoryDone: false, trainingDone: false, examPassed: false, bestScore: 0 };
  }

  function setHouseProgress(villageId: string, houseId: string, patch: Partial<HouseProgress>) {
    if (!profile) return;
    const old = getHouseProgress(villageId, houseId);
    profile = { ...profile, houses: { ...profile.houses, [villageId]: { ...(profile.houses[villageId] ?? {}), [houseId]: { ...old, ...patch } } } };
    if (villageId === currentVillageId && houseId === currentHouseId) houseProgress = profile.houses[villageId][houseId];
    persist();
  }

  function addXP(amount: number, reason: string) {
    if (!profile) return;
    profile.xp += amount;
    modalMessage = `+${amount} XP · ${reason}`;
    persist();
  }

  function awardBadge(name: string) {
    if (!profile || profile.badges.includes(name)) return;
    profile.badges = [...profile.badges, name];
    persist();
  }

  function createCharacter() {
    const name = newName.trim();
    if (name.length < 2) {
      saveMessage = 'Écris un prénom ou un pseudo d’au moins deux caractères.';
      return;
    }
    const key = name.toLocaleLowerCase('fr-CH');
    if (profiles[key]) {
      // Un profil existant est repris pour éviter la création de doublons accidentels.
      profile = profiles[key];
      profile.name = name;
      profile.avatar = chosenAvatar;
    } else {
      profile = createBlankProfile(name, chosenAvatar, engine.VILLAGES[0].id);
      profiles[key] = profile;
    }
    activeProfileKey = key;
    persist();
    if (pretestAfterCharacterCreation) {
      pretestAfterCharacterCreation = false;
      beginPretest();
    } else {
      view = 'villages';
    }
  }

  function resumeAdventure() {
    if (!profile) {
      view = 'character';
      return;
    }
    currentVillageId = profile.lastVillage || engine.VILLAGES[0].id;
    mapPlayer = { x: 500, y: 305 };
    view = 'village';
  }

  function selectVillage(villageId: string) {
    // Les quatre régions restent ouvertes en V2, indépendamment du nombre de blasons.
    currentVillageId = villageId;
    if (profile) {
      profile.lastVillage = villageId;
      persist();
    }
    mapPlayer = { x: 500, y: 305 };
    npcBubble = null;
    view = 'village';
  }

  function beginPretest() {
    if (!profile) {
      saveMessage = 'Crée ton personnage avant de commencer le bilan.';
      pretestAfterCharacterCreation = true;
      view = 'character';
      return;
    }
    startSession('pretest');
    view = 'pretest';
  }

  function startHowTo() {
    currentHowToSlide = 0;
    view = 'howto';
  }

  function goHome() {
    clearMemoryFlipTimer();
    view = 'welcome';
    session = null;
    currentFeedback = null;
    sessionResult = null;
  }

  function openHouse(h: any) {
    if (!profile) {
      view = 'character';
      saveMessage = 'Crée ton personnage avant d’entrer dans une maison.';
      return;
    }
    house = h;
    currentHouseId = h.id;
    profile.lastVillage = currentVillageId;
    lessons = engine.lessonForHouse(h.id, currentVillageId);
    lessonIndex = 0;
    theoryPhase = 'explain';
    lessonChoice = '';
    lessonFeedback = null;
    trainingFeedback = null;
    currentFeedback = null;
    sessionResult = null;
    session = null;
    const progress = getHouseProgress(currentVillageId, h.id);
    // Une maison déjà étudiée revient directement au choix des activités.
    view = progress.theoryDone ? 'room' : 'room';
    persist();
  }

  function openCatalogGame(item: (typeof gameCatalog)[number]) {
    if (!profile) {
      saveMessage = 'Crée ton personnage avant de lancer un jeu Mesurovia.';
      view = 'character';
      return;
    }
    const [villageId, houseId] = item.target;
    currentVillageId = villageId;
    const targetHouse = engine.listHouses(villageId).find((candidate: any) => candidate.id === houseId);
    if (!targetHouse) return;
    openHouse(targetHouse);
    startSession(item.mode);
  }

  function openCatalogCourse(item: (typeof courseCatalog)[number]) {
    if (!profile) {
      saveMessage = 'Crée ton personnage pour entrer dans la maison de ce cours.';
      view = 'character';
      return;
    }
    const [villageId, houseId] = item.target;
    currentVillageId = villageId;
    const targetHouse = engine.listHouses(villageId).find((candidate: any) => candidate.id === houseId);
    if (targetHouse) openHouse(targetHouse);
  }

  function closeHouse() {
    clearMemoryFlipTimer();
    view = 'village';
    session = null;
    activeQuestion = null;
    sessionResult = null;
    currentFeedback = null;
  }

  function chooseNpcJoke(npc: { x: number; y: number; label: string }) {
    const text = jokes[Math.floor(Math.random() * jokes.length)];
    npcBubble = { x: npc.x, y: npc.y, text: `${npc.label} : ${text}` };
    mapPlayer = { ...mapPlayer, x: Math.max(72, Math.min(925, npc.x - 38)), y: Math.min(548, npc.y + 34) };
  }

  function handleMapClick(event: MouseEvent) {
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    // Coordonnées du pointeur transformées vers le viewBox 1000 × 620.
    mapPlayer = {
      x: Math.max(38, Math.min(962, ((event.clientX - rect.left) / rect.width) * 1000)),
      y: Math.max(55, Math.min(565, ((event.clientY - rect.top) / rect.height) * 620))
    };
    npcBubble = null;
  }

  function visitHouse(h: any, event?: Event) {
    event?.stopPropagation();
    // Les cinq points de marche suivent la position réelle des bâtiments sur la carte.
    const positions = [
      { x: 205, y: 190 }, { x: 420, y: 145 }, { x: 720, y: 150 },
      { x: 850, y: 330 }, { x: 285, y: 350 }
    ];
    mapPlayer = positions[h.index] ?? { x: 520, y: 305 };
    // La courte pause montre le déplacement du personnage avant la transition de salle.
    window.setTimeout(() => openHouse(h), reduceMotion ? 0 : 340);
  }

  function getActiveQuestion() {
    if (!session) return null;
    return session.questions[session.index] ?? null;
  }

  function clearMemoryFlipTimer() {
    if (memoryFlipTimer !== null && typeof window !== 'undefined') {
      window.clearTimeout(memoryFlipTimer);
      memoryFlipTimer = null;
    }
  }

  function flipMemoryCard(cardId: string) {
    if (!session || session.mode !== 'memory' || session.memoryOpenIds.length >= 2) return;
    const chosen = session.memoryCards.find((card) => card.id === cardId);
    if (!chosen || chosen.matched || session.memoryOpenIds.includes(cardId)) return;

    clearMemoryFlipTimer();
    session.gameEvent = null;
    session.memoryCards = session.memoryCards.map((card) => card.id === cardId ? { ...card, revealed: true } : card);
    session.memoryOpenIds = [...session.memoryOpenIds, cardId];
    if (session.memoryOpenIds.length < 2) return;

    session.memoryMoves += 1;
    const [firstId, secondId] = session.memoryOpenIds;
    const first = session.memoryCards.find((card) => card.id === firstId);
    const second = session.memoryCards.find((card) => card.id === secondId);
    if (!first || !second) return;

    if (first.pairId === second.pairId) {
      session.memoryCards = session.memoryCards.map((card) => card.pairId === first.pairId ? { ...card, revealed: true, matched: true } : card);
      session.memoryOpenIds = [];
      session.correct += 1;
      session.familyResults[first.family] ??= { total: 0, correct: 0 };
      session.familyResults[first.family].total += 1;
      session.familyResults[first.family].correct += 1;
      session.gameEvent = 'success';
      if (session.correct === session.questions.length) {
        const completedSession = session;
        memoryFlipTimer = window.setTimeout(() => {
          if (session === completedSession) finishSession();
          memoryFlipTimer = null;
        }, reduceMotion ? 0 : 550);
      }
      return;
    }

    session.wrong += 1;
    session.gameEvent = 'miss';
    const openSession = session;
    memoryFlipTimer = window.setTimeout(() => {
      if (session !== openSession) {
        memoryFlipTimer = null;
        return;
      }
      session.memoryOpenIds = [];
      session.gameEvent = null;
      memoryFlipTimer = null;
    }, reduceMotion ? 0 : 850);
  }

  onDestroy(clearMemoryFlipTimer);

  function createQuestionList(mode: SessionMode, total: number): any[] {
    // Le moteur génère chaque question à la demande à partir de la famille,
    // du niveau et du format. Aucun catalogue énorme n'est nécessaire.
    let allowedFamilies = house?.families?.length ? [...house.families] : [...familyOrder];
    if (mode === 'pretest' || mode === 'boss') allowedFamilies = [...familyOrder];
    if (mode === 'table') {
      const suitable = allowedFamilies.filter((family: string) => ['length', 'mass', 'capacity'].includes(family));
      allowedFamilies = suitable.length ? suitable : ['length'];
    }
    if (mode === 'clock') allowedFamilies = ['duration'];
    if (mode === 'builder') {
      const suitable = allowedFamilies.filter((family: string) => ['area', 'volume'].includes(family));
      allowedFamilies = suitable.length ? suitable : ['area'];
    }

    const list: any[] = [];
    const standardFormats = ['choice', 'number', 'unit', 'match', 'order', 'table', 'error', 'multi'];
    for (let i = 0; i < total; i += 1) {
      const family = mode === 'pretest' ? familyOrder[i % familyOrder.length] : allowedFamilies[i % allowedFamilies.length];
      // Nouvelle clé propre au village : l'adaptation d'une compétence dans un village
      // ne remplace pas celle d'un autre village. Les anciennes clés familiales restent
      // lues comme solution de compatibilité, sans les supprimer ni les réécrire.
      const savedAdaptive = profile?.skills?.[`${currentVillageId}:${family}`] ?? profile?.skills?.[family];
      const pretest = profile?.pretest ? { byFamily: profile.pretest.byFamily } : null;
      const difficulty = savedAdaptive?.difficulty ?? engine.startingDifficulty(currentVillageId, family, pretest);
      let format: string;
      if (mode === 'battle' || mode === 'race') format = 'choice';
      else if (mode === 'table') format = 'table';
      else if (mode === 'detective') format = 'error';
      else if (mode === 'clock') format = i % 2 === 0 ? 'match' : 'order';
      else if (mode === 'builder') format = i % 2 === 0 ? 'number' : 'choice';
      else if (mode === 'pretest') format = i % 2 === 0 ? 'choice' : 'number';
      else if (mode === 'practice' && currentVillageId === 'sentiers-moulin' && i < 6 && ['length', 'mass', 'capacity'].includes(family)) format = 'table';
      else {
        const available = engine.availableFormats(family).filter((f: string) => f !== 'table' || ['length', 'mass', 'capacity'].includes(family));
        format = available.includes(standardFormats[i % standardFormats.length])
          ? standardFormats[i % standardFormats.length]
          : available[(i + 1) % available.length];
      }
      list.push(engine.makeQuestion(family, difficulty, { format }));
    }
    return list;
  }

  function startSession(mode: SessionMode) {
    clearMemoryFlipTimer();
    const memoryPairs = mode === 'memory'
      ? createMemoryPairs(engine, { villageId: currentVillageId, familyOrder, houseFamilies: house?.families, profile })
      : [];
    const total = mode === 'memory' ? memoryPairs.length : mode === 'race' ? 8 : mode === 'pretest' ? 18 : mode === 'practice' ? 10 : mode === 'table' ? 10 : mode === 'battle' || mode === 'detective' ? 5 : mode === 'clock' || mode === 'builder' ? 4 : mode === 'exam' ? 10 : 12;
    session = {
      mode, questions: mode === 'memory' ? memoryPairs : createQuestionList(mode, total), index: 0, correct: 0, firstTryCorrect: 0,
      wrong: 0, attempts: 0, helped: false, answerStatus: null, selected: '', typed: '',
      selectedMany: [], matches: {}, matchingLeft: '', orderedItems: [], gameEvent: null,
      playerHp: 3, enemyHp: 3, raceSteps: 0, rivalSteps: 0, raceRoll: 0,
      memoryCards: createMemoryCards(memoryPairs), memoryOpenIds: [], memoryMoves: 0, familyResults: {}
    };
    activeQuestion = session.questions[0];
    if (activeQuestion?.type === 'order') session.orderedItems = [...activeQuestion.items];
    currentFeedback = null;
    sessionResult = null;
    view = mode === 'pretest' ? 'pretest' : 'room';
  }

  function asChoiceQuestion(q: any): any {
    // Conservée pour les questions historiques déjà au format QCM.
    if (q.type === 'choice') return q;
    const value = Number(q.answer);
    const unit = q.to ?? '';
    const fmt = (n: number) => engine.fmt(n);
    const correct = `${fmt(value)}${unit ? ` ${unit}` : ''}`;
    const candidates = [correct, `${fmt(value * 10)}${unit ? ` ${unit}` : ''}`, `${fmt(value / 10)}${unit ? ` ${unit}` : ''}`];
    const unique = [...new Set(candidates)];
    while (unique.length < 3) unique.push(`${fmt(value + unique.length + 1)}${unit ? ` ${unit}` : ''}`);
    return { ...q, type: 'choice', answer: correct, answerLabel: correct, options: unique.sort(() => Math.random() - 0.5) };
  }

  // Met à jour la réponse choisie seulement si une session est encore active.
  // Le contrôle évite les accès potentiels à null dans les callbacks de boutons.
  function selectSessionOption(option: string) {
    if (!session || session.answerStatus) return;
    session.selected = option;
  }

  function readSessionAnswer() {
    if (!session || !activeQuestion) return '';
    if (activeQuestion.type === 'choice' || activeQuestion.type === 'unit' || activeQuestion.type === 'error') return session.selected;
    if (activeQuestion.type === 'match') {
      if (Object.keys(session.matches).length !== activeQuestion.leftItems.length) return '';
      return JSON.stringify(session.matches);
    }
    if (activeQuestion.type === 'order') return session.orderedItems.length ? JSON.stringify(session.orderedItems) : '';
    if (activeQuestion.type === 'multi') return session.selectedMany.length ? JSON.stringify(session.selectedMany) : '';
    return session.typed;
  }

  function appendNumberKey(key: string) {
    if (!session || session.answerStatus) return;
    if (key === 'clear') session.typed = '';
    else if (key === 'backspace') session.typed = session.typed.slice(0, -1);
    else if (key === 'decimal') {
      if (!session.typed.includes(',') && !session.typed.includes('.')) session.typed += ',';
    } else if (session.typed.length < 12) session.typed += key;
  }

  function selectMatchLeft(id: string) {
    if (!session || session.answerStatus) return;
    session.matchingLeft = id;
  }

  function selectMatchRight(id: string) {
    if (!session || session.answerStatus || !session.matchingLeft) return;
    const next = { ...session.matches };
    // Une mesure à droite ne peut servir qu'une fois.
    for (const key of Object.keys(next)) if (next[key] === id) delete next[key];
    next[session.matchingLeft] = id;
    session.matches = next;
    session.matchingLeft = '';
  }

  function moveOrderedItem(index: number, delta: number) {
    if (!session || session.answerStatus) return;
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= session.orderedItems.length) return;
    const next = [...session.orderedItems];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    session.orderedItems = next;
  }

  function toggleMultiOption(option: string) {
    if (!session || session.answerStatus) return;
    session.selectedMany = session.selectedMany.includes(option)
      ? session.selectedMany.filter((item: string) => item !== option)
      : [...session.selectedMany, option];
  }

  function saveAdaptive(correct: boolean, helped: boolean) {
    if (!profile || !activeQuestion) return;
    const family = activeQuestion.family;
    const skillKey = `${currentVillageId}:${family}`;
    const old = profile.skills[skillKey] ?? profile.skills[family] ?? engine.createAdaptiveState(engine.startingDifficulty(currentVillageId, family, profile.pretest ? { byFamily: profile.pretest.byFamily } : null));
    // On ajoute une entrée par village et famille ; les anciennes entrées globales
    // restent intactes pour préserver les profils créés avec les versions précédentes.
    profile.skills[skillKey] = engine.updateAdaptive(old, correct, helped);
    persist();
  }

  function submitSessionAnswer() {
    if (!session || !activeQuestion || session.answerStatus) return;
    const raw = readSessionAnswer();
    if (!String(raw).trim()) {
      currentFeedback = { kind: 'notice', title: 'Choisis ou écris une réponse', text: 'Tu peux prendre ton temps. Regarde les unités dans la consigne.' };
      return;
    }
    const correct = engine.checkAnswer(activeQuestion, raw);
    const family = activeQuestion.family;
    session.familyResults[family] ??= { total: 0, correct: 0 };
    session.familyResults[family].total += 1;
    if (session.mode === 'pretest') {
      if (correct) {
        session.correct += 1;
        session.familyResults[family].correct += 1;
      }
      session.answerStatus = correct ? 'correct' : 'wrong';
      currentFeedback = { kind: correct ? 'success' : 'notice', title: correct ? 'Bien vu !' : 'Réponse enregistrée', text: correct ? 'Le bilan continue.' : 'Ce bilan sert à conseiller un point de départ : ce n’est pas une note.' };
      return;
    }
    if (session.mode === 'exam' || session.mode === 'boss') {
      if (correct) {
        session.correct += 1;
        session.familyResults[family].correct += 1;
      } else {
        session.wrong += 1;
      }
      session.answerStatus = correct ? 'correct' : 'wrong';
      currentFeedback = { kind: correct ? 'success' : 'notice', title: correct ? 'Réponse enregistrée' : 'Réponse enregistrée', text: 'Passe à la question suivante ; le détail des réponses sera présenté à la fin.' };
      return;
    }

    if (correct) {
      session.correct += 1;
      if (session.attempts === 0) session.firstTryCorrect += 1;
      session.familyResults[family].correct += 1;
      if (session.mode === 'battle') { session.gameEvent = 'player-attack'; session.enemyHp = Math.max(0, session.enemyHp - 1); }
      else if (session.mode === 'race') {
        session.raceRoll = 1 + Math.floor(Math.random() * 3);
        session.raceSteps = Math.min(10, session.raceSteps + session.raceRoll);
        session.rivalSteps = Math.min(10, session.rivalSteps + 1);
        session.gameEvent = 'race-move';
      }
      else if (['table', 'detective', 'clock', 'builder'].includes(session.mode)) session.gameEvent = 'success';
      saveAdaptive(true, session.helped);
      session.answerStatus = 'correct';
      currentFeedback = { kind: 'success', title: 'Bien joué !', text: session.helped ? 'Tu as utilisé une aide : c’est une bonne stratégie d’apprentissage.' : 'Tu as trouvé la réponse. Continue !' };
      if (session.mode === 'battle') addXP(5, 'Carte gagnée');
      else addXP(session.helped ? 3 : 5, session.helped ? 'Exercice guidé' : 'Exercice réussi');
    } else {
      session.wrong += 1;
      session.attempts += 1;
      if (session.mode === 'battle') { session.gameEvent = 'enemy-attack'; session.playerHp = Math.max(0, session.playerHp - 1); }
      else if (['table', 'detective', 'clock', 'builder', 'race'].includes(session.mode)) {
        session.gameEvent = 'miss';
        if (session.mode === 'race') session.rivalSteps = Math.min(10, session.rivalSteps + 1);
      }
      saveAdaptive(false, true);
      session.helped = true;
      currentFeedback = session.attempts === 1
        ? { kind: 'hint', title: 'Pas encore — regarde cet indice', text: activeQuestion.hint || 'Repère d’abord la grandeur, puis les unités de départ et d’arrivée. Utilise le tableau pour placer les chiffres.' }
        : { kind: 'worked', title: 'Voyons les étapes ensemble', text: activeQuestion.worked || activeQuestion.explain || 'Repère la grandeur, place le nombre dans le tableau, lis la colonne demandée, puis vérifie le sens du résultat.' };
      if (session.mode === 'race' && session.rivalSteps >= 10) finishSession();
    }
  }

  function continueSession() {
    if (!session) return;
    if (!session.answerStatus) {
      if (session.mode !== 'pretest' && session.mode !== 'exam' && session.mode !== 'boss') {
        // Le bouton « passer après l'exemple » permet d'éviter qu'un exercice difficile bloque le parcours.
        session.wrong += 1;
      } else {
        currentFeedback = { kind: 'notice', title: 'Réponds d’abord', text: 'Choisis une réponse puis valide-la.' };
        return;
      }
    }
    session.index += 1;
    session.attempts = 0;
    session.helped = false;
    session.answerStatus = null;
    session.selected = '';
    session.typed = '';
    session.selectedMany = [];
    session.matches = {};
    session.matchingLeft = '';
    session.gameEvent = null;
    currentFeedback = null;
    activeQuestion = session.questions[session.index] ?? null;
    session.orderedItems = activeQuestion?.type === 'order' ? [...activeQuestion.items] : [];
    if (session.index >= session.questions.length || (session.mode === 'race' && session.raceSteps >= 10)) finishSession();
  }

  function finishSession() {
    if (!session || !profile) return;
    const mode = session.mode;
    const total = mode === 'race' ? Math.max(1, Math.min(session.questions.length, session.index)) : session.questions.length;
    const score = session.correct;
    const percent = Math.round((score / total) * 100);
    if (mode === 'pretest') {
      const recommendation = engine.pretestRecommendation({ total, correct: score, byFamily: session.familyResults });
      profile.pretest = { total, correct: score, byFamily: session.familyResults, recommended: recommendation.villageId };
      pretestRecommendationName = engine.VILLAGES.find((v: any) => v.id === recommendation.villageId)?.name ?? engine.VILLAGES[0].name;
      persist();
      sessionResult = { mode, passed: true, score, total, title: 'Ton bilan de départ est prêt', detail: `Conseil : commence par ${pretestRecommendationName}. Les résultats par compétence t’aident à choisir ; tu peux visiter les quatre régions quand tu veux.` };
      return;
    }
    if (mode === 'practice' || ['battle', 'table', 'detective', 'clock', 'builder', 'memory', 'race'].includes(mode)) {
      const threshold = mode === 'practice' ? 6 : Math.ceil(total * 0.6);
      const passed = mode === 'race' ? (session.raceSteps >= 10 || session.raceSteps > session.rivalSteps) : score >= threshold;
      if (passed) {
        setHouseProgress(currentVillageId, currentHouseId, { theoryDone: true, trainingDone: true, bestScore: Math.max(score, houseProgress.bestScore) });
        awardBadge(`${currentVillageId}:${currentHouseId}:training`);
        const rewardLabels: Record<string, string> = { battle: 'Duel des unités terminé', table: 'Coffre du tableau magique ouvert', detective: 'Enquête des unités terminée', clock: 'Horloge réparée', builder: 'Chantier terminé', memory: 'Appariement réussi', race: 'Course au trésor gagnée' };
        addXP(mode === 'practice' ? 15 : 20, mode === 'practice' ? 'Pupitre réussi' : (rewardLabels[mode] ?? 'Mission terminée'));
      }
      const gameTitle: Record<string, string> = { practice: 'Entraînement réussi !', battle: 'Duel terminé !', table: 'Coffre ouvert !', detective: 'Enquête terminée !', clock: 'Horloge réparée !', builder: 'Chantier terminé !', memory: 'Trésor retrouvé !', race: 'Course au trésor terminée !' };
      const gameDetail: Record<string, string> = { practice: 'La table d’examen est prête. Tu peux aussi rejouer pour t’entraîner.', battle: 'Tes cartes ont fait avancer le duel. Rejoue pour tenter un meilleur score.', table: 'Tu as utilisé le tableau de conversion pour ouvrir le coffre.', detective: 'Tu as examiné les indices et cherché les bonnes conversions.', clock: 'Tu as remis les mesures de temps dans le bon ordre.', builder: 'Chaque réponse juste a ajouté une pièce au chantier.', memory: `Tu as associé ${score} paires en ${session.memoryMoves} essais. Tu peux recommencer avec de nouvelles mesures.`, race: `Tu as avancé de ${session.raceSteps} cases contre ${session.rivalSteps} pour le renard. Tu as trouvé ${score} réponses justes sur ${total}.` };
      const title = mode === 'race' && !passed ? 'Le renard a trouvé le trésor !' : passed ? (gameTitle[mode] || 'Activité réussie !') : 'Encore un peu de pratique';
      sessionResult = { mode, passed, score, total, title, detail: passed || mode === 'race' ? gameDetail[mode] : 'Tu peux recommencer sans perdre de points. Regarde les aides, puis essaie une nouvelle série.' };
      session = null;
      activeQuestion = null;
      return;
    }
    if (mode === 'exam') {
      const passed = score >= 8;
      if (passed) {
        const wasPassed = houseProgress.examPassed;
        setHouseProgress(currentVillageId, currentHouseId, { theoryDone: true, trainingDone: true, examPassed: true, bestScore: Math.max(score, houseProgress.bestScore) });
        awardBadge(`${currentVillageId}:${currentHouseId}:mastery`);
        if (!wasPassed) addXP(40, 'Blason de la maison');
      }
      sessionResult = { mode, passed, score, total, title: passed ? 'Blason obtenu !' : 'Tu peux retenter l’épreuve', detail: passed ? 'Ton blason reste acquis. Toutes les maisons restent accessibles.' : 'Relis une explication ou refais des exercices, puis recommence avec de nouvelles questions. Aucun point n’est retiré.' };
      session = null;
      activeQuestion = null;
      return;
    }
    if (mode === 'boss') {
      const passed = score / total >= 0.8;
      if (passed) {
        awardBadge(`${currentVillageId}:chateau`);
        addXP(50, 'Défi du village');
      }
      sessionResult = { mode, passed, score, total, title: passed ? 'Le blason du village brille !' : 'Le château attend une nouvelle tentative', detail: passed ? 'Bravo ! Tu peux continuer à explorer les autres villages.' : 'Revois les compétences utiles puis recommence. Tous les villages restent accessibles.' };
      session = null;
      activeQuestion = null;
    }
  }

  function showExampleAgain() {
    if (!activeQuestion || !session) return;
    session.helped = true;
    currentFeedback = { kind: 'worked', title: 'Exemple pas à pas', text: activeQuestion.worked || activeQuestion.explain || activeQuestion.hint || '1. Repère la grandeur. 2. Place les chiffres dans le tableau. 3. Lis l’unité demandée. 4. Vérifie ton résultat.' };
  }

  function beginExam() {
    if (!getHouseProgress(currentVillageId, currentHouseId).trainingDone) {
      trainingFeedback = { kind: 'notice', title: 'Il reste une étape', text: 'Réussis d’abord un entraînement de base ou la Bataille des unités.' };
      return;
    }
    startSession('exam');
  }

  function beginBoss() {
    // Le défi du château est indépendant des maisons : aucune maison ne verrouille le village.
    house = null;
    currentHouseId = '';
    startSession('boss');
  }

  function closeResult() {
    // Le défi du château est lancé depuis la carte : son retour doit donc revenir au village.
    const wasVillageBoss = sessionResult?.mode === 'boss';
    sessionResult = null;
    session = null;
    activeQuestion = null;
    currentFeedback = null;
    view = wasVillageBoss ? 'village' : profile ? 'room' : 'welcome';
  }

  function exportSave() {
    if (!profile) return;
    const blob = new Blob([JSON.stringify({ version: 2, active: activeProfileKey, profiles }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mesurovia-${profile.name.replace(/[^a-z0-9_-]/gi, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importSave(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed.profiles || typeof parsed.profiles !== 'object') throw new Error('Format inconnu');
        profiles = Object.fromEntries(Object.entries(parsed.profiles).map(([key, value]) => [key, normalizeProfile(value, key, avatars[0], engine.VILLAGES[0].id, engine.VILLAGES.map((village: any) => village.id))]));
        activeProfileKey = parsed.active && profiles[parsed.active] ? parsed.active : Object.keys(profiles)[0];
        profile = profiles[activeProfileKey];
        if (!profile) throw new Error('Profil absent');
        persist();
        view = 'villages';
        saveMessage = 'Sauvegarde importée.';
      } catch {
        saveMessage = 'Fichier non reconnu. La sauvegarde actuelle n’a pas été remplacée.';
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  function downloadCourse(villageId: string) {
    const courseUrl = coursePaths.measures.mesurovia[villageId as keyof typeof coursePaths.measures.mesurovia];
    if (!courseUrl) return;
    window.open(`${base}${courseUrl}`, '_blank', 'noopener,noreferrer');
  }
</script>

<svelte:head>
  <title>Mesurovia — La quête des mesures</title>
  <meta name="description" content="Explore un village rétro, apprends les conversions de mesures et gagne des blasons de maîtrise." />
</svelte:head>

{#if !ready}
  <main class="loading-screen"><p>Préparation du village…</p></main>
{:else}
  <main class:large-text={largeText} class:high-contrast={highContrast} class:reduced-motion={reduceMotion} class="mesurovia-shell">
    <header class="game-header" class:header-hidden={headerHidden}>
      <button class="brand-button" onclick={goHome} aria-label="Retour à l'accueil de Mesurovia">
        <span class="brand-icon">✦</span><span><strong>MESUROVIA</strong><small>La quête des mesures</small></span>
      </button>
      <div class="header-player" aria-live="polite">
        <a class="orbis-return-link" href={catalogHref(base, 'jeux')} use:restoreCatalogReturn={base}>↩ Retour aux jeux</a>
        <span class="player-chip"><span class="avatar-portrait" style={`--avatar-pos:${avatarPosition(profile?.avatar)}%;background-image:url('${base}/images/mesurovia/hero-atlas.png')`} aria-hidden="true"></span>{profile?.name ?? 'Aventurier'}</span>
        <span class="xp-chip">⭐ {profile?.xp ?? 0} XP</span>
        <span class="crest-chip">🏅 {profile?.badges.length ?? 0} blasons</span>
      </div>
      <div class="header-menu-wrap">
        <button class="secondary-button guide-toggle" onclick={() => (conversionGuideOpen = true)}>Tableau de conversion</button>
        <button class="menu-toggle" onclick={() => (selectedMenu = !selectedMenu)} aria-expanded={selectedMenu}>☰ Menu</button>
        {#if selectedMenu}
          <nav class="menu-popover" aria-label="Menu de l'aventure">
            <button onclick={() => { view = 'character'; newName = profile?.name ?? newName; chosenAvatar = profile?.avatar ?? chosenAvatar; selectedMenu = false; }}>🧑 Créer mon personnage</button>
            <button onclick={() => { selectedMenu = false; resumeAdventure(); }}>▶ Reprendre l’aventure</button>
            <button onclick={() => { selectedMenu = false; view = 'games-catalog'; }}>Jeux de Mesurovia</button>
            <button onclick={() => { selectedMenu = false; view = 'courses-catalog'; }}>Cours de Mesurovia</button>
            <button onclick={() => { selectedMenu = false; startHowTo(); }}>📖 Comment jouer ?</button>
            <button onclick={exportSave} disabled={!profile}>⬇ Exporter ma sauvegarde</button>
            <label class="file-import">⬆ Importer une sauvegarde<input type="file" accept="application/json,.json" onchange={importSave} /></label>
          </nav>
        {/if}
      </div>
    </header>

    {#if saveMessage}
      <div class="save-message" role="status">{saveMessage}<button onclick={() => (saveMessage = '')} aria-label="Fermer le message">×</button></div>
    {/if}

    {#if view === 'welcome'}
      <section class="welcome-layout">
        <div class="welcome-art" aria-hidden="true">
          <img class="welcome-scene" src={`${base}/images/mesurovia/village-hero.jpg`} alt="" loading="eager" />
          <span class="spark spark-a">✧</span><span class="spark spark-b">✦</span><span class="spark spark-c">✧</span>
          <div class="floating-label">Un monde à réparer, mesure après mesure.</div>
        </div>
        <div class="welcome-copy">
          <p class="eyebrow">UNE AVENTURE DE MESURE</p>
          <h1>Les mesures ont perdu leur magie.</h1>
          <p class="lead">Les chemins sont confus, les ateliers sont à l’arrêt et le château a perdu ses blasons. Explore les villages, lis les conseils des maîtres et redonne leur pouvoir aux unités.</p>
          <div class="welcome-actions">
            <button class="primary-button large-button" onclick={() => { view = 'character'; selectedMenu = false; }}>✨ Créer mon personnage</button>
            <button class="secondary-button large-button" onclick={resumeAdventure}>▶ Reprendre l’aventure</button>
          </div>
          <div class="welcome-side-actions">
            <button class="secondary-button orbis-shortcut" onclick={() => (view = 'games-catalog')}>Jeux de Mesurovia</button>
            <button class="secondary-button orbis-shortcut" onclick={() => (view = 'courses-catalog')}>Cours de Mesurovia</button>
            <button class="text-button" onclick={startHowTo}>Comment jouer ? <span>→</span></button>
            <button class="text-button" onclick={beginPretest}>🧭 Faire le bilan de départ <span>→</span></button>
          </div>
          <p class="welcome-note">Pas de chronomètre. Tu peux demander de l’aide et recommencer sans perdre tes récompenses.</p>
        </div>
      </section>

    {:else if view === 'games-catalog'}
      <section class="mesurovia-catalog-page">
        <div class="catalog-page-heading"><button class="text-button" onclick={goHome}>← Accueil de Mesurovia</button><p class="eyebrow">JEUX DE MESUROVIA</p><h1>Choisis une façon de t’entraîner</h1><p>Chaque jeu reprend les objectifs et les unités des maisons de Mesurovia. Le jeu t’emmène directement dans la maison adaptée.</p></div>
        <div class="mesurovia-catalog-grid">
          {#each gameCatalog as item}
            <article class="mesurovia-catalog-card">
              <button class="catalog-image-button" onclick={() => openCatalogGame(item)} aria-label={`Lancer ${item.title}`}><img src={`${base}/images/mesurovia/catalog/${item.image}`} alt="" loading="lazy" /></button>
              <div><p class="eyebrow">JEU</p><h2>{item.title}</h2><p>{item.description}</p><button class="primary-button" onclick={() => openCatalogGame(item)}>Lancer le jeu →</button></div>
            </article>
          {/each}
        </div>
      </section>

    {:else if view === 'courses-catalog'}
      <section class="mesurovia-catalog-page">
        <div class="catalog-page-heading"><button class="text-button" onclick={goHome}>← Accueil de Mesurovia</button><p class="eyebrow">COURS DE MESUROVIA</p><h1>Les grandeurs étudiées</h1><p>Cette zone rassemble les cours intégrés aux maisons. Elle est prête à recevoir ensuite des leçons autonomes pour chaque thème.</p></div>
        <div class="mesurovia-catalog-grid course-catalog-grid">
          {#each courseCatalog as item}
            <article class="mesurovia-catalog-card course-catalog-card">
              <button class="catalog-image-button" onclick={() => openCatalogCourse(item)} aria-label={`Ouvrir le cours ${item.title}`}><img src={`${base}/images/mesurovia/catalog/${item.image}`} alt="" loading="lazy" /></button>
              <div><p class="eyebrow">COURS · GRANDEURS ET MESURES</p><h2>{item.title}</h2><p class="catalog-units">{item.units}</p><p>{item.description}</p><span class="course-zone-status">Cours intégré aux maisons · page autonome à venir</span><button class="primary-button" onclick={() => openCatalogCourse(item)}>Voir la maison associée →</button></div>
            </article>
          {/each}
        </div>
      </section>

    {:else if view === 'character'}
      <section class="slide-stage character-stage">
        <div class="stage-topline"><span class="step-counter">ÉTAPE 1 / 1</span><button class="text-button" onclick={goHome}>← Retour à l’accueil</button></div>
        <article class="slide-card character-slide">
          <div class="slide-illustration avatar-big"><span class="avatar-full" style={`--avatar-pos:${avatarPosition(chosenAvatar)}%;background-image:url('${base}/images/mesurovia/hero-atlas.png')`} aria-label={avatarNames[avatarIndex(chosenAvatar)]} role="img"></span></div>
          <div class="slide-main">
            <p class="eyebrow">CRÉATION DU PERSONNAGE</p>
            <h1>Ton personnage</h1>
            <p class="slide-lead">Choisis un prénom ou un pseudo et une apparence. Quand tu valides, tu entres directement dans le monde de Mesurovia.</p>
            <label class="field-label" for="character-name">Comment t’appelles-tu dans l’aventure ?</label>
            <input id="character-name" class="name-input" maxlength="24" bind:value={newName} placeholder="Prénom ou pseudo" onkeydown={(event) => { if (event.key === 'Enter') createCharacter(); }} />
            <span class="field-help">Deux caractères minimum. Ton prénom ne sera pas publié sur un classement.</span>
            <p class="field-label">Choisis ton avatar</p>
            <div class="avatar-picker" aria-label="Choix de l'avatar">
              {#each avatars as avatar}
                <button class:chosen-avatar={avatarIndex(chosenAvatar) === avatarIndex(avatar)} class="avatar-choice" aria-label={avatarNames[avatarIndex(avatar)]} aria-pressed={avatarIndex(chosenAvatar) === avatarIndex(avatar)} onclick={() => (chosenAvatar = avatar)}><span class="avatar-full" style={`--avatar-pos:${avatarPosition(avatar)}%;background-image:url('${base}/images/mesurovia/hero-atlas.png')`}></span></button>
              {/each}
            </div>
            <button class="primary-button large-button" onclick={createCharacter}>Créer et entrer dans l’aventure →</button>
          </div>
        </article>
      </section>

    {:else if view === 'villages'}
      <section class="villages-page">
        <div class="page-heading">
          <p class="eyebrow">CHOISIS TON EXPÉDITION</p>
          <h1>Quel village veux-tu explorer ?</h1>
          <p>Les quatre régions sont ouvertes. Tu peux commencer ici, revenir plus tard ou découvrir un autre village.</p>
        </div>
        <div class="village-selection-grid">
          {#each engine.VILLAGES as village, i}
            <button class="village-choice-card" style={`--village-accent:${village.palette[1]}`} onclick={() => selectVillage(village.id)}>
              <span class="village-card-art" aria-hidden="true"><img src={villageArtwork[village.id] ?? villageArtwork['sentiers-moulin']} alt="" loading="lazy" /></span>
              <span class="region-number">RÉGION {i + 1} · OUVERTE</span>
              <strong>{village.name}</strong>
              <span>{village.subtitle}</span>
              <span class="village-objective"><b>Objectif :</b> {villageCurriculum[village.id]?.objective}</span>
              <span class="village-card-footer">Explorer le village <b>→</b></span>
            </button>
          {/each}
        </div>
        {#if profile?.pretest}
          <p class="recommendation-note">🧭 Ton dernier bilan te conseille de commencer par <strong>{engine.VILLAGES.find((v: any) => v.id === profile?.pretest?.recommended)?.name ?? 'la première région'}</strong>. C’est un conseil, pas une restriction.</p>
        {/if}
      </section>

    {:else if view === 'village'}
      <section class="village-page">
        <div class="village-topbar">
          <div><button class="text-button" onclick={() => (view = 'villages')}>← Choisir une autre région</button><p class="eyebrow">RÉGION OUVERTE · {currentVillage.name}</p><h1>{currentVillage.name}</h1><p>{currentVillage.story}</p><div class="village-objective-panel"><strong>{villageCurriculum[currentVillageId]?.code}</strong><span><b>Objectif du village :</b> {villageCurriculum[currentVillageId]?.objective}</span>{#each villageCurriculum[currentVillageId]?.priorities ?? [] as priority}<small>{priority}</small>{/each}</div></div>
          <img class="village-region-art" src={villageArtwork[currentVillageId] ?? villageArtwork['sentiers-moulin']} alt="" aria-hidden="true" loading="lazy" />
          <div class="village-side-panel"><span>🏠 {mapProgress}/5 maisons validées</span><span>✨ {profile?.xp ?? 0} XP</span><button class="secondary-button" onclick={() => downloadCourse(currentVillageId)}>📖 Cahier à imprimer</button><button class="primary-button" onclick={beginBoss}>🏰 Défi du village</button></div>
        </div>
        <div class="map-instructions"><span class="map-pointer-icon">↗</span><span><strong>Point-and-click :</strong> clique sur le sol pour faire courir ton personnage. Clique sur une maison pour entrer. Les habitants ont parfois une blague à raconter.</span><button class="text-button" onclick={() => (npcBubble = null)}>Masquer les bulles</button></div>
        <div class="pixel-map-frame">
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
          <svg class="pixel-map" class:illustrated-map={!!villageMapArtwork[currentVillageId]} viewBox="0 0 1000 620" role="application" aria-label={`Carte interactive de ${currentVillage.name}`} onclick={handleMapClick}>
            <defs>
              <pattern id="grass-grid" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="#a9cf89"/><rect x="3" y="3" width="3" height="3" fill="#91bb74"/><rect x="19" y="16" width="4" height="3" fill="#b9d99b"/></pattern>
              <pattern id="stone-grid" width="42" height="30" patternUnits="userSpaceOnUse"><rect width="42" height="30" fill="#e6cf9e"/><path d="M0 1H42 M0 15H42 M20 1V15 M8 15V30 M34 15V30" stroke="#cfb886" stroke-width="2"/></pattern>
              <pattern id="water-grid" width="42" height="30" patternUnits="userSpaceOnUse"><rect width="42" height="30" fill="#70c4d4"/><path d="M3 8h13m9 10h12M5 25h12" stroke="#9fe1e4" stroke-width="3" stroke-linecap="square"/></pattern>
              <filter id="map-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="0" flood-color="#476449" flood-opacity=".35"/></filter>
            </defs>
            <image class="village-world-art" href={villageMapArtwork[currentVillageId] ?? villageMapArtwork['sentiers-moulin']} x="0" y="0" width="1000" height="620" preserveAspectRatio="none" pointer-events="none" aria-hidden="true" />
            <g aria-hidden="true" pointer-events="none"><circle class="map-water-glimmer" cx="145" cy="520" r="4"/><circle class="map-water-glimmer later" cx="535" cy="570" r="3"/><circle class="map-water-glimmer last" cx="865" cy="520" r="4"/></g>
            <g class="legacy-map-scenery" aria-hidden="true">
            <rect width="1000" height="620" fill="url(#grass-grid)"/>
            <!-- Quartier du moulin, petit marché, place centrale et bord de rivière : la carte n'est plus une bande verticale. -->
            <path d="M0 370 Q155 330 245 405 T480 438 Q660 500 760 442 T1000 440 L1000 510 Q830 520 745 560 T470 500 Q250 480 190 440 T0 430Z" fill="url(#water-grid)" stroke="#4b9ba8" stroke-width="6"/>
            <path class="river-glint" d="M0 370 Q155 330 245 405 T480 438 Q660 500 760 442 T1000 440" fill="none" stroke="#d3f2e6" stroke-width="6" stroke-dasharray="22 20"/>
            <path d="M118 176 Q250 208 380 170 T635 230 Q680 330 600 380 T420 380 Q350 300 285 285 T125 420" fill="none" stroke="#d4b985" stroke-width="72" stroke-linecap="round"/>
            <path d="M118 176 Q250 208 380 170 T635 230 Q680 330 600 380 T420 380 Q350 300 285 285 T125 420" fill="none" stroke="#f0dfb9" stroke-width="58" stroke-linecap="round"/>
            <path d="M130 200 Q280 245 424 210 T760 255 Q795 315 850 345" fill="none" stroke="#c9a875" stroke-width="34" stroke-linecap="round"/>
            <path d="M130 200 Q280 245 424 210 T760 255 Q795 315 850 345" fill="none" stroke="#f5e7c5" stroke-width="25" stroke-linecap="round"/>
            <!-- Place du village -->
            <ellipse cx="505" cy="320" rx="154" ry="97" fill="url(#stone-grid)" stroke="#c3a774" stroke-width="5"/>
            <ellipse cx="505" cy="320" rx="108" ry="61" fill="#d4c19a" stroke="#b79a68" stroke-width="4"/>
            <g filter="url(#map-shadow)"><rect x="470" y="281" width="70" height="64" rx="7" fill="#9b6d46" stroke="#694e39" stroke-width="4"/><path d="M458 290L505 255L552 290Z" fill="#c76d4e" stroke="#8e4d3a" stroke-width="4"/><rect x="494" y="305" width="22" height="40" fill="#694b37"/><rect x="477" y="295" width="12" height="13" fill="#9edfe5"/><rect x="521" y="295" width="12" height="13" fill="#9edfe5"/></g>
            <text x="505" y="367" text-anchor="middle" class="map-label">PLACE DES UNITÉS</text>
            <!-- Échoppes et repères -->
            <g class="market-stall"><rect x="400" y="386" width="66" height="34" rx="3" fill="#f6d589" stroke="#9c7148" stroke-width="3"/><path d="M394 390L432 365L472 390Z" fill="#d66b57" stroke="#9c5144" stroke-width="3"/><path d="M411 389v30m15-30v30m16-30v30m15-30v30" stroke="#fff0c6" stroke-width="4"/><text x="432" y="438" text-anchor="middle" class="tiny-label">MARCHÉ</text></g>
            <!-- Arbres variés en grappes, fleurs, banc et mobilier -->
            {#each [{x:65,y:78},{x:90,y:295},{x:250,y:95},{x:320,y:520},{x:440,y:90},{x:600,y:70},{x:910,y:84},{x:935,y:222},{x:905,y:372},{x:760,y:535},{x:115,y:525},{x:205,y:470}] as tree, i}
              <g transform={`translate(${tree.x} ${tree.y})`} class="tree-cluster" style={`--tree-delay:${i * 120}ms`} aria-hidden="true"><rect x="-5" y="15" width="10" height="23" fill="#8e6444"/><rect class="tree-canopy" x="-20" y="-3" width="40" height="31" rx="7" fill={i % 3 === 0 ? '#397e55' : i % 3 === 1 ? '#4c965b' : '#5a9e64'} stroke="#2d6847" stroke-width="4"/><rect class="tree-crown" x="-11" y="-14" width="22" height="24" rx="5" fill="#72b86b" stroke="#397e55" stroke-width="3"/><rect x="-13" y="3" width="7" height="6" fill="#cbe78d"/></g>
            {/each}
            {#each [{x:355,y:271},{x:371,y:278},{x:639,y:333},{x:658,y:345},{x:448,y:467},{x:475,y:470},{x:745,y:190},{x:768,y:197}] as flower}
              <g transform={`translate(${flower.x} ${flower.y})`} class="map-flower" aria-hidden="true"><rect x="0" y="0" width="6" height="7" fill="#f8e69a"/><rect x="-4" y="3" width="4" height="4" fill="#e98ba7"/><rect x="6" y="3" width="4" height="4" fill="#e98ba7"/></g>
            {/each}
            <g aria-hidden="true"><rect x="705" y="387" width="60" height="10" rx="2" fill="#996a43"/><rect x="711" y="397" width="7" height="18" fill="#75513a"/><rect x="750" y="397" width="7" height="18" fill="#75513a"/><rect x="280" y="320" width="46" height="8" fill="#8d6845"/><rect x="285" y="328" width="5" height="12" fill="#78563b"/><rect x="315" y="328" width="5" height="12" fill="#78563b"/></g>
            </g>

            <!-- Maisons en grappes autour de la place. Chaque bâtiment reste un bouton distinct. -->
            {#each villageHouses as h, i}
              {@const building = buildingLayouts[currentVillageId]?.[i] ?? buildingLayouts['sentiers-moulin'][i]}
              <g transform={`translate(${building.x} ${building.y})`} class="map-house" role="button" tabindex="0" aria-label={`Entrer dans ${h.title}`} onclick={(event) => visitHouse(h, event)} onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') visitHouse(h, event); }}>
                <g class="legacy-house-art" aria-hidden="true">
                  <rect x="-8" y="61" width="126" height="18" rx="5" fill="#7d9f6e" opacity=".55"/>
                  <rect x="0" y="25" width="110" height="62" rx="3" fill="#f2d8a7" stroke="#8d6446" stroke-width="5"/>
                  <path d="M-10 30L55 -13L120 30Z" fill="#cf7656" stroke="#754f3a" stroke-width="5" stroke-linejoin="round"/>
                  <rect x="43" y="49" width="24" height="38" rx="2" fill="#825a3f" stroke="#68452f" stroke-width="3"/>
                  <rect x="13" y="43" width="20" height="20" rx="2" fill="#83c7d1" stroke="#fff0c7" stroke-width="4"/><path d="M23 43v20m-10-10h20" stroke="#fff0c7" stroke-width="3"/>
                  <rect x="77" y="43" width="20" height="20" rx="2" fill="#83c7d1" stroke="#fff0c7" stroke-width="4"/><path d="M87 43v20m-10-10h20" stroke="#fff0c7" stroke-width="3"/>
                </g>
                <rect class="house-hit-area" x="-8" y="-15" width="126" height="108" fill="transparent" pointer-events="all" />
                <rect x="24" y="-10" width="62" height="20" rx="4" fill="#fff6dc" fill-opacity=".94" stroke="#8e6748" stroke-width="2"/><text x="55" y="5" text-anchor="middle" class="building-number">{i + 1}</text>
                <foreignObject x="-25" y="94" width="160" height="42"><div xmlns="http://www.w3.org/1999/xhtml" class="house-nameplate">{h.title}</div></foreignObject>
                {#if getHouseProgress(currentVillageId, h.id).examPassed}<g transform="translate(96 -7)"><circle r="13" fill="#f6d575" stroke="#fff3bb" stroke-width="3"/><text x="0" y="5" text-anchor="middle" class="badge-mark">✓</text></g>{/if}
              </g>
            {/each}

            <!-- Personnages non-joueurs : cliquer déclenche une courte blague de papa. -->
            {#each residentsByVillage[currentVillageId] ?? residentsByVillage['sentiers-moulin'] as npc, i}
              <g transform={`translate(${npc.x} ${npc.y})`} class="npc-sprite" style={`--idle-delay:${i * 220}ms`} role="button" tabindex="0" aria-label={`Parler à ${npc.label}`} onclick={(event) => { event.stopPropagation(); chooseNpcJoke(npc); }} onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.stopPropagation(); chooseNpcJoke(npc); } }}>
                <g class="npc-idle" aria-hidden="true"><ellipse cy="24" rx="18" ry="6" fill="#52774d" opacity=".4"/><svg x="-20" y="-32" width="40" height="57" viewBox="0 0 362 724" overflow="hidden"><image href={`${base}/images/mesurovia/hero-atlas.png`} x={-(i % 6) * 362} y="0" width="2172" height="724" /></svg></g>
                <circle class="npc-hit-area" cx="0" cy="0" r="30" fill="transparent" pointer-events="all" />
                <rect x="-28" y="-49" width="56" height="17" rx="7" fill="#fff6dc" fill-opacity=".95" stroke="#8e6748" stroke-width="1.5" />
                <text x="0" y="-37" text-anchor="middle" class="npc-label">{npc.label}</text>
              </g>
            {/each}
            <!-- Personnage principal ; l'attribut transform anime la course au clic, sans clavier directionnel. -->
            <g transform={`translate(${mapPlayer.x} ${mapPlayer.y})`} class="player-sprite" aria-label="Ton personnage">
              <g class="player-idle"><ellipse cy="25" rx="20" ry="7" fill="#53764b" opacity=".5"/><svg x="-24" y="-52" width="48" height="78" viewBox="0 0 362 724" overflow="hidden"><image href={`${base}/images/mesurovia/hero-atlas.png`} x={-avatarIndex(profile?.avatar) * 362} y="0" width="2172" height="724" /></svg></g>
            </g>
            {#if npcBubble}
              <g transform={`translate(${Math.min(730, Math.max(5, npcBubble.x - 120))} ${Math.max(55, npcBubble.y - 62)})`} pointer-events="none"><rect width="260" height="58" rx="8" fill="#fff8e9" stroke="#7a5a3c" stroke-width="4"/><path d="M100 58l14 12 8-12" fill="#fff8e9" stroke="#7a5a3c" stroke-width="3"/><foreignObject x="10" y="6" width="240" height="48"><div xmlns="http://www.w3.org/1999/xhtml" class="joke-text">{npcBubble.text}</div></foreignObject></g>
            {/if}
          </svg>
        </div>
        <div class="map-footer"><span>🪙 Ton sac : {profile?.xp ?? 0} XP</span><span>🏅 {profile?.badges.length ?? 0} blasons obtenus</span><button class="secondary-button" onclick={exportSave}>Exporter la sauvegarde</button></div>
      </section>

    {:else if view === 'room'}
      <section class="classroom-page">
        <div class="room-header"><div><button class="text-button" onclick={closeHouse}>← Retour au village</button><p class="eyebrow">{currentVillage.name} · {house ? `MAISON ${house.index + 1}` : 'DÉFI DU CHÂTEAU'}</p><h1>{house?.title ?? 'Défi du village'}</h1><p>{house?.subtitle ?? 'Une grande épreuve de mesures à l’échelle du village.'}</p>{#if house}<p class="curriculum-code">{houseCurriculum[currentVillageId]?.[house.id]?.code}</p><p class="house-objective"><strong>Objectif de la maison :</strong> {houseCurriculum[currentVillageId]?.[house.id]?.objective}</p>{/if}</div><div class="room-header-actions"><button class="secondary-button" onclick={() => downloadCourse(currentVillageId)}>Cahier élève</button><button class="secondary-button" onclick={exportSave}>Sauvegarder</button></div></div>
        <div class="classroom-scene">
          <div class="classroom-wall"><div class="classroom-clock">10:10</div><div class="classroom-window"><span></span><span></span><span></span><span></span></div><div class="chalkboard"><div class="chalkboard-heading">{session ? (session.mode === 'exam' ? 'TABLE D’EXAMEN' : session.mode === 'boss' ? 'DÉFI DU VILLAGE' : session.mode === 'memory' ? 'ASSOCIE LES MESURES' : session.mode === 'race' ? 'COURSE AU TRÉSOR' : session.mode === 'battle' ? 'DUEL DES UNITÉS' : session.mode === 'table' ? 'TABLEAU MAGIQUE' : session.mode === 'detective' ? 'ENQUÊTE DES UNITÉS' : session.mode === 'clock' ? 'HORLOGE DU MOULIN' : session.mode === 'builder' ? 'CHANTIER DES FORMES' : session.mode === 'pretest' ? 'BILAN DE DÉPART' : 'PUPITRE D’ENTRAÎNEMENT') : sessionResult ? 'BILAN DE LA MISSION' : houseProgress.theoryDone ? 'CHOISIS TON ACTIVITÉ' : `LEÇON ${lessonIndex + 1} · ${currentLesson?.title ?? ''}`}</div><div class="chalkboard-small">1 grandeur · 1 méthode · 1 étape à la fois</div><div class="chalk-marks"><span></span><span></span><span></span><span></span></div></div><div class="teacher-desk"></div></div>
          <div class="teacher-character"><img class="teacher-guide" src={`${base}/images/mesurovia/maitre-mesuro.png`} alt="" aria-hidden="true" /><span class="teacher-label">Maître Mesuro</span></div>
          <img class="classroom-students" src={`${base}/images/mesurovia/eleves.png`} alt="" aria-hidden="true" loading="lazy" />
        </div>

        {#if sessionResult}
        <article class="slide-card result-slide" role="status"><div class="result-icon">{sessionResult.passed ? '✓' : '↻'}</div><div><p class="eyebrow">BILAN DE L’ACTIVITÉ</p><h2>{sessionResult.title}</h2><p class="score-line">Résultat : <strong>{sessionResult.score}/{sessionResult.total}</strong></p><p>{sessionResult.detail}</p><div class="slide-actions"><button class="primary-button" onclick={closeResult}>Choisir une autre mission</button><button class="secondary-button" onclick={closeHouse}>Explorer le village</button>{#if !sessionResult.passed}<button class="secondary-button" onclick={() => startSession(sessionResult?.mode ?? 'practice')}>Réessayer</button>{/if}{#if ['battle', 'table', 'detective', 'clock', 'builder', 'memory', 'race'].includes(sessionResult.mode ?? '')}<button class="secondary-button" onclick={() => startSession(sessionResult?.mode as SessionMode)}>Rejouer</button>{/if}</div></div></article>

        {:else if session && activeQuestion}
          {#if session.mode === 'memory'}
            <section class="memory-game-panel" aria-labelledby="memory-title">
              <div class="memory-game-heading">
                <div><p class="eyebrow">JEU DE CARTES · ÉQUIVALENCES</p><h2 id="memory-title">Associe les mesures</h2><p>Toutes les cartes sont visibles. Choisis les deux mesures équivalentes.</p></div>
                <div class="memory-scoreboard" aria-live="polite"><span>{session.correct}/{session.questions.length} paires</span><span>{session.memoryMoves} essais</span></div>
              </div>
              <div class="memory-board" aria-label="Cartes de mesures visibles">
                {#each session.memoryCards as card}
                  <button type="button" class:face-up={true} class:matched={card.matched} class:card-miss={session.gameEvent === 'miss' && session.memoryOpenIds.includes(card.id)} class:card-picked={session.memoryOpenIds.includes(card.id)} class="memory-card" aria-label={`${card.label}, ${engine.FAMILIES[card.family]?.label ?? 'mesure'}`} aria-pressed={session.memoryOpenIds.includes(card.id) || card.matched} disabled={card.matched || session.memoryOpenIds.length >= 2} onclick={() => flipMemoryCard(card.id)}>
                    <span class="memory-card-inner"><span class="memory-card-front"><b>{card.label}</b><small>{engine.FAMILIES[card.family]?.label ?? 'Mesure'}</small></span></span>
                  </button>
                {/each}
              </div>
              <div class="memory-footer" role="status" aria-live="polite">
                <span>{session.gameEvent === 'success' ? 'Paire trouvée !' : session.gameEvent === 'miss' ? 'Ces deux mesures ne sont pas équivalentes. Essaie encore.' : 'Cherche les deux cartes qui vont ensemble.'}</span>
                <button class="text-button" onclick={closeHouse}>Quitter l’appariement</button>
              </div>
            </section>
          {:else}
          <div class="session-progress"><span>{session.mode === 'practice' ? 'PUPITRE' : session.mode === 'battle' ? 'DUEL DES UNITÉS' : session.mode === 'race' ? 'COURSE AU TRÉSOR' : session.mode === 'table' ? 'TABLEAU MAGIQUE' : session.mode === 'detective' ? 'ENQUÊTE DES UNITÉS' : session.mode === 'clock' ? 'HORLOGE DU MOULIN' : session.mode === 'builder' ? 'CHANTIER DES FORMES' : session.mode === 'exam' ? 'ÉPREUVE DE MAÎTRISE' : session.mode === 'boss' ? 'CHÂTEAU DU VILLAGE' : 'BILAN DE DÉPART'}</span><strong>Question {session.index + 1} / {session.questions.length}</strong><div class="progress-track"><i style={`width:${((session.index + (session.answerStatus ? 1 : 0)) / session.questions.length) * 100}%`}></i></div></div>
          <article class="slide-card question-slide">
            <div class="slide-topline"><span class="step-counter">{currentFamilyLabel}</span><span class="step-counter">{session.mode === 'exam' || session.mode === 'boss' ? 'Sans indice' : 'À ton rythme'}</span></div>
            {#if session.mode === 'race'}
              <div class:race-move={session.gameEvent === 'race-move'} class="mini-game-stage race-stage">
                <div class="race-lanes" aria-label="Parcours jusqu’au trésor">
                  <div class="race-lane"><strong>Toi</strong><div class="race-track"><i class="player-track-fill" style={`width:${session.raceSteps * 10}%`}></i><span class="race-runner player-runner" style={`left:${Math.max(4, Math.min(96, session.raceSteps * 10))}%`}><span class="avatar-portrait" style={`--avatar-pos:${avatarPosition(profile?.avatar)}%;background-image:url('${base}/images/mesurovia/hero-atlas.png')`}></span></span></div><span aria-hidden="true">Arrivée</span></div>
                  <div class="race-lane"><strong>Renard</strong><div class="race-track rival-track"><i class="rival-track-fill" style={`width:${session.rivalSteps * 10}%`}></i><span class="race-runner rival-runner" style={`left:${Math.max(4, Math.min(96, session.rivalSteps * 10))}%`}><GameObjectArt kind="fox" reduceMotion={reduceMotion} /></span></div><span aria-hidden="true">Arrivée</span></div>
                </div>
                <div class="race-turn-message"><strong>{session.gameEvent === 'race-move' ? `Tu avances de ${session.raceRoll} ${session.raceRoll > 1 ? 'cases' : 'case'} !` : session.gameEvent === 'miss' ? 'Le renard prend un petit pas d’avance…' : 'Résous le défi pour avancer !'}</strong><small>Premier à 10 cases : le trésor est à lui.</small></div>
              </div>
              <p class="eyebrow">DÉFI DE LA COURSE · QUESTION {session.index + 1}</p><h2>{activeQuestion.prompt}</h2>
            {:else if session.mode === 'battle'}
              <div class:player-attack={session.gameEvent === 'player-attack'} class:enemy-attack={session.gameEvent === 'enemy-attack'} class="mini-game-stage battle-stage">
                <div class="fighter player-fighter"><span class="fighter-sprite"><span class="avatar-portrait" style={`--avatar-pos:${avatarPosition(profile?.avatar)}%;background-image:url('${base}/images/mesurovia/hero-atlas.png')`}></span></span><strong>{profile?.name ?? 'Toi'}</strong><div class="health-track"><i style={`width:${Math.max(0, session.playerHp) / 3 * 100}%`}></i></div><small>Énergie</small></div>
                <div class="battle-middle"><span class="battle-spark">{session.gameEvent === 'player-attack' ? '💥' : session.gameEvent === 'enemy-attack' ? '⚡' : '⚔️'}</span><strong>Manche {session.index + 1} / {session.questions.length}</strong><small>{session.gameEvent === 'player-attack' ? 'Coup réussi !' : session.gameEvent === 'enemy-attack' ? 'Le gardien riposte !' : 'Choisis une carte pour jouer.'}</small></div>
                <div class="fighter enemy-fighter"><span class="fighter-sprite">{#if session.enemyHp === 0}<span aria-hidden="true">💫</span>{:else}<GameObjectArt kind="guardian" reduceMotion={reduceMotion} />{/if}</span><strong>{session.enemyHp === 0 ? 'Gardien vaincu' : 'Gardien des unités'}</strong><div class="health-track enemy-health"><i style={`width:${Math.max(0, session.enemyHp) / 3 * 100}%`}></i></div><small>Armure</small></div>
              </div>
              <p class="eyebrow">CARTE DÉFI</p><h2>{activeQuestion.prompt}</h2>
            {:else if activeQuestion.type === 'table'}
              <div class:game-success={session.gameEvent === 'success'} class:game-miss={session.gameEvent === 'miss'} class="mini-game-stage table-game-stage"><div class="treasure-chest"><GameObjectArt kind="chest" open={session.gameEvent === 'success'} reduceMotion={reduceMotion} /></div><div><strong>Coffre magique · clé {session.index + 1}/{session.questions.length}</strong><p>Place la mesure dans la colonne de départ, puis lis la colonne demandée.</p></div></div>
              <h2>{activeQuestion.prompt}</h2>
              <div class="conversion-table-card interactive-table-card"><table class="unit-table"><thead><tr>{#each engine.tableUnitsFor(activeQuestion.family) as unit}<th class:source-unit={unit === activeQuestion.from} class:target-unit={unit === activeQuestion.to}>{unit}</th>{/each}</tr></thead><tbody><tr>{#each engine.tableUnitsFor(activeQuestion.family) as unit}<td class:source-cell={unit === activeQuestion.from} class:target-cell={unit === activeQuestion.to}>{#if unit === activeQuestion.from}{activeQuestion.value}{:else if unit === activeQuestion.to}<input id="mesurovia-answer" class="table-cell-input" aria-label={`Résultat en ${activeQuestion.to}`} inputmode="none" autocomplete="off" placeholder="?" bind:value={session.typed} readonly disabled={!!session.answerStatus} />{:else}–{/if}</td>{/each}</tr></tbody></table><p>Départ : <strong>{activeQuestion.from}</strong> · Arrivée : <strong>{activeQuestion.to}</strong></p></div>
            {:else if session.mode === 'detective'}
              <div class:game-success={session.gameEvent === 'success'} class:game-miss={session.gameEvent === 'miss'} class="mini-game-stage detective-stage"><div class="detective-character"><GameObjectArt kind="detective" reduceMotion={reduceMotion} /></div><div><strong>Indice {session.index + 1} / {session.questions.length}</strong><p>Quatre élèves proposent une conversion. Trouve qui a raison en vérifiant le facteur.</p></div><div class="evidence-stamp">{session.gameEvent === 'success' ? '✓' : '!'}</div></div>
              <h2>{activeQuestion.prompt}</h2>
            {:else if session.mode === 'clock'}
              <div class:game-success={session.gameEvent === 'success'} class="mini-game-stage clock-game-stage"><span class="clock-face"><GameObjectArt kind="clock" reduceMotion={reduceMotion} /></span><div><strong>Le moulin attend !</strong><p>Défi {session.index + 1}/{session.questions.length}. Relie les durées ou range-les pour remettre l’horloge en marche.</p></div></div>
              <h2>{activeQuestion.prompt}</h2>
            {:else if session.mode === 'builder'}
              <div class:game-success={session.gameEvent === 'success'} class="mini-game-stage builder-game-stage"><div class="building-progress" aria-label={`${session.correct} pièces posées`}>{#each Array.from({length: session.questions.length}) as _, i}<span class:piece-built={i < session.correct}><GameObjectArt kind="brick" completed={i < session.correct} reduceMotion={reduceMotion} /></span>{/each}</div><div><strong>Chantier du village</strong><p>Chaque défi réussi ajoute une pièce à la construction.</p></div></div>
              <h2>{activeQuestion.prompt}</h2>
            {:else}
              <p class="eyebrow">{session.mode === 'pretest' ? 'BILAN DE DÉPART' : session.mode === 'exam' ? 'ÉPREUVE DE MAÎTRISE' : session.mode === 'boss' ? 'DÉFI DU VILLAGE' : 'ENTRAÎNEMENT GUIDÉ'}</p><h2>{activeQuestion.prompt}</h2>
            {/if}

            {#if activeQuestion.type === 'choice' || activeQuestion.type === 'unit' || activeQuestion.type === 'error'}
              <div class:answer-cards={['battle', 'race'].includes(session.mode)} class:game-answer-cards={['battle','detective','clock','builder','race'].includes(session.mode)} class="answer-options">
                {#each activeQuestion.options as option, optionIndex}
                  <button class:option-selected={session.selected === option} class="answer-option" disabled={!!session.answerStatus} aria-pressed={session.selected === option} onclick={() => selectSessionOption(option)}>{#if session.mode === 'battle'}<small class="card-type-label">CARTE {optionIndex + 1}</small>{/if}{option}</button>
                {/each}
              </div>
            {:else if activeQuestion.type === 'match'}
              <div class="matching-game"><div class="matching-column"><h3>Mesures de départ</h3>{#each activeQuestion.leftItems as item}<button class:match-picked={session.matchingLeft === item.id} class:match-filled={session.matches[item.id]} class="match-tile" disabled={!!session.answerStatus} onclick={() => selectMatchLeft(item.id)}>{item.label}<small>{session.matches[item.id] ? 'Associé ✓' : 'Choisir'}</small></button>{/each}</div><div class="matching-column"><h3>Mesures équivalentes</h3>{#each activeQuestion.rightItems as item}<button class:match-used={Object.values(session.matches).includes(item.id)} class="match-tile right-match-tile" disabled={!!session.answerStatus || !session.matchingLeft} onclick={() => selectMatchRight(item.id)}>{item.label}<small>{Object.values(session.matches).includes(item.id) ? 'Utilisé ✓' : session.matchingLeft ? 'Relier ici' : 'Choisis une mesure à gauche'}</small></button>{/each}</div></div>
            {:else if activeQuestion.type === 'order'}
              <div class="order-game-list">{#each session.orderedItems as item, itemIndex}<div class="order-item"><span class="order-position">{itemIndex + 1}</span><strong>{item}</strong><div><button class="order-move" aria-label={`Monter ${item}`} disabled={!!session.answerStatus || itemIndex === 0} onclick={() => moveOrderedItem(itemIndex, -1)}>↑</button><button class="order-move" aria-label={`Descendre ${item}`} disabled={!!session.answerStatus || itemIndex === session.orderedItems.length - 1} onclick={() => moveOrderedItem(itemIndex, 1)}>↓</button></div></div>{/each}</div>
            {:else if activeQuestion.type === 'multi'}
              <p class="field-help">Plusieurs réponses peuvent être justes. Coche tout ce qui convient.</p><div class="answer-options multi-answer-options">{#each activeQuestion.options as option}<button class:option-selected={session.selectedMany.includes(option)} class="answer-option" aria-pressed={session.selectedMany.includes(option)} disabled={!!session.answerStatus} onclick={() => toggleMultiOption(option)}><span class="multi-check">{session.selectedMany.includes(option) ? '☑' : '□'}</span>{option}</button>{/each}</div>
            {:else if activeQuestion.type === 'table'}
              <p class="field-help">Écris le résultat directement dans la case jaune. Le clavier Mesurovia évite d’ouvrir le clavier de la tablette.</p>
              <div class="number-pad" aria-label="Clavier numérique Mesurovia">{#each ['7','8','9','4','5','6','1','2','3','clear','0','decimal','backspace'] as key}<button type="button" class:utility-key={['clear','decimal','backspace'].includes(key)} disabled={!!session.answerStatus} onclick={() => appendNumberKey(key)} aria-label={key === 'clear' ? 'Effacer tout' : key === 'backspace' ? 'Effacer le dernier chiffre' : key === 'decimal' ? 'Virgule' : key}>{key === 'clear' ? 'C' : key === 'backspace' ? '⌫' : key === 'decimal' ? ',' : key}</button>{/each}</div>
            {:else}
              <label for="mesurovia-answer" class="field-label">Ta réponse</label>
              <input id="mesurovia-answer" class="answer-input" inputmode={useOnscreenKeyboard ? 'none' : 'decimal'} autocomplete="off" placeholder="Écris un nombre (virgule acceptée)" bind:value={session.typed} readonly={useOnscreenKeyboard} disabled={!!session.answerStatus} onkeydown={(event) => { if (event.key === 'Enter') submitSessionAnswer(); }} />
              <p class="field-help">La virgule et le point sont acceptés. Sur tablette, utilise le clavier Mesurovia pour garder tout l’écran visible.</p>
              {#if useOnscreenKeyboard}<div class="number-pad" aria-label="Clavier numérique Mesurovia">{#each ['7','8','9','4','5','6','1','2','3','clear','0','decimal','backspace'] as key}<button type="button" class:utility-key={['clear','decimal','backspace'].includes(key)} disabled={!!session.answerStatus} onclick={() => appendNumberKey(key)} aria-label={key === 'clear' ? 'Effacer tout' : key === 'backspace' ? 'Effacer le dernier chiffre' : key === 'decimal' ? 'Virgule' : key}>{key === 'clear' ? 'C' : key === 'backspace' ? '⌫' : key === 'decimal' ? ',' : key}</button>{/each}</div>{/if}
            {/if}
            {#if !['exam', 'boss', 'pretest'].includes(session.mode)}
              <div class="question-tools"><button class="secondary-button" onclick={showExampleAgain} disabled={!!session.answerStatus}>Voir la méthode</button><button class="secondary-button" onclick={() => (conversionGuideOpen = true)}>Ouvrir le tableau</button><span>Une erreur est une occasion de réessayer.</span></div>
            {/if}
            {#if currentFeedback}
              <div class={`feedback-box ${currentFeedback.kind}`} role="status"><strong>{currentFeedback.title}</strong><p>{currentFeedback.text}</p></div>
            {/if}
            <div class="slide-actions">
              {#if session.answerStatus}<button class="primary-button" onclick={continueSession}>{session.index + 1 === session.questions.length || (session.mode === 'race' && session.raceSteps >= 10) ? 'Voir le résultat' : 'Question suivante →'}</button>
              {:else}<button class="primary-button" onclick={submitSessionAnswer}>{session.mode === 'battle' ? (session.attempts > 0 ? 'Rejouer cette carte' : 'Jouer cette carte') : session.mode === 'race' ? 'Valider et avancer' : session.attempts > 0 && session.mode !== 'exam' && session.mode !== 'boss' ? 'Réessayer' : 'Valider ma réponse'}</button>{/if}
              {#if session.mode !== 'exam' && session.mode !== 'boss' && session.mode !== 'pretest' && currentFeedback?.kind === 'worked' && !session.answerStatus}<button class="secondary-button" onclick={continueSession}>J’ai compris, passer à la suivante</button>{/if}
              {#if session.mode === 'pretest'}<button class="text-button" onclick={continueSession} disabled={!session.answerStatus}>Passer au bilan suivant</button>{/if}
            </div>
          </article>
          {/if}

        {:else if !houseProgress.theoryDone}
          <div class="theory-progress"><div><span class="eyebrow">COURS GUIDÉ · {house?.title}</span><strong>Diapositive {lessonSlideNumber} sur {lessons.length * 2}</strong></div><div class="progress-track"><i style={`width:${lessonProgress}%`}></i></div></div>
          <article class="slide-card lesson-slide">
            <div class="slide-topline"><span class="step-counter">{theoryPhase === 'explain' ? `PARTIE ${lessonIndex + 1} / ${lessons.length}` : `QUESTION ${lessonIndex + 1} / ${lessons.length}`}</span><span class="step-counter">Une seule idée à la fois</span></div>
            {#if theoryPhase === 'explain'}
              <div class="lesson-copy"><p class="eyebrow">LE MAÎTRE EXPLIQUE</p><h2>{currentLesson?.title}</h2><p class="lesson-body">{currentLesson?.body}</p>
                {#if currentLesson?.visual === 'TABLE' || currentLesson?.visual === 'TABLE_EXAMPLE'}
                  <div class="conversion-table-card"><h3>Le tableau des longueurs</h3><p>Les grandes unités sont à gauche et les petites à droite. Pour 2,4 m, place 2 dans la colonne m et 4 dans dm : 2,4 m = 24 dm = 240 cm.</p><table class="unit-table"><thead><tr><th>km</th><th>hm</th><th>dam</th><th>m</th><th>dm</th><th>cm</th><th>mm</th></tr></thead><tbody><tr>{#each ['–','–','–','2','4','–','–'] as digit, i}<td class:highlight-unit={i === 3 || i === 4}>{digit}</td>{/each}</tr></tbody></table><div class="table-steps"><span><b>1</b> Repère l’unité donnée.</span><span><b>2</b> Place le chiffre des unités dans sa colonne.</span><span><b>3</b> Lis la colonne demandée.</span><span><b>4</b> Vérifie si le nombre doit augmenter ou diminuer.</span></div><button class="secondary-button" onclick={() => (conversionGuideOpen = true)}>Essayer avec mon nombre</button></div>
                {:else if currentLesson?.visual}
                  <!-- Les visuels sont des fragments statiques définis dans le moteur du cours, jamais du HTML saisi par l'élève. -->
                  <div class="lesson-visual">{@html currentLesson.visual}</div>
                {/if}
                <div class="concrete-example"><div><strong>Un repère concret</strong><p>Observe le schéma et les repères ci-dessus. Puis essaie avec une nouvelle mesure : tu pourras vérifier ta réponse juste après.</p></div></div>
              </div>
              <aside class="teacher-speech"><div class="teacher-portrait"><img src={`${base}/images/mesurovia/maitre-mesuro.png`} alt="" aria-hidden="true" /></div><strong>Maître Mesuro</strong><p>Lis cette diapositive, regarde l’exemple, puis passe à ma question. Le tableau de conversion reste accessible en haut.</p><button class="primary-button" onclick={() => { theoryPhase = 'checkpoint'; lessonChoice = ''; lessonFeedback = null; }}>J’ai compris, poser la question →</button></aside>
            {:else}
              <div class="checkpoint-copy"><p class="eyebrow">VALIDATION DE L’ÉTAPE {lessonIndex + 1}</p><h2>{currentLesson?.ask}</h2><p>Choisis ta réponse. Si tu te trompes, le maître te donnera une aide et tu pourras recommencer cette question.</p>
                <div class="answer-options lesson-options">{#each currentLesson?.options ?? [] as option}<button class:option-selected={lessonChoice === option} class="answer-option" aria-pressed={lessonChoice === option} onclick={() => (lessonChoice = option)}>{option}</button>{/each}</div>
                {#if lessonFeedback}<div class={`feedback-box ${lessonFeedback.kind}`} role="status"><strong>{lessonFeedback.title}</strong><p>{lessonFeedback.text}</p></div>{/if}
                <div class="slide-actions"><button class="secondary-button" onclick={() => { theoryPhase = 'explain'; lessonFeedback = null; }}>← Revoir l’explication</button><button class="primary-button" onclick={() => {
                  if (!lessonChoice) { lessonFeedback = { kind: 'notice', title: 'Choisis une réponse', text: 'Prends le temps de relire l’explication ; tu peux revenir à la diapositive précédente.' }; return;
                  }
                  if (engine.normalizeAnswer(lessonChoice) === engine.normalizeAnswer(currentLesson?.answer)) {
                    lessonFeedback = { kind: 'success', title: 'Exact !', text: currentLesson?.explain || 'Tu as compris cette étape.' };
                    if (lessonIndex + 1 >= lessons.length) {
                      setHouseProgress(currentVillageId, currentHouseId, { theoryDone: true });
                      addXP(10, 'Théorie terminée');
                      theoryPhase = 'explain';
                    } else {
                      lessonIndex += 1;
                      theoryPhase = 'explain';
                    }
                    lessonChoice = '';
                  } else {
                    lessonFeedback = { kind: 'hint', title: 'Pas encore : relis le repère', text: currentLesson?.explain || 'Repère l’unité et reviens à l’étape décrite dans la diapositive.' };
                  }
                }}>{lessonIndex + 1 === lessons.length ? 'Valider la théorie' : 'Valider et continuer →'}</button></div>
              </div>
            {/if}
          </article>

        {:else}
          <div class="room-dashboard">
            <div class="room-dashboard-heading"><p class="eyebrow">THÉORIE VALIDÉE</p><h2>À toi de choisir la prochaine mission.</h2><p>Tu peux t’entraîner tranquillement ou apprendre en jouant avec les cartes. L’examen devient disponible après un entraînement réussi.</p></div>
            <div class="activity-choice-grid">
              <article class="activity-choice"><div class="activity-art"><img src={`${base}/images/mesurovia/catalog/game-practice.png`} alt="" /></div><p class="eyebrow">MODE APPRENTISSAGE</p><h3>Le pupitre d’exercices</h3><p>Dix questions progressives. Au premier village, le tableau de conversion revient plusieurs fois pour apprendre à le lire et le remplir.</p><button class="primary-button" onclick={() => startSession('practice')}>S’entraîner au pupitre →</button></article>
              <article class="activity-choice"><div class="activity-art"><img src={`${base}/images/mesurovia/catalog/game-battle.png`} alt="" /></div><p class="eyebrow">VRAI MINI-JEU · 5 MANCHES</p><h3>Bataille des unités</h3><p>Choisis une carte-mesure pour attaquer le gardien. Une bonne réponse déclenche ton attaque ; une erreur déclenche sa riposte. Sans chronomètre.</p><button class="primary-button" onclick={() => startSession('battle')}>Lancer le duel →</button></article>
              <article class="activity-choice"><div class="activity-art"><img src={`${base}/images/mesurovia/catalog/game-pairs.png`} alt="" /></div><p class="eyebrow">APPARIEMENT · 6 PAIRES</p><h3>Associe les mesures</h3><p>Toutes les cartes sont visibles. Trouve deux écritures équivalentes en comparant les unités.</p><button class="primary-button" onclick={() => startSession('memory')}>Voir les cartes →</button></article>
              <article class="activity-choice"><div class="activity-art"><img src={`${base}/images/mesurovia/catalog/game-race.png`} alt="" /></div><p class="eyebrow">JEU DE PLATEAU · VERSUS</p><h3>Course au trésor</h3><p>Résous un défi, lance le dé et fais avancer ton pion jusqu’au coffre avant le renard. Les erreurs n’enlèvent aucun point.</p><button class="primary-button" onclick={() => startSession('race')}>Courir vers le trésor →</button></article>
              {#if tableGameAvailable}<article class="activity-choice"><div class="activity-art"><img src={`${base}/images/mesurovia/catalog/game-table.png`} alt="" /></div><p class="eyebrow">MANIPULATION · 10 QUESTIONS</p><h3>Le Tableau magique</h3><p>Utilise le tableau des unités et saisis le résultat avec le clavier intégré. Tu peux ouvrir un exemple pas à pas à tout moment.</p><button class="primary-button" onclick={() => startSession('table')}>Ouvrir le coffre →</button></article>{/if}
              <article class="activity-choice"><div class="activity-art"><img src={`${base}/images/mesurovia/catalog/game-detective.png`} alt="" /></div><p class="eyebrow">ENQUÊTE</p><h3>Qui a raison ?</h3><p>Quatre élèves proposent des réponses. Vérifie chaque conversion et trouve qui a raison.</p><button class="primary-button" onclick={() => startSession('detective')}>Chercher les indices →</button></article>
              {#if clockGameAvailable}<article class="activity-choice"><div class="activity-art"><img src={`${base}/images/mesurovia/catalog/game-clock.png`} alt="" /></div><p class="eyebrow">JEU DE TEMPS</p><h3>Répare l’horloge</h3><p>Relie les durées équivalentes ou range-les dans le bon ordre pour relancer le moulin.</p><button class="primary-button" onclick={() => startSession('clock')}>Réparer l’horloge →</button></article>{/if}
              {#if builderGameAvailable}<article class="activity-choice"><div class="activity-art"><img src={`${base}/images/mesurovia/catalog/game-builder.png`} alt="" /></div><p class="eyebrow">MISSION EN ÉTAPES</p><h3>Le chantier des formes</h3><p>Chaque défi résolu ajoute une pièce au bâtiment. Les mesures d’aire ou de volume servent à terminer le chantier.</p><button class="primary-button" onclick={() => startSession('builder')}>Construire →</button></article>{/if}
              <article class="activity-choice exam-choice"><div class="activity-art"><ActivityIllustration kind="crest" reduceMotion={reduceMotion} /></div><p class="eyebrow">MODE MAÎTRISE</p><h3>L’épreuve du blason</h3><p>{houseProgress.trainingDone ? 'Tu as validé un entraînement. Passe à dix questions variées sans indice.' : 'Réussis un entraînement ou un mini-jeu pour déverrouiller cette épreuve.'}</p><button class="primary-button" disabled={!houseProgress.trainingDone} onclick={beginExam}>{houseProgress.examPassed ? 'Repasser l’épreuve' : 'Préparer le blason →'}</button>{#if houseProgress.examPassed}<span class="status-pill success-pill">✓ Blason déjà obtenu</span>{/if}</article>
            </div>
            {#if trainingFeedback}<div class={`feedback-box ${trainingFeedback.kind}`}><strong>{trainingFeedback.title}</strong><p>{trainingFeedback.text}</p></div>{/if}
            <div class="room-bottom-actions"><button class="secondary-button" onclick={() => { lessons = engine.lessonForHouse(house.id, currentVillageId); lessonIndex = 0; theoryPhase = 'explain'; setHouseProgress(currentVillageId, currentHouseId, { theoryDone: false }); }}>Revoir toute la théorie</button><button class="secondary-button" onclick={() => downloadCourse(currentVillageId)}>Ouvrir le cahier imprimable</button><button class="text-button" onclick={closeHouse}>Retourner dans le village</button></div>
          </div>
        {/if}
      </section>

    {:else if view === 'pretest'}
      <section class="standalone-session-page"><div class="page-heading"><p class="eyebrow">AVANT L’AVENTURE</p><h1>Bilan de départ</h1><p>Ce bilan aide à choisir un point de départ. Ce n’est ni une note ni un diagnostic.</p><button class="text-button" onclick={goHome}>← Retour à l’accueil</button></div>
        {#if sessionResult}
          <article class="slide-card result-slide"><div class="result-icon">✓</div><div><h2>{sessionResult.title}</h2><p class="score-line">{sessionResult.score} réponses justes sur {sessionResult.total}</p><p>{sessionResult.detail}</p><h3>Conseil par compétence</h3><div class="family-result-grid">{#each familyOrder as family}<div><span>{engine.FAMILIES[family].label}</span><strong>{sessionResult ? (sessionResult.total ? `${session?.familyResults?.[family]?.correct ?? profile?.pretest?.byFamily?.[family]?.correct ?? 0}/${session?.familyResults?.[family]?.total ?? profile?.pretest?.byFamily?.[family]?.total ?? 0}` : '—') : ''}</strong></div>{/each}</div><button class="primary-button" onclick={() => { sessionResult = null; session = null; view = 'villages'; }}>Choisir mon village →</button></div></article>
        {:else if session && activeQuestion}
          <div class="session-progress"><strong>Question {session.index + 1} / {session.questions.length}</strong><div class="progress-track"><i style={`width:${(session.index / session.questions.length) * 100}%`}></i></div></div>
          <article class="slide-card question-slide"><p class="eyebrow">{currentFamilyLabel}</p><h2>{activeQuestion.prompt}</h2>{#if activeQuestion.type === 'choice'}<div class="answer-options">{#each activeQuestion.options as option}<button class:option-selected={session.selected === option} class="answer-option" disabled={!!session.answerStatus} onclick={() => selectSessionOption(option)}>{option}</button>{/each}</div>{:else}<input class="answer-input" bind:value={session.typed} placeholder="Écris ta réponse" disabled={!!session.answerStatus} />{/if}{#if currentFeedback}<div class={`feedback-box ${currentFeedback.kind}`} role="status" aria-live="polite"><strong>{currentFeedback.title}</strong><p>{currentFeedback.text}</p></div>{/if}<div class="slide-actions">{#if session.answerStatus}<button class="primary-button" onclick={continueSession}>{session.index + 1 === session.questions.length ? 'Voir mon bilan' : 'Question suivante →'}</button>{:else}<button class="primary-button" onclick={submitSessionAnswer}>Valider ma réponse</button>{/if}</div></article>
        {/if}
      </section>

    {:else if view === 'howto'}
      <section class="slide-stage howto-stage"><div class="stage-topline"><button class="text-button" onclick={goHome}>← Accueil</button><span class="step-counter">DIAPOSITIVE {currentHowToSlide + 1} / {howToSlides.length}</span></div><article class="slide-card howto-slide"><div class="howto-number">{String(currentHowToSlide + 1).padStart(2, '0')}</div><div><p class="eyebrow">COMMENT JOUER</p><h1>{howToSlides[currentHowToSlide].title}</h1><p class="slide-lead">{howToSlides[currentHowToSlide].text}</p><div class="slide-actions">{#if currentHowToSlide > 0}<button class="secondary-button" onclick={() => (currentHowToSlide -= 1)}>← Précédent</button>{/if}{#if currentHowToSlide < howToSlides.length - 1}<button class="primary-button" onclick={() => (currentHowToSlide += 1)}>Suivant →</button>{:else}<button class="primary-button" onclick={() => { view = profile ? 'villages' : 'character'; }}>C’est parti !</button>{/if}</div></div></article></section>
    {/if}

    {#if modalMessage}
      <div class="xp-toast" role="status">{modalMessage}<button onclick={() => (modalMessage = '')} aria-label="Fermer">×</button></div>
    {/if}
    <button class="guide-fab" onclick={() => (conversionGuideOpen = true)}>Tableau de conversion</button>
    {#if conversionGuideOpen}<ConversionGuide onClose={() => (conversionGuideOpen = false)} />{/if}
    <div class="portrait-notice" role="status"><strong>Tourne l’iPad en portrait</strong><span>Mesurovia est conçu pour être joué verticalement.</span></div>
    <footer class="game-footer"><span>MESUROVIA · Prototype V3</span><div class="display-tools"><label><input type="checkbox" bind:checked={largeText} onchange={persist} /> Texte plus grand</label><label><input type="checkbox" bind:checked={highContrast} onchange={persist} /> Contraste renforcé</label><label><input type="checkbox" bind:checked={reduceMotion} onchange={persist} /> Réduire les animations</label></div><span>Sauvegarde locale par profil</span></footer>
  </main>
{/if}

<style>
  .avatar-portrait, .avatar-full { display:inline-block; flex:none; background-image:url('/images/mesurovia/hero-atlas.png'); background-repeat:no-repeat; background-size:600% 100%; background-position:var(--avatar-pos,0%) center; }
  .avatar-portrait { width:31px; height:34px; border-radius:50%; border:1px solid #a5b38e; background-color:#eef0dc; background-size:600% auto; background-position:var(--avatar-pos,0%) 4%; }
  .avatar-full { width:100%; height:100%; min-height:85px; }
  .avatar-big .avatar-full { width:150px; height:185px; }
  .avatar-choice .avatar-full { width:56px; height:65px; min-height:0; }
  .player-chip { display:inline-flex; align-items:center; gap:7px; }
  .orbis-shortcut { display:inline-flex; align-items:center; text-decoration:none; }
  .header-menu-wrap { display:flex; align-items:center; gap:7px; }
  .game-header { transition:transform 180ms ease; }
  .game-header.header-hidden { transform:translateY(-110%); }
  .guide-fab { position:fixed; z-index:30; right:16px; bottom:16px; border:2px solid #24563e; border-radius:12px; padding:12px; background:#f4da90; color:#244b34; font-weight:900; box-shadow:0 4px 14px #1d3d3155; }
  .portrait-notice { display:none; }
  .house-nameplate { display:flex; align-items:center; justify-content:center; width:100%; height:100%; padding:3px 5px; box-sizing:border-box; border:2px solid #765c40; border-radius:7px; background:#fff9e9ee; color:#354d37; text-align:center; font:800 11px/1.1 Arial,sans-serif; overflow-wrap:anywhere; }
  .curriculum-code { display:inline-block; padding:5px 9px; border-radius:7px; background:#e8efdc; color:#315840; font-size:.78rem; font-weight:850; }
  .house-objective { max-width:760px; margin:8px 0 0; color:#42584a; line-height:1.5; }
  .village-objective { display:block; margin-top:8px; color:#42584a; font-size:.8rem; line-height:1.45; }
  .village-objective-panel { display:flex; flex-wrap:wrap; gap:7px; max-width:760px; margin-top:14px; padding:13px; border:2px solid #c8d2b7; border-radius:12px; background:#f5f4e7; }
  .village-objective-panel strong, .village-objective-panel span { flex-basis:100%; }
  .village-objective-panel small { padding:5px 8px; border-radius:999px; background:#e3ecd5; color:#3f5946; font-weight:800; }
  .mesurovia-catalog-page { padding:clamp(22px,4vw,52px); }
  .catalog-page-heading { max-width:850px; margin:0 auto 28px; }
  .catalog-page-heading h1 { margin:8px 0 10px; font:700 clamp(2rem,5vw,3.4rem) Georgia,serif; }
  .catalog-page-heading > p:not(.eyebrow) { color:var(--muted); font-size:1.05rem; line-height:1.65; }
  .mesurovia-catalog-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:18px; max-width:1280px; margin:0 auto; }
  .mesurovia-catalog-card { display:flex; flex-direction:column; min-width:0; overflow:hidden; border:2px solid #d2c9ae; border-radius:18px; background:#fffdf4; box-shadow:0 6px 0 #d4c7a5; }
  .mesurovia-catalog-card > div { display:flex; flex:1; flex-direction:column; align-items:flex-start; padding:16px; }
  .mesurovia-catalog-card h2 { margin:5px 0 8px; font:700 1.3rem Georgia,serif; }
  .mesurovia-catalog-card p:not(.eyebrow) { color:#536354; line-height:1.55; }
  .mesurovia-catalog-card .primary-button { width:100%; margin-top:auto; }
  .catalog-image-button { display:block; width:100%; aspect-ratio:1.25; padding:0; overflow:hidden; border:0; border-bottom:2px solid #d2c9ae; background:#e8eddf; cursor:pointer; }
  .catalog-image-button img { display:block; width:100%; height:100%; object-fit:cover; transition:transform .2s ease; }
  .catalog-image-button:hover img, .catalog-image-button:focus-visible img { transform:scale(1.035); }
  .catalog-units { margin:0 0 8px; color:#315f46 !important; font-weight:900; }
  .course-zone-status { display:inline-block; margin:2px 0 14px; padding:6px 8px; border-radius:7px; background:#edf0df; color:#58634d; font-size:.74rem; font-weight:850; }
  .memory-card.card-picked .memory-card-front { outline:4px solid #d3a33d; outline-offset:-4px; }
  @media (pointer:coarse) and (orientation:landscape) and (min-width:700px) { .portrait-notice { position:fixed; inset:0; z-index:90; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:15px; background:#f5f1e5; color:#2c593f; text-align:center; font-size:1.2rem; } .portrait-notice strong { font:700 2rem Georgia,serif; } }
  @media (pointer:coarse) and (orientation:portrait) and (min-width:700px) and (max-width:950px) { .classroom-scene { display:none; } .room-header h1 { font-size:1.55rem; margin:3px 0; } .room-header p { margin:0; } .classroom-page { padding-top:8px; } .slide-card { padding:14px 18px; } .number-pad { margin:4px auto; gap:4px; } .number-pad button { min-height:37px; } .session-progress { margin:6px 0; } .question-tools { margin:6px 0; } .game-footer { display:none; } }
  :global(html) { background: #f5f1e5; }
  :global(body) { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #2e3c35; }
  :global(button), :global(input) { font: inherit; }
  :global(button) { cursor: pointer; }
  :global(button:disabled) { cursor: not-allowed; opacity: .48; }
  .mesurovia-shell { --ink: #2e3c35; --muted: #637267; --paper: #fbf8ee; --line: #d8d0b9; --green: #367958; --green-dark: #23563f; --gold: #f1c66a; --terracotta: #c76d4e; --sky: #a9d9dd; min-height: 100vh; background: radial-gradient(circle at 20% 0%, #fffdf5 0, #f5f1e5 48%, #e8e8d5 100%); color: var(--ink); padding: 0 0 28px; box-sizing: border-box; }
  .mesurovia-shell.large-text { font-size: 1.12rem; }
  .mesurovia-shell.high-contrast { --ink: #12251a; --muted: #293d31; --paper: #fff; --line: #645c49; --green: #125832; --green-dark: #0b3a22; }
  .mesurovia-shell.reduced-motion *, .mesurovia-shell.reduced-motion *::before, .mesurovia-shell.reduced-motion *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
  .game-header { position: sticky; top: 0; z-index: 20; display: grid; grid-template-columns: 1fr auto auto; gap: 18px; align-items: center; background: rgba(251,248,238,.94); border-bottom: 2px solid #d7cfb7; box-shadow: 0 4px 14px #756d4c16; padding: 12px clamp(14px, 3vw, 40px); backdrop-filter: blur(10px); }
  .brand-button { border: 0; background: transparent; display: flex; gap: 11px; align-items: center; color: var(--ink); text-align: left; padding: 0; }
  .brand-icon { display: grid; place-items: center; width: 44px; height: 44px; background: #f1ce78; border: 3px solid #9f733c; box-shadow: 0 4px 0 #c5a65d; border-radius: 10px; font-size: 26px; }
  .brand-button strong { display: block; font-size: 1.05rem; letter-spacing: .12em; }
  .brand-button small { display: block; color: var(--muted); font-size: .76rem; margin-top: 2px; }
  .header-player { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px; align-items: center; }
  .orbis-return-link { display: inline-flex; align-items: center; min-height: 36px; padding: 7px 10px; border: 2px solid #b7aa88; border-radius: 9px; background: #fffdf5; color: #315d43; font-size: .78rem; font-weight: 850; text-decoration: none; white-space: nowrap; }
  .orbis-return-link:hover, .orbis-return-link:focus-visible { background: #e8f1df; border-color: #71966c; }
  .player-chip, .xp-chip, .crest-chip { border: 2px solid #ded5ba; border-radius: 999px; background: #fffdf5; padding: 8px 11px; font-weight: 750; font-size: .82rem; white-space: nowrap; }
  .xp-chip { background: #fff1bf; border-color: #e0be60; }
  .crest-chip { background: #e0eee0; border-color: #b4d1b4; }
  .header-menu-wrap { position: relative; }
  .menu-toggle { border: 2px solid #27583f; background: #356f50; color: #fff9e6; border-radius: 10px; font-weight: 800; padding: 11px 15px; }
  .menu-popover { position: absolute; top: calc(100% + 10px); right: 0; width: min(270px, 80vw); padding: 8px; border: 2px solid #a99d7d; border-radius: 13px; background: #fffdf4; box-shadow: 0 12px 30px #314a3533; display: grid; gap: 5px; z-index: 40; }
  .menu-popover button, .file-import { background: transparent; border: 0; color: var(--ink); text-align: left; padding: 11px; border-radius: 8px; font-weight: 700; }
  .menu-popover button:hover, .file-import:hover { background: #edf2dd; }
  .file-import { cursor: pointer; position: relative; }
  .file-import input { position: absolute; inset: 0; width: 100%; opacity: 0; cursor: pointer; }
  .save-message { margin: 10px auto 0; max-width: 1100px; background: #e4f1df; border: 1px solid #a1c59e; padding: 8px 13px; border-radius: 9px; color: #245738; display: flex; justify-content: space-between; gap: 10px; }
  .save-message button, .xp-toast button { background: transparent; border: 0; font-weight: 900; font-size: 1.2rem; }
  .welcome-layout { max-width: 1240px; padding: clamp(24px, 5vw, 64px) 24px 50px; margin: auto; display: grid; grid-template-columns: minmax(0, 1.03fr) minmax(350px, .97fr); gap: clamp(25px, 5vw, 72px); align-items: center; }
  .welcome-art { min-height: 490px; position: relative; border: 3px solid #b0ae82; border-radius: 24px; background: #d7e8bf; overflow: hidden; box-shadow: 0 12px 0 #b1b58e, 0 20px 30px #506d3d1c; }
  .welcome-scene { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; }
  .welcome-art::after { content: ''; position: absolute; z-index: 1; inset: 50% 0 0; background: linear-gradient(transparent, #174b3e70); pointer-events: none; }
  .spark { position: absolute; z-index: 2; color: #fff4b8; font-size: 30px; text-shadow: 0 2px #d7a85f; animation: welcome-twinkle 4.2s ease-in-out infinite; }
  .spark-a { top: 21%; left: 20%; }.spark-b { top: 36%; right: 18%; animation-delay: .8s; }.spark-c { top: 13%; left: 56%; animation-delay: 1.6s; }
  .floating-label { position: absolute; z-index: 3; bottom: 18px; left: 20px; right: 20px; border: 2px solid #3d7653; border-radius: 12px; padding: 11px; background: #f8f5deec; text-align: center; color: #2e573e; font-weight: 800; }
  .welcome-copy { max-width: 610px; }
  .eyebrow { color: #557d5a; text-transform: uppercase; letter-spacing: .12em; font-size: .74rem; font-weight: 900; margin: 0 0 12px; }
  h1, h2, h3, p { margin-top: 0; }
  h1 { font-family: Georgia, 'Times New Roman', serif; color: #2a4937; font-size: clamp(2.25rem, 4vw, 3.65rem); line-height: 1.04; letter-spacing: -.035em; margin-bottom: 20px; }
  h2 { font-size: clamp(1.5rem, 2.4vw, 2.25rem); line-height: 1.15; color: #294a36; margin-bottom: 14px; }
  h3 { color: #294a36; }
  .lead { font-size: clamp(1.05rem, 1.5vw, 1.22rem); line-height: 1.7; color: #4d5c4d; margin-bottom: 25px; }
  .welcome-actions { display: grid; gap: 10px; max-width: 400px; }
  .welcome-side-actions { display: flex; flex-wrap: wrap; gap: 19px; margin-top: 20px; }
  .welcome-note { margin-top: 25px; max-width: 430px; font-size: .9rem; line-height: 1.5; color: #6c796c; border-left: 3px solid #d4b85c; padding-left: 12px; }
  .primary-button, .secondary-button, .gold-button { border: 2px solid #24563e; border-radius: 10px; background: #367958; color: #fffced; padding: 11px 16px; font-weight: 850; box-shadow: 0 3px 0 #24563e; transition: transform .12s, box-shadow .12s, background .12s; }
  .primary-button:hover:not(:disabled) { background: #2b694b; transform: translateY(-1px); box-shadow: 0 4px 0 #24563e; }
  .secondary-button { background: #fff9e8; color: #36513c; border-color: #b7a986; box-shadow: 0 3px 0 #c9b997; }
  .secondary-button:hover:not(:disabled) { background: #f3ebd4; }
  .large-button { padding: 14px 18px; font-size: 1rem; }
  .text-button { border: 0; background: transparent; color: #3b704d; font-weight: 800; padding: 5px 0; text-align: left; }
  .text-button:hover { color: #234e35; text-decoration: underline; }
  .loading-screen { min-height: 100vh; display: grid; place-items: center; font-weight: 800; color: #3b704d; }
  .slide-stage { max-width: 1030px; padding: 28px 22px 65px; margin: auto; }
  .stage-topline, .slide-topline, .page-heading, .village-topbar, .room-header, .slide-actions, .room-bottom-actions, .map-footer { display: flex; justify-content: space-between; align-items: center; gap: 14px; }
  .step-counter { background: #e6eddb; border: 1px solid #c8d8bb; color: #416347; border-radius: 999px; padding: 7px 11px; font-size: .75rem; font-weight: 900; letter-spacing: .05em; }
  .slide-card { background: var(--paper); border: 2px solid var(--line); border-radius: 20px; padding: clamp(20px, 4vw, 44px); box-shadow: 0 9px 0 #d2c9ad, 0 14px 30px #50604512; }
  .character-slide { margin-top: 18px; display: grid; grid-template-columns: 180px 1fr; align-items: center; gap: clamp(20px, 4vw, 55px); }
  .slide-illustration { min-height: 170px; display: grid; place-items: center; border: 3px solid #a9b994; background: linear-gradient(135deg, #d4e7c0, #f4e4a9); border-radius: 18px; box-shadow: inset 0 -10px #abc78c; }
  .avatar-big { font-size: 6.5rem; }
  .slide-lead { color: var(--muted); line-height: 1.65; max-width: 680px; font-size: 1.05rem; }
  .field-label { display: block; color: #354e39; font-weight: 850; margin: 17px 0 8px; }
  .name-input, .answer-input { box-sizing: border-box; width: 100%; max-width: 560px; border: 2px solid #bfb69b; border-radius: 10px; background: #fffef8; padding: 13px 14px; font-size: 1.06rem; color: #293c31; }
  .name-input:focus, .answer-input:focus { outline: 3px solid #87ba90; outline-offset: 2px; border-color: #387a51; }
  .voice-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin: 12px 0; }
  .field-help { display: block; margin-top: 7px; font-size: .86rem; color: var(--muted); }
  .avatar-picker { display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0 22px; }
  .avatar-choice { width: 58px; height: 58px; border: 2px solid #cdc4ab; border-radius: 12px; background: #fff9e8; font-size: 1.9rem; transition: transform .16s, box-shadow .16s, background .16s; }
  .avatar-choice:hover, .avatar-choice:focus-visible { transform: translateY(-3px) scale(1.04); box-shadow: 0 4px 0 #cbbd9b; }
  .chosen-avatar { outline: 3px solid #4b8d60; background: #dff0d7; border-color: #31734b; }
  .villages-page, .village-page, .classroom-page, .standalone-session-page { max-width: 1260px; padding: 35px clamp(14px, 3vw, 38px) 55px; margin: 0 auto; }
  .page-heading { align-items: flex-start; display: block; max-width: 840px; margin-bottom: 25px; }
  .page-heading p:not(.eyebrow) { color: var(--muted); line-height: 1.6; }
  .village-selection-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
  .village-choice-card { --village-accent: #4e976c; min-height: 315px; padding: 14px; border: 2px solid #c7c2a8; border-radius: 16px; background: #fffbed; box-shadow: 0 5px 0 #d6c9a7; text-align: left; color: #2e4535; display: flex; flex-direction: column; gap: 11px; transition: transform .2s, border-color .2s, box-shadow .2s; }
  .village-choice-card:hover { transform: translateY(-4px); border-color: var(--village-accent); }
  .village-choice-card:hover { box-shadow: 0 8px 0 #d6c9a7, 0 12px 22px #455d3b18; }
  .village-card-art { position: relative; display: block; height: 130px; border: 2px solid #b5cba2; border-radius: 10px; background: #dcebd2; overflow: hidden; }
  .village-card-art::after { content: ''; position: absolute; inset: 48% 0 0; background: linear-gradient(transparent, #183e3266); pointer-events: none; }
  .village-card-art img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform .55s cubic-bezier(.2,.75,.3,1); }
  .village-choice-card:hover .village-card-art img, .village-choice-card:focus-visible .village-card-art img { transform: scale(1.06); }
  .region-number { color: #537753; font-size: .68rem; font-weight: 950; letter-spacing: .1em; }
  .village-choice-card strong { font-family: Georgia, serif; font-size: 1.22rem; line-height: 1.16; }
  .village-choice-card > span:not(.village-card-art):not(.region-number):not(.village-card-footer) { color: #637363; font-size: .87rem; line-height: 1.4; }
  .village-card-footer { border-top: 1px solid #ded6c0; padding-top: 10px; display: flex; justify-content: space-between; margin-top: auto; font-weight: 800; color: var(--village-accent); }
  .recommendation-note { margin-top: 22px; padding: 13px 15px; border-radius: 10px; border: 1px solid #d4c58b; background: #fff5cc; color: #5c5532; }
  .village-topbar { display: grid; grid-template-columns: minmax(0, 1fr) minmax(170px, 250px) auto; gap: 18px; align-items: center; margin-bottom: 18px; }
  .village-topbar h1 { font-size: clamp(2rem, 3.4vw, 3rem); margin-bottom: 9px; }
  .village-topbar p:not(.eyebrow) { max-width: 740px; line-height: 1.55; color: var(--muted); }
  .village-region-art { display: block; width: 100%; height: 145px; object-fit: cover; border: 3px solid #b9c59c; border-radius: 14px; box-shadow: 0 5px 0 #d4c8a8; }
  .village-side-panel { border: 2px solid #d2c6a4; border-radius: 14px; padding: 13px; min-width: 190px; background: #fff9e9; display: grid; gap: 10px; font-weight: 800; }
  .map-instructions { display: flex; align-items: center; gap: 12px; border-radius: 12px; background: #e6efda; border: 1px solid #bfd4b2; color: #34563d; padding: 11px 14px; margin-bottom: 14px; }
  .map-instructions span:nth-child(2) { flex: 1; line-height: 1.4; }
  .map-pointer-icon { border: 2px solid #55835e; background: #fff9e5; border-radius: 8px; padding: 4px 8px; font-size: 1.4rem; }
  .river-glint { animation: river-glide 14s linear infinite; }
  .tree-canopy, .tree-crown { transform-box: fill-box; transform-origin: center bottom; animation: canopy-sway 5.8s ease-in-out infinite; animation-delay: var(--tree-delay, 0ms); }
  .map-flower { transform-box: fill-box; transform-origin: center bottom; animation: flower-sway 4.4s ease-in-out infinite; }
  .npc-idle { transform-box: fill-box; transform-origin: center bottom; animation: villager-bob 4.2s ease-in-out infinite; animation-delay: var(--idle-delay, 0ms); }
  .player-idle { transform-box: fill-box; transform-origin: center bottom; animation: player-bob 3.2s ease-in-out infinite; }
  .pixel-map-frame { background: #8fbe7d; border: 5px solid #6f8f60; border-radius: 18px; overflow: hidden; box-shadow: 0 8px 0 #bcc59e, 0 15px 24px #4b604026; }
  .pixel-map { display: block; width: 100%; height: auto; aspect-ratio: 1000 / 620; cursor: crosshair; image-rendering: pixelated; }
  .pixel-map.illustrated-map { image-rendering: auto; }
  .illustrated-map .legacy-map-scenery, .illustrated-map .legacy-house-art, .illustrated-map .npc-idle { display: none; }
  .village-world-art { image-rendering: auto; }
  .house-hit-area, .npc-hit-area { cursor: pointer; }
  .map-water-glimmer { fill: #fff7cc; transform-box: fill-box; transform-origin: center; animation: map-glimmer 4.5s ease-in-out infinite; }
  .map-water-glimmer.later { animation-delay: 1.5s; }
  .map-water-glimmer.last { animation-delay: 3s; }
  .map-label { font: 900 13px ui-monospace, monospace; fill: #634c34; letter-spacing: 1px; }.tiny-label { font: 900 10px ui-monospace, monospace; fill: #5a4531; }.building-number { font: 900 15px ui-monospace, monospace; fill: #5c452f; }.building-label { font: 900 11px ui-monospace, monospace; fill: #2f5138; paint-order: stroke; stroke: #f6edcf; stroke-width: 4px; stroke-linejoin: round; }.badge-mark { font: 900 16px sans-serif; fill: #4b733d; }.npc-label { font: 900 11px ui-monospace, monospace; fill: #244832; paint-order: stroke; stroke: #f8edc9; stroke-width: 4px; stroke-linejoin: round; }
  .map-house, .npc-sprite { cursor: pointer; outline: none; }.map-house:hover { filter: brightness(1.08) drop-shadow(0 0 3px #fff5bd); }.map-house:focus, .npc-sprite:focus { filter: brightness(1.12) drop-shadow(0 0 4px #fff5bd); }.npc-sprite:hover { filter: brightness(1.08) drop-shadow(0 0 4px #fff6c4); }.player-sprite { pointer-events: none; transition: transform .36s cubic-bezier(.22,.74,.22,1); }.joke-text { font: 800 12px/1.25 system-ui, sans-serif; color: #4e4030; display: flex; align-items: center; height: 100%; }
  .map-footer { padding: 15px 3px 0; color: #61715d; font-size: .9rem; font-weight: 800; flex-wrap: wrap; }
  .room-header { align-items: flex-start; margin-bottom: 20px; }.room-header h1 { font-size: clamp(2rem, 3vw, 2.8rem); margin-bottom: 8px; }.room-header p:not(.eyebrow) { color: var(--muted); }.room-header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .classroom-scene { min-height: 235px; display: grid; grid-template-columns: 1fr auto; position: relative; overflow: hidden; border: 3px solid #9f957a; border-radius: 16px; background: #eadab4; box-shadow: 0 6px 0 #d4c39c; margin-bottom: 22px; }
  .classroom-wall { position: relative; min-height: 235px; background: repeating-linear-gradient(0deg, #ebddbd 0 40px, #e0d0ae 41px 43px); padding: 24px; }
  .chalkboard { position: absolute; top: 25px; left: 25%; width: 52%; height: 145px; box-sizing: border-box; background: #35624c; border: 9px solid #9b6c45; border-radius: 5px; box-shadow: inset 0 0 0 2px #234a38; color: #f4edcf; padding: 17px; }
  .chalkboard-heading { font: 900 clamp(.8rem, 1.4vw, 1.1rem) ui-monospace, monospace; text-align: center; letter-spacing: .08em; }.chalkboard-small { color: #cce3c0; font-size: .78rem; text-align: center; margin-top: 12px; }.chalk-marks { display: flex; gap: 10px; margin-top: 18px; }.chalk-marks span { height: 4px; background: #d2e3c8; border-radius: 9px; flex: 1; opacity: .7; }.teacher-desk { position: absolute; bottom: 13px; left: 20%; width: 66%; height: 21px; background: #a36f46; border: 4px solid #805838; border-radius: 4px; }
  .classroom-clock { position: absolute; left: 34px; top: 20px; border: 3px solid #9b8056; background: #fff6df; border-radius: 50%; width: 48px; height: 48px; display: grid; place-items: center; font-size: .74rem; font-weight: 900; }.classroom-window { position: absolute; right: 15px; top: 24px; width: 82px; height: 88px; border: 6px solid #986f4e; background: #a8d9db; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }.classroom-window span { border: 2px solid #fff0ca; }
  .teacher-character { position: relative; z-index: 2; width: 148px; display: flex; align-items: center; justify-content: flex-end; flex-direction: column; background: #dfc99f; border-left: 3px solid #aa9a77; padding: 4px 7px 8px; box-sizing: border-box; }.teacher-guide { display: block; width: 100%; height: 190px; object-fit: contain; object-position: center bottom; animation: teacher-bob 5s ease-in-out infinite; }.teacher-label { background: #fff7dd; border: 1px solid #c9b88f; border-radius: 8px; padding: 5px 8px; font-size: .75rem; font-weight: 900; margin-top: -2px; }.classroom-students { position: absolute; z-index: 1; bottom: -2px; left: 6px; display: block; width: min(44%, 380px); height: 160px; object-fit: contain; object-position: left bottom; pointer-events: none; filter: drop-shadow(0 4px 3px #66543a22); }
  .theory-progress, .session-progress { display: flex; align-items: center; gap: 15px; justify-content: space-between; background: #e8eddd; padding: 11px 14px; border: 1px solid #c8d7bc; border-radius: 11px; margin-bottom: 15px; }.theory-progress > div:first-child { display: grid; gap: 4px; }.theory-progress .eyebrow { margin: 0; }.theory-progress strong, .session-progress strong { white-space: nowrap; font-size: .88rem; }.progress-track { flex: 1; height: 10px; overflow: hidden; border-radius: 99px; background: #d3d9c8; border: 1px solid #bdc7b2; }.progress-track i { display: block; height: 100%; background: linear-gradient(90deg, #5a9a67, #dfbf63); border-radius: inherit; transition: width .2s ease; }
  .lesson-slide { min-height: 390px; }.slide-topline { margin-bottom: 23px; }.lesson-copy { max-width: 920px; }.lesson-copy h2 { font-family: Georgia, serif; }.lesson-body { color: #46594a; font-size: 1.1rem; line-height: 1.8; white-space: pre-line; max-width: 870px; }.lesson-visual { background: #eef2df; border: 1px solid #ccd8b7; padding: 18px; border-radius: 12px; margin: 18px 0; overflow-x: auto; }.lesson-visual :global(.measure-cards), .lesson-visual :global(.example-strip), .lesson-visual :global(.example-strip), .lesson-visual :global(.measure-cards) { display: flex; flex-wrap: wrap; gap: 10px; }.lesson-visual :global(.measure-cards span), .lesson-visual :global(.example-strip span) { background: #fffdf0; border: 1px solid #c9d1b8; border-radius: 8px; padding: 12px; font-weight: 800; }.lesson-visual :global(.measure-cards b) { display: block; margin-top: 5px; }.lesson-visual :global(.conversion-equation), .lesson-visual :global(.equal-visual), .lesson-visual :global(.direction-visual) { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; justify-content: center; font-size: 1.3rem; }.lesson-visual :global(.number-line) { display: flex; gap: 6px; flex-wrap: wrap; }.lesson-visual :global(.number-line span) { padding: 10px 13px; border-radius: 7px; background: white; border: 1px solid #c3cdb6; font-weight: 900; }.lesson-visual :global(.number-line .active) { background: #f3d67e; border-color: #b99542; }.lesson-visual :global(.time-blocks) { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 13px; font-size: 1.15rem; }.lesson-visual :global(.time-blocks span), .lesson-visual :global(.time-blocks strong) { padding: 10px 14px; background: #fffef5; border: 1px solid #d2c39d; border-radius: 8px; }.conversion-table-card { padding: 16px; background: #f1f2df; border: 1px solid #c9d5b5; border-radius: 12px; margin: 20px 0; }.conversion-table-card h3 { margin-bottom: 6px; }.conversion-table-card > p { line-height: 1.6; color: #50604f; }.unit-table { border-collapse: collapse; width: 100%; margin: 14px 0; table-layout: fixed; }.unit-table th, .unit-table td { border: 2px solid #b4bd9f; text-align: center; padding: 11px 2px; }.unit-table th { background: #dce8c8; }.unit-table td { background: #fffdf0; font-weight: 900; font-size: 1.25rem; }.unit-table td.highlight-unit { background: #f4d984; border-color: #bd9947; }.table-steps { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }.table-steps span { display: flex; align-items: center; gap: 9px; padding: 9px; border-radius: 8px; background: #fffdf2; line-height: 1.4; }.table-steps b { display: inline-grid; min-width: 26px; height: 26px; place-items: center; background: #477b52; color: white; border-radius: 50%; }
  .concrete-example { display: flex; align-items: flex-start; gap: 13px; margin-top: 19px; padding: 13px 15px; border: 1px dashed #d3ba75; border-radius: 10px; background: #fff5d4; color: #51492d; }.example-icon { font-size: 1.6rem; }.concrete-example strong { color: #6a5527; }.concrete-example p { margin: 4px 0 0; line-height: 1.55; }
  .teacher-speech { margin-top: 22px; display: grid; grid-template-columns: auto 1fr; gap: 7px 13px; padding: 14px; border-radius: 12px; border: 1px solid #c5d4be; background: #e9f0df; align-items: center; }.teacher-portrait { grid-row: span 2; display: grid; place-items: center; width: 56px; height: 56px; border: 2px solid #b6c8a8; border-radius: 12px; background: #fff9e8; font-size: 2rem; }.teacher-speech strong { align-self: end; color: #315b3d; }.teacher-speech p { align-self: start; margin: 0; color: #566a56; line-height: 1.5; }.teacher-speech button { grid-column: 2; justify-self: start; margin-top: 6px; }.checkpoint-copy { max-width: 820px; margin: auto; padding: 15px 0; }.checkpoint-copy h2 { font-family: Georgia, serif; margin-bottom: 20px; }.checkpoint-copy > p:not(.eyebrow) { color: var(--muted); line-height: 1.6; }.answer-options { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; margin: 20px 0; }.answer-option { min-height: 62px; padding: 12px; border: 2px solid #c5b99c; border-radius: 12px; background: #fffdf4; color: #354c39; font-weight: 850; text-align: center; line-height: 1.4; }.answer-option:hover:not(:disabled) { border-color: #6b9e72; background: #f1f6e4; }.option-selected { border-color: #3a7e52 !important; background: #ddefd5 !important; box-shadow: inset 0 0 0 1px #3a7e52; }.feedback-box { margin: 16px 0; border: 1px solid #cbbd98; border-radius: 11px; padding: 13px 15px; background: #fff6d9; color: #51452b; }.feedback-box strong { display: block; margin-bottom: 4px; }.feedback-box p { margin: 0; line-height: 1.65; white-space: pre-line; }.feedback-box.success { background: #e4f2df; border-color: #b3d3aa; color: #2b613d; }.feedback-box.hint { background: #e9f1e0; border-color: #b8ceab; color: #3d5c3f; }.feedback-box.worked { background: #f3e6d4; border-color: #d2b288; color: #634a2b; }.feedback-box.notice { background: #fff3ce; border-color: #dfca7a; color: #665323; }.slide-actions { justify-content: flex-start; flex-wrap: wrap; margin-top: 19px; }.slide-actions .text-button { margin-left: auto; }
  .room-dashboard { background: #fbf8ee; border: 2px solid #d8d0b9; border-radius: 20px; padding: clamp(18px, 3vw, 34px); box-shadow: 0 8px 0 #d2c9ad; }.room-dashboard-heading { max-width: 830px; }.room-dashboard-heading h2 { font-family: Georgia, serif; }.room-dashboard-heading p:not(.eyebrow) { line-height: 1.65; color: var(--muted); }.activity-choice-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 25px; }.activity-choice { display: flex; flex-direction: column; align-items: flex-start; background: #fffdf4; border: 2px solid #d8ceaf; border-radius: 15px; padding: 15px; box-shadow: 0 4px 0 #d5c8a8; }.activity-choice h3 { font-family: Georgia, serif; font-size: 1.3rem; margin-bottom: 10px; }.activity-choice p:not(.eyebrow) { color: #5d6a5b; font-size: .92rem; line-height: 1.6; }.activity-choice .primary-button { width: 100%; margin-top: auto; }.activity-choice .eyebrow { margin-top: 17px; margin-bottom: 8px; }.activity-art { width: 100%; height: 105px; border-radius: 10px; overflow: hidden; background: #e6edd7; }.activity-art > img { width: 100%; height: 100%; display: block; object-fit: cover; }.exam-choice { border-color: #d1b465; background: #fffbeb; }.status-pill { display: inline-block; margin-top: 10px; border-radius: 999px; padding: 5px 8px; background: #e2f0dd; color: #366b42; font-size: .77rem; font-weight: 900; }.room-bottom-actions { margin-top: 24px; flex-wrap: wrap; justify-content: flex-start; }.result-slide { display: grid; grid-template-columns: 90px 1fr; gap: 24px; align-items: start; }.result-icon { display: grid; place-items: center; width: 88px; height: 88px; background: #f7e4a8; border: 2px solid #d7bd69; border-radius: 18px; font-size: 3rem; }.score-line { font-size: 1.15rem; }.score-line strong { font-size: 1.5rem; color: #34734c; }
  .battle-card-prompt { background: #eef1de; border: 1px solid #c8d3b8; border-radius: 12px; padding: 14px; display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; align-items: center; }.card-symbol { grid-row: span 2; font-size: 2.4rem; }.answer-cards .answer-option { min-height: 115px; background: #fffdf1; border: 3px solid #c4af7e; box-shadow: 0 5px #d8c59b; font-family: Georgia, serif; font-size: 1.15rem; }.answer-cards .answer-option:nth-child(2) { transform: translateY(-7px); }.answer-cards .answer-option:nth-child(3) { transform: rotate(1deg); }.answer-cards .option-selected { transform: translateY(-8px); }
  .question-slide h2 { max-width: 900px; }.question-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 12px; color: var(--muted); font-size: .86rem; }.question-tools span { line-height: 1.4; }.session-progress { margin-bottom: 14px; }.standalone-session-page .slide-card { max-width: 950px; margin: 0 auto; }.standalone-session-page .session-progress { max-width: 950px; margin: 20px auto 14px; }.standalone-session-page .answer-input { margin: 12px 0; }.family-result-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin: 15px 0 22px; }.family-result-grid > div { background: #eef1de; border: 1px solid #d0d8be; border-radius: 8px; padding: 11px; display: flex; justify-content: space-between; gap: 8px; }.howto-slide { min-height: 310px; display: grid; grid-template-columns: 130px 1fr; gap: 35px; align-items: center; margin-top: 20px; }.howto-number { display: grid; place-items: center; width: 130px; height: 130px; border-radius: 24px; background: #e2eaca; border: 3px solid #b3c79f; color: #4a7e55; font: 900 3.6rem Georgia, serif; box-shadow: 0 6px 0 #c4d1b0; }.howto-slide .slide-actions { margin-top: 25px; }.game-footer { max-width: 1250px; padding: 24px 22px 0; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap; color: #79816f; font-size: .78rem; }.display-tools { display: flex; flex-wrap: wrap; gap: 12px; }.display-tools label { display: inline-flex; gap: 5px; align-items: center; }.xp-toast { position: fixed; z-index: 80; right: 18px; bottom: 18px; display: flex; gap: 14px; align-items: center; padding: 14px 16px; border: 2px solid #1b6040; border-radius: 12px; background: #347c54; color: white; font-weight: 850; box-shadow: 0 7px 0 #214e37; max-width: min(520px, calc(100vw - 36px)); }
  @media (max-width: 1050px) { .village-selection-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }.mesurovia-catalog-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }.welcome-layout { grid-template-columns: 1fr; }.welcome-art { min-height: 390px; }.welcome-copy { max-width: 800px; }.activity-choice-grid { grid-template-columns: 1fr 1fr; }.game-header { grid-template-columns: 1fr auto; }.header-player { grid-column: 1 / -1; grid-row: 2; justify-content: flex-start; }.header-menu-wrap { grid-column: 2; grid-row: 1; } }
  @media (max-width: 680px) { .game-header { padding: 9px 12px; gap: 8px; }.brand-button strong { font-size: .92rem; }.brand-icon { width: 37px; height: 37px; }.player-chip, .xp-chip, .crest-chip { font-size: .72rem; padding: 6px 8px; }.menu-toggle { padding: 9px 10px; }.welcome-layout { padding: 22px 14px 40px; }.welcome-art { min-height: 300px; }.welcome-copy h1 { font-size: 2.4rem; }.mesurovia-catalog-page { padding:18px 12px 36px; }.mesurovia-catalog-grid { grid-template-columns:1fr; }.character-slide { grid-template-columns: 1fr; }.slide-illustration { min-height: 110px; }.avatar-big { font-size: 4.5rem; }.village-selection-grid { grid-template-columns: 1fr; }.village-choice-card { min-height: auto; }.village-card-art { height: 75px; }.village-topbar, .room-header { display: block; }.village-side-panel { margin-top: 15px; grid-template-columns: 1fr 1fr; }.village-side-panel button { grid-column: span 2; }.map-instructions { align-items: flex-start; flex-wrap: wrap; }.map-instructions .text-button { margin-left: 41px; }.pixel-map-frame { border-width: 3px; border-radius: 10px; }.building-label { font-size: 13px; }.building-number { font-size: 17px; }.classroom-scene { min-height: 160px; grid-template-columns: 1fr 90px; }.classroom-wall { min-height: 160px; padding: 10px; }.chalkboard { left: 20%; top: 20px; width: 62%; height: 105px; border-width: 6px; padding: 10px 4px; }.chalkboard-small { font-size: .6rem; margin-top: 7px; }.chalk-marks { margin-top: 12px; }.classroom-clock { display: none; }.classroom-window { width: 43px; height: 53px; right: 2px; top: 10px; border-width: 3px; }.teacher-character { width: 90px; }.teacher-label { font-size: .58rem; padding: 4px; }.theory-progress, .session-progress { flex-wrap: wrap; gap: 9px; }.theory-progress .progress-track, .session-progress .progress-track { flex-basis: 100%; }.slide-card { padding: 19px; border-radius: 14px; }.slide-topline { align-items: flex-start; flex-wrap: wrap; }.answer-options { grid-template-columns: 1fr; gap: 8px; }.answer-option { min-height: 50px; }.table-steps { grid-template-columns: 1fr; }.unit-table th, .unit-table td { font-size: .77rem; padding: 8px 1px; }.activity-choice-grid { grid-template-columns: 1fr; }.result-slide { grid-template-columns: 1fr; }.result-icon { width: 62px; height: 62px; font-size: 2.2rem; }.howto-slide { grid-template-columns: 1fr; gap: 20px; }.howto-number { width: 75px; height: 75px; font-size: 2.3rem; }.family-result-grid { grid-template-columns: 1fr; }.display-tools { width: 100%; }.game-footer { padding-left: 14px; padding-right: 14px; }.room-header-actions { margin-top: 10px; }.slide-actions .text-button { margin-left: 0; } }

  /* V3 — mini-jeux animés, interactifs et sobres en ressources. */
  .mini-game-stage { display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:16px; margin:8px 0 22px; padding:15px; min-height:108px; border:3px solid #334d3d; border-radius:12px; background:linear-gradient(135deg,#dceac8,#f5e9ba); box-shadow:inset 0 -5px #c6d4b6, 0 4px #b2b99a; }
  .race-stage { display:block; padding:clamp(13px,2.4vw,22px); background:linear-gradient(145deg,#d9f0d0,#f9e5a9); }
  .race-lanes { display:grid; gap:18px; width:100%; }
  .race-lane { display:grid; grid-template-columns:100px minmax(0,1fr) 34px; align-items:center; gap:10px; }
  .race-lane > strong { color:#354a38; font-size:.9rem; white-space:nowrap; }
  .race-track { position:relative; height:20px; overflow:visible; border:2px solid #6f805a; border-radius:999px; background:repeating-linear-gradient(90deg,#fff9de 0 9%,#e8edcf 9% 10%); box-shadow:inset 0 2px 4px #51654025; }
  .race-track::before { position:absolute; inset:0; content:''; border-radius:inherit; background:repeating-linear-gradient(90deg,transparent 0 calc(10% - 1px),#87936d 10%); pointer-events:none; }
  .race-track > i { position:absolute; inset:0 auto 0 0; display:block; border-radius:inherit; transition:width .42s cubic-bezier(.2,.75,.3,1); }
  .player-track-fill { background:linear-gradient(90deg,#80bd68,#b6d96f); }
  .rival-track-fill { background:linear-gradient(90deg,#d99068,#e5b272); }
  .race-runner { position:absolute; z-index:1; top:50%; display:grid; place-items:center; width:34px; height:34px; border:2px solid #526344; border-radius:50%; background:#fff8de; font-size:1.45rem; line-height:1; transform:translate(-50%,-50%); transition:left .42s cubic-bezier(.2,.75,.3,1); }
  .player-runner { box-shadow:0 2px #93b780; }
  .rival-runner { background:#ffe8cd; border-color:#98664d; }
  .race-stage.race-move .player-runner { animation:v3-race-hop .42s ease-out; }
  .race-turn-message { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:18px; padding:10px 13px; border:2px dashed #a99a62; border-radius:10px; background:#fff9e4; color:#3d513c; }
  .race-turn-message strong { font-size:.94rem; }
  .race-turn-message small { color:#637052; text-align:right; }
  @keyframes v3-race-hop { 0%,100% { transform:translate(-50%,-50%); } 45% { transform:translate(-50%,-85%) rotate(-8deg); } }
  .mini-game-stage strong { font-weight:950; }.mini-game-stage p { margin:5px 0 0; line-height:1.45; color:#415847; }.fighter { display:flex; min-width:100px; flex-direction:column; align-items:center; gap:3px; text-align:center; }.fighter-sprite { display:grid; place-items:center; width:68px; height:68px; border:3px solid #475f45; border-radius:10px; background:#fff8e3; font-size:2.6rem; image-rendering:pixelated; }.player-fighter .fighter-sprite { box-shadow:inset 0 -5px #d4e7c4, 0 4px #a6b794; }.enemy-fighter .fighter-sprite { background:#f1d7bd; border-color:#84594b; box-shadow:inset 0 -5px #d9ae91, 0 4px #b98568; }.health-track { width:88px; height:10px; margin-top:3px; overflow:hidden; border:2px solid #38463d; border-radius:2px; background:#f0ebe0; }.health-track i { display:block; height:100%; background:#57a85d; transition:width .3s ease; }.enemy-health i { background:#cc6555; }.fighter small { font-size:.74rem; color:#4d604f; }.battle-middle { display:flex; flex-direction:column; align-items:center; gap:5px; text-align:center; }.battle-spark { font-size:2.4rem; filter:drop-shadow(2px 3px #d3b477); }.battle-middle small { font-size:.85rem; }.battle-stage.player-attack .player-fighter .fighter-sprite { animation:v3-hero-strike .48s ease-in-out; }.battle-stage.player-attack .enemy-fighter .fighter-sprite { animation:v3-enemy-hit .42s ease-in-out; }.battle-stage.enemy-attack .enemy-fighter .fighter-sprite { animation:v3-enemy-strike .42s ease-in-out; }.battle-stage.enemy-attack .player-fighter .fighter-sprite { animation:v3-hero-hit .42s ease-in-out; }.battle-stage.player-attack .battle-spark { animation:v3-spark .45s ease-out; }.game-success { animation:v3-success-pulse .45s ease-out; }.game-miss { animation:v3-nudge .22s ease-in-out; }.battle-card-prompt { display:flex; align-items:center; gap:12px; background:#f7ecd1; border:2px dashed #b4a477; padding:12px; margin:12px 0; border-radius:10px; }.card-symbol { font-size:2rem; }.battle-card-prompt strong { display:block; }.answer-options.answer-cards .answer-option { min-height:104px; border-width:3px; box-shadow:0 5px #c9bd9e; font-size:1.1rem; }.answer-options.answer-cards .answer-option:active:not(:disabled) { transform:translateY(3px); box-shadow:0 2px #c9bd9e; }.game-answer-cards .answer-option { position:relative; }.option-mark { display:block; margin-bottom:5px; font-size:1.35rem; }.table-game-stage { background:linear-gradient(120deg,#e1f2ce,#f8edc8); }.treasure-chest { font-size:3.1rem; filter:drop-shadow(2px 4px #baa06c); }.interactive-table-card { margin:15px 0; padding:15px; border:3px solid #829875; border-radius:12px; background:#f8f5e8; }.interactive-table-card .unit-table { min-width: min(600px,100%); }.table-cell-input { box-sizing:border-box; width:100%; min-width:38px; padding:6px 1px; border:0; border-radius:5px; background:transparent; color:#76531b; text-align:center; font-weight:950; outline-offset:2px; }.table-cell-input::placeholder { color:#8b6b35; opacity:1; }.unit-table th.source-unit { background:#d8e5b6; border-color:#72905e; }.unit-table th.target-unit { background:#f6d98d; border-color:#b48537; }.unit-table td.source-cell { background:#e7efd0; color:#294c2b; font-weight:950; }.unit-table td.target-cell { background:#ffe8a8; color:#76531b; font-weight:950; outline:2px solid #c08c36; outline-offset:-3px; }.interactive-table-card p { margin:10px 0 0; text-align:center; }.detective-stage { background:linear-gradient(120deg,#dce8f1,#f5e6c5); }.detective-character { font-size:3.2rem; filter:drop-shadow(2px 3px #b3b7a3); }.evidence-stamp { display:grid; place-items:center; width:40px; height:40px; border:3px solid #a6634e; border-radius:50%; color:#a6634e; font-size:1.7rem; font-weight:950; transform:rotate(10deg); }.game-success .evidence-stamp { border-color:#2d8750; color:#2d8750; animation:v3-stamp .4s ease-out; }.clock-face { font-size:3rem; }.clock-gear { font-size:2.6rem; animation:v3-gear-spin 5s linear infinite; }.builder-progress { display:flex; flex-wrap:wrap; gap:4px; }.building-progress { display:grid; grid-template-columns:repeat(2,38px); gap:3px; font-size:1.7rem; }.building-progress span { display:grid; place-items:center; width:37px; height:34px; border-radius:4px; background:#e5e6d7; }.building-progress .piece-built { background:#f2d48d; animation:v3-block-pop .35s ease-out; }.number-pad { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:7px; width:min(360px,100%); margin:12px auto 4px; }.number-pad button { min-height:48px; border:2px solid #9cae91; border-radius:8px; background:#fffdf2; color:#28442e; box-shadow:0 3px #c4ceb9; font-weight:950; font-size:1.12rem; touch-action:manipulation; }.number-pad button:active:not(:disabled) { transform:translateY(2px); box-shadow:0 1px #c4ceb9; }.number-pad .utility-key { background:#e1ead5; }.matching-game { display:grid; grid-template-columns:1fr 1fr; gap:13px; margin:17px 0; }.matching-column { display:flex; flex-direction:column; gap:8px; min-width:0; }.matching-column h3 { margin:0 0 3px; font-size:1rem; }.match-tile { display:flex; justify-content:space-between; align-items:center; gap:8px; min-height:56px; padding:9px 11px; border:2px solid #b7c6a8; border-radius:9px; background:#f9f5e6; text-align:left; font-weight:900; }.match-tile small { color:#657361; font-size:.7rem; }.match-tile.match-picked { outline:3px solid #d2a447; background:#fff0bd; }.match-tile.match-filled,.match-tile.match-used { background:#dcebd2; border-color:#6c9d67; }.right-match-tile:disabled { opacity:.7; }.order-game-list { display:grid; gap:9px; margin:17px auto; max-width:540px; }.order-item { display:grid; grid-template-columns:35px 1fr auto; align-items:center; gap:10px; padding:9px; border:2px solid #d0c5a8; border-radius:10px; background:#fff9e9; animation:v3-float-in .18s ease-out; }.order-position { display:grid; place-items:center; width:30px; height:30px; border-radius:7px; background:#e2ecd2; font-weight:950; }.order-item strong { font-size:1.1rem; }.order-item > div { display:flex; gap:5px; }.order-move { width:38px; height:38px; border:2px solid #a9b99d; border-radius:8px; background:#f2f5e8; font-size:1.25rem; font-weight:950; }.multi-check { margin-right:9px; font-size:1.25rem; }.multi-answer-options { grid-template-columns:repeat(2,minmax(0,1fr)); }
  @keyframes v3-hero-strike { 0%,100% { transform:translateX(0) rotate(0); } 45% { transform:translateX(24px) rotate(9deg); } }
  @keyframes v3-enemy-hit { 0%,100% { transform:translateX(0); } 35% { transform:translateX(12px) rotate(8deg); } 70% { transform:translateX(-5px) rotate(-5deg); } }
  @keyframes v3-enemy-strike { 0%,100% { transform:translateX(0); } 45% { transform:translateX(-18px) rotate(-7deg); } }
  @keyframes v3-hero-hit { 0%,100% { transform:translateX(0); } 40% { transform:translateX(-10px); filter:grayscale(.6); } }
  @keyframes v3-spark { 0% { transform:scale(.2) rotate(-15deg); opacity:0; } 70% { transform:scale(1.5) rotate(8deg); opacity:1; } 100% { transform:scale(1); opacity:1; } }
  @keyframes v3-success-pulse { 0% { transform:scale(.99); } 45% { transform:scale(1.015); } 100% { transform:scale(1); } }
  @keyframes v3-nudge { 0%,100% { transform:translateX(0); } 30%,70% { transform:translateX(-3px); } 50% { transform:translateX(3px); } }
  @keyframes v3-stamp { from { transform:scale(1.4) rotate(-12deg); opacity:.3; } to { transform:scale(1) rotate(10deg); opacity:1; } }
  @keyframes v3-gear-spin { to { transform:rotate(360deg); } }
  @keyframes v3-block-pop { from { transform:translateY(-8px) scale(.75); opacity:.2; } to { transform:translateY(0) scale(1); opacity:1; } }
  @keyframes v3-float-in { from { transform:translateY(4px); opacity:.4; } to { transform:translateY(0); opacity:1; } }
  @media (prefers-reduced-motion: reduce) { .mesurovia-shell *, .mesurovia-shell *::before, .mesurovia-shell *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }

  @media (max-width: 680px) { .mini-game-stage { grid-template-columns:1fr; justify-items:center; text-align:center; gap:8px; }.race-stage { text-align:left; }.race-lane { grid-template-columns:72px minmax(0,1fr) 26px; gap:6px; }.race-lane > strong { font-size:.75rem; }.race-track { height:16px; }.race-runner { width:29px; height:29px; font-size:1.2rem; }.race-turn-message { align-items:flex-start; flex-direction:column; }.race-turn-message small { text-align:left; }.matching-game { grid-template-columns:1fr; }.matching-column { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); }.matching-column h3 { grid-column:1/-1; }.multi-answer-options { grid-template-columns:1fr; }.table-cell-input { min-width:30px; font-size:.82rem; } }
  @media print { .game-header, .game-footer, .room-header-actions, .slide-actions, .question-tools, .map-footer, .map-instructions { display: none !important; }.mesurovia-shell { background: white; }.slide-card { box-shadow: none; border: 1px solid #999; break-inside: avoid; } }

  .memory-game-panel { max-width: 970px; margin: 16px auto 22px; padding: clamp(16px, 3vw, 28px); border: 3px solid #73875d; border-radius: 18px; background: linear-gradient(145deg, #fff9e5, #e5eed7); box-shadow: 0 7px 0 #c7d1b3; }
  .memory-game-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:18px; margin-bottom:20px; }
  .memory-game-heading h2 { margin:5px 0; font-family:Georgia,serif; font-size:clamp(1.55rem,3vw,2.2rem); }
  .memory-game-heading p:not(.eyebrow) { margin:0; color:#56654f; line-height:1.5; }
  .memory-scoreboard { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:8px; }
  .memory-scoreboard span { padding:9px 12px; border:2px solid #c6b36c; border-radius:999px; background:#fff2bd; font-weight:900; white-space:nowrap; }
  .memory-board { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:clamp(8px,1.6vw,15px); max-width:760px; margin:0 auto; }
  .memory-card { position:relative; aspect-ratio:1.55; min-width:0; padding:0; border:0; border-radius:12px; background:transparent; perspective:700px; cursor:pointer; touch-action:manipulation; }
  .memory-card-inner { position:absolute; inset:0; display:block; transform-style:preserve-3d; transition:transform .38s cubic-bezier(.2,.75,.3,1); }
  .memory-card.face-up .memory-card-inner { transform:rotateY(180deg); }
  .memory-card-back, .memory-card-front { position:absolute; inset:0; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:5px; padding:8px; border:3px solid #617a5b; border-radius:12px; backface-visibility:hidden; -webkit-backface-visibility:hidden; box-shadow:0 5px #b5c3a7; }
  .memory-card-back { color:#fff8df; background:repeating-linear-gradient(135deg,#4e805f 0 9px,#5b9169 9px 18px); }
  .memory-card-front { transform:rotateY(180deg); color:#314c39; background:linear-gradient(145deg,#fffef5,#f4e5b7); border-color:#b4954f; text-align:center; }
  .memory-card-front b { font-size:clamp(.78rem,1.7vw,1.2rem); overflow-wrap:anywhere; }
  .memory-card-front small { color:#6a7259; font-size:clamp(.55rem,1vw,.72rem); }
  .memory-card.matched .memory-card-front { border-color:#4c9b63; background:linear-gradient(145deg,#eff9db,#d1edc5); box-shadow:0 5px #9cc795; }
  .memory-card.matched .memory-card-inner { animation:v3-memory-match .42s ease-out; }
  .memory-card.card-miss { animation:v3-nudge .22s ease-in-out; }
  .memory-card:focus-visible { outline:4px solid #d29f3e; outline-offset:3px; }
  .card-type-label { display:block; align-self:flex-end; margin-bottom:4px; color:#8a724a; font-size:.62rem; font-weight:950; letter-spacing:.1em; }
  .memory-footer { display:flex; align-items:center; justify-content:space-between; gap:14px; min-height:48px; margin-top:14px; color:#435b45; font-weight:850; }
  @keyframes v3-memory-match { 0% { transform:scale(.94); } 55% { transform:scale(1.07) rotate(2deg); } 100% { transform:scale(1); } }
  @media (max-width:680px) { .memory-game-heading { align-items:flex-start; flex-direction:column; }.memory-scoreboard { justify-content:flex-start; }.memory-board { grid-template-columns:repeat(3,minmax(0,1fr)); }.memory-card { aspect-ratio:1.2; }.memory-card-front { padding:4px; }.memory-footer { align-items:flex-start; flex-direction:column; } }
  @media (prefers-reduced-motion: reduce) { .memory-card-inner, .memory-card.matched .memory-card-inner { transition:none; animation:none; } }
  .teacher-portrait { overflow: hidden; }
  .teacher-portrait img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center 15%; }
  @keyframes welcome-twinkle { 0%, 100% { transform: translateY(0) scale(1); opacity: .82; } 50% { transform: translateY(-5px) scale(1.08); opacity: 1; } }
  @keyframes teacher-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  @keyframes river-glide { to { stroke-dashoffset: -84; } }
  @keyframes canopy-sway { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(1.5deg); } }
  @keyframes flower-sway { 0%, 100% { translate: 0 0; } 50% { translate: 0 -1px; } }
  @keyframes villager-bob { 0%, 100% { translate: 0 0; } 50% { translate: 0 -2px; } }
  @keyframes player-bob { 0%, 100% { translate: 0 0; } 50% { translate: 0 -2px; } }
  @keyframes map-glimmer { 0%, 100% { opacity: .22; scale: .65; } 50% { opacity: .9; scale: 1.2; } }
  .result-icon { animation: v3-float-in .45s ease-out; }
  @media (max-width: 1050px) { .village-topbar { grid-template-columns: minmax(0, 1fr) minmax(150px, 220px); }.village-side-panel { grid-column: 1 / -1; grid-template-columns: repeat(4, minmax(0, 1fr)); align-items: center; } }
  @media (max-width: 680px) { .village-region-art { height: 145px; margin: 12px 0 14px; }.village-side-panel { grid-template-columns: 1fr 1fr; }.classroom-students { width: min(62%, 280px); height: 110px; } }
  @media (max-width: 680px) { .teacher-guide { height: 128px; } }
  .treasure-chest { width: 76px; height: 76px; }
  .detective-character { width: 70px; height: 70px; }
  .clock-face { display: block; width: 78px; height: 78px; }
  .building-progress > span { padding: 2px; }
</style>
