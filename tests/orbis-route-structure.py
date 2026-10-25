"""Contrôles structurels de la page Mesurovia V3 destinée à ORBIS/SvelteKit.
Ces vérifications complètent les tests du moteur : elles ne remplacent pas un test navigateur.
"""
from pathlib import Path

root = Path(__file__).parents[1]
route = root / 'src/routes/mesurovia/+page.svelte'
source = route.read_text(encoding='utf-8')
required = {
    'page V3': 'MESUROVIA V3',
    'menu créer personnage': 'Créer mon personnage',
    'reprise aventure': 'Reprendre l’aventure',
    'comment jouer': 'Comment jouer ?',
    'prétest sur écran d’accueil': 'Faire le bilan de départ',
    'quatre villages disponibles': 'RÉGION {i + 1} · OUVERTE',
    'déplacement point-and-click': 'function handleMapClick(event: MouseEvent)',
    'blagues PNJ': 'function chooseNpcJoke',
    'quatre étapes de théorie': 'PARTIE ${lessonIndex + 1} / ${lessons.length}',
    'question de validation': 'function submitSessionAnswer()',
    'jeu de duel animé': 'class="mini-game-stage battle-stage"',
    'barres de vie du duel': 'class="health-track enemy-health"',
    'animations du duel': '@keyframes v3-hero-strike',
    'tableau de conversion manipulable': 'class="conversion-table-card interactive-table-card"',
    'clavier numérique pour tablette': 'aria-label="Clavier numérique Mesurovia"',
    'associations cliquables': 'function selectMatchRight(id: string)',
    'classement par boutons': 'function moveOrderedItem(index: number, delta: number)',
    'réponses multiples': 'function toggleMultiOption(option: string)',
    'enquête dédiée': "startSession('detective')",
    'défi horloge dédié': "startSession('clock')",
    'chantier des formes dédié': "startSession('builder')",
    'générateur de formats variés': "const standardFormats = ['choice', 'number', 'unit', 'match', 'order', 'table', 'error', 'multi']",
    'stockage historique conservé': "const STORAGE_KEY = 'mesurovia-orbis-v2'",
    'export JSON': 'function exportSave()',
    'import JSON': 'function importSave(event: Event)',
    'pas de déplacement clavier': 'function handleMapClick(event: MouseEvent)',
    'options accessibilité': 'Texte plus grand',
    'lecture vocale facultative': 'function speakText(text: string)',
    'respect de la réduction d’animations': 'prefers-reduced-motion: reduce',
    'migration non destructive': "localStorage.getItem('mesurovia-rpg-v1')",
    'cahiers depuis le chemin de base': 'window.open(`${base}/cours/${fileMap[villageId]'
}
missing = [name for name, snippet in required.items() if snippet not in source]
assert not missing, f'Fonctions V3 manquantes dans +page.svelte : {missing}'
assert 'addEventListener("keydown"' not in source and "addEventListener('keydown'" not in source, 'Un écouteur de déplacement clavier ne doit pas être réintroduit.'
assert source.count('role="button"') >= 2, 'Les maisons et personnages doivent rester interactifs.'
assert "currentLesson?.explain || 'La mesure reste la même" not in source, 'Le corrigé de la leçon est affiché avant la question.'
assert "Exemple : ${currentLesson?.explain ?? ''}" not in source, 'La lecture vocale de la diapositive lit le corrigé trop tôt.'
print(f'Route ORBIS V3: OK — {len(required)} contrôles structurels, modes de jeu, animations, clavier intégré et sauvegarde conservée.')
