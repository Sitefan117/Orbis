<script lang="ts">
  let { floorId = 'floor-1', onComplete } = $props<{
    floorId?: string;
    onComplete?: () => void;
  }>();

  let floorNum = $derived(parseInt(floorId.match(/(\d+)/)?.[1] || '1'));

  const floorCourses: Record<number, { title: string, subSteps: Array<{ subtitle: string, theory: string, example: string, visualType: 'bar' | 'circle' | 'line' | 'money' | 'grid', visualData: any, question: string, expected: string[], hint: string }> }> = {
    1: {
      title: "Étage 1 — Le partage équitable et les bases",
      subSteps: [
        {
          subtitle: "1. Qu'est-ce qu'une fraction ?",
          theory: "Une fraction sert à exprimer des parts d'un tout qui a été partagé. Règle d'or : pour faire des fractions, les parts doivent être **strictement égales**.",
          example: "Si tu partages une pizza en 4 parts de tailles différentes, ce ne sont pas des quarts !",
          visualType: "bar",
          visualData: { total: 4, colored: 3 },
          question: "Dans une fraction comme 3/4, comment appelle-t-on le nombre du haut qui indique combien de parts on prend ?",
          expected: ["numérateur", "numerateur"],
          hint: "Il 'numère' ou compte les parts."
        },
        {
          subtitle: "2. Numérateur et Dénominateur",
          theory: "Le **dénominateur** (en bas) donne le nom et la taille des parts (ex: des quarts). Le **numérateur** (en haut) compte combien de ces parts on possède.",
          example: "Avec 3/4, le dénominateur est 4 (parts de 1/4) et le numérateur est 3 (on en prend 3).",
          visualType: "bar",
          visualData: { total: 4, colored: 3 },
          question: "Quel nombre indique la taille totale des parts dans la fraction 5/8 ?",
          expected: ["8"],
          hint: "C'est le nombre du bas."
        }
      ]
    },
    2: {
      title: "Étage 2 — Les trois visages d'une fraction",
      subSteps: [
        {
          subtitle: "1. Le dessin, le chiffre et les mots",
          theory: "Une fraction peut s'exprimer de trois façons complémentaires : par un schéma visuel, par une écriture mathématique (chiffres), et par la lecture à voix haute.",
          example: "Trois cinquièmes s'écrit en chiffres 3/5 et se représente par 5 cases dont 3 sont coloriées.",
          visualType: "bar",
          visualData: { total: 5, colored: 3 },
          question: "Écris en chiffres la fraction 'deux tiers'.",
          expected: ["2/3", "2 / 3"],
          hint: "Le chiffre du haut est 2, celui du bas est 3."
        }
      ]
    },
    3: {
      title: "Étage 3 — La droite graduée",
      subSteps: [
        {
          subtitle: "1. Se repérer de 0 à 1",
          theory: "Sur une droite graduée, l'intervalle entre 0 et 1 représente l'unité. On coupe cet intervalle en parts égales selon le dénominateur.",
          example: "Si la ligne entre 0 et 1 est coupée en 4 parts, chaque petit saut vaut 1/4.",
          visualType: "line",
          visualData: { parts: 4, target: 3 },
          question: "Sur une droite de 0 à 1 partagée en 4, à quelle fraction correspond le 3ème petit trait après 0 ?",
          expected: ["3/4", "3 / 4"],
          hint: "Écris le numérateur puis le dénominateur avec un slash."
        }
      ]
    },
    4: {
      title: "Étage 4 — Fractions équivalentes",
      subSteps: [
        {
          subtitle: "1. Même quantité, écritures différentes",
          theory: "Deux fractions peuvent s'écrire différemment tout en représentant exactement la même quantité de chocolat ou de pizza !",
          example: "1/2 de tablette équivaut exactement à 2/4 de cette même tablette.",
          visualType: "circle",
          visualData: { parts: 4, colored: 2 },
          question: "Complète l'égalité : 1/2 = ? / 4. Quel nombre manque ?",
          expected: ["2"],
          hint: "Multiplie le haut et le bas par 2."
        }
      ]
    },
    5: {
      title: "Étage 5 — Comparer et ordonner",
      subSteps: [
        {
          subtitle: "1. Comparer avec le même dénominateur",
          theory: "Quand les parts ont la même taille (même dénominateur), la plus grande fraction est celle qui a le plus grand numérateur.",
          example: "Entre 3/8 et 5/8 de pizza, 5 parts c'est plus grand que 3 parts !",
          visualType: "bar",
          visualData: { total: 8, colored: 5 },
          question: "Quel symbole manque entre 3/8 et 5/8 ? (<, >, ou =)",
          expected: ["<"],
          hint: "Utilise le signe 'plus petit que'."
        }
      ]
    },
    6: {
      title: "Étage 6 — Fractions décimales",
      subSteps: [
        {
          subtitle: "1. Le lien avec les centimes",
          theory: "Une fraction décimale a pour dénominateur 10, 100 ou 1000. En Suisse, c'est parfait pour compter l'argent !",
          example: "75 centimes, c'est 75/100 de franc, soit 0,75 CHF.",
          visualType: "money",
          visualData: { value: "0.75 CHF" },
          question: "Écris 7/10 sous forme de nombre décimal (avec une virgule ou un point).",
          expected: ["0,7", "0.7"],
          hint: "Zéro virgule sept."
        }
      ]
    },
    7: {
      title: "Étage 7 — Additionner des parts identiques",
      subSteps: [
        {
          subtitle: "1. Addition simple",
          theory: "Si les dénominateurs sont identiques, les parts ont la même taille. On additionne les numérateurs et on ne touche pas au dénominateur.",
          example: "2/7 + 3/7 = 5/7 (on additionne 2 parts et 3 parts).",
          visualType: "bar",
          visualData: { total: 7, colored: 5 },
          question: "Calcule : 3/8 + 2/8. Donne la réponse sous forme de fraction.",
          expected: ["5/8", "5 / 8"],
          hint: "Additionne 3 et 2 en gardant 8 en bas."
        }
      ]
    },
    8: {
      title: "Étage 8 — Dénominateurs différents",
      subSteps: [
        {
          subtitle: "1. Harmoniser avant d'additionner",
          theory: "On ne peut pas additionner des demis et des quarts directement. Il faut d'abord transformer les demis en quarts pour avoir des parts de même taille.",
          example: "1/2 se transforme en 2/4. Ensuite, 2/4 + 1/4 = 3/4.",
          visualType: "circle",
          visualData: { parts: 4, colored: 3 },
          question: "Pour additionner 1/2 et 1/4, en combien de parts égales dois-tu convertir les demis ?",
          expected: ["4"],
          hint: "Regarde le dénominateur commun."
        }
      ]
    },
    9: {
      title: "Étage 9 — Multiplication et division",
      subSteps: [
        {
          subtitle: "1. Multiplier et inverser",
          theory: "Multiplication : on multiplie les numérateurs entre eux et les dénominateurs entre eux. Division : diviser par une fraction, c'est multiplier par son inverse.",
          example: "L'inverse de 2/3 est 3/2.",
          visualType: "bar",
          visualData: { total: 3, colored: 2 },
          question: "Quel est l'inverse de la fraction 2/3 ?",
          expected: ["3/2", "3 / 2"],
          hint: "Inverse le haut et le bas."
        }
      ]
    }
  };

  let currentCourse = $derived(floorCourses[floorNum] || floorCourses[1]);
  let currentSubStepIndex = $state(0);
  let userAnswer = $state("");
  let feedbackMessage = $state("");
  let isCorrect = $state(false);

  let activeStep = $derived(currentCourse.subSteps[currentSubStepIndex]);

  $effect(() => {
    floorNum;
    currentSubStepIndex = 0;
    userAnswer = "";
    feedbackMessage = "";
    isCorrect = false;
  });

  function checkAnswer() {
    const cleaned = userAnswer.trim().toLowerCase();
    const match = activeStep.expected.some(exp => exp.toLowerCase() === cleaned);
    if (match) {
      isCorrect = true;
      feedbackMessage = "🎉 Bravo ! C'est validé.";
    } else {
      isCorrect = false;
      feedbackMessage = `❌ Pas tout à fait. ${activeStep.hint}`;
    }
  }

  function nextSubStep() {
    if (currentSubStepIndex < currentCourse.subSteps.length - 1) {
      currentSubStepIndex++;
      userAnswer = "";
      feedbackMessage = "";
      isCorrect = false;
    } else {
      if (onComplete) onComplete();
    }
  }

  function prevSubStep() {
    if (currentSubStepIndex > 0) {
      currentSubStepIndex--;
      userAnswer = "";
      feedbackMessage = "";
      isCorrect = true;
    }
  }

  function speakText() {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${activeStep.subtitle}. ${activeStep.theory}. ${activeStep.example}`);
    utterance.lang = 'fr-CH';
    window.speechSynthesis.speak(utterance);
  }
</script>

<div class="intro-course-container">
  <!-- On a supprimé le bandeau haut redondant, on garde uniquement le contenu propre et la croix gérée par la modale parente -->
  <main class="course-card">
    <div class="card-top-row">
      <div class="floor-tag">Étage {floorNum}</div>
      <button class="speak-btn" onclick={speakText} title="Écouter la leçon">🔊 Écouter</button>
    </div>

    <h2>{currentCourse.title}</h2>
    <h3 class="subtitle">{activeStep.subtitle}</h3>

    <!-- BLOC THÉORIE -->
    <div class="theory-block">
      <p><strong>Règle :</strong> {@html activeStep.theory}</p>
    </div>

    <!-- REPRÉSENTATION GRAPHIQUE VISUELLE -->
    <div class="visual-container">
      <p class="visual-label">🎨 Illustration visuelle :</p>
      
      {#if activeStep.visualType === 'bar'}
        <div class="visual-bar-wrapper">
          {#each Array(activeStep.visualData.total) as _, i}
            <div class="bar-segment {i < activeStep.visualData.colored ? 'colored' : 'empty'}">
              <span>{i + 1}</span>
            </div>
          {/each}
        </div>
        <p class="visual-caption">{activeStep.visualData.colored} parts coloriées sur {activeStep.visualData.total} parts égales</p>

      {:else if activeStep.visualType === 'line'}
        <div class="visual-number-line">
          <div class="line-track"></div>
          {#each Array(activeStep.visualData.parts + 1) as _, i}
            <div class="line-tick" style="left: {(i / activeStep.visualData.parts) * 100}%">
              <span class="tick-mark">|</span>
              <span class="tick-label">{i}/{activeStep.visualData.parts}</span>
            </div>
          {/each}
        </div>
        <p class="visual-caption">Droite graduée de 0 à 1 partagée en {activeStep.visualData.parts} intervalles</p>

      {:else}
        <div class="visual-badge-box">
          <span class="visual-main-icon">💡</span>
          <p>{activeStep.example}</p>
        </div>
      {/if}
    </div>

    <!-- BLOC EXEMPLE CONCRET -->
    <div class="example-block">
      <p>🍕 <strong>Exemple du quotidien :</strong> {activeStep.example}</p>
    </div>

    <!-- QUESTION DE VALIDATION INTERACTIVE -->
    <div class="validation-box">
      <p class="question-title">✨ Question interactive :</p>
      <p class="question-text">{activeStep.question}</p>
      
      <div class="input-row">
        <input 
          type="text" 
          bind:value={userAnswer} 
          placeholder="Ta réponse..." 
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

  <!-- NAVIGATION ENTRE LES SOUS-ÉTAPES -->
  <footer class="course-footer">
    <button class="btn-nav secondary" onclick={prevSubStep} disabled={currentSubStepIndex === 0}>
      ← Précédent
    </button>
    
    <span class="progress-indicator">Partie {currentSubStepIndex + 1} / {currentCourse.subSteps.length}</span>

    <button 
      class="btn-nav primary" 
      onclick={nextSubStep} 
      disabled={!isCorrect}
    >
      {currentSubStepIndex === currentCourse.subSteps.length - 1 ? 'Terminer la leçon 🎯' : 'Étape suivante →'}
    </button>
  </footer>
</div>

<style>
  .intro-course-container {
    max-width: 720px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: Arial, Helvetica, sans-serif;
    color: #202124;
  }

  .course-card {
    padding: 1.5rem 2rem;
    flex: 1;
    overflow-y: auto;
    max-height: 70vh;
  }

  .card-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .floor-tag {
    font-size: 0.8rem;
    font-weight: bold;
    color: #2563eb;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: #eff6ff;
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
  }

  h2 {
    font-size: 1.3rem;
    color: #1e293b;
    margin: 0 0 0.3rem 0;
  }

  .subtitle {
    font-size: 1.15rem;
    color: #2563eb;
    margin: 0 0 1rem 0;
  }

  .speak-btn {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #16a34a;
    padding: 0.4rem 0.8rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
    font-size: 0.9rem;
  }

  .speak-btn:hover {
    background: #dcfce7;
  }

  .theory-block {
    background: #eff6ff;
    border-left: 5px solid #3b82f6;
    padding: 1rem 1.2rem;
    border-radius: 0 8px 8px 0;
    margin-bottom: 1.2rem;
    line-height: 1.6;
    font-size: 1.05rem;
  }

  .visual-container {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1.2rem;
    text-align: center;
  }

  .visual-label {
    font-size: 0.85rem;
    font-weight: bold;
    color: #64748b;
    margin-bottom: 0.8rem;
    text-align: left;
  }

  .visual-bar-wrapper {
    display: flex;
    height: 48px;
    border: 2px solid #cbd5e1;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
    margin-bottom: 0.5rem;
  }

  .bar-segment {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 0.95rem;
    border-right: 1px solid #cbd5e1;
  }

  .bar-segment:last-child {
    border-right: none;
  }

  .bar-segment.colored {
    background: #3b82f6;
    color: white;
  }

  .bar-segment.empty {
    background: #f1f5f9;
    color: #64748b;
  }

  .visual-number-line {
    position: relative;
    height: 50px;
    margin: 10px 20px 25px 20px;
  }

  .line-track {
    position: absolute;
    top: 15px;
    left: 0;
    right: 0;
    height: 4px;
    background: #64748b;
    border-radius: 2px;
  }

  .line-tick {
    position: absolute;
    top: 0;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .tick-mark {
    font-size: 1.2rem;
    font-weight: bold;
    color: #334155;
    background: #f8fafc;
    padding: 0 4px;
  }

  .tick-label {
    font-size: 0.8rem;
    font-weight: bold;
    color: #1e293b;
    margin-top: 2px;
  }

  .visual-caption {
    font-size: 0.9rem;
    color: #475569;
    margin: 0;
    font-style: italic;
  }

  .visual-badge-box {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #fff;
    padding: 0.8rem 1rem;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  .visual-main-icon {
    font-size: 1.5rem;
  }

  .example-block {
    background: #fefce8;
    border-left: 5px solid #eab308;
    padding: 0.9rem 1.2rem;
    border-radius: 0 8px 8px 0;
    margin-bottom: 1.5rem;
    line-height: 1.5;
    font-size: 1.02rem;
  }

  .validation-box {
    background: #f8fafc;
    border: 2px dashed #94a3b8;
    border-radius: 12px;
    padding: 1.2rem;
  }

  .question-title {
    font-weight: bold;
    color: #dc2626;
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
    border: 2px solid #cbd5e1;
    border-radius: 8px;
    outline: none;
    background: #fff;
    color: #1f2937;
  }

  input[type="text"]:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }

  .btn-check {
    background: #2563eb;
    color: white;
    border: none;
    padding: 0.6rem 1.2rem;
    font-size: 1rem;
    font-weight: bold;
    border-radius: 8px;
    cursor: pointer;
  }

  .btn-check:hover {
    background: #1d4ed8;
  }

  .validated-badge {
    color: #16a34a;
    font-weight: bold;
    font-size: 1.05rem;
    background: #f0fdf4;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid #bbf7d0;
  }

  .feedback {
    margin-top: 0.6rem;
    font-weight: bold;
    font-size: 0.95rem;
  }

  .feedback.success {
    color: #16a34a;
  }

  .feedback.error {
    color: #dc2626;
  }

  .course-footer {
    background: #f1f5f9;
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #cbd5e1;
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
    color: #475569;
    border: 1px solid #cbd5e1;
  }

  .btn-nav.secondary:hover:not(:disabled) {
    background: #f8fafc;
  }

  .btn-nav.primary {
    background: #0d9488;
    color: white;
  }

  .btn-nav.primary:hover:not(:disabled) {
    background: #0f766e;
  }

  .btn-nav:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .progress-indicator {
    font-size: 0.9rem;
    color: #475569;
    font-weight: bold;
  }
</style>