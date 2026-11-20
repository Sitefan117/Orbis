/** Catalogue, repères visuels et aides de Mesurovia. L'état de partie reste dans la page. */
import { base } from '$app/paths';
import { getConversionFamily } from './conversion-table';
import type { SessionMode } from './session-types';

export const gameCatalog: Array<{ mode: SessionMode; title: string; description: string; image: string; target: [string, string] }> = [
  { mode: 'practice', title: 'Le pupitre d’exercices', description: 'Des questions progressives sur les mesures travaillées dans la maison.', image: 'game-practice.png', target: ['fondations-mesure', 'reperes'] },
  { mode: 'battle', title: 'Bataille des unités', description: 'Choisis la bonne carte pour faire avancer ton personnage.', image: 'game-battle.png', target: ['fondations-mesure', 'longueurs'] },
  { mode: 'memory', title: 'Associe les mesures', description: 'Toutes les cartes sont visibles : retrouve les écritures équivalentes.', image: 'game-pairs.png', target: ['royaume-conversions', 'table-longueurs'] },
  { mode: 'race', title: 'Course au trésor', description: 'Résous les défis et atteins le coffre avant le renard.', image: 'game-race.png', target: ['royaume-conversions', 'table-capacites'] },
  { mode: 'table', title: 'Le Tableau magique', description: 'Place et lis les mesures dans le tableau de conversion.', image: 'game-table.png', target: ['royaume-conversions', 'table-longueurs'] },
  { mode: 'detective', title: 'Qui a raison ?', description: 'Quatre élèves répondent : vérifie les conversions et trouve la bonne proposition.', image: 'game-detective.png', target: ['missions-maitrise', 'enquetes'] },
  { mode: 'clock', title: 'Répare l’horloge', description: 'Travaille les secondes, minutes, heures, jours et semaines.', image: 'game-clock.png', target: ['royaume-conversions', 'table-durees'] },
  { mode: 'builder', title: 'Le chantier des formes', description: 'Construis avec les aires, les capacités et les volumes.', image: 'game-builder.png', target: ['volumes-capacites', 'paves'] }
];
const familyUnits = (id: string) => getConversionFamily(id).units.map((unit) => unit.alias ? `${unit.label}/${unit.alias}` : unit.label).join(' · ');
export const courseCatalog = [
  { id: 'length', title: 'Longueurs', units: familyUnits('length'), description: 'Mesurer, comparer puis convertir des longueurs.', image: 'course-length.png', target: ['royaume-conversions', 'table-longueurs'] },
  { id: 'mass', title: 'Masses', units: familyUnits('mass'), description: 'Peser, comparer et convertir les masses avec toutes les unités intermédiaires.', image: 'course-mass.png', target: ['royaume-conversions', 'table-masses'] },
  { id: 'capacity', title: 'Capacités', units: familyUnits('capacity'), description: 'Comparer des capacités et changer d’unité.', image: 'course-capacity.png', target: ['royaume-conversions', 'table-capacites'] },
  { id: 'duration', title: 'Durées', units: 'h · min · s puis j · semaine · mois · année', description: 'Calculer des durées avec les relations 60, 24 et 7.', image: 'course-duration.png', target: ['royaume-conversions', 'table-durees'] },
  { id: 'perimeter', title: 'Périmètres', units: 'mm · cm · dm · m · km', description: 'Distinguer le contour de la surface et calculer un périmètre.', image: 'course-length.png', target: ['aires-perimetres', 'contours'] },
  { id: 'area', title: 'Aires', units: familyUnits('area'), description: 'Mesurer une surface et comprendre les facteurs 100.', image: 'course-area.png', target: ['aires-perimetres', 'surfaces'] },
  { id: 'volume', title: 'Volumes et litres', units: familyUnits('volume'), description: 'Mesurer l’espace occupé et relier volume et capacité.', image: 'course-volume.png', target: ['volumes-capacites', 'litres'] }
];
export const avatars = ['hero-1', 'hero-2', 'hero-3', 'hero-4', 'hero-5', 'hero-6'];
const legacyAvatars = ['🧑‍🎒', '🧙🏽‍♀️', '🧑🏻‍🔬', '🧝🏾', '🧑🏼‍🚀', '🦊'];
export const avatarNames = ['Explorateur vert', 'Exploratrice bleue', 'Explorateur blond', 'Exploratrice rousse', 'Explorateur bleu', 'Exploratrice orange'];
export function avatarIndex(avatar?: string): number { const modern = avatars.indexOf(avatar ?? ''); return modern >= 0 ? modern : Math.max(0, legacyAvatars.indexOf(avatar ?? '')); }
export function avatarPosition(avatar?: string): number { return avatarIndex(avatar) * 20; }
export function courseTableExample(family = 'length') {
  if (family === 'mass') return { value: '2,4', from: 'kg', to: 'g' };
  if (family === 'capacity') return { value: '1,5', from: 'L', to: 'cL' };
  if (family === 'area') return { value: '2,4', from: 'm²', to: 'dm²' };
  if (family === 'volume') return { value: '1,2', from: 'dm³', to: 'cm³' };
  return { value: '2,4', from: 'm', to: 'cm' };
}
// Les cartes ont des positions propres pour garder portes et personnages cliquables.
export const buildingLayouts: Record<string, Array<{ x: number; y: number }>> = {
  'fondations-mesure': [{ x: 130, y: 72 }, { x: 375, y: 34 }, { x: 700, y: 68 }, { x: 815, y: 235 }],
  'royaume-conversions': [{ x: 110, y: 68 }, { x: 375, y: 34 }, { x: 690, y: 56 }, { x: 805, y: 222 }],
  'aires-perimetres': [{ x: 120, y: 82 }, { x: 405, y: 60 }, { x: 700, y: 72 }, { x: 815, y: 215 }],
  'volumes-capacites': [{ x: 120, y: 72 }, { x: 380, y: 36 }, { x: 695, y: 66 }, { x: 810, y: 228 }],
  'missions-maitrise': [{ x: 120, y: 78 }, { x: 660, y: 72 }, { x: 120, y: 330 }, { x: 680, y: 328 }]
};
export const residentsByVillage: Record<string, Array<{ x: number; y: number; label: string }>> = {
  'fondations-mesure': [{ x: 320, y: 195, label: 'Milo' }, { x: 620, y: 215, label: 'Lina' }, { x: 380, y: 450, label: 'Noé' }, { x: 810, y: 455, label: 'Papi' }],
  'royaume-conversions': [{ x: 315, y: 195, label: 'Aïna' }, { x: 745, y: 195, label: 'Théo' }, { x: 400, y: 435, label: 'Mira' }, { x: 805, y: 440, label: 'Robin' }],
  'aires-perimetres': [{ x: 315, y: 205, label: 'Rosa' }, { x: 700, y: 220, label: 'Jules' }, { x: 370, y: 440, label: 'Samir' }, { x: 790, y: 445, label: 'Zoé' }],
  'volumes-capacites': [{ x: 320, y: 195, label: 'Elio' }, { x: 690, y: 215, label: 'Ariane' }, { x: 400, y: 435, label: 'Yann' }, { x: 810, y: 430, label: 'Nora' }],
  'missions-maitrise': [{ x: 330, y: 205, label: 'Leïla' }, { x: 650, y: 225, label: 'Amir' }, { x: 400, y: 445, label: 'Lucie' }, { x: 780, y: 450, label: 'Sacha' }]
};
export const familyOrder = ['length', 'mass', 'capacity', 'duration', 'area', 'volume'];
export const villageArtwork: Record<string, string> = {
  'fondations-mesure': `${base}/images/mesurovia/village-hero.jpg`,
  'royaume-conversions': `${base}/images/mesurovia/regions/clairieres-compas.jpg`,
  'aires-perimetres': `${base}/images/mesurovia/regions/canaux-artisans.jpg`,
  'volumes-capacites': `${base}/images/mesurovia/regions/hautes-terres.jpg`,
  'missions-maitrise': `${base}/images/mesurovia/regions/missions-maitrise.png`
};
export const villageMapArtwork: Record<string, string> = {
  'fondations-mesure': `${base}/images/mesurovia/villages/sentiers-moulin-map.jpg`,
  'royaume-conversions': `${base}/images/mesurovia/villages/clairieres-compas-map.jpg`,
  'aires-perimetres': `${base}/images/mesurovia/villages/canaux-artisans-map.jpg`,
  'volumes-capacites': `${base}/images/mesurovia/villages/hautes-terres-map.jpg`,
  'missions-maitrise': `${base}/images/mesurovia/villages/missions-maitrise-map.png`
};
export const jokes = [
  'Pourquoi le mètre est-il toujours calme ? Parce qu’il garde ses distances.',
  'Pourquoi la règle ne raconte-t-elle jamais de mensonges ? Parce qu’elle est droite.',
  'Mon horloge a quitté son travail. Elle en avait assez de faire des heures supplémentaires.',
  'Pourquoi la balance est-elle une bonne amie ? Elle prend toujours les choses avec équilibre.',
  'J’ai voulu faire une blague sur les litres… mais elle était trop pleine.',
  'Mon ruban mesure tout. C’est quelqu’un qui voit grand, mais centimètre par centimètre.'
];

export const howToSlides = [
  { title: '1. Explore le village', text: 'Clique sur le sol : ton personnage court jusque-là. Clique sur une maison pour entrer. Tous les villages et toutes les maisons sont accessibles dans cette version.' },
  { title: '2. Suis les six étapes du cours', text: 'Chaque maison avance de l’explication à l’exemple, puis à la manipulation, la vérification, l’exercice autonome et aux critères de réussite.' },
  { title: '3. Entraîne-toi en jouant', text: 'Choisis un jeu : appariement de mesures, course au trésor, duel de cartes, enquête ou défi de construction. Tu peux toucher les éléments à l’écran ; le jeu t’aide sans chronomètre.' },
  { title: '4. Valide ton blason', text: 'L’épreuve comporte dix questions. Il faut au moins 8 réponses justes sur 10. En cas d’échec, révise et recommence : aucun point ni badge ne sera retiré.' }
];

