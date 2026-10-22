<script>
  import { base } from '$app/paths';
  import { onDestroy } from 'svelte';

  /*
   * SHIFT — Atelier des quantités
   * -------------------------------------------------------------------------
   * Refonte en un seul composant Svelte, sans dépendance supplémentaire et sans
   * sauvegarde persistante. Les valeurs sont calculées en millièmes (ticks) :
   * cela évite les erreurs habituelles des nombres décimaux en JavaScript.
   * Les interactions se font avec des boutons et des champs natifs, adaptés à
   * la souris, au clavier et au tactile. Aucun glisser-déposer n'est requis.
   */

  const PLACE_VALUES = [
    { key: 'hundredBillion', label: 'Centaines de milliards', short: 'C Md', exp: 11, symbol: '▦' },
    { key: 'tenBillion', label: 'Dizaines de milliards', short: 'D Md', exp: 10, symbol: '▦' },
    { key: 'billion', label: 'Milliards', short: 'Md', exp: 9, symbol: '▦' },
    { key: 'hundredMillion', label: 'Centaines de millions', short: 'C Mio', exp: 8, symbol: '▦' },
    { key: 'tenMillion', label: 'Dizaines de millions', short: 'D Mio', exp: 7, symbol: '▦' },
    { key: 'million', label: 'Millions', short: 'Mio', exp: 6, symbol: '▦' },
    { key: 'hundredThousand', label: 'Centaines de milliers', short: 'C milliers', exp: 5, symbol: '▦' },
    { key: 'tenThousand', label: 'Dizaines de milliers', short: 'D milliers', exp: 4, symbol: '▦' },
    { key: 'thousand', label: 'Milliers', short: 'M', exp: 3, symbol: '▦' },
    { key: 'hundred', label: 'Centaines', short: 'C', exp: 2, symbol: '▦' },
    { key: 'ten', label: 'Dizaines', short: 'D', exp: 1, symbol: '▦' },
    { key: 'unit', label: 'Unités', short: 'U', exp: 0, symbol: '▪' },
    { key: 'tenth', label: 'Dixièmes', short: 'dixièmes', exp: -1, symbol: '◌' },
    { key: 'hundredth', label: 'Centièmes', short: 'centièmes', exp: -2, symbol: '◌' },
    { key: 'thousandth', label: 'Millièmes', short: 'millièmes', exp: -3, symbol: '◌' }
  ];
  const TICK_WEIGHT = Object.fromEntries(PLACE_VALUES.map((place) => [place.key, Math.pow(10, place.exp + 3)]));
  const PLACE_BY_KEY = Object.fromEntries(PLACE_VALUES.map((place) => [place.key, place]));
  const LINE_TICKS = Array.from({ length: 21 }, (_, index) => index * 5);
  // Petits tableaux réutilisés par les représentations en base 10 du tapis.
  // Dix cases représentent un groupe de dix ; cent cases représentent une centaine.
  const TEN_BLOCKS = Array.from({ length: 10 }, (_, index) => index);
  const HUNDRED_BLOCKS = Array.from({ length: 100 }, (_, index) => index);

  const DIFFICULTIES = [
    { id: 'starter', name: 'Réactivation', range: 'Jusqu’à 999', maxInteger: 999, minTicks: 1000, maxTicks: 999000 },
    { id: 'workshop', name: 'Atelier', range: 'Jusqu’à 9’999', maxInteger: 9999, minTicks: 1000, maxTicks: 9999000 },
    { id: 'decimal', name: 'Décimaux', range: 'Jusqu’à 9’999,999', maxInteger: 9999, minTicks: 1, maxTicks: 9999999 },
    { id: 'expedition', name: 'Grande expédition', range: 'Jusqu’à 999’999’999’999', maxInteger: 999999999999, minTicks: 1, maxTicks: 999999999999999 }
  ];

  const MISSIONS = [
    {
      id: 'factory', number: '01', section: 'Les fondamentaux', icon: '▦', title: 'La fabrique des nombres',
      subtitle: 'Récupère, échange et livre la bonne quantité.',
      description: 'Comprendre pourquoi 10 unités font 1 dizaine, et pourquoi la valeur reste la même après un échange.',
      skills: 'Composer · Décomposer · Échanger par 10', theme: 'mint'
    },
    {
      id: 'measure', number: '02', section: 'Dans la vraie vie', icon: '↔', title: 'Le convertisseur',
      subtitle: 'Fais passer les mesures d’une unité à l’autre.',
      description: 'Longueurs, masses, capacités, surfaces, volumes et durées : choisis la bonne unité et le bon facteur.',
      skills: 'Longueur · masse · capacité · surface · volume · durée · équivalences m³/L', theme: 'blue'
    },
    {
      id: 'words', number: '03', section: 'Le scanner', icon: 'Aa', title: 'Le scanner de nombres',
      subtitle: 'Passe de l’écriture en chiffres aux mots-nombres.',
      description: 'Lis, écris et vérifie des nombres, du nombre familier aux très grandes quantités.',
      skills: 'Écriture chiffrée ↔ mot-nombre', theme: 'amber'
    },
    {
      id: 'decompose', number: '04', section: 'Le labo', icon: '▤', title: 'Le labo des rangs',
      subtitle: 'Découpe un nombre rang par rang.',
      description: 'Repère le chiffre des milliards, des unités, des dixièmes ou des millièmes.',
      skills: 'Valeur de position · Zéros · Décomposition', theme: 'violet'
    },
    {
      id: 'sort', number: '05', section: 'Le centre de tri', icon: '⇅', title: 'Le centre de tri',
      subtitle: 'Range les colis du plus petit au plus grand.',
      description: 'Compare, ordonne et repère les nombres qui se ressemblent sans avoir la même valeur.',
      skills: '< · > · Ordre croissant', theme: 'pink'
    },
    {
      id: 'line', number: '06', section: 'Le rail', icon: '⌁', title: 'La ligne de précision',
      subtitle: 'Place le nombre à la bonne position.',
      description: 'Lis une droite graduée et utilise les repères pour situer une quantité.',
      skills: 'Droite graduée · Repères · Encadrement', theme: 'blue'
    },
    {
      id: 'rank', number: '07', section: 'Le scanner', icon: '⌕', title: 'Le compteur de rangs',
      subtitle: 'Compte les dizaines, les centaines ou les millièmes entiers.',
      description: 'Distingue le chiffre d’un rang du nombre entier de groupes de ce rang.',
      skills: 'Dizaines entières · Centièmes entiers · Millièmes', theme: 'amber'
    },
    {
      id: 'build', number: '08', section: 'Les défis', icon: '↗', title: 'Crée un nombre',
      subtitle: 'Construis un nombre plus grand ou plus petit.',
      description: 'Choisis une valeur qui respecte une contrainte, puis vérifie ta stratégie.',
      skills: 'Plus grand · Plus petit · Encadrement', theme: 'mint'
    }
  ];

  const MEASURE_UNITS = {
    Longueur: [
      { name: 'mm', exp: -3 }, { name: 'cm', exp: -2 }, { name: 'dm', exp: -1 },
      { name: 'm', exp: 0 }, { name: 'dam', exp: 1 }, { name: 'hm', exp: 2 }, { name: 'km', exp: 3 }
    ],
    Masse: [
      { name: 'mg', exp: -3 }, { name: 'cg', exp: -2 }, { name: 'dg', exp: -1 },
      { name: 'g', exp: 0 }, { name: 'dag', exp: 1 }, { name: 'hg', exp: 2 }, { name: 'kg', exp: 3 }
    ],
    Capacité: [
      { name: 'mL', exp: -3 }, { name: 'cL', exp: -2 }, { name: 'dL', exp: -1 },
      { name: 'L', exp: 0 }, { name: 'daL', exp: 1 }, { name: 'hL', exp: 2 }, { name: 'kL', exp: 3 }
    ],
    Surface: [
      { name: 'mm²', exp: -6 }, { name: 'cm²', exp: -4 }, { name: 'dm²', exp: -2 },
      { name: 'm²', exp: 0 }, { name: 'dam²', exp: 2 }, { name: 'hm²', exp: 4 }, { name: 'km²', exp: 6 }
    ],
    Volume: [
      { name: 'mm³', exp: -9 }, { name: 'cm³', exp: -6 }, { name: 'dm³', exp: -3 },
      { name: 'm³', exp: 0 }, { name: 'dam³', exp: 3 }, { name: 'hm³', exp: 6 }, { name: 'km³', exp: 9 }
    ],
    // Correspondances utiles entre volume et capacité : 1 cm³ = 1 mL,
    // 1 dm³ = 1 L et 1 m³ = 1'000 L. Le facteur est exprimé en litres.
    'Volume et capacité': [
      { name: 'cm³', factor: 0.001 }, { name: 'mL', factor: 0.001 },
      { name: 'dm³', factor: 1 }, { name: 'L', factor: 1 },
      { name: 'm³', factor: 1000 }, { name: 'kL', factor: 1000 }
    ],
    Temps: [
      { name: 's', factor: 1 }, { name: 'min', factor: 60 },
      { name: 'h', factor: 3600 }, { name: 'j', factor: 86400 }
    ]
  };

  let view = 'menu';
  let activeMissionId = 'factory';
  let selectedDifficulty = 'starter';
  let playStyle = 'practice'; // practice : sans vies ; challenge : trois vies
  let activeTask = null;
  let answerInput = '';
  let decompositionInputs = {};
  let selectedOrder = [];
  let lineGuess = 50;
  let feedback = null;
  let attemptCount = 0;
  let score = 0;
  let streak = 0;
  let lives = 3;
  let showOptions = false;
  let showPlaceHints = true;
  let readAloudEnabled = false;
  let soundEnabled = true;
  let animationsEnabled = true;
  let reduceMotion = false;
  let workbench = emptyCounts();
  let shipment = emptyCounts();
  let conveyorItems = [];
  let itemCounter = 0;
  let spawnTimer;
  let gameOver = false;
  let announceText = 'Choisis une mission pour commencer.';

  // Fabrique un objet de compteurs indépendant : il n’y a pas de persistance.
  function emptyCounts() {
    return Object.fromEntries(PLACE_VALUES.map((place) => [place.key, 0]));
  }

  $: activeMission = MISSIONS.find((mission) => mission.id === activeMissionId) || MISSIONS[0];
  $: difficulty = DIFFICULTIES.find((item) => item.id === selectedDifficulty) || DIFFICULTIES[1];
  $: activeRanks = getRanksForMission(activeMissionId, selectedDifficulty);
  $: shipmentTicks = valueFromCounts(shipment);
  $: workbenchTicks = valueFromCounts(workbench);

  function getRanksForMission(missionId, difficultyId) {
    if (missionId === 'factory') {
      if (difficultyId === 'starter') return PLACE_VALUES.filter((p) => p.exp >= 0 && p.exp <= 2);
      if (difficultyId === 'decimal') return PLACE_VALUES.filter((p) => p.exp <= 3 && p.exp >= -3);
      if (difficultyId === 'expedition') return PLACE_VALUES.filter((p) => p.exp >= 0);
      return PLACE_VALUES.filter((p) => p.exp >= 0 && p.exp <= 3);
    }
    if (missionId === 'decompose') {
      if (difficultyId === 'starter') return PLACE_VALUES.filter((p) => p.exp >= 0 && p.exp <= 2);
      if (difficultyId === 'workshop') return PLACE_VALUES.filter((p) => p.exp >= 0 && p.exp <= 3);
      if (difficultyId === 'decimal') return PLACE_VALUES.filter((p) => p.exp <= 3 && p.exp >= -3);
      return PLACE_VALUES;
    }
    if (missionId === 'factory' && difficultyId === 'expedition') return PLACE_VALUES.filter((p) => p.exp >= 0);
    return PLACE_VALUES.filter((p) => p.exp >= 0 && p.exp <= 3);
  }

  // Toutes les valeurs du jeu sont ramenées à des millièmes entiers (ticks).
  function valueFromCounts(counts) {
    return PLACE_VALUES.reduce((sum, place) => sum + (Number(counts[place.key]) || 0) * TICK_WEIGHT[place.key], 0);
  }

  function decomposeTicks(ticks, ranks = PLACE_VALUES) {
    const safeTicks = Math.max(0, Math.round(ticks));
    const result = {};
    for (const place of ranks) {
      const weight = TICK_WEIGHT[place.key];
      result[place.key] = Math.floor(safeTicks / weight + 1e-8) % 10;
    }
    return result;
  }

  function formatTicks(ticks, maxDecimals = 3) {
    const value = Math.max(0, Math.round(ticks)) / 1000;
    const hasDecimal = Math.round(ticks) % 1000 !== 0;
    return new Intl.NumberFormat('fr-CH', {
      maximumFractionDigits: hasDecimal ? maxDecimals : 0,
      minimumFractionDigits: 0
    }).format(value);
  }

  function formatValue(value, maxDecimals = 3) {
    return new Intl.NumberFormat('fr-CH', { maximumFractionDigits: maxDecimals }).format(value);
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function makeTargetTicks(missionId = activeMissionId) {
    if (selectedDifficulty === 'starter') return randomInt(1, 999) * 1000;
    if (selectedDifficulty === 'workshop') return randomInt(1, 9999) * 1000;
    if (selectedDifficulty === 'decimal') return randomInt(1, 9999999);
    return randomInt(1, 999999999999) * 1000;
  }

  function numberToSwissText(value) {
    // Conversion des nombres naturels jusqu’à 999'999'999'999.
    const n = Math.floor(Math.abs(value));
    if (n === 0) return 'zéro';
    const groups = [
      { base: 1_000_000_000, singular: 'milliard', plural: 'milliards', type: 'named' },
      { base: 1_000_000, singular: 'million', plural: 'millions', type: 'named' },
      { base: 1000, singular: 'mille', plural: 'mille', type: 'thousand' },
      { base: 1, singular: '', plural: '', type: 'units' }
    ];
    let remaining = n;
    const parts = [];
    for (const group of groups) {
      const amount = Math.floor(remaining / group.base);
      remaining %= group.base;
      if (!amount) continue;
      if (group.type === 'named') {
        parts.push(`${underThousandSwiss(amount)} ${amount === 1 ? group.singular : group.plural}`);
      } else if (group.type === 'thousand') {
        // Devant « mille », « cent » ne prend jamais de s : deux cent mille.
        const amountText = underThousandSwiss(amount).replace(/cents$/, 'cent');
        parts.push(amount === 1 ? 'mille' : `${amountText} mille`);
      } else {
        parts.push(underThousandSwiss(amount));
      }
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  function underThousandSwiss(n) {
    if (n === 0) return '';
    const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    // L’index correspond au chiffre des dizaines : 6 = soixante, 7 = septante.
    const tensWords = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'septante', 'huitante', 'nonante'];
    const parts = [];
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;
    if (hundreds > 0) {
      if (hundreds === 1) parts.push('cent');
      else parts.push(`${units[hundreds]} cent${rest === 0 ? 's' : ''}`);
    }
    if (rest > 0) {
      if (rest < 10) parts.push(units[rest]);
      else if (rest < 20) parts.push(teens[rest - 10]);
      else {
        const tens = Math.floor(rest / 10);
        const unit = rest % 10;
        if (unit === 1) {
          // En Suisse romande : vingt et un, soixante et un, septante et un, etc.
          parts.push(`${tensWords[tens]} et un`);
        } else if (unit > 1) {
          parts.push(`${tensWords[tens]}-${units[unit]}`);
        } else {
          parts.push(tensWords[tens]);
        }
      }
    }
    return parts.join(' ');
  }

  function normalizeWords(text) {
    // Ignore la casse, les accents, les traits d’union et la ponctuation superflue.
    return String(text || '').toLocaleLowerCase('fr-CH')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[’']/g, ' ')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  function parseNumberInput(text) {
    // Accepte 1 234,5 ; 1'234.5 ; 1234,5 et 1234.5.
    let cleaned = String(text ?? '').trim().replace(/[\s\u00a0\u202f'’]/g, '');
    if (cleaned.includes(',') && cleaned.includes('.')) {
      cleaned = cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '');
    } else {
      cleaned = cleaned.replace(',', '.');
    }
    if (!cleaned || !/^\d+(\.\d+)?$/.test(cleaned)) return null;
    const value = Number(cleaned);
    return Number.isFinite(value) ? value : null;
  }

  function startMission(missionId) {
    activeMissionId = missionId;
    view = 'game';
    score = 0;
    streak = 0;
    lives = 3;
    gameOver = false;
    showOptions = false;
    stopSpawner();
    newQuestion();
    if (['factory'].includes(missionId)) startSpawner();
    const chosenMission = MISSIONS.find((mission) => mission.id === missionId) || MISSIONS[0];
    announceText = `Mission lancée : ${chosenMission.title}.`;
  }

  function goToMenu() {
    stopSpawner();
    conveyorItems = [];
    view = 'menu';
    gameOver = false;
    feedback = null;
    showOptions = false;
    announceText = 'Menu des missions. Choisis une difficulté puis une mission.';
  }

  function newQuestion() {
    feedback = null;
    attemptCount = 0;
    answerInput = '';
    selectedOrder = [];
    lineGuess = 50;
    workbench = emptyCounts();
    shipment = emptyCounts();
    conveyorItems = [];
    decompositionInputs = emptyCounts();

    if (activeMissionId === 'factory') {
      const targetTicks = makeTargetTicks();
      activeTask = {
        type: 'factory', targetTicks,
        prompt: 'Prépare exactement la quantité demandée, puis expédie le colis.',
        targetWords: Number.isInteger(targetTicks / 1000) ? numberToSwissText(targetTicks / 1000) : ''
      };
      return;
    }

    if (activeMissionId === 'measure') {
      const familyNames = Object.keys(MEASURE_UNITS);
      const familyName = familyNames[randomInt(0, familyNames.length - 1)];
      const units = MEASURE_UNITS[familyName];
      let fromIndex = randomInt(0, units.length - 1);
      // Les écarts de conversion deviennent progressivement plus grands avec la difficulté,
      // sans imposer d’emblée des résultats impossibles à lire ou à saisir.
      const maxExponentGap = selectedDifficulty === 'starter' ? 3
        : selectedDifficulty === 'workshop' ? 6 : 9;
      const maxUnitSteps = selectedDifficulty === 'starter' ? 1
        : selectedDifficulty === 'workshop' ? 2
          : selectedDifficulty === 'decimal' ? 3 : 6;
      const candidateIndexes = units.map((unit, index) => ({ unit, index }))
        .filter(({ unit, index }) => index !== fromIndex && (
          familyName === 'Temps'
            ? Math.abs(index - fromIndex) <= (selectedDifficulty === 'starter' ? 1 : selectedDifficulty === 'workshop' ? 2 : 3)
            : familyName === 'Volume et capacité'
              ? Math.abs(Math.log10(unit.factor) - Math.log10(units[fromIndex].factor)) <= (selectedDifficulty === 'starter' ? 0 : selectedDifficulty === 'workshop' ? 3 : 6)
              : Math.abs(index - fromIndex) <= maxUnitSteps
                && Math.abs(unit.exp - units[fromIndex].exp) <= maxExponentGap
        ));
      let toIndex = candidateIndexes[randomInt(0, candidateIndexes.length - 1)].index;
      const baseValues = selectedDifficulty === 'starter'
        ? [1, 2, 3, 5, 10]
        : selectedDifficulty === 'workshop'
          ? [1, 2, 3, 5, 10, 25, 120, 250]
          : [0.25, 0.4, 0.8, 1.2, 2.5, 3.75, 12.5];
      const sourceValue = baseValues[randomInt(0, baseValues.length - 1)];
      // Les durées utilisent des facteurs 60 et 24 ; les autres grandeurs suivent
      // les puissances décimales (les surfaces par 100 et les volumes par 1'000).
      let conversion = familyName === 'Temps' || familyName === 'Volume et capacité'
        ? sourceValue * units[fromIndex].factor / units[toIndex].factor
        : sourceValue * Math.pow(10, units[fromIndex].exp - units[toIndex].exp);
      // Évite les résultats inférieurs au millième qui seraient illisibles à saisir.
      // On inverse le sens de conversion, sans changer la quantité de départ.
      if (conversion > 0 && conversion < 0.001) {
        const previousFromIndex = fromIndex;
        fromIndex = toIndex;
        toIndex = previousFromIndex;
        conversion = familyName === 'Temps' || familyName === 'Volume et capacité'
          ? sourceValue * units[fromIndex].factor / units[toIndex].factor
          : sourceValue * Math.pow(10, units[fromIndex].exp - units[toIndex].exp);
      }
      activeTask = {
        type: 'measure', familyName, sourceValue, fromUnit: units[fromIndex].name,
        toUnit: units[toIndex].name, expected: Number(conversion.toPrecision(12)),
        prompt: `Convertis cette mesure en ${units[toIndex].name}.`,
        hint: familyName === 'Temps'
          ? 'Les durées ne sont pas en base 10 : 1 minute = 60 secondes, 1 heure = 60 minutes et 1 jour = 24 heures.'
          : familyName === 'Volume et capacité'
            ? 'Repères utiles : 1 cm³ = 1 mL ; 1 dm³ = 1 L ; 1 m³ = 1’000 L.'
            : `Pour les ${familyName.toLowerCase()}, le facteur entre deux unités adjacentes est ${familyName === 'Surface' ? '100' : familyName === 'Volume' ? '1’000' : '10'}. Vers une unité plus petite, on multiplie ; vers une unité plus grande, on divise.`
      };
      return;
    }

    if (activeMissionId === 'words') {
      const expedition = selectedDifficulty === 'expedition';
      const number = expedition ? randomInt(1, 999999999999) : randomInt(1, difficulty.maxInteger);
      const numericToWords = Math.random() < 0.5;
      activeTask = numericToWords
        ? { type: 'words', direction: 'toWords', number, prompt: 'Écris ce nombre en toutes lettres.', expectedWords: numberToSwissText(number) }
        : { type: 'words', direction: 'toDigits', number, prompt: 'Lis le mot-nombre et écris le nombre en chiffres.', expected: number };
      return;
    }

    if (activeMissionId === 'decompose') {
      const targetTicks = makeTargetTicks();
      // Pour une partie des nombres entiers, l'élève part d'un mot-nombre plutôt que de chiffres.
      const asWords = targetTicks % 1000 === 0 && Math.random() < 0.35;
      activeTask = {
        type: 'decompose', targetTicks, asWords,
        targetWords: asWords ? numberToSwissText(targetTicks / 1000) : '',
        prompt: 'Reporte le chiffre de chaque rang dans le tableau.'
      };
      return;
    }

    if (activeMissionId === 'sort') {
      const values = [];
      const large = selectedDifficulty === 'expedition';
      const decimals = selectedDifficulty === 'decimal';
      const max = large ? 999999999999 : decimals ? 9999999 : difficulty.maxInteger * 1000;
      while (values.length < 4) {
        // Les entiers aussi sont stockés en ticks : 1 unité = 1'000 ticks.
        const candidate = large ? randomInt(1, max) * 1000 : decimals ? randomInt(1, max) : randomInt(1, difficulty.maxInteger) * 1000;
        if (!values.includes(candidate)) values.push(candidate);
      }
      activeTask = { type: 'sort', values, prompt: 'Appuie sur les nombres dans l’ordre croissant, du plus petit au plus grand.' };
      return;
    }

    if (activeMissionId === 'line') {
      let start = 0;
      let span = 100;
      if (selectedDifficulty === 'workshop') { start = randomInt(100, 5000); span = 100; }
      if (selectedDifficulty === 'decimal') { start = randomInt(0, 20) / 10; span = 1; }
      if (selectedDifficulty === 'expedition') { start = randomInt(1, 999900) * 1000000; span = 100000000; }
      // Le repère tombe sur une graduation visible (tous les 5 % de la droite).
      // Une partie des tâches demande de placer un nombre, l'autre de lire le repère.
      const offset = randomInt(1, 19) * 5;
      const direction = Math.random() < 0.5 ? 'place' : 'read';
      activeTask = {
        type: 'line', start, end: start + span,
        target: start + (span * offset / 100), offset, direction,
        prompt: direction === 'place'
          ? 'Place le repère au niveau du nombre demandé.'
          : 'Quel nombre est indiqué par le repère ?'
      };
      lineGuess = 50;
      return;
    }

    if (activeMissionId === 'rank') {
      const examples = selectedDifficulty === 'starter'
        ? [234, 487, 902]
        : selectedDifficulty === 'workshop'
          ? [1234, 4387, 9876]
          : selectedDifficulty === 'decimal'
            ? [12345, 234567, 4387000, 7654, 32005]
            : [123456789, 123456789012, 9876543210];
      const ticks = examples[randomInt(0, examples.length - 1)];
      const ranks = selectedDifficulty === 'starter'
        ? PLACE_VALUES.filter((p) => [1, 2].includes(p.exp))
        : selectedDifficulty === 'workshop'
          ? PLACE_VALUES.filter((p) => [1, 2, 3].includes(p.exp))
          : selectedDifficulty === 'decimal'
            ? PLACE_VALUES.filter((p) => p.exp >= -3 && p.exp <= 0)
            : PLACE_VALUES.filter((p) => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, -1, -2, -3].includes(p.exp));
      const place = ranks[randomInt(0, ranks.length - 1)];
      const actualTicks = selectedDifficulty === 'decimal' ? ticks : ticks * 1000;
      const expected = Math.floor(actualTicks / TICK_WEIGHT[place.key] + 1e-8);
      activeTask = { type: 'rank', targetTicks: actualTicks, place, expected, prompt: `Combien de ${place.label.toLocaleLowerCase('fr-CH')} entiers contient ce nombre ?` };
      return;
    }

    if (activeMissionId === 'build') {
      const decimalMode = selectedDifficulty === 'decimal';
      const expeditionDecimal = selectedDifficulty === 'expedition' && Math.random() < 0.5;
      const number = decimalMode
        ? randomInt(1000, 9999999) / 1000
        : expeditionDecimal
          ? randomInt(1, 99999999999) / 1000
          : selectedDifficulty === 'expedition'
            ? randomInt(100000, 100000000)
            : randomInt(10, difficulty.maxInteger);
      const step = decimalMode || expeditionDecimal ? 0.001 : 1;
      if (Math.random() < 0.34) {
        const lower = decimalMode ? Math.floor(number * 100) / 100 : Math.floor(number / 10) * 10;
        const upper = lower + (decimalMode ? 0.01 : 10);
        activeTask = { type: 'build', condition: 'between', lower, upper, step, prompt: 'Propose un nombre strictement compris entre les deux bornes.' };
      } else {
        const direction = Math.random() < 0.5 ? 'greater' : 'smaller';
        activeTask = {
          type: 'build', condition: 'direction', number, direction, step,
          prompt: direction === 'greater' ? 'Propose un nombre plus grand que celui affiché.' : 'Propose un nombre plus petit que celui affiché.'
        };
      }
      return;
    }
  }

  function startSpawner() {
    stopSpawner();
    spawnBeltItem();
    spawnTimer = setInterval(() => {
      // Le nombre d’objets est plafonné pour garder le jeu lisible et fluide sur iPad.
      if (view === 'game' && activeMissionId === 'factory' && conveyorItems.length < 6 && !feedback?.kind?.startsWith('success')) {
        spawnBeltItem();
      }
    }, 2000);
  }

  function stopSpawner() {
    if (spawnTimer) clearInterval(spawnTimer);
    spawnTimer = undefined;
  }

  function spawnBeltItem() {
    if (!activeTask || activeTask.type !== 'factory') return;
    const ranksForThisMission = getRanksForMission(activeMissionId, selectedDifficulty);
    const preferredDigits = decomposeTicks(activeTask.targetTicks, ranksForThisMission);
    const preferredPlaces = ranksForThisMission.filter((place) => preferredDigits[place.key] > 0);
    const pool = Math.random() < 0.82 && preferredPlaces.length ? preferredPlaces : ranksForThisMission;
    const place = pool[randomInt(0, pool.length - 1)];
    // La distance dépend de la largeur de l'écran : on ralentit aussi sur iPad
    // sans que les colis se chevauchent simplement parce que le parcours est plus court.
    const travelDistance = (typeof window !== 'undefined' ? window.innerWidth : 1280) + 280;
    // Vitesse intermédiaire : les colis avancent plus vite qu'avant,
// tout en laissant le temps aux élèves de les repérer et de les toucher.
const pixelsPerSecond = randomInt(180, 220);
    const item = {
      id: ++itemCounter,
      key: place.key,
      // Les colis restent dans la zone visible même avec une carte plus haute.
      top: randomInt(7, 19),
      // Vitesse volontairement lente : environ 34 à 40 pixels par seconde.
      duration: animationsEnabled && !reduceMotion ? Number((travelDistance / pixelsPerSecond).toFixed(1)) : 18
    };
    conveyorItems = [...conveyorItems, item];
  }

  // Relation visible sous chaque colis : elle explicite la valeur du rang.
  // Les rangs décimaux sont décrits comme une dixième du rang supérieur.
  const PLACE_RELATIONS = {
    unit: '1 cube = 1 unité',
    ten: '1 dizaine = 10 unités',
    hundred: '1 centaine = 10 dizaines',
    thousand: '1 millier = 10 centaines',
    tenThousand: '10 milliers',
    hundredThousand: '10 dizaines de milliers',
    million: '10 centaines de milliers',
    tenMillion: '10 millions',
    hundredMillion: '10 dizaines de millions',
    billion: '10 centaines de millions',
    tenBillion: '10 milliards',
    hundredBillion: '10 dizaines de milliards',
    tenth: '1/10 d’une unité',
    hundredth: '1/10 de dixième',
    thousandth: '1/10 de centième'
  };

  function beltItemRelation(itemKey) {
    return PLACE_RELATIONS[itemKey] || 'Un rang de numération';
  }

  function discardConveyorItem(id) {
    conveyorItems = conveyorItems.filter((item) => item.id !== id);
  }

  function beltItemStyle(item) {
    // Sans animation, les colis restent répartis dans le tapis et peuvent toujours être touchés.
    const systemPrefersReducedMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animated = animationsEnabled && !reduceMotion && !systemPrefersReducedMotion;
    const left = animated ? '-150px' : `${(item.id * 17) % 82}%`;

    // Important : le nom de @keyframes est renommé automatiquement par Svelte
    // lors de la compilation des styles. Le définir ici en texte ('drift')
    // écrasait le nom compilé et empêchait donc le tapis de se déplacer.
    // On laisse le CSS gérer l'animation quand elle est active ; on ne la
    // désactive en ligne que lorsque la réduction des mouvements est demandée.
    const motionStyle = animated ? '' : ';animation:none';
    return `top:${item.top}%;--drift-duration:${item.duration}s;left:${left}${motionStyle}`;
  }

  function collectItem(item) {
    if (feedback?.kind === 'success') return;
    workbench = { ...workbench, [item.key]: workbench[item.key] + 1 };
    discardConveyorItem(item.id);
    playSound('catch');
    announceText = `${PLACE_BY_KEY[item.key].label} récupérées : ${workbench[item.key]}.`;
  }

  function getAllowedRankIndex(key) {
    return activeRanks.findIndex((place) => place.key === key);
  }

  function fuseRank(key) {
    const index = getAllowedRankIndex(key);
    if (index < 1 || workbench[key] < 10 || feedback?.kind === 'success') return;
    const nextKey = activeRanks[index - 1].key;
    workbench = { ...workbench, [key]: workbench[key] - 10, [nextKey]: workbench[nextKey] + 1 };
    playSound('fuse');
    feedback = null;
    announceText = `Échange effectué : 10 ${PLACE_BY_KEY[key].label.toLowerCase()} contre 1 ${PLACE_BY_KEY[nextKey].label.toLowerCase()}. La valeur totale ne change pas.`;
  }

  function breakRank(key) {
    const index = getAllowedRankIndex(key);
    if (index < 0 || index >= activeRanks.length - 1 || workbench[key] < 1 || feedback?.kind === 'success') return;
    const nextKey = activeRanks[index + 1].key;
    workbench = { ...workbench, [key]: workbench[key] - 1, [nextKey]: workbench[nextKey] + 10 };
    playSound('break');
    feedback = null;
    announceText = `Décomposition : 1 ${PLACE_BY_KEY[key].label.toLowerCase()} devient 10 ${PLACE_BY_KEY[nextKey].label.toLowerCase()}. La valeur totale ne change pas.`;
  }

  function sendToShipment(key) {
    if (workbench[key] < 1 || feedback?.kind === 'success') return;
    workbench = { ...workbench, [key]: workbench[key] - 1 };
    shipment = { ...shipment, [key]: shipment[key] + 1 };
    feedback = null;
  }

  function returnFromShipment(key) {
    if (shipment[key] < 1 || feedback?.kind === 'success') return;
    shipment = { ...shipment, [key]: shipment[key] - 1 };
    workbench = { ...workbench, [key]: workbench[key] + 1 };
    feedback = null;
  }

  function submitTask() {
    if (!activeTask || feedback?.kind === 'success' || gameOver) return;
    attemptCount += 1;
    let isCorrect = false;
    let hint = '';
    let message = 'Pas encore. Reprends les rangs ou la consigne, puis réessaie.';

    switch (activeTask.type) {
      case 'factory': {
        const difference = shipmentTicks - activeTask.targetTicks;
        isCorrect = difference === 0;
        if (difference < 0) message = `Il manque ${formatTicks(Math.abs(difference))} pour atteindre la commande.`;
        if (difference > 0) message = `Tu as ${formatTicks(difference)} de trop dans le colis.`;
        const expectedDigits = decomposeTicks(activeTask.targetTicks, activeRanks);
        const suppliedDigits = decomposeTicks(shipmentTicks, activeRanks);
        const wrongPlaces = activeRanks.filter((place) => expectedDigits[place.key] !== suppliedDigits[place.key]);
        if (!isCorrect && attemptCount >= 2) {
          hint = wrongPlaces.length
            ? `Vérifie ces rangs : ${wrongPlaces.map((place) => place.label.toLowerCase()).join(', ')}.`
            : 'La valeur totale ne correspond pas : vérifie les échanges entre les rangs.';
        }
        if (!isCorrect && attemptCount >= 3) {
          hint += ` Décomposition attendue : ${activeRanks.filter((p) => expectedDigits[p.key] > 0).map((p) => `${expectedDigits[p.key]} ${p.label.toLowerCase()}`).join(' · ') || 'zéro'}.`;
        }
        break;
      }
      case 'measure': {
        const value = parseNumberInput(answerInput);
        // Tolérance relative très stricte, y compris pour les conversions très petites.
        isCorrect = value !== null && Math.abs(value - activeTask.expected) <= Math.abs(activeTask.expected) * 1e-9;
        message = isCorrect ? '' : 'Vérifie combien de fois l’unité de départ entre dans l’unité d’arrivée.';
        hint = attemptCount >= 2 ? activeTask.hint : '';
        break;
      }
      case 'words': {
        if (activeTask.direction === 'toWords') {
          isCorrect = normalizeWords(answerInput) === normalizeWords(activeTask.expectedWords);
          message = 'Vérifie les groupes de trois chiffres : unités, milliers, millions, milliards.';
          hint = attemptCount >= 2 ? `Une écriture possible est : « ${activeTask.expectedWords} ».` : '';
        } else {
          const value = parseNumberInput(answerInput);
          isCorrect = value !== null && Number.isInteger(value) && value === activeTask.expected;
          message = 'Lis le nombre par groupes de trois chiffres, de droite à gauche.';
          hint = attemptCount >= 2 ? `Le nombre est ${formatValue(activeTask.expected, 0)}.` : '';
        }
        break;
      }
      case 'decompose': {
        const expectedDigits = decomposeTicks(activeTask.targetTicks, activeRanks);
        isCorrect = activeRanks.every((place) => Number(decompositionInputs[place.key] || 0) === expectedDigits[place.key]);
        message = 'Un chiffre indique combien il y a de groupes de ce rang. Un rang vide contient 0.';
        hint = attemptCount >= 2
          ? `Regarde le nombre de gauche à droite et aligne chaque chiffre avec son rang. Les zéros gardent la place.`
          : '';
        break;
      }
      case 'sort': {
        const sorted = [...activeTask.values].sort((a, b) => a - b);
        isCorrect = selectedOrder.length === sorted.length && selectedOrder.every((value, index) => value === sorted[index]);
        message = 'L’ordre n’est pas encore correct. Compare d’abord le rang le plus élevé, puis passe au rang suivant si les chiffres sont égaux.';
        hint = attemptCount >= 3 ? `Pour vérifier : ${sorted.map((ticks) => formatTicks(ticks)).join(' → ')}.` : '';
        break;
      }
      case 'line': {
        // Une graduation est placée tous les 5 % ; la tolérance correspond à environ
        // la moitié de l'espace entre deux graduations.
        const step = (activeTask.end - activeTask.start) / 20;
        if (activeTask.direction === 'read') {
          const value = parseNumberInput(answerInput);
          isCorrect = value !== null && Math.abs(value - activeTask.target) <= step * 0.51;
          message = 'Repère les deux bornes, puis estime la valeur correspondant à la position du point.';
        } else {
          const guessed = activeTask.start + (activeTask.end - activeTask.start) * (lineGuess / 100);
          isCorrect = Math.abs(guessed - activeTask.target) <= step * 0.51;
          message = guessed < activeTask.target ? 'Ton repère est trop à gauche : avance un peu.' : 'Ton repère est trop à droite : recule un peu.';
        }
        hint = attemptCount >= 2 ? `Le repère correspond à ${formatValue(activeTask.target, 3)}.` : '';
        break;
      }
      case 'rank': {
        const value = parseNumberInput(answerInput);
        isCorrect = value !== null && Number.isInteger(value) && value === activeTask.expected;
        message = 'Attention : le chiffre du rang n’est pas la même chose que le nombre de groupes entiers de ce rang.';
        hint = attemptCount >= 2 ? `Divise le nombre par ${formatValue(Math.pow(10, activeTask.place.exp), 3)} puis prends la partie entière.` : '';
        break;
      }
      case 'build': {
        const value = parseNumberInput(answerInput);
        const step = activeTask.step || 1;
        // Respecte la précision demandée : nombres entiers en mode naturel, millièmes
        // lorsque la mission travaille les décimaux.
        const nearestStepValue = value === null ? 0 : Math.round(value / step) * step;
        // La tolérance suit la précision des nombres flottants pour les grandes valeurs :
        // un millième reste valide même quand le nombre approche 100 millions.
        const precisionTolerance = value === null ? 0 : Math.max(1e-9, Math.abs(value) * Number.EPSILON * 4);
        const respectsStep = value !== null && Math.abs(value - nearestStepValue) <= precisionTolerance;
        if (activeTask.condition === 'between') {
          isCorrect = respectsStep && value > activeTask.lower && value < activeTask.upper;
          message = `Le nombre doit être strictement entre ${formatValue(activeTask.lower, 3)} et ${formatValue(activeTask.upper, 3)}.`;
          hint = attemptCount >= 2 ? 'Les deux bornes sont exclues : la réponse doit être plus grande que la première et plus petite que la seconde.' : '';
        } else {
          isCorrect = respectsStep && (activeTask.direction === 'greater' ? value > activeTask.number : value < activeTask.number) && value >= 0;
          message = activeTask.direction === 'greater' ? 'Il faut une valeur strictement plus grande.' : 'Il faut une valeur strictement plus petite.';
          hint = attemptCount >= 2 ? `Le nombre donné est ${formatValue(activeTask.number, 3)}. Compare les valeurs, pas seulement le nombre de chiffres.` : '';
        }
        break;
      }
    }

    if (isCorrect) {
      score += 50 + Math.min(streak, 5) * 10;
      streak += 1;
      feedback = { kind: 'success', title: 'Livraison validée !', message: 'Bien joué. Tu as trouvé la bonne valeur.', hint: '' };
      playSound('win');
      announceText = 'Bonne réponse. Livraison validée.';
    } else {
      streak = 0;
      if (playStyle === 'challenge') lives -= 1;
      feedback = { kind: 'error', title: 'On vérifie ensemble', message, hint };
      playSound('error');
      announceText = `${message} ${hint}`;
      if (playStyle === 'challenge' && lives <= 0) {
        gameOver = true;
        stopSpawner();
      }
    }
  }

  function chooseOrderValue(value) {
    if (selectedOrder.includes(value)) return;
    selectedOrder = [...selectedOrder, value];
    feedback = null;
  }

  function undoOrderChoice(index) {
    selectedOrder = selectedOrder.filter((_, itemIndex) => itemIndex !== index);
    feedback = null;
  }

  function submitNext() {
    if (gameOver) {
      goToMenu();
      return;
    }
    newQuestion();
  }

  function speakPrompt() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !activeTask) return;
    let content = activeTask.prompt || 'Lis la consigne puis réponds.';
    // En mode mot-nombre vers chiffres, la lecture vocale peut prononcer le mot-nombre.
    if (activeTask.type === 'words' && activeTask.direction === 'toDigits') {
      content += ` ${numberToSwissText(activeTask.number)}.`;
    } else if (activeTask.type === 'factory' && Number.isInteger(activeTask.targetTicks / 1000)) {
      content += ` ${numberToSwissText(activeTask.targetTicks / 1000)}.`;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = 'fr-CH';
    utterance.rate = 0.88;
    window.speechSynthesis.speak(utterance);
  }

  function playSound(type) {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const notes = { catch: [380, 520], fuse: [300, 660], break: [660, 360], error: [180, 140], win: [520, 660, 790] };
      const sequence = notes[type] || [440];
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(sequence[0], context.currentTime);
      sequence.forEach((note, index) => oscillator.frequency.setValueAtTime(note, context.currentTime + index * 0.06));
      gain.gain.setValueAtTime(0.045, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + sequence.length * 0.08);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + sequence.length * 0.08);
      oscillator.onended = () => context.close();
    } catch (error) {
      // Le son reste facultatif : un navigateur qui le bloque ne doit pas gêner le jeu.
    }
  }

  onDestroy(() => {
    stopSpawner();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  });
</script>

<svelte:head>
  <title>SHIFT — Atelier des quantités | Orbis</title>
  <meta name="description" content="Un jeu de numération et de conversions de mesures : collecte, échanges et livraisons." />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
</svelte:head>

<div class:reduce-motion={reduceMotion || !animationsEnabled} class="app-shell">
  <header class="topbar">
    <a class="orbis-link" href={`${base}/`} aria-label="Retour à Orbis"><span class="orbis-mark">O</span><span>ORBiS</span></a>
    <div class="brand-lockup"><span class="brand-kicker">LOGISTIQUE DES NOMBRES</span><strong>SHIFT<span class="brand-dot">.</span></strong></div>
    {#if view === 'game'}
      <div class="top-actions">
        <span class="mode-pill">{playStyle === 'practice' ? 'ENTRAÎNEMENT' : 'DÉFI'}</span>
        <button class="quiet-button" type="button" onclick={() => (showOptions = !showOptions)} aria-expanded={showOptions}>Options <span aria-hidden="true">⚙</span></button>
        <button class="quiet-button back-button" type="button" onclick={goToMenu}>← Missions</button>
      </div>
    {:else}
      <a class="quiet-button top-return" href={`${base}/`}>← Retour à Orbis</a>
    {/if}
  </header>

  {#if view === 'menu'}
    <main class="menu-view">
      <section class="hero-grid">
        <div class="hero-copy">
          <p class="eyebrow"><span class="status-dot"></span> CENTRE DE CONTRÔLE · SECTEUR 10</p>
          <h1>Les nombres<br /><span>en mouvement.</span></h1>
          <p class="hero-description">Récupère les bonnes quantités. Échange par paquets de dix. Transforme les mesures. Prépare des livraisons exactes.</p>
          <div class="hero-meta"><span class="meta-line"></span><span>OBSERVE · ÉCHANGE · VÉRIFIE · EXPÉDIE</span></div>
        </div>
        <div class="hero-visual" aria-label="Illustration abstraite d'un centre de tri des nombres">
          <div class="visual-scan"></div>
          <div class="visual-grid"></div>
          <div class="cargo cargo-large"><span>100</span><i></i><i></i><i></i><i></i></div>
          <div class="cargo cargo-mid"><span>10</span><i></i><i></i><i></i></div>
          <div class="cargo cargo-small"><span>1</span></div>
          <div class="visual-label label-top">VALEUR POSITIONNELLE</div>
          <div class="visual-label label-bottom">10 × → 1 ×</div>
          <div class="visual-cross cross-one">+</div><div class="visual-cross cross-two">×10</div>
        </div>
      </section>

      <section class="setup-panel" aria-labelledby="difficulty-title">
        <div class="section-heading compact-heading">
          <div><p class="eyebrow">01 / RÈGLE LE NIVEAU</p><h2 id="difficulty-title">Choisis ta zone de jeu</h2></div>
          <p>Tu peux changer de difficulté à tout moment en revenant ici.</p>
        </div>
        <div class="difficulty-grid" role="group" aria-label="Difficulté">
          {#each DIFFICULTIES as level}
            <button type="button" class:chosen={selectedDifficulty === level.id} class="difficulty-card" onclick={() => (selectedDifficulty = level.id)} aria-pressed={selectedDifficulty === level.id}>
              <span class="difficulty-index">{String(DIFFICULTIES.indexOf(level) + 1).padStart(2, '0')}</span>
              <strong>{level.name}</strong><span>{level.range}</span>
              {#if selectedDifficulty === level.id}<span class="selected-check" aria-label="Sélectionné">✓</span>{/if}
            </button>
          {/each}
        </div>
        <div class="playstyle-row">
          <div><span class="eyebrow">02 / CHOISIS LE RYTHME</span><strong>Comment veux-tu jouer ?</strong></div>
          <div class="segmented-control" role="group" aria-label="Mode de jeu">
            <button type="button" class:chosen={playStyle === 'practice'} aria-pressed={playStyle === 'practice'} onclick={() => (playStyle = 'practice')}><span>∞</span> Entraînement</button>
            <button type="button" class:chosen={playStyle === 'challenge'} aria-pressed={playStyle === 'challenge'} onclick={() => (playStyle = 'challenge')}><span>▲</span> Défi · 3 vies</button>
          </div>
        </div>
      </section>

      <section class="mission-section" aria-labelledby="missions-title">
        <div class="section-heading">
          <div><p class="eyebrow">03 / SÉLECTIONNE UNE MISSION</p><h2 id="missions-title">Quelle est ta prochaine mission ?</h2></div>
          <span class="mission-count">08 MISSIONS DISPONIBLES</span>
        </div>
        <div class="mission-grid">
          {#each MISSIONS as mission}
            <button type="button" class={`mission-card ${mission.theme}`} onclick={() => startMission(mission.id)}>
              <span class="mission-topline"><span class="mission-number">{mission.number}</span><span class="mission-icon" aria-hidden="true">{mission.icon}</span></span>
              <span class="mission-section-label">{mission.section}</span>
              <strong class="mission-title">{mission.title}</strong>
              <span class="mission-subtitle">{mission.subtitle}</span>
              <span class="mission-description">{mission.description}</span>
              <span class="skill-tags">{mission.skills}</span>
              <span class="mission-launch">LANCER LA MISSION <span aria-hidden="true">↗</span></span>
            </button>
          {/each}
        </div>
      </section>

      <details class="accessibility-menu">
        <summary><span>Réglages de confort et d’accessibilité</span><span aria-hidden="true">＋</span></summary>
        <div class="settings-grid">
          <label class="setting-row"><span><strong>Aides visuelles</strong><small>Afficher les indices et les décompositions.</small></span><input type="checkbox" bind:checked={showPlaceHints} /></label>
          <label class="setting-row"><span><strong>Lecture vocale</strong><small>Permet d’écouter la consigne en jeu.</small></span><input type="checkbox" bind:checked={readAloudEnabled} /></label>
          <label class="setting-row"><span><strong>Effets sonores</strong><small>Petits sons facultatifs.</small></span><input type="checkbox" bind:checked={soundEnabled} /></label>
          <label class="setting-row"><span><strong>Animations</strong><small>Désactive les mouvements décoratifs.</small></span><input type="checkbox" bind:checked={animationsEnabled} /></label>
          <label class="setting-row"><span><strong>Mouvements réduits</strong><small>Réduit les animations du tapis roulant.</small></span><input type="checkbox" bind:checked={reduceMotion} /></label>
        </div>
      </details>
    </main>
  {:else}
    <main class="game-view">
      <section class="game-heading">
        <div>
          <p class="eyebrow"><span class="status-dot"></span> MISSION {activeMission.number} · {difficulty.name.toLocaleUpperCase('fr-CH')}</p>
          <h1>{activeMission.title}</h1>
          <p>{activeMission.subtitle}</p>
        </div>
        <div class="score-panel">
          <div><small>POINTS</small><strong>{score}</strong></div>
          <div><small>SÉRIE</small><strong>{streak} <span>×</span></strong></div>
          {#if playStyle === 'challenge'}<div><small>VIES</small><strong>{'◆'.repeat(Math.max(0, lives))}<span class="life-empty">{'◇'.repeat(Math.max(0, 3 - lives))}</span></strong></div>{/if}
        </div>
      </section>

      {#if showOptions}
        <section class="in-game-options" aria-label="Réglages de confort">
          <div class="options-title"><strong>Réglages de confort</strong><button type="button" class="small-close" onclick={() => (showOptions = false)}>Fermer ×</button></div>
          <div class="settings-grid">
            <label class="setting-row"><span><strong>Aides visuelles</strong><small>Décomposition et indices.</small></span><input type="checkbox" bind:checked={showPlaceHints} /></label>
            <label class="setting-row"><span><strong>Lecture vocale</strong><small>Écouter la consigne.</small></span><input type="checkbox" bind:checked={readAloudEnabled} /></label>
            <label class="setting-row"><span><strong>Effets sonores</strong><small>Petits sons facultatifs.</small></span><input type="checkbox" bind:checked={soundEnabled} /></label>
            <label class="setting-row"><span><strong>Animations</strong><small>Mouvements du tapis.</small></span><input type="checkbox" bind:checked={animationsEnabled} /></label>
            <label class="setting-row"><span><strong>Mouvements réduits</strong><small>Réduit les mouvements.</small></span><input type="checkbox" bind:checked={reduceMotion} /></label>
          </div>
          {#if readAloudEnabled}<button type="button" class="secondary-button" onclick={speakPrompt}>▶ Écouter la consigne</button>{/if}
        </section>
      {/if}

      {#if gameOver}
        <section class="game-over-panel">
          <div class="big-symbol">↺</div><p class="eyebrow">FIN DU DÉFI</p><h2>Les vies sont épuisées.</h2><p>Ton score : <strong>{score}</strong>. Tu peux relancer une mission ou choisir un autre niveau.</p>
          <button type="button" class="primary-button" onclick={goToMenu}>Retour au choix de mission</button>
        </section>
      {:else if activeTask}
        <section class="task-card">
          <div class="task-card-top"><span class="task-label">OBJECTIF DE LA LIVRAISON</span><span class="task-step">ESSAI {attemptCount + 1}</span></div>
          <h2>{activeTask.prompt}</h2>
          {#if readAloudEnabled}<button class="listen-button" type="button" onclick={speakPrompt}>▶ Écouter la consigne</button>{/if}

          {#if activeTask.type === 'factory'}
            <div class="target-readout"><span>COMMANDE À PRÉPARER</span><strong>{formatTicks(activeTask.targetTicks)}</strong>{#if showPlaceHints && activeTask.targetWords}<small>{activeTask.targetWords}</small>{/if}</div>
            <section class="conveyor-panel" aria-label="Tapis roulant : touche un élément pour le récupérer">
              <div class="conveyor-caption"><span><i class="live-dot"></i> TAPIS DE COLLECTE</span><small>Touche un élément pour le récupérer</small></div>
              <div class="conveyor-lane">
                <div class="conveyor-track"></div>
                {#if conveyorItems.length === 0}<p class="belt-empty">Le tapis se prépare…</p>{/if}
                {#each conveyorItems as item (item.id)}
                  <button type="button" class={`belt-item rank-${item.key}`} style={beltItemStyle(item)} onanimationend={() => discardConveyorItem(item.id)} onclick={() => collectItem(item)} aria-label={`Récupérer ${PLACE_BY_KEY[item.key].label} : ${beltItemRelation(item.key)}`} title={`${PLACE_BY_KEY[item.key].label} — ${beltItemRelation(item.key)}`}>
                    {#if PLACE_BY_KEY[item.key].exp === 0}
                      <!-- Une unité : un cube concret. -->
                      <span class="belt-visual visual-unit" aria-hidden="true"><i></i></span>
                    {:else if PLACE_BY_KEY[item.key].exp === 1}
                      <!-- Une dizaine : une barre composée de dix unités. -->
                      <span class="belt-visual visual-ten" aria-hidden="true">{#each TEN_BLOCKS as blockIndex (blockIndex)}<i></i>{/each}</span>
                    {:else if PLACE_BY_KEY[item.key].exp === 2}
                      <!-- Une centaine : une plaque de 10 × 10 unités. -->
                      <span class="belt-visual visual-hundred" aria-hidden="true">{#each HUNDRED_BLOCKS as blockIndex (blockIndex)}<i></i>{/each}</span>
                    {:else if PLACE_BY_KEY[item.key].exp === 3}
                      <!-- Un millier : dix plaques de centaine. -->
                      <span class="belt-visual visual-thousand" aria-hidden="true">{#each TEN_BLOCKS as blockIndex (blockIndex)}<i></i>{/each}</span>
                    {:else if PLACE_BY_KEY[item.key].exp > 3}
                      <!-- Grands rangs : dix colis symbolisent dix unités du rang inférieur. -->
                      <span class="belt-visual visual-bundle" aria-hidden="true">{#each TEN_BLOCKS as blockIndex (blockIndex)}<i></i>{/each}</span>
                    {:else}
                      <!-- Un dixième, centième ou millième : une part sur dix du rang supérieur. -->
                      <span class="belt-visual visual-fraction" aria-hidden="true">{#each TEN_BLOCKS as blockIndex (blockIndex)}<i class:part-highlighted={blockIndex === 0}></i>{/each}</span>
                    {/if}
                    <strong class="belt-rank-name">{PLACE_BY_KEY[item.key].label}</strong>
                    <small class="belt-rank-relation">{beltItemRelation(item.key)}</small>
                  </button>
                {/each}
              </div>
              <p class="tap-help">Sur ordinateur : clique. Sur iPad : touche directement le colis.</p>
            </section>

            <div class="factory-workspace">
              <section class="bench-panel">
                <div class="panel-heading"><div><span class="eyebrow">ZONE A</span><h3>Établi de transformation</h3></div><span class="value-chip">Valeur : {formatTicks(workbenchTicks)}</span></div>
                <div class="place-list">
                  {#each activeRanks as place, index}
                    <div class="place-row" class:place-empty={workbench[place.key] === 0}>
                      <div class={`place-token rank-${place.key}`}><span>{place.symbol}</span></div>
                      <div class="place-name"><strong>{place.label}</strong><small>{place.exp >= 0 ? `Valeur : ${formatValue(Math.pow(10, place.exp), 0)}` : `Valeur : ${formatValue(Math.pow(10, place.exp), 3)}`}</small></div>
                      <div class="count-number" aria-label={`${workbench[place.key]} élément(s)`}>{workbench[place.key]}</div>
                      <div class="row-actions">
                        <button type="button" class="icon-button" aria-label={`Décomposer un ${place.label}`} disabled={workbench[place.key] < 1 || index === activeRanks.length - 1} title="Décomposer en 10 unités du rang inférieur" onclick={() => breakRank(place.key)}>↘10</button>
                        <button type="button" class="icon-button" aria-label={`Fusionner 10 ${place.label}`} disabled={workbench[place.key] < 10 || index === 0} title="Fusionner 10 éléments en 1 du rang supérieur" onclick={() => fuseRank(place.key)}>10↗</button>
                        <button type="button" class="transfer-button" disabled={workbench[place.key] < 1} onclick={() => sendToShipment(place.key)}>Mettre 1 dans le colis</button>
                      </div>
                    </div>
                  {/each}
                </div>
                {#if showPlaceHints}
                  <div class="micro-hint"><span>i</span><p><strong>La règle de SHIFT :</strong> 10 éléments d’un rang valent 1 élément du rang juste au-dessus. La valeur totale ne change pas.</p></div>
                {/if}
              </section>
              <section class="shipment-panel">
                <div class="panel-heading"><div><span class="eyebrow">ZONE B</span><h3>Colis à expédier</h3></div><span class="shipment-stamp">À CONTRÔLER</span></div>
                <div class="shipment-box">
                  {#if shipmentTicks === 0}<div class="empty-shipment"><span>＋</span><strong>Le colis est vide</strong><small>Ajoute des éléments depuis l’établi.</small></div>
                  {:else}
                    {#each activeRanks.filter((place) => shipment[place.key] > 0) as place}
                      <button type="button" class={`shipment-item rank-${place.key}`} onclick={() => returnFromShipment(place.key)} title="Toucher pour remettre un élément sur l’établi"><span>{place.short}</span><strong>× {shipment[place.key]}</strong><small>↩ retirer</small></button>
                    {/each}
                  {/if}
                </div>
                <div class="shipment-total"><span>VALEUR DU COLIS</span><strong>{formatTicks(shipmentTicks)}</strong></div>
                <button type="button" class="primary-button ship-button" onclick={submitTask} disabled={!!feedback && feedback.kind === 'success'}>Vérifier et expédier <span aria-hidden="true">↗</span></button>
              </section>
            </div>

          {:else if activeTask.type === 'measure'}
            <div class="conversion-card">
              <span class="conversion-category">{activeTask.familyName.toLocaleUpperCase('fr-CH')}</span>
              <div class="conversion-equation"><strong>{formatValue(activeTask.sourceValue)}</strong><span>{activeTask.fromUnit}</span><b>→</b><div class="conversion-answer"><input bind:value={answerInput} inputmode="decimal" autocomplete="off" aria-label={`Mesure convertie en ${activeTask.toUnit}`} placeholder="?" onkeydown={(event) => event.key === 'Enter' && submitTask()} /><span>{activeTask.toUnit}</span></div></div>
              <div class="measure-ladder" aria-label="Échelle des unités">
                {#each MEASURE_UNITS[activeTask.familyName] as unit, index}
                  <span class:unit-active={unit.name === activeTask.fromUnit || unit.name === activeTask.toUnit}>{unit.name}</span>{#if index < MEASURE_UNITS[activeTask.familyName].length - 1}<i>·</i>{/if}
                {/each}
              </div>
              {#if showPlaceHints}<p class="support-note">{activeTask.hint}</p>{/if}
              <button type="button" class="primary-button submit-wide" onclick={submitTask}>Vérifier ma conversion <span>↗</span></button>
            </div>

          {:else if activeTask.type === 'words'}
            <div class="word-task-card">
              {#if activeTask.direction === 'toWords'}
                <span class="task-label">ÉCRITURE CHIFFRÉE</span><strong class="word-target-number">{formatValue(activeTask.number, 0)}</strong>
                <label class="answer-label" for="word-answer">Écris le nombre en toutes lettres</label>
                <input id="word-answer" class="text-answer" bind:value={answerInput} autocomplete="off" placeholder="ex. deux cent trente…" onkeydown={(event) => event.key === 'Enter' && submitTask()} />
              {:else}
                <span class="task-label">MOT-NOMBRE</span><strong class="word-target-text">{numberToSwissText(activeTask.number)}</strong>
                <label class="answer-label" for="digits-answer">Écris le nombre en chiffres</label>
                <input id="digits-answer" class="text-answer" bind:value={answerInput} inputmode="numeric" autocomplete="off" placeholder="ex. 2’345" onkeydown={(event) => event.key === 'Enter' && submitTask()} />
              {/if}
              {#if showPlaceHints}<p class="support-note">Lis le nombre par blocs de trois chiffres : unités, milliers, millions, milliards.</p>{/if}
              <button type="button" class="primary-button submit-wide" onclick={submitTask}>Vérifier ma réponse <span>↗</span></button>
            </div>

          {:else if activeTask.type === 'decompose'}
            <div class="decomposition-task">
              <div class="decomp-target"><span>NOMBRE À DÉCOMPOSER</span><strong>{activeTask.asWords ? activeTask.targetWords : formatTicks(activeTask.targetTicks)}</strong></div>
              <div class="decomp-grid">
                {#each activeRanks as place}
                  <label class={`decomp-cell rank-${place.key}`}><span>{place.short}</span><strong>{place.label}</strong><input type="number" min="0" max="9" inputmode="numeric" bind:value={decompositionInputs[place.key]} aria-label={`Chiffre des ${place.label}`} /></label>
                {/each}
              </div>
              {#if showPlaceHints}<p class="support-note">Chaque case reçoit un seul chiffre, de 0 à 9. Les rangs vides sont écrits avec un zéro.</p>{/if}
              <button type="button" class="primary-button submit-wide" onclick={submitTask}>Vérifier la décomposition <span>↗</span></button>
            </div>

          {:else if activeTask.type === 'sort'}
            <div class="sort-task-card">
              <div class="sort-pool">
                {#each activeTask.values as value}
                  {#if !selectedOrder.includes(value)}<button type="button" class="sort-value" onclick={() => chooseOrderValue(value)}>{formatTicks(value)} <span>＋</span></button>{/if}
                {/each}
              </div>
              <div class="sort-order-zone"><span class="task-label">TON ORDRE CROISSANT</span>
                {#if selectedOrder.length === 0}<p class="muted-text">Appuie sur le plus petit nombre, puis continue.</p>{/if}
                <div class="selected-sequence">
                  {#each selectedOrder as value, index}<button type="button" class="sequence-value" onclick={() => undoOrderChoice(index)} aria-label={`Retirer ${formatTicks(value)} de l’ordre`}>{index + 1}. {formatTicks(value)} <span>×</span></button>{/each}
                </div>
              </div>
              <button type="button" class="primary-button submit-wide" disabled={selectedOrder.length !== activeTask.values.length} onclick={submitTask}>Vérifier l’ordre <span>↗</span></button>
            </div>

          {:else if activeTask.type === 'line'}
            <div class="number-line-task">
              <div class="line-target-number">
                {#if activeTask.direction === 'place'}<span>NOMBRE À PLACER</span><strong>{formatValue(activeTask.target, 3)}</strong>
                {:else}<span>NOMBRE À LIRE</span><strong>?</strong>{/if}
              </div>
              <div class="number-line-visual">
                <div class="line-endpoints"><span>{formatValue(activeTask.start, 3)}</span><span>{formatValue(activeTask.end, 3)}</span></div>
                <div class="number-line-track">
                  {#each LINE_TICKS as tick}
                    <div class="line-tick" class:major-tick={tick % 10 === 0} style={`left:${tick}%`}></div>
                  {/each}
                  <div class="line-marker" style={`left:${activeTask.direction === 'read' ? activeTask.offset : lineGuess}%`}></div>
                  <div class="line-value-bubble" style={`left:${activeTask.direction === 'read' ? activeTask.offset : lineGuess}%`}>{activeTask.direction === 'read' ? '?' : formatValue(activeTask.start + (activeTask.end - activeTask.start) * lineGuess / 100, 3)}</div>
                </div>
                {#if activeTask.direction === 'place'}
                  <input class="line-slider" type="range" min="0" max="100" step="5" bind:value={lineGuess} aria-label="Position sur la droite graduée" />
                {:else}
                  <label class="answer-label line-read-answer" for="line-read-answer">Écris la valeur indiquée</label>
                  <div class="rank-answer"><input id="line-read-answer" bind:value={answerInput} inputmode="decimal" autocomplete="off" aria-label="Valeur indiquée sur la droite graduée" placeholder="Valeur" onkeydown={(event) => event.key === 'Enter' && submitTask()} /></div>
                {/if}
              </div>
              <p class="support-note">{activeTask.direction === 'place' ? 'Déplace le curseur ou utilise les flèches du clavier pour placer ton repère.' : 'Utilise les bornes et les graduations pour estimer la valeur du repère.'}</p>
              <button type="button" class="primary-button submit-wide" onclick={submitTask}>Vérifier la réponse <span>↗</span></button>
            </div>

          {:else if activeTask.type === 'rank'}
            <div class="rank-task-card"><div class="rank-target"><span>NOMBRE À ANALYSER</span><strong>{formatTicks(activeTask.targetTicks)}</strong></div><p class="rank-question">{activeTask.prompt}</p><div class="rank-answer"><input bind:value={answerInput} inputmode="numeric" autocomplete="off" aria-label="Nombre de groupes entiers" placeholder="?" onkeydown={(event) => event.key === 'Enter' && submitTask()} /><button type="button" class="primary-button" onclick={submitTask}>Vérifier</button></div>{#if showPlaceHints}<p class="support-note">Exemple : 4’387 contient 438 dizaines entières, mais le chiffre des dizaines est 8.</p>{/if}</div>

          {:else if activeTask.type === 'build'}
            <div class="build-task-card">
              {#if activeTask.condition === 'between'}
                <span class="task-label">ZONE À ATTEINDRE</span>
                <div class="between-targets"><strong>{formatValue(activeTask.lower, 3)}</strong><span>À L’INTÉRIEUR DE LA ZONE</span><strong>{formatValue(activeTask.upper, 3)}</strong></div>
              {:else}
                <span class="task-label">POINT DE DÉPART</span><strong class="build-target">{formatValue(activeTask.number, 3)}</strong>
                <div class="build-direction" class:direction-up={activeTask.direction === 'greater'}><span>{activeTask.direction === 'greater' ? '↑' : '↓'}</span><strong>{activeTask.direction === 'greater' ? 'PLUS GRAND QUE' : 'PLUS PETIT QUE'}</strong></div>
              {/if}
              <label class="answer-label" for="build-answer">Propose ton nombre</label><div class="rank-answer"><input id="build-answer" bind:value={answerInput} inputmode="decimal" autocomplete="off" placeholder="Ton nombre" onkeydown={(event) => event.key === 'Enter' && submitTask()} /><button type="button" class="primary-button" onclick={submitTask}>Vérifier</button></div>{#if showPlaceHints}<p class="support-note">Ton nombre doit respecter la consigne. Pour une zone, les deux bornes sont exclues.</p>{/if}
            </div>
          {/if}

          {#if feedback}
            <section class={`feedback-panel ${feedback.kind}`} role="status" aria-live="polite">
              <span class="feedback-symbol" aria-hidden="true">{feedback.kind === 'success' ? '✓' : '↻'}</span>
              <div><strong>{feedback.title}</strong><p>{feedback.message}</p>{#if feedback.hint && showPlaceHints}<p class="feedback-hint">{feedback.hint}</p>{/if}</div>
              {#if feedback.kind === 'success'}<button type="button" class="primary-button feedback-next" onclick={submitNext}>Question suivante <span>→</span></button>{:else if !gameOver}<button type="button" class="secondary-button feedback-retry" onclick={() => (feedback = null)}>Je réessaie</button>{/if}
            </section>
          {/if}
        </section>
      {/if}
      <footer class="game-footer"><span>SHIFT / CENTRE DE CONTRÔLE</span><span>{activeMission.skills}</span><button type="button" onclick={goToMenu}>Changer de mission ↗</button></footer>
    </main>
  {/if}

  <div class="sr-only" aria-live="polite" aria-atomic="true">{announceText}</div>
  <footer class="site-footer"><span>SHIFT<span class="brand-dot">.</span> — Atelier des quantités</span><span>Unité · échange · valeur</span><a href={`${base}/`}>Retour à Orbis ↗</a></footer>
</div>

<style>
  :global(html) { background: #0c1013; color-scheme: dark; }
  :global(body) { margin: 0; background: #0c1013; }
  :global(*) { box-sizing: border-box; }
  :global(button), :global(input), :global(select) { font: inherit; }
  :global(button) { -webkit-tap-highlight-color: transparent; }

  .app-shell {
    --bg: #0c1013;
    --panel: #131a1f;
    --panel-soft: #182127;
    --line: #2c383f;
    --text: #eef2ed;
    --muted: #a4b0b4;
    --subtle: #718087;
    --mint: #abf36f;
    --blue: #73d9ff;
    --amber: #ffc66b;
    --violet: #c1a2ff;
    --pink: #ff97bd;
    color: var(--text);
    background: radial-gradient(ellipse at 78% 3%, rgba(79, 130, 106, .15), transparent 35%), var(--bg);
    min-height: 100dvh;
    font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 16px;
    line-height: 1.45;
    overflow-x: hidden;
  }
  .app-shell button, .app-shell a, .app-shell input { outline-offset: 3px; }
  .app-shell button:focus-visible, .app-shell a:focus-visible, .app-shell input:focus-visible, .app-shell summary:focus-visible { outline: 3px solid var(--mint); }
  .topbar { min-height: 76px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 0 clamp(18px, 4vw, 60px); border-bottom: 1px solid rgba(255,255,255,.08); background: rgba(10, 14, 17, .85); gap: 24px; }
  .orbis-link { display: inline-flex; align-items: center; gap: 9px; color: #e8efeb; text-decoration: none; letter-spacing: .16em; font-size: 12px; font-weight: 800; justify-self: start; }
  .orbis-mark { display: grid; place-items: center; width: 28px; height: 28px; border: 1px solid #5f7769; color: var(--mint); border-radius: 9px 3px 9px 3px; font-size: 15px; }
  .brand-lockup { text-align: center; line-height: 1; }
  .brand-lockup strong { display: block; font-size: 25px; letter-spacing: .24em; font-weight: 900; margin-top: 5px; }
  .brand-kicker { color: #91a09f; font-size: 8px; letter-spacing: .16em; }
  .brand-dot { color: var(--mint); }
  .top-actions { justify-self: end; display: flex; align-items: center; gap: 10px; }
  .mode-pill { font-size: 9px; letter-spacing: .1em; color: var(--mint); border: 1px solid #456345; padding: 7px 9px; border-radius: 99px; font-weight: 800; }
  .quiet-button { color: #d6dfdb; background: #172026; border: 1px solid #354249; border-radius: 9px; padding: 10px 13px; cursor: pointer; text-decoration: none; font-size: 12px; font-weight: 700; transition: border-color .16s, background .16s; }
  .quiet-button:hover { border-color: #79958a; background: #202d32; }
  .top-return { justify-self: end; }
  .menu-view, .game-view { width: min(1360px, calc(100% - 48px)); margin: 0 auto; }
  .menu-view { padding: 34px 0 55px; }
  .hero-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(340px, .85fr); align-items: center; gap: clamp(26px, 6vw, 90px); padding: 42px 0 50px; min-height: 365px; }
  .eyebrow { margin: 0 0 11px; color: var(--mint); font-size: 10px; font-weight: 800; letter-spacing: .16em; }
  .status-dot, .live-dot { display: inline-block; width: 7px; height: 7px; background: var(--mint); border-radius: 50%; box-shadow: 0 0 0 4px rgba(171,243,111,.1); margin-right: 8px; }
  h1, h2, h3, p { margin-top: 0; }
  .hero-copy h1 { margin: 0 0 20px; font-size: clamp(44px, 6vw, 84px); line-height: .98; letter-spacing: -.065em; font-weight: 850; }
  .hero-copy h1 span { color: var(--mint); }
  .hero-description { max-width: 540px; color: #aebbb9; font-size: clamp(15px, 1.5vw, 18px); line-height: 1.7; margin-bottom: 26px; }
  .hero-meta { display: flex; align-items: center; gap: 11px; color: #83938f; letter-spacing: .13em; font-size: 9px; font-weight: 800; }
  .meta-line { width: 36px; height: 2px; background: var(--mint); }
  .hero-visual { position: relative; min-height: 300px; overflow: hidden; border: 1px solid #2b3c38; border-radius: 18px; background: linear-gradient(145deg, #192b28 0%, #111b20 55%, #182127 100%); box-shadow: inset 0 0 50px rgba(0,0,0,.2); }
  .visual-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(151,211,174,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(151,211,174,.08) 1px, transparent 1px); background-size: 28px 28px; mask-image: linear-gradient(135deg, black, transparent 85%); }
  .visual-scan { position: absolute; top: 35px; bottom: 35px; left: 55%; width: 1px; background: #9bf16d; box-shadow: 0 0 22px 5px rgba(171,243,111,.14); }
  .cargo { position: absolute; display: grid; place-items: center; border: 1px solid rgba(171,243,111,.8); background: linear-gradient(140deg, rgba(171,243,111,.22), rgba(171,243,111,.045)); box-shadow: 0 12px 45px rgba(0,0,0,.2); color: var(--mint); }
  .cargo-large { width: 150px; height: 150px; right: 14%; top: 45px; transform: rotate(8deg); border-radius: 20px; font-size: 42px; font-weight: 800; }
  .cargo-mid { width: 94px; height: 94px; left: 18%; top: 125px; transform: rotate(-10deg); border-radius: 15px; color: var(--blue); border-color: rgba(115,217,255,.8); background: rgba(115,217,255,.10); font-size: 26px; font-weight: 800; }
  .cargo-small { width: 52px; height: 52px; right: 22%; bottom: 28px; border-radius: 11px; color: var(--amber); border-color: rgba(255,198,107,.8); background: rgba(255,198,107,.1); font-size: 22px; }
  .cargo i { position: absolute; height: 1px; background: currentColor; opacity: .5; width: 60%; left: 20%; }
  .cargo i:nth-child(2) { top: 31%; }.cargo i:nth-child(3) { top: 43%; }.cargo i:nth-child(4) { top: 55%; }.cargo i:nth-child(5) { top: 67%; }
  .visual-label { position: absolute; color: #9aada5; font-size: 8px; letter-spacing: .16em; font-weight: 800; }.label-top { top: 18px; left: 18px; }.label-bottom { bottom: 18px; left: 18px; color: var(--mint); }
  .visual-cross { position: absolute; color: #8fa59b; font-size: 16px; font-weight: 700; }.cross-one { top: 38%; left: 47%; }.cross-two { bottom: 23%; left: 41%; font-size: 11px; color: var(--mint); }
  .setup-panel, .mission-section { border-top: 1px solid var(--line); padding-top: 26px; }
  .section-heading { display: flex; justify-content: space-between; align-items: end; gap: 24px; margin-bottom: 21px; }
  .section-heading h2 { margin: 0; font-size: clamp(23px, 3vw, 32px); line-height: 1.2; letter-spacing: -.04em; }
  .section-heading > p, .section-heading > div + p { color: var(--muted); font-size: 12px; max-width: 300px; margin: 0 0 2px; }
  .compact-heading { align-items: start; }
  .difficulty-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 11px; }
  .difficulty-card { position: relative; display: flex; flex-direction: column; align-items: start; text-align: left; gap: 7px; min-height: 106px; background: #131a1f; border: 1px solid #2d3a40; border-radius: 12px; padding: 16px 18px; color: var(--text); cursor: pointer; transition: transform .15s ease, border-color .15s, background .15s; }
  .difficulty-card:hover { transform: translateY(-2px); border-color: #678370; }
  .difficulty-card.chosen { border-color: var(--mint); background: linear-gradient(140deg, rgba(171,243,111,.13), #141c20 75%); box-shadow: inset 0 0 0 1px rgba(171,243,111,.15); }
  .difficulty-index { color: #82918e; font-size: 9px; letter-spacing: .1em; font-weight: 800; }.difficulty-card strong { font-size: 14px; }.difficulty-card > span:last-of-type { color: #9aa9a7; font-size: 11px; }
  .selected-check { position: absolute; top: 14px; right: 15px; width: 21px; height: 21px; display: grid; place-items: center; border-radius: 50%; background: var(--mint); color: #0d1710; font-size: 11px; font-weight: 900; }
  .playstyle-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; border-top: 1px solid #243037; margin-top: 17px; padding-top: 19px; }
  .playstyle-row > div:first-child { display: flex; flex-direction: column; gap: 2px; }.playstyle-row .eyebrow { margin-bottom: 0; }.playstyle-row strong { font-size: 13px; }
  .segmented-control { display: flex; gap: 5px; padding: 4px; border: 1px solid #303e44; border-radius: 11px; background: #10171b; }
  .segmented-control button { border: 1px solid transparent; border-radius: 8px; background: transparent; color: #aab6b5; padding: 10px 14px; font-size: 12px; font-weight: 700; cursor: pointer; }.segmented-control button span { margin-right: 5px; }.segmented-control button.chosen { background: #29372f; border-color: #5a7a50; color: var(--mint); }
  .mission-section { margin-top: 41px; }.mission-count { font-size: 9px; letter-spacing: .12em; color: #94a29f; border: 1px solid #34434a; border-radius: 99px; padding: 8px 11px; white-space: nowrap; }
  .mission-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 13px; }
  .mission-card { display: flex; flex-direction: column; align-items: flex-start; text-align: left; min-height: 300px; padding: 19px; border: 1px solid #2a383e; border-radius: 13px; background: linear-gradient(160deg, #172126, #11181c 72%); color: var(--text); cursor: pointer; transition: transform .16s ease, border-color .16s, background .16s; }
  .mission-card:hover { transform: translateY(-3px); border-color: var(--mission-accent, var(--mint)); background: linear-gradient(160deg, #202c30, #11181c 78%); }
  .mission-card.mint { --mission-accent: var(--mint); }.mission-card.blue { --mission-accent: var(--blue); }.mission-card.amber { --mission-accent: var(--amber); }.mission-card.violet { --mission-accent: var(--violet); }.mission-card.pink { --mission-accent: var(--pink); }
  .mission-topline { width: 100%; display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }.mission-number { font-size: 10px; letter-spacing: .12em; color: #8c9d9a; }.mission-icon { display: grid; place-items: center; width: 39px; height: 39px; border: 1px solid color-mix(in srgb, var(--mission-accent), transparent 52%); border-radius: 11px; color: var(--mission-accent); background: color-mix(in srgb, var(--mission-accent), transparent 92%); font-weight: 850; font-size: 16px; }
  .mission-section-label { color: var(--mission-accent); font-weight: 800; text-transform: uppercase; font-size: 8px; letter-spacing: .15em; margin-bottom: 9px; }.mission-title { font-size: 18px; line-height: 1.2; letter-spacing: -.03em; margin-bottom: 8px; }.mission-subtitle { font-size: 12px; color: #c1ccca; line-height: 1.45; margin-bottom: 10px; }.mission-description { font-size: 11px; line-height: 1.6; color: #94a3a1; margin-bottom: 16px; }.skill-tags { margin-top: auto; padding-top: 10px; border-top: 1px solid #29353a; width: 100%; font-size: 9px; line-height: 1.45; color: #b0bfba; }.mission-launch { width: 100%; margin-top: 15px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; font-weight: 900; letter-spacing: .1em; color: var(--mission-accent); }
  .accessibility-menu { margin-top: 32px; border: 1px solid #2b393f; border-radius: 12px; background: #121a1e; }.accessibility-menu summary { padding: 17px 19px; list-style: none; display: flex; align-items: center; justify-content: space-between; gap: 16px; cursor: pointer; color: #dae4df; font-size: 13px; font-weight: 700; }.accessibility-menu summary::-webkit-details-marker { display: none; }.accessibility-menu summary span:last-child { color: var(--mint); font-size: 20px; }.accessibility-menu[open] summary { border-bottom: 1px solid #2b393f; }
  .settings-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 20px; padding: 4px 18px 10px; }.setting-row { display: flex; justify-content: space-between; gap: 18px; align-items: center; border-bottom: 1px solid #26333a; padding: 13px 0; cursor: pointer; }.setting-row:last-child { border-bottom: 0; }.setting-row span { display: flex; flex-direction: column; gap: 3px; }.setting-row strong { font-size: 12px; }.setting-row small { color: #91a09e; font-size: 10px; }.setting-row input { width: 20px; height: 20px; accent-color: var(--mint); flex: 0 0 auto; }

  .game-view { min-height: calc(100dvh - 140px); padding: 29px 0 35px; }
  .game-heading { display: flex; justify-content: space-between; align-items: end; gap: 25px; margin-bottom: 23px; }.game-heading h1 { margin: 0 0 7px; font-size: clamp(30px, 4vw, 43px); letter-spacing: -.05em; }.game-heading p:not(.eyebrow) { color: #9eaeaa; font-size: 13px; margin: 0; }.score-panel { display: flex; align-items: center; gap: 25px; padding: 13px 17px; border: 1px solid #2b393f; border-radius: 12px; background: #121a1f; flex: 0 0 auto; }.score-panel > div { display: flex; flex-direction: column; gap: 3px; }.score-panel small { color: #8b9c99; font-size: 8px; letter-spacing: .13em; font-weight: 800; }.score-panel strong { font-size: 21px; line-height: 1.1; }.score-panel strong span { color: var(--mint); font-size: 12px; }.life-empty { color: #617078; }
  .task-card { border: 1px solid #2a393f; border-radius: 16px; background: linear-gradient(145deg, #151e23, #10171b); padding: clamp(18px, 3vw, 32px); box-shadow: 0 20px 60px rgba(0,0,0,.11); }
  .task-card-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 11px; }.task-label { color: var(--mint); font-size: 9px; letter-spacing: .14em; font-weight: 900; }.task-step { color: #9baba7; font-size: 9px; letter-spacing: .12em; border: 1px solid #3a494e; border-radius: 99px; padding: 6px 9px; }.task-card > h2 { font-size: clamp(20px, 2.5vw, 28px); line-height: 1.25; margin: 0 0 19px; letter-spacing: -.03em; }.listen-button { background: transparent; color: #b9d3c7; border: 1px solid #42614f; padding: 7px 10px; border-radius: 8px; font-size: 11px; cursor: pointer; margin: -8px 0 17px; }
  .target-readout { display: flex; align-items: baseline; gap: 13px; flex-wrap: wrap; margin: 0 0 22px; padding: 16px 19px; border: 1px solid #556c4b; border-radius: 11px; background: linear-gradient(110deg, rgba(171,243,111,.105), rgba(171,243,111,.025)); }.target-readout > span { color: #a8be9f; font-size: 9px; letter-spacing: .15em; font-weight: 850; }.target-readout strong { font-size: clamp(30px, 4vw, 43px); letter-spacing: -.05em; color: var(--mint); line-height: 1; }.target-readout small { width: 100%; color: #b4c3b3; font-size: 13px; margin-top: 4px; }
  .conveyor-panel { margin-bottom: 20px; border: 1px solid #2c3e43; border-radius: 12px; background: #0d1519; overflow: hidden; }.conveyor-caption { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 11px 15px; border-bottom: 1px solid #26383d; color: #c0cdc8; font-size: 9px; font-weight: 850; letter-spacing: .11em; }.conveyor-caption small { color: #82928f; letter-spacing: 0; font-weight: 500; font-size: 10px; }.live-dot { width: 6px; height: 6px; margin-right: 8px; }
  .conveyor-lane { position: relative; height: 145px; overflow: hidden; background: repeating-linear-gradient(90deg, transparent 0 45px, rgba(150,190,174,.05) 45px 46px), linear-gradient(180deg, #111c20, #0d1418); }
  .conveyor-track { position: absolute; height: 22px; left: 0; right: 0; bottom: 13px; border-top: 2px solid #42544e; border-bottom: 2px solid #253830; background: repeating-linear-gradient(90deg, #1e302b 0 19px, #13211d 19px 38px); }
  .belt-empty { position: absolute; inset: 0; display: grid; place-items: center; color: #6b7e7a; font-size: 12px; pointer-events: none; }
  .belt-item { position: absolute; left: -150px; width: 136px; min-width: 136px; height: 94px; padding: 5px 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; border: 1px solid var(--rank-color, #688b62); border-radius: 9px; color: var(--rank-color, var(--mint)); background: linear-gradient(145deg, #283d2d, #132019); cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,.3); animation: drift var(--drift-duration, 28s) linear forwards; touch-action: manipulation; }
  .belt-item:hover { border-color: #d3ffad; box-shadow: 0 0 0 2px rgba(171,243,111,.16); }
  .belt-visual { display: flex; flex: 0 0 auto; align-items: center; justify-content: center; height: 36px; color: var(--rank-color, var(--mint)); }
  .belt-visual i { display: block; box-sizing: border-box; background: color-mix(in srgb, var(--rank-color, var(--mint)), #17221e 35%); border: 1px solid var(--rank-color, var(--mint)); }
  .visual-unit { width: 25px; height: 25px; background: linear-gradient(135deg, color-mix(in srgb, var(--rank-color, var(--mint)), white 22%) 0 17%, transparent 17% 100%); }
  .visual-unit i { width: 22px; height: 22px; border-radius: 3px; box-shadow: inset -4px -4px 0 rgba(0,0,0,.18), 2px 2px 0 rgba(0,0,0,.2); }
  .visual-ten { width: 77px; height: 17px; display: grid; grid-template-columns: repeat(10, 1fr); gap: 1px; }
  .visual-ten i { height: 16px; border-radius: 1px; }
  .visual-hundred { width: 40px; height: 40px; display: grid; grid-template-columns: repeat(10, 1fr); grid-template-rows: repeat(10, 1fr); gap: 1px; }
  .visual-hundred i { min-width: 0; min-height: 0; border-radius: .5px; }
  .visual-thousand, .visual-bundle { width: 49px; height: 35px; display: grid; grid-template-columns: repeat(5, 1fr); grid-template-rows: repeat(2, 1fr); gap: 3px; }
  .visual-thousand i { border-radius: 2px; background: repeating-linear-gradient(0deg, color-mix(in srgb, var(--rank-color, var(--mint)), #17221e 35%) 0 2px, color-mix(in srgb, var(--rank-color, var(--mint)), white 10%) 2px 3px); }
  .visual-bundle i { position: relative; border-radius: 3px; box-shadow: inset 0 0 0 2px rgba(0,0,0,.15); }
  .visual-bundle i::after { content: ''; position: absolute; inset: 3px; border: 1px solid color-mix(in srgb, var(--rank-color, var(--mint)), white 20%); border-radius: 1px; }
  .visual-fraction { width: 78px; height: 14px; display: grid; grid-template-columns: repeat(10, 1fr); gap: 2px; }
  .visual-fraction i { height: 13px; border-radius: 1px; opacity: .45; }
  .visual-fraction i.part-highlighted { opacity: 1; background: var(--rank-color); box-shadow: 0 0 6px color-mix(in srgb, var(--rank-color), transparent 25%); }
  .belt-rank-name { display: block; width: 100%; min-height: 10px; max-height: 19px; overflow: hidden; text-align: center; font-size: 9px; line-height: 1.05; font-weight: 900; }
  .belt-rank-relation { display: block; width: 100%; min-height: 10px; max-height: 18px; overflow: hidden; text-align: center; font-size: 8px; line-height: 1.05; font-weight: 650; color: #e0e9e1; }
  .rank-hundredBillion, .rank-tenBillion, .rank-billion, .rank-hundredMillion, .rank-tenMillion, .rank-million, .rank-hundredThousand, .rank-tenThousand, .rank-thousand, .rank-hundred, .rank-ten, .rank-unit { --rank-color: #a8f27b; }
  .rank-tenth { --rank-color: #73d9ff; }.rank-hundredth { --rank-color: #c0a4ff; }.rank-thousandth { --rank-color: #ffc66b; }
  .tap-help { margin: 0; padding: 8px 14px 10px; font-size: 10px; color: #849692; border-top: 1px solid #1e2b30; }
  @keyframes drift { from { transform: translateX(0); } to { transform: translateX(calc(100vw + 280px)); } }
  .factory-workspace { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(280px, .7fr); gap: 15px; align-items: stretch; }.bench-panel, .shipment-panel { border: 1px solid #2a393f; border-radius: 12px; background: #131c21; padding: 18px; min-width: 0; }.panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 13px; }.panel-heading .eyebrow { font-size: 8px; margin-bottom: 5px; }.panel-heading h3 { margin: 0; font-size: 17px; letter-spacing: -.03em; }.value-chip, .shipment-stamp { white-space: nowrap; color: #b8c7c0; background: #1c292d; border: 1px solid #35484a; border-radius: 8px; padding: 7px 9px; font-size: 10px; }.shipment-stamp { color: var(--amber); border-color: #6d5537; background: rgba(255,198,107,.06); letter-spacing: .1em; font-size: 8px; font-weight: 850; }
  .place-list { display: flex; flex-direction: column; }.place-row { display: grid; grid-template-columns: 37px minmax(104px, .9fr) 40px minmax(0, 1.7fr); gap: 10px; align-items: center; padding: 10px 0; border-top: 1px solid #26343a; }.place-empty { opacity: .78; }.place-token { display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid color-mix(in srgb, var(--rank-color), transparent 45%); border-radius: 9px; background: color-mix(in srgb, var(--rank-color), transparent 92%); color: var(--rank-color); font-size: 17px; font-weight: 850; }.place-name { display: flex; flex-direction: column; gap: 1px; min-width: 0; }.place-name strong { font-size: 11px; line-height: 1.25; }.place-name small { color: #8c9c98; font-size: 9px; }.count-number { min-width: 33px; text-align: center; font-size: 21px; font-weight: 850; font-variant-numeric: tabular-nums; color: var(--text); }.row-actions { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 5px; }.icon-button, .transfer-button { min-height: 31px; border: 1px solid #41514f; border-radius: 7px; color: #dce6df; background: #1a2629; cursor: pointer; padding: 5px 7px; font-size: 9px; font-weight: 800; }.icon-button { color: var(--mint); min-width: 41px; }.icon-button:disabled, .transfer-button:disabled { opacity: .28; cursor: not-allowed; }.transfer-button { color: #1b2418; background: var(--mint); border-color: var(--mint); }.transfer-button:disabled { color: #b7c1bb; background: #3a4742; border-color: #3a4742; }
  .micro-hint { display: flex; gap: 10px; align-items: flex-start; padding: 11px 12px; margin-top: 14px; background: #1a2725; border: 1px solid #334b3d; border-radius: 9px; }.micro-hint > span { display: grid; place-items: center; flex: 0 0 18px; height: 18px; border-radius: 50%; background: var(--mint); color: #172218; font-size: 11px; font-weight: 900; }.micro-hint p { font-size: 10px; color: #b7c7bb; line-height: 1.55; margin: 0; }.micro-hint strong { color: #dbefd0; }
  .shipment-panel { display: flex; flex-direction: column; }.shipment-box { flex: 1; min-height: 220px; border: 1px dashed #53615d; border-radius: 10px; background: repeating-linear-gradient(135deg, rgba(255,255,255,.015) 0 7px, transparent 7px 14px), #10171a; display: flex; align-content: flex-start; align-items: flex-start; flex-wrap: wrap; gap: 8px; padding: 12px; }.empty-shipment { width: 100%; align-self: center; display: flex; align-items: center; flex-direction: column; text-align: center; gap: 5px; color: #84948f; }.empty-shipment > span { display: grid; place-items: center; width: 42px; height: 42px; border: 1px solid #374540; border-radius: 12px; font-size: 24px; color: var(--mint); margin-bottom: 3px; }.empty-shipment strong { color: #b8c6c0; font-size: 12px; }.empty-shipment small { font-size: 10px; }.shipment-item { display: flex; flex-direction: column; min-width: 76px; gap: 3px; border: 1px solid color-mix(in srgb, var(--rank-color), transparent 55%); border-radius: 8px; padding: 8px 10px; background: color-mix(in srgb, var(--rank-color), transparent 93%); color: var(--rank-color); cursor: pointer; text-align: left; }.shipment-item span { font-size: 10px; font-weight: 900; }.shipment-item strong { font-size: 12px; }.shipment-item small { color: #9ba9a5; font-size: 9px; }.shipment-total { display: flex; justify-content: space-between; gap: 15px; align-items: baseline; padding: 17px 0 14px; }.shipment-total span { font-size: 9px; font-weight: 850; letter-spacing: .13em; color: #94a49f; }.shipment-total strong { font-size: 27px; letter-spacing: -.04em; }.primary-button { display: inline-flex; justify-content: center; align-items: center; gap: 15px; min-height: 45px; padding: 12px 18px; border: 1px solid var(--mint); border-radius: 9px; background: var(--mint); color: #162016; font-size: 12px; font-weight: 900; cursor: pointer; transition: transform .12s ease, background .12s ease; }.primary-button:hover { transform: translateY(-1px); background: #c4ff97; }.primary-button:disabled { opacity: .42; cursor: not-allowed; transform: none; }.ship-button { width: 100%; margin-top: auto; }
  .conversion-card, .word-task-card, .decomposition-task, .sort-task-card, .number-line-task, .rank-task-card, .build-task-card { max-width: 850px; margin: 25px auto 0; padding: clamp(22px, 4vw, 42px); border: 1px solid #33423f; border-radius: 14px; background: linear-gradient(145deg, #192522, #121a1e 80%); }.conversion-category { display: inline-flex; margin-bottom: 18px; padding: 7px 10px; border-radius: 99px; background: #25362c; color: var(--mint); font-size: 9px; letter-spacing: .13em; font-weight: 900; }.conversion-equation { display: grid; grid-template-columns: 1fr auto 35px minmax(0, 1.1fr); gap: 15px; align-items: center; }.conversion-equation > strong { font-size: clamp(37px, 5vw, 62px); letter-spacing: -.05em; }.conversion-equation > span { font-size: 19px; color: #aebbb5; }.conversion-equation > b { color: var(--mint); font-size: 25px; text-align: center; }.conversion-answer { display: flex; align-items: center; gap: 10px; }.conversion-answer input, .rank-answer input { width: 100%; min-width: 0; background: #0b1215; color: #f0f7f1; border: 1px solid #4a6252; border-radius: 9px; padding: 14px 13px; font-size: clamp(22px, 3vw, 34px); font-weight: 800; text-align: center; }.conversion-answer span { font-size: 18px; color: var(--mint); }.measure-ladder { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 30px; border-top: 1px solid #304039; padding-top: 16px; color: #8da09a; font-size: 12px; }.measure-ladder span { flex: 1; text-align: center; padding: 7px 2px; border-radius: 6px; }.measure-ladder i { color: #536760; font-style: normal; }.measure-ladder .unit-active { color: var(--mint); background: #283a2b; outline: 1px solid #58774f; font-weight: 850; }.support-note { color: #9dacaa; background: rgba(116,153,128,.08); border-left: 2px solid #708f7d; padding: 10px 13px; font-size: 11px; line-height: 1.6; margin: 22px 0 0; }.submit-wide { margin-top: 20px; width: 100%; }
  .word-task-card { display: flex; flex-direction: column; align-items: center; text-align: center; }.word-target-number { font-size: clamp(38px, 7vw, 64px); color: var(--mint); letter-spacing: -.06em; margin: 8px 0 22px; }.word-target-text { font-size: clamp(24px, 4vw, 42px); color: var(--mint); line-height: 1.25; margin: 8px 0 22px; overflow-wrap: anywhere; }.answer-label { width: 100%; text-align: left; max-width: 620px; color: #b4c5bd; font-size: 12px; margin-bottom: 8px; font-weight: 800; }.text-answer { width: 100%; max-width: 620px; border: 1px solid #455c4d; background: #0b1215; border-radius: 9px; padding: 14px 16px; color: #eef5ef; font-size: 16px; }.word-task-card .support-note { width: 100%; text-align: left; }
  .decomp-target, .rank-target { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding-bottom: 18px; border-bottom: 1px solid #33423d; margin-bottom: 20px; }.decomp-target span, .rank-target span, .line-target-number span { color: #a5b6ad; font-size: 9px; letter-spacing: .13em; font-weight: 850; }.decomp-target strong, .rank-target strong, .line-target-number strong { color: var(--mint); font-size: clamp(31px, 4vw, 46px); letter-spacing: -.05em; }.decomp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(115px, 1fr)); gap: 9px; }.decomp-cell { display: flex; flex-direction: column; gap: 7px; min-width: 0; padding: 12px; border: 1px solid #34443e; border-radius: 9px; background: #10191a; }.decomp-cell > span { color: var(--rank-color); font-size: 10px; font-weight: 900; }.decomp-cell > strong { font-size: 10px; line-height: 1.2; color: #c1ccc7; min-height: 24px; }.decomp-cell input { width: 100%; min-width: 0; background: #0a1113; border: 1px solid #4a5e53; border-radius: 7px; color: #f2f7f2; text-align: center; font-size: 22px; font-weight: 850; padding: 9px; }
  .sort-pool { display: flex; flex-wrap: wrap; gap: 11px; justify-content: center; margin-bottom: 28px; }.sort-value { display: flex; align-items: center; gap: 17px; min-height: 60px; padding: 15px 18px; background: #10181b; border: 1px solid #3b4c49; border-radius: 10px; color: #edf4ed; font-size: 20px; font-weight: 850; cursor: pointer; font-variant-numeric: tabular-nums; }.sort-value span { color: var(--mint); }.sort-order-zone { border: 1px dashed #48604f; border-radius: 10px; padding: 15px; background: rgba(171,243,111,.035); }.muted-text { color: #7f928b; font-size: 12px; margin: 12px 0 0; }.selected-sequence { min-height: 52px; display: flex; flex-wrap: wrap; gap: 8px; padding-top: 12px; }.sequence-value { display: inline-flex; align-items: center; gap: 12px; background: #2b3c2d; border: 1px solid #608655; border-radius: 7px; color: #d8f4d0; padding: 10px 12px; cursor: pointer; font-weight: 800; }.sequence-value span { color: #a9c49f; }
  .line-target-number { display: flex; align-items: baseline; justify-content: space-between; gap: 15px; margin-bottom: 55px; }.number-line-visual { position: relative; padding: 0 0 20px; }.line-endpoints { display: flex; justify-content: space-between; color: #a9b9b2; font-size: 12px; margin-bottom: 13px; }.number-line-track { height: 5px; position: relative; border-radius: 99px; background: linear-gradient(90deg, #627d6b, var(--mint)); margin: 15px 0 25px; }.line-tick { position: absolute; top: -3px; height: 10px; width: 2px; background: #8fa69b; transform: translateX(-50%); }.line-tick.major-tick { top: -7px; height: 19px; background: #d9e8d9; }.line-marker { position: absolute; top: -11px; width: 3px; height: 28px; background: #fff; transform: translateX(-50%); box-shadow: 0 0 0 4px rgba(255,255,255,.12); }.line-value-bubble { position: absolute; top: -49px; transform: translateX(-50%); padding: 6px 8px; border-radius: 6px; white-space: nowrap; background: var(--mint); color: #172016; font-size: 10px; font-weight: 900; }.line-slider { width: 100%; accent-color: var(--mint); cursor: ew-resize; touch-action: pan-x; min-height: 35px; }.line-read-answer { display: block; margin-top: 24px; }
  .rank-question { margin: 12px 0 22px; font-size: 17px; }.rank-answer { display: flex; gap: 12px; align-items: stretch; }.rank-answer input { max-width: 300px; }.rank-answer .primary-button { flex: 1; }.build-task-card { text-align: center; }.build-target { display: block; font-size: clamp(40px, 6vw, 70px); color: var(--mint); letter-spacing: -.05em; margin: 14px 0 19px; }.build-direction { display: inline-flex; align-items: center; gap: 10px; color: var(--blue); border: 1px solid #365963; background: rgba(115,217,255,.07); padding: 10px 13px; border-radius: 9px; margin: 0 0 27px; font-size: 10px; letter-spacing: .1em; }.build-direction span { font-size: 18px; }.build-direction.direction-up { color: var(--mint); border-color: #506c49; background: rgba(171,243,111,.06); }.build-task-card .answer-label { max-width: none; }.build-task-card .rank-answer input { max-width: none; }
  .feedback-panel { display: grid; grid-template-columns: 38px minmax(0, 1fr) auto; align-items: start; gap: 14px; margin-top: 22px; border-radius: 11px; padding: 16px; }.feedback-panel.success { background: rgba(171,243,111,.085); border: 1px solid #55784b; }.feedback-panel.error { background: rgba(255,198,107,.055); border: 1px solid #6c5638; }.feedback-symbol { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; background: var(--mint); color: #13200f; font-size: 20px; font-weight: 900; }.feedback-panel.error .feedback-symbol { color: #241908; background: var(--amber); }.feedback-panel > div > strong { display: block; font-size: 15px; margin: 2px 0 4px; }.feedback-panel p { font-size: 12px; margin: 0 0 5px; color: #c2d0c8; line-height: 1.5; }.feedback-hint { color: #a9baae !important; }.feedback-next, .feedback-retry { align-self: center; white-space: nowrap; }.secondary-button { display: inline-flex; align-items: center; justify-content: center; min-height: 40px; background: #1a2823; border: 1px solid #4b6551; border-radius: 8px; color: var(--mint); font-size: 11px; font-weight: 850; padding: 10px 13px; cursor: pointer; }.game-over-panel { max-width: 700px; margin: 10vh auto; text-align: center; padding: 36px; border: 1px solid #4f4a3c; background: #171d1d; border-radius: 16px; }.big-symbol { display: grid; place-items: center; width: 70px; height: 70px; border: 1px solid #665c42; color: var(--amber); border-radius: 18px; font-size: 42px; margin: 0 auto 22px; }.game-over-panel h2 { font-size: 32px; margin-bottom: 12px; }.game-over-panel p:not(.eyebrow) { color: #a4b1ac; margin-bottom: 22px; }.in-game-options { margin: 0 0 18px; border: 1px solid #2f403c; border-radius: 12px; background: #111a1b; }.options-title { padding: 12px 17px 0; display: flex; align-items: center; justify-content: space-between; font-size: 13px; }.small-close { color: #afc0b7; border: 1px solid #394b45; border-radius: 7px; background: #192322; padding: 6px 9px; font-size: 10px; cursor: pointer; }.in-game-options .settings-grid { padding-bottom: 8px; }.game-footer { display: flex; justify-content: space-between; align-items: center; gap: 20px; border-top: 1px solid #2b393f; margin-top: 24px; padding-top: 17px; color: #748580; font-size: 9px; }.game-footer span:first-child { font-weight: 900; letter-spacing: .1em; }.game-footer button { color: var(--mint); border: 0; background: transparent; font-size: 10px; font-weight: 800; cursor: pointer; }
  .site-footer { display: flex; align-items: center; justify-content: space-between; gap: 18px; border-top: 1px solid rgba(255,255,255,.07); padding: 18px clamp(18px, 4vw, 60px) 22px; font-size: 9px; letter-spacing: .06em; color: #73817f; }.site-footer > span:first-child { font-weight: 900; letter-spacing: .15em; color: #a4b2ad; }.site-footer a { color: #9caea4; text-decoration: none; }.site-footer a:hover { color: var(--mint); }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
  .reduce-motion *, .reduce-motion *::before, .reduce-motion *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: .001ms !important; }

  @media (max-width: 1050px) {
    .mission-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .mission-card { min-height: 270px; }
    .factory-workspace { grid-template-columns: 1fr; }
    .shipment-box { min-height: 130px; }
    .hero-grid { grid-template-columns: minmax(0, 1fr) minmax(280px, .8fr); }
    .place-row { grid-template-columns: 37px minmax(100px, .8fr) 40px minmax(0, 1.7fr); }
  }
  @media (max-width: 700px) {
    .topbar { grid-template-columns: auto 1fr; min-height: 66px; padding: 0 14px; gap: 12px; }.brand-lockup { justify-self: start; }.brand-lockup strong { font-size: 21px; }.brand-kicker { font-size: 7px; }.topbar > .top-return { grid-column: 1 / -1; justify-self: stretch; text-align: center; margin-bottom: 10px; }.topbar:has(.top-return) { padding-top: 10px; }.top-actions { grid-column: 1 / -1; justify-self: stretch; display: flex; flex-wrap: wrap; padding-bottom: 10px; }.top-actions .back-button { margin-left: auto; }.mode-pill { margin-right: auto; }
    .menu-view, .game-view { width: min(100% - 26px, 600px); }.menu-view { padding-top: 16px; }.hero-grid { display: flex; flex-direction: column; align-items: stretch; padding: 31px 0 29px; gap: 27px; }.hero-copy h1 { font-size: clamp(42px, 13vw, 67px); }.hero-description { font-size: 14px; }.hero-visual { min-height: 235px; }.cargo-large { width: 110px; height: 110px; top: 43px; right: 11%; font-size: 32px; }.cargo-mid { width: 75px; height: 75px; top: 107px; left: 13%; }.cargo-small { right: 22%; bottom: 22px; width: 43px; height: 43px; }.section-heading { align-items: flex-start; flex-direction: column; gap: 12px; }.section-heading h2 { font-size: 25px; }.section-heading > p, .section-heading > div + p { font-size: 11px; }.difficulty-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }.difficulty-card { min-height: 102px; padding: 13px; }.difficulty-card strong { font-size: 12px; }.difficulty-card > span:last-of-type { font-size: 10px; }.playstyle-row { align-items: flex-start; flex-direction: column; }.segmented-control { width: 100%; }.segmented-control button { flex: 1; padding: 10px 8px; font-size: 10px; }.mission-section { margin-top: 31px; }.mission-grid { grid-template-columns: 1fr; gap: 9px; }.mission-card { min-height: auto; padding: 16px; display: grid; grid-template-columns: 1fr auto; gap: 0 12px; }.mission-topline { grid-column: 1 / -1; margin-bottom: 9px; }.mission-section-label, .mission-title, .mission-subtitle, .mission-description, .skill-tags, .mission-launch { grid-column: 1 / -1; }.mission-title { font-size: 17px; }.mission-description { margin-bottom: 11px; }.skill-tags { margin-top: 0; }.mission-count { align-self: flex-start; }.settings-grid { grid-template-columns: 1fr; }.setting-row { padding: 12px 0; }
    .game-view { padding-top: 22px; }.game-heading { align-items: flex-start; flex-direction: column; gap: 16px; }.game-heading h1 { font-size: 31px; }.score-panel { width: 100%; justify-content: space-around; padding: 12px; }.task-card { padding: 15px; }.task-card > h2 { font-size: 21px; }.target-readout { padding: 13px; gap: 8px; }.target-readout > span { width: 100%; }.target-readout strong { font-size: 36px; }.conveyor-caption { align-items: flex-start; flex-direction: column; gap: 4px; }.conveyor-lane { height: 128px; }.belt-item { width: 120px; min-width: 120px; height: 94px; left: -150px; padding: 5px 6px; }.belt-rank-name { font-size: 8.5px; }.belt-rank-relation { font-size: 7.5px; }.factory-workspace { display: flex; flex-direction: column; }.bench-panel, .shipment-panel { padding: 13px; }.panel-heading { align-items: flex-start; flex-direction: column; gap: 8px; }.panel-heading h3 { font-size: 16px; }.place-row { grid-template-columns: 34px minmax(0, 1fr) 32px; gap: 8px; padding: 10px 0; }.place-token { width: 33px; height: 33px; }.place-name strong { font-size: 10px; }.row-actions { grid-column: 1 / -1; justify-content: stretch; padding-left: 42px; }.icon-button { min-height: 38px; flex: 0 0 47px; }.transfer-button { flex: 1; min-height: 38px; font-size: 10px; }.count-number { font-size: 19px; }.shipment-box { min-height: 125px; }.conversion-card, .word-task-card, .decomposition-task, .sort-task-card, .number-line-task, .rank-task-card, .build-task-card { padding: 18px 14px; margin-top: 18px; }.conversion-equation { grid-template-columns: minmax(0, 1fr) auto; gap: 8px 12px; }.conversion-equation > strong { font-size: 42px; }.conversion-equation > span { font-size: 17px; justify-self: end; }.conversion-equation > b { grid-column: 1; grid-row: 2; }.conversion-answer { grid-column: 2; grid-row: 2; }.conversion-answer input { min-width: 0; width: 100px; font-size: 26px; padding: 10px; }.conversion-answer span { font-size: 16px; }.measure-ladder { gap: 2px; font-size: 10px; }.measure-ladder span { padding: 7px 0; }.decomp-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.decomp-cell { padding: 9px; }.decomp-target { align-items: flex-start; flex-direction: column; gap: 6px; }.sort-value { flex: 1 1 calc(50% - 8px); justify-content: space-between; font-size: 16px; padding: 12px; min-width: 110px; }.line-target-number { align-items: flex-start; flex-direction: column; gap: 5px; margin-bottom: 55px; }.rank-question { font-size: 15px; }.rank-answer { flex-direction: column; }.rank-answer input { max-width: none; }.rank-answer .primary-button { flex: 0 0 auto; }.feedback-panel { grid-template-columns: 34px minmax(0, 1fr); gap: 10px; padding: 12px; }.feedback-symbol { width: 32px; height: 32px; }.feedback-next, .feedback-retry { grid-column: 1 / -1; width: 100%; }.game-footer { align-items: flex-start; flex-direction: column; gap: 8px; }.site-footer { flex-wrap: wrap; justify-content: space-between; padding: 16px 13px 22px; }.site-footer > span:nth-child(2) { display: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .app-shell *, .app-shell *::before, .app-shell *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: .001ms !important; }
  }
</style>
