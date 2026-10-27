<script lang="ts">
  // Gère les brouillons, exemples et aides à la rédaction du CV et des lettres.
  import { base } from '$app/paths';
  import { catalogHref, restoreCatalogReturn } from '$lib/orbis/navigation';
  import { onMount } from 'svelte';
  import { getStudentName, studentStorageScope } from '$lib/orbis/identity/local-student';
  import { recordGameActivity } from '$lib/orbis/tracking/client';
  import type { ChatMessage, CvFields, LetterFields, PcpScreen } from '$lib/games/pcp/types';

  let studentName = 'Explorateur';
  let hasStudentProfile = false;
  let legacyDraftAvailable = false;
  let storageMessage = '';
  let screen: PcpScreen = 'home';
  
  let letterTab: 'examples' | 'chatbot' = 'chatbot'; 
  let activeLetterExample: number | null = null;
  let letterSide: 'left' | 'right' = 'left';

  let completionMessage = '';
  let cv: CvFields = { perso: '', accroche: '', ecole: '', stages: '', langues: '', info: '', hobbies: '', references: '' };
  let letter: LetterFields = { exp: '', dest: '', date: '', objet: '', appel: 'Madame, Monsieur,', p1: '', p2: '', p3: '', sig: '' };

  // Variables Chatbot
  let chatInput = '';
  let chatHistory: ChatMessage[] = [];
  let isChatLoading = false;
  
  // Variables pour la gestion de l'ampoule de correction pas à pas
  let showCorrectionIndex: number | null = null;

  // Suggestions de prompts adaptées aux élèves suisses
  const promptSuggestions = [
    "Aide-moi à parler de mon 1er stage d'observation en mécanique",
    "Comment écrire mon accroche pour un stage de sélection d'agent d'exploitation ?",
    "Je ne sais pas comment commencer mon paragraphe [MOI]",
    "Corrige mes fautes dans mon texte sans tout réécrire à ma place"
  ];

  const cvExamples = [
    `[DONNÉES PERSONNELLES]\nJulien Favre\nChemin des Epinettes 4\n1964 Conthey\n079 023 85 96\n\n[ACCROCHE]\nFiable, motivé, autonome et curieux, je recherche une place d’apprentissage d’agent d’exploitation.\n\n[STAGE]\nAgent d’exploitation, Service de la propreté urbaine : entretien, plantation, machines.`,
    `[DONNÉES PERSONNELLES]\nDaniela Fontana\n1095 Lutry\n\n[ACCROCHE]\nJe recherche une place d’apprentissage d’assistante médicale. Je suis fiable et j’ai un bon contact avec les gens.\n\n[STAGES]\nClinique dentaire, centre de soins, pharmacie.`,
    `[DONNÉES PERSONNELLES]\nAndrea Seferovic\n2800 Delémont\n\n[ACCROCHE]\nObjectif : apprentissage de spécialiste en restauration. Attentive, aimable et sérieuse.\n\n[INTÉRÊTS]\nDanse hip-hop, natation, recherches Internet.`
  ];

  const structuredLetters = [
    {
      exp: "Julie Cordonier\nRue des Alpes 12\n1950 Sion",
      dest: "Garage du Centre\nResponsable RH\nRoute de la Gare 5\n1950 Sion",
      date: "Sion, le 9 juillet 2026",
      objet: "Objet : Candidature à une place d'apprentissage de mécanicienne en maintenance d'automobiles CFC",
      p1: "Je vous fais parvenir mon dossier de candidature afin de postuler pour la place d'apprentissage mentionnée ci-dessus.",
      p2: "Passionnée par la mécanique depuis mon enfance, j'ai eu l'opportunité d'effectuer un stage de trois jours dans un garage. Ce contact direct avec l'atelier a confirmé mon envie d'exercer ce métier technique.",
      p3: "Précise, motivée et investie, je serais ravie de vous rencontrer lors d'un entretien pour vous exposer mes motivations de vive voix.",
      sig: "Julie Cordonier"
    },
    {
      exp: "Daniela Fontana\nRoute du Lac 45\n1095 Lutry",
      dest: "Cabinet Médical des Vignes\nDr. M. Bernard\nGrand-Rue 2\n1009 Pully",
      date: "Lutry, le 9 juillet 2026",
      objet: "Objet : Candidature à une place d'apprentissage d'assistante médicale CFC",
      p1: "Actuellement en fin de scolarité obligatoire, je me permets de vous soumettre ma candidature pour l'apprentissage d'assistante médicale au sein de votre cabinet.",
      p2: "Le domaine de la santé m'attire particulièrement et j'apprécie beaucoup le contact humain. Un stage d'observation chez un pédiatre m'a permis de comprendre l'importance de l'accueil des patients et de la gestion administrative.",
      p3: "Souriante, organisée et dotée d'une grande écoute, j'espère que mon dossier retiendra votre attention pour un prochain stage ou entretien.",
      sig: "Daniela Fontana"
    }
  ];

  // Recharge le brouillon du profil actif sans mélanger les anciennes sauvegardes anonymes.
  onMount(() => {
    const activeName = getStudentName('');
    hasStudentProfile = !!activeName;
    studentName = activeName || 'Explorateur';

    try {
      const scope = studentStorageScope(activeName);
      const cvKey = hasStudentProfile ? `pcp_cv_v2:${scope}` : 'pcp_cv_v1';
      const letterKey = hasStudentProfile ? `pcp_letter_v2:${scope}` : 'pcp_letter_v1';
      const savedCv = localStorage.getItem(cvKey);
      const savedLetter = localStorage.getItem(letterKey);
      if (savedCv) cv = { ...cv, ...(JSON.parse(savedCv) as Partial<CvFields>) };
      if (savedLetter) letter = { ...letter, ...(JSON.parse(savedLetter) as Partial<LetterFields>) };

      // Les anciennes sauvegardes n'indiquent pas leur propriétaire : ne pas
      // les charger automatiquement dans le profil d'un élève.
      legacyDraftAvailable = hasStudentProfile
        && (localStorage.getItem('pcp_cv_v1') !== null || localStorage.getItem('pcp_letter_v1') !== null)
        && !savedCv && !savedLetter;
    } catch {
      storageMessage = 'Un brouillon local n’a pas pu être lu. Il reste enregistré sur cet appareil.';
    }
    
    setTimeout(() => {
      document.querySelectorAll('textarea').forEach(el => autoResize(el));
    }, 100);
  });

  function handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    autoResize(target);
    saveLetter();
    saveCv();
  }

  function autoResize(element: HTMLTextAreaElement | null) {
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  }

  // Les actions suivantes enregistrent localement, aident à rédiger ou exportent les documents.
  function saveCv() {
    try {
      const key = hasStudentProfile
        ? `pcp_cv_v2:${studentStorageScope(studentName)}`
        : 'pcp_cv_v1';
      localStorage.setItem(key, JSON.stringify(cv));
      storageMessage = '';
    } catch {
      storageMessage = 'La sauvegarde locale du CV est indisponible.';
    }
  }

  function saveLetter() {
    try {
      const key = hasStudentProfile
        ? `pcp_letter_v2:${studentStorageScope(studentName)}`
        : 'pcp_letter_v1';
      localStorage.setItem(key, JSON.stringify(letter));
      storageMessage = '';
    } catch {
      storageMessage = 'La sauvegarde locale de la lettre est indisponible.';
    }
  }

  function applySuggestion(text: string) {
    chatInput = text;
  }

  // Fonction appelée par les ampoules à gauche des paragraphes
  function askHelpForPart(partName: string) {
    letterTab = 'chatbot';
    chatInput = `Aide-moi à rédiger la partie [${partName}] de ma lettre.`;
    // Optionnel : dé-commenter la ligne ci-dessous si tu veux que ça s'envoie tout seul :
    // sendChatMessage();
  }

  function loadLetterExample(index: number) {
    activeLetterExample = index;
    const ex = structuredLetters[index];
    if(confirm("Veux-tu copier la structure de cet exemple dans ta zone de rédaction ? (Attention, ton texte actuel sera remplacé)")) {
      letter = { ...ex, appel: "Madame, Monsieur," };
      saveLetter();
      setTimeout(() => {
        document.querySelectorAll('.pcp-sheet textarea').forEach(el => autoResize(el as HTMLTextAreaElement));
      }, 50);
    }
  }

  async function sendChatMessage() {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    chatHistory = [...chatHistory, { role: 'user', content: userMessage }];
    chatInput = '';
    isChatLoading = true;

    const systemInstruction = `Tu es un conseiller en orientation suisse bienveillant et cool qui aide un élève nommé \${studentName}.
Consignes strictes :
1. Utilise TOUJOURS le tutoiement ("tu").
2. Parle un langage jeune, simple, accessible, mais propre. Pas de jargon d'adulte barbant.
3. Ne rédige JAMAIS la lettre entière d'un coup. Fais de courtes ébauches, donne des pistes. Laisse l'élève travailler.
4. Parle peu, sois très concis. Ne pose pas trop de questions pour ne pas décourager l'élève. Max 1 question à la fois.
5. Norme Suisse : Respecte le style courrier suisse (pas de mention de département français, vocabulaire suisse : place d'apprentissage, stage d'observation, de sélection, CFC).
6. Système d'analyse des erreurs : Si l'élève te soumet un texte avec des fautes, sépare TOUJOURS ta réponse en deux parties distinctes avec la balise [CORRECTION_CACHE] :
   - Partie 1 (Visible) : Indique gentiment les erreurs faites et rappelle brièvement la règle de grammaire/style de façon simple.
   - Partie 2 (Masquée) : Met le tag [CORRECTION_CACHE] suivi uniquement du texte corrigé que l'élève pourra révéler s'il clique sur l'ampoule.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage, 
          system: systemInstruction,
          history: chatHistory.slice(0, -1) 
        })
      });

      if (response.ok) {
        const data = await response.json();
        chatHistory = [...chatHistory, { role: 'assistant', content: data.response }];
        
        // Fait défiler le chat vers le bas automatiquement après la réponse
        setTimeout(() => {
          const chatContainer = document.querySelector('.chat-messages');
          if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 100);
      } else {
        chatHistory = [...chatHistory, { role: 'assistant', content: "❌ Impossible de joindre l'assistant. Vérifie qu'Ollama tourne bien en local." }];
      }
    } catch (e) {
      chatHistory = [...chatHistory, { role: 'assistant', content: "❌ Erreur de connexion avec le serveur local." }];
    } finally {
      isChatLoading = false;
    }
  }

  function exportToWord() {
    const content = `==================================================\n      LETTRE DE MOTIVATION (STYLE SUISSE)\n==================================================\n\nÉMETTEUR :\n\${letter.exp || 'Non renseigné'}\n\nDESTINATAIRE :\n\${letter.dest || 'Non renseigné'}\n\nLIEU ET DATE :\n\${letter.date || 'Non renseigné'}\n\nOBJET :\n\${letter.objet || 'Non renseigné'}\n\nAPPEL :\n\${letter.appel}\n\n[MOI] :\n\${letter.p1 || 'Non rédigé'}\n\n[VOUS] :\n\${letter.p2 || 'Non rédigé'}\n\n[NOUS] :\n\${letter.p3 || 'Non rédigé'}\n\nSIGNATURE :\n\${letter.sig || 'Non renseigné'}`;
    const blob = new Blob([content], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Lettre_Motivation_\${studentName.replace(/\\s+/g, '_')}.doc`;
    link.click();
  }

  async function markComplete(kind: 'CV' | 'Lettre de motivation') {
    const report = await recordGameActivity({
      studentName,
      gameId: 'pcp',
      activityId: kind,
      correctCount: 1,
      questionCount: 1,
      errorCount: 0,
      metadata: { completedAt: new Date().toISOString() }
    });
    completionMessage = report.message;
  }
</script>

<!-- L’accueil choisit entre CV et lettre ; les vues suivantes affichent l’éditeur correspondant. -->
<svelte:head>
  <title>Espace PCP / Orientation — Classe Numérique</title>
</svelte:head>

<div class="page">
  <header class="header" style="background: #1e3a8a; padding: 1rem; color: white;">
    <div class="header-inner" style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
      <div class="brand" style="display: flex; align-items: center; gap: 1rem;">
        <span class="brand-icon" style="font-size: 2rem;">💼</span>
        <div>
          <h1 class="brand-title" style="margin: 0; font-size: 1.25rem;">Espace PCP / Orientation</h1>
          <p class="brand-subtitle" style="margin: 0; font-size: 0.85rem; opacity: 0.8;">Dossier professionnel de {studentName}</p>
        </div>
      </div>
      <a class="btn ghost" href={catalogHref(base, 'jeux')} use:restoreCatalogReturn={base} style="color: white; border: 1px solid white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 0.25rem;">↩ Jeux</a>
    </div>
  </header>

  <main class="main stack" style="max-width: 1200px; margin: 0 auto; padding: 1rem;">
    {#if legacyDraftAvailable}
      <p class="legacy-save-warning" role="status">Une ancienne sauvegarde PCP non attribuée est encore présente sur cet appareil. Elle n’est pas chargée dans ce profil pour éviter de montrer le travail d’un autre élève ; son contenu n’a pas été effacé.</p>
    {/if}
    {#if storageMessage}<p class="legacy-save-warning" role="status">{storageMessage}</p>{/if}
    {#if screen === 'home'}
      <section class="card stack center" style="max-width: 48rem; margin: 3rem auto; text-align: center; background: #f8fafc; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <h2>Préparation au Choix Professionnel</h2>
        <p class="muted">Construis pas à pas tes documents de candidature professionnels.</p>
        <div class="grid world-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 2rem;">
          <button class="card stack center" type="button" on:click={() => (screen = 'cv')} style="padding: 2rem; cursor: pointer; border: 1px solid #cbd5e1; background: white; border-radius: 0.5rem;">
            <span style="font-size: 3rem;">📝</span><br/>
            <strong>Créer mon CV</strong>
            <p class="muted small">Rédige les bases de ton futur CV.</p>
          </button>
          <button class="card stack center" type="button" on:click={() => (screen = 'letter')} style="padding: 2rem; cursor: pointer; border: 1px solid #cbd5e1; background: white; border-radius: 0.5rem;">
            <span style="font-size: 3rem;">✉️</span><br/>
            <strong>Écrire ma Lettre de Motivation</strong>
            <p class="muted small">Bénéficie de l'aide d'un assistant IA personnalisé et de vrais modèles.</p>
          </button>
        </div>
      </section>

    {:else}
      <section class="stack" style="display: flex; flex-direction: column; gap: 1rem;">
        <div class="mission-top no-print" style="background: #1e293b; padding: 1rem; border-radius: 0.75rem; display: flex; justify-content: space-between; align-items: center; color: white;">
          <button class="btn secondary" type="button" on:click={() => (screen = 'home')} style="background: #475569; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.275rem; cursor: pointer;">⬅ Menu Principal</button>
          
          <div class="flex gap-2" style="display: flex; gap: 0.5rem;">
            <button class="btn ghost" type="button" on:click={() => letterSide = letterSide === 'left' ? 'right' : 'left'} style="background: transparent; color: white; border: 1px solid #475569; padding: 0.5rem 1rem; border-radius: 0.275rem; cursor: pointer;">
              🔄 Feuille à : {letterSide === 'left' ? 'Gauche' : 'Droite'}
            </button>
            <button class="btn good" type="button" on:click={() => window.print()} style="background: #10b981; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.275rem; cursor: pointer;">📥 Imprimer / PDF</button>
            <button class="btn word-btn" type="button" on:click={exportToWord} style="background: #2b579a; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.275rem; cursor: pointer; font-weight: bold;">💙 Exporter WORD (.doc)</button>
            <button class="btn primary" type="button" on:click={() => markComplete('Lettre de motivation')} style="background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.275rem; cursor: pointer;">✅ Soumettre au Maître</button>
          </div>
        </div>

        {#if completionMessage}<p class="feedback good no-print" style="background: #d1fae5; color: #065f46; padding: 0.75rem; border-radius: 0.375rem;">{completionMessage}</p>{/if}

        <div class="split" style="display: flex; gap: 1.5rem; flex-direction: {letterSide === 'left' ? 'row' : 'row-reverse'}; align-items: flex-start;">
          
          <!-- Ajout du min-width pour empêcher la feuille de se faire écraser -->
          <div class="pcp-sheet stack" style="flex: 1.2; min-width: 45%; background: #ffffff; color: #1e293b; padding: 2.5rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
            
            <textarea class="pcp-field-clean" style="width: 50%; font-family: sans-serif;" value={letter.exp} on:input={(e) => { letter.exp = e.currentTarget.value; handleInput(e); }} placeholder="Prénom Nom&#10;Adresse&#10;N° de Téléphone&#10;Email"></textarea>
            <textarea class="pcp-field-clean" style="width: 50%; margin-left: auto; font-family: sans-serif; margin-top: 1rem;" value={letter.dest} on:input={(e) => { letter.dest = e.currentTarget.value; handleInput(e); }} placeholder="Nom de l'entreprise&#10;À l'attention de M./Mme X&#10;Adresse de la boîte"></textarea>
            <textarea class="pcp-field-clean" style="text-align: right; margin-top: 1.5rem; font-family: sans-serif;" value={letter.date} on:input={(e) => { letter.date = e.currentTarget.value; handleInput(e); }} placeholder="Lieu, la date du jour"></textarea>
            <textarea class="pcp-field-clean" style="font-weight: bold; margin-top: 1rem; font-family: sans-serif;" value={letter.objet} on:input={(e) => { letter.objet = e.currentTarget.value; handleInput(e); }} placeholder="Objet : Candidature à une place d'apprentissage de..."></textarea>
            
            <input class="pcp-input-clean" style="margin-top: 1.5rem; font-family: sans-serif; border-bottom: 1px dashed #cbd5e1;" bind:value={letter.appel} on:input={saveLetter} placeholder="Madame, Monsieur," />
            
            <!-- PARAGRAPHE 1 [MOI] avec accolade et ampoule -->
            <div class="paragraph-wrapper" style="display: flex; gap: 0.75rem; align-items: stretch; margin-top: 1.5rem;">
              <div class="no-print" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 30px; flex-shrink: 0; opacity: 0.7; transition: opacity 0.2s;">
                <div style="flex: 1; width: 2px; background: #93c5fd; border-radius: 2px;"></div>
                <span style="font-size: 0.65rem; font-weight: bold; color: #3b82f6; margin: 0.25rem 0;">[MOI]</span>
                <div style="flex: 1; width: 2px; background: #93c5fd; border-radius: 2px;"></div>
                <button type="button" class="bulb-side-btn" on:click={() => askHelpForPart('MOI')} title="Besoin d'aide pour cette partie ?" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; margin-top: 0.25rem; transition: transform 0.1s;">💡</button>
              </div>
              <textarea class="pcp-field-clean paragraph-field" style="flex: 1;" value={letter.p1} on:input={(e) => { letter.p1 = e.currentTarget.value; handleInput(e); }} placeholder="Pourquoi j'écris ? Mon projet... (Ex: Actuellement en fin de scolarité obligatoire...)"></textarea>
            </div>

            <!-- PARAGRAPHE 2 [VOUS] avec accolade et ampoule -->
            <div class="paragraph-wrapper" style="display: flex; gap: 0.75rem; align-items: stretch; margin-top: 1rem;">
              <div class="no-print" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 30px; flex-shrink: 0; opacity: 0.7; transition: opacity 0.2s;">
                <div style="flex: 1; width: 2px; background: #93c5fd; border-radius: 2px;"></div>
                <span style="font-size: 0.65rem; font-weight: bold; color: #3b82f6; margin: 0.25rem 0;">[VOUS]</span>
                <div style="flex: 1; width: 2px; background: #93c5fd; border-radius: 2px;"></div>
                <button type="button" class="bulb-side-btn" on:click={() => askHelpForPart('VOUS')} title="Besoin d'aide pour cette partie ?" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; margin-top: 0.25rem; transition: transform 0.1s;">💡</button>
              </div>
              <textarea class="pcp-field-clean paragraph-field" style="flex: 1;" value={letter.p2} on:input={(e) => { letter.p2 = e.currentTarget.value; handleInput(e); }} placeholder="Pourquoi ce métier / cette entreprise ? (Parle de tes stages d'observation ou de sélection...)"></textarea>
            </div>

            <!-- PARAGRAPHE 3 [NOUS] avec accolade et ampoule -->
            <div class="paragraph-wrapper" style="display: flex; gap: 0.75rem; align-items: stretch; margin-top: 1rem;">
              <div class="no-print" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 30px; flex-shrink: 0; opacity: 0.7; transition: opacity 0.2s;">
                <div style="flex: 1; width: 2px; background: #93c5fd; border-radius: 2px;"></div>
                <span style="font-size: 0.65rem; font-weight: bold; color: #3b82f6; margin: 0.25rem 0; letter-spacing: -0.5px;">[NOUS]</span>
                <div style="flex: 1; width: 2px; background: #93c5fd; border-radius: 2px;"></div>
                <button type="button" class="bulb-side-btn" on:click={() => askHelpForPart('NOUS')} title="Besoin d'aide pour cette partie ?" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; margin-top: 0.25rem; transition: transform 0.1s;">💡</button>
              </div>
              <textarea class="pcp-field-clean paragraph-field" style="flex: 1;" value={letter.p3} on:input={(e) => { letter.p3 = e.currentTarget.value; handleInput(e); }} placeholder="Quelles sont tes forces ? (Ta ponctualité, ta motivation, demande de stage d'évaluation ou d'entretien...)"></textarea>
            </div>
            
            <textarea class="pcp-field-clean" style="width: 50%; margin-left: auto; margin-top: 2rem; text-align: right; font-family: sans-serif;" value={letter.sig} on:input={(e) => { letter.sig = e.currentTarget.value; handleInput(e); }} placeholder="Formule de salutation & Signature"></textarea>
          </div>

          <!-- Zone du Chatbot et des Ressources -->
          <div class="resource-panel no-print" style="flex: 1; display: flex; flex-direction: column; background: #0f172a; border-radius: 0.5rem; border: 1px solid #334155; overflow: hidden; min-height: 700px; height: auto;">
            
            <div class="tabs-header" style="display: flex; background: #1e293b; border-bottom: 1px solid #334155;">
              <button class="tab-btn" style="flex: 1; padding: 1rem; color: white; font-weight: bold; background: {letterTab === 'chatbot' ? '#0f172a' : 'transparent'}; border: none; cursor: pointer;" on:click={() => letterTab = 'chatbot'}>
                💬 Assistant IA
              </button>
              <button class="tab-btn" style="flex: 1; padding: 1rem; color: white; font-weight: bold; background: {letterTab === 'examples' ? '#0f172a' : 'transparent'}; border: none; cursor: pointer;" on:click={() => letterTab = 'examples'}>
                📋 Exemples Classiques
              </button>
            </div>

            <div class="tab-content" style="padding: 1.25rem; flex: 1; display: flex; flex-direction: column; gap: 1rem;">
              
              {#if letterTab === 'chatbot'}
                <div class="suggestions-box" style="background: #1e293b; padding: 0.75rem; border-radius: 0.375rem; border: 1px solid #475569; flex-shrink: 0;">
                  <span style="color: #38bdf8; font-size: 0.8rem; font-weight: bold; display: block; margin-bottom: 0.5rem;">💡 Idées de questions à poser à l'IA :</span>
                  <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                    {#each promptSuggestions as sug}
                      <button type="button" on:click={() => applySuggestion(sug)} style="text-align: left; background: #0f172a; color: #e2e8f0; border: 1px solid #334155; padding: 0.4rem; border-radius: 0.25rem; font-size: 0.75rem; cursor: pointer; transition: 0.2s;">
                        🌱 {sug}
                      </button>
                    {/each}
                  </div>
                </div>

                <div class="chat-container" style="display: flex; flex-direction: column; flex: 1; justify-content: space-between; min-height: 400px; overflow: hidden;">
                  
                  <!-- Ajout de overflow-y: auto et max-height pour éviter que ça ne pousse tout vers le bas -->
                  <div class="chat-messages" style="flex: 1; display: flex; flex-direction: column; gap: 0.75rem; padding-right: 0.5rem; overflow-y: auto; max-height: 480px;">
                    <div class="msg bot-msg" style="background: #1e293b; padding: 0.75rem 1rem; border-radius: 0.5rem; max-width: 85%; color: #e2e8f0; align-self: flex-start; font-size: 0.85rem;">
                      Salut {studentName} ! Clique sur une ampoule à côté de ton texte pour me demander de l'aide, ou pose-moi une question en bas ! 😉
                    </div>

                    {#each chatHistory as msg, idx}
                      <div class="msg-wrapper" style="display: flex; flex-direction: column; align-self: {msg.role === 'user' ? 'flex-end' : 'flex-start'}; max-width: 85%;">
                        <div class="msg {msg.role}-msg" style="padding: 0.75rem 1rem; border-radius: 0.5rem; line-height: 1.4; text-align: left; font-size: 0.85rem;
                          background: {msg.role === 'user' ? '#2563eb' : '#1e293b'}; color: white;">
                          
                          {#if msg.role === 'assistant' && msg.content.includes('[CORRECTION_CACHE]')}
                            {@const parts = msg.content.split('[CORRECTION_CACHE]')}
                            <div>{parts[0]}</div>
                            
                            <button type="button" class="bulb-btn" on:click={() => showCorrectionIndex = showCorrectionIndex === idx ? null : idx} style="margin-top: 0.5rem; background: #eab308; color: #0f172a; border: none; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; font-size: 0.75rem;">
                              💡 {showCorrectionIndex === idx ? 'Masquer la correction' : 'Voir la correction'}
                            </button>
                            
                            {#if showCorrectionIndex === idx}
                              <div class="correction-box" style="margin-top: 0.5rem; background: #0f172a; padding: 0.5rem; border-radius: 0.25rem; border-left: 3px solid #eab308; color: #facc15; font-family: monospace; font-size: 0.8rem; white-space: pre-wrap;">
                                {parts[1].trim()}
                              </div>
                            {/if}
                          {:else}
                            {msg.content}
                          {/if}
                        </div>
                      </div>
                    {/each}

                    {#if isChatLoading}
                      <div class="msg bot-msg" style="background: #1e293b; padding: 0.75rem 1rem; border-radius: 0.5rem; max-width: 80%; color: #94a3b8; align-self: flex-start; font-style: italic; font-size: 0.85rem;">
                        ⚡ Je réfléchis...
                      </div>
                    {/if}
                  </div>

                  <div class="chat-input-area" style="display: flex; gap: 0.5rem; margin-top: 1rem; flex-shrink: 0;">
                    <input type="text" bind:value={chatInput} on:keydown={(e) => e.key === 'Enter' && sendChatMessage()} placeholder="Pose ta question ici..." 
                           style="flex: 1; padding: 0.75rem; border-radius: 0.375rem; background: #1e293b; border: 1px solid #475569; color: white; font-size: 0.85rem;" />
                    <button class="btn primary" type="button" on:click={sendChatMessage} style="padding: 0.75rem 1.2rem; background: #2563eb; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">Envoyer</button>
                  </div>
                </div>

              {:else}
                <div class="examples-container stack" style="display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; max-height: 550px;">
                  <div class="flex gap-2" style="display: flex; gap: 0.5rem;">
                    <button class="btn secondary small" class:active={activeLetterExample === 0} type="button" on:click={() => loadLetterExample(0)}>Modèle 1 : Mécanique (Suisse)</button>
                    <button class="btn secondary small" class:active={activeLetterExample === 1} type="button" on:click={() => loadLetterExample(1)}>Modèle 2 : Médical (Suisse)</button>
                  </div>

                  {#if activeLetterExample !== null}
                    {@const ex = structuredLetters[activeLetterExample]}
                    <div class="visual-letter-mockup" style="background: white; color: #334155; padding: 1.5rem; border-radius: 0.375rem; font-size: 0.75rem; box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.06); font-family: monospace; line-height: 1.3;">
                      <div style="white-space: pre-line; color: #64748b;">{ex.exp}</div>
                      <div style="white-space: pre-line; margin-left: auto; width: 60%; text-align: left; margin-top: 0.5rem; color: #64748b;">{ex.dest}</div>
                      <div style="text-align: right; margin-top: 0.5rem; font-weight: bold;">{ex.date}</div>
                      <div style="font-weight: bold; margin-top: 0.5rem; border-bottom: 1px dashed #cbd5e1; padding-bottom: 0.25rem;">{ex.objet}</div>
                      <div style="margin-top: 0.5rem; font-style: italic;">Madame, Monsieur,</div>
                      <div style="margin-top: 0.5rem;">{ex.p1}</div>
                      <div style="margin-top: 0.5rem; background: #f8fafc; border-left: 2px solid #38bdf8; padding: 0.25rem;">{ex.p2}</div>
                      <div style="margin-top: 0.5rem;">{ex.p3}</div>
                      <div style="text-align: right; margin-top: 1rem; font-weight: bold; color: #64748b;">{ex.sig}</div>
                    </div>
                  {:else}
                    <p style="color: #94a3b8; text-align: center; margin-top: 3rem; font-size: 0.85rem;">Clique sur un modèle suisse pour t'en inspirer.</p>
                  {/if}
                </div>
              {/if}

            </div>
          </div>

        </div>
      </section>
    {/if}
  </main>
</div>

<style>
  .legacy-save-warning {
    margin: 0.75rem auto;
    max-width: 72rem;
    padding: 0.85rem 1rem;
    border: 2px solid #b45309;
    border-radius: 0.5rem;
    background: #fff7ed;
    color: #713f12;
    font-weight: 600;
  }

  .pcp-field-clean {
    display: block;
    width: 100%;
    background: transparent;
    border: 1px solid transparent;
    color: #1e293b;
    resize: none;
    font-size: 0.9rem;
    padding: 0.35rem;
    line-height: 1.5;
    overflow: hidden;
  }
  .pcp-field-clean:hover {
    border: 1px dotted #cbd5e1;
    background: #f8fafc;
  }
  .pcp-field-clean:focus {
    border: 1px solid #3b82f6;
    background: #fff;
    outline: none;
  }
  .pcp-input-clean {
    width: 100%;
    background: transparent;
    border: none;
    font-size: 0.9rem;
    font-weight: bold;
    color: #1e293b;
    padding: 0.25rem 0;
  }
  .paragraph-wrapper:hover > div {
    opacity: 1 !important; /* Rend l'accolade bien visible au survol */
  }
  .bulb-side-btn:hover {
    transform: scale(1.2) !important;
  }
  .paragraph-field {
    min-height: 4.5rem;
  }
  .tab-btn:hover {
    background: #1e293b !important;
  }
  .small {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
  .active {
    background: #2563eb !important;
    color: white !important;
  }
  .bulb-btn:hover {
    background: #facc15 !important;
  }
  
  /* Ajout d'une scrollbar discrète pour le chat */
  .chat-messages::-webkit-scrollbar {
    width: 6px;
  }
  .chat-messages::-webkit-scrollbar-thumb {
    background-color: #475569;
    border-radius: 4px;
  }

  @media print {
    .no-print {
      display: none !important;
    }
    .page {
      background: white !important;
      padding: 0 !important;
    }
    .pcp-sheet {
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      width: 100% !important;
    }
    .pcp-field-clean {
      border: none !important;
      background: transparent !important;
      height: auto !important;
    }
  }
</style>
