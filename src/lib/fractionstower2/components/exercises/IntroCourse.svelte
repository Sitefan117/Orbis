<script lang="ts">
  let { floorId = 'floor-1', onComplete } = $props<{
    floorId?: string;
    onComplete?: () => void;
  }>();

  let floorNum = $derived(parseInt(floorId.match(/(\d+)/)?.[1] || '1'));

  const floorCourses: Record<number, { title: string, subSteps: Array<{ subtitle: string, theory: string, example: string, visualType: 'pizzas' | 'bar' | 'line' | 'money' | 'circle' | 'grid', visualData: any, question: string, expected: string[], hint: string }> }> = {
    // --- ÉTAGE 1 : Le partage équitable & Lexique ---
    1: {
      title: "Étage 1 — Le partage équitable et les bases",
      subSteps: [
        {
          subtitle: "1. Qu'est-ce qu'une fraction ?",
          theory: "Une fraction sert à exprimer des parts d'un tout qui a été partagé. Règle d'or : pour faire des fractions, les parts doivent être <strong>strictement égales</strong>.",
          example: "Si tu partages une pizza en 4 parts de tailles différentes, ce ne sont pas des quarts !",
          visualType: "pizzas",
          visualData: {},
          question: "Laquelle des deux pizzas permet de faire de vraies fractions ? (Tape 'égale' ou 'inégale')",
          expected: ["égale", "egale"],
          hint: "Regarde bien la taille des parts : elles doivent être pareilles."
        },
        {
          subtitle: "2. Numérateur et Dénominateur",
          theory: "La fraction s'écrit avec une barre au milieu : <br>• En bas, le <strong>dénominateur</strong> indique le nombre total de parts égales.<br>• En haut, le <strong>numérateur</strong> indique le nombre de parts que l'on prend.",
          example: "Avec <span class='fraction'><span>3</span><span>4</span></span>, le dénominateur est 4 et le numérateur est 3.",
          visualType: "bar",
          visualData: { total: 4, colored: 3 },
          question: "Dans la fraction <span class='fraction'><span>3</span><span>4</span></span>, comment appelle-t-on le nombre du bas (4) ?",
          expected: ["dénominateur", "denominateur"],
          hint: "Indice : il 'dénomme' ou nomme la taille des parts."
        },
        {
          subtitle: "3. Le lexique des fractions",
          theory: "On nomme les fractions selon leurs parts : 2 parts = un <strong>demi</strong> (<span class='fraction'><span>1</span><span>2</span></span>), 3 parts = un <strong>tiers</strong> (<span class='fraction'><span>1</span><span>3</span></span>), 4 parts = un <strong>quart</strong> (<span class='fraction'><span>1</span><span>4</span></span>). Dès 5 parts, on ajoute <strong>-ième</strong>.",
          example: "Une unité coupée en 3 parts égales donne des tiers.",
          visualType: "bar",
          visualData: { total: 3, colored: 1 },
          question: "Comment nomme-t-on une unité coupée en 3 parts égales ?",
          expected: ["tiers", "le tiers"],
          hint: "Pense au mot 'partage par trois'."
        }
      ]
    },

    // --- ÉTAGE 2 : Lire et représenter ---
    2: {
      title: "Étage 2 — Lire et représenter",
      subSteps: [
        {
          subtitle: "1. Les trois visages d'une fraction",
          theory: "Une fraction se lit de trois manières : par un dessin (coloriage), par une écriture chiffrée, et par des mots (ex: trois cinquièmes).",
          example: "Sur une bande de 5 cases dont 3 sont coloriées, on écrit <span class='fraction'><span>3</span><span>5</span></span> et on lit 'trois cinquièmes'.",
          visualType: "bar",
          visualData: { total: 5, colored: 3 },
          question: "Écris en chiffres la fraction 'quatre septièmes'.",
          expected: ["4/7", "4 / 7"],
          hint: "Écris le numérateur, un slash, puis le dénominateur."
        }
      ]
    },

    // --- ÉTAGE 3 : La droite graduée ---
    3: {
      title: "Étage 3 — La droite graduée",
      subSteps: [
        {
          subtitle: "1. Se repérer de 0 à 1",
          theory: "Sur une droite graduée entre 0 et 1, l'unité est partagée en intervalles égaux. Le dénominateur indique le nombre total d'intervalles.",
          example: "Si la ligne entre 0 et 1 est coupée en 5 intervalles, le 3e trait après 0 correspond à <span class='fraction'><span>3</span><span>5</span></span>.",
          visualType: "line",
          visualData: { parts: 5, target: 3 },
          question: "Sur une droite de 0 à 1 partagée en 5 intervalles égaux, quelle fraction représente le 3e trait ?",
          expected: ["3/5", "3 / 5"],
          hint: "Le nombre d'intervalles est en bas, le nombre de pas en haut."
        }
      ]
    },

    // --- ÉTAGE 4 : Équivalences et simplification ---
    4: {
      title: "Étage 4 — Équivalences et simplification",
      subSteps: [
        {
          subtitle: "1. Des écritures différentes pour une même quantité",
          theory: "Deux fractions sont <strong>équivalentes</strong> si elles représentent exactement la même quantité. Pour simplifier, on divise ou multiplie le haut et le bas par le même nombre.",
          example: "<span class='fraction'><span>2</span><span>4</span></span> et <span class='fraction'><span>1</span><span>2</span></span> couvrent la même surface.",
          visualType: "circle",
          visualData: { total: 4, colored: 2 },
          question: "Complète l'égalité : <span class='fraction'><span>1</span><span>2</span></span> = <span class='fraction'><span>?</span><span>4</span></span>. Quel nombre manque ?",
          expected: ["2"],
          hint: "Multiplie le haut et le bas par 2."
        }
      ]
    },

    // --- ÉTAGE 5 : Comparer et fractions supérieures à 1 ---
    5: {
      title: "Étage 5 — Comparer et ordonner",
      subSteps: [
        {
          subtitle: "1. Qui est le plus grand ?",
          theory: "Si les dénominateurs sont identiques, la fraction avec le plus grand numérateur est la plus grande. Si les numérateurs sont identiques, c'est celle qui a le plus petit dénominateur.",
          example: "<span class='fraction'><span>3</span><span>8</span></span> est plus petit que <span class='fraction'><span>5</span><span>8</span></span>.",
          visualType: "bar",
          visualData: { total: 8, colored: 5 },
          question: "Quel symbole faut-il mettre entre <span class='fraction'><span>3</span><span>8</span></span> et <span class='fraction'><span>5</span><span>8</span></span> ? (<, >, ou =)",
          expected: ["<"],
          hint: "Utilise le signe 'plus petit que'."
        },
        {
          subtitle: "2. Quand le haut dépasse le bas",
          theory: "Si le numérateur est plus grand que le dénominateur, la fraction est <strong>plus grande que 1</strong> (elle dépasse une unité entière).",
          example: "Par exemple, <span class='fraction'><span>5</span><span>4</span></span> représente un gâteau entier plus un quart de gâteau.",
          visualType: "bar",
          visualData: { total: 4, colored: 4 },
          question: "Une fraction dont le numérateur est égal au dénominateur (comme <span class='fraction'><span>4</span><span>4</span></span>) vaut exactement combien ?",
          expected: ["1", "un"],
          hint: "Ça représente un tout entier."
        }
      ]
    },

    // --- ÉTAGE 6 : Fractions décimales ---
    6: {
      title: "Étage 6 — Fractions décimales",
      subSteps: [
        {
          subtitle: "1. Lien avec les nombres décimaux",
          theory: "Une fraction décimale a pour dénominateur 10, 100 ou 1000. Elle se traduit directement en nombre à virgule.",
          example: "Exemple monétaire : 75 centimes valent <span class='fraction'><span>75</span><span>100</span></span> de franc, soit 0,75 CHF.",
          visualType: "money",
          visualData: {},
          question: "Écris la fraction <span class='fraction'><span>7</span><span>10</span></span> sous forme de nombre décimal.",
          expected: ["0,7", "0.7"],
          hint: "Utilise une virgule ou un point : 0,..."
        }
      ]
    },

    // --- ÉTAGE 7 : Opérations (même dénominateur) ---
    7: {
      title: "Étage 7 — Opérations (même dénominateur)",
      subSteps: [
        {
          subtitle: "1. Additionner des parts identiques",
          theory: "Quand les dénominateurs sont identiques, les parts ont la même taille. On additionne ou soustrait uniquement les numérateurs, et le dénominateur ne bouge pas.",
          example: "<span class='fraction'><span>2</span><span>7</span></span> + <span class='fraction'><span>3</span><span>7</span></span> = <span class='fraction'><span>5</span><span>7</span></span>.",
          visualType: "bar",
          visualData: { total: 7, colored: 5 },
          question: "Calcule : <span class='fraction'><span>3</span><span>8</span></span> + <span class='fraction'><span>2</span><span>8</span></span>. Écris le résultat sous forme de fraction.",
          expected: ["5/8", "5 / 8"],
          hint: "Additionne les numérateurs (3 + 2) et garde le dénominateur."
        }
      ]
    },

    // --- ÉTAGE 8 : Dénominateurs différents ---
    8: {
      title: "Étage 8 — Dénominateurs différents",
      subSteps: [
        {
          subtitle: "1. Harmoniser grâce aux équivalences",
          theory: "On ne peut pas additionner directement des parts de tailles différentes. Il faut d'abord transformer les fractions pour qu'elles aient le même dénominateur (en utilisant les fractions équivalentes de l'étage 4).",
          example: "Pour <span class='fraction'><span>1</span><span>2</span></span> + <span class='fraction'><span>1</span><span>4</span></span>, on transforme <span class='fraction'><span>1</span><span>2</span></span> en <span class='fraction'><span>2</span><span>4</span></span>. Ensuite, <span class='fraction'><span>2</span><span>4</span></span> + <span class='fraction'><span>1</span><span>4</span></span> = <span class='fraction'><span>3</span><span>4</span></span>.",
          visualType: "circle",
          visualData: { total: 4, colored: 3 },
          question: "Pour calculer <span class='fraction'><span>1</span><span>2</span></span> + <span class='fraction'><span>1</span><span>4</span></span>, en combien de parts égales (dénominateur) dois-tu transformer les demis ?",
          expected: ["4"],
          hint: "Regarde le plus grand dénominateur."
        }
      ]
    },

    // --- ÉTAGE 9 : Multiplication et division ---
    9: {
      title: "Étage 9 — Multiplication et division",
      subSteps: [
        {
          subtitle: "1. Croiser et inverser",
          theory: "Multiplication : on multiplie les numérateurs entre eux et les dénominateurs entre eux. Division : diviser par une fraction revient à multiplier par son inverse.",
          example: "Exemple : l'inverse de <span class='fraction'><span>2</span><span>3</span></span> est <span class='fraction'><span>3</span><span>2</span></span>.",
          visualType: "grid",
          visualData: { total: 6, colored: 2 },
          question: "Quel est l'inverse de la fraction <span class='fraction'><span>2</span><span>3</span></span> ?",
          expected: ["3/2", "3 / 2"],
          hint: "Inverse le numérateur et le dénominateur (le haut va en bas)."
        }
      ]
    }
  };

  let currentCourse = $derived(floorCourses[floorNum] || floorCourses[1]);
  let currentSubStepIndex = $state(0);
  let userAnswer = $state("");
  let feedbackMessage = $state("");
  let isCorrect = $state(false);

  // Sécurisation stricte de l'étape active selon l'étage
  let activeStep = $derived(
    currentCourse?.subSteps[currentSubStepIndex] || 
    currentCourse?.subSteps[0] || 
    { subtitle: "", theory: "", example: "", visualType: 'bar', visualData: {}, question: "", expected: [], hint: "" }
  );

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
    const utterance = new SpeechSynthesisUtterance(`${activeStep.subtitle}. ${activeStep.theory.replace(/<[^>]*>/g, '')}. ${activeStep.example}`);
    utterance.lang = 'fr-CH';
    window.speechSynthesis.speak(utterance);
  }
</script>

<div class="intro-course-container">
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
      
      {#if activeStep.visualType === 'pizzas'}
        <div class="pizzas-comparison">
          <div class="pizza-box">
            <div class="pizza-circle equal">
              <div class="slice s1"></div><div class="slice s2"></div><div class="slice s3"></div><div class="slice s4"></div>
            </div>
            <span class="pizza-label">Pizza A : Parts <strong>égales</strong> ✔️</span>
          </div>
          <div class="pizza-box">
            <div class="pizza-circle unequal">
              <div class="weird-slice w1"></div><div class="weird-slice w2"></div><div class="weird-slice w3"></div>
            </div>
            <span class="pizza-label">Pizza B : Parts <strong>inégales</strong> ❌</span>
          </div>
        </div>

      {:else if activeStep.visualType === 'bar'}
        <div class="visual-bar-wrapper">
          {#each Array(activeStep.visualData.total) as _, i}
            <div class="bar-segment {i < activeStep.visualData.colored ? 'colored' : 'empty'}">
              <span>{i + 1}</span>
            </div>
          {/each}
        </div>
        <p class="visual-caption">{activeStep.visualData.colored} parties sur {activeStep.visualData.total} parts totales</p>

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
        <p class="visual-caption">Droite graduée de 0 à 1 découpée en {activeStep.visualData.parts} intervalles égaux</p>

      {:else if activeStep.visualType === 'money'}
        <div class="visual-money-box">
          <span class="money-icon">🪙</span>
          <div class="money-text">
            <strong>75 centimes</strong> = <span class='fraction'><span>75</span><span>100</span></span> CHF = <strong>0,75 CHF</strong>
          </div>
        </div>

      {:else}
        <div class="visual-circle-pie">
          <p class="visual-caption">Représentation proportionnelle de l'unité.</p>
        </div>
      {/if}
    </div>

    <!-- BLOC EXEMPLE CONCRET -->
    <div class="example-block">
      <p>💡 <strong>Exemple du quotidien :</strong> {@html activeStep.example}</p>
    </div>

    <!-- QUESTION DE VALIDATION INTERACTIVE -->
    <div class="validation-box">
      <p class="question-title">✨ Question interactive :</p>
      <p class="question-text">{@html activeStep.question}</p>
      
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

  .intro-course-container {
    max-width: 720px; margin: 0 auto; background: #ffffff; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; font-family: Arial, sans-serif; color: #202124;
  }
  .course-card { padding: 1.5rem 2rem; flex: 1; overflow-y: auto; max-height: 70vh; }
  .card-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
  .floor-tag { font-size: 0.8rem; font-weight: bold; color: #2563eb; text-transform: uppercase; background: #eff6ff; padding: 0.2rem 0.6rem; border-radius: 6px; }
  h2 { font-size: 1.3rem; color: #1e293b; margin: 0 0 0.3rem 0; }
  .subtitle { font-size: 1.15rem; color: #2563eb; margin: 0 0 1rem 0; }
  .speak-btn { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; padding: 0.4rem 0.8rem; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 0.9rem; }
  .speak-btn:hover { background: #dcfce7; }
  .theory-block { background: #eff6ff; border-left: 5px solid #3b82f6; padding: 1rem 1.2rem; border-radius: 0 8px 8px 0; margin-bottom: 1.2rem; line-height: 1.6; font-size: 1.05rem; }
  .visual-container { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; margin-bottom: 1.2rem; text-align: center; }
  .visual-label { font-size: 0.85rem; font-weight: bold; color: #64748b; margin-bottom: 0.8rem; text-align: left; }

  .pizzas-comparison { display: flex; justify-content: space-around; gap: 1rem; }
  .pizza-box { display: flex; flex-direction: column; align-items: center; gap: 6px; background: #fff; padding: 8px; border-radius: 8px; border: 1px solid #cbd5e1; flex: 1; }
  .pizza-circle { width: 80px; height: 80px; border-radius: 50%; background: #fde047; border: 3px solid #ca8a04; position: relative; overflow: hidden; }
  .pizza-circle.equal .slice { position: absolute; top:0; left:0; width:100%; height:100%; border:1px dashed rgba(0,0,0,0.3); }
  .pizza-circle.equal .s1 { background: rgba(239, 68, 68, 0.2); clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%); }
  .pizza-circle.equal .s2 { background: rgba(59, 130, 246, 0.2); clip-path: polygon(50% 50%, 50% 0%, 100% 100%, 50% 100%); }
  .pizza-circle.equal .s3 { background: rgba(34, 197, 94, 0.2); clip-path: polygon(50% 50%, 0% 50%, 0% 0%, 50% 0%); }
  .pizza-circle.equal .s4 { background: rgba(168, 85, 247, 0.2); clip-path: polygon(50% 50%, 0% 50%, 0% 100%, 50% 100%); }
  .pizza-circle.unequal .weird-slice { position: absolute; background: rgba(239, 68, 68, 0.3); border: 1px solid #b91c1c; }
  .pizza-circle.unequal .w1 { top: 0; left: 0; width: 70%; height: 100%; }
  .pizza-circle.unequal .w2 { top: 0; left: 70%; width: 30%; height: 50%; background: rgba(59, 130, 246, 0.3); }
  .pizza-circle.unequal .w3 { top: 50%; left: 70%; width: 30%; height: 50%; background: rgba(34, 197, 94, 0.3); }
  .pizza-label { font-size: 0.8rem; color: #334155; text-align: center; }

  .visual-bar-wrapper { display: flex; height: 40px; border: 2px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #fff; margin-bottom: 0.4rem; }
  .bar-segment { flex: 1; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; border-right: 1px solid #cbd5e1; }
  .bar-segment:last-child { border-right: none; }
  .bar-segment.colored { background: #3b82f6; color: white; }
  .bar-segment.empty { background: #f1f5f9; color: #64748b; }

  .visual-number-line { position: relative; height: 45px; margin: 10px 15px 20px 15px; }
  .line-track { position: absolute; top: 12px; left: 0; right: 0; height: 4px; background: #64748b; border-radius: 2px; }
  .line-tick { position: absolute; top: 0; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; }
  .tick-mark { font-size: 1.1rem; font-weight: bold; color: #334155; background: #f8fafc; padding: 0 4px; }
  .tick-label { font-size: 0.75rem; font-weight: bold; color: #1e293b; margin-top: 2px; }

  .visual-money-box { display: flex; align-items: center; justify-content: center; gap: 10px; background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #cbd5e1; }
  .money-icon { font-size: 1.8rem; }
  .money-text { font-size: 1.05rem; color: #1e293b; }
  .visual-caption { font-size: 0.85rem; color: #475569; margin: 0; font-style: italic; }

  .example-block { background: #fefce8; border-left: 5px solid #eab308; padding: 0.9rem 1.2rem; border-radius: 0 8px 8px 0; margin-bottom: 1.5rem; line-height: 1.5; font-size: 1.02rem; }
  .validation-box { background: #f8fafc; border: 2px dashed #94a3b8; border-radius: 12px; padding: 1.2rem; }
  .question-title { font-weight: bold; color: #dc2626; margin-bottom: 0.3rem; }
  .question-text { font-size: 1.05rem; margin-bottom: 0.8rem; line-height: 1.4; }

  .input-row { display: flex; gap: 0.6rem; align-items: center; }
  input[type="text"] { flex: 1; padding: 0.6rem 0.8rem; font-size: 1.1rem; border: 2px solid #cbd5e1; border-radius: 8px; outline: none; background: #fff; color: #1f2937; }
  input[type="text"]:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }

  .btn-check { background: #2563eb; color: white; border: none; padding: 0.6rem 1.2rem; font-size: 1rem; font-weight: bold; border-radius: 8px; cursor: pointer; }
  .btn-check:hover { background: #1d4ed8; }
  .validated-badge { color: #16a34a; font-weight: bold; font-size: 1.05rem; background: #f0fdf4; padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #bbf7d0; }

  .feedback { margin-top: 0.6rem; font-weight: bold; font-size: 0.95rem; }
  .feedback.success { color: #16a34a; }
  .feedback.error { color: #dc2626; }

  .course-footer { background: #f1f5f9; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #cbd5e1; }
  .btn-nav { padding: 0.6rem 1.2rem; font-size: 1rem; font-weight: bold; border-radius: 8px; cursor: pointer; border: none; transition: all 0.2s; }
  .btn-nav.secondary { background: #ffffff; color: #475569; border: 1px solid #cbd5e1; }
  .btn-nav.secondary:hover:not(:disabled) { background: #f8fafc; }
  .btn-nav.primary { background: #0d9488; color: white; }
  .btn-nav.primary:hover:not(:disabled) { background: #0f766e; }
  .btn-nav:disabled { opacity: 0.4; cursor: not-allowed; }
  .progress-indicator { font-size: 0.9rem; color: #475569; font-weight: bold; }
</style>