<script lang="ts">
  let { floorId = 'floor-1', onComplete } = $props<{
    floorId?: string;
    onComplete?: () => void;
  }>();

  // Extraction sécurisée et réactive du numéro d'étage
  let floorNum = $derived(parseInt(floorId.match(/(\d+)/)?.[1] || '1'));

  // Définition de toutes les étapes de la théorie (Étages 1 à 9)
  let steps = [
    // --- ÉTAGE 1 ---
    {
      floor: 1,
      floorTitle: "Étage 1 — Le partage équitable",
      title: "1. Qu'est-ce qu'une fraction ?",
      theory: "Une fraction représente une ou plusieurs parts d'une unité partagée en parts strictement égales. Pour parler de quarts ou de tiers, les parts doivent impérativement avoir la même taille.",
      example: "Exemple de la pizza : si tu coupes une pizza en 4 parts égales et que tu en prends 3, tu as pris 3/4 de la pizza.",
      question: "Dans la fraction 3/4, comment appelle-t-on le nombre du bas (4) qui indique le nombre total de parts égales ?",
      expected: ["dénominateur", "denominateur"],
      hint: "Indice : il 'dénomme' ou nomme la taille des parts."
    },
    // --- ÉTAGE 2 ---
    {
      floor: 2,
      floorTitle: "Étage 2 — Lire et représenter",
      title: "2. Les trois visages d'une fraction",
      theory: "Une fraction se lit de trois manières complémentaires : par un dessin (coloriage), par une écriture chiffrée (numérateur / dénominateur), et par des mots (ex: trois cinquièmes).",
      example: "Exemple : sur une bande de 5 cases dont 3 sont coloriées, on écrit 3/5 et on lit 'trois cinquièmes'.",
      question: "Écris en chiffres la fraction 'quatre septièmes'.",
      expected: ["4/7", "4 / 7"],
      hint: "Écris le numérateur, un slash, puis le dénominateur."
    },
    // --- ÉTAGE 3 ---
    {
      floor: 3,
      floorTitle: "Étage 3 — La droite graduée",
      title: "3. Se repérer de 0 à 1",
      theory: "Sur une droite graduée entre 0 et 1, l'unité est partagée en intervalles égaux. Le dénominateur indique le nombre d'intervalles, et le numérateur indique le nombre de pas depuis 0.",
      example: "Exemple : si l'unité est coupée en 4 intervalles, le 3e trait après 0 correspond à 3/4.",
      question: "Sur une droite de 0 à 1 partagée en 5 intervalles égaux, quelle fraction représente le 3e trait ?",
      expected: ["3/5", "3 / 5"],
      hint: "Le nombre d'intervalles est en bas, le nombre de pas en haut."
    },
    // --- ÉTAGE 4 ---
    {
      floor: 4,
      floorTitle: "Étage 4 — Équivalences et simplification",
      title: "4. Des écritures différentes pour une même quantité",
      theory: "Deux fractions sont équivalentes si elles représentent exactement la même quantité. Pour simplifier, on divise le haut et le bas par le même nombre.",
      example: "Exemple : 2/4 et 1/2 couvrent la même surface. On a divisé par 2 : 2÷2 = 1 et 4÷2 = 2.",
      question: "Complète l'égalité : 1/2 = ? / 4. Quel nombre manque ?",
      expected: ["2"],
      hint: "Multiplie le haut et le bas par 2."
    },
    // --- ÉTAGE 5 ---
    {
      floor: 5,
      floorTitle: "Étage 5 — Comparer et ordonner",
      title: "5. Qui est le plus grand ?",
      theory: "Si les dénominateurs sont identiques, la fraction avec le plus grand numérateur est la plus grande. Si les numérateurs sont identiques, c'est celle qui a le plus petit dénominateur (car les parts sont plus grandes).",
      example: "Exemple : 3/8 est plus petit que 5/8 car à taille de parts égales, 3 parts c'est moins que 5 parts.",
      question: "Quel symbole faut-il mettre entre 3/8 et 5/8 ? (<, >, ou =)",
      expected: ["<"],
      hint: "Utilise le signe 'plus petit que'."
    },
    // --- ÉTAGE 6 ---
    {
      floor: 6,
      floorTitle: "Étage 6 — Fractions décimales",
      title: "6. Lien avec les nombres décimaux",
      theory: "Une fraction décimale a pour dénominateur 10, 100 ou 1'000. Elle se traduit directement en nombre à virgule (ex: 7/10 = 0,7 et 34/100 = 0,34).",
      example: "Exemple monétaire : 75 centimes valent 75/100 de franc, soit 0,75 CHF.",
      question: "Écris la fraction 7/10 sous forme de nombre décimal.",
      expected: ["0,7", "0.7"],
      hint: "Utilise une virgule (ou un point) : 0,..."
    },
    // --- ÉTAGE 7 ---
    {
      floor: 7,
      floorTitle: "Étage 7 — Opérations (même dénominateur)",
      title: "7. Additionner et soustraire des parts identiques",
      theory: "Quand les dénominateurs sont identiques, les parts ont la même taille. On additionne ou soustrait uniquement les numérateurs, et le dénominateur ne bouge pas.",
      example: "Exemple : 2/7 + 3/7 = 5/7 (on additionne 2 parts et 3 parts de septièmes).",
      question: "Calcule : 3/8 + 2/8. Écris le résultat sous forme de fraction.",
      expected: ["5/8", "5 / 8"],
      hint: "Additionne les numérateurs (3 + 2) et garde le dénominateur."
    },
    // --- ÉTAGE 8 ---
    {
      floor: 8,
      floorTitle: "Étage 8 — Dénominateurs différents",
      title: "8. Harmoniser avant de calculer",
      theory: "On ne peut pas additionner directement des parts de tailles différentes. Il faut d'abord transformer les fractions pour qu'elles aient le même dénominateur (commun).",
      example: "Exemple : pour 1/2 + 1/4, on transforme 1/2 en 2/4. Ensuite, 2/4 + 1/4 = 3/4.",
      question: "Pour calculer 1/2 + 1/4, en combien de parts égales (dénominateur) dois-tu transformer les demis ?",
      expected: ["4"],
      hint: "Regarde le plus grand dénominateur."
    },
    // --- ÉTAGE 9 ---
    {
      floor: 9,
      floorTitle: "Étage 9 — Multiplication et division",
      title: "9. Croiser et inverser",
      theory: "Multiplication : on multiplie les numérateurs entre eux et les dénominateurs entre eux. Division : diviser par une fraction revient à multiplier par son inverse.",
      example: "Exemple : 1/2 ÷ 1/4 demande de chercher combien de quarts tiennent dans une moitié (la réponse est 2).",
      question: "Quel est l'inverse de la fraction 2/3 ?",
      expected: ["3/2", "3 / 2"],
      hint: "Inverse le numérateur et le dénominateur (le haut va en bas)."
    }
  ];

  let currentIndex = $state(0);
  let userAnswer = $state("");
  let feedbackMessage = $state("");
  let isCorrect = $state(false);
  let initialized = $state(false);

  // Synchronise l'index sur l'étage reçu une seule fois à l'initialisation (ou quand floorNum change)
  $effect(() => {
    if (!initialized && floorNum) {
      currentIndex = Math.max(0, Math.min(floorNum - 1, steps.length - 1));
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
      if (onComplete) onComplete();
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
    const text = `${currentStep.floorTitle}. ${currentStep.title}. ${currentStep.theory}. ${currentStep.example}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-CH';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
</script>

<div class="intro-course-container">
  <header class="course-header">
    <div class="badge-floor">{currentStep.floorTitle}</div>
    <button class="speak-btn" onclick={speakText} title="Écouter la leçon">
      🔊 Écouter
    </button>
  </header>

  <main class="course-card">
    <h2>{currentStep.title}</h2>
    
    <div class="theory-block">
      <p><strong>Règle :</strong> {currentStep.theory}</p>
    </div>

    <div class="example-block">
      <p>💡 <strong>Exemple concret :</strong> {currentStep.example}</p>
    </div>

    <div class="validation-box">
      <p class="question-title">✨ Question de validation :</p>
      <p class="question-text">{currentStep.question}</p>
      
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
    
    <span class="progress-indicator">Étape {currentIndex + 1} / {steps.length}</span>

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

<style>
  .intro-course-container {
    max-width: 680px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: Arial, Helvetica, sans-serif;
    color: #202124;
  }

  .course-header {
    background: #f1f8e9;
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #dcedc8;
  }

  .badge-floor {
    font-size: 0.95rem;
    font-weight: bold;
    color: #2e7d32;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .speak-btn {
    background: #ffffff;
    border: 1px solid #c5e1a5;
    color: #2e7d32;
    padding: 0.4rem 0.8rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    transition: background 0.2s;
  }

  .speak-btn:hover {
    background: #e8f5e9;
  }

  .course-card {
    padding: 1.5rem 2rem;
    flex: 1;
  }

  h2 {
    font-size: 1.4rem;
    color: #1a237e;
    margin-top: 0;
    margin-bottom: 1rem;
  }

  .theory-block {
    background: #e3f2fd;
    border-left: 5px solid #1976d2;
    padding: 0.9rem 1.2rem;
    border-radius: 0 8px 8px 0;
    margin-bottom: 1rem;
    line-height: 1.6;
    font-size: 1.05rem;
  }

  .example-block {
    background: #fff8e1;
    border-left: 5px solid #ffb300;
    padding: 0.9rem 1.2rem;
    border-radius: 0 8px 8px 0;
    margin-bottom: 1.5rem;
    line-height: 1.6;
    font-size: 1.02rem;
  }

  .validation-box {
    background: #f8f9fa;
    border: 2px dashed #b0bec5;
    border-radius: 12px;
    padding: 1.2rem;
    margin-top: 1rem;
  }

  .question-title {
    font-weight: bold;
    color: #d32f2f;
    margin-bottom: 0.3rem;
  }

  .question-text {
    font-size: 1.05rem;
    margin-bottom: 0.8rem;
    line-height: 1.4;
  }

  .input-row {
    display: flex;
    gap: 0.6rem;
    align-items: center;
  }

  input[type="text"] {
    flex: 1;
    padding: 0.6rem 0.8rem;
    font-size: 1.1rem;
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
    padding: 0.6rem 1.2rem;
    font-size: 1rem;
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
    font-size: 1.05rem;
    background: #e8f5e9;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid #c8e6c9;
  }

  .feedback {
    margin-top: 0.6rem;
    font-weight: bold;
    font-size: 0.95rem;
  }

  .feedback.success {
    color: #2e7d32;
  }

  .feedback.error {
    color: #d32f2f;
  }

  .course-footer {
    background: #eceff1;
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #cfd8dc;
  }

  .btn-nav {
    padding: 0.6rem 1.2rem;
    font-size: 1rem;
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

  .btn-nav.primary:hover:not(:disabled) {
    background: #006064;
  }

  .btn-nav:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .progress-indicator {
    font-size: 0.9rem;
    color: #546e7a;
    font-weight: bold;
  }
</style>