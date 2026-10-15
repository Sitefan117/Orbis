<script lang="ts">
  let { floorId = 'floor-1', onClose } = $props<{
    floorId?: string;
    onClose?: () => void;
  }>();

  // Extraction sécurisée et réactive du numéro d'étage
  let floorNum = $derived(parseInt(floorId.match(/(\d+)/)?.[1] || '1'));

  // Définition de toutes les micro-étapes (pages) de la théorie par étage
  let steps = [
    // --- ÉTAGE 1 : Le partage équitable & Lexique (3 micro-étapes) ---
    {
      floor: 1,
      floorTitle: "Étage 1 — Le partage équitable",
      title: "1. Qu'est-ce qu'une fraction ?",
      theory: "Une fraction représente des parts d'une unité partagée en parts <strong>strictement égales</strong>. Si les parts n'ont pas la même taille, on ne peut pas faire de fraction.",
      visualDesc: "🖼️ <em>Visuel : Une pizza découpée en 4 parts parfaitement égales d'un côté, et une autre pizza coupée de travers en parts de tailles différentes de l'autre.</em>",
      example: "Pour parler de quarts, les parts doivent impérativement avoir la même taille.",
      question: "Laquelle des deux pizzas permet de faire de vraies fractions ? (Tape 'égale' ou 'inégale')",
      expected: ["égale", "egale"],
      hint: "Il faut que les parts soient pareilles."
    },
    {
      floor: 1,
      floorTitle: "Étage 1 — Le partage équitable",
      title: "2. Le numérateur et le dénominateur",
      theory: "La fraction s'écrit avec une barre au milieu : <br>• En bas, le <strong>dénominateur</strong> indique le nombre total de parts égales.<br>• En haut, le <strong>numérateur</strong> indique le nombre de parts que l'on prend.",
      visualDesc: "🖼️ <em>Visuel : Une pizza où 3 parts sur 4 sont prises, avec des flèches pointant le chiffre 3 en haut (numérateur) et 4 en bas (dénominateur).</em>",
      example: "Exemple : <span class='fraction'><span>3</span><span>4</span></span> (trois quarts). Le bas nomme la taille, le haut compte les parts.",
      question: "Dans la fraction <span class='fraction'><span>3</span><span>4</span></span>, comment appelle-t-on le nombre du bas (4) ?",
      expected: ["dénominateur", "denominateur"],
      hint: "Indice : il 'dénomme' ou nomme la taille des parts."
    },
    {
      floor: 1,
      floorTitle: "Étage 1 — Le partage équitable",
      title: "3. Le lexique des fractions",
      theory: "On nomme les fractions selon leur nombre de parts :<br>• 2 parts $\\rightarrow$ un <strong>demi</strong> (<span class='fraction'><span>1</span><span>2</span></span>)<br>• 3 parts $\\rightarrow$ un <strong>tiers</strong> (<span class='fraction'><span>1</span><span>3</span></span>)<br>• 4 parts $\\rightarrow$ un <strong>quart</strong> (<span class='fraction'><span>1</span><span>4</span></span>)<br>• 5 parts et plus $\\rightarrow$ le suffixe <strong>-ième</strong> (cinquième, sixième...).",
      visualDesc: "🖼️ <em>Visuel : Trois figures géométriques montrant respectivement une moitié, un tiers et un quart coloriés.</em>",
      example: "Exemple : une unité coupée en 3 parts égales donne des tiers (<span class='fraction'><span>1</span><span>3</span></span>).",
      question: "Comment nomme-t-on une unité coupée en 3 parts égales ?",
      expected: ["tiers", "le tiers"],
      hint: "Pense au mot 'partage par trois'."
    },

    // --- ÉTAGE 2 : Lire et représenter ---
    {
      floor: 2,
      floorTitle: "Étage 2 — Lire et représenter",
      title: "1. Les trois visages d'une fraction",
      theory: "Une fraction se lit de trois manières complémentaires :<br>1. <strong>Le dessin</strong> (la surface colorée).<br>2. <strong>Les chiffres</strong> (<span class='fraction'><span>partie prise</span><span>total</span></span>).<br>3. <strong>Les mots</strong> (ex: trois cinquièmes).",
      visualDesc: "🖼️ <em>Visuel : Une bande rectangle de 5 cases dont 3 sont coloriées en bleu, avec l'écriture <span class='fraction'><span>3</span><span>5</span></span> et le texte 'trois cinquièmes'.</em>",
      example: "Exemple : <span class='fraction'><span>3</span><span>5</span></span> se lit 'trois sur cinq' ou 'trois cinquièmes'.",
      question: "Écris en chiffres la fraction 'quatre septièmes'.",
      expected: ["4/7", "4 / 7"],
      hint: "Écris le numérateur, un slash, puis le dénominateur."
    },

    // --- ÉTAGE 3 : La droite graduée ---
    {
      floor: 3,
      floorTitle: "Étage 3 — La droite graduée",
      title: "1. Se repérer de 0 à 1",
      theory: "Sur une droite graduée entre 0 et 1, l'unité est partagée en intervalles égaux. Le dénominateur indique le nombre total d'intervalles, et le numérateur indique le nombre de pas depuis 0.",
      visualDesc: "🖼️ <em>Visuel : Une droite de 0 à 1 découpée en 4 intervalles égaux, avec un point placé sur le 3e trait (<span class='fraction'><span>3</span><span>4</span></span>).</em>",
      example: "Exemple : si l'unité est coupée en 4, le 3e trait après 0 est <span class='fraction'><span>3</span><span>4</span></span>.",
      question: "Sur une droite de 0 à 1 partagée en 5 intervalles égaux, quelle fraction représente le 3e trait ?",
      expected: ["3/5", "3 / 5"],
      hint: "Le nombre d'intervalles est en bas, le nombre de pas en haut."
    },

    // --- ÉTAGE 4 : Équivalences et simplification ---
    {
      floor: 4,
      floorTitle: "Étage 4 — Équivalences et simplification",
      title: "1. Des écritures différentes pour une même quantité",
      theory: "Deux fractions sont <strong>équivalentes</strong> si elles occupent exactement la même surface, même si les nombres écrits sont différents.",
      visualDesc: "🖼️ <em>Visuel : Trois cercles de même taille. Le 1er a <span class='fraction'><span>1</span><span>2</span></span> colorié, le 2e a <span class='fraction'><span>2</span><span>4</span></span>, le 3e a <span class='fraction'><span>4</span><span>8</span></span>. La surface bleue est identique.</em>",
      example: "Exemple : <span class='fraction'><span>1</span><span>2</span></span>, <span class='fraction'><span>2</span><span>4</span></span> et <span class='fraction'><span>4</span><span>8</span></span> couvrent la même surface.",
      question: "Complète l'égalité : <span class='fraction'><span>1</span><span>2</span></span> = <span class='fraction'><span>?</span><span>4</span></span>. Quel nombre manque ?",
      expected: ["2"],
      hint: "Multiplie le haut et le bas par 2."
    },

    // --- ÉTAGE 5 : Comparer et ordonner ---
    {
      floor: 5,
      floorTitle: "Étage 5 — Comparer et ordonner",
      title: "1. Qui est le plus grand ?",
      theory: "Si les dénominateurs sont identiques, la fraction avec le plus grand numérateur est la plus grande (ex: <span class='fraction'><span>5</span><span>8</span></span> est plus grand que <span class='fraction'><span>3</span><span>8</span></span> car 5 parts c'est plus que 3 parts).",
      visualDesc: "🖼️ <em>Visuel : Deux bandes identiques. L'une montre <span class='fraction'><span>3</span><span>8</span></span> coloriés, l'autre montre <span class='fraction'><span>5</span><span>8</span></span> coloriés.</em>",
      example: "Exemple : <span class='fraction'><span>3</span><span>8</span></span> < <span class='fraction'><span>5</span><span>8</span></span>.",
      question: "Quel symbole faut-il mettre entre <span class='fraction'><span>3</span><span>8</span></span> et <span class='fraction'><span>5</span><span>8</span></span> ? (<, >, ou =)",
      expected: ["<"],
      hint: "Utilise le signe 'plus petit que'."
    },
    {
      floor: 5,
      floorTitle: "Étage 5 — Comparer et ordonner",
      title: "2. Attention aux tailles de parts !",
      theory: "Si les numérateurs sont identiques, c'est celle qui a le plus <strong>petit</strong> dénominateur qui est la plus grande, car ses parts sont plus grosses !",
      visualDesc: "🖼️ <em>Visuel : Une pizza coupée en 3 gros morceaux (<span class='fraction'><span>1</span><span>3</span></span>) comparée à une pizza coupée en 10 petits morceaux (<span class='fraction'><span>1</span><span>10</span></span>).</em>",
      example: "Exemple : <span class='fraction'><span>1</span><span>3</span></span> est plus grand que <span class='fraction'><span>1</span><span>10</span></span> (un tiers de gâteau est plus gros qu'un dixième).",
      question: "Entre <span class='fraction'><span>1</span><span>3</span></span> et <span class='fraction'><span>1</span><span>10</span></span>, quelle est la plus grande part ? (Écris la fraction)",
      expected: ["1/3", "1 / 3"],
      hint: "Le dénominateur le plus petit donne les parts les plus grosses."
    },

    // --- ÉTAGE 6 : Fractions décimales ---
    {
      floor: 6,
      floorTitle: "Étage 6 — Fractions décimales",
      title: "1. Lien avec les nombres décimaux",
      theory: "Une fraction décimale a pour dénominateur 10, 100 ou 1'000. Elle se traduit directement en nombre à virgule :<br>• <span class='fraction'><span>7</span><span>10</span></span> = 0,7<br>• <span class='fraction'><span>34</span><span>100</span></span> = 0,34.",
      visualDesc: "🖼️ <em>Visuel : Une grille de 100 cases dont 70 sont coloriées (soit 7 colonnes de 10, ou <span class='fraction'><span>7</span><span>10</span></span>).</em>",
      example: "Exemple monétaire : 50 centimes valent <span class='fraction'><span>50</span><span>100</span></span> de franc, soit 0,50 CHF.",
      question: "Écris la fraction <span class='fraction'><span>7</span><span>10</span></span> sous forme de nombre décimal.",
      expected: ["0,7", "0.7"],
      hint: "Utilise une virgule ou un point : 0,..."
    },

    // --- ÉTAGE 7 : Opérations (même dénominateur) ---
    {
      floor: 7,
      floorTitle: "Étage 7 — Opérations (même dénominateur)",
      title: "1. Additionner des parts identiques",
      theory: "Quand les dénominateurs sont identiques, les parts ont la même taille. On additionne ou soustrait <strong>uniquement les numérateurs</strong>, et le dénominateur ne bouge pas.",
      visualDesc: "🖼️ <em>Visuel : Deux tablettes de chocolat de 8 carrés. On prend 2 carrés sur l'une et 3 sur l'autre pour faire 5 carrés sur 8.</em>",
      example: "Exemple : <span class='fraction'><span>2</span><span>7</span></span> + <span class='fraction'><span>3</span><span>7</span></span> = <span class='fraction'><span>5</span><span>7</span></span>.",
      question: "Calcule : <span class='fraction'><span>3</span><span>8</span></span> + <span class='fraction'><span>2</span><span>8</span></span>. Écris le résultat sous forme de fraction.",
      expected: ["5/8", "5 / 8"],
      hint: "Additionne les numérateurs (3 + 2) et garde le dénominateur."
    },

    // --- ÉTAGE 8 : Dénominateurs différents ---
    {
      floor: 8,
      floorTitle: "Étage 8 — Dénominateurs différents",
      title: "1. Harmoniser avant de calculer",
      theory: "On ne peut pas additionner directement des parts de tailles différentes. Il faut d'abord transformer les fractions pour qu'elles aient le <strong>même dénominateur</strong>.",
      visualDesc: "🖼️ <em>Visuel : Une moitié de pizza (<span class='fraction'><span>1</span><span>2</span></span>) à côté d'un quart (<span class='fraction'><span>1</span><span>4</span></span>). Une flèche montre qu'on découpe la moitié en quarts pour avoir <span class='fraction'><span>2</span><span>4</span></span>.</em>",
      example: "Exemple : pour <span class='fraction'><span>1</span><span>2</span></span> + <span class='fraction'><span>1</span><span>4</span></span>, on transforme <span class='fraction'><span>1</span><span>2</span></span> en <span class='fraction'><span>2</span><span>4</span></span>. Ensuite, <span class='fraction'><span>2</span><span>4</span></span> + <span class='fraction'><span>1</span><span>4</span></span> = <span class='fraction'><span>3</span><span>4</span></span>.",
      question: "Pour calculer <span class='fraction'><span>1</span><span>2</span></span> + <span class='fraction'><span>1</span><span>4</span></span>, en combien de parts égales (dénominateur) dois-tu transformer les demis ?",
      expected: ["4"],
      hint: "Regarde le plus grand dénominateur."
    },

    // --- ÉTAGE 9 : Multiplication et division ---
    {
      floor: 9,
      floorTitle: "Étage 9 — Multiplication et division",
      title: "1. Croiser et inverser",
      theory: "• <strong>Multiplication</strong> : on multiplie les numérateurs entre eux et les dénominateurs entre eux.<br>• <strong>Division</strong> : diviser par une fraction revient à multiplier par son <strong>inverse</strong>.",
      visualDesc: "🖼️ <em>Visuel : Un rectangle quadrillé montrant le croisement des lignes pour multiplier les parts.</em>",
      example: "Exemple : l'inverse de <span class='fraction'><span>2</span><span>3</span></span> est <span class='fraction'><span>3</span><span>2</span></span> (on retourne la fraction).",
      question: "Quel est l'inverse de la fraction <span class='fraction'><span>2</span><span>3</span></span> ?",
      expected: ["3/2", "3 / 2"],
      hint: "Inverse le numérateur et le dénominateur (le haut va en bas)."
    }
  ];

  let currentIndex = $state(0);
  let userAnswer = $state("");
  let feedbackMessage = $state("");
  let isCorrect = $state(false);
  let initialized = $state(false);

  // Synchronise l'index sur la première sous-étape de l'étage reçu à l'initialisation
  $effect(() => {
    if (!initialized && floorNum) {
      const targetIndex = steps.findIndex(s => s.floor === floorNum);
      currentIndex = targetIndex !== -1 ? targetIndex : 0;
      initialized = true;
    }
  });

  let currentStep = $derived(steps[currentIndex]);

  function checkAnswer() {
    const cleanedUser = userAnswer.trim().toLowerCase();
    const matches = currentStep.expected.some(exp => exp.toLowerCase() === cleanedUser);
    
    if (matches) {
      isCorrect = true;
      feedbackMessage = "🎉 Bravo ! C'est exact, tu peux passer à la suite.";
    } else {
      isCorrect = false;
      feedbackMessage = `❌ Ce n'est pas tout à fait ça. ${currentStep.hint}`;
    }
  }

  function nextStep() {
    if (currentIndex < steps.length - 1) {
      currentIndex++;
      userAnswer = "";
      feedbackMessage = "";
      isCorrect = false;
    } else {
      if (onClose) onClose();
    }
  }

  function prevStep() {
    if (currentIndex > 0) {
      currentIndex--;
      userAnswer = "";
      feedbackMessage = "";
      isCorrect = true; 
    }
  }

  function speakText() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = `${currentStep.floorTitle}. ${currentStep.title}. ${currentStep.theory.replace(/<[^>]*>/g, '')}. ${currentStep.example}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-CH';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
</script>

<div class="intro-course-modal-overlay">
  <div class="intro-course-container">
    <header class="course-header">
      <div class="header-left">
        <span class="badge-floor">{currentStep.floorTitle}</span>
      </div>
      <div class="header-right">
        <button class="speak-btn" onclick={speakText} title="Écouter la leçon">
          🔊 Écouter
        </button>
        {#if onClose}
          <button class="close-btn" onclick={onClose} title="Fermer">✕</button>
        {/if}
      </div>
    </header>

    <main class="course-card">
      <h2>{currentStep.title}</h2>
      
      <div class="theory-block">
        <p>{@html currentStep.theory}</p>
      </div>

      <div class="visual-desc-block">
        <p>{@html currentStep.visualDesc}</p>
      </div>

      <div class="example-block">
        <p>💡 <strong>Exemple :</strong> {@html currentStep.example}</p>
      </div>

      <div class="validation-box">
        <p class="question-title">✨ Question de validation :</p>
        <p class="question-text">{@html currentStep.question}</p>
        
        <div class="input-row">
          <input 
            type="text" 
            bind:value={userAnswer} 
            placeholder="Ta réponse ici..." 
            onkeydown={(e) => e.key === 'Enter' && checkAnswer()}
            disabled={isCorrect}
          />
          {#if !isCorrect}
            <button class="btn-check" onclick={checkAnswer}>Vérifier</button>
          {:else}
            <span class="validated-badge">Validé ✔️</span>
          {/if}
        </div>

        {#if feedbackMessage}
          <p class="feedback {isCorrect ? 'success' : 'error'}">{feedbackMessage}</p>
        {/if}
      </div>
    </main>

    <footer class="course-footer">
      <button class="btn-nav secondary" onclick={prevStep} disabled={currentIndex === 0}>
        ← Précédent
      </button>
      
      <span class="progress-indicator">Page {currentIndex + 1} / {steps.length}</span>

      <button 
        class="btn-nav primary" 
        onclick={nextStep} 
        disabled={!isCorrect}
        title={!isCorrect ? "Réponds correctement à la question pour débloquer la suite" : ""}
      >
        {currentIndex === steps.length - 1 ? 'Terminer la leçon 🎯' : 'Étape suivante →'}
      </button>
    </footer>
  </div>
</div>

<style>
  /* STYLE GLOBAL POUR LES FRACTIONS VERTICALES EMPILÉES */
  :global(.fraction) {
    display: inline-flex;
    flex-direction: column;
    vertical-align: middle;
    text-align: center;
    font-size: 0.9em;
    padding: 0 3px;
  }
  :global(.fraction > span:first-child) {
    border-bottom: 1px solid currentColor;
    padding-bottom: 1px;
  }
  :global(.fraction > span:last-child) {
    padding-top: 1px;
  }

  .intro-course-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 16px;
  }

  .intro-course-container {
    width: 100%;
    max-width: 680px;
    max-height: 90vh;
    background: #ffffff;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: Arial, Helvetica, sans-serif;
    color: #202124;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  }

  .course-header {
    background: #f1f8e9;
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #dcedc8;
    flex-shrink: 0;
  }

  .header-right {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .badge-floor {
    font-size: 0.95rem;
    font-weight: bold;
    color: #2e7d32;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .speak-btn, .close-btn {
    background: #ffffff;
    border: 1px solid #c5e1a5;
    color: #2e7d32;
    padding: 0.4rem 0.8rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    transition: background 0.2s;
  }

  .speak-btn:hover, .close-btn:hover {
    background: #e8f5e9;
  }

  .close-btn {
    color: #d32f2f;
    border-color: #ffcdd2;
  }
  .close-btn:hover {
    background: #ffebee;
  }

  .course-card {
    padding: 1.5rem 2rem;
    overflow-y: auto;
    flex: 1;
  }

  h2 {
    font-size: 1.3rem;
    color: #1a237e;
    margin-top: 0;
    margin-bottom: 0.8rem;
  }

  .theory-block {
    background: #e3f2fd;
    border-left: 5px solid #1976d2;
    padding: 0.8rem 1.1rem;
    border-radius: 0 8px 8px 0;
    margin-bottom: 0.8rem;
    line-height: 1.5;
    font-size: 1rem;
  }

  .visual-desc-block {
    background: #f3e5f5;
    border-left: 5px solid #ab47bc;
    padding: 0.7rem 1rem;
    border-radius: 0 8px 8px 0;
    margin-bottom: 0.8rem;
    font-size: 0.95rem;
    color: #4a148c;
  }

  .example-block {
    background: #fff8e1;
    border-left: 5px solid #ffb300;
    padding: 0.8rem 1.1rem;
    border-radius: 0 8px 8px 0;
    margin-bottom: 1.2rem;
    line-height: 1.5;
    font-size: 0.98rem;
  }

  .validation-box {
    background: #f8f9fa;
    border: 2px dashed #b0bec5;
    border-radius: 12px;
    padding: 1rem;
    margin-top: 0.5rem;
  }

  .question-title {
    font-weight: bold;
    color: #d32f2f;
    margin-bottom: 0.3rem;
    font-size: 0.95rem;
  }

  .question-text {
    font-size: 1rem;
    margin-bottom: 0.7rem;
    line-height: 1.4;
  }

  .input-row {
    display: flex;
    gap: 0.6rem;
    align-items: center;
  }

  input[type="text"] {
    flex: 1;
    padding: 0.5rem 0.8rem;
    font-size: 1.05rem;
    border: 2px solid #90a4ae;
    border-radius: 8px;
    outline: none;
    background: #fff;
    color: #1f2937;
  }

  input[type="text"]:focus {
    border-color: #1976d2;
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.15);
  }

  .btn-check {
    background: #1976d2;
    color: white;
    border: none;
    padding: 0.5rem 1.1rem;
    font-size: 0.95rem;
    font-weight: bold;
    border-radius: 8px;
    cursor: pointer;
  }

  .btn-check:hover {
    background: #115293;
  }

  .validated-badge {
    color: #2e7d32;
    font-weight: bold;
    font-size: 1rem;
    background: #e8f5e9;
    padding: 0.4rem 0.9rem;
    border-radius: 8px;
    border: 1px solid #c8e6c9;
  }

  .feedback {
    margin-top: 0.5rem;
    font-weight: bold;
    font-size: 0.9rem;
  }

  .feedback.success {
    color: #2e7d32;
  }

  .feedback.error {
    color: #d32f2f;
  }

  .course-footer {
    background: #eceff1;
    padding: 0.9rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #cfd8dc;
    flex-shrink: 0;
  }

  .btn-nav {
    padding: 0.5rem 1.1rem;
    font-size: 0.95rem;
    font-weight: bold;
    border-radius: 8px;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .btn-nav.secondary {
    background: #ffffff;
    color: #455a64;
    border: 1px solid #b0bec5;
  }

  .btn-nav.secondary:hover:not(:disabled) {
    background: #f5f5f5;
  }

  .btn-nav.primary {
    background: #00838f;
    color: white;
  }

  .print-nav.primary:hover:not(:disabled) {
    background: #006064;
  }

  .btn-nav:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .progress-indicator {
    font-size: 0.85rem;
    color: #546e7a;
    font-weight: bold;
  }
</style>