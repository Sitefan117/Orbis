/** Catalogue éditorial des cours ; les adresses physiques restent centralisées dans course-paths.ts. */
import { coursePaths } from './course-paths';

export interface CourseEntry {
  id: string;
  title: string;
  subject: string;       // ex: "Mathématiques", "Français", "Sciences"
  domain: string;        // ex: "Espace", "Nombres", "Conjugaison"
  description: string;
  level: string;         // ex: "8H", "9H", "10H"
  duration?: string;     // ex: "15 min"
  isInteractive: boolean;
  href: string;          // Chemin vers le fichier HTML/Svelte autonome
  gameLink?: {
    title: string;
    route: string;
  };
}

// Chaque entrée donne le titre, la matière, le chemin publié et, si utile, le jeu associé.
export const courses: CourseEntry[] = [
  {
    id: 'atelier-des-phrases',
    title: 'Grammaire — construire une phrase',
    subject: 'Français',
    domain: 'Grammaire',
    description: 'Un parcours Lego et Tetris en 14 niveaux : phrase, groupes, compléments, transformations et accords jusqu’à la 8H.',
    level: '2H–8H',
    duration: '14 niveaux',
    isInteractive: true,
    href: coursePaths.french.grammar,
    gameLink: { title: 'Jouer à l’Atelier des phrases', route: '/grammaire_lab' }
  },
  {
    id: 'mathracer-calcul-mental',
    title: 'MathRacer — livret complet',
    subject: 'Mathématiques',
    domain: 'Calcul mental',
    description: 'Un livret à faire en ligne ou à imprimer : théorie, exercices, validations et cinq évaluations de synthèse.',
    level: 'Jusqu’à la 8H',
    duration: '18 étapes',
    isInteractive: true,
    href: coursePaths.mentalMath.course,
    gameLink: { title: 'Jouer à MathRacer', route: '/race' }
  },
  {
    id: "fractions-complet",
    title: "Fractions — cours complet",
    subject: "Mathématiques",
    domain: "Fractions",
    description: "Un parcours progressif, du partage équitable aux opérations sur les fractions.",
    level: "Progressif",
    isInteractive: true,
    href: coursePaths.fractions.complete,
    gameLink: { title: "Fraction Tower", route: "/fractionstower2" }
  },
  {
    id: "fractions-etapes",
    title: "Fractions — cours par étapes",
    subject: "Mathématiques",
    domain: "Fractions",
    description: "Choisis une étape parmi les neuf notions, ou ouvre le cahier complet.",
    level: "Étapes 1 à 9",
    isInteractive: true,
    href: coursePaths.fractions.stages,
    gameLink: { title: "Fraction Tower", route: "/fractionstower2" }
  },
  {
    id: "mesures-reference",
    title: "Conversions de mesures — référence",
    subject: "Mathématiques",
    domain: "Mesures",
    description: "Repères sur les unités, les conversions, les durées, les aires et les volumes.",
    level: "Référence",
    isInteractive: true,
    href: coursePaths.measures.reference,
    gameLink: { title: "Mesurovia", route: "/mesurovia" }
  },
  {
    id: "mesurovia-fondations",
    title: "Mesurovia — Fondations de la mesure",
    subject: "Mathématiques",
    domain: "Mesurovia",
    description: "Grandeurs, unités adaptées, repères, longueurs et mesures réelles.",
    level: "Parcours 1",
    isInteractive: true,
    href: coursePaths.measures.mesurovia['fondations-mesure'],
    gameLink: { title: "Jouer à Mesurovia", route: "/mesurovia" }
  },
  {
    id: "mesurovia-conversions",
    title: "Mesurovia — Royaume des conversions",
    subject: "Mathématiques",
    domain: "Mesurovia",
    description: "Tableaux des longueurs, capacités et masses, puis durées non décimales.",
    level: "Parcours 2",
    isInteractive: true,
    href: coursePaths.measures.mesurovia['royaume-conversions'],
    gameLink: { title: "Jouer à Mesurovia", route: "/mesurovia" }
  },
  {
    id: "mesurovia-aires-perimetres",
    title: "Mesurovia — Cité des aires et périmètres",
    subject: "Mathématiques",
    domain: "Mesurovia",
    description: "Contours, surfaces, quadrillages, carrés et rectangles, sans angles.",
    level: "Parcours 3",
    isInteractive: true,
    href: coursePaths.measures.mesurovia['aires-perimetres'],
    gameLink: { title: "Jouer à Mesurovia", route: "/mesurovia" }
  },
  {
    id: "mesurovia-volumes-capacites",
    title: "Mesurovia — Ateliers des volumes",
    subject: "Mathématiques",
    domain: "Mesurovia",
    description: "Solides, unités cubiques, pavés droits et liens entre volumes et capacités.",
    level: "Parcours 4",
    isInteractive: true,
    href: coursePaths.measures.mesurovia['volumes-capacites'],
    gameLink: { title: "Jouer à Mesurovia", route: "/mesurovia" }
  },
  {
    id: "mesurovia-missions-maitrise",
    title: "Mesurovia — Expéditions de maîtrise",
    subject: "Mathématiques",
    domain: "Mesurovia",
    description: "Réinvestir masses, aires et durées dans des problèmes expliqués et contrôlés.",
    level: "Parcours 5",
    isInteractive: true,
    href: coursePaths.measures.mesurovia['missions-maitrise'],
    gameLink: { title: "Jouer à Mesurovia", route: "/mesurovia" }
  },
  {
    id: "carnet-geometrie",
    title: "Géométrie — carnet complet",
    subject: "Mathématiques",
    domain: "Espace",
    description: "Tracés de précision, compas, perpendiculaires, parallèles, recherche de points et figures usuelles.",
    level: "8H-10H",
    duration: "45 min",
    isInteractive: true,
    href: coursePaths.geometry.notebook,
    gameLink: {
      title: "Le Défi des Formes",
      route: "/geometrie"
    }
  },
  {
    id: "croquis-solides",
    title: "Construire un croquis de solide",
    subject: "Mathématiques",
    domain: "Espace",
    description: "Apprendre à représenter des solides en perspective cavalière et identifier faces, arêtes et sommets.",
    level: "8H",
    duration: "20 min",
    isInteractive: true,
    href: coursePaths.geometry.sketch,
    gameLink: {
      title: "Le Défi des Formes",
      route: "/geometrie"
    }
  }
];
