import type { GeometryFigure, GeometryProperties, Level } from './types';

/**
 * Banque de figures de NEXUS — Division Géométrie.
 * Les SVG et les définitions sont des données statiques contrôlées par le projet.
 * Les niveaux se chevauchent volontairement : ils représentent les niveaux où
 * une figure peut être travaillée, pas une exclusivité mathématique par degré.
 */
const sharedLevels: Level[] = ['6H', '7H', '8H'];
const extendedLevels: Level[] = ['7H', '8H'];
const advancedLevels: Level[] = ['8H'];

export const GEOMETRY_FIGURES: GeometryFigure[] = [
  {
    id: 'tri_scalene', name: 'Triangle scalène non rectangle', kind: 'plane', isTriangle: true,
    levels: sharedLevels,
    definition: 'Triangle dont les trois côtés ont des longueurs différentes et dont aucun angle n’est droit dans cet exemple. Un triangle scalène peut aussi être rectangle : les catégories décrivent des propriétés qui peuvent se croiser.',
    properties: { straightSides: 3, vertices: 3, rightAngles: 0, equalSidePattern: 'all-different', parallelPairs: 0, symmetryAxes: 0, isConvex: true },
    svg: '<polygon points="17,22 84,37 35,84" />'
  },
  {
    id: 'tri_rectangle', name: 'Triangle rectangle scalène', kind: 'plane', isTriangle: true,
    levels: sharedLevels,
    definition: 'Triangle qui possède un angle droit. Le dessin présenté est scalène ; un triangle rectangle peut aussi être isocèle.',
    properties: { straightSides: 3, vertices: 3, rightAngles: 1, equalSidePattern: 'all-different', parallelPairs: 0, symmetryAxes: 0, isConvex: true },
    svg: '<polygon points="19,17 19,83 84,83" /><path d="M19 68 L34 68 L34 83" fill="none" stroke-width="2.5" />'
  },
  {
    id: 'carre', name: 'Carré', kind: 'plane', isTriangle: false,
    levels: sharedLevels,
    definition: 'Quadrilatère avec quatre côtés égaux et quatre angles droits. Il possède quatre axes de symétrie.',
    properties: { straightSides: 4, vertices: 4, rightAngles: 4, equalSidePattern: 'all', parallelPairs: 2, symmetryAxes: 4, isConvex: true },
    svg: '<rect x="16" y="16" width="68" height="68" />'
  },
  {
    id: 'rectangle', name: 'Rectangle', kind: 'plane', isTriangle: false,
    levels: sharedLevels,
    definition: 'Quadrilatère avec quatre angles droits. Les côtés opposés sont égaux et parallèles.',
    properties: { straightSides: 4, vertices: 4, rightAngles: 4, equalSidePattern: 'opposite-pairs', parallelPairs: 2, symmetryAxes: 2, isConvex: true },
    svg: '<rect x="10" y="26" width="80" height="48" />'
  },
  {
    id: 'cercle', name: 'Cercle', kind: 'plane', isTriangle: false,
    levels: sharedLevels,
    definition: 'Contour courbe fermé dont chaque point est à la même distance du centre. Un cercle n’a ni côté droit ni sommet.',
    properties: { vertices: 0, rightAngles: 0, parallelPairs: 0, symmetryAxes: Infinity, isConvex: true, curvedBoundary: true },
    svg: '<circle cx="50" cy="50" r="36" />'
  },
  {
    id: 'cube', name: 'Cube', kind: 'solid', isTriangle: false,
    levels: sharedLevels,
    definition: 'Solide qui possède six faces carrées identiques, douze arêtes de même longueur et huit sommets.',
    properties: { vertices: 8, faces: 6, edges: 12, faceShapes: ['carré'], allFacesSameShape: true, quadrilateralFaces: 6, triangularFaces: 0, baseShape: 'carrée' },
    svg: '<polygon points="18,32 50,14 82,32 50,50" fill="currentColor" fill-opacity=".12"/><polygon points="18,32 50,50 50,86 18,68" fill="currentColor" fill-opacity=".05"/><polygon points="50,50 82,32 82,68 50,86" fill="currentColor" fill-opacity=".09"/><path d="M18 32 L50 14 L82 32 L82 68 L50 86 L18 68 Z M18 32 L50 50 L82 32 M50 50 L50 86" fill="none"/>'
  },
  {
    id: 'pave_droit', name: 'Pavé droit', kind: 'solid', isTriangle: false,
    levels: sharedLevels,
    definition: 'Solide qui possède six faces rectangulaires, douze arêtes et huit sommets. Les faces ne sont pas nécessairement toutes carrées.',
    properties: { vertices: 8, faces: 6, edges: 12, faceShapes: ['rectangle'], allFacesSameShape: false, quadrilateralFaces: 6, triangularFaces: 0, baseShape: 'rectangulaire' },
    svg: '<polygon points="12,35 59,20 88,34 41,50" fill="currentColor" fill-opacity=".12"/><polygon points="12,35 41,50 41,80 12,65" fill="currentColor" fill-opacity=".05"/><polygon points="41,50 88,34 88,64 41,80" fill="currentColor" fill-opacity=".09"/><path d="M12 35 L59 20 L88 34 L88 64 L41 80 L12 65 Z M12 35 L41 50 L88 34 M41 50 L41 80" fill="none"/>'
  },
  {
    id: 'tri_isocele', name: 'Triangle isocèle non rectangle', kind: 'plane', isTriangle: true,
    levels: advancedLevels,
    definition: 'Triangle qui possède exactement deux côtés de même longueur et un axe de symétrie. Il n’est pas rectangle dans cet exemple ; un triangle isocèle rectangle existe aussi. Le triangle équilatéral est traité séparément dans ce parcours.',
    properties: { straightSides: 3, vertices: 3, rightAngles: 0, equalSidePattern: 'one-pair', parallelPairs: 0, symmetryAxes: 1, isConvex: true },
    svg: '<polygon points="50,13 15,84 85,84" /><path d="M28 53 L36 57 M64 57 L72 53" fill="none" stroke-width="2.5" />'
  },
  {
    id: 'tri_equilateral', name: 'Triangle équilatéral', kind: 'plane', isTriangle: true,
    levels: advancedLevels,
    definition: 'Triangle dont les trois côtés sont de même longueur. Il possède trois axes de symétrie.',
    properties: { straightSides: 3, vertices: 3, rightAngles: 0, equalSidePattern: 'all', parallelPairs: 0, symmetryAxes: 3, isConvex: true },
    svg: '<polygon points="50,14 12,84 88,84" />'
  },
  {
    id: 'tri_isocele_rectangle', name: 'Triangle isocèle rectangle', kind: 'plane', isTriangle: true,
    levels: advancedLevels,
    definition: 'Triangle qui possède un angle droit et deux côtés de même longueur.',
    properties: { straightSides: 3, vertices: 3, rightAngles: 1, equalSidePattern: 'one-pair', parallelPairs: 0, symmetryAxes: 1, isConvex: true },
    svg: '<polygon points="20,20 20,84 84,84" /><path d="M20 69 L35 69 L35 84 M29 38 L29 46 M58 77 L66 77" fill="none" stroke-width="2.5" />'
  },
  {
    id: 'losange', name: 'Losange', kind: 'plane', isTriangle: false,
    levels: extendedLevels,
    definition: 'Quadrilatère dont les quatre côtés ont la même longueur. Les côtés opposés sont parallèles. Un carré est un cas particulier de losange.',
    properties: { straightSides: 4, vertices: 4, rightAngles: 0, equalSidePattern: 'all', parallelPairs: 2, symmetryAxes: 2, isConvex: true },
    svg: '<polygon points="50,10 88,50 50,90 12,50" />'
  },
  {
    id: 'parallelogramme', name: 'Parallélogramme quelconque', kind: 'plane', isTriangle: false,
    levels: extendedLevels,
    definition: 'Quadrilatère dont les côtés opposés sont parallèles. Ici, le dessin représente un parallélogramme qui n’est ni rectangle ni losange.',
    properties: { straightSides: 4, vertices: 4, rightAngles: 0, equalSidePattern: 'opposite-pairs', parallelPairs: 2, symmetryAxes: 0, isConvex: true },
    svg: '<polygon points="28,20 88,20 72,80 12,80" />'
  },
  {
    id: 'trapeze_quelconque', name: 'Trapèze quelconque', kind: 'plane', isTriangle: false,
    levels: extendedLevels,
    definition: 'Quadrilatère qui possède une paire de côtés opposés parallèles et qui n’est pas isocèle ni rectangle dans cet exemple. La définition du trapèze peut varier selon la convention scolaire.',
    properties: { straightSides: 4, vertices: 4, rightAngles: 0, equalSidePattern: 'none', parallelPairs: 1, symmetryAxes: 0, isConvex: true },
    svg: '<polygon points="28,25 72,25 90,82 10,82" />'
  },
  {
    id: 'cerf_volant', name: 'Cerf-volant', kind: 'plane', isTriangle: false,
    levels: extendedLevels,
    definition: 'Quadrilatère qui possède deux paires de côtés adjacents de même longueur. Dans cet exemple, il possède un axe de symétrie.',
    properties: { straightSides: 4, vertices: 4, rightAngles: 0, equalSidePattern: 'adjacent-pairs', parallelPairs: 0, symmetryAxes: 1, isConvex: true },
    svg: '<polygon points="50,10 85,39 50,90 15,39" /><path d="M50 10 L50 90 M31 29 L36 33 M64 33 L69 29 M31 48 L36 44 M64 44 L69 48" fill="none" stroke-width="2" stroke-dasharray="4 4" />'
  },
  {
    id: 'fer_de_lance', name: 'Fer de lance (concave)', kind: 'plane', isTriangle: false,
    levels: extendedLevels,
    definition: 'Quadrilatère non convexe : un de ses angles est rentrant. Cette forme est présentée comme exemple de figure concave.',
    properties: { straightSides: 4, vertices: 4, rightAngles: 0, equalSidePattern: 'none', parallelPairs: 0, symmetryAxes: 1, isConvex: false },
    svg: '<polygon points="50,10 90,88 50,64 10,88" />'
  },
  {
    id: 'trapeze_rectangle', name: 'Trapèze rectangle', kind: 'plane', isTriangle: false,
    levels: advancedLevels,
    definition: 'Trapèze qui possède deux angles droits.',
    properties: { straightSides: 4, vertices: 4, rightAngles: 2, equalSidePattern: 'none', parallelPairs: 1, symmetryAxes: 0, isConvex: true },
    svg: '<polygon points="20,24 72,24 88,82 20,82" /><path d="M20 39 L34 39 L34 24 M20 67 L35 67 L35 82" fill="none" stroke-width="2.5" />'
  },
  {
    id: 'trapeze_isocele', name: 'Trapèze isocèle', kind: 'plane', isTriangle: false,
    levels: advancedLevels,
    definition: 'Trapèze dont les côtés non parallèles sont de même longueur. Il possède un axe de symétrie.',
    properties: { straightSides: 4, vertices: 4, rightAngles: 0, equalSidePattern: 'one-pair', parallelPairs: 1, symmetryAxes: 1, isConvex: true },
    svg: '<polygon points="31,25 69,25 88,82 12,82" />'
  },
  {
    id: 'pyramide_carree', name: 'Pyramide à base carrée', kind: 'solid', isTriangle: false,
    levels: extendedLevels,
    definition: 'Solide avec une base carrée et quatre faces latérales triangulaires : cinq faces, huit arêtes et cinq sommets.',
    properties: { vertices: 5, faces: 5, edges: 8, faceShapes: ['carré', 'triangle'], allFacesSameShape: false, quadrilateralFaces: 1, triangularFaces: 4, baseShape: 'carrée' },
    svg: '<polygon points="50,12 15,68 50,86" fill="currentColor" fill-opacity=".10"/><polygon points="50,12 50,86 85,68" fill="currentColor" fill-opacity=".16"/><path d="M50 12 L15 68 L50 86 L85 68 Z M50 12 L50 86" fill="none"/><path d="M15 68 L85 68" stroke-dasharray="4 4" fill="none" />'
  },
  {
    id: 'tetraedre', name: 'Tétraèdre', kind: 'solid', isTriangle: false,
    levels: extendedLevels,
    definition: 'Pyramide à base triangulaire : quatre faces triangulaires, six arêtes et quatre sommets.',
    properties: { vertices: 4, faces: 4, edges: 6, faceShapes: ['triangle'], allFacesSameShape: true, quadrilateralFaces: 0, triangularFaces: 4, baseShape: 'triangulaire' },
    svg: '<polygon points="50,13 14,80 52,88" fill="currentColor" fill-opacity=".10"/><polygon points="50,13 52,88 86,70" fill="currentColor" fill-opacity=".16"/><path d="M50 13 L14 80 L52 88 L86 70 Z M50 13 L52 88" fill="none"/><path d="M14 80 L86 70" stroke-dasharray="4 4" fill="none" />'
  }
];

export function getFiguresForLevel(level: Level): GeometryFigure[] {
  return GEOMETRY_FIGURES.filter((figure) => figure.levels.includes(level));
}

/** Renvoie une phrase simple pour une propriété sans exposer le nom de la figure. */
export function describeProperties(properties: GeometryProperties, kind: GeometryFigure['kind']): string[] {
  const clues: string[] = [];
  if (kind === 'plane') {
    if (properties.curvedBoundary) clues.push('Mon contour est entièrement courbe.');
    else if (properties.straightSides !== undefined) clues.push(`Mon contour possède ${properties.straightSides} côtés droits.`);
    if (properties.vertices !== undefined) clues.push(`Je possède ${properties.vertices} sommet${properties.vertices > 1 ? 's' : ''}.`);
    if (properties.rightAngles !== undefined) {
      clues.push(properties.rightAngles === 0 ? 'Je ne possède aucun angle droit.' : `Je possède ${properties.rightAngles} angle${properties.rightAngles > 1 ? 's' : ''} droit${properties.rightAngles > 1 ? 's' : ''}.`);
    }
    switch (properties.equalSidePattern) {
      case 'all-different': clues.push('Tous mes côtés droits ont des longueurs différentes.'); break;
      case 'one-pair': clues.push('Je possède exactement un couple de côtés de même longueur dans cette catégorie.'); break;
      case 'opposite-pairs': clues.push('Mes côtés opposés sont égaux deux à deux.'); break;
      case 'adjacent-pairs': clues.push('Je possède deux couples de côtés voisins de même longueur.'); break;
      case 'all': clues.push('Tous mes côtés droits ont la même longueur.'); break;
      case 'none': clues.push('Je n’ai pas de côté égal à un autre côté dans ce dessin-type.'); break;
    }
    if (properties.parallelPairs !== undefined) {
      clues.push(properties.parallelPairs === 0 ? 'Je ne possède aucune paire de côtés parallèles.' : `Je possède ${properties.parallelPairs} paire${properties.parallelPairs > 1 ? 's' : ''} de côtés parallèles.`);
    }
    if (properties.symmetryAxes !== undefined) {
      clues.push(properties.symmetryAxes === Infinity ? 'Je possède une infinité d’axes de symétrie.' : properties.symmetryAxes === 0 ? 'Je ne possède aucun axe de symétrie.' : `Je possède ${properties.symmetryAxes} axe${properties.symmetryAxes > 1 ? 's' : ''} de symétrie.`);
    }
    if (properties.isConvex !== undefined) clues.push(properties.isConvex ? 'Je suis une figure convexe.' : 'Je suis une figure concave.');
  } else {
    if (properties.faces !== undefined) clues.push(`Je possède ${properties.faces} faces.`);
    if (properties.edges !== undefined) clues.push(`Je possède ${properties.edges} arêtes.`);
    if (properties.vertices !== undefined) clues.push(`Je possède ${properties.vertices} sommets.`);
    if (properties.baseShape) clues.push(`Ma base est ${properties.baseShape}.`);
    if (properties.allFacesSameShape === true && properties.faceShapes?.length) clues.push(`Toutes mes faces sont des ${properties.faceShapes[0]}${properties.faceShapes[0].endsWith('s') ? '' : 's'}.`);
    if (properties.allFacesSameShape === false && properties.faceShapes?.length) clues.push('Toutes mes faces ne sont pas de la même forme.');
  }
  return clues;
}
