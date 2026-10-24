/** Types partagés par la banque de figures, le moteur et l'interface. */
export type Level = '6H' | '7H' | '8H';
export type PlayMode = 'A' | 'B' | 'C' | 'D';
export type Mode = PlayMode | 'Mixte';
export type QuestionType = 'single' | 'multiple';

/** Description plus précise que le simple nombre de côtés égaux. */
export type EqualSidePattern =
  | 'none'
  | 'all-different'
  | 'one-pair'
  | 'opposite-pairs'
  | 'adjacent-pairs'
  | 'all';

export type GeometryProperties = {
  /** Nombre de segments droits du contour ; undefined pour le cercle. */
  straightSides?: number;
  /** Vrais sommets de la figure. Le cercle n'en a aucun. */
  vertices?: number;
  /** Nombre d'angles droits pour les figures planes. */
  rightAngles?: number;
  /** Relations entre côtés, sans réduire tous les cas à un même nombre. */
  equalSidePattern?: EqualSidePattern;
  /** Nombre de paires de côtés parallèles. */
  parallelPairs?: number;
  /** Nombre d'axes ; Infinity représente une infinité d'axes. */
  symmetryAxes?: number;
  isConvex?: boolean;
  /** Propriétés des solides. */
  faces?: number;
  edges?: number;
  triangularFaces?: number;
  quadrilateralFaces?: number;
  faceShapes?: string[];
  allFacesSameShape?: boolean;
  baseShape?: string;
  curvedBoundary?: boolean;
};

export type GeometryFigure = {
  id: string;
  name: string;
  kind: 'plane' | 'solid';
  isTriangle: boolean;
  levels: Level[];
  definition: string;
  properties: GeometryProperties;
  /** SVG interne et statique : aucun texte saisi par l'élève n'est injecté ici. */
  svg: string;
};

export type QuestionOption = {
  id: string;
  label: string;
  figure?: GeometryFigure;
};

export type Question = {
  mode: PlayMode;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  correctIds: string[];
  explanation: string;
  /** Indices ordonnés du moins révélateur au plus explicite. */
  progressiveHints: string[];
  /** Nombre d'indices visibles au début (utile si plusieurs indices sont nécessaires). */
  initialHintCount?: number;
  /** Figure à observer pour le mode de classement 2D/3D, sans son nom. */
  focusFigure?: GeometryFigure;
  /** Critère de classification, utile au retour pédagogique et à l'analyse. */
  criterionId?: string;
  criterionLabel?: string;
};

export type ErrorFamily = {
  // Ces trois champs conservent le format déjà transmis par l'ancien jeu à ORBIS.
  target: string;
  answered: string;
  mode: PlayMode;
  // Informations supplémentaires utiles pour analyser l'erreur.
  questionText?: string;
  selectedLabels?: string[];
  expectedLabels?: string[];
  firstOrSecondAttempt?: 1 | 2;
};
